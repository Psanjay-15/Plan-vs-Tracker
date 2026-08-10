import Actual from "../models/Actual";
import Category from "../models/Category";
import PeriodLock from "../models/PeriodLock";
import Plan from "../models/Plan";
import { createActionToken, type AssistantActionType } from "../utils/actionToken";
import { isValidMonth } from "../utils/month";
import { majorToMinorUnits } from "../utils/money";
import { buildPlanVsActualReport } from "./report.service";
import { isMonthLocked } from "./periodLock.service";

export interface PendingAssistantAction {
  token: string;
  type: AssistantActionType;
  title: string;
  description: string;
  details: Record<string, string>;
}

const requireMonth = (value: unknown, field: string) => {
  if (!isValidMonth(value)) throw new Error(`${field} must use YYYY-MM format`);
  return value;
};

const requirePositiveMajorAmount = (value: unknown) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const amount = majorToMinorUnits(value);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error("Invalid amount");
  }

  return { major: value, minor: amount };
};

const requireNonNegativePlanAmount = (value: unknown) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error("Plan amount must be zero or greater");
  }

  const amount = majorToMinorUnits(value);
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error("Invalid plan amount");
  }

  return { major: value, minor: amount };
};

const requireCategoryName = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("A category name is required");
  }

  const name = value.trim();
  if (name.length > 60) {
    throw new Error("Category name cannot exceed 60 characters");
  }

  return name;
};

const findCategory = async (userId: string, name: unknown) => {
  const categoryName = requireCategoryName(name);
  const category = await Category.findOne({
    userId,
    normalizedName: categoryName.toLocaleLowerCase("en-US"),
  });

  if (!category) {
    const available = await Category.find({ userId }).select("name").sort({ name: 1 });
    throw new Error(
      `Category '${categoryName}' was not found. Available categories: ${available.map((item) => item.name).join(", ") || "none"}`,
    );
  }

  return category;
};

const formatMoneyLabel = (major: number) => major.toFixed(2);

export const runAssistantTool = async (
  userId: string,
  name: string,
  input: Record<string, unknown>,
): Promise<{ result: unknown; pendingAction?: PendingAssistantAction }> => {
  if (name === "list_categories") {
    const categories = await Category.find({ userId }).sort({ name: 1 }).lean();
    return {
      result: categories.map((category) => ({
        id: String(category._id),
        name: category.name,
      })),
    };
  }

  if (name === "list_plans") {
    const startMonth = requireMonth(input.startMonth, "startMonth");
    const endMonth = requireMonth(input.endMonth, "endMonth");
    if (startMonth > endMonth) throw new Error("startMonth cannot be after endMonth");

    const category = input.categoryName
      ? await findCategory(userId, input.categoryName)
      : null;

    const plans = await Plan.find({
      userId,
      month: { $gte: startMonth, $lte: endMonth },
      ...(category ? { categoryId: category._id } : {}),
    })
      .sort({ month: 1, createdAt: 1 })
      .lean();

    const categories = await Category.find({
      _id: { $in: plans.map((plan) => plan.categoryId) },
      userId,
    })
      .select("name")
      .lean();
    const names = new Map(categories.map((item) => [String(item._id), item.name]));

    return {
      result: plans.map((plan) => ({
        id: String(plan._id),
        categoryName: names.get(String(plan.categoryId)) ?? "Unknown category",
        month: plan.month,
        amount: plan.amount,
      })),
    };
  }

  if (name === "list_period_locks") {
    const locks = await PeriodLock.find({ userId }).sort({ month: -1 }).lean();
    return {
      result: locks.map((lock) => ({
        id: String(lock._id),
        month: lock.month,
        lockedAt: lock.lockedAt,
      })),
    };
  }

  if (name === "get_plan_vs_actual") {
    const startMonth = requireMonth(input.startMonth, "startMonth");
    const endMonth = requireMonth(input.endMonth, "endMonth");
    if (startMonth > endMonth) throw new Error("startMonth cannot be after endMonth");

    let categoryId: string | undefined;
    if (input.categoryName) {
      categoryId = String((await findCategory(userId, input.categoryName))._id);
    }

    return {
      result: await buildPlanVsActualReport({
        userId,
        startMonth,
        endMonth,
        ...(categoryId ? { categoryId } : {}),
      }),
    };
  }

  if (name === "list_actual_entries") {
    const startMonth = requireMonth(input.startMonth, "startMonth");
    const endMonth = requireMonth(input.endMonth, "endMonth");
    if (startMonth > endMonth) throw new Error("startMonth cannot be after endMonth");

    const category = input.categoryName
      ? await findCategory(userId, input.categoryName)
      : null;

    const entries = await Actual.find({
      userId,
      month: { $gte: startMonth, $lte: endMonth },
      ...(category ? { categoryId: category._id } : {}),
    })
      .sort({ month: -1, createdAt: -1 })
      .limit(100)
      .lean();

    const categories = await Category.find({
      _id: { $in: entries.map((entry) => entry.categoryId) },
      userId,
    })
      .select("name")
      .lean();
    const names = new Map(categories.map((item) => [String(item._id), item.name]));

    return {
      result: entries.map((entry) => ({
        id: String(entry._id),
        categoryName: names.get(String(entry.categoryId)) ?? "Unknown category",
        month: entry.month,
        amount: entry.amount,
        note: entry.note ?? "",
        createdAt: entry.createdAt,
      })),
    };
  }

  if (name === "propose_create_category") {
    const categoryName = requireCategoryName(input.name);
    const exists = await Category.exists({
      userId,
      normalizedName: categoryName.toLocaleLowerCase("en-US"),
    });
    if (exists) {
      throw new Error(`Category '${categoryName}' already exists`);
    }

    const token = createActionToken({
      type: "create_category",
      userId,
      name: categoryName,
    });

    return {
      result: { status: "confirmation_required" },
      pendingAction: {
        token,
        type: "create_category",
        title: "Confirm new category",
        description: `Create category "${categoryName}"`,
        details: { Category: categoryName },
      },
    };
  }

  if (name === "propose_rename_category") {
    const category = await findCategory(userId, input.currentName);
    const nextName = requireCategoryName(input.newName);

    if (category.name.toLocaleLowerCase("en-US") === nextName.toLocaleLowerCase("en-US")) {
      throw new Error("The new category name is the same as the current name");
    }

    const conflict = await Category.exists({
      userId,
      normalizedName: nextName.toLocaleLowerCase("en-US"),
      _id: { $ne: category._id },
    });
    if (conflict) {
      throw new Error(`Category '${nextName}' already exists`);
    }

    const token = createActionToken({
      type: "update_category",
      userId,
      categoryId: String(category._id),
      name: nextName,
      previousName: category.name,
    });

    return {
      result: { status: "confirmation_required" },
      pendingAction: {
        token,
        type: "update_category",
        title: "Confirm rename category",
        description: `Rename "${category.name}" to "${nextName}"`,
        details: {
          From: category.name,
          To: nextName,
        },
      },
    };
  }

  if (name === "propose_delete_category") {
    const category = await findCategory(userId, input.categoryName);
    const [usedByPlan, usedByActual] = await Promise.all([
      Plan.exists({ categoryId: category._id, userId }),
      Actual.exists({ categoryId: category._id, userId }),
    ]);

    if (usedByPlan || usedByActual) {
      throw new Error(
        `Category '${category.name}' cannot be deleted because it is used by a plan or actual entry`,
      );
    }

    const token = createActionToken({
      type: "delete_category",
      userId,
      categoryId: String(category._id),
      categoryName: category.name,
    });

    return {
      result: { status: "confirmation_required" },
      pendingAction: {
        token,
        type: "delete_category",
        title: "Confirm delete category",
        description: `Delete category "${category.name}"`,
        details: { Category: category.name },
      },
    };
  }

  if (name === "propose_plan") {
    const category = await findCategory(userId, input.categoryName);
    const month = requireMonth(input.month, "month");
    const { major, minor } = requireNonNegativePlanAmount(input.amount);

    if (await isMonthLocked(userId, month)) {
      throw new Error(`${month} is locked and cannot be modified`);
    }

    const existing = await Plan.findOne({
      userId,
      categoryId: category._id,
      month,
    });

    const token = createActionToken({
      type: "upsert_plan",
      userId,
      categoryId: String(category._id),
      categoryName: category.name,
      month,
      amount: minor,
      ...(existing ? { planId: String(existing._id) } : {}),
    });

    return {
      result: { status: "confirmation_required" },
      pendingAction: {
        token,
        type: "upsert_plan",
        title: existing ? "Confirm update plan" : "Confirm create plan",
        description: existing
          ? `Update ${category.name} plan for ${month} to ${formatMoneyLabel(major)}`
          : `Create ${category.name} plan for ${month} at ${formatMoneyLabel(major)}`,
        details: {
          Category: category.name,
          Month: month,
          Amount: formatMoneyLabel(major),
          Action: existing ? "Update existing plan" : "Create new plan",
        },
      },
    };
  }

  if (name === "propose_delete_plan") {
    const category = await findCategory(userId, input.categoryName);
    const month = requireMonth(input.month, "month");

    if (await isMonthLocked(userId, month)) {
      throw new Error(`${month} is locked and cannot be modified`);
    }

    const plan = await Plan.findOne({
      userId,
      categoryId: category._id,
      month,
    });

    if (!plan) {
      throw new Error(`No plan found for ${category.name} in ${month}`);
    }

    const token = createActionToken({
      type: "delete_plan",
      userId,
      planId: String(plan._id),
      categoryId: String(category._id),
      categoryName: category.name,
      month,
      amount: plan.amount,
    });

    return {
      result: { status: "confirmation_required" },
      pendingAction: {
        token,
        type: "delete_plan",
        title: "Confirm delete plan",
        description: `Delete ${category.name} plan for ${month}`,
        details: {
          Category: category.name,
          Month: month,
          Amount: formatMoneyLabel(plan.amount / 100),
        },
      },
    };
  }

  if (name === "propose_actual_entry") {
    const category = await findCategory(userId, input.categoryName);
    const month = requireMonth(input.month, "month");
    const { major, minor } = requirePositiveMajorAmount(input.amount);
    const note = typeof input.note === "string" ? input.note.trim() : "";
    if (note.length > 500) throw new Error("Note cannot exceed 500 characters");

    if (await isMonthLocked(userId, month)) {
      throw new Error(`${month} is locked and cannot be modified`);
    }

    const token = createActionToken({
      type: "create_actual",
      userId,
      categoryId: String(category._id),
      categoryName: category.name,
      month,
      amount: minor,
      ...(note ? { note } : {}),
    });

    return {
      result: { status: "confirmation_required" },
      pendingAction: {
        token,
        type: "create_actual",
        title: "Confirm actual entry",
        description: `Record ${formatMoneyLabel(major)} in ${category.name} for ${month}`,
        details: {
          Category: category.name,
          Month: month,
          Amount: formatMoneyLabel(major),
          ...(note ? { Note: note } : {}),
        },
      },
    };
  }

  if (name === "propose_update_actual") {
    if (typeof input.actualId !== "string" || !input.actualId.trim()) {
      throw new Error("actualId is required");
    }

    const actual = await Actual.findOne({
      _id: input.actualId,
      userId,
    });
    if (!actual) throw new Error("Actual entry not found");

    if (await isMonthLocked(userId, actual.month)) {
      throw new Error(`${actual.month} is locked and cannot be modified`);
    }

    const category = await Category.findOne({
      _id: actual.categoryId,
      userId,
    });
    if (!category) throw new Error("Category for this actual entry was not found");

    const nextAmount =
      input.amount === undefined
        ? { major: actual.amount / 100, minor: actual.amount }
        : requirePositiveMajorAmount(input.amount);

    const hasNote = Object.prototype.hasOwnProperty.call(input, "note");
    const note = hasNote
      ? typeof input.note === "string"
        ? input.note.trim()
        : ""
      : (actual.note ?? "");

    if (note.length > 500) throw new Error("Note cannot exceed 500 characters");

    const token = createActionToken({
      type: "update_actual",
      userId,
      actualId: String(actual._id),
      categoryId: String(category._id),
      categoryName: category.name,
      month: actual.month,
      amount: nextAmount.minor,
      ...(note ? { note } : {}),
    });

    return {
      result: { status: "confirmation_required" },
      pendingAction: {
        token,
        type: "update_actual",
        title: "Confirm update actual",
        description: `Update ${category.name} actual for ${actual.month}`,
        details: {
          Category: category.name,
          Month: actual.month,
          Amount: formatMoneyLabel(nextAmount.major),
          ...(note ? { Note: note } : { Note: "(cleared)" }),
        },
      },
    };
  }

  if (name === "propose_delete_actual") {
    if (typeof input.actualId !== "string" || !input.actualId.trim()) {
      throw new Error("actualId is required");
    }

    const actual = await Actual.findOne({
      _id: input.actualId,
      userId,
    });
    if (!actual) throw new Error("Actual entry not found");

    if (await isMonthLocked(userId, actual.month)) {
      throw new Error(`${actual.month} is locked and cannot be modified`);
    }

    const category = await Category.findOne({
      _id: actual.categoryId,
      userId,
    });

    const token = createActionToken({
      type: "delete_actual",
      userId,
      actualId: String(actual._id),
      categoryId: String(actual.categoryId),
      categoryName: category?.name ?? "Unknown category",
      month: actual.month,
      amount: actual.amount,
      ...(actual.note ? { note: actual.note } : {}),
    });

    return {
      result: { status: "confirmation_required" },
      pendingAction: {
        token,
        type: "delete_actual",
        title: "Confirm delete actual",
        description: `Delete ${category?.name ?? "category"} actual for ${actual.month}`,
        details: {
          Category: category?.name ?? "Unknown category",
          Month: actual.month,
          Amount: formatMoneyLabel(actual.amount / 100),
          ...(actual.note ? { Note: actual.note } : {}),
        },
      },
    };
  }

  if (name === "propose_lock_period") {
    const month = requireMonth(input.month, "month");
    const existing = await PeriodLock.exists({ userId, month });
    if (existing) {
      throw new Error(`${month} is already locked`);
    }

    const token = createActionToken({
      type: "lock_period",
      userId,
      month,
    });

    return {
      result: { status: "confirmation_required" },
      pendingAction: {
        token,
        type: "lock_period",
        title: "Confirm lock period",
        description: `Lock ${month}. Plans and actuals for that month will become read-only.`,
        details: {
          Month: month,
          Effect: "Plans and actuals become read-only",
        },
      },
    };
  }

  throw new Error("Unsupported assistant tool");
};
