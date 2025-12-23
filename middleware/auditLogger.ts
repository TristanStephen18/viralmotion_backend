import { db } from "../db/client.ts";
import { adminAuditLogs } from "../db/schema.ts";
import type { Request } from "express";

export interface AuditLogData {
  adminId: number;
  action: string;
  targetType?: string;
  targetId?: number;
  details?: any;
  status: "SUCCESS" | "FAILED";
  errorMessage?: string;
}

export const logAdminAction = async (
  req: Request,
  data: AuditLogData
) => {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    await db.insert(adminAuditLogs).values({
      adminId: data.adminId,
      action: data.action,
      targetType: data.targetType || null,
      targetId: data.targetId || null,
      details: data.details || null,
      ipAddress,
      userAgent,
      status: data.status,
      errorMessage: data.errorMessage || null,
    });

    console.log(`📝 Audit Log: Admin ${data.adminId} performed ${data.action} - ${data.status}`);
  } catch (error) {
    console.error("❌ Failed to log admin action:", error);
    // Don't throw - logging failure shouldn't break the operation
  }
};

// ✅ Predefined action types (for consistency)
export const ADMIN_ACTIONS = {
  // Authentication
  LOGIN: "ADMIN_LOGIN",
  LOGIN_FAILED: "ADMIN_LOGIN_FAILED",
  LOGOUT: "ADMIN_LOGOUT",
  
  // User Management
  VIEW_USER_LIST: "VIEW_USER_LIST",
  VIEW_USER_DETAILS: "VIEW_USER_DETAILS",
  DELETE_USER: "DELETE_USER",
  CREATE_LIFETIME_ACCOUNT: "CREATE_LIFETIME_ACCOUNT",
  
  // Subscription Management
  GRANT_LIFETIME: "GRANT_LIFETIME_ACCESS",
  REVOKE_LIFETIME: "REVOKE_LIFETIME_ACCESS",
  
  // Analytics
  VIEW_DASHBOARD: "VIEW_DASHBOARD",
  VIEW_ANALYTICS: "VIEW_ANALYTICS",

  CREATE_ADMIN_USER: "CREATE_ADMIN_USER",
  CREATE_ADMIN_USER_FAILED: "CREATE_ADMIN_USER_FAILED",
} as const;