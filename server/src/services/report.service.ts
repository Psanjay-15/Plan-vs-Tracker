import { Types } from "mongoose";
import Actual from "../models/Actual";
import Category from "../models/Category";
import PeriodLock from "../models/PeriodLock";
import Plan from "../models/Plan";

interface ReportFilters {
  userId: string;
  startMonth: string;
  endMonth: string;
  categoryId?: string;
}

interface ActualAggregation {
  _id: {
    categoryId: Types.ObjectId;
    month: string;
  };
  actual: number;
  entryCount: number;
}

interface WorkingRow {
  categoryId: string;
  month: string;
  plan: number;
  actual: number;
  actualEntryCount: number;
}

const roundPercentage = (value: number) => Number(value.toFixed(2));

const calculateVariancePercentage = (variance: number, plan: number) =>
  plan === 0 ? null : roundPercentage((variance / plan) * 100);

export const buildPlanVsActualReport = async ({
  userId,
  startMonth,
  endMonth,
  categoryId,
}: ReportFilters) => {
  const objectUserId = new Types.ObjectId(userId);
  const objectCategoryId = categoryId
    ? new Types.ObjectId(categoryId)
    : undefined;

  const sharedMatch = {
    userId: objectUserId,
    month: { $gte: startMonth, $lte: endMonth },
    ...(objectCategoryId ? { categoryId: objectCategoryId } : {}),
  };

  const [plans, actualAggregations, locks] = await Promise.all([
    Plan.find(sharedMatch).lean(),
    Actual.aggregate<ActualAggregation>([
      { $match: sharedMatch },
      {
        $group: {
          _id: { categoryId: "$categoryId", month: "$month" },
          actual: { $sum: "$amount" },
          entryCount: { $sum: 1 },
        },
      },
    ]),
    PeriodLock.find({
      userId: objectUserId,
      month: { $gte: startMonth, $lte: endMonth },
    })
      .select("month")
      .lean(),
  ]);

  const rowsByKey = new Map<string, WorkingRow>();

  for (const plan of plans) {
    const category = String(plan.categoryId);
    const key = `${category}:${plan.month}`;
    rowsByKey.set(key, {
      categoryId: category,
      month: plan.month,
      plan: plan.amount,
      actual: 0,
      actualEntryCount: 0,
    });
  }

  for (const aggregation of actualAggregations) {
    const category = String(aggregation._id.categoryId);
    const key = `${category}:${aggregation._id.month}`;
    const existingRow = rowsByKey.get(key);

    if (existingRow) {
      existingRow.actual = aggregation.actual;
      existingRow.actualEntryCount = aggregation.entryCount;
    } else {
      rowsByKey.set(key, {
        categoryId: category,
        month: aggregation._id.month,
        plan: 0,
        actual: aggregation.actual,
        actualEntryCount: aggregation.entryCount,
      });
    }
  }

  const categoryIds = [...new Set([...rowsByKey.values()].map((row) => row.categoryId))];
  const categories = await Category.find({
    _id: { $in: categoryIds },
    userId: objectUserId,
  })
    .select("name")
    .lean();
  const categoryNames = new Map(
    categories.map((category) => [String(category._id), category.name]),
  );
  const lockedMonths = new Set(locks.map((lock) => lock.month));

  const rows = [...rowsByKey.values()]
    .map((row) => {
      const variance = row.actual - row.plan;

      return {
        categoryId: row.categoryId,
        categoryName: categoryNames.get(row.categoryId) ?? "Unknown category",
        month: row.month,
        plan: row.plan,
        actual: row.actual,
        variance,
        variancePercentage: calculateVariancePercentage(variance, row.plan),
        actualEntryCount: row.actualEntryCount,
        locked: lockedMonths.has(row.month),
      };
    })
    .sort(
      (first, second) =>
        first.categoryName.localeCompare(second.categoryName) ||
        first.month.localeCompare(second.month),
    );

  const monthlyTotalsByMonth = new Map<
    string,
    { month: string; plan: number; actual: number }
  >();

  for (const row of rows) {
    const monthlyTotal = monthlyTotalsByMonth.get(row.month) ?? {
      month: row.month,
      plan: 0,
      actual: 0,
    };
    monthlyTotal.plan += row.plan;
    monthlyTotal.actual += row.actual;
    monthlyTotalsByMonth.set(row.month, monthlyTotal);
  }

  const monthlyTotals = [...monthlyTotalsByMonth.values()]
    .map((total) => {
      const variance = total.actual - total.plan;
      return {
        ...total,
        variance,
        variancePercentage: calculateVariancePercentage(variance, total.plan),
        locked: lockedMonths.has(total.month),
      };
    })
    .sort((first, second) => first.month.localeCompare(second.month));

  const totalPlan = rows.reduce((sum, row) => sum + row.plan, 0);
  const totalActual = rows.reduce((sum, row) => sum + row.actual, 0);
  const totalVariance = totalActual - totalPlan;

  return {
    range: { startMonth, endMonth },
    summary: {
      totalPlan,
      totalActual,
      totalVariance,
      variancePercentage: calculateVariancePercentage(totalVariance, totalPlan),
    },
    rows,
    monthlyTotals,
  };
};
