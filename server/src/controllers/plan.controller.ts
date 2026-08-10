import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import Category from "../models/Category";
import Plan from "../models/Plan";
import { isMonthLocked } from "../services/periodLock.service";
import { formatMonth, isValidMonth } from "../utils/month";

const planResponse = (plan: {
  _id: unknown;
  categoryId: unknown;
  month: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: String(plan._id),
  categoryId: String(plan.categoryId),
  month: plan.month,
  amount: plan.amount,
  createdAt: plan.createdAt,
  updatedAt: plan.updatedAt,
});

const isDuplicateKeyError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: number }).code === 11000;

const validateAmount = (amount: unknown) => {
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 0) {
    return "Amount must be a non-negative integer in minor currency units";
  }

  return null;
};

export const createPlan = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { categoryId, month, amount } = req.body as Record<string, unknown>;

  if (typeof categoryId !== "string" || !Types.ObjectId.isValid(categoryId)) {
    res.status(400).json({ success: false, message: "Invalid category ID" });
    return;
  }

  if (!isValidMonth(month)) {
    res.status(400).json({
      success: false,
      message: "Month must use YYYY-MM format",
    });
    return;
  }

  const amountError = validateAmount(amount);
  if (amountError) {
    res.status(400).json({ success: false, message: amountError });
    return;
  }

  try {
    if (await isMonthLocked(req.userId!, month)) {
      res.status(423).json({
        success: false,
        message: `${formatMonth(month)} is locked and cannot be modified`,
      });
      return;
    }

    const categoryExists = await Category.exists({
      _id: categoryId,
      userId: req.userId,
    });

    if (!categoryExists) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    const plan = await Plan.create({
      userId: req.userId,
      categoryId,
      month,
      amount: amount as number,
    });

    res.status(201).json({
      success: true,
      message: "Plan created successfully",
      plan: planResponse(plan),
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({
        success: false,
        message: "A plan already exists for this category and month",
      });
      return;
    }

    next(error);
  }
};

export const listPlans = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { month, startMonth, endMonth, categoryId } = req.query;

    if (month !== undefined && !isValidMonth(month)) {
      res.status(400).json({
        success: false,
        message: "Month must use YYYY-MM format",
      });
      return;
    }

    if (startMonth !== undefined && !isValidMonth(startMonth)) {
      res.status(400).json({
        success: false,
        message: "startMonth must use YYYY-MM format",
      });
      return;
    }

    if (endMonth !== undefined && !isValidMonth(endMonth)) {
      res.status(400).json({
        success: false,
        message: "endMonth must use YYYY-MM format",
      });
      return;
    }

    if (startMonth && endMonth && startMonth > endMonth) {
      res.status(400).json({
        success: false,
        message: "startMonth cannot be after endMonth",
      });
      return;
    }

    if (
      categoryId !== undefined &&
      (typeof categoryId !== "string" || !Types.ObjectId.isValid(categoryId))
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
      return;
    }

    const query: {
      userId: string | undefined;
      month?: string | { $gte?: string; $lte?: string };
      categoryId?: string;
    } = { userId: req.userId };

    if (month) {
      query.month = month;
    } else if (startMonth || endMonth) {
      query.month = {
        ...(startMonth ? { $gte: startMonth } : {}),
        ...(endMonth ? { $lte: endMonth } : {}),
      };
    }

    if (categoryId) query.categoryId = categoryId;

    const plans = await Plan.find(query).sort({ month: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      plans: plans.map(planResponse),
    });
  } catch (error) {
    next(error);
  }
};

export const updatePlan = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { planId } = req.params;

  if (typeof planId !== "string" || !Types.ObjectId.isValid(planId)) {
    res.status(400).json({ success: false, message: "Invalid plan ID" });
    return;
  }

  const amountError = validateAmount(req.body?.amount);
  if (amountError) {
    res.status(400).json({ success: false, message: amountError });
    return;
  }

  try {
    const plan = await Plan.findOne({ _id: planId, userId: req.userId });

    if (!plan) {
      res.status(404).json({ success: false, message: "Plan not found" });
      return;
    }

    if (await isMonthLocked(req.userId!, plan.month)) {
      res.status(423).json({
        success: false,
        message: `${formatMonth(plan.month)} is locked and cannot be modified`,
      });
      return;
    }

    plan.amount = req.body.amount;
    await plan.save();

    res.status(200).json({
      success: true,
      message: "Plan updated successfully",
      plan: planResponse(plan),
    });
  } catch (error) {
    next(error);
  }
};

export const deletePlan = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { planId } = req.params;

  if (typeof planId !== "string" || !Types.ObjectId.isValid(planId)) {
    res.status(400).json({ success: false, message: "Invalid plan ID" });
    return;
  }

  try {
    const plan = await Plan.findOne({ _id: planId, userId: req.userId });

    if (!plan) {
      res.status(404).json({ success: false, message: "Plan not found" });
      return;
    }

    if (await isMonthLocked(req.userId!, plan.month)) {
      res.status(423).json({
        success: false,
        message: `${formatMonth(plan.month)} is locked and cannot be modified`,
      });
      return;
    }

    await plan.deleteOne();

    res.status(200).json({
      success: true,
      message: "Plan deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
