import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import Actual from "../models/Actual";
import Category from "../models/Category";
import { isMonthLocked } from "../services/periodLock.service";
import { formatMonth, isValidMonth } from "../utils/month";

const actualResponse = (actual: {
  _id: unknown;
  categoryId: unknown;
  month: string;
  amount: number;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: String(actual._id),
  categoryId: String(actual.categoryId),
  month: actual.month,
  amount: actual.amount,
  note: actual.note ?? "",
  createdAt: actual.createdAt,
  updatedAt: actual.updatedAt,
});

const validateAmount = (amount: unknown) => {
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    return "Amount must be a positive integer in minor currency units";
  }

  return null;
};

const validateNote = (note: unknown) => {
  if (note !== undefined && typeof note !== "string") {
    return "Note must be text";
  }

  if (typeof note === "string" && note.trim().length > 500) {
    return "Note cannot exceed 500 characters";
  }

  return null;
};

export const createActual = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { categoryId, month, amount, note } = req.body as Record<
    string,
    unknown
  >;

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

  const noteError = validateNote(note);
  if (noteError) {
    res.status(400).json({ success: false, message: noteError });
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

    const actual = await Actual.create({
      userId: req.userId,
      categoryId,
      month,
      amount: amount as number,
      ...(typeof note === "string" && note.trim()
        ? { note: note.trim() }
        : {}),
    });

    res.status(201).json({
      success: true,
      message: "Actual entry created successfully",
      actual: actualResponse(actual),
    });
  } catch (error) {
    next(error);
  }
};

export const listActuals = async (
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

    const actuals = await Actual.find(query).sort({ month: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      actuals: actuals.map(actualResponse),
    });
  } catch (error) {
    next(error);
  }
};

export const updateActual = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { actualId } = req.params;

  if (typeof actualId !== "string" || !Types.ObjectId.isValid(actualId)) {
    res.status(400).json({ success: false, message: "Invalid actual entry ID" });
    return;
  }

  const hasAmount = Object.prototype.hasOwnProperty.call(req.body, "amount");
  const hasNote = Object.prototype.hasOwnProperty.call(req.body, "note");

  if (!hasAmount && !hasNote) {
    res.status(400).json({
      success: false,
      message: "Provide an amount or note to update",
    });
    return;
  }

  if (hasAmount) {
    const amountError = validateAmount(req.body.amount);
    if (amountError) {
      res.status(400).json({ success: false, message: amountError });
      return;
    }
  }

  if (hasNote) {
    const noteError = validateNote(req.body.note);
    if (noteError) {
      res.status(400).json({ success: false, message: noteError });
      return;
    }
  }

  try {
    const actual = await Actual.findOne({
      _id: actualId,
      userId: req.userId,
    });

    if (!actual) {
      res.status(404).json({
        success: false,
        message: "Actual entry not found",
      });
      return;
    }

    if (await isMonthLocked(req.userId!, actual.month)) {
      res.status(423).json({
        success: false,
        message: `${formatMonth(actual.month)} is locked and cannot be modified`,
      });
      return;
    }

    if (hasAmount) actual.amount = req.body.amount;
    if (hasNote) {
      const trimmedNote = req.body.note.trim();
      actual.note = trimmedNote || undefined;
    }

    await actual.save();

    res.status(200).json({
      success: true,
      message: "Actual entry updated successfully",
      actual: actualResponse(actual),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteActual = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { actualId } = req.params;

  if (typeof actualId !== "string" || !Types.ObjectId.isValid(actualId)) {
    res.status(400).json({ success: false, message: "Invalid actual entry ID" });
    return;
  }

  try {
    const actual = await Actual.findOne({
      _id: actualId,
      userId: req.userId,
    });

    if (!actual) {
      res.status(404).json({
        success: false,
        message: "Actual entry not found",
      });
      return;
    }

    if (await isMonthLocked(req.userId!, actual.month)) {
      res.status(423).json({
        success: false,
        message: `${formatMonth(actual.month)} is locked and cannot be modified`,
      });
      return;
    }

    await actual.deleteOne();

    res.status(200).json({
      success: true,
      message: "Actual entry deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
