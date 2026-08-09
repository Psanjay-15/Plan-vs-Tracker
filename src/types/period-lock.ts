export interface PeriodLock {
  id: string;
  month: string;
  lockedAt: string;
}

export interface PeriodLockListResponse {
  success: boolean;
  locks: PeriodLock[];
}

export interface PeriodLockResponse {
  success: boolean;
  message: string;
  lock: PeriodLock;
}
