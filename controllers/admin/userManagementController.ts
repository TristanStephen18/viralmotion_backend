import type { Request, Response } from "express";
import { db } from "../../db/client.ts";
import { users, subscriptions, projects,
  renders,
  pageVisits,
  veo3Generations,
  imageGenerations, } from "../../db/schema.ts";
import { eq, sql, desc, asc, ilike, or, and, gte, lte, count } from "drizzle-orm";

// Get all users with pagination, search, filters, and sorting
export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const offset = (page - 1) * limit;

    // Filter parameters
    const subscriptionFilter = req.query.subscription as string;
    const verifiedFilter = req.query.verified as string;
    const providerFilter = req.query.provider as string;

    // ✅ NEW: Date filter parameters
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;

    // ✅ NEW: Sort parameters
    const sortBy = (req.query.sortBy as string) || "createdAt"; // Default sort by joined date
    const sortOrder = (req.query.sortOrder as string) || "desc"; // Default descending

    // Base query with LEFT JOIN
    let query = db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
        verified: users.verified,
        provider: users.provider,
        stripeCustomerId: users.stripeCustomerId,
        subscriptionStatus: subscriptions.status,
        subscriptionPlan: subscriptions.plan,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
      })
      .from(users)
      .leftJoin(
        subscriptions,
        sql`${users.id} = ${subscriptions.userId} AND ${subscriptions.status} IN ('active', 'trialing', 'free_trial')`
      );

    // Build WHERE conditions
    const conditions: any[] = [];

    // Search filter
    if (search) {
      conditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.name, `%${search}%`)
        )
      );
    }

    // Subscription filter
    if (subscriptionFilter) {
      if (subscriptionFilter === "none") {
        conditions.push(sql`${subscriptions.status} IS NULL`);
      } else if (subscriptionFilter === "paid") {
        conditions.push(sql`${subscriptions.status} IN ('active', 'trialing')`);
      } else if (subscriptionFilter === "free_trial") {
        conditions.push(eq(subscriptions.status, "free_trial"));
      } else {
        conditions.push(eq(subscriptions.status, subscriptionFilter));
      }
    }

    // Verified filter
    if (verifiedFilter) {
      conditions.push(eq(users.verified, verifiedFilter === "true"));
    }

    // Provider filter
    if (providerFilter) {
      if (providerFilter === "local") {
        conditions.push(
          or(eq(users.provider, "local"), sql`${users.provider} IS NULL`)
        );
      } else {
        conditions.push(eq(users.provider, providerFilter));
      }
    }

    // ✅ NEW: Date range filter
    if (dateFrom) {
      conditions.push(gte(users.createdAt, new Date(dateFrom)));
    }
    if (dateTo) {
      // Add 1 day to include the entire end date
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(lte(users.createdAt, endDate));
    }

    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // ✅ NEW: Apply sorting
    const orderFunction = sortOrder === "asc" ? asc : desc;
    
    if (sortBy === "name") {
      query = query.orderBy(orderFunction(users.name)) as any;
    } else if (sortBy === "email") {
      query = query.orderBy(orderFunction(users.email)) as any;
    } else {
      // Default: sort by createdAt
      query = query.orderBy(orderFunction(users.createdAt)) as any;
    }

    const usersList = await query.limit(limit).offset(offset);

    // Get total count with same filters
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .leftJoin(
        subscriptions,
        sql`${users.id} = ${subscriptions.userId} AND ${subscriptions.status} IN ('active', 'trialing', 'free_trial')`
      );

    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions)) as any;
    }

    const [totalResult] = await countQuery;

    res.json({
      success: true,
      users: usersList,
      pagination: {
        page,
        limit,
        total: Number(totalResult.count),
        pages: Math.ceil(Number(totalResult.count) / limit),
      },
    });
  } catch (error: any) {
    console.error("Get users error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get user details - no changes needed
export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    // Get user basic info
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Get user's subscriptions
    const userSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));

    // Get user's projects count
    const [projectsCount] = await db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.userId, userId));

    // Get user's renders count
    const [rendersCount] = await db
      .select({ count: count() })
      .from(renders)
      .where(eq(renders.userId, userId));

    // Get recent projects (last 5)
    const recentProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt))
      .limit(5);

    // Get recent renders (last 5)
    const recentRenders = await db
      .select()
      .from(renders)
      .where(eq(renders.userId, userId))
      .orderBy(desc(renders.renderedAt))
      .limit(5);

    // Get page visit stats (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [visitsCount] = await db
      .select({ count: count() })
      .from(pageVisits)
      .where(
        and(
          eq(pageVisits.userId, userId),
          gte(pageVisits.visitedAt, thirtyDaysAgo)
        )
      );

    // Get AI generations count
    const [veoCount] = await db
      .select({ count: count() })
      .from(veo3Generations)
      .where(eq(veo3Generations.userId, userId));

    const [imageGenCount] = await db
      .select({ count: count() })
      .from(imageGenerations)
      .where(eq(imageGenerations.userId, userId));

    // Get recent page visits
    const recentVisits = await db
      .select({
        page: pageVisits.page,
        visitedAt: pageVisits.visitedAt,
      })
      .from(pageVisits)
      .where(eq(pageVisits.userId, userId))
      .orderBy(desc(pageVisits.visitedAt))
      .limit(10);

    res.json({
      success: true,
      user: {
        ...user,
        stats: {
          totalProjects: projectsCount.count,
          totalRenders: rendersCount.count,
          totalVisits: visitsCount.count,
          totalVeoGenerations: veoCount.count,
          totalImageGenerations: imageGenCount.count,
        },
        subscriptions: userSubscriptions,
        recentProjects,
        recentRenders,
        recentVisits,
      },
    });
  } catch (error: any) {
    console.error("Get user details error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};