import type { NextFunction, Request, Response } from "express";
import Actual from "../models/Actual";
import Category from "../models/Category";
import PeriodLock from "../models/PeriodLock";
import Plan from "../models/Plan";
import { askAssistant } from "../services/assistant.service";
import {
  appendChatMessage,
  createChatSession,
  deleteChatSession,
  getOwnedSession,
  getRecentHistory,
  listChatSessions,
  listSessionMessages,
  messageResponse,
  sessionResponse,
  titleFromMessage,
} from "../services/chat-session.service";
import { isMonthLocked } from "../services/periodLock.service";
import { verifyActionToken } from "../utils/actionToken";
import { formatMonth } from "../utils/month";

const isDuplicateKeyError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: number }).code === 11000;

export const listSessions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const sessions = await listChatSessions(req.userId!);
    res.status(200).json({
      success: true,
      sessions: sessions.map(sessionResponse),
    });
  } catch (error) {
    next(error);
  }
};

export const createSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const session = await createChatSession(req.userId!);
    res.status(201).json({
      success: true,
      session: sessionResponse(session),
    });
  } catch (error) {
    next(error);
  }
};

export const getSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const sessionId = String(req.params.sessionId);
    const session = await getOwnedSession(req.userId!, sessionId);
    if (!session) {
      res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
      return;
    }

    const messages = await listSessionMessages(String(session._id));
    res.status(200).json({
      success: true,
      session: sessionResponse(session),
      messages: messages.map(messageResponse),
    });
  } catch (error) {
    next(error);
  }
};

export const removeSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const deleted = await deleteChatSession(
      req.userId!,
      String(req.params.sessionId),
    );
    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const chat = async (req: Request, res: Response, next: NextFunction) => {
  const { message, sessionId } = req.body as Record<string, unknown>;

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

  if (
    sessionId !== undefined &&
    sessionId !== null &&
    typeof sessionId !== "string"
  ) {
    res.status(400).json({
      success: false,
      message: "Invalid session id",
    });
    return;
  }

  try {
    let session =
      typeof sessionId === "string" && sessionId
        ? await getOwnedSession(req.userId!, sessionId)
        : null;

    if (typeof sessionId === "string" && sessionId && !session) {
      res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
      return;
    }

    if (!session) {
      session = await createChatSession(
        req.userId!,
        titleFromMessage(message.trim()),
      );
    }

    const history = await getRecentHistory(String(session._id));
    const result = await askAssistant(req.userId!, message.trim(), history);
    const charts = "charts" in result ? result.charts : undefined;

    const userMessage = await appendChatMessage({
      sessionId: String(session._id),
      userId: req.userId!,
      role: "user",
      content: message.trim(),
    });

    const assistantMessage = await appendChatMessage({
      sessionId: String(session._id),
      userId: req.userId!,
      role: "assistant",
      content: result.message,
      charts,
    });

    if (session.title === "New chat") {
      session.title = titleFromMessage(message.trim());
    }

    session.lastMessageAt = assistantMessage.createdAt;
    await session.save();

    res.status(200).json({
      success: true,
      sessionId: String(session._id),
      session: sessionResponse(session),
      userMessage: messageResponse(userMessage),
      assistantMessage: messageResponse(assistantMessage),
      message: result.message,
      pendingAction: "pendingAction" in result ? result.pendingAction : undefined,
      charts,
    });
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

  const sessionId =
    typeof req.body?.sessionId === "string" ? req.body.sessionId : undefined;

  try {
    const action = verifyActionToken(req.body.token);

    if (action.userId !== req.userId) {
      res.status(403).json({
        success: false,
        message: "This action does not belong to you",
      });
      return;
    }

    const respond = async (
      status: number,
      payload: { success: true; message: string } & Record<string, unknown>,
    ) => {
      if (sessionId) {
        const session = await getOwnedSession(req.userId!, sessionId);
        if (session) {
          const assistantMessage = await appendChatMessage({
            sessionId,
            userId: req.userId!,
            role: "assistant",
            content: payload.message,
          });
          res.status(status).json({
            ...payload,
            sessionId,
            assistantMessage: messageResponse(assistantMessage),
          });
          return;
        }
      }

      res.status(status).json(payload);
    };

    switch (action.type) {
      case "create_category": {
        const category = await Category.create({
          userId: req.userId,
          name: action.name,
          normalizedName: action.name.toLocaleLowerCase("en-US"),
        });

        await respond(201, {
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

        await respond(200, {
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

        await respond(200, {
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

          await respond(200, {
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

        await respond(201, {
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

        await respond(200, {
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

        await respond(201, {
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

        await respond(200, {
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

        await respond(200, {
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
          await respond(200, {
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

        await respond(201, {
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
