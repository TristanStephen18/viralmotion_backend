import type { Request, Response } from "express";
import Stripe from "stripe";
import { stripe, STRIPE_CONFIG } from "../../config/stripe.ts";
import { db } from "../../db/client.ts";
import { subscriptions } from "../../db/schema.ts";
import { eq, and } from "drizzle-orm";

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

          // ✅ NEW: Determine billing interval
          const stripePriceId = stripeSubscription.items.data[0].price.id;
          const billingInterval: "monthly" | "yearly" =
            stripePriceId === STRIPE_CONFIG.yearlyPriceId
              ? "yearly"
              : "monthly";

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
            billingInterval,
            status: stripeSubscription.status as any,
            plan: "pro",
            currentPeriodStart: periodStartDate,
            currentPeriodEnd: periodEndDate,
            cancelAtPeriodEnd: subData.cancel_at_period_end || false,
            trialStart: safeTimestampToDate(subData.trial_start),
            trialEnd: safeTimestampToDate(subData.trial_end),
          });

          console.log(
            `✅ ${billingInterval} subscription created for user ${userId}`
          );
        }
        break;
      }

      // SUBSCRIPTION CREATED (handles direct API subscriptions)
      case "customer.subscription.created": {
        try {
          const stripeSubscription = event.data.object as Stripe.Subscription;
          const subData = stripeSubscription as any;

          console.log(
            `📦 Subscription created in Stripe: ${stripeSubscription.id}`
          );

          // Get userId from metadata
          const userId = subData.metadata?.userId;

          if (!userId) {
            console.log(`⚠️ No userId in subscription metadata, skipping`);
            break;
          }

          console.log(`   User ID: ${userId}`);
          console.log(`   Status: ${stripeSubscription.status}`);

          // ✅ NEW: Determine billing interval from price ID
          const stripePriceId = stripeSubscription.items.data[0].price.id;
          const billingInterval: "monthly" | "yearly" =
            stripePriceId === STRIPE_CONFIG.yearlyPriceId
              ? "yearly"
              : "monthly";

          console.log(`   Billing interval: ${billingInterval}`);

          // Check if already exists in database
          const [existing] = await db
            .select()
            .from(subscriptions)
            .where(
              eq(subscriptions.stripeSubscriptionId, stripeSubscription.id)
            );

          if (existing) {
            console.log(
              `ℹ️ Subscription ${stripeSubscription.id} already in database, skipping`
            );
            break;
          }

          // Check for existing free trial to update
          const [existingFreeTrial] = await db
            .select()
            .from(subscriptions)
            .where(
              and(
                eq(subscriptions.userId, parseInt(userId, 10)),
                eq(subscriptions.status, "free_trial")
              )
            )
            .limit(1);

          // ✅ CRITICAL FIX: Check if payment failed during active trial
          const paymentFailed = stripeSubscription.status === "incomplete";
          const now = new Date();
          const hadActiveTrial =
            existingFreeTrial?.trialEnd &&
            new Date(existingFreeTrial.trialEnd) > now;

          if (paymentFailed && hadActiveTrial) {
            console.log(
              `⚠️ Payment failed for user ${userId} with active trial`
            );
            console.log(
              `✅ PRESERVING free trial until ${existingFreeTrial.trialEnd}`
            );

            // Store failed subscription ID but KEEP the trial active
            await db
              .update(subscriptions)
              .set({
                stripeSubscriptionId: stripeSubscription.id,
                stripeCustomerId:
                  typeof stripeSubscription.customer === "string"
                    ? stripeSubscription.customer
                    : stripeSubscription.customer?.id || "",
                stripePriceId: stripePriceId,
                billingInterval: billingInterval,
                // ✅ FIXED: Safe metadata spreading
                metadata: {
                  ...(existingFreeTrial.metadata &&
                  typeof existingFreeTrial.metadata === "object"
                    ? existingFreeTrial.metadata
                    : {}),
                  failedPaymentAttempt: {
                    subscriptionId: stripeSubscription.id,
                    attemptedAt: new Date().toISOString(),
                    reason: "payment_failed_during_trial",
                  },
                } as any,
                updatedAt: new Date(),
              })
              .where(eq(subscriptions.id, existingFreeTrial.id));

            console.log(`✅ Trial preserved - user can still access dashboard`);
            break;
          }

          // ✅ FIXED: Extract period dates from items.data[0]
          const subscriptionItem = subData.items?.data?.[0];
          let periodStartRaw =
            subscriptionItem?.current_period_start ||
            subData.billing_cycle_anchor ||
            subData.created;
          let periodEndRaw = subscriptionItem?.current_period_end;

          console.log(`   Period start (raw): ${periodStartRaw}`);
          console.log(`   Period end (raw): ${periodEndRaw}`);

          // ✅ Convert dates
          let periodStart: Date | null = null;
          let periodEnd: Date | null = null;

          try {
            if (periodStartRaw) {
              periodStart = new Date(Number(periodStartRaw) * 1000);
              console.log(
                `   Period start (converted): ${periodStart.toISOString()}`
              );
            }

            if (periodEndRaw) {
              periodEnd = new Date(Number(periodEndRaw) * 1000);
              console.log(
                `   Period end (converted): ${periodEnd.toISOString()}`
              );
            }
          } catch (dateError: any) {
            console.error(`❌ Error converting dates:`, dateError.message);
          }

          if (
            !periodStart ||
            !periodEnd ||
            isNaN(periodStart.getTime()) ||
            isNaN(periodEnd.getTime())
          ) {
            console.error(`❌ Invalid period dates in subscription.created`);
            console.error(
              `   Period start: ${periodStartRaw} -> ${periodStart}`
            );
            console.error(`   Period end: ${periodEndRaw} -> ${periodEnd}`);
            break;
          }

          if (existingFreeTrial) {
            // ✅ Check if it's a lifetime account first
            if (existingFreeTrial.isLifetime) {
              console.log(
                `⏭️ Ignoring subscription creation for lifetime user ${userId}`
              );
              break;
            }

            // Update existing free trial record (payment succeeded)
            console.log(
              `🔄 Converting free trial to paid ${billingInterval} subscription (webhook)`
            );

            await db
              .update(subscriptions)
              .set({
                stripeSubscriptionId: stripeSubscription.id,
                stripeCustomerId:
                  typeof stripeSubscription.customer === "string"
                    ? stripeSubscription.customer
                    : stripeSubscription.customer?.id || "",
                stripePriceId: stripeSubscription.items.data[0].price.id,
                billingInterval,
                status: stripeSubscription.status as any,
                plan: "pro",
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: subData.cancel_at_period_end || false,
                trialStart: subData.trial_start
                  ? new Date(Number(subData.trial_start) * 1000)
                  : null,
                trialEnd: subData.trial_end
                  ? new Date(Number(subData.trial_end) * 1000)
                  : null,
                updatedAt: new Date(),
              })
              .where(eq(subscriptions.id, existingFreeTrial.id));

            console.log(
              `✅ Free trial converted to paid ${billingInterval} subscription`
            );
          } else {
            // Create new subscription record
            console.log(
              `✨ Creating new ${billingInterval} subscription record (webhook)`
            );

            await db.insert(subscriptions).values({
              userId: parseInt(userId, 10),
              stripeSubscriptionId: stripeSubscription.id,
              stripeCustomerId:
                typeof stripeSubscription.customer === "string"
                  ? stripeSubscription.customer
                  : stripeSubscription.customer?.id || "",
              stripePriceId: stripeSubscription.items.data[0].price.id,
              billingInterval,
              status: stripeSubscription.status as any,
              plan: "pro",
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              cancelAtPeriodEnd: subData.cancel_at_period_end || false,
              trialStart: subData.trial_start
                ? new Date(Number(subData.trial_start) * 1000)
                : null,
              trialEnd: subData.trial_end
                ? new Date(Number(subData.trial_end) * 1000)
                : null,
            });

            console.log(
              `✅ ${billingInterval} subscription created in database`
            );
          }
        } catch (createError: any) {
          console.error(
            `❌ Error handling subscription.created:`,
            createError.message
          );
          console.error(`   Stack:`, createError.stack);
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
          console.log(
            `⚠️ Subscription ${stripeSubscription.id} not found in database`
          );
          break;
        }

        // ✅ CRITICAL: Skip updates for lifetime users
        if (existingSubscription.isLifetime) {
          console.log(
            `⏭️ Ignoring webhook for lifetime user ${existingSubscription.userId} - subscription ${stripeSubscription.id}`
          );
          break;
        }

        // ✅ Build update object with validated dates
        const updateData: any = {
          status: stripeSubscription.status as any,
          updatedAt: new Date(),
        };

        // ✅ FIXED: Extract period dates from items.data[0]
        const subscriptionItem = subData.items?.data?.[0];
        const periodStartRaw = subscriptionItem?.current_period_start;
        const periodEndRaw = subscriptionItem?.current_period_end;

        console.log(`   Period start (raw): ${periodStartRaw}`);
        console.log(`   Period end (raw): ${periodEndRaw}`);

        // Validate and set period dates
        if (periodStartRaw) {
          const periodStart = new Date(Number(periodStartRaw) * 1000);
          if (!isNaN(periodStart.getTime())) {
            updateData.currentPeriodStart = periodStart;
            console.log(
              `   Period start (converted): ${periodStart.toISOString()}`
            );
          }
        }

        if (periodEndRaw) {
          const periodEnd = new Date(Number(periodEndRaw) * 1000);
          if (!isNaN(periodEnd.getTime())) {
            updateData.currentPeriodEnd = periodEnd;
            console.log(
              `   Period end (converted): ${periodEnd.toISOString()}`
            );
          }
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

        console.log(
          `   Updating fields: ${Object.keys(updateData).join(", ")}`
        );

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
          // ✅ CRITICAL: Skip updates for lifetime users
          if (existingSubscription.isLifetime) {
            console.log(
              `⏭️ Ignoring deletion webhook for lifetime user ${existingSubscription.userId} - subscription ${stripeSubscription.id}`
            );
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

          if (existingSubscription) {
            // ✅ Skip for lifetime users
            if (existingSubscription.isLifetime) {
              console.log(
                `⏭️ Ignoring payment webhook for lifetime user ${existingSubscription.userId}`
              );
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

              console.log(`✅ Payment succeeded: ${subscriptionId}`);
            }
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
            // ✅ Skip for lifetime users
            if (existingSubscription.isLifetime) {
              console.log(
                `⏭️ Ignoring payment failure webhook for lifetime user ${existingSubscription.userId}`
              );
              break;
            }

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
