import type { Request, Response } from "express";
import { stripe, STRIPE_CONFIG } from "../../config/stripe.ts";
import { db } from "../../db/client.ts";
import { users, subscriptions } from "../../db/schema.ts";
import { eq, and, desc } from "drizzle-orm";

interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

async function syncSubscriptionFromStripe(
  userId: number,
  stripeCustomerId: string
) {
  try {
    console.log(`🔄 Syncing subscription from Stripe for user ${userId}...`);

    // List subscriptions
    const list = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      limit: 1,
    });

    if (list.data.length === 0) {
      console.log(`ℹ️ No subscriptions found in Stripe for user ${userId}`);
      return null;
    }

    const subId = list.data[0].id;

    // Retrieve full subscription
    const stripeSub = await stripe.subscriptions.retrieve(subId);

    // Check if already in database
    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSub.id));

    if (existing) {
      console.log(`ℹ️ Subscription ${stripeSub.id} already in database`);
      return existing;
    }

    const subData = stripeSub as any;

    console.log("📊 Subscription data:");
    console.log("  Status:", subData.status);
    console.log("  trial_start:", subData.trial_start);
    console.log("  trial_end:", subData.trial_end);
    console.log("  current_period_start:", subData.current_period_start);
    console.log("  current_period_end:", subData.current_period_end);

    // ✅ For trialing subscriptions, use trial dates as current period
    let periodStart, periodEnd;

    if (subData.status === "trialing") {
      // Use trial dates
      if (!subData.trial_start || !subData.trial_end) {
        console.error("❌ Missing trial timestamps for trialing subscription");
        return null;
      }
      periodStart = subData.trial_start;
      periodEnd = subData.trial_end;
      console.log("✅ Using trial period as current period");
    } else {
      // Use billing period
      if (!subData.current_period_start || !subData.current_period_end) {
        console.error("❌ Missing period timestamps for active subscription");
        return null;
      }
      periodStart = subData.current_period_start;
      periodEnd = subData.current_period_end;
      console.log("✅ Using billing period");
    }

    // Safe date conversion
    const toDate = (ts: any): Date | null => {
      if (!ts) return null;
      return new Date(Number(ts) * 1000);
    };

    // Create subscription record
    const [newSub] = await db
      .insert(subscriptions)
      .values({
        userId,
        stripeSubscriptionId: subData.id,
        stripeCustomerId:
          typeof subData.customer === "string"
            ? subData.customer
            : subData.customer?.id || stripeCustomerId,
        stripePriceId: subData.items?.data?.[0]?.price?.id || "",
        status: subData.status,
        plan: "pro",
        currentPeriodStart: toDate(periodStart)!,
        currentPeriodEnd: toDate(periodEnd)!,
        cancelAtPeriodEnd: subData.cancel_at_period_end || false,
        canceledAt: toDate(subData.canceled_at),
        trialStart: toDate(subData.trial_start),
        trialEnd: toDate(subData.trial_end),
      })
      .returning();

    console.log(`✅ Synced subscription ${subData.id} for user ${userId}`);
    return newSub;
  } catch (error: any) {
    console.error("❌ Sync error:", error);
    return null;
  }
}

// Helper: Get active subscription for user
async function getActiveSubscription(userId: number) {
  const allSubs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt));

  // ✅ FIXED: Include free_trial status
  return allSubs.find(sub => 
    sub.status === 'active' || 
    sub.status === 'trialing' ||
    sub.status === 'free_trial'  // ✅ ADDED
  );
}

// Helper: Get latest subscription (any status)
async function getLatestSubscription(userId: number) {
  const allSubs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt));

  // Return the first subscription that is active, trialing, or free_trial
  return allSubs.find(
    (sub) =>
      sub.status === "active" ||
      sub.status === "trialing" ||
      sub.status === "free_trial" // ✅ NEW: Include free trials
  );
}

// 1. CREATE CHECKOUT SESSION
export const createCheckoutSession = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Check if user already has active subscription
    const existingSubscription = await getActiveSubscription(userId);
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        error: "You already have an active subscription",
      });
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.id.toString() },
      });
      customerId = customer.id;

      await db
        .update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, userId));
    }

    // Create checkout session with 7-day trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: STRIPE_CONFIG.priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: STRIPE_CONFIG.trialDays,
        metadata: { userId: user.id.toString() },
      },
      success_url: `${
        process.env.CLIENT_URL || process.env.FRONTEND_URL
      }/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        process.env.CLIENT_URL || process.env.FRONTEND_URL
      }/pricing`,
      metadata: { userId: user.id.toString() },
    });

    res.json({ success: true, url: session.url });
  } catch (error: any) {
    console.error("❌ Create checkout error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. GET SUBSCRIPTION STATUS
export const getSubscriptionStatus = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;

    if (!authUser) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.userId));

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    let subscription = await getLatestSubscription(user.id);

    // Auto-sync if no subscription in DB but user has Stripe customer ID
    if (!subscription && user.stripeCustomerId) {
      console.log(`🔄 No subscription in DB, syncing from Stripe...`);
      subscription = await syncSubscriptionFromStripe(
        user.id,
        user.stripeCustomerId
      );
    }

    // ✅ NEW: Check subscription status including free trials
    const now = new Date();
    let hasSubscription = false;
    let trialExpired = false;

    if (subscription) {
      console.log(`📊 Found subscription for user ${user.id}:`, {
        status: subscription.status,
        trialEnd: subscription.trialEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
      });

      // Check if it's a free trial
      if (subscription.status === "free_trial") {
        const trialEnd = new Date(
          subscription.trialEnd || subscription.currentPeriodEnd
        );
        trialExpired = now > trialEnd;
        hasSubscription = !trialExpired; // Has access only if trial hasn't expired

        console.log(`🆓 Free trial status:`, {
          trialEnd: trialEnd.toISOString(),
          now: now.toISOString(),
          expired: trialExpired,
          hasAccess: hasSubscription,
        });
      } else {
        // Paid subscription or trialing
        hasSubscription =
          subscription.status === "active" ||
          subscription.status === "trialing";

        console.log(`💳 Paid subscription status:`, {
          status: subscription.status,
          hasAccess: hasSubscription,
        });
      }
    } else {
      console.log(`❌ No subscription found for user ${user.id}`);
    }

    res.json({
      success: true,
      hasSubscription,
      status: subscription?.status || null,
      trialExpired, // Tell frontend if trial expired
    });
  } catch (error: any) {
    console.error("❌ Get subscription status error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. GET SUBSCRIPTION DETAILS
export const getSubscriptionDetails = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // First try to get from database
    let subscription = await getActiveSubscription(userId);

    // If not found, try syncing from Stripe
    if (!subscription) {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (user && user.stripeCustomerId) {
        await syncSubscriptionFromStripe(userId, user.stripeCustomerId);
        subscription = await getActiveSubscription(userId);
      }
    }

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: "No subscription found",
      });
    }

    // ✅ Format dates properly for frontend
    const formattedSubscription = {
      ...subscription,
      // Convert Date objects to ISO strings
      currentPeriodStart:
        subscription.currentPeriodStart?.toISOString() || null,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
      trialStart: subscription.trialStart?.toISOString() || null,
      trialEnd: subscription.trialEnd?.toISOString() || null,
      canceledAt: subscription.canceledAt?.toISOString() || null,
      createdAt:
        subscription.createdAt?.toISOString() || new Date().toISOString(), // ✅ Fallback to now
      updatedAt:
        subscription.updatedAt?.toISOString() || new Date().toISOString(), // ✅ Fallback to now
    };

    console.log("📊 Subscription details:", formattedSubscription); // ✅ Debug log

    res.json({
      success: true,
      subscription: formattedSubscription,
    });
  } catch (error: any) {
    console.error("❌ Get subscription details error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 4. CREATE BILLING PORTAL SESSION
export const createPortalSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({
        success: false,
        error: "No Stripe customer found",
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${
        process.env.FRONTEND_URL || process.env.CLIENT_URL
      }/profile`,
    });

    res.json({ success: true, url: session.url });
  } catch (error: any) {
    console.error("❌ Create portal session error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 5. CANCEL SUBSCRIPTION
export const cancelSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const subscription = await getActiveSubscription(userId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: "No active subscription found",
      });
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await db
      .update(subscriptions)
      .set({
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));

    res.json({
      success: true,
      message: "Subscription will cancel at period end",
    });
  } catch (error: any) {
    console.error("❌ Cancel subscription error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 6. REACTIVATE SUBSCRIPTION
export const reactivateSubscription = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const subscription = await getLatestSubscription(userId);
    if (!subscription || !subscription.cancelAtPeriodEnd) {
      return res.status(400).json({
        success: false,
        error: "Subscription is not scheduled for cancellation",
      });
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await db
      .update(subscriptions)
      .set({
        cancelAtPeriodEnd: false,
        canceledAt: null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));

    res.json({
      success: true,
      message: "Subscription reactivated",
    });
  } catch (error: any) {
    console.error("❌ Reactivate subscription error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 7. CREATE SETUP INTENT FOR EMBEDDED PAYMENT FORM
export const createSetupIntent = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Check if user already has active subscription
    const existingSubscription = await getActiveSubscription(userId);
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        error: "You already have an active subscription",
      });
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.id.toString() },
      });
      customerId = customer.id;

      await db
        .update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, userId));
    }

    // Create Setup Intent for saving card
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      metadata: { userId: user.id.toString() },
    });

    console.log(`✅ Setup intent created for user ${userId}`);

    res.json({
      success: true,
      clientSecret: setupIntent.client_secret,
      customerId: customerId,
      publishableKey: STRIPE_CONFIG.publishableKey,
    });
  } catch (error: any) {
    console.error("❌ Create setup intent error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 8. CONFIRM SUBSCRIPTION AFTER PAYMENT METHOD SAVED
export const confirmSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { paymentMethodId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    if (!paymentMethodId) {
      return res
        .status(400)
        .json({ success: false, error: "Payment method required" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || !user.stripeCustomerId) {
      return res
        .status(404)
        .json({ success: false, error: "Customer not found" });
    }

    console.log(`📝 Confirming subscription for user ${userId}...`);

    // ✅ NEW: Check if user has existing free trial
    const existingFreeTrial = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "free_trial")
        )
      )
      .limit(1);

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.stripeCustomerId,
    });

    // Set as default payment method
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create subscription with trial
    const subscription = await stripe.subscriptions.create({
      customer: user.stripeCustomerId,
      items: [{ price: STRIPE_CONFIG.priceId }],
      trial_period_days: STRIPE_CONFIG.trialDays,
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: { userId: user.id.toString() },
    });

    const subData = subscription as any;
    const periodStart =
      subData.status === "trialing" && subData.trial_start
        ? subData.trial_start
        : subData.current_period_start || subData.trial_start;

    const periodEnd =
      subData.status === "trialing" && subData.trial_end
        ? subData.trial_end
        : subData.current_period_end || subData.trial_end;

    const toDate = (ts: any): Date | null => {
      if (!ts) return null;
      return new Date(Number(ts) * 1000);
    };

    // ✅ NEW: If free trial exists, update it instead of inserting
    if (existingFreeTrial.length > 0) {
      console.log(
        `🔄 Converting free trial to paid subscription for user ${userId}`
      );

      await db
        .update(subscriptions)
        .set({
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: user.stripeCustomerId,
          stripePriceId: STRIPE_CONFIG.priceId,
          status: subscription.status as any,
          plan: "pro",
          currentPeriodStart: toDate(periodStart)!,
          currentPeriodEnd: toDate(periodEnd)!,
          trialStart: toDate(subData.trial_start),
          trialEnd: toDate(subData.trial_end),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, existingFreeTrial[0].id));
    } else {
      // No free trial, create new subscription
      await db.insert(subscriptions).values({
        userId: user.id,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: user.stripeCustomerId,
        stripePriceId: STRIPE_CONFIG.priceId,
        status: subscription.status as any,
        plan: "pro",
        currentPeriodStart: toDate(periodStart)!,
        currentPeriodEnd: toDate(periodEnd)!,
        cancelAtPeriodEnd: false,
        trialStart: toDate(subData.trial_start),
        trialEnd: toDate(subData.trial_end),
      });
    }

    console.log(
      `✅ Subscription ${subscription.id} created/updated for user ${userId}`
    );

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        trialEnd: subData.trial_end
          ? new Date(subData.trial_end * 1000).toISOString()
          : null,
        currentPeriodEnd: new Date(periodEnd * 1000).toISOString(),
      },
    });
  } catch (error: any) {
    console.error("❌ Confirm subscription error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
