import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import Actual from "../models/Actual";
import Category from "../models/Category";
import PeriodLock from "../models/PeriodLock";
import { isMonthLocked } from "../services/periodLock.service";
import { mapCsvHeaders, parseCsv, stringifyCsv } from "../utils/csv";
import { formatMonth, isValidMonth } from "../utils/month";
import { minorToMajorUnits, parseMajorAmount } from "../utils/money";

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

interface CsvImportError {
  row: number;
  message: string;
}

export const exportActualsCsv = async (
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

    const [actuals, categories] = await Promise.all([
      Actual.find(query).sort({ month: 1, createdAt: 1 }),
      Category.find({ userId: req.userId }).select("name"),
    ]);

    const categoryNames = new Map(
      categories.map((category) => [String(category._id), category.name]),
    );

    const csv = stringifyCsv([
      ["month", "category", "amount", "note"],
      ...actuals.map((actual) => [
        actual.month,
        categoryNames.get(String(actual.categoryId)) ?? "Unknown category",
        minorToMajorUnits(actual.amount).toFixed(2),
        actual.note ?? "",
      ]),
    ]);

    const filenameParts = ["actuals"];
    if (typeof month === "string") filenameParts.push(month);
    else {
      if (typeof startMonth === "string") filenameParts.push(startMonth);
      if (typeof endMonth === "string") filenameParts.push(endMonth);
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filenameParts.join("-")}.csv"`,
    );
    res.status(200).send(`${csv}\n`);
  } catch (error) {
    next(error);
  }
};

export const importActualsCsv = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const csv =
    typeof req.body?.csv === "string"
      ? req.body.csv
      : typeof req.body === "string"
        ? req.body
        : null;

  if (!csv || !csv.trim()) {
    res.status(400).json({
      success: false,
      message: "Provide CSV content in the request body",
    });
    return;
  }

  try {
    const rows = parseCsv(csv);

    if (rows.length === 0) {
      res.status(400).json({
        success: false,
        message: "CSV file is empty",
      });
      return;
    }

    const headerIndexes = mapCsvHeaders(rows[0]);
    const monthIndex = headerIndexes.month;
    const categoryIndex = headerIndexes.category;
    const amountIndex = headerIndexes.amount;
    const noteIndex = headerIndexes.note;

    if (
      monthIndex === undefined ||
      categoryIndex === undefined ||
      amountIndex === undefined
    ) {
      res.status(400).json({
        success: false,
        message:
          "CSV must include month, category, and amount columns (note is optional)",
      });
      return;
    }

    const dataRows = rows.slice(1);
    if (dataRows.length === 0) {
      res.status(400).json({
        success: false,
        message: "CSV has a header but no data rows",
      });
      return;
    }

    const [categories, locks] = await Promise.all([
      Category.find({ userId: req.userId }),
      PeriodLock.find({ userId: req.userId }).select("month"),
    ]);

    const categoriesByName = new Map(
      categories.map((category) => [
        category.name.toLocaleLowerCase("en-US"),
        category,
      ]),
    );
    const lockedMonths = new Set(locks.map((lock) => lock.month));

    const errors: CsvImportError[] = [];
    const documents: Array<{
      userId: string;
      categoryId: Types.ObjectId;
      month: string;
      amount: number;
      note?: string;
    }> = [];

    dataRows.forEach((row, index) => {
      const rowNumber = index + 2;
      const month = (row[monthIndex] ?? "").trim();
      const categoryName = (row[categoryIndex] ?? "").trim();
      const amountRaw = (row[amountIndex] ?? "").trim();
      const noteRaw =
        noteIndex === undefined ? "" : (row[noteIndex] ?? "").trim();

      if (!month && !categoryName && !amountRaw && !noteRaw) {
        return;
      }

      if (!isValidMonth(month)) {
        errors.push({
          row: rowNumber,
          message: "Month must use YYYY-MM format",
        });
        return;
      }

      if (!categoryName) {
        errors.push({
          row: rowNumber,
          message: "Category is required",
        });
        return;
      }

      const category = categoriesByName.get(
        categoryName.toLocaleLowerCase("en-US"),
      );

      if (!category) {
        errors.push({
          row: rowNumber,
          message: `Unknown category "${categoryName}"`,
        });
        return;
      }

      const amount = parseMajorAmount(amountRaw);
      if (amount === null) {
        errors.push({
          row: rowNumber,
          message: "Amount must be a number greater than zero with up to 2 decimals",
        });
        return;
      }

      if (noteRaw.length > 500) {
        errors.push({
          row: rowNumber,
          message: "Note cannot exceed 500 characters",
        });
        return;
      }

      if (lockedMonths.has(month)) {
        errors.push({
          row: rowNumber,
          message: `${formatMonth(month)} is locked and cannot be modified`,
        });
        return;
      }

      documents.push({
        userId: req.userId!,
        categoryId: category._id,
        month,
        amount,
        ...(noteRaw ? { note: noteRaw } : {}),
      });
    });

    if (documents.length === 0) {
      res.status(400).json({
        success: false,
        message: "No valid rows to import",
        imported: 0,
        failed: errors.length,
        errors,
      });
      return;
    }

    const created = await Actual.insertMany(documents, { ordered: false });

    res.status(errors.length > 0 ? 207 : 201).json({
      success: true,
      message:
        errors.length > 0
          ? `Imported ${created.length} row(s) with ${errors.length} error(s)`
          : `Imported ${created.length} actual entr${created.length === 1 ? "y" : "ies"}`,
      imported: created.length,
      failed: errors.length,
      errors,
      actuals: created.map(actualResponse),
    });
  } catch (error) {
    next(error);
  }
};
