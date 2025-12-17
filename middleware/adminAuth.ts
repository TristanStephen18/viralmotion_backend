import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db/client.ts";
import { adminUsers } from "../db/schema.ts";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AdminAuthRequest extends Request {
  admin?: {
    adminId: number;
    email: string;
    role: string;
  };
}

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

    const decoded = jwt.verify(token, JWT_SECRET) as {
      adminId: number;
      email: string;
      role: string;
    };

    // Verify admin still exists and is active
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, decoded.adminId));

    if (!admin || !admin.active) {
      return res.status(401).json({ 
        success: false, 
        error: "Admin account not found or inactive" 
      });
    }

    req.admin = {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    };

    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(401).json({ 
      success: false, 
      error: "Invalid admin token" 
    });
  }
};

// Role-based access control
export const requireRole = (allowedRoles: string[]) => {
  return (req: AdminAuthRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ 
        success: false, 
        error: "Unauthorized" 
      });
    }

    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({ 
        success: false, 
        error: "Insufficient permissions" 
      });
    }

    next();
  };
};