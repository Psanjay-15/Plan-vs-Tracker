import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import {
  DEFAULT_COUNTRY_CODE,
  getCountryCurrency,
  isValidCountryCode,
} from "../constants/currencies";
import Category from "../models/Category";
import User from "../models/User";
import {
  clearAuthCookie,
  createAuthToken,
  setAuthCookie,
} from "../utils/authToken";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_CATEGORIES = ["Marketing", "Payroll", "Tools"];

const publicUser = (user: {
  _id: unknown;
  name: string;
  email: string;
  countryCode?: string;
  createdAt: Date;
}) => {
  const country = getCountryCurrency(user.countryCode);

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    countryCode: country.code,
    currency: country.currency,
    currencyName: country.currencyName,
    locale: country.locale,
    createdAt: user.createdAt,
  };
};

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, email, password, countryCode } = req.body as Record<
      string,
      unknown
    >;

    if (typeof name !== "string" || name.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: "Name must contain at least 2 characters",
      });
      return;
    }

    if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
      res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
      return;
    }

    if (typeof password !== "string" || password.length < 8) {
      res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters",
      });
      return;
    }

    const selectedCountryCode =
      countryCode === undefined || countryCode === null || countryCode === ""
        ? DEFAULT_COUNTRY_CODE
        : countryCode;

    if (!isValidCountryCode(selectedCountryCode)) {
      res.status(400).json({
        success: false,
        message: "Select a supported country",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.exists({ email: normalizedEmail });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      countryCode: selectedCountryCode,
    });

    try {
      await Category.insertMany(
        DEFAULT_CATEGORIES.map((categoryName) => ({
          userId: user._id,
          name: categoryName,
          normalizedName: categoryName.toLocaleLowerCase("en-US"),
        })),
      );
    } catch (error) {
      await User.findByIdAndDelete(user._id);
      throw error;
    }

    const token = createAuthToken(String(user._id));
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body as Record<string, unknown>;

    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const token = createAuthToken(String(user._id));
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (_req: Request, res: Response) => {
  clearAuthCookie(res);
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      clearAuthCookie(res);
      res.status(401).json({
        success: false,
        message: "User account no longer exists",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { countryCode } = req.body as Record<string, unknown>;

    if (!isValidCountryCode(countryCode)) {
      res.status(400).json({
        success: false,
        message: "Select a supported country",
      });
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { countryCode },
      { new: true, runValidators: true },
    );

    if (!user) {
      clearAuthCookie(res);
      res.status(401).json({
        success: false,
        message: "User account no longer exists",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Preferences updated successfully",
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
};
