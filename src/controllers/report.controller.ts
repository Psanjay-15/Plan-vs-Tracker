import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import Category from "../models/Category";
import { buildPlanVsActualReport } from "../services/report.service";
import { isValidMonth } from "../utils/month";

export const getPlanVsActualReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { startMonth, endMonth, categoryId } = req.query;

  if (!isValidMonth(startMonth) || !isValidMonth(endMonth)) {
    res.status(400).json({
      success: false,
      message: "startMonth and endMonth are required in YYYY-MM format",
    });
    return;
  }

  if (startMonth > endMonth) {
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

  try {
    if (categoryId) {
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
    }

    const report = await buildPlanVsActualReport({
      userId: req.userId!,
      startMonth,
      endMonth,
      ...(categoryId ? { categoryId } : {}),
    });

    res.status(200).json({
      success: true,
      rules: {
        missingActual: "treated_as_zero",
        zeroPlanVariancePercentage: null,
        percentagePrecision: 2,
        moneyUnit: "minor_unit",
      },
      ...report,
    });
  } catch (error) {
    next(error);
  }
};
