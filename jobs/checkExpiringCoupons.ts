import { db } from "../db/client.ts";
import { subscriptions, users } from "../db/schema.ts";
import { sql, and, eq, lte, gte } from "drizzle-orm";
import {
  createNotification,
  trackNotificationSent,
  hasNotificationBeenSent,
} from "../services/notificationService.ts";

export const checkExpiringCoupons = async () => {
  console.log("🔍 Checking for expiring coupons...");

  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const expiringSubscriptions = await db
      .select({
        subscription: subscriptions,
        user: users,
      })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .where(
        and(
          eq(subscriptions.isLifetime, true),
          sql`${subscriptions.specialNotes} LIKE '%Coupon:%'`,
          lte(subscriptions.currentPeriodEnd, sevenDaysFromNow),
          gte(subscriptions.currentPeriodEnd, now)
        )
      );

    console.log(
      `📊 Found ${expiringSubscriptions.length} subscriptions with expiring coupons`
    );

    for (const { subscription, user } of expiringSubscriptions) {
      const userId = Number(user.id);
      const subscriptionId = String(subscription.id); // ✅ UUID as string

      const expiryDate = new Date(subscription.currentPeriodEnd);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      console.log(
        `⏰ Subscription ${subscriptionId} expires in ${daysUntilExpiry} days`
      );

      // ✅ Stage 1: 7-day warning
      if (daysUntilExpiry <= 7 && daysUntilExpiry > 6) {
        const alreadySent = await hasNotificationBeenSent(
          userId,
          subscriptionId,
          "coupon_expiry_7days"
        );

        if (!alreadySent) {
          await createNotification({
            userId,
            type: "coupon_expiry",
            title: "⏰ Your Access Expires in 7 Days",
            message: `Your lifetime access will expire on ${expiryDate.toLocaleDateString(
              "en-US",
              {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            )}. Consider upgrading to continue enjoying premium features.`,
            metadata: {
              subscriptionId,
              expiryDate: subscription.currentPeriodEnd,
              couponCode: subscription.specialNotes,
              daysRemaining: daysUntilExpiry,
              urgencyLevel: "low",
            },
          });

          await trackNotificationSent(
            userId,
            subscriptionId,
            "coupon_expiry_7days",
            {
              daysRemaining: daysUntilExpiry,
            }
          );

          console.log(`✅ 7-day notification sent to user ${userId}`);
        }
      }

      // ✅ Stage 2: 3-day reminder
      if (daysUntilExpiry <= 3 && daysUntilExpiry > 2) {
        const alreadySent = await hasNotificationBeenSent(
          userId,
          subscriptionId,
          "coupon_expiry_3days"
        );

        if (!alreadySent) {
          await createNotification({
            userId,
            type: "coupon_expiry",
            title: "⚠️ Your Access Expires in 3 Days!",
            message: `URGENT: Your lifetime access expires on ${expiryDate.toLocaleDateString(
              "en-US",
              {
                weekday: "long",
                month: "long",
                day: "numeric",
              }
            )}. Don't lose access to your premium features—upgrade now!`,
            metadata: {
              subscriptionId,
              expiryDate: subscription.currentPeriodEnd,
              couponCode: subscription.specialNotes,
              daysRemaining: daysUntilExpiry,
              urgencyLevel: "medium",
            },
          });

          await trackNotificationSent(
            userId,
            subscriptionId,
            "coupon_expiry_3days",
            {
              daysRemaining: daysUntilExpiry,
            }
          );

          console.log(`✅ 3-day notification sent to user ${userId}`);
        }
      }

      // ✅ Stage 3: 1-day warning
      if (daysUntilExpiry <= 1 && daysUntilExpiry > 0) {
        const alreadySent = await hasNotificationBeenSent(
          userId,
          subscriptionId,
          "coupon_expiry_1day"
        );

        if (!alreadySent) {
          await createNotification({
            userId,
            type: "coupon_expiry",
            title: "🚨 FINAL WARNING: Access Expires Tomorrow!",
            message: `LAST CHANCE! Your lifetime access expires tomorrow (${expiryDate.toLocaleDateString(
              "en-US",
              {
                month: "long",
                day: "numeric",
              }
            )}). Take action now to avoid losing access to all premium features.`,
            metadata: {
              subscriptionId,
              expiryDate: subscription.currentPeriodEnd,
              couponCode: subscription.specialNotes,
              daysRemaining: daysUntilExpiry,
              urgencyLevel: "high",
            },
          });

          await trackNotificationSent(
            userId,
            subscriptionId,
            "coupon_expiry_1day",
            {
              daysRemaining: daysUntilExpiry,
            }
          );

          console.log(`✅ 1-day notification sent to user ${userId}`);
        }
      }

      // ✅ Stage 4: Day-of expiry
      if (daysUntilExpiry === 0) {
        const alreadySent = await hasNotificationBeenSent(
          userId,
          subscriptionId,
          "coupon_expired"
        );

        if (!alreadySent) {
          await createNotification({
            userId,
            type: "coupon_expiry",
            title: "💳 Your Access Has Expired - Now on Free Plan",
            message: `Your lifetime access has expired and your account has been reverted to the Free Plan. You can still use basic features, but premium features are now unavailable. Upgrade anytime to regain full access!`,
            metadata: {
              subscriptionId,
              expiryDate: subscription.currentPeriodEnd,
              couponCode: subscription.specialNotes,
              daysRemaining: 0,
              urgencyLevel: "expired",
              newPlan: "free",
            },
          });

          await trackNotificationSent(userId, subscriptionId, "coupon_expired", {
            daysRemaining: 0,
          });

          console.log(`✅ Expiry notification sent to user ${userId}`);
        }
      }
    }

    console.log("✅ Expiring coupons check completed");
  } catch (error) {
    console.error("❌ Error checking expiring coupons:", error);
  }
};