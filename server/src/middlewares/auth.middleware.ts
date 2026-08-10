import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "../utils/authToken";

interface AuthPayload extends JwtPayload {
  userId: string;
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME] as string | undefined;

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  try {
    const payload = verifyAuthToken(token);

    if (typeof payload === "string" || !(payload as AuthPayload).userId) {
      throw new Error("Invalid token payload");
    }

    req.userId = (payload as AuthPayload).userId;
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};
