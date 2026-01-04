import type { Request, Response } from "express";
import Stripe from "stripe";
import { stripe, STRIPE_CONFIG, getPlanFromPriceId } from "../../config/stripe.ts";
import { db } from "../../db/client.ts";
import { subscriptions } from "../../db/schema.ts";
import { eq } from "drizzle-orm";

function safeTimestampToDate(timestamp: any): Date | null {
  if (!timestamp) return null;
  const ts = Number(timestamp);
  if (isNaN(ts) || ts <= 0) return null;
  const date = new Date(ts * 1000);
  if (isNaN(date.getTime())) return null;
  return date;
}

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("❌ No stripe-signature header");
    return res.status(400).send("No signature");
  }

  // ✅ LOG: Check if body is raw
  console.log("🔍 Webhook request details:");
  console.log("   - Body type:", typeof req.body);
  console.log("   - Body is Buffer:", Buffer.isBuffer(req.body));
  console.log("   - Signature present:", !!sig);

  console.log("\n🐛 ============ WEBHOOK DEBUG ============");
  console.log("Request URL:", req.url);
  console.log("Request path:", req.path);
  console.log("Body type:", typeof req.body);
  console.log("Body is Buffer:", Buffer.isBuffer(req.body));
  console.log("Body is Object:", typeof req.body === 'object' && !Buffer.isBuffer(req.body));
  console.log("Body length:", req.body?.length);
  console.log("Headers:", {
    'content-type': req.headers['content-type'],
    'stripe-signature': req.headers['stripe-signature']?.substring(0, 20) + '...',
  });
  console.log("Webhook secret:", STRIPE_CONFIG.webhookSecret.substring(0, 20) + '...');
  console.log("============ END DEBUG ============\n");

  let event: Stripe.Event;

  try {
    // ✅ CRITICAL: req.body MUST be a Buffer (from express.raw())
    event = stripe.webhooks.constructEvent(
      req.body, // This should be a Buffer
      sig,
      STRIPE_CONFIG.webhookSecret
    );
    
    console.log(`✅ Webhook verified: ${event.type}`);
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    console.error("   - Webhook secret used:", STRIPE_CONFIG.webhookSecret.substring(0, 15) + "...");
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`🔔 Processing webhook: ${event.type}`);

  try {
    switch (event.type) {
      // ... rest of your existing switch cases stay the same ...
      
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId && session.subscription) {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;

          const stripeSubscription = await stripe.subscriptions.retrieve(
            subscriptionId
          );
          const subData = stripeSubscription as any;

          const stripePriceId = stripeSubscription.items.data[0].price.id;
          const plan = getPlanFromPriceId(stripePriceId) || 'pro';

          const periodStart = subData.current_period_start || subData.created;
          const periodEnd = subData.current_period_end;

          if (!periodStart || !periodEnd) {
            console.error("❌ Cannot determine period dates for subscription");
            break;
          }

          const periodStartDate = safeTimestampToDate(periodStart);
          const periodEndDate = safeTimestampToDate(periodEnd);

          if (!periodStartDate || !periodEndDate) {
            console.error("❌ Invalid period dates");
            break;
          }

          await db.insert(subscriptions).values({
            userId: parseInt(userId, 10),
            stripeSubscriptionId: stripeSubscription.id,
            stripeCustomerId:
              typeof stripeSubscription.customer === "string"
                ? stripeSubscription.customer
                : stripeSubscription.customer?.id || "",
            stripePriceId: stripeSubscription.items.data[0].price.id,
            status: stripeSubscription.status as any,
            plan: plan,
            currentPeriodStart: periodStartDate,
            currentPeriodEnd: periodEndDate,
            cancelAtPeriodEnd: subData.cancel_at_period_end || false,
            trialStart: null,
            trialEnd: null,
          });

          console.log(`✅ ${plan} subscription created for user ${userId}`);
        }
        break;
      }

      case "customer.subscription.created": {
        const stripeSubscription = event.data.object as Stripe.Subscription;
        const subData = stripeSubscription as any;

        console.log(`📦 Subscription created: ${stripeSubscription.id}`);

        const userId = subData.metadata?.userId;

        if (!userId) {
          console.log(`⚠️ No userId in metadata, skipping`);
          break;
        }

        const stripePriceId = stripeSubscription.items.data[0].price.id;
        const plan = getPlanFromPriceId(stripePriceId) || 'pro';

        console.log(`   User: ${userId}, Plan: ${plan}, Status: ${stripeSubscription.status}`);

        // Check if already exists
        const [existing] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id));

        if (existing) {
          console.log(`ℹ️ Subscription already exists, skipping`);
          break;
        }

        // Extract dates
        const subscriptionItem = subData.items?.data?.[0];
        const periodStartRaw = subscriptionItem?.current_period_start || subData.billing_cycle_anchor || subData.created;
        const periodEndRaw = subscriptionItem?.current_period_end;

        let periodStart: Date | null = null;
        let periodEnd: Date | null = null;

        try {
          if (periodStartRaw) {
            periodStart = new Date(Number(periodStartRaw) * 1000);
          }
          if (periodEndRaw) {
            periodEnd = new Date(Number(periodEndRaw) * 1000);
          }
        } catch (dateError: any) {
          console.error(`❌ Error converting dates:`, dateError.message);
        }

        if (!periodStart || !periodEnd || isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
          console.error(`❌ Invalid period dates`);
          break;
        }

        // Create subscription
        await db.insert(subscriptions).values({
          userId: parseInt(userId, 10),
          stripeSubscriptionId: stripeSubscription.id,
          stripeCustomerId:
            typeof stripeSubscription.customer === "string"
              ? stripeSubscription.customer
              : stripeSubscription.customer?.id || "",
          stripePriceId: stripeSubscription.items.data[0].price.id,
          status: stripeSubscription.status as any,
          plan: plan,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: subData.cancel_at_period_end || false,
          trialStart: null,
          trialEnd: null,
        });

        console.log(`✅ ${plan} subscription created in database`);
        break;
      }

      case "customer.subscription.updated": {
        const stripeSubscription = event.data.object as Stripe.Subscription;
        const subData = stripeSubscription as any;

        console.log(`📝 Updating subscription: ${stripeSubscription.id}`);

        const [existingSubscription] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id));

        if (!existingSubscription) {
          console.log(`⚠️ Subscription not found in database`);
          break;
        }

        if (existingSubscription.isLifetime) {
          console.log(`⏭️ Ignoring webhook for lifetime user`);
          break;
        }

        const updateData: any = {
          status: stripeSubscription.status as any,
          updatedAt: new Date(),
        };

        const subscriptionItem = subData.items?.data?.[0];
        const periodStartRaw = subscriptionItem?.current_period_start;
        const periodEndRaw = subscriptionItem?.current_period_end;

        if (periodStartRaw) {
          const periodStart = new Date(Number(periodStartRaw) * 1000);
          if (!isNaN(periodStart.getTime())) {
            updateData.currentPeriodStart = periodStart;
          }
        }

        if (periodEndRaw) {
          const periodEnd = new Date(Number(periodEndRaw) * 1000);
          if (!isNaN(periodEnd.getTime())) {
            updateData.currentPeriodEnd = periodEnd;
          }
        }

        if (subData.cancel_at_period_end !== undefined) {
          updateData.cancelAtPeriodEnd = Boolean(subData.cancel_at_period_end);
        }

        const canceledAt = safeTimestampToDate(subData.canceled_at);
        if (canceledAt) {
          updateData.canceledAt = canceledAt;
        } else if (subData.canceled_at === null) {
          updateData.canceledAt = null;
        }

        await db
          .update(subscriptions)
          .set(updateData)
          .where(eq(subscriptions.id, existingSubscription.id));

        console.log(`✅ Subscription updated`);
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSubscription = event.data.object as Stripe.Subscription;

        const [existingSubscription] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id));

        if (existingSubscription) {
          if (existingSubscription.isLifetime) {
            console.log(`⏭️ Ignoring deletion webhook for lifetime user`);
            break;
          }

          await db
            .update(subscriptions)
            .set({
              status: "canceled",
              canceledAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, existingSubscription.id));

          console.log(`❌ Subscription canceled`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription;

        if (subscriptionId && typeof subscriptionId === "string") {
          const [existingSubscription] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

          if (existingSubscription) {
            if (existingSubscription.isLifetime) {
              console.log(`⏭️ Ignoring payment webhook for lifetime user`);
              break;
            }

            if (existingSubscription.status === "past_due") {
              await db
                .update(subscriptions)
                .set({
                  status: "active",
                  updatedAt: new Date(),
                })
                .where(eq(subscriptions.id, existingSubscription.id));

              console.log(`✅ Payment succeeded`);
            }
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription;

        if (subscriptionId && typeof subscriptionId === "string") {
          const [existingSubscription] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

          if (existingSubscription) {
            if (existingSubscription.isLifetime) {
              console.log(`⏭️ Ignoring payment failure for lifetime user`);
              break;
            }

            await db
              .update(subscriptions)
              .set({
                status: "past_due",
                updatedAt: new Date(),
              })
              .where(eq(subscriptions.id, existingSubscription.id));

            console.log(`⚠️ Payment failed`);
          }
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event: ${event.type}`);
    }

    // ✅ IMPORTANT: Always return 200 to acknowledge receipt
    res.json({ received: true });
  } catch (error: any) {
    console.error("❌ Webhook handler error:", error.message);
    console.error("   Event type:", event?.type);
    console.error("   Stack:", error.stack);

    // ✅ Return 500 on processing error (Stripe will retry)
    res.status(500).json({ error: error.message });
  }
};