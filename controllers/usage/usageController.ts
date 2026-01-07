import { db } from "../../db/client.ts";
import { usageTracking, subscriptions } from "../../db/schema.ts";
import { eq, desc } from "drizzle-orm";
import type { Response } from "express";
import type { AuthRequest } from "../../utils/authmiddleware.ts";

// ✅ SIMPLIFIED: Core plan limits only
const PLAN_LIMITS = {
  free: {
    videosPerMonth: 5,
    aiGenerationsPerDay: 5,
    maxQuality: '720p',
    hasWatermark: true,
    templates: 'basic',
    requiresTracking: true,
  },
  starter: {
    videosPerMonth: 30,
    aiGenerationsPerDay: 20,
    maxQuality: '1080p',
    hasWatermark: false,
    templates: 'all',
    requiresTracking: true,
  },
  pro: {
    videosPerMonth: Infinity,
    aiGenerationsPerDay: Infinity,
    maxQuality: '4K',
    hasWatermark: false,
    templates: 'all',
    requiresTracking: false, // ✅ Unlimited = no tracking
  },
  team: {
    videosPerMonth: Infinity,
    aiGenerationsPerDay: Infinity,
    maxQuality: '4K',
    hasWatermark: false,
    templates: 'all',
    requiresTracking: false, // ✅ Unlimited = no tracking
  },
  lifetime: {
    videosPerMonth: Infinity,
    aiGenerationsPerDay: Infinity,
    maxQuality: '4K',
    hasWatermark: false,
    templates: 'all',
    requiresTracking: false, // ✅ Unlimited = no tracking
  },
};

// Get or create usage tracking record
async function getOrCreateUsageTracking(userId: number) {
  let [usage] = await db
    .select()
    .from(usageTracking)
    .where(eq(usageTracking.userId, userId));

  if (!usage) {
    [usage] = await db
      .insert(usageTracking)
      .values({
        userId,
        videosThisMonth: 0,
        aiGenerationsToday: 0,
        lastVideoReset: new Date(),
        lastAiReset: new Date(),
      })
      .returning();
  }

  return usage;
}

// Check if monthly reset is needed
function needsMonthlyReset(lastReset: Date): boolean {
  const now = new Date();
  return (
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear()
  );
}

// Check if daily reset is needed
function needsDailyReset(lastReset: Date): boolean {
  const now = new Date();
  return now.toDateString() !== lastReset.toDateString();
}

// Get user's current plan
async function getUserPlan(userId: number): Promise<string> {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (!subscription) {
    return "free";
  }

  if (subscription.isLifetime) {
    return "lifetime";
  }

  if (subscription.status === "active") {
    return subscription.plan;
  }

  return "free";
}

// ✅ Check if user can create video
export const canCreateVideo = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const plan = await getUserPlan(userId);
    const planConfig = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
    
    // Pro/Team/Lifetime users skip tracking
    if (!planConfig.requiresTracking) {
      return res.json({ 
        canCreate: true, 
        remaining: Infinity,
        limit: Infinity,
        used: 0,
        plan,
        unlimited: true,
      });
    }

    // Free/Starter users - check limits
    let usage = await getOrCreateUsageTracking(userId);

    // Reset monthly counter if needed
    if (needsMonthlyReset(usage.lastVideoReset)) {
      [usage] = await db
        .update(usageTracking)
        .set({
          videosThisMonth: 0,
          lastVideoReset: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(usageTracking.userId, userId))
        .returning();
    }

    const canCreate = usage.videosThisMonth < planConfig.videosPerMonth;
    const remaining = Math.max(0, planConfig.videosPerMonth - usage.videosThisMonth);

    res.json({ 
      canCreate, 
      remaining,
      limit: planConfig.videosPerMonth,
      used: usage.videosThisMonth,
      plan,
      unlimited: false,
    });
  } catch (error) {
    console.error("Error checking video creation:", error);
    res.status(500).json({ error: "Failed to check usage" });
  }
};

// ✅ Increment video counter (call this when user creates/exports video)
export const incrementVideoCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId; // ✅ Clean access
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const plan = await getUserPlan(userId);
    const planConfig = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];

    // Skip tracking for unlimited plans
    if (!planConfig.requiresTracking) {
      return res.json({ 
        success: true, 
        videosCreated: 0,
        unlimited: true,
      });
    }

    // Track for Free/Starter
    let usage = await getOrCreateUsageTracking(userId);

    // Reset if needed
    if (needsMonthlyReset(usage.lastVideoReset)) {
      usage.videosThisMonth = 0;
      usage.lastVideoReset = new Date();
    }

    // Increment
    [usage] = await db
      .update(usageTracking)
      .set({
        videosThisMonth: usage.videosThisMonth + 1,
        updatedAt: new Date(),
      })
      .where(eq(usageTracking.userId, userId))
      .returning();

    res.json({ 
      success: true, 
      videosCreated: usage.videosThisMonth,
      unlimited: false,
    });
  } catch (error) {
    console.error("Error incrementing video count:", error);
    res.status(500).json({ error: "Failed to increment usage" });
  }
};

// ✅ Check if user can generate AI image
export const canGenerateAI = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId; // ✅ Clean access
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const plan = await getUserPlan(userId);
    const planConfig = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
    
    // Pro/Team/Lifetime users skip tracking
    if (!planConfig.requiresTracking) {
      return res.json({ 
        canGenerate: true, 
        remaining: Infinity,
        limit: Infinity,
        used: 0,
        plan,
        unlimited: true,
      });
    }

    // Free/Starter users - check limits
    let usage = await getOrCreateUsageTracking(userId);

    // Reset daily counter if needed
    if (needsDailyReset(usage.lastAiReset)) {
      [usage] = await db
        .update(usageTracking)
        .set({
          aiGenerationsToday: 0,
          lastAiReset: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(usageTracking.userId, userId))
        .returning();
    }

    const canGenerate = usage.aiGenerationsToday < planConfig.aiGenerationsPerDay;
    const remaining = Math.max(0, planConfig.aiGenerationsPerDay - usage.aiGenerationsToday);

    res.json({ 
      canGenerate, 
      remaining,
      limit: planConfig.aiGenerationsPerDay,
      used: usage.aiGenerationsToday,
      plan,
      unlimited: false,
    });
  } catch (error) {
    console.error("Error checking AI generation:", error);
    res.status(500).json({ error: "Failed to check usage" });
  }
};

// ✅ Increment AI generation counter
export const incrementAICount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId; // ✅ Clean access
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const plan = await getUserPlan(userId);
    const planConfig = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];

    // Skip tracking for unlimited plans
    if (!planConfig.requiresTracking) {
      return res.json({ 
        success: true, 
        aiGenerations: 0,
        unlimited: true,
      });
    }

    // Track for Free/Starter
    let usage = await getOrCreateUsageTracking(userId);

    // Reset if needed
    if (needsDailyReset(usage.lastAiReset)) {
      usage.aiGenerationsToday = 0;
      usage.lastAiReset = new Date();
    }

    // Increment
    [usage] = await db
      .update(usageTracking)
      .set({
        aiGenerationsToday: usage.aiGenerationsToday + 1,
        updatedAt: new Date(),
      })
      .where(eq(usageTracking.userId, userId))
      .returning();

    res.json({ 
      success: true, 
      aiGenerations: usage.aiGenerationsToday,
      unlimited: false,
    });
  } catch (error) {
    console.error("Error incrementing AI count:", error);
    res.status(500).json({ error: "Failed to increment usage" });
  }
};

// ✅ Get complete usage stats
export const getUsageStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId; // ✅ Clean access
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const plan = await getUserPlan(userId);
    const planConfig = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];

    // Pro/Team/Lifetime - return unlimited stats
    if (!planConfig.requiresTracking) {
      return res.json({
        plan,
        unlimited: true,
        limits: {
          videosPerMonth: Infinity,
          aiGenerationsPerDay: Infinity,
        },
        usage: {
          videosThisMonth: 0,
          aiGenerationsToday: 0,
        },
        remaining: {
          videos: Infinity,
          aiGenerations: Infinity,
        },
        features: {
          maxQuality: planConfig.maxQuality,
          hasWatermark: planConfig.hasWatermark,
          templates: planConfig.templates,
        },
      });
    }

    // Free/Starter - return detailed tracking
    let usage = await getOrCreateUsageTracking(userId);

    // Reset counters if needed
    if (needsMonthlyReset(usage.lastVideoReset)) {
      usage.videosThisMonth = 0;
    }

    if (needsDailyReset(usage.lastAiReset)) {
      usage.aiGenerationsToday = 0;
    }

    res.json({
      plan,
      unlimited: false,
      limits: {
        videosPerMonth: planConfig.videosPerMonth,
        aiGenerationsPerDay: planConfig.aiGenerationsPerDay,
      },
      usage: {
        videosThisMonth: usage.videosThisMonth,
        aiGenerationsToday: usage.aiGenerationsToday,
      },
      remaining: {
        videos: Math.max(0, planConfig.videosPerMonth - usage.videosThisMonth),
        aiGenerations: Math.max(0, planConfig.aiGenerationsPerDay - usage.aiGenerationsToday),
      },
      features: {
        maxQuality: planConfig.maxQuality,
        hasWatermark: planConfig.hasWatermark,
        templates: planConfig.templates,
      },
    });
  } catch (error) {
    console.error("Error getting usage stats:", error);
    res.status(500).json({ error: "Failed to get usage stats" });
  }
};

// ✅ Get plan features (for feature gating in frontend)
export const getPlanFeatures = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId; // ✅ Clean access
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const plan = await getUserPlan(userId);
    const planConfig = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];

    res.json({
      plan,
      features: {
        maxQuality: planConfig.maxQuality,
        hasWatermark: planConfig.hasWatermark,
        templates: planConfig.templates,
      },
      limits: {
        videosPerMonth: planConfig.videosPerMonth,
        aiGenerationsPerDay: planConfig.aiGenerationsPerDay,
      },
    });
  } catch (error) {
    console.error("Error getting plan features:", error);
    res.status(500).json({ error: "Failed to get plan features" });
  }
};