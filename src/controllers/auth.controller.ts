import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import {
  DEFAULT_COUNTRY_CODE,
  getCountryCurrency,
  isValidCountryCode,
} from "../constants/currencies";
import Category from "../models/Category";
import User from "../models/User";
import { sendEmail } from "../services/mailer.service";
import {
  clearAuthCookie,
  createAuthToken,
  setAuthCookie,
} from "../utils/authToken";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_CATEGORIES = ["Marketing", "Payroll", "Tools"];
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

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

const validatePassword = (password: unknown) => {
  if (typeof password !== "string" || password.length < 8) {
    return "Password must contain at least 8 characters";
  }
  return null;
};

const hashResetToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

const getClientBaseUrl = () =>
  (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

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

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { currentPassword, newPassword } = req.body as Record<
      string,
      unknown
    >;

    if (typeof currentPassword !== "string" || !currentPassword) {
      res.status(400).json({
        success: false,
        message: "Current password is required",
      });
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      res.status(400).json({ success: false, message: passwordError });
      return;
    }

    if (currentPassword === newPassword) {
      res.status(400).json({
        success: false,
        message: "New password must be different from the current password",
      });
      return;
    }

    const user = await User.findById(req.userId).select("+password");
    if (!user) {
      clearAuthCookie(res);
      res.status(401).json({
        success: false,
        message: "User account no longer exists",
      });
      return;
    }

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
      return;
    }

    user.password = await bcrypt.hash(newPassword as string, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const token = createAuthToken(String(user._id));
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body as Record<string, unknown>;

    if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
      res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // Always return the same message to avoid email enumeration.
    const successMessage =
      "If an account exists for that email, a reset link has been sent.";

    if (!user) {
      res.status(200).json({ success: true, message: successMessage });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = hashResetToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();

    const resetUrl = `${getClientBaseUrl()}/reset-password?token=${resetToken}`;
    const sent = await sendEmail({
      to: user.email,
      subject: "Reset your Plan vs Actual password",
      text: [
        `Hi ${user.name},`,
        "",
        "We received a request to reset your password.",
        `Open this link to choose a new password (valid for 1 hour):`,
        resetUrl,
        "",
        "If you did not request this, you can ignore this email.",
      ].join("\n"),
      html: `
        <div style="font-family: Georgia, 'Times New Roman', serif; color: #1c1917; line-height: 1.5;">
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your Plan vs Actual password.</p>
          <p>
            <a href="${resetUrl}" style="color: #b94f27; font-weight: 700;">
              Choose a new password
            </a>
          </p>
          <p style="color: #78716c; font-size: 14px;">
            This link expires in 1 hour. If you did not request a reset, you can ignore this email.
          </p>
        </div>
      `,
    });

    if (!sent) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      res.status(503).json({
        success: false,
        message:
          "Unable to send reset email right now. Please try again later.",
      });
      return;
    }

    res.status(200).json({ success: true, message: successMessage });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token, newPassword } = req.body as Record<string, unknown>;

    if (typeof token !== "string" || !token.trim()) {
      res.status(400).json({
        success: false,
        message: "Reset token is required",
      });
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      res.status(400).json({ success: false, message: passwordError });
      return;
    }

    const hashedToken = hashResetToken(token.trim());
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select("+password +passwordResetToken +passwordResetExpires");

    if (!user) {
      res.status(400).json({
        success: false,
        message: "This reset link is invalid or has expired",
      });
      return;
    }

    user.password = await bcrypt.hash(newPassword as string, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const authToken = createAuthToken(String(user._id));
    setAuthCookie(res, authToken);

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
};
