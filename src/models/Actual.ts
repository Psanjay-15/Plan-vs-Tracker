import { model, Schema, Types } from "mongoose";

export interface IActual {
  userId: Types.ObjectId;
  categoryId: Types.ObjectId;
  month: string;
  amount: number;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const actualSchema = new Schema<IActual>(
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
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Amount must be an integer in minor currency units",
      },
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true },
);

actualSchema.index({ userId: 1, month: 1, categoryId: 1 });

const Actual = model<IActual>("Actual", actualSchema);

export default Actual;
