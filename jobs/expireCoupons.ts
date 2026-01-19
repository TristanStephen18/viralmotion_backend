import { db } from "../db/client.ts";
import { subscriptions, users } from "../db/schema.ts";
import { sql, and, eq, lt } from "drizzle-orm";
import { createNotification } from "../services/notificationService.ts";

export const expireCoupons = async () => {
  console.log("🔍 Checking for expired coupons to process...");

  try {
    const now = new Date();

    // Find subscriptions with expired coupons
    const expiredCoupons = await db
      .select({
        subscription: subscriptions,
        user: users,
      })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .where(
        and(
          eq(subscriptions.isLifetime, true),
          eq(subscriptions.status, "lifetime"),
          sql`${subscriptions.specialNotes} LIKE '%Coupon:%'`,
          lt(subscriptions.currentPeriodEnd, now)
        )
      );

    console.log(`📊 Found ${expiredCoupons.length} expired coupons to process`);

    for (const { subscription, user } of expiredCoupons) {
      const userId = Number(user.id);
      const subscriptionId = subscription.id;

      console.log(`⏰ Processing expired coupon for user ${userId} (${user.email})`);

      // Parse original subscription data if exists
      let originalData: any = null;
      let hasOriginalSubscription = false;

      try {
        if (subscription.originalSubscriptionData) {
          originalData = JSON.parse(subscription.originalSubscriptionData);
          hasOriginalSubscription = true;
          console.log(`📦 Found original subscription data:`, {
            plan: originalData.plan,
            status: originalData.status,
            hasStripe: !!originalData.stripeSubscriptionId,
          });
        }
      } catch (parseError) {
        console.error("❌ Failed to parse original subscription:", parseError);
      }

      if (hasOriginalSubscription && originalData) {
        // ✅ SCENARIO 1: User had a subscription before coupon
        console.log(`🔄 Reverting user ${userId} to original ${originalData.plan} subscription`);

        await db
          .update(subscriptions)
          .set({
            // ✅ Restore ALL original data
            stripeSubscriptionId: originalData.stripeSubscriptionId || null,
            stripeCustomerId: originalData.stripeCustomerId || null,
            stripePriceId: originalData.stripePriceId || null,
            status: originalData.status as any,
            plan: originalData.plan as any,
            isLifetime: false,
            currentPeriodStart: new Date(originalData.currentPeriodStart),
            currentPeriodEnd: new Date(originalData.currentPeriodEnd),
            cancelAtPeriodEnd: originalData.cancelAtPeriodEnd || false,
            specialNotes: `[REVERTED] ${subscription.specialNotes}`,
            originalSubscriptionData: null, // Clear it
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscriptionId));

        // ✅ Send appropriate notification based on plan
        if (originalData.plan !== 'free' && originalData.stripeSubscriptionId) {
          // User had paid subscription
          await createNotification({
            userId,
            type: "subscription_restored",
            title: "🔄 Your Paid Subscription is Active",
            message: `Your coupon has expired, but your ${originalData.plan} subscription is still active! You haven't lost any access.`,
            metadata: {
              subscriptionId,
              restoredPlan: originalData.plan,
              couponExpiry: subscription.currentPeriodEnd,
            },
          });
          console.log(`✅ User ${userId} reverted to paid ${originalData.plan} plan`);
        } else {
          // User had free plan
          await createNotification({
            userId,
            type: "subscription_restored",
            title: "💳 Coupon Expired - Back to Free Plan",
            message: `Your promotional access has ended. Upgrade anytime to continue enjoying premium features!`,
            metadata: {
              subscriptionId,
              restoredPlan: "free",
              couponExpiry: subscription.currentPeriodEnd,
            },
          });
          console.log(`✅ User ${userId} reverted to free plan`);
        }
      } else {
        // ✅ SCENARIO 2: User had no subscription before coupon → Free plan
        console.log(`📉 Reverting user ${userId} to Free plan (no original subscription)`);

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
          .where(eq(subscriptions.id, subscriptionId));

        // Send notification
        await createNotification({
          userId,
          type: "coupon_expired_to_free",
          title: "💳 Coupon Expired - Now on Free Plan",
          message: `Your promotional access has ended and you've been moved to the Free Plan. Upgrade anytime to regain premium features!`,
          metadata: {
            subscriptionId,
            expiryDate: subscription.currentPeriodEnd,
            newPlan: "free",
          },
        });

        console.log(`✅ User ${userId} reverted to Free plan`);
      }
    }

    console.log("✅ Coupon expiration processing completed");
  } catch (error) {
    console.error("❌ Error processing expired coupons:", error);
  }
};