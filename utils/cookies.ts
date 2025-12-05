import type { Response } from "express";
import { ACCESS_TOKEN_COOKIE, COOKIE_OPTIONS } from "../routes/database/config.ts";

export const setAccessTokenCookie = (res: Response, token: string) => {
  res.cookie("accessToken", token, ACCESS_TOKEN_COOKIE);
};

export const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie("refreshToken", token, COOKIE_OPTIONS);
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });
};