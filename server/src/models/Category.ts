import { model, Schema, Types } from "mongoose";

export interface ICategory {
  userId: Types.ObjectId;
  name: string;
  normalizedName: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    normalizedName: {
      type: String,
      required: true,
      select: false,
    },
  },
  { timestamps: true },
);

categorySchema.index({ userId: 1, normalizedName: 1 }, { unique: true });

categorySchema.pre("validate", function () {
  this.name = this.name.trim();
  this.normalizedName = this.name.toLocaleLowerCase("en-US");
});

const Category = model<ICategory>("Category", categorySchema);

export default Category;
