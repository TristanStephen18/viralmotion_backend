import Stripe from 'stripe';
import { db } from "../db/client.ts";
import { subscriptions, users } from "../db/schema.ts";
import { eq, desc } from "drizzle-orm";

// ✅ HARDCODE YOUR KEYS HERE (just for testing)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover' as Stripe.LatestApiVersion,
});

async function advanceBillingCycle(userEmail: string) {
  try {
    console.log(`\n🔍 Finding user: ${userEmail}`);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail));

    if (!user) {
      console.error(`❌ User not found: ${userEmail}`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name} (ID: ${user.id})`);

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .orderBy(desc(subscriptions.createdAt));

    if (!subscription || !subscription.stripeSubscriptionId) {
      console.error(`❌ No subscription found`);
      process.exit(1);
    }

    console.log(`\n📋 Current Subscription:`);
    console.log(`   ID: ${subscription.stripeSubscriptionId}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Period End: ${subscription.currentPeriodEnd?.toISOString()}`);

    console.log(`\n⏰ Creating invoice to simulate renewal...`);

    // ✅ Method 1: Create an invoice immediately
    const invoice = await stripe.invoices.create({
      customer: user.stripeCustomerId!,
      subscription: subscription.stripeSubscriptionId,
      auto_advance: true, // Automatically finalize and pay
    });

    console.log(`✅ Invoice created: ${invoice.id}`);

    // Finalize and pay the invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    
    console.log(`✅ Invoice finalized!`);
    console.log(`   Amount: $${(finalizedInvoice.amount_due / 100).toFixed(2)}`);
    console.log(`   Status: ${finalizedInvoice.status}`);

    // Pay the invoice
    if (finalizedInvoice.status === 'open') {
      const paidInvoice = await stripe.invoices.pay(invoice.id);
      console.log(`✅ Invoice paid: ${paidInvoice.status}`);
    }

    console.log(`\n📡 Webhooks will be sent:`);
    console.log(`   1. invoice.created`);
    console.log(`   2. invoice.finalized`);
    console.log(`   3. invoice.payment_succeeded`);
    console.log(`   4. customer.subscription.updated (with new period dates)`);

    console.log(`\n🎯 Check:`);
    console.log(`   - Render logs for webhooks (should arrive in 5-10 seconds)`);
    console.log(`   - Stripe Dashboard: https://dashboard.stripe.com/test/invoices/${invoice.id}`);
    console.log(`   - Frontend: http://localhost:5173/profile (refresh after webhooks)`);

  } catch (error: any) {
    console.error(`\n❌ Error:`, error.message);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

advanceBillingCycle("launcejoshuadayao@gmail.com");