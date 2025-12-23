import type { Request, Response } from "express";
import { db } from "../../db/client.ts";
import { subscriptions, users } from "../../db/schema.ts";
import { eq, and } from "drizzle-orm";
import { stripe } from "../../config/stripe.ts"; // ✅ Import Stripe
import { logAdminAction, ADMIN_ACTIONS } from "../../utils/auditLogger.ts";

interface AuthRequest extends Request {
  admin?: {
    id: number;
    email: string;
    role: string;
  };
}

// ✅ UPDATED: Grant lifetime access with audit logging
export const grantLifetimeAccess = async (req: AuthRequest, res: Response) => {
  const adminId = req.admin?.id;

  try {
    const { userId, companyName, notes } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    console.log(`🌟 Admin ${adminId} granting lifetime access to user ${userId}`);

    // Get user email for logging
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(userId as string, 10)))
      .limit(1);

    if (!user) {
      await logAdminAction(req as any, {
        adminId: adminId!,
        action: ADMIN_ACTIONS.GRANT_LIFETIME_FAILED,
        targetType: "USER",
        targetId: parseInt(userId as string, 10),
        status: "FAILED",
        errorMessage: "User not found",
      });

      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Check if user already has a subscription
    const [existingSub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    // Cancel Stripe subscription if it exists
    if (existingSub && existingSub.stripeSubscriptionId) {
      console.log(`🚫 Canceling Stripe subscription: ${existingSub.stripeSubscriptionId}`);

      try {
        await stripe.subscriptions.cancel(existingSub.stripeSubscriptionId);
        console.log(`✅ Stripe subscription ${existingSub.stripeSubscriptionId} canceled`);
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
      currentPeriodEnd: new Date("2099-12-31"),
      cancelAtPeriodEnd: false,
      canceledAt: existingSub?.stripeSubscriptionId ? new Date() : null,
      trialStart: null,
      trialEnd: null,
      updatedAt: new Date(),
    };

    if (existingSub) {
      await db
        .update(subscriptions)
        .set(lifetimeData)
        .where(eq(subscriptions.id, existingSub.id));
    } else {
      await db.insert(subscriptions).values({
        ...lifetimeData,
        createdAt: new Date(),
      });
    }

    // ✅ Log successful grant
    await logAdminAction(req as any, {
      adminId: adminId!,
      action: ADMIN_ACTIONS.GRANT_LIFETIME,
      targetType: "USER",
      targetId: parseInt(userId as string, 10),
      targetEmail: user.email,
      status: "SUCCESS",
      details: {
        accountType: companyName ? "Company" : "Personal",
        companyName: companyName || null,
        hadPreviousSubscription: !!existingSub,
        previousStatus: existingSub?.status,
        canceledStripeSubscription: !!existingSub?.stripeSubscriptionId,
      },
    });

    console.log(`✅ Lifetime access granted to user ${userId} by admin ${adminId}`);

    res.json({
      success: true,
      message: `Lifetime access granted. ${existingSub?.stripeSubscriptionId ? "Stripe subscription canceled." : ""}`,
    });
  } catch (error: any) {
    console.error("❌ Grant lifetime access error:", error);

    // ✅ Log failed grant
    await logAdminAction(req as any, {
      adminId: adminId!,
      action: ADMIN_ACTIONS.GRANT_LIFETIME_FAILED,
      targetType: "USER",
      targetId: parseInt(req.body.userId as string, 10),
      status: "FAILED",
      errorMessage: error.message,
    });

    res.status(500).json({ success: false, error: "Failed to grant lifetime access" });
  }
};

// Revoke lifetime access from a user
// ✅ UPDATED: Revoke lifetime access with audit logging
export const revokeLifetimeAccess = async (req: AuthRequest, res: Response) => {
  const adminId = req.admin?.id;

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    console.log(`🚫 Admin ${adminId} revoking lifetime access from user ${userId}`);

    // Get user email for logging
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(userId as string, 10)))
      .limit(1);

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
      await logAdminAction(req as any, {
        adminId: adminId!,
        action: ADMIN_ACTIONS.REVOKE_LIFETIME_FAILED,
        targetType: "USER",
        targetId: parseInt(userId as string, 10),
        targetEmail: user?.email,
        status: "FAILED",
        errorMessage: "No lifetime subscription found",
      });

      return res.status(404).json({
        success: false,
        error: "No lifetime subscription found for this user",
      });
    }

    // Revoke lifetime access
    await db
      .update(subscriptions)
      .set({
        status: "canceled",
        isLifetime: false,
        isCompanyAccount: false,
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, lifetimeSub.id));

    // ✅ Log successful revoke
    await logAdminAction(req as any, {
      adminId: adminId!,
      action: ADMIN_ACTIONS.REVOKE_LIFETIME,
      targetType: "USER",
      targetId: parseInt(userId as string, 10),
      targetEmail: user?.email,
      status: "SUCCESS",
      details: {
        previousAccountType: lifetimeSub.isCompanyAccount ? "Company" : "Personal",
        companyName: lifetimeSub.companyName,
      },
    });

    console.log(`✅ Lifetime access revoked from user ${userId} by admin ${adminId}`);

    res.json({
      success: true,
      message: `Lifetime access revoked from user ${userId}`,
    });
  } catch (error: any) {
    console.error("❌ Revoke lifetime access error:", error);

    // ✅ Log failed revoke
    await logAdminAction(req as any, {
      adminId: adminId!,
      action: ADMIN_ACTIONS.REVOKE_LIFETIME_FAILED,
      targetType: "USER",
      targetId: parseInt(req.body.userId as string, 10),
      status: "FAILED",
      errorMessage: error.message,
    });

    res.status(500).json({ success: false, error: "Failed to revoke lifetime access" });
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
