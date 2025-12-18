import type { Request, Response } from "express";
import { db } from "../../db/client.ts";
import {
  users,
  subscriptions,
  pageVisits,
  analyticsEvents,
  projects,
  renders,
} from "../../db/schema.ts";
import { sql, count, eq, and, gte, desc } from "drizzle-orm";

// Get dashboard stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total users
    const [totalUsersResult] = await db
      .select({ count: count() })
      .from(users);
    const totalUsers = totalUsersResult.count;

    // Active subscriptions
    const [activeSubsResult] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(sql`status IN ('active', 'trialing', 'free_trial')`);
    const activeSubscriptions = activeSubsResult.count;

    // Paid subscriptions
    const [paidSubsResult] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(sql`status IN ('active', 'trialing')`);
    const paidSubscriptions = paidSubsResult.count;

    // Free trials
    const [freeTrialResult] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(eq(subscriptions.status, "free_trial"));
    const freeTrialUsers = freeTrialResult.count;

    // New users (last 7 days)
    const [newUsers7d] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, last7Days));

    // New users (last 30 days)
    const [newUsers30d] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, last30Days));

    // Page visits (last 7 days)
    const [visits7d] = await db
      .select({ count: count() })
      .from(pageVisits)
      .where(gte(pageVisits.visitedAt, last7Days));

    // Page visits (last 30 days)
    const [visits30d] = await db
      .select({ count: count() })
      .from(pageVisits)
      .where(gte(pageVisits.visitedAt, last30Days));

    // Total projects created
    const [totalProjectsResult] = await db
      .select({ count: count() })
      .from(projects);
    const totalProjects = totalProjectsResult.count;

    // Total renders
    const [totalRendersResult] = await db
      .select({ count: count() })
      .from(renders);
    const totalRenders = totalRendersResult.count;

    // MRR calculation
    const subscriptionPrice = 19.99;
    const mrr = paidSubscriptions * subscriptionPrice;

    // Conversion rate
    const conversionRate = totalUsers > 0 
      ? ((paidSubscriptions / totalUsers) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          newLast7Days: newUsers7d.count,
          newLast30Days: newUsers30d.count,
        },
        subscriptions: {
          total: activeSubscriptions,
          paid: paidSubscriptions,
          freeTrial: freeTrialUsers,
          conversionRate: `${conversionRate}%`,
        },
        revenue: {
          mrr: `$${mrr.toFixed(2)}`,
          arr: `$${(mrr * 12).toFixed(2)}`,
        },
        visits: {
          last7Days: visits7d.count,
          last30Days: visits30d.count,
        },
        content: {
          totalProjects: totalProjects,
          totalRenders: totalRenders,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Analytics error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get visit analytics
export const getVisitAnalytics = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Visits by page
    const visitsByPage = await db
      .select({
        page: pageVisits.page,
        visits: count(),
      })
      .from(pageVisits)
      .where(gte(pageVisits.visitedAt, startDate))
      .groupBy(pageVisits.page)
      .orderBy(desc(count()));

    // Unique visitors
    const [uniqueVisitorsResult] = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${pageVisits.sessionId})`,
      })
      .from(pageVisits)
      .where(gte(pageVisits.visitedAt, startDate));

    res.json({
      success: true,
      analytics: {
        visitsByPage,
        uniqueVisitors: uniqueVisitorsResult.count,
        dateRange: {
          start: startDate.toISOString(),
          end: new Date().toISOString(),
        },
      },
    });
  } catch (error: any) {
    console.error("Visit analytics error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Track page visit (called from frontend)
export const trackPageVisit = async (req: Request, res: Response) => {
  try {
    const { page, sessionId } = req.body;
    const userId = (req as any).user?.userId || null;

    await db.insert(pageVisits).values({
      userId,
      page,
      sessionId,
      userAgent: req.headers["user-agent"] || null,
      ipAddress: req.ip || null,
      referrer: req.headers.referer || null,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Track visit error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};