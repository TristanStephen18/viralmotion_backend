import type { Request, Response } from "express";
import { db } from "../../db/client.ts";
import {
  users,
  subscriptions,
  projects,
  renders,
  pageVisits,
  veo3Generations,
  imageGenerations,
  youtubeDownloads,
  loginAttempts,
  uploads,
  datasets,
} from "../../db/schema.ts";
import { stripe } from "../../config/stripe.ts";
import {
  eq,
  sql,
  desc,
  asc,
  ilike,
  or,
  and,
  gte,
  lte,
  count,
} from "drizzle-orm";
import { logAdminAction, ADMIN_ACTIONS } from "../../utils/auditLogger.ts";

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
        sql`${users.id} = ${subscriptions.userId} AND ${subscriptions.status} IN ('active', 'trialing', 'free_trial', 'lifetime', 'company')`
      );

    // Build WHERE conditions
    const conditions: any[] = [];

    // Search filter
    if (search) {
      conditions.push(
        or(ilike(users.email, `%${search}%`), ilike(users.name, `%${search}%`))
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
      } else if (subscriptionFilter === "lifetime") {
        conditions.push(eq(subscriptions.status, "lifetime"));
      } else if (subscriptionFilter === "company") {
        conditions.push(eq(subscriptions.status, "company"));
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
        sql`${users.id} = ${subscriptions.userId} AND ${subscriptions.status} IN ('active', 'trialing', 'free_trial', 'lifetime', 'company')`
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

// ✅ UPDATED: getUserDetails with audit logging
export const getUserDetails = async (req: Request, res: Response) => {
  const adminId = (req as any).admin?.adminId;

  try {
    const userId = parseInt(req.params.userId);

    // Get user basic info
    const [user] = await db.select().from(users).where(eq(users.id, userId));

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

      // ✅ Log user data access
    await logAdminAction(req, {
      adminId,
      action: ADMIN_ACTIONS.VIEW_USER_DETAILS,
      targetType: "USER",
      targetId: userId,
      targetEmail: user.email,
      status: "SUCCESS",
    });

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

// ✅ UPDATED: Create lifetime account with audit logging
export const createLifetimeAccount = async (req: Request, res: Response) => {
  const adminId = (req as any).admin?.adminId;

  try {
    const { email, name, companyName, notes } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    // Check if email already exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (existing) {
      // ✅ Log failed attempt
      await logAdminAction(req, {
        adminId,
        action: ADMIN_ACTIONS.CREATE_LIFETIME_ACCOUNT_FAILED,
        targetType: "USER",
        targetEmail: email,
        status: "FAILED",
        errorMessage: "Email already exists",
      });

      return res.status(400).json({
        success: false,
        error: "User with this email already exists",
      });
    }

    console.log(`👤 Admin ${adminId} creating lifetime account for ${email}`);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
        passwordHash: null,
        verified: true,
        provider: "admin_created",
        createdAt: new Date(),
      })
      .returning();

    // Create lifetime subscription
    await db.insert(subscriptions).values({
      userId: newUser.id,
      stripeSubscriptionId: null,
      stripeCustomerId: null,
      stripePriceId: null,
      status: companyName ? "company" : "lifetime",
      plan: companyName ? "company" : "lifetime",
      isLifetime: true,
      isCompanyAccount: !!companyName,
      companyName: companyName?.trim() || null,
      specialNotes: notes?.trim() || null,
      grantedBy: adminId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date("2099-12-31"),
      cancelAtPeriodEnd: false,
      trialStart: null,
      trialEnd: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // ✅ Log successful creation
    await logAdminAction(req, {
      adminId,
      action: ADMIN_ACTIONS.CREATE_LIFETIME_ACCOUNT,
      targetType: "USER",
      targetId: newUser.id,
      targetEmail: newUser.email,
      status: "SUCCESS",
      details: {
        userName: newUser.name,
        accountType: companyName ? "Company" : "Personal",
        companyName: companyName || null,
        hasNotes: !!notes,
      },
    });

    console.log(`✅ Lifetime account created: ${newUser.email} by admin ${adminId}`);

    res.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      message: `Lifetime account created. User can set password via "Forgot Password" using: ${newUser.email}`,
    });
  } catch (error: any) {
    console.error("❌ Create lifetime account error:", error);

    // ✅ Log failed creation
    await logAdminAction(req, {
      adminId,
      action: ADMIN_ACTIONS.CREATE_LIFETIME_ACCOUNT_FAILED,
      targetType: "USER",
      targetEmail: req.body.email,
      status: "FAILED",
      errorMessage: error.message,
    });

    res.status(500).json({ success: false, error: "Failed to create lifetime account" });
  }
};

// ✅ NEW: Delete user (admin only)
export const deleteUser = async (req: Request, res: Response) => {
  const adminId = (req as any).admin?.adminId;
  
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const userIdNum = parseInt(userId, 10);

    console.log(`🗑️ Admin ${adminId} is deleting user ${userIdNum}`);

    // 1. Get user details before deletion
    const [user] = await db.select().from(users).where(eq(users.id, userIdNum));

    if (!user) {
      // ✅ Log failed attempt
      await logAdminAction(req, {
        adminId,
        action: ADMIN_ACTIONS.DELETE_USER_FAILED,
        targetType: "USER",
        targetId: userIdNum,
        status: "FAILED",
        errorMessage: "User not found",
      });

      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // 2. Get user stats before deletion
    const [projectsCount] = await db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.userId, userIdNum));

    const [rendersCount] = await db
      .select({ count: count() })
      .from(renders)
      .where(eq(renders.userId, userIdNum));

    // 3. Cancel Stripe subscription if exists
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userIdNum))
      .limit(1);

    if (subscription?.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        console.log(`✅ Canceled Stripe subscription: ${subscription.stripeSubscriptionId}`);
      } catch (stripeError) {
        console.error("⚠️ Failed to cancel Stripe subscription:", stripeError);
      }
    }

    // 4. Delete all user data
    await db.delete(projects).where(eq(projects.userId, userIdNum));
    await db.delete(renders).where(eq(renders.userId, userIdNum));
    await db.delete(uploads).where(eq(uploads.userId, userIdNum));
    await db.delete(datasets).where(eq(datasets.userId, userIdNum));
    await db.delete(veo3Generations).where(eq(veo3Generations.userId, userIdNum));
    await db.delete(imageGenerations).where(eq(imageGenerations.userId, userIdNum));
    await db.delete(youtubeDownloads).where(eq(youtubeDownloads.userId, userIdNum));
    await db.delete(loginAttempts).where(eq(loginAttempts.email, user.email));
    await db.delete(pageVisits).where(eq(pageVisits.userId, userIdNum));

    // 5. Delete user
    await db.delete(users).where(eq(users.id, userIdNum));

    // ✅ Log successful deletion
    await logAdminAction(req, {
      adminId,
      action: ADMIN_ACTIONS.DELETE_USER,
      targetType: "USER",
      targetId: userIdNum,
      targetEmail: user.email,
      status: "SUCCESS",
      details: {
        userName: user.name,
        userEmail: user.email,
        totalProjects: projectsCount.count,
        totalRenders: rendersCount.count,
        hadStripeSubscription: !!subscription?.stripeSubscriptionId,
        subscriptionStatus: subscription?.status,
      },
    });

    console.log(`✅ User deleted: ${user.email} (ID: ${userIdNum}) by admin ${adminId}`);

    res.json({
      success: true,
      message: `User ${user.email} deleted successfully`,
    });
  } catch (error: any) {
    console.error("❌ Admin delete user error:", error);

    // ✅ Log failed deletion
    await logAdminAction(req, {
      adminId,
      action: ADMIN_ACTIONS.DELETE_USER_FAILED,
      targetType: "USER",
      targetId: parseInt(req.params.userId, 10),
      status: "FAILED",
      errorMessage: error.message,
    });

    res.status(500).json({ success: false, error: "Failed to delete user" });
  }
};
