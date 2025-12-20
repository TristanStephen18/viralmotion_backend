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

    const list = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      limit: 1,
    });

    if (list.data.length === 0) {
      console.log(`ℹ️ No subscriptions found in Stripe for user ${userId}`);
      return null;
    }

    const subId = list.data[0].id;
    const stripeSub = await stripe.subscriptions.retrieve(subId);

    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSub.id));

    if (existing) {
      console.log(`ℹ️ Subscription ${stripeSub.id} already in database`);
      return existing;
    }

    const subData = stripeSub as any;
    const periodStart = subData.current_period_start || subData.created;
    const periodEnd = subData.current_period_end;

    if (!periodStart || !periodEnd) {
      console.error("❌ Missing period timestamps");
      return null;
    }

    const toDate = (ts: any): Date | null => {
      if (!ts) return null;
      return new Date(Number(ts) * 1000);
    };

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

async function getActiveSubscription(userId: number) {
  const allSubs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt));

  return allSubs.find(
    (sub) =>
      sub.status === "active" ||
      sub.status === "trialing" ||
      sub.status === "free_trial"
  );
}

async function getLatestSubscription(userId: number) {
  const allSubs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt));

  return allSubs.find(
    (sub) =>
      sub.status === "active" ||
      sub.status === "trialing" ||
      sub.status === "free_trial"
  );
}

async function getPaidSubscription(userId: number) {
  const allSubs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt));

  return allSubs.find(
    (sub) => sub.status === "active" || sub.status === "trialing"
  );
}

// 1. CREATE CHECKOUT SESSION - NO TRIAL (user already had free trial)
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

    const existingPaidSubscription = await getPaidSubscription(userId);
    if (existingPaidSubscription) {
      return res.status(400).json({
        success: false,
        error: "You already have an active subscription",
      });
    }

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

    // ✅ NO TRIAL - User already had 7-day free trial
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

    console.log(
      `✅ Checkout session created for user ${userId} - NO TRIAL (already had free trial)`
    );

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

    if (!subscription && user.stripeCustomerId) {
      console.log(`🔄 No subscription in DB, syncing from Stripe...`);
      subscription = await syncSubscriptionFromStripe(
        user.id,
        user.stripeCustomerId
      );
    }

    const now = new Date();
    let hasSubscription = false;
    let trialExpired = false;

    if (subscription) {
      console.log(`📊 Found subscription for user ${user.id}:`, {
        status: subscription.status,
        trialEnd: subscription.trialEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
      });

      if (subscription.status === "free_trial") {
        const trialEnd = new Date(
          subscription.trialEnd || subscription.currentPeriodEnd
        );
        trialExpired = now > trialEnd;
        hasSubscription = !trialExpired;

        console.log(`🆓 Free trial status:`, {
          trialEnd: trialEnd.toISOString(),
          now: now.toISOString(),
          expired: trialExpired,
          hasAccess: hasSubscription,
        });
      } else {
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
      trialExpired,
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

    let subscription = await getActiveSubscription(userId);

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

    const formattedSubscription = {
      ...subscription,
      currentPeriodStart:
        subscription.currentPeriodStart?.toISOString() || null,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
      trialStart: subscription.trialStart?.toISOString() || null,
      trialEnd: subscription.trialEnd?.toISOString() || null,
      canceledAt: subscription.canceledAt?.toISOString() || null,
      createdAt:
        subscription.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt:
        subscription.updatedAt?.toISOString() || new Date().toISOString(),
    };

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
    if (!subscription || !subscription.stripeSubscriptionId) {
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
    if (
      !subscription ||
      !subscription.cancelAtPeriodEnd ||
      !subscription.stripeSubscriptionId
    ) {
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

    const existingPaidSubscription = await getPaidSubscription(userId);
    if (existingPaidSubscription) {
      return res.status(400).json({
        success: false,
        error: "You already have an active subscription",
      });
    }

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

// 8. CONFIRM SUBSCRIPTION - NO TRIAL (user already had free trial)
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

    console.log(
      `📝 Confirming subscription for user ${userId} - NO TRIAL (already had free trial)...`
    );

    // Check if user has existing free trial
    const [existingFreeTrial] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "free_trial")
        )
      )
      .limit(1);

    // Attach payment method
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.stripeCustomerId,
    });

    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    console.log(`💳 Payment method attached to customer`);

    // ✅ Create subscription WITHOUT trial - bill immediately
    const subscription = await stripe.subscriptions.create({
      customer: user.stripeCustomerId,
      items: [{ price: STRIPE_CONFIG.priceId }],
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: { userId: user.id.toString() },
    });

    // ✅ Type cast to access all properties
    const subData = subscription as any;

    console.log(`✅ Stripe subscription created: ${subscription.id}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Current period start: ${subData.current_period_start}`);
    console.log(`   Current period end: ${subData.current_period_end}`);

    // ✅ Validate dates before conversion
    if (!subData.current_period_start || !subData.current_period_end) {
      console.error(`❌ Missing period timestamps from Stripe`);
      console.error(
        `   Subscription object:`,
        JSON.stringify(subscription, null, 2)
      );
      return res.status(500).json({
        success: false,
        error: "Invalid subscription data from Stripe",
      });
    }

    const toDate = (ts: any): Date | null => {
      if (!ts) return null;
      const timestamp = Number(ts);
      if (isNaN(timestamp)) return null;
      return new Date(timestamp * 1000);
    };

    const currentPeriodStart = toDate(subData.current_period_start);
    const currentPeriodEnd = toDate(subData.current_period_end);

    // Validate Date objects
    if (
      !currentPeriodStart ||
      !currentPeriodEnd ||
      isNaN(currentPeriodStart.getTime()) ||
      isNaN(currentPeriodEnd.getTime())
    ) {
      console.error(`❌ Failed to convert timestamps to valid dates`);
      console.error(
        `   Start: ${subData.current_period_start} -> ${currentPeriodStart}`
      );
      console.error(
        `   End: ${subData.current_period_end} -> ${currentPeriodEnd}`
      );
      return res.status(500).json({
        success: false,
        error: "Failed to process subscription dates",
      });
    }

    console.log(`📅 Converted dates:`);
    console.log(`   Start: ${currentPeriodStart.toISOString()}`);
    console.log(`   End: ${currentPeriodEnd.toISOString()}`);

    // ✅ Wait 2 seconds for webhook to process
    console.log(`⏳ Waiting for webhook to process...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check if webhook already created/updated the subscription
    const [webhookCreated] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

    if (webhookCreated) {
      console.log(
        `✅ Webhook already processed subscription, using existing record`
      );

      return res.json({
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: currentPeriodEnd.toISOString(),
        },
      });
    }

    // Webhook hasn't processed yet, update/create ourselves
    if (existingFreeTrial) {
      console.log(`🔄 Converting free trial to paid subscription (API)`);

      await db
        .update(subscriptions)
        .set({
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: user.stripeCustomerId,
          stripePriceId: STRIPE_CONFIG.priceId,
          status: subscription.status as any,
          plan: "pro",
          currentPeriodStart,
          currentPeriodEnd,
          trialStart: null,
          trialEnd: null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, existingFreeTrial.id));

      console.log(`✅ Free trial converted to paid subscription`);
    } else {
      console.log(`✨ Creating new paid subscription (API)`);

      await db.insert(subscriptions).values({
        userId: user.id,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: user.stripeCustomerId,
        stripePriceId: STRIPE_CONFIG.priceId,
        status: subscription.status as any,
        plan: "pro",
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
        trialStart: null,
        trialEnd: null,
      });

      console.log(`✅ Subscription created in database`);
    }

    console.log(
      `✅ Subscription ${subscription.id} confirmed for user ${userId}`
    );

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: currentPeriodEnd.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("❌ Confirm subscription error:", error.message);
    console.error("   Stack:", error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
};
