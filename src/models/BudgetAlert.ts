import { model, Schema, Types } from "mongoose";

export type BudgetAlertLevel = "approaching" | "exceeded";

export interface IBudgetAlert {
  userId: Types.ObjectId;
  month: string;
  /** Category ObjectId string, or "__total__" for month-wide plan. */
  categoryKey: string;
  lastLevel: BudgetAlertLevel;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const budgetAlertSchema = new Schema<IBudgetAlert>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    month: {
      type: String,
      required: true,
    },
    categoryKey: {
      type: String,
      required: true,
    },
    lastLevel: {
      type: String,
      enum: ["approaching", "exceeded"],
      required: true,
    },
    sentAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true },
);

budgetAlertSchema.index(
  { userId: 1, month: 1, categoryKey: 1 },
  { unique: true },
);

const BudgetAlert = model<IBudgetAlert>("BudgetAlert", budgetAlertSchema);

export default BudgetAlert;
