import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover' as Stripe.LatestApiVersion,
});

// ✅ UPDATED: Support both monthly and yearly
export const STRIPE_CONFIG = {
  monthlyPriceId: process.env.STRIPE_PRICE_ID_MONTHLY || '',
  yearlyPriceId: process.env.STRIPE_PRICE_ID_YEARLY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  trialDays: 7,
};

// Validate configuration
if (!STRIPE_CONFIG.monthlyPriceId) {
  console.warn('⚠️ STRIPE_PRICE_ID_MONTHLY is not set');
}

if (!STRIPE_CONFIG.yearlyPriceId) {
  console.warn('⚠️ STRIPE_PRICE_ID_YEARLY is not set');
}

if (!STRIPE_CONFIG.webhookSecret) {
  console.warn('⚠️ STRIPE_WEBHOOK_SECRET is not set');
}

// ✅ Helper to get price by interval
export function getPriceId(interval: 'monthly' | 'yearly'): string {
  return interval === 'yearly' 
    ? STRIPE_CONFIG.yearlyPriceId 
    : STRIPE_CONFIG.monthlyPriceId;
}