import type {
  PeriodLock,
  PeriodLockListResponse,
  PeriodLockResponse,
} from "../types/period-lock";
import { api } from "./api";

export const periodLockService = {
  async getAll(): Promise<PeriodLock[]> {
    const { data } = await api.get<PeriodLockListResponse>("/period-locks");
    return data.locks;
  },

  async lock(month: string): Promise<PeriodLock> {
    const { data } = await api.post<PeriodLockResponse>(
      `/period-locks/${month}`,
    );
    return data.lock;
  },
};
