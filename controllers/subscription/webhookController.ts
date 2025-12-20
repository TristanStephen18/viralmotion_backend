import type { Request, Response } from "express";
import Stripe from "stripe";
import { stripe, STRIPE_CONFIG } from "../../config/stripe.ts";
import { db } from "../../db/client.ts";
import { subscriptions } from "../../db/schema.ts";
import { eq } from "drizzle-orm";

// Helper function to safely convert timestamp to Date
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

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_CONFIG.webhookSecret
    );
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`🔔 Webhook received: ${event.type}`);

  try {
    switch (event.type) {
      // CHECKOUT COMPLETED
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

          const periodStart =
            subData.status === "trialing" && subData.trial_start
              ? subData.trial_start
              : subData.current_period_start || subData.trial_start;

          const periodEnd =
            subData.status === "trialing" && subData.trial_end
              ? subData.trial_end
              : subData.current_period_end || subData.trial_end;

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
            plan: "pro",
            currentPeriodStart: periodStartDate,
            currentPeriodEnd: periodEndDate,
            cancelAtPeriodEnd: subData.cancel_at_period_end || false,
            trialStart: safeTimestampToDate(subData.trial_start),
            trialEnd: safeTimestampToDate(subData.trial_end),
          });

          console.log(`✅ Subscription created for user ${userId}`);
        }
        break;
      }

      // SUBSCRIPTION UPDATED
      case "customer.subscription.updated": {
        const stripeSubscription = event.data.object as Stripe.Subscription;
        const subData = stripeSubscription as any;

        console.log(`📝 Updating subscription: ${stripeSubscription.id}`);
        console.log(`   Status: ${stripeSubscription.status}`);
        console.log(`   Cancel at period end: ${subData.cancel_at_period_end}`);

        const [existingSubscription] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id));

        if (!existingSubscription) {
          console.log(`⚠️ Subscription ${stripeSubscription.id} not found in database`);
          break;
        }

        // ✅ Build update object with validated dates
        const updateData: any = {
          status: stripeSubscription.status as any,
          updatedAt: new Date(),
        };

        // Validate and set period dates
        const periodStart = safeTimestampToDate(subData.current_period_start);
        const periodEnd = safeTimestampToDate(subData.current_period_end);

        if (periodStart) {
          updateData.currentPeriodStart = periodStart;
        }

        if (periodEnd) {
          updateData.currentPeriodEnd = periodEnd;
        }

        // Set cancellation fields
        if (subData.cancel_at_period_end !== undefined) {
          updateData.cancelAtPeriodEnd = Boolean(subData.cancel_at_period_end);
        }

        // ✅ Only set canceledAt if it's a valid timestamp
        const canceledAt = safeTimestampToDate(subData.canceled_at);
        if (canceledAt) {
          updateData.canceledAt = canceledAt;
        } else if (subData.canceled_at === null) {
          // Explicitly set to null if Stripe sent null
          updateData.canceledAt = null;
        }

        // Handle trial dates
        const trialEnd = safeTimestampToDate(subData.trial_end);
        if (trialEnd) {
          updateData.trialEnd = trialEnd;
        }

        console.log(`   Updating fields: ${Object.keys(updateData).join(', ')}`);

        await db
          .update(subscriptions)
          .set(updateData)
          .where(eq(subscriptions.id, existingSubscription.id));

        console.log(`✅ Subscription updated: ${stripeSubscription.id}`);
        break;
      }

      // SUBSCRIPTION DELETED
      case "customer.subscription.deleted": {
        const stripeSubscription = event.data.object as Stripe.Subscription;

        const [existingSubscription] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id));

        if (existingSubscription) {
          await db
            .update(subscriptions)
            .set({
              status: "canceled",
              canceledAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, existingSubscription.id));

          console.log(`❌ Subscription canceled: ${stripeSubscription.id}`);
        }
        break;
      }

      // PAYMENT SUCCEEDED
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription;

        if (subscriptionId && typeof subscriptionId === "string") {
          const [existingSubscription] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

          if (
            existingSubscription &&
            existingSubscription.status === "past_due"
          ) {
            await db
              .update(subscriptions)
              .set({
                status: "active",
                updatedAt: new Date(),
              })
              .where(eq(subscriptions.id, existingSubscription.id));

            console.log(`✅ Payment succeeded: ${subscriptionId}`);
          }
        }
        break;
      }

      // PAYMENT FAILED
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription;

        if (subscriptionId && typeof subscriptionId === "string") {
          const [existingSubscription] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

          if (existingSubscription) {
            await db
              .update(subscriptions)
              .set({
                status: "past_due",
                updatedAt: new Date(),
              })
              .where(eq(subscriptions.id, existingSubscription.id));

            console.log(`⚠️ Payment failed: ${subscriptionId}`);
          }
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("❌ Webhook handler error:", error.message);
    console.error("   Event type:", event?.type);
    console.error("   Stack:", error.stack);
    
    // Still return 200 to prevent Stripe retries
    res.status(500).json({ error: error.message });
  }
};