import type { Request, Response } from "express";
import {
  stripe,
  STRIPE_CONFIG,
  getPriceId,
  getPlanFromPriceId,
} from "../../config/stripe.ts";
import { db } from "../../db/client.ts";
import { users, subscriptions } from "../../db/schema.ts";
import { eq, and, desc, sql } from "drizzle-orm";

interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

async function hasLifetimeAccess(userId: number): Promise<boolean> {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.isLifetime, true),
        sql`${subscriptions.status} IN ('lifetime', 'company')`
      )
    )
    .limit(1);

  return !!subscription;
}

async function getActiveSubscription(userId: number) {
  const allSubs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt));

  return allSubs.find((sub) => {
    if (sub.status === "lifetime" || sub.status === "company") {
      return sub.isLifetime === true;
    }
    return sub.status === "active";
  });
}

// ✅ NEW: Create checkout session with plan selection
export const createCheckoutSession = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const { plan } = req.body; // ✅ NEW: Get plan from request

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Validate plan
    if (!plan || !["starter", "pro", "team"].includes(plan)) {
      return res.status(400).json({
        success: false,
        error: "Invalid plan selected",
      });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Check if user already has a paid subscription
    const existingSubscription = await getActiveSubscription(userId);
    if (existingSubscription && !existingSubscription.isLifetime) {
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

    // ✅ Get the correct price ID based on plan
    const priceId = getPriceId(plan as "starter" | "pro" | "team");

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          userId: user.id.toString(),
          plan, // ✅ Store plan in metadata
        },
      },
      success_url: `${
        process.env.CLIENT_URL || process.env.FRONTEND_URL
      }/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        process.env.CLIENT_URL || process.env.FRONTEND_URL
      }/pricing`,
      metadata: {
        userId: user.id.toString(),
        plan, // ✅ Store plan
      },
    });

    console.log(
      `✅ Checkout session created for user ${userId} - ${plan} plan`
    );

    res.json({ success: true, url: session.url });
  } catch (error: any) {
    console.error("❌ Create checkout error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ UPDATED: Include plan in status
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

    console.log(
      `📊 Checking subscription status for user ${user.id} (${user.email})`
    );

    const isLifetime = await hasLifetimeAccess(user.id);

    if (isLifetime) {
      console.log(`✅ User ${user.id} has lifetime access`);
      return res.json({
        success: true,
        hasSubscription: true,
        status: "lifetime",
        plan: "lifetime",
        isLifetime: true,
      });
    }

    const subscription = await getActiveSubscription(user.id);

    // ✅ NEW: Users without subscription are on Free plan
    if (!subscription) {
      console.log(`ℹ️ User ${user.id} has no subscription - Free plan`);
      return res.json({
        success: true,
        hasSubscription: false,
        status: null,
        plan: "free", // ✅ Default to free
        isLifetime: false,
      });
    }

    res.json({
      success: true,
      hasSubscription: subscription.status === "active",
      status: subscription.status,
      plan: subscription.plan, // ✅ Include plan
      isLifetime: false,
    });
  } catch (error: any) {
    console.error("❌ Get subscription status error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Keep other functions (getSubscriptionDetails, createPortalSession, etc.) as they were
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
      isLifetime: subscription.isLifetime || false,
      isCompanyAccount: subscription.isCompanyAccount || false,
      companyName: subscription.companyName || null,
      specialNotes: subscription.specialNotes || null,
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

export const reactivateSubscription = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const subscription = await getActiveSubscription(userId);
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

// ✅ NEW: Create setup intent with plan selection
export const createSetupIntent = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { plan = "pro" } = req.body; // ✅ NEW: Default to pro

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const existingSubscription = await getActiveSubscription(userId);
    if (existingSubscription) {
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
      metadata: {
        userId: user.id.toString(),
        plan, // ✅ Store plan
      },
    });

    console.log(`✅ Setup intent created for user ${userId} - ${plan} plan`);

    res.json({
      success: true,
      clientSecret: setupIntent.client_secret,
      customerId: customerId,
      publishableKey: STRIPE_CONFIG.publishableKey,
      plan, // ✅ Send back to frontend
    });
  } catch (error: any) {
    console.error("❌ Create setup intent error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ NEW: Confirm subscription with plan
export const confirmSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { paymentMethodId, plan = "pro" } = req.body; // ✅ NEW

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    if (!paymentMethodId) {
      return res
        .status(400)
        .json({ success: false, error: "Payment method required" });
    }

    // Validate plan
    if (!["starter", "pro", "team"].includes(plan)) {
      return res.status(400).json({ success: false, error: "Invalid plan" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || !user.stripeCustomerId) {
      return res
        .status(404)
        .json({ success: false, error: "Customer not found" });
    }

    console.log(`📝 Confirming ${plan} subscription for user ${userId}...`);

    // Attach payment method
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.stripeCustomerId,
    });

    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // ✅ Get correct price ID
    const priceId = getPriceId(plan as "starter" | "pro" | "team");

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: user.stripeCustomerId,
      items: [{ price: priceId }],
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        userId: user.id.toString(),
        plan, // ✅ Store plan
      },
    });

    const subData = subscription as any;
    const subscriptionItem = subData.items?.data?.[0];

    let periodStart =
      subscriptionItem?.current_period_start ||
      subData.billing_cycle_anchor ||
      subData.created;
    let periodEnd = subscriptionItem?.current_period_end;

    if (!periodStart || !periodEnd) {
      console.error(`❌ Missing period timestamps from Stripe`);
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

    const currentPeriodStart = toDate(periodStart);
    const currentPeriodEnd = toDate(periodEnd);

    if (
      !currentPeriodStart ||
      !currentPeriodEnd ||
      isNaN(currentPeriodStart.getTime()) ||
      isNaN(currentPeriodEnd.getTime())
    ) {
      console.error(`❌ Failed to convert timestamps to valid dates`);
      return res.status(500).json({
        success: false,
        error: "Failed to process subscription dates",
      });
    }

    // Wait for webhook
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const [webhookCreated] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

    // ✅ NEW: Fetch invoice data (add this section)
    let invoiceData = null;
    try {
      const latestInvoiceId = subscription.latest_invoice;
      if (latestInvoiceId) {
        let invoiceId: string;

        // Handle if latest_invoice is an object or string
        if (typeof latestInvoiceId === "string") {
          invoiceId = latestInvoiceId;
        } else if (
          typeof latestInvoiceId === "object" &&
          latestInvoiceId !== null
        ) {
          invoiceId = (latestInvoiceId as any).id;
        } else {
          throw new Error("Invalid invoice ID format");
        }

        const invoice = await stripe.invoices.retrieve(invoiceId);

        invoiceData = {
          invoiceNumber: invoice.number || invoice.id,
          invoiceUrl: invoice.hosted_invoice_url,
          invoicePdf: invoice.invoice_pdf,
          amountPaid: invoice.amount_paid,
          currency: invoice.currency?.toUpperCase() || "USD",
        };

        console.log(`✅ Invoice data fetched: ${invoice.number}`);
      }
    } catch (invoiceError) {
      console.error("⚠️ Failed to fetch invoice (non-critical):", invoiceError);
      // Don't fail the whole request if invoice fetch fails
    }

    if (webhookCreated) {
      return res.json({
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          plan: webhookCreated.plan,
          currentPeriodEnd: currentPeriodEnd.toISOString(),
        },
      });
    }

    // Create subscription record
    await db.insert(subscriptions).values({
      userId: user.id,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: user.stripeCustomerId,
      stripePriceId: priceId,
      status: subscription.status as any,
      plan: plan, // ✅ Store plan
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
      trialStart: null,
      trialEnd: null,
    });

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: plan,
        currentPeriodEnd: currentPeriodEnd.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("❌ Confirm subscription error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getInvoiceHistory = async (req: AuthRequest, res: Response) => {
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

    console.log(`📄 Fetching invoice history for user ${userId}...`);

    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 20, // Last 20 invoices
    });

    // Format invoice data
    const formattedInvoices = invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number || invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency?.toUpperCase() || 'USD',
      status: invoice.status,
      paid: invoice.status === 'paid', // ✅ FIXED: Derive from status instead
      date: invoice.created,
      periodStart: invoice.period_start,
      periodEnd: invoice.period_end,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      description: invoice.lines.data[0]?.description || 'Subscription payment',
    }));

    console.log(`✅ Found ${formattedInvoices.length} invoices`);

    res.json({
      success: true,
      invoices: formattedInvoices,
    });
  } catch (error: any) {
    console.error("❌ Get invoice history error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
