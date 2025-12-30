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
import { sql, count, eq, and, gte, desc, lte } from "drizzle-orm";
import jwt from 'jsonwebtoken';

// Get dashboard stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total users
    const [totalUsersResult] = await db.select({ count: count() }).from(users);
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
    const conversionRate =
      totalUsers > 0 ? ((paidSubscriptions / totalUsers) * 100).toFixed(2) : 0;

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

// ✅ IMPROVED: Get visit analytics with advanced metrics
export const getVisitAnalytics = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total visits
    const [totalVisits] = await db
      .select({ count: count() })
      .from(pageVisits)
      .where(gte(pageVisits.visitedAt, startDate));

    // Unique visitors (by session ID)
    const [uniqueVisitors] = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${pageVisits.sessionId})`,
      })
      .from(pageVisits)
      .where(gte(pageVisits.visitedAt, startDate));

    // Visits by page
    const visitsByPage = await db
      .select({
        page: pageVisits.page,
        visits: count(),
      })
      .from(pageVisits)
      .where(gte(pageVisits.visitedAt, startDate))
      .groupBy(pageVisits.page)
      .orderBy(desc(count()))
      .limit(20);

    // ✅ NEW: Top referrers
    const topReferrers = await db
      .select({
        referrer: pageVisits.referrer,
        visits: count(),
      })
      .from(pageVisits)
      .where(
        and(
          gte(pageVisits.visitedAt, startDate),
          sql`${pageVisits.referrer} IS NOT NULL AND ${pageVisits.referrer} != ''`
        )
      )
      .groupBy(pageVisits.referrer)
      .orderBy(desc(count()))
      .limit(10);

    // ✅ NEW: Visits by date (for chart)
    const visitsByDate = await db
      .select({
        date: sql<string>`DATE(${pageVisits.visitedAt})`,
        visits: count(),
        uniqueVisitors: sql<number>`COUNT(DISTINCT ${pageVisits.sessionId})`,
      })
      .from(pageVisits)
      .where(gte(pageVisits.visitedAt, startDate))
      .groupBy(sql`DATE(${pageVisits.visitedAt})`)
      .orderBy(sql`DATE(${pageVisits.visitedAt})`);

    res.json({
      success: true,
      analytics: {
        summary: {
          totalVisits: totalVisits.count,
          uniqueVisitors: Number(uniqueVisitors.count),
          avgPageViewsPerVisitor:
            Number(uniqueVisitors.count) > 0
              ? (totalVisits.count / Number(uniqueVisitors.count)).toFixed(2)
              : 0,
        },
        visitsByPage,
        topReferrers,
        visitsByDate,
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

// ✅ NEW: Batch analytics tracking (public endpoint)
export const trackAnalyticsBatch = async (req: Request, res: Response) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid events array",
      });
    }

    // ✅ Limit batch size
    if (events.length > 50) {
      return res.status(400).json({
        success: false,
        error: "Maximum 50 events per batch",
      });
    }

    const token = req.headers.authorization?.substring(7);
    let userId: number | null = null;

    // ✅ Get user ID if authenticated (optional)
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        userId = decoded.userId;
      } catch {
        // Not authenticated - that's fine for analytics
      }
    }

    // ✅ Process events
    const pageViewPromises: Promise<any>[] = [];
    const eventPromises: Promise<any>[] = [];

    for (const event of events) {
      if (event.type === "pageView") {
        pageViewPromises.push(
          db.insert(pageVisits).values({
            userId,
            page: event.page,
            sessionId: event.sessionId,
            userAgent: event.userAgent || req.headers["user-agent"] || null,
            ipAddress: req.ip || null,
            referrer: event.referrer || req.headers.referer || null,
            visitedAt: new Date(event.timestamp),
          })
        );
      } else if (event.type === "event" || event.type === "engagement") {
        eventPromises.push(
          db.insert(analyticsEvents).values({
            userId,
            eventType: event.eventType || event.type,
            eventData: {
              page: event.page,
              timeOnPage: event.timeOnPage,
              maxScrollDepth: event.maxScrollDepth,
              ...event.eventData,
            },
            createdAt: new Date(event.timestamp),
          })
        );
      }
    }

    // ✅ Execute all inserts in parallel
    await Promise.all([...pageViewPromises, ...eventPromises]);

    res.json({ success: true, tracked: events.length });
  } catch (error: any) {
    console.error("Batch analytics error:", error);
    res
      .status(500)
      .json({ success: false, error: "Analytics tracking failed" });
  }
};

// ✅ NEW: Get engagement metrics
export const getEngagementMetrics = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get engagement events
    const engagementData = await db
      .select({
        page: sql<string>`event_data->>'page'`,
        avgTimeOnPage: sql<number>`AVG((event_data->>'timeOnPage')::int)`,
        avgScrollDepth: sql<number>`AVG((event_data->>'maxScrollDepth')::int)`,
        totalSessions: count(),
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, "engagement"),
          gte(analyticsEvents.createdAt, startDate)
        )
      )
      .groupBy(sql`event_data->>'page'`)
      .orderBy(desc(count()))
      .limit(20);

    res.json({
      success: true,
      engagement: engagementData.map((row) => ({
        page: row.page,
        avgTimeOnPage: Math.round(Number(row.avgTimeOnPage || 0)),
        avgScrollDepth: Math.round(Number(row.avgScrollDepth || 0)),
        totalSessions: row.totalSessions,
      })),
    });
  } catch (error: any) {
    console.error("Engagement metrics error:", error);
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
