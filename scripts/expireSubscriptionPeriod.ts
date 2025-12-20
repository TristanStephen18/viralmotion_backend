import { db } from "../db/client.ts";
import { subscriptions } from "../db/schema.ts";
import { eq, and } from "drizzle-orm";

async function expireSubscriptionPeriod(userId: number) {
  try {
    console.log(`\n🔍 Looking for active subscription for user ${userId}...`);

    // Find the active paid subscription
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active")
        )
      )
      .limit(1);

    if (!subscription) {
      console.log(`❌ No active subscription found for user ${userId}`);
      console.log(`\n💡 Make sure the user has an active paid subscription.`);
      process.exit(1);
    }

    console.log(`\n✅ Found subscription:`);
    console.log(`   Subscription ID: ${subscription.id}`);
    console.log(`   Stripe ID: ${subscription.stripeSubscriptionId}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Current period end: ${subscription.currentPeriodEnd}`);
    console.log(`   Cancel at period end: ${subscription.cancelAtPeriodEnd}`);

    // Set period to expire yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const periodStart = new Date(subscription.currentPeriodEnd);
    periodStart.setDate(periodStart.getDate() - 30); // 30 days before end

    console.log(`\n⏰ Setting period to expire yesterday...`);
    console.log(`   New period start: ${periodStart.toISOString()}`);
    console.log(`   New period end: ${yesterday.toISOString()}`);

    const [updated] = await db
      .update(subscriptions)
      .set({
        currentPeriodStart: periodStart,
        currentPeriodEnd: yesterday,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id))
      .returning();

    if (updated) {
      console.log(`\n✅ Subscription period expired!`);
      console.log(`\n📊 Updated details:`);
      console.log(`   Period start: ${updated.currentPeriodStart}`);
      console.log(`   Period end: ${updated.currentPeriodEnd}`);
      console.log(`   Updated at: ${updated.updatedAt}`);

      if (subscription.cancelAtPeriodEnd) {
        console.log(`\n⚠️  WARNING: Subscription is set to cancel at period end!`);
        console.log(`   The subscription should now be canceled.`);
        console.log(`   You may need to manually update status to 'canceled'.`);
      } else {
        console.log(`\n💰 Subscription should auto-renew!`);
        console.log(`   In production, Stripe would:`);
        console.log(`   1. Charge the card $19.99`);
        console.log(`   2. Extend period by 30 days`);
        console.log(`   3. Send webhook: invoice.payment_succeeded`);
        console.log(`   4. Send webhook: customer.subscription.updated`);
      }

      console.log(`\n🧪 Next steps for testing:`);
      console.log(`   1. Try accessing the dashboard`);
      console.log(`   2. Check if subscription status is correct`);
      console.log(`   3. In production, Stripe would handle renewal automatically`);
    } else {
      console.log(`❌ Failed to update subscription`);
    }
  } catch (error: any) {
    console.error(`\n❌ Error:`, error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

// ========================================
// CONFIGURATION: Change this user ID
// ========================================
const USER_ID = 74; // ⬅️ CHANGE THIS to your test user ID

console.log(`\n${"=".repeat(50)}`);
console.log(`  EXPIRE SUBSCRIPTION PERIOD SCRIPT`);
console.log(`${"=".repeat(50)}`);

expireSubscriptionPeriod(USER_ID);