import type { Request, Response } from "express";
import { db } from "../../db/client.ts";
import { adminAuditLogs, adminUsers } from "../../db/schema.ts";
import { eq, desc, and, gte, sql } from "drizzle-orm";

// Get audit logs with filtering
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { 
      adminId, 
      action, 
      targetType, 
      status, 
      days = 7,
      limit = 100 
    } = req.query;

    // Build query conditions
    const conditions: any[] = [];

    if (adminId) {
      conditions.push(eq(adminAuditLogs.adminId, parseInt(adminId as string)));
    }

    if (action) {
      conditions.push(eq(adminAuditLogs.action, action as string));
    }

    if (targetType) {
      conditions.push(eq(adminAuditLogs.targetType, targetType as string));
    }

    if (status) {
      conditions.push(eq(adminAuditLogs.status, status as "SUCCESS" | "FAILED"));
    }

    // Date filter
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days as string));
    conditions.push(gte(adminAuditLogs.createdAt, since));

    // Query with admin user info
    const logs = await db
      .select({
        log: adminAuditLogs,
        admin: {
          id: adminUsers.id,
          name: adminUsers.name,
          email: adminUsers.email,
          role: adminUsers.role,
        },
      })
      .from(adminAuditLogs)
      .leftJoin(adminUsers, eq(adminAuditLogs.adminId, adminUsers.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(adminAuditLogs.createdAt))
      .limit(parseInt(limit as string) || 100);

    res.json({
      success: true,
      logs,
      total: logs.length,
    });
  } catch (error: any) {
    console.error("❌ Get audit logs error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve audit logs",
    });
  }
};

// Get audit statistics
export const getAuditStats = async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;

    const since = new Date();
    since.setDate(since.getDate() - parseInt(days as string));

    // Total actions
    const [totalActions] = await db
      .select({ count: sql<number>`count(*)` })
      .from(adminAuditLogs)
      .where(gte(adminAuditLogs.createdAt, since));

    // Failed actions
    const [failedActions] = await db
      .select({ count: sql<number>`count(*)` })
      .from(adminAuditLogs)
      .where(
        and(
          gte(adminAuditLogs.createdAt, since),
          eq(adminAuditLogs.status, "FAILED")
        )
      );

    // Actions by admin
    const actionsByAdmin = await db
      .select({
        adminId: adminAuditLogs.adminId,
        adminName: adminUsers.name,
        count: sql<number>`count(*)`,
      })
      .from(adminAuditLogs)
      .leftJoin(adminUsers, eq(adminAuditLogs.adminId, adminUsers.id))
      .where(gte(adminAuditLogs.createdAt, since))
      .groupBy(adminAuditLogs.adminId, adminUsers.name)
      .orderBy(desc(sql`count(*)`));

    // ✅ UPDATED: Recent critical actions WITH admin info
    const criticalActions = await db
      .select({
        log: adminAuditLogs,
        admin: {
          id: adminUsers.id,
          name: adminUsers.name,
          email: adminUsers.email,
          role: adminUsers.role,
        },
      })
      .from(adminAuditLogs)
      .leftJoin(adminUsers, eq(adminAuditLogs.adminId, adminUsers.id))
      .where(
        and(
          gte(adminAuditLogs.createdAt, since),
          sql`${adminAuditLogs.action} IN ('DELETE_USER', 'GRANT_LIFETIME_ACCESS', 'REVOKE_LIFETIME_ACCESS')`
        )
      )
      .orderBy(desc(adminAuditLogs.createdAt))
      .limit(10);

    res.json({
      success: true,
      stats: {
        totalActions: Number(totalActions.count),
        failedActions: Number(failedActions.count),
        successRate: 
          Number(totalActions.count) > 0
            ? ((Number(totalActions.count) - Number(failedActions.count)) / Number(totalActions.count) * 100).toFixed(2)
            : "100.00",
        actionsByAdmin,
        recentCriticalActions: criticalActions,
      },
      period: `Last ${days} days`,
    });
  } catch (error: any) {
    console.error("❌ Get audit stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve audit statistics",
    });
  }
};