import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db/client.ts";
import { adminUsers, blacklistedTokens } from "../db/schema.ts";
import { eq, gte } from "drizzle-orm";
import { logAdminAction, ADMIN_ACTIONS } from "../utils/auditLogger.ts";

// ✅ CRITICAL: No fallback secret
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("CRITICAL: JWT_SECRET environment variable is not set!");
}

// ✅ VERY SHORT token expiry for admins (1 hour instead of 2)
export const ADMIN_JWT_EXPIRES_IN = "1h";

export interface AdminAuthRequest extends Request {
  admin?: {
    adminId: number;
    email: string;
    role: string;
  };
}

// ✅ Enhanced token verification with database blacklist check
export const verifyAdminToken = async (
  req: AdminAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        success: false, 
        error: "No admin token provided" 
      });
    }

    const token = authHeader.substring(7);

    // ✅ Check if token is blacklisted in database
    const [blacklisted] = await db
      .select()
      .from(blacklistedTokens)
      .where(eq(blacklistedTokens.token, token))
      .limit(1);

    if (blacklisted) {
      return res.status(401).json({ 
        success: false, 
        error: "Token has been revoked. Please login again." 
      });
    }

    // ✅ Verify JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as {
        adminId: number;
        email: string;
        role: string;
      };
    } catch (jwtError: any) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({ 
          success: false, 
          error: "Admin session expired. Please login again." 
        });
      }
      return res.status(401).json({ 
        success: false, 
        error: "Invalid admin token" 
      });
    }

    // ✅ Verify admin still exists and is active
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, decoded.adminId));

    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        error: "Admin account not found" 
      });
    }

    if (!admin.active) {
      await logAdminAction(req, {
        adminId: admin.id,
        action: ADMIN_ACTIONS.INACTIVE_ADMIN_ACCESS_ATTEMPT,
        status: "FAILED",
        errorMessage: "Attempted access with inactive account",
      });
      
      return res.status(401).json({ 
        success: false, 
        error: "Admin account is disabled" 
      });
    }

    // ✅ Attach admin to request
    req.admin = {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    };

    next();
  } catch (error) {
    console.error("❌ Admin auth error:", error);
    return res.status(401).json({ 
      success: false, 
      error: "Authentication failed" 
    });
  }
};

// ✅ MANDATORY re-authentication for ALL critical operations
export const requireReAuth = () => {
  return (req: AdminAuthRequest, res: Response, next: NextFunction) => {
    const reAuthToken = req.headers["x-reauth-token"];
    
    if (!reAuthToken) {
      return res.status(403).json({
        success: false,
        error: "This critical operation requires password confirmation",
        requiresReAuth: true,
      });
    }

    try {
      const decoded = jwt.verify(reAuthToken as string, JWT_SECRET) as any;
      
      // ✅ Re-auth token must be very recent (within 2 minutes)
      const tokenAge = Date.now() - (decoded.iat * 1000);
      if (tokenAge > 2 * 60 * 1000) { // 2 minutes instead of 5
        return res.status(403).json({
          success: false,
          error: "Re-authentication expired. Please confirm password again.",
          requiresReAuth: true,
        });
      }

      // ✅ Re-auth token must match current admin
      if (decoded.adminId !== req.admin?.adminId) {
        return res.status(403).json({
          success: false,
          error: "Invalid re-authentication token",
        });
      }

      next();
    } catch (error) {
      return res.status(403).json({
        success: false,
        error: "Invalid re-authentication. Please confirm password.",
        requiresReAuth: true,
      });
    }
  };
};

// ✅ Blacklist token in database (for secure logout)
export const blacklistToken = async (token: string, expiresAt: Date) => {
  try {
    await db.insert(blacklistedTokens).values({
      token,
      expiresAt,
    });
  } catch (error) {
    console.error("❌ Failed to blacklist token:", error);
  }
};

// ✅ Clean up expired blacklisted tokens (run this periodically)
export const cleanupBlacklistedTokens = async () => {
  try {
    const now = new Date();
    await db
      .delete(blacklistedTokens)
      .where(gte(blacklistedTokens.expiresAt, now));
    
    console.log("✅ Cleaned up expired blacklisted tokens");
  } catch (error) {
    console.error("❌ Failed to cleanup blacklisted tokens:", error);
  }
};