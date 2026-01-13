import type { Request, Response } from "express";
import { db } from "../../db/client.ts";
import { coupons, couponRedemptions, subscriptions, users } from "../../db/schema.ts";
import { eq, and, sql } from "drizzle-orm";
import type { AuthRequest } from "../../utils/authmiddleware.ts";
import { stripe } from "../../config/stripe.ts";

export const redeemCoupon = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    const { code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({
        success: false,
        error: "Coupon code is required",
      });
    }

    const couponCode = code.toUpperCase().trim();

    // Get coupon
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, couponCode))
      .limit(1);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: "Invalid coupon code",
      });
    }

    // Check if active
    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        error: "This coupon is no longer active",
      });
    }

    // Check expiry
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({
        success: false,
        error: "This coupon has expired",
      });
    }

    // Check max uses
    if (coupon.currentUses >= coupon.maxUses) {
      return res.status(400).json({
        success: false,
        error: "This coupon has reached its maximum usage limit",
      });
    }

    // Check if user already redeemed
    const [existing] = await db
      .select()
      .from(couponRedemptions)
      .where(
        and(
          eq(couponRedemptions.couponId, coupon.id),
          eq(couponRedemptions.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return res.status(400).json({
        success: false,
        error: "You have already redeemed this coupon",
      });
    }

    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    // Check if user already has lifetime access
    const [existingSub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (existingSub?.isLifetime && existingSub.status !== 'canceled') {
      return res.status(400).json({
        success: false,
        error: "You already have lifetime access",
      });
    }

    // Cancel existing Stripe subscription if any
    if (existingSub?.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(existingSub.stripeSubscriptionId);
        console.log(`✅ Canceled Stripe subscription for coupon redemption`);
      } catch (stripeError: any) {
        if (stripeError.code !== "resource_missing") {
          console.error(`❌ Error canceling Stripe subscription:`, stripeError);
        }
      }
    }

    // Create/update subscription with coupon access
    const expiryDate = coupon.expiryDate || new Date("2099-12-31");

    const subscriptionData = {
      userId,
      stripeSubscriptionId: null,
      stripeCustomerId: null,
      stripePriceId: null,
      status: "lifetime" as any,
      plan: "lifetime" as any,
      isLifetime: true,
      isCompanyAccount: false,
      companyName: null,
      specialNotes: `Coupon: ${coupon.code}${coupon.description ? ` - ${coupon.description}` : ""}`,
      grantedBy: coupon.createdBy,
      currentPeriodStart: new Date(),
      currentPeriodEnd: expiryDate,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      updatedAt: new Date(),
    };

    if (existingSub) {
      await db
        .update(subscriptions)
        .set(subscriptionData)
        .where(eq(subscriptions.id, existingSub.id));
    } else {
      await db.insert(subscriptions).values({
        ...subscriptionData,
        createdAt: new Date(),
      });
    }

    // Record redemption
    await db.insert(couponRedemptions).values({
      couponId: coupon.id,
      userId,
    });

    // Increment coupon usage
    await db
      .update(coupons)
      .set({
        currentUses: sql`${coupons.currentUses} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(coupons.id, coupon.id));

    console.log(`✅ Coupon ${coupon.code} redeemed by user ${userId} (${user.email})`);

    res.json({
      success: true,
      message: "Coupon redeemed successfully! You now have unlimited access.",
      expiresAt: expiryDate,
      neverExpires: !coupon.expiryDate,
    });
  } catch (error: any) {
    console.error("❌ Redeem coupon error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to redeem coupon",
    });
  }
};