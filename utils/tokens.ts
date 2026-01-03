import jwt from "jsonwebtoken";
import { db } from "../db/client.ts";
import { refreshTokens, blacklistedTokens } from "../db/schema.ts";
import { eq, lt } from "drizzle-orm";
import {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
} from "../../config.ts";

export interface TokenPayload {
  userId: number;
  email: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch {
    return null;
  }
};

export const storeRefreshToken = async (
  userId: number,
  token: string,
  ipAddress: string,
  userAgent: string
) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await db.insert(refreshTokens).values({ userId, token, expiresAt, ipAddress, userAgent });
};

export const revokeRefreshToken = async (token: string) => {
  await db
    .update(refreshTokens)
    .set({ revoked: true, revokedAt: new Date() })
    .where(eq(refreshTokens.token, token));
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const [result] = await db
    .select()
    .from(blacklistedTokens)
    .where(eq(blacklistedTokens.token, token));
  return !!result;
};

export const blacklistToken = async (token: string, expiresAt: Date) => {
  await db.insert(blacklistedTokens).values({ token, expiresAt });
};

export const cleanupExpiredTokens = async () => {
  const now = new Date();
  await db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, now));
  await db.delete(blacklistedTokens).where(lt(blacklistedTokens.expiresAt, now));
};