import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import Actual from "../models/Actual";
import Category from "../models/Category";
import Plan from "../models/Plan";

const categoryResponse = (category: {
  _id: unknown;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: String(category._id),
  name: category.name,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
});

const isDuplicateKeyError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: number }).code === 11000;

const validateName = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) {
    return "Category name is required";
  }

  if (value.trim().length > 60) {
    return "Category name cannot exceed 60 characters";
  }

  return null;
};

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const nameError = validateName(req.body?.name);

  if (nameError) {
    res.status(400).json({ success: false, message: nameError });
    return;
  }

  try {
    const category = await Category.create({
      userId: req.userId,
      name: req.body.name.trim(),
      normalizedName: req.body.name.trim().toLocaleLowerCase("en-US"),
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category: categoryResponse(category),
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({
        success: false,
        message: "A category with this name already exists",
      });
      return;
    }

    next(error);
  }
};

export const listCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const categories = await Category.find({ userId: req.userId }).sort({
      name: 1,
    });

    res.status(200).json({
      success: true,
      categories: categories.map(categoryResponse),
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { categoryId } = req.params;

  if (typeof categoryId !== "string" || !Types.ObjectId.isValid(categoryId)) {
    res.status(400).json({
      success: false,
      message: "Invalid category ID",
    });
    return;
  }

  const nameError = validateName(req.body?.name);

  if (nameError) {
    res.status(400).json({ success: false, message: nameError });
    return;
  }

  try {
    const category = await Category.findOne({
      _id: categoryId,
      userId: req.userId,
    });

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    category.name = req.body.name.trim();
    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: categoryResponse(category),
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({
        success: false,
        message: "A category with this name already exists",
      });
      return;
    }

    next(error);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { categoryId } = req.params;

  if (typeof categoryId !== "string" || !Types.ObjectId.isValid(categoryId)) {
    res.status(400).json({
      success: false,
      message: "Invalid category ID",
    });
    return;
  }

  try {
    const category = await Category.findOne({
      _id: categoryId,
      userId: req.userId,
    });

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    const [usedByPlan, usedByActual] = await Promise.all([
      Plan.exists({ categoryId: category._id, userId: req.userId }),
      Actual.exists({ categoryId: category._id, userId: req.userId }),
    ]);

    if (usedByPlan || usedByActual) {
      res.status(409).json({
        success: false,
        message:
          "Category cannot be deleted because it is used by a plan or actual entry",
      });
      return;
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
