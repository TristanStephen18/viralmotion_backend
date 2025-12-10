import express from 'express';
import { requireAuth } from '../utils/authmiddleware.ts';
import {
  createCheckoutSession,
  getSubscriptionStatus,
  getSubscriptionDetails,
  createPortalSession,
  cancelSubscription,
  reactivateSubscription,
  createSetupIntent,      
  confirmSubscription,
} from '../controllers/subscription/subscriptionController.ts';
import { handleStripeWebhook } from '../controllers/subscription/webhookController.ts';

const router = express.Router();

// Webhook (NO auth, raw body)
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

router.post('/create-setup-intent', requireAuth, createSetupIntent);
router.post('/confirm', requireAuth, confirmSubscription);

// Protected routes
router.post('/create-checkout', requireAuth, createCheckoutSession);
router.get('/status', requireAuth, getSubscriptionStatus);
router.get('/details', requireAuth, getSubscriptionDetails);
router.post('/portal', requireAuth, createPortalSession);
router.post('/cancel', requireAuth, cancelSubscription);
router.post('/reactivate', requireAuth, reactivateSubscription);

export default router;