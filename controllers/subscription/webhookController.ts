import type { Request, Response } from "express";
import Stripe from "stripe";
import { stripe, STRIPE_CONFIG } from "../../config/stripe.ts";
import { db } from "../../db/client.ts";
import { subscriptions } from "../../db/schema.ts";
import { eq } from "drizzle-orm";

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

          // ✅ For trialing subscriptions, use trial dates as period
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
            currentPeriodStart: new Date(periodStart * 1000),
            currentPeriodEnd: new Date(periodEnd * 1000),
            cancelAtPeriodEnd: subData.cancel_at_period_end || false,
            trialStart: subData.trial_start
              ? new Date(subData.trial_start * 1000)
              : null,
            trialEnd: subData.trial_end
              ? new Date(subData.trial_end * 1000)
              : null,
          });

          console.log(`✅ Subscription created for user ${userId}`);
        }
        break;
      }

      // SUBSCRIPTION UPDATED
      case "customer.subscription.updated": {
        const stripeSubscription = event.data.object as Stripe.Subscription;

        const [existingSubscription] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id));

        if (existingSubscription) {
          await db
            .update(subscriptions)
            .set({
              status: stripeSubscription.status as any,
              // ✅ Access properties with type assertion
              currentPeriodStart: new Date(
                (stripeSubscription as any).current_period_start * 1000
              ),
              currentPeriodEnd: new Date(
                (stripeSubscription as any).current_period_end * 1000
              ),
              cancelAtPeriodEnd:
                (stripeSubscription as any).cancel_at_period_end || false,
              canceledAt: (stripeSubscription as any).canceled_at
                ? new Date((stripeSubscription as any).canceled_at * 1000)
                : null,
              trialEnd: (stripeSubscription as any).trial_end
                ? new Date((stripeSubscription as any).trial_end * 1000)
                : null,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, existingSubscription.id));

          console.log(
            `✅ Subscription updated: ${stripeSubscription.id} → ${stripeSubscription.status}`
          );
        }
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

        // ✅ Type assertion to access subscription property
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

        // ✅ Type assertion to access subscription property
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
    console.error("❌ Webhook handler error:", error);
    res.status(500).send("Webhook handler failed");
  }
};
