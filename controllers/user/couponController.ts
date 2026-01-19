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

    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        error: "This coupon is no longer active",
      });
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({
        success: false,
        error: "This coupon has expired",
      });
    }

    if (coupon.currentUses >= coupon.maxUses) {
      return res.status(400).json({
        success: false,
        error: "This coupon has reached its maximum usage limit",
      });
    }

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

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    const [existingSub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    // ✅ NEW: Check if user already has an active coupon
    if (existingSub?.isLifetime && existingSub.status === 'lifetime') {
      const couponEnd = new Date(existingSub.currentPeriodEnd);
      if (couponEnd > new Date()) {
        return res.status(400).json({
          success: false,
          error: "You already have an active coupon",
        });
      }
    }

    // ✅ NEW: Store original subscription data (including Stripe subscription)
    let originalSubscriptionData: string | null = null;

    if (existingSub && !existingSub.isLifetime) {
      // User has a subscription (free, paid, or expired) - store it
      originalSubscriptionData = JSON.stringify({
        stripeSubscriptionId: existingSub.stripeSubscriptionId,
        stripeCustomerId: existingSub.stripeCustomerId,
        stripePriceId: existingSub.stripePriceId,
        status: existingSub.status,
        plan: existingSub.plan,
        currentPeriodStart: existingSub.currentPeriodStart,
        currentPeriodEnd: existingSub.currentPeriodEnd,
        cancelAtPeriodEnd: existingSub.cancelAtPeriodEnd,
      });

      console.log(`📦 Storing original ${existingSub.plan} subscription for user ${userId}`);
      
      // ✅ CRITICAL: DO NOT cancel Stripe subscription!
      // The paid subscription continues running in the background
      // Coupon just gives temporary priority access
      
      if (existingSub.stripeSubscriptionId) {
        console.log(`✅ Keeping Stripe subscription active: ${existingSub.stripeSubscriptionId}`);
        console.log(`   User keeps their paid subscription while using coupon`);
      }
    }

    // Calculate coupon expiry
    const redemptionDate = new Date();
    const couponEndDate = new Date(redemptionDate);
    couponEndDate.setDate(couponEndDate.getDate() + coupon.durationDays);

    const subscriptionData = {
      userId,
      // ✅ KEEP Stripe data intact (don't set to null)
      stripeSubscriptionId: existingSub?.stripeSubscriptionId || null,
      stripeCustomerId: existingSub?.stripeCustomerId || null,
      stripePriceId: existingSub?.stripePriceId || null,
      status: "lifetime" as any,
      plan: "lifetime" as any,
      isLifetime: true,
      isCompanyAccount: false,
      companyName: null,
      specialNotes: `Coupon: ${coupon.code}${coupon.description ? ` - ${coupon.description}` : ""} (${coupon.durationDays} days access)`,
      grantedBy: coupon.createdBy,
      currentPeriodStart: redemptionDate,
      currentPeriodEnd: couponEndDate, // ✅ This is the coupon expiry
      cancelAtPeriodEnd: false,
      canceledAt: null,
      originalSubscriptionData, // ✅ Store original subscription
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

    await db.insert(couponRedemptions).values({
      couponId: coupon.id,
      userId,
    });

    await db
      .update(coupons)
      .set({
        currentUses: sql`${coupons.currentUses} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(coupons.id, coupon.id));

    console.log(`✅ Coupon ${coupon.code} redeemed by user ${userId} (${user.email})`);
    console.log(`   Coupon expires: ${couponEndDate.toISOString()}`);
    if (existingSub?.stripeSubscriptionId) {
      console.log(`   Stripe subscription kept active: ${existingSub.stripeSubscriptionId}`);
    }

    res.json({
      success: true,
      message: `Coupon redeemed successfully! You have ${coupon.durationDays} days of access.`,
      expiresAt: couponEndDate,
      durationDays: coupon.durationDays,
    });
  } catch (error: any) {
    console.error("❌ Redeem coupon error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to redeem coupon",
    });
  }
};