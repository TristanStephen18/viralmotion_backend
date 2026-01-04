// import Stripe from 'stripe';

// if (!process.env.STRIPE_SECRET_KEY) {
//   throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
// }

// export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//   apiVersion: '2025-09-30.clover' as Stripe.LatestApiVersion,
// });

// // ✅ NEW: 4-tier pricing configuration
// export const STRIPE_CONFIG = {
//   starterPriceId: process.env.STRIPE_PRICE_ID_STARTER || '',
//   proPriceId: process.env.STRIPE_PRICE_ID_PRO || '',
//   teamPriceId: process.env.STRIPE_PRICE_ID_TEAM || '',
//   webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
//   publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
// };

// // Validate configuration
// if (!STRIPE_CONFIG.starterPriceId) {
//   console.warn('⚠️ STRIPE_PRICE_ID_STARTER is not set');
// }

// if (!STRIPE_CONFIG.proPriceId) {
//   console.warn('⚠️ STRIPE_PRICE_ID_PRO is not set');
// }

// if (!STRIPE_CONFIG.teamPriceId) {
//   console.warn('⚠️ STRIPE_PRICE_ID_TEAM is not set');
// }

// if (!STRIPE_CONFIG.webhookSecret) {
//   console.warn('⚠️ STRIPE_WEBHOOK_SECRET is not set');
// }

// // ✅ Helper to get price ID by plan
// export function getPriceId(plan: 'starter' | 'pro' | 'team'): string {
//   switch (plan) {
//     case 'starter':
//       return STRIPE_CONFIG.starterPriceId;
//     case 'pro':
//       return STRIPE_CONFIG.proPriceId;
//     case 'team':
//       return STRIPE_CONFIG.teamPriceId;
//     default:
//       throw new Error(`Invalid plan: ${plan}`);
//   }
// }

// // ✅ Helper to get plan from price ID
// export function getPlanFromPriceId(priceId: string): 'starter' | 'pro' | 'team' | null {
//   if (priceId === STRIPE_CONFIG.starterPriceId) return 'starter';
//   if (priceId === STRIPE_CONFIG.proPriceId) return 'pro';
//   if (priceId === STRIPE_CONFIG.teamPriceId) return 'team';
//   return null;
// }

import Stripe from 'stripe';

// ✅ Determine which mode to use (default to test for safety)
const STRIPE_MODE = process.env.STRIPE_MODE || 'test';
const isTestMode = STRIPE_MODE === 'test';
const isLiveMode = STRIPE_MODE === 'live';

// ✅ Select appropriate secret key based on mode
const STRIPE_SECRET_KEY = isTestMode
  ? process.env.STRIPE_SECRET_KEY_TEST
  : process.env.STRIPE_SECRET_KEY_LIVE;

if (!STRIPE_SECRET_KEY) {
  throw new Error(
    `STRIPE_SECRET_KEY is not set for ${STRIPE_MODE} mode. ` +
    `Please set STRIPE_SECRET_KEY_${STRIPE_MODE.toUpperCase()} in your .env file.`
  );
}

// ✅ Initialize Stripe with correct key
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover' as Stripe.LatestApiVersion,
});

// ✅ 4-tier pricing configuration with test/live mode support
export const STRIPE_CONFIG = {
  // Price IDs
  starterPriceId: isTestMode
    ? process.env.STRIPE_PRICE_ID_STARTER_TEST || ''
    : process.env.STRIPE_PRICE_ID_STARTER_LIVE || '',
  proPriceId: isTestMode
    ? process.env.STRIPE_PRICE_ID_PRO_TEST || ''
    : process.env.STRIPE_PRICE_ID_PRO_LIVE || '',
  teamPriceId: isTestMode
    ? process.env.STRIPE_PRICE_ID_TEAM_TEST || ''
    : process.env.STRIPE_PRICE_ID_TEAM_LIVE || '',
  
  // Webhook secret
  webhookSecret: isTestMode
    ? process.env.STRIPE_WEBHOOK_SECRET_TEST || ''
    : process.env.STRIPE_WEBHOOK_SECRET_LIVE || '',
  
  // Publishable key
  publishableKey: isTestMode
    ? process.env.STRIPE_PUBLISHABLE_KEY_TEST || ''
    : process.env.STRIPE_PUBLISHABLE_KEY_LIVE || '',
  
  // Mode info
  mode: STRIPE_MODE,
  isTestMode,
  isLiveMode,
};

// ✅ Validate configuration
const missingVars: string[] = [];

if (!STRIPE_CONFIG.starterPriceId) {
  missingVars.push(`STRIPE_PRICE_ID_STARTER_${STRIPE_MODE.toUpperCase()}`);
}

if (!STRIPE_CONFIG.proPriceId) {
  missingVars.push(`STRIPE_PRICE_ID_PRO_${STRIPE_MODE.toUpperCase()}`);
}

if (!STRIPE_CONFIG.teamPriceId) {
  missingVars.push(`STRIPE_PRICE_ID_TEAM_${STRIPE_MODE.toUpperCase()}`);
}

if (!STRIPE_CONFIG.webhookSecret) {
  missingVars.push(`STRIPE_WEBHOOK_SECRET_${STRIPE_MODE.toUpperCase()}`);
}

if (!STRIPE_CONFIG.publishableKey) {
  missingVars.push(`STRIPE_PUBLISHABLE_KEY_${STRIPE_MODE.toUpperCase()}`);
}

if (missingVars.length > 0) {
  console.error('❌ Missing required Stripe environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  throw new Error(`Missing Stripe configuration for ${STRIPE_MODE} mode`);
}

// ✅ Safety check: Prevent test mode in production
if (process.env.NODE_ENV === 'production' && isTestMode) {
  console.error('❌ CRITICAL ERROR: Production environment is using TEST Stripe keys!');
  console.error('   Set STRIPE_MODE=live in production environment variables.');
  throw new Error('Cannot use Stripe test mode in production');
}

// ✅ Warning: Live mode in development
if (process.env.NODE_ENV === 'development' && isLiveMode) {
  console.warn('⚠️  WARNING: Development environment is using LIVE Stripe keys!');
  console.warn('   Real money will be charged. Consider using STRIPE_MODE=test');
  console.warn('   Press Ctrl+C within 5 seconds to abort...');
  
  // Give developer time to abort
  await new Promise(resolve => setTimeout(resolve, 5000));
}

// ✅ Log startup configuration
console.log('\n' + '='.repeat(60));
console.log('🔧 Stripe Configuration Loaded:');
console.log('='.repeat(60));
console.log(`   Mode:           ${STRIPE_MODE.toUpperCase()} ${isTestMode ? '(Safe)' : '(LIVE CHARGES)'}`);
console.log(`   Environment:    ${process.env.NODE_ENV || 'development'}`);
console.log(`   Secret Key:     ${STRIPE_SECRET_KEY.substring(0, 12)}...`);
console.log(`   Publishable:    ${STRIPE_CONFIG.publishableKey.substring(0, 12)}...`);
console.log(`   Webhook Secret: ${STRIPE_CONFIG.webhookSecret.substring(0, 12)}...`);
console.log('\n   Price IDs:');
console.log(`   - Starter:      ${STRIPE_CONFIG.starterPriceId}`);
console.log(`   - Pro:          ${STRIPE_CONFIG.proPriceId}`);
console.log(`   - Team:         ${STRIPE_CONFIG.teamPriceId}`);
console.log('='.repeat(60) + '\n');

// ✅ Helper to get price ID by plan
export function getPriceId(plan: 'starter' | 'pro' | 'team'): string {
  let priceId: string;
  
  switch (plan) {
    case 'starter':
      priceId = STRIPE_CONFIG.starterPriceId;
      break;
    case 'pro':
      priceId = STRIPE_CONFIG.proPriceId;
      break;
    case 'team':
      priceId = STRIPE_CONFIG.teamPriceId;
      break;
    default:
      throw new Error(`Invalid plan: ${plan}`);
  }
  
  if (!priceId) {
    throw new Error(`No price ID configured for plan: ${plan} in ${STRIPE_MODE} mode`);
  }
  
  return priceId;
}

// ✅ Helper to get plan from price ID
export function getPlanFromPriceId(priceId: string): 'starter' | 'pro' | 'team' | null {
  if (priceId === STRIPE_CONFIG.starterPriceId) return 'starter';
  if (priceId === STRIPE_CONFIG.proPriceId) return 'pro';
  if (priceId === STRIPE_CONFIG.teamPriceId) return 'team';
  
  console.warn(`⚠️ Unknown price ID: ${priceId} - defaulting to null`);
  return null;
}