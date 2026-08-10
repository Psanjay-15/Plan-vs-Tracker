import { model, Schema } from "mongoose";
import {
  DEFAULT_COUNTRY_CODE,
  isValidCountryCode,
} from "../constants/currencies";

export interface IUser {
  name: string;
  email: string;
  password: string;
  countryCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    countryCode: {
      type: String,
      required: true,
      default: DEFAULT_COUNTRY_CODE,
      uppercase: true,
      validate: {
        validator: isValidCountryCode,
        message: "Unsupported country selection",
      },
    },
  },
  { timestamps: true },
);

const User = model<IUser>("User", userSchema);

export default User;
