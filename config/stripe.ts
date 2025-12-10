import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover' as Stripe.LatestApiVersion,
});

export const STRIPE_CONFIG = {
  priceId: process.env.STRIPE_PRICE_ID || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  trialDays: 7,
};

// Validate configuration
if (!STRIPE_CONFIG.priceId) {
  console.warn('⚠️ STRIPE_PRICE_ID is not set');
}

if (!STRIPE_CONFIG.webhookSecret) {
  console.warn('⚠️ STRIPE_WEBHOOK_SECRET is not set');
}