import { model, Schema, Types } from "mongoose";

export interface IPlan {
  userId: Types.ObjectId;
  categoryId: Types.ObjectId;
  month: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<IPlan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    month: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Amount must be an integer in minor currency units",
      },
    },
  },
  { timestamps: true },
);

planSchema.index({ userId: 1, categoryId: 1, month: 1 }, { unique: true });
planSchema.index({ userId: 1, month: 1 });

const Plan = model<IPlan>("Plan", planSchema);

export default Plan;
