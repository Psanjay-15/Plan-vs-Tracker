import PeriodLock from "../models/PeriodLock";

export const isMonthLocked = async (userId: string, month: string) =>
  Boolean(await PeriodLock.exists({ userId, month }));
