import type { NextFunction, Request, Response } from "express";
import PeriodLock from "../models/PeriodLock";
import { formatMonth, isValidMonth } from "../utils/month";

const lockResponse = (lock: {
  _id: unknown;
  month: string;
  lockedAt: Date;
}) => ({
  id: String(lock._id),
  month: lock.month,
  lockedAt: lock.lockedAt,
});

export const listPeriodLocks = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { startMonth, endMonth } = req.query;

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

    const monthFilter: { $gte?: string; $lte?: string } = {};
    if (startMonth) monthFilter.$gte = startMonth;
    if (endMonth) monthFilter.$lte = endMonth;

    const query = {
      userId: req.userId,
      ...(Object.keys(monthFilter).length ? { month: monthFilter } : {}),
    };
    const locks = await PeriodLock.find(query).sort({ month: 1 });

    res.status(200).json({
      success: true,
      locks: locks.map(lockResponse),
    });
  } catch (error) {
    next(error);
  }
};

export const lockPeriod = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { month } = req.params;

  if (!isValidMonth(month)) {
    res.status(400).json({
      success: false,
      message: "Month must use YYYY-MM format",
    });
    return;
  }

  try {
    const existingLock = await PeriodLock.findOne({
      userId: req.userId,
      month,
    });

    if (existingLock) {
      res.status(200).json({
        success: true,
        message: `${formatMonth(month)} is already locked`,
        lock: lockResponse(existingLock),
      });
      return;
    }

    const lock = await PeriodLock.create({ userId: req.userId, month });

    res.status(201).json({
      success: true,
      message: `${formatMonth(month)} locked successfully`,
      lock: lockResponse(lock),
    });
  } catch (error) {
    next(error);
  }
};
