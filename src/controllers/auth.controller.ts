import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import User from "../models/User";
import {
  clearAuthCookie,
  createAuthToken,
  setAuthCookie,
} from "../utils/authToken";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicUser = (user: {
  _id: unknown;
  name: string;
  email: string;
  createdAt: Date;
}) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, email, password } = req.body as Record<string, unknown>;

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
    });

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
