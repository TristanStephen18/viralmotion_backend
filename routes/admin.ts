import { Router } from "express";
import { verifyAdminToken, requireReAuth } from "../middleware/adminAuth.ts";
import {
  adminLogin,
  createFirstAdmin,
  adminLogout,
  generateReAuthToken,
  createAdminUser,
} from "../controllers/admin/authController.ts";
import {
  getDashboardStats,
  getVisitAnalytics,
  trackPageVisit,
} from "../controllers/admin/analyticsController.ts";
import {
  getUsers,
  getUserDetails,
  createLifetimeAccount,
  deleteUser,
} from "../controllers/admin/userManagementController.ts";
import {
  grantLifetimeAccess,
  revokeLifetimeAccess,
  getLifetimeAccounts,
} from "../controllers/admin/subscriptionManagement.ts";
import {
  getAuditLogs,
  getAuditStats,
} from "../controllers/admin/auditController.ts";
import {
  adminLoginRateLimiter,
  adminOperationsRateLimiter,
  adminCriticalRateLimiter,
  adminDataAccessRateLimiter,
  adminSpeedLimiter,
} from "../middleware/adminRateLimiter.ts";
import {
  validateUserId,
  validateGrantLifetime,
  validateCreateLifetimeAccount,
  validateUserListQuery,
} from "../middleware/adminValidator.ts";

const router = Router();

// ========== PUBLIC ROUTES (NO AUTH) ==========

// ✅ Admin login (VERY strict rate limiting)
router.post("/auth/login", adminLoginRateLimiter, adminLogin);

// ✅ Create first admin (one-time setup)
router.post("/auth/setup", createFirstAdmin);

// ✅ Track page visit (public)
router.post("/analytics/track-visit", trackPageVisit);

// ========== PROTECTED ROUTES (REQUIRE AUTH) ==========

// Apply speed limiter to ALL protected routes
router.use(verifyAdminToken);
router.use(adminSpeedLimiter);

// ========== AUTHENTICATION ROUTES ==========

// ✅ Logout (blacklist token)
router.post("/auth/logout", adminLogout);

// ✅ Generate re-auth token for critical operations
router.post("/auth/reauth", adminOperationsRateLimiter, generateReAuthToken);

// ========== ANALYTICS ROUTES ==========

// ✅ Dashboard stats
router.get(
  "/analytics/stats",
  adminOperationsRateLimiter,
  getDashboardStats
);

// ✅ Visit analytics
router.get(
  "/analytics/visits",
  adminOperationsRateLimiter,
  getVisitAnalytics
);

// ========== USER MANAGEMENT ROUTES ==========

// ✅ Get users list (with rate limiting)
router.get(
  "/users",
  adminDataAccessRateLimiter,
  validateUserListQuery,
  getUsers
);

// ✅ Get user details (with rate limiting)
router.get(
  "/users/:userId",
  adminDataAccessRateLimiter,
  validateUserId,
  getUserDetails
);

// ✅ Create lifetime account (CRITICAL - requires re-auth)
router.post(
  "/users/create-lifetime",
  adminCriticalRateLimiter,
  validateCreateLifetimeAccount,
  requireReAuth(),
  createLifetimeAccount
);

// ✅ Delete user (CRITICAL - requires re-auth)
router.delete(
  "/users/:userId",
  adminCriticalRateLimiter,
  validateUserId,
  requireReAuth(),
  deleteUser
);

// ========== SUBSCRIPTION MANAGEMENT ROUTES ==========

// ✅ Grant lifetime access (CRITICAL - requires re-auth)
router.post(
  "/subscriptions/grant-lifetime",
  adminCriticalRateLimiter,
  validateUserId,
  validateGrantLifetime,
  requireReAuth(),
  grantLifetimeAccess
);

// ✅ Revoke lifetime access (CRITICAL - requires re-auth)
router.post(
  "/subscriptions/revoke-lifetime",
  adminCriticalRateLimiter,
  validateUserId,
  requireReAuth(),
  revokeLifetimeAccess
);

// Create additional admin user (CRITICAL - requires re-auth)
router.post(
  "/auth/create-admin",
  adminCriticalRateLimiter,
  requireReAuth(),
  createAdminUser
);

// ✅ Get lifetime accounts
router.get(
  "/subscriptions/lifetime",
  adminOperationsRateLimiter,
  getLifetimeAccounts
);

// ========== AUDIT ROUTES ==========

// ✅ Get audit logs
router.get(
  "/audit/logs",
  adminOperationsRateLimiter,
  getAuditLogs
);

// ✅ Get audit statistics
router.get(
  "/audit/stats",
  adminOperationsRateLimiter,
  getAuditStats
);

export default router;