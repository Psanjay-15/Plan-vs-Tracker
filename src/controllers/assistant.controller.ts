import type { NextFunction, Request, Response } from "express";
import Actual from "../models/Actual";
import Category from "../models/Category";
import PeriodLock from "../models/PeriodLock";
import Plan from "../models/Plan";
import {
  askAssistant,
  type AssistantHistoryMessage,
} from "../services/assistant.service";
import { isMonthLocked } from "../services/periodLock.service";
import { verifyActionToken } from "../utils/actionToken";
import { formatMonth } from "../utils/month";

const validHistory = (value: unknown): value is AssistantHistoryMessage[] =>
  Array.isArray(value) &&
  value.length <= 20 &&
  value.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "role" in item &&
      (item.role === "user" || item.role === "assistant") &&
      "content" in item &&
      typeof item.content === "string" &&
      item.content.length <= 2000,
  );

const isDuplicateKeyError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: number }).code === 11000;

export const chat = async (req: Request, res: Response, next: NextFunction) => {
  const { message, history = [] } = req.body as Record<string, unknown>;

  if (
    typeof message !== "string" ||
    !message.trim() ||
    message.trim().length > 2000
  ) {
    res.status(400).json({
      success: false,
      message: "Message must be between 1 and 2000 characters",
    });
    return;
  }

  if (!validHistory(history)) {
    res.status(400).json({
      success: false,
      message: "Invalid conversation history",
    });
    return;
  }

  try {
    const result = await askAssistant(req.userId!, message.trim(), history);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const confirmAction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (typeof req.body?.token !== "string") {
    res.status(400).json({
      success: false,
      message: "Confirmation token is required",
    });
    return;
  }

  try {
    const action = verifyActionToken(req.body.token);

    if (action.userId !== req.userId) {
      res.status(403).json({
        success: false,
        message: "This action does not belong to you",
      });
      return;
    }

    switch (action.type) {
      case "create_category": {
        const category = await Category.create({
          userId: req.userId,
          name: action.name,
          normalizedName: action.name.toLocaleLowerCase("en-US"),
        });

        res.status(201).json({
          success: true,
          message: `Created category "${category.name}".`,
          category: {
            id: String(category._id),
            name: category.name,
          },
        });
        return;
      }

      case "update_category": {
        const category = await Category.findOne({
          _id: action.categoryId,
          userId: req.userId,
        });

        if (!category) {
          res.status(404).json({
            success: false,
            message: "Category no longer exists",
          });
          return;
        }

        category.name = action.name;
        await category.save();

        res.status(200).json({
          success: true,
          message: `Renamed category to "${category.name}".`,
          category: {
            id: String(category._id),
            name: category.name,
          },
        });
        return;
      }

      case "delete_category": {
        const category = await Category.findOne({
          _id: action.categoryId,
          userId: req.userId,
        });

        if (!category) {
          res.status(404).json({
            success: false,
            message: "Category no longer exists",
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
          message: `Deleted category "${action.categoryName}".`,
        });
        return;
      }

      case "upsert_plan": {
        if (await isMonthLocked(req.userId!, action.month)) {
          res.status(423).json({
            success: false,
            message: `${formatMonth(action.month)} is locked and cannot be modified`,
          });
          return;
        }

        const category = await Category.exists({
          _id: action.categoryId,
          userId: req.userId,
        });
        if (!category) {
          res.status(404).json({
            success: false,
            message: "Category no longer exists",
          });
          return;
        }

        if (action.planId) {
          const plan = await Plan.findOne({
            _id: action.planId,
            userId: req.userId,
          });

          if (!plan) {
            res.status(404).json({
              success: false,
              message: "Plan no longer exists",
            });
            return;
          }

          plan.amount = action.amount;
          await plan.save();

          res.status(200).json({
            success: true,
            message: `Updated ${action.categoryName} plan for ${action.month}.`,
            plan: {
              id: String(plan._id),
              categoryId: action.categoryId,
              month: plan.month,
              amount: plan.amount,
            },
          });
          return;
        }

        const plan = await Plan.create({
          userId: req.userId,
          categoryId: action.categoryId,
          month: action.month,
          amount: action.amount,
        });

        res.status(201).json({
          success: true,
          message: `Created ${action.categoryName} plan for ${action.month}.`,
          plan: {
            id: String(plan._id),
            categoryId: action.categoryId,
            month: plan.month,
            amount: plan.amount,
          },
        });
        return;
      }

      case "delete_plan": {
        if (await isMonthLocked(req.userId!, action.month)) {
          res.status(423).json({
            success: false,
            message: `${formatMonth(action.month)} is locked and cannot be modified`,
          });
          return;
        }

        const plan = await Plan.findOne({
          _id: action.planId,
          userId: req.userId,
        });

        if (!plan) {
          res.status(404).json({
            success: false,
            message: "Plan no longer exists",
          });
          return;
        }

        await plan.deleteOne();

        res.status(200).json({
          success: true,
          message: `Deleted ${action.categoryName} plan for ${action.month}.`,
        });
        return;
      }

      case "create_actual": {
        if (await isMonthLocked(req.userId!, action.month)) {
          res.status(423).json({
            success: false,
            message: `${formatMonth(action.month)} is locked and cannot be modified`,
          });
          return;
        }

        const category = await Category.exists({
          _id: action.categoryId,
          userId: req.userId,
        });
        if (!category) {
          res.status(404).json({
            success: false,
            message: "Category no longer exists",
          });
          return;
        }

        const actual = await Actual.create({
          userId: req.userId,
          categoryId: action.categoryId,
          month: action.month,
          amount: action.amount,
          ...(action.note ? { note: action.note } : {}),
        });

        res.status(201).json({
          success: true,
          message: `Recorded ${action.categoryName} spending successfully.`,
          actual: {
            id: String(actual._id),
            categoryId: action.categoryId,
            month: action.month,
            amount: action.amount,
            note: action.note ?? "",
          },
        });
        return;
      }

      case "update_actual": {
        if (await isMonthLocked(req.userId!, action.month)) {
          res.status(423).json({
            success: false,
            message: `${formatMonth(action.month)} is locked and cannot be modified`,
          });
          return;
        }

        const actual = await Actual.findOne({
          _id: action.actualId,
          userId: req.userId,
        });

        if (!actual) {
          res.status(404).json({
            success: false,
            message: "Actual entry no longer exists",
          });
          return;
        }

        actual.amount = action.amount;
        actual.note = action.note || undefined;
        await actual.save();

        res.status(200).json({
          success: true,
          message: `Updated ${action.categoryName} spending for ${action.month}.`,
          actual: {
            id: String(actual._id),
            categoryId: action.categoryId,
            month: actual.month,
            amount: actual.amount,
            note: actual.note ?? "",
          },
        });
        return;
      }

      case "delete_actual": {
        if (await isMonthLocked(req.userId!, action.month)) {
          res.status(423).json({
            success: false,
            message: `${formatMonth(action.month)} is locked and cannot be modified`,
          });
          return;
        }

        const actual = await Actual.findOne({
          _id: action.actualId,
          userId: req.userId,
        });

        if (!actual) {
          res.status(404).json({
            success: false,
            message: "Actual entry no longer exists",
          });
          return;
        }

        await actual.deleteOne();

        res.status(200).json({
          success: true,
          message: `Deleted ${action.categoryName} spending for ${action.month}.`,
        });
        return;
      }

      case "lock_period": {
        const existing = await PeriodLock.findOne({
          userId: req.userId,
          month: action.month,
        });

        if (existing) {
          res.status(200).json({
            success: true,
            message: `${formatMonth(action.month)} is already locked.`,
            lock: {
              id: String(existing._id),
              month: existing.month,
              lockedAt: existing.lockedAt,
            },
          });
          return;
        }

        const lock = await PeriodLock.create({
          userId: req.userId,
          month: action.month,
        });

        res.status(201).json({
          success: true,
          message: `Locked ${formatMonth(action.month)}.`,
          lock: {
            id: String(lock._id),
            month: lock.month,
            lockedAt: lock.lockedAt,
          },
        });
        return;
      }

      default: {
        res.status(400).json({
          success: false,
          message: "Unsupported confirmation action",
        });
      }
    }
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({
        success: false,
        message: "That change conflicts with existing data. Please ask again.",
      });
      return;
    }

    if (
      error instanceof Error &&
      /token|Expired|unsupported/i.test(error.message)
    ) {
      res.status(400).json({
        success: false,
        message: "This confirmation has expired. Please ask again.",
      });
      return;
    }

    next(error);
  }
};
