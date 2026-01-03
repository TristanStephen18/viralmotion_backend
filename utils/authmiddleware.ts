import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config.ts";
import { isTokenBlacklisted } from "./tokens.ts";
import { db } from "../db/client.ts";
import { users } from "../db/schema.ts";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  user?: { 
    userId: number;
    email: string;
  };
}

// ✅ ENHANCED: Check token blacklist and account status
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for token in cookies first, then header
    let token = req.cookies?.accessToken;
    
    if (!token) {
      const authHeader = req.headers["authorization"];
      token = authHeader?.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // ✅ NEW: Check if token is blacklisted
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({ error: "Token has been revoked" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };

    // ✅ NEW: Check if user account is locked
    const [user] = await db
      .select({
        id: users.id,
        accountLocked: users.accountLocked,
        lockoutUntil: users.lockoutUntil,
      })
      .from(users)
      .where(eq(users.id, decoded.userId));

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // ✅ NEW: Check account lockout
    if (user.accountLocked) {
      if (user.lockoutUntil && new Date() < user.lockoutUntil) {
        return res.status(403).json({ 
          error: "Account is temporarily locked due to multiple failed login attempts",
          lockoutUntil: user.lockoutUntil 
        });
      } else {
        // Unlock account if lockout period expired
        await db
          .update(users)
          .set({ accountLocked: false, lockoutUntil: null })
          .where(eq(users.id, user.id));
      }
    }

    req.user = { userId: decoded.userId, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// ✅ NEW: Optional auth (doesn't fail if no token)
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = req.cookies?.accessToken;
    
    if (!token) {
      const authHeader = req.headers["authorization"];
      token = authHeader?.split(" ")[1];
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
      req.user = { userId: decoded.userId, email: decoded.email };
    }

    next();
  } catch {
    next(); // Continue without auth
  }
};

// ✅ NEW: Require 2FA verification
export const require2FA = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const [user] = await db
    .select({ twoFactorEnabled: users.twoFactorEnabled })
    .from(users)
    .where(eq(users.id, req.user.userId));

  if (user?.twoFactorEnabled && !req.headers["x-2fa-verified"]) {
    return res.status(403).json({ 
      error: "Two-factor authentication required",
      requires2FA: true 
    });
  }

  next();
};