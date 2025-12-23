import type { Request, Response } from "express";
import { db } from "../../db/client.ts";
import { subscriptions, users } from "../../db/schema.ts";
import { eq, and } from "drizzle-orm";
import { stripe } from "../../config/stripe.ts"; // ✅ Import Stripe

interface AuthRequest extends Request {
  admin?: {
    id: number;
    email: string;
    role: string;
  };
}

// Grant lifetime access to a user
export const grantLifetimeAccess = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, companyName, notes } = req.body;
    const adminId = req.admin?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    console.log(
      `🌟 Granting lifetime access to user ${userId} by admin ${adminId}`
    );

    // Check if user already has a subscription
    const [existingSub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    // ✅ CRITICAL: Cancel Stripe subscription if it exists
    if (existingSub && existingSub.stripeSubscriptionId) {
      console.log(
        `🚫 Canceling existing Stripe subscription: ${existingSub.stripeSubscriptionId}`
      );

      try {
        await stripe.subscriptions.cancel(existingSub.stripeSubscriptionId);
        console.log(
          `✅ Stripe subscription ${existingSub.stripeSubscriptionId} canceled`
        );
      } catch (stripeError: any) {
        if (stripeError.code === "resource_missing") {
          console.log(`⚠️ Subscription not found in Stripe (already canceled)`);
        } else {
          console.error(`❌ Error canceling Stripe subscription:`, stripeError);
        }
      }
    }

    const lifetimeData = {
      userId: parseInt(userId as string, 10),
      stripeSubscriptionId: null,
      stripeCustomerId: null,
      stripePriceId: null,
      status: (companyName ? "company" : "lifetime") as any,
      plan: companyName ? "company" : "lifetime",
      isLifetime: true,
      isCompanyAccount: !!companyName,
      companyName: companyName || null,
      specialNotes: notes || null,
      grantedBy: adminId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date("2099-12-31"), // Never expires
      cancelAtPeriodEnd: false,
      canceledAt: existingSub?.stripeSubscriptionId ? new Date() : null, // ✅ Mark when canceled
      trialStart: null,
      trialEnd: null,
      updatedAt: new Date(),
    };

    if (existingSub) {
      // Update existing subscription
      await db
        .update(subscriptions)
        .set(lifetimeData)
        .where(eq(subscriptions.id, existingSub.id));

      console.log(
        `✅ Updated existing subscription to lifetime for user ${userId}`
      );
    } else {
      // Create new lifetime subscription
      await db.insert(subscriptions).values({
        ...lifetimeData,
        createdAt: new Date(),
      });

      console.log(`✅ Created new lifetime subscription for user ${userId}`);
    }

    res.json({
      success: true,
      message: `Lifetime access granted to user ${userId}. Stripe subscription canceled if it existed.`,
    });
  } catch (error: any) {
    console.error("❌ Grant lifetime access error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Revoke lifetime access from a user
// Revoke lifetime access from a user
export const revokeLifetimeAccess = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    console.log(`🚫 Revoking lifetime access from user ${userId}`);

    const [lifetimeSub] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, parseInt(userId as string, 10)),
          eq(subscriptions.isLifetime, true)
        )
      )
      .limit(1);

    if (!lifetimeSub) {
      return res.status(404).json({
        success: false,
        error: "No lifetime subscription found for this user",
      });
    }

    // ✅ CRITICAL FIX: Set isLifetime to false AND mark as canceled
    await db
      .update(subscriptions)
      .set({
        status: "canceled",
        isLifetime: false, // ✅ This is critical!
        isCompanyAccount: false, // ✅ Also reset this
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, lifetimeSub.id));

    console.log(`✅ Lifetime access revoked from user ${userId}`);

    res.json({
      success: true,
      message: `Lifetime access revoked from user ${userId}`,
    });
  } catch (error: any) {
    console.error("❌ Revoke lifetime access error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all lifetime accounts
export const getLifetimeAccounts = async (req: AuthRequest, res: Response) => {
  try {
    const lifetimeAccounts = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.isLifetime, true));

    res.json({
      success: true,
      accounts: lifetimeAccounts,
      total: lifetimeAccounts.length,
    });
  } catch (error: any) {
    console.error("❌ Get lifetime accounts error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
