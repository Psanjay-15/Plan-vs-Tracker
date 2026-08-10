import { model, Schema, Types } from "mongoose";

export interface IPeriodLock {
  userId: Types.ObjectId;
  month: string;
  lockedAt: Date;
}

const periodLockSchema = new Schema<IPeriodLock>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  month: {
    type: String,
    required: true,
    match: /^\d{4}-(0[1-9]|1[0-2])$/,
  },
  lockedAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

periodLockSchema.index({ userId: 1, month: 1 }, { unique: true });

const PeriodLock = model<IPeriodLock>("PeriodLock", periodLockSchema);

export default PeriodLock;
