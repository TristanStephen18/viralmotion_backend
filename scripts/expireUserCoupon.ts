import { db } from "../db/client.ts";
import { subscriptions, users } from "../db/schema.ts";
import { eq, and, sql } from "drizzle-orm";
import { createNotification } from "../services/notificationService.ts";

async function expireUserCoupon(userId: number) {
  console.log(`\n🔍 Processing user ${userId}...\n`);

  try {
    // Get user and subscription
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      console.error(`❌ User ${userId} not found`);
      process.exit(1);
    }

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (!subscription) {
      console.error(`❌ No subscription found for user ${userId}`);
      process.exit(1);
    }

    // Show BEFORE state
    console.log("📊 BEFORE:");
    console.log(`   User: ${user.email}`);
    console.log(`   Plan: ${subscription.plan}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Is Lifetime: ${subscription.isLifetime}`);
    console.log(`   Expires: ${subscription.currentPeriodEnd}`);
    console.log(
      `   Original Data: ${subscription.originalSubscriptionData || "NULL"}`,
    );
    console.log(`   Notes: ${subscription.specialNotes || "NULL"}`);

    if (!subscription.isLifetime) {
      console.log("\n⚠️  User is not on a coupon subscription. Exiting.");
      process.exit(0);
    }

    // Parse original subscription if exists
    let originalData: any = null;
    let shouldRevertToOriginal = false;

    try {
      if (subscription.originalSubscriptionData) {
        originalData = JSON.parse(subscription.originalSubscriptionData);
        shouldRevertToOriginal = true;
      }
    } catch (parseError) {
      console.error("❌ Failed to parse original subscription:", parseError);
    }

    console.log("\n🔄 Processing expiry...\n");

    if (shouldRevertToOriginal && originalData) {
      // SCENARIO 1: Revert to original subscription
      console.log(`✅ Found original subscription: ${originalData.plan}`);

      await db
        .update(subscriptions)
        .set({
          stripeSubscriptionId: originalData.stripeSubscriptionId,
          stripeCustomerId: originalData.stripeCustomerId,
          stripePriceId: originalData.stripePriceId,
          status: originalData.status as any,
          plan: originalData.plan as any,
          isLifetime: false,
          currentPeriodStart: new Date(originalData.currentPeriodStart),
          currentPeriodEnd: new Date(originalData.currentPeriodEnd),
          cancelAtPeriodEnd: originalData.cancelAtPeriodEnd || false,
          specialNotes: `[REVERTED] ${subscription.specialNotes}`,
          originalSubscriptionData: null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription.id));

      // Send notification
      await createNotification({
        userId,
        type: "subscription_restored",
        title: "🔄 Subscription Restored",
        message: `Your coupon has expired, but we've restored your previous ${originalData.plan} subscription. You still have full access!`,
        metadata: {
          subscriptionId: subscription.id,
          restoredPlan: originalData.plan,
          expiryDate: subscription.currentPeriodEnd,
        },
      });

      console.log(`✅ Reverted to ${originalData.plan} plan`);
    } else {
      // SCENARIO 2: Revert to free plan
      console.log("⚠️  No original subscription found, reverting to FREE");

      await db
        .update(subscriptions)
        .set({
          stripeSubscriptionId: null,
          stripeCustomerId: null,
          stripePriceId: null,
          status: "canceled",
          plan: "free",
          isLifetime: false,
          cancelAtPeriodEnd: false,
          specialNotes: `[EXPIRED] ${subscription.specialNotes}`,
          originalSubscriptionData: null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription.id));

      // Send notification
      await createNotification({
        userId,
        type: "coupon_expired_to_free",
        title: "💳 Coupon Expired - Now on Free Plan",
        message: `Your promotional access has ended and you've been moved to the Free Plan. Upgrade anytime to regain premium features!`,
        metadata: {
          subscriptionId: subscription.id,
          expiryDate: subscription.currentPeriodEnd,
          newPlan: "free",
        },
      });

      console.log("✅ Reverted to FREE plan");
    }

    // Get AFTER state
    const [updatedSub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    console.log("\n📊 AFTER:");
    console.log(`   Plan: ${updatedSub.plan}`);
    console.log(`   Status: ${updatedSub.status}`);
    console.log(`   Is Lifetime: ${updatedSub.isLifetime}`);
    console.log(
      `   Stripe Sub ID: ${updatedSub.stripeSubscriptionId || "NULL"}`,
    ); // ✅ NEW
    console.log(`   Expires: ${updatedSub.currentPeriodEnd}`);
    console.log(
      `   Original Data: ${updatedSub.originalSubscriptionData || "NULL"}`,
    );
    console.log(`   Notes: ${updatedSub.specialNotes || "NULL"}`);

    console.log("\n✅ Done!\n");
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Get user ID from command line
const userId = parseInt(process.argv[2]);

if (!userId || isNaN(userId)) {
  console.error("\n❌ Usage: tsx scripts/expireUserCoupon.ts <user_id>\n");
  console.error("Example: tsx scripts/expireUserCoupon.ts 123\n");
  process.exit(1);
}

expireUserCoupon(userId);
