import { db } from "../db/client.ts";
import { adminAuditLogs } from "../db/schema.ts";
import type { Request } from "express";
import { and, desc, eq, gte } from "drizzle-orm";

export interface AuditLogData {
  adminId: number;
  action: string;
  targetType?: string;
  targetId?: number;
  targetEmail?: string;
  details?: any;
  status: "SUCCESS" | "FAILED";
  errorMessage?: string;
}

/**
 * Log an admin action to the audit trail
 * This creates a permanent, immutable record of all admin activities
 */
export const logAdminAction = async (
  req: Request,
  data: AuditLogData
): Promise<void> => {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // ✅ Sanitize details before logging (remove sensitive data)
    const sanitizedDetails = data.details ? sanitizeDetails(data.details) : null;

    await db.insert(adminAuditLogs).values({
      adminId: data.adminId,
      action: data.action,
      targetType: data.targetType || null,
      targetId: data.targetId || null,
      targetEmail: data.targetEmail || null,
      details: sanitizedDetails,
      ipAddress,
      userAgent,
      status: data.status,
      errorMessage: data.errorMessage || null,
    });

    // ✅ Console logging with context
    const emoji = data.status === "SUCCESS" ? "✅" : "❌";
    console.log(
      `${emoji} [AUDIT] Admin ${data.adminId} | ${data.action} | ${data.status}` +
      (data.targetEmail ? ` | Target: ${data.targetEmail}` : "") +
      (data.errorMessage ? ` | Error: ${data.errorMessage}` : "")
    );
  } catch (error) {
    console.error("❌ CRITICAL: Failed to log admin action:", error);
    console.error("Failed audit log data:", {
      adminId: data.adminId,
      action: data.action,
      status: data.status,
    });
    // ✅ Don't throw - logging failure shouldn't break the operation
    // But we log to console so we know something is wrong
  }
};

/**
 * Sanitize details object to remove sensitive information
 */
const sanitizeDetails = (details: any): any => {
  if (!details || typeof details !== 'object') {
    return details;
  }

  const sanitized = { ...details };
  
  // ✅ Remove sensitive fields
  const sensitiveFields = [
    'password',
    'passwordHash',
    'token',
    'secret',
    'apiKey',
    'privateKey',
    'creditCard',
    'ssn',
    'twoFactorSecret',
  ];

  const removeSensitiveFields = (obj: any): any => {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => removeSensitiveFields(item));
    }

    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Check if field name contains sensitive keywords
      const isSensitive = sensitiveFields.some(field => 
        lowerKey.includes(field.toLowerCase())
      );

      if (isSensitive) {
        cleaned[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = removeSensitiveFields(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  };

  return removeSensitiveFields(sanitized);
};

/*
 Predefined action types for consistency and searchability
 Using constants prevents typos and makes it easier to query logs
 */
export const ADMIN_ACTIONS = {
  // ========== AUTHENTICATION ==========
  LOGIN: "ADMIN_LOGIN",
  LOGIN_FAILED: "ADMIN_LOGIN_FAILED",
  LOGOUT: "ADMIN_LOGOUT",
  REAUTH_SUCCESS: "ADMIN_REAUTH_SUCCESS",
  REAUTH_FAILED: "ADMIN_REAUTH_FAILED",
  EXTEND_SESSION: "ADMIN_EXTEND_SESSION",
  CHANGE_PASSWORD: "ADMIN_CHANGE_PASSWORD",
  UPDATE_PROFILE: "ADMIN_UPDATE_PROFILE",
  
  // ========== USER MANAGEMENT ==========
  VIEW_USER_LIST: "VIEW_USER_LIST",
  VIEW_USER_DETAILS: "VIEW_USER_DETAILS",
  DELETE_USER: "DELETE_USER",
  DELETE_USER_FAILED: "DELETE_USER_FAILED",
  CREATE_LIFETIME_ACCOUNT: "CREATE_LIFETIME_ACCOUNT",
  CREATE_LIFETIME_ACCOUNT_FAILED: "CREATE_LIFETIME_ACCOUNT_FAILED",
  
  // ========== SUBSCRIPTION MANAGEMENT ==========
  GRANT_LIFETIME: "GRANT_LIFETIME_ACCESS",
  GRANT_LIFETIME_FAILED: "GRANT_LIFETIME_ACCESS_FAILED",
  REVOKE_LIFETIME: "REVOKE_LIFETIME_ACCESS",
  REVOKE_LIFETIME_FAILED: "REVOKE_LIFETIME_ACCESS_FAILED",
  
  // ========== ANALYTICS ==========
  VIEW_DASHBOARD: "VIEW_ADMIN_DASHBOARD",
  VIEW_ANALYTICS: "VIEW_ANALYTICS",
  EXPORT_DATA: "EXPORT_DATA",
  
  // ========== SECURITY ==========
  UNAUTHORIZED_ACCESS_ATTEMPT: "UNAUTHORIZED_ACCESS_ATTEMPT",
  INACTIVE_ADMIN_ACCESS_ATTEMPT: "INACTIVE_ADMIN_ACCESS_ATTEMPT",
  SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY",

  // ========== COUPON MANAGEMENT ==========
  CREATE_COUPON: "CREATE_COUPON",
  UPDATE_COUPON: "UPDATE_COUPON",
  DEACTIVATE_COUPON: "DEACTIVATE_COUPON",
  DELETE_COUPON: "DELETE_COUPON",
} as const;

/*
  Get audit logs for a specific admin
 */
export const getAdminLogs = async (adminId: number, limit: number = 100) => {
  return await db
    .select()
    .from(adminAuditLogs)
    .where(eq(adminAuditLogs.adminId, adminId))
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(limit);
};

/*
  Get audit logs for a specific action type
 */
export const getActionLogs = async (action: string, limit: number = 100) => {
  return await db
    .select()
    .from(adminAuditLogs)
    .where(eq(adminAuditLogs.action, action))
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(limit);
};

/*
 Get audit logs for a specific target (e.g., all actions on a specific user)
 */
export const getTargetLogs = async (
  targetType: string, 
  targetId: number, 
  limit: number = 100
) => {
  return await db
    .select()
    .from(adminAuditLogs)
    .where(
      and(
        eq(adminAuditLogs.targetType, targetType),
        eq(adminAuditLogs.targetId, targetId)
      )
    )
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(limit);
};

/*
  Get failed actions (for security monitoring)
 */
export const getFailedActions = async (hours: number = 24, limit: number = 100) => {
  const since = new Date();
  since.setHours(since.getHours() - hours);

  return await db
    .select()
    .from(adminAuditLogs)
    .where(
      and(
        eq(adminAuditLogs.status, "FAILED"),
        gte(adminAuditLogs.createdAt, since)
      )
    )
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(limit);
};