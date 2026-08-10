import { Types } from "mongoose";
import Actual from "../models/Actual";
import BudgetAlert, { type BudgetAlertLevel } from "../models/BudgetAlert";
import Category from "../models/Category";
import Plan from "../models/Plan";
import User from "../models/User";
import { getCountryCurrency } from "../constants/currencies";
import { formatMonth } from "../utils/month";
import { minorToMajorUnits } from "../utils/money";
import { sendEmail } from "./mailer.service";

const MONTH_TOTAL_KEY = "__total__";

const levelRank: Record<BudgetAlertLevel, number> = {
  approaching: 1,
  exceeded: 2,
};

const getThresholdPct = () => {
  const raw = Number(process.env.BUDGET_ALERT_THRESHOLD_PCT || 80);
  if (!Number.isFinite(raw) || raw <= 0 || raw >= 100) return 80;
  return raw;
};

const formatMoney = (minorUnits: number, countryCode?: string) => {
  const currency = getCountryCurrency(countryCode);
  return new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minorToMajorUnits(minorUnits));
};

const resolveLevel = (
  plan: number,
  actual: number,
  thresholdPct: number,
): BudgetAlertLevel | null => {
  if (plan <= 0 || actual <= 0) return null;
  if (actual > plan) return "exceeded";
  if ((actual / plan) * 100 >= thresholdPct) return "approaching";
  return null;
};

const buildEmail = (input: {
  name: string;
  level: BudgetAlertLevel;
  label: string;
  month: string;
  plan: number;
  actual: number;
  countryCode?: string;
  thresholdPct: number;
}) => {
  const usedPct = Number(((input.actual / input.plan) * 100).toFixed(1));
  const planLabel = formatMoney(input.plan, input.countryCode);
  const actualLabel = formatMoney(input.actual, input.countryCode);
  const monthLabel = formatMonth(input.month);
  const isExceeded = input.level === "exceeded";

  const subject = isExceeded
    ? `Over plan: ${input.label} · ${monthLabel}`
    : `Approaching plan: ${input.label} · ${monthLabel}`;

  const headline = isExceeded
    ? `You've exceeded your plan for ${input.label}`
    : `You're getting close to your plan for ${input.label}`;

  const detail = isExceeded
    ? `Actual spending is now ${actualLabel} against a plan of ${planLabel} (${usedPct}% of plan).`
    : `Actual spending is now ${actualLabel} against a plan of ${planLabel} (${usedPct}% of plan). The alert threshold is ${input.thresholdPct}%.`;

  const text = [
    `Hi ${input.name},`,
    "",
    headline + ".",
    detail,
    "",
    `Month: ${monthLabel}`,
    "Open Plan vs Actual to review this category and adjust if needed.",
  ].join("\n");

  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; color: #1c1917; line-height: 1.5;">
      <p>Hi ${input.name},</p>
      <p><strong>${headline}.</strong></p>
      <p>${detail}</p>
      <table style="border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 6px 12px 6px 0; color: #78716c;">Month</td>
          <td style="padding: 6px 0;"><strong>${monthLabel}</strong></td>
        </tr>
        <tr>
          <td style="padding: 6px 12px 6px 0; color: #78716c;">Plan</td>
          <td style="padding: 6px 0;"><strong>${planLabel}</strong></td>
        </tr>
        <tr>
          <td style="padding: 6px 12px 6px 0; color: #78716c;">Actual</td>
          <td style="padding: 6px 0;"><strong>${actualLabel}</strong></td>
        </tr>
        <tr>
          <td style="padding: 6px 12px 6px 0; color: #78716c;">Usage</td>
          <td style="padding: 6px 0;"><strong>${usedPct}%</strong></td>
        </tr>
      </table>
      <p style="color: #78716c; font-size: 14px;">
        Open Plan vs Actual to review this ${isExceeded ? "overspend" : "category"} and adjust if needed.
      </p>
    </div>
  `;

  return { subject, text, html };
};

const maybeSendAlert = async (input: {
  userId: string;
  email: string;
  name: string;
  countryCode?: string;
  month: string;
  categoryKey: string;
  label: string;
  plan: number;
  actual: number;
  thresholdPct: number;
}) => {
  const level = resolveLevel(input.plan, input.actual, input.thresholdPct);

  if (!level) {
    await BudgetAlert.deleteOne({
      userId: input.userId,
      month: input.month,
      categoryKey: input.categoryKey,
    });
    return;
  }

  const existing = await BudgetAlert.findOne({
    userId: input.userId,
    month: input.month,
    categoryKey: input.categoryKey,
  });

  if (existing && levelRank[level] <= levelRank[existing.lastLevel]) {
    return;
  }

  const email = buildEmail({
    name: input.name,
    level,
    label: input.label,
    month: input.month,
    plan: input.plan,
    actual: input.actual,
    countryCode: input.countryCode,
    thresholdPct: input.thresholdPct,
  });

  const sent = await sendEmail({
    to: input.email,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });

  if (!sent) return;

  await BudgetAlert.findOneAndUpdate(
    {
      userId: input.userId,
      month: input.month,
      categoryKey: input.categoryKey,
    },
    {
      $set: {
        lastLevel: level,
        sentAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" },
  );
};

/**
 * Evaluate category and month-total plan usage after spending changes.
 * Safe to call fire-and-forget; failures are logged and never thrown to callers.
 */
export const evaluateBudgetAlerts = async (
  userId: string,
  month: string,
  categoryId?: string,
) => {
  try {
    const user = await User.findById(userId).select("name email countryCode");
    if (!user?.email) return;

    const thresholdPct = getThresholdPct();
    const objectUserId = new Types.ObjectId(userId);

    if (categoryId && Types.ObjectId.isValid(categoryId)) {
      const [plan, actualAgg, category] = await Promise.all([
        Plan.findOne({ userId: objectUserId, categoryId, month }).lean(),
        Actual.aggregate<{ total: number }>([
          {
            $match: {
              userId: objectUserId,
              categoryId: new Types.ObjectId(categoryId),
              month,
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Category.findOne({ _id: categoryId, userId: objectUserId })
          .select("name")
          .lean(),
      ]);

      if (plan && category) {
        await maybeSendAlert({
          userId,
          email: user.email,
          name: user.name,
          countryCode: user.countryCode,
          month,
          categoryKey: categoryId,
          label: category.name,
          plan: plan.amount,
          actual: actualAgg[0]?.total ?? 0,
          thresholdPct,
        });
      }
    }

    const [monthPlans, monthActuals] = await Promise.all([
      Plan.aggregate<{ total: number }>([
        { $match: { userId: objectUserId, month } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Actual.aggregate<{ total: number }>([
        { $match: { userId: objectUserId, month } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const monthPlan = monthPlans[0]?.total ?? 0;
    const monthActual = monthActuals[0]?.total ?? 0;

    if (monthPlan > 0) {
      await maybeSendAlert({
        userId,
        email: user.email,
        name: user.name,
        countryCode: user.countryCode,
        month,
        categoryKey: MONTH_TOTAL_KEY,
        label: "all categories",
        plan: monthPlan,
        actual: monthActual,
        thresholdPct,
      });
    }
  } catch (error) {
    console.error("[budget-alerts] Failed to evaluate alerts:", error);
  }
};

export const evaluateBudgetAlertsForPairs = async (
  userId: string,
  pairs: Array<{ month: string; categoryId: string }>,
) => {
  const unique = new Map<string, { month: string; categoryId: string }>();
  for (const pair of pairs) {
    unique.set(`${pair.categoryId}:${pair.month}`, pair);
  }

  for (const pair of unique.values()) {
    await evaluateBudgetAlerts(userId, pair.month, pair.categoryId);
  }
};
