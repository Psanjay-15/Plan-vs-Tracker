import type { CookieOptions, Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";

export const AUTH_COOKIE_NAME = "auth_token";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing from the .env file");
  }

  return secret;
};

const getCookieOptions = (): CookieOptions => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
};

export const createAuthToken = (userId: string) => {
  const expiresIn = (process.env.JWT_EXPIRES_IN ||
    "7d") as SignOptions["expiresIn"];

  return jwt.sign({ userId }, getJwtSecret(), { expiresIn });
};

export const setAuthCookie = (res: Response, token: string) => {
  res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());
};

export const clearAuthCookie = (res: Response) => {
  const { maxAge: _maxAge, ...options } = getCookieOptions();
  res.clearCookie(AUTH_COOKIE_NAME, options);
};

export const verifyAuthToken = (token: string) =>
  jwt.verify(token, getJwtSecret());
