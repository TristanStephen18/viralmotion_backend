import { db } from "../db/client.ts";
import { subscriptions } from "../db/schema.ts";
import { eq, and } from "drizzle-orm";

async function expireFreeTrial(userId: number) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const [updated] = await db
    .update(subscriptions)
    .set({
      trialEnd: yesterday,
      currentPeriodEnd: yesterday,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "free_trial")
      )
    )
    .returning();

  if (updated) {
    console.log(`✅ Expired free trial for user ${userId}`);
    console.log(`Trial end: ${updated.trialEnd}`);
    console.log(`Period end: ${updated.currentPeriodEnd}`);
  } else {
    console.log(`❌ No free trial found for user ${userId}`);
  }

  process.exit(0);
}

// Replace with your test user ID
const userId = 76; // ⬅️ CHANGE THIS
expireFreeTrial(userId);