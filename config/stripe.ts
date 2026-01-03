import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover' as Stripe.LatestApiVersion,
});

// ✅ NEW: 4-tier pricing configuration
export const STRIPE_CONFIG = {
  starterPriceId: process.env.STRIPE_PRICE_ID_STARTER || '',
  proPriceId: process.env.STRIPE_PRICE_ID_PRO || '',
  teamPriceId: process.env.STRIPE_PRICE_ID_TEAM || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
};

// Validate configuration
if (!STRIPE_CONFIG.starterPriceId) {
  console.warn('⚠️ STRIPE_PRICE_ID_STARTER is not set');
}

if (!STRIPE_CONFIG.proPriceId) {
  console.warn('⚠️ STRIPE_PRICE_ID_PRO is not set');
}

if (!STRIPE_CONFIG.teamPriceId) {
  console.warn('⚠️ STRIPE_PRICE_ID_TEAM is not set');
}

if (!STRIPE_CONFIG.webhookSecret) {
  console.warn('⚠️ STRIPE_WEBHOOK_SECRET is not set');
}

// ✅ Helper to get price ID by plan
export function getPriceId(plan: 'starter' | 'pro' | 'team'): string {
  switch (plan) {
    case 'starter':
      return STRIPE_CONFIG.starterPriceId;
    case 'pro':
      return STRIPE_CONFIG.proPriceId;
    case 'team':
      return STRIPE_CONFIG.teamPriceId;
    default:
      throw new Error(`Invalid plan: ${plan}`);
  }
}

// ✅ Helper to get plan from price ID
export function getPlanFromPriceId(priceId: string): 'starter' | 'pro' | 'team' | null {
  if (priceId === STRIPE_CONFIG.starterPriceId) return 'starter';
  if (priceId === STRIPE_CONFIG.proPriceId) return 'pro';
  if (priceId === STRIPE_CONFIG.teamPriceId) return 'team';
  return null;
}