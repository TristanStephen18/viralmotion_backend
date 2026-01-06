// utils/usageHelper.ts
import { db } from "../db/client.ts";
import { usageTracking, subscriptions } from "../db/schema.ts";
import { eq, desc } from "drizzle-orm";

const PLAN_LIMITS = {
  free: { aiGenerationsPerDay: 1, requiresTracking: true },
  starter: { aiGenerationsPerDay: 20, requiresTracking: true },
  pro: { aiGenerationsPerDay: Infinity, requiresTracking: false },
  team: { aiGenerationsPerDay: Infinity, requiresTracking: false },
  lifetime: { aiGenerationsPerDay: Infinity, requiresTracking: false },
};

async function getOrCreateUsageTracking(userId: number) {
  let [usage] = await db.select().from(usageTracking).where(eq(usageTracking.userId, userId));
  if (!usage) {
    [usage] = await db.insert(usageTracking).values({
      userId,
      videosThisMonth: 0,
      aiGenerationsToday: 0,
      lastVideoReset: new Date(),
      lastAiReset: new Date(),
    }).returning();
  }
  return usage;
}

function needsDailyReset(lastReset: Date): boolean {
  return new Date().toDateString() !== lastReset.toDateString();
}

async function getUserPlan(userId: number): Promise<string> {
  const [subscription] = await db.select().from(subscriptions)
    .where(eq(subscriptions.userId, userId)).orderBy(desc(subscriptions.createdAt)).limit(1);
  if (!subscription) return "free";
  if (subscription.isLifetime) return "lifetime";
  if (subscription.status === "active") return subscription.plan;
  return "free";
}

export async function checkAIGenerationAllowed(userId: number) {
  const plan = await getUserPlan(userId);
  const config = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
  if (!config.requiresTracking) return { allowed: true, unlimited: true, used: 0, limit: Infinity, plan };
  
  let usage = await getOrCreateUsageTracking(userId);
  if (needsDailyReset(usage.lastAiReset)) {
    [usage] = await db.update(usageTracking).set({ aiGenerationsToday: 0, lastAiReset: new Date(), updatedAt: new Date() })
      .where(eq(usageTracking.userId, userId)).returning();
  }
  
  return {
    allowed: usage.aiGenerationsToday < config.aiGenerationsPerDay,
    used: usage.aiGenerationsToday,
    limit: config.aiGenerationsPerDay,
    plan,
    unlimited: false,
  };
}

export async function incrementAIGeneration(userId: number) {
  const plan = await getUserPlan(userId);
  const config = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
  if (!config.requiresTracking) return true;
  
  let usage = await getOrCreateUsageTracking(userId);
  if (needsDailyReset(usage.lastAiReset)) {
    usage.aiGenerationsToday = 0;
  }
  
  await db.update(usageTracking).set({
    aiGenerationsToday: usage.aiGenerationsToday + 1,
    lastAiReset: new Date(),
    updatedAt: new Date(),
  }).where(eq(usageTracking.userId, userId));
  
  return true;
}