import { db } from "../db/client.ts";
import { subscriptions, users } from "../db/schema.ts";
import { eq, and, isNotNull } from "drizzle-orm";

async function cleanupSubscription(userEmail: string) {
  try {
    console.log(`🧹 Cleaning up subscription for: ${userEmail}`);

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail));

    if (!user) {
      console.error(`❌ User not found: ${userEmail}`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name} (ID: ${user.id})`);

    // Delete paid subscriptions (keep free trial)
    const deleted = await db
      .delete(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, user.id),
          isNotNull(subscriptions.stripeSubscriptionId)
        )
      )
      .returning();

    if (deleted.length > 0) {
      console.log(`✅ Deleted ${deleted.length} subscription(s)`);
      deleted.forEach(sub => {
        console.log(`   - ${sub.stripeSubscriptionId} (${sub.status})`);
      });
    } else {
      console.log(`ℹ️ No paid subscriptions found to delete`);
    }

    // Check if free trial exists
    const [freeTrial] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, user.id),
          eq(subscriptions.status, "free_trial")
        )
      );

    if (freeTrial) {
      console.log(`\n✅ Free trial still exists:`);
      console.log(`   Trial End: ${freeTrial.trialEnd}`);
      console.log(`   Period End: ${freeTrial.currentPeriodEnd}`);
    } else {
      console.log(`\n⚠️ No free trial found - user will need to sign up again`);
    }

    console.log(`\n✅ Cleanup complete! User can now subscribe again.`);
  } catch (error: any) {
    console.error(`\n❌ Error:`, error.message);
    process.exit(1);
  }

  process.exit(0);
}

// ⬇️ CHANGE THIS
const userEmail = "launcejoshuadayao@gmail.com";

cleanupSubscription(userEmail);