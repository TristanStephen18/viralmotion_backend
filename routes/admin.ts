import { Router } from "express";
import { verifyAdminToken, requireRole } from "../middleware/adminAuth.ts";
import {
  adminLogin,
  createFirstAdmin,
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

const router = Router();

// ========== PUBLIC ROUTES (NO AUTH) ==========

// Admin login
router.post("/auth/login", adminLogin);

// Create first admin (one-time setup)
router.post("/auth/setup", createFirstAdmin);

// Track page visit (can be called by frontend without admin auth)
router.post("/analytics/track-visit", trackPageVisit);

// ========== PROTECTED ROUTES (ADMIN AUTH REQUIRED) ==========

// Dashboard stats
router.get("/analytics/stats", verifyAdminToken, getDashboardStats);

// Visit analytics
router.get("/analytics/visits", verifyAdminToken, getVisitAnalytics);

// User management
router.get("/users", verifyAdminToken, getUsers);
router.get("/users/:userId", verifyAdminToken, getUserDetails);

// ========== LIFETIME ACCESS MANAGEMENT (ANY ADMIN) ==========

// Create lifetime account directly
router.post("/users/create-lifetime", verifyAdminToken, createLifetimeAccount);

// ✅ NEW: Delete user
router.delete("/users/:userId", verifyAdminToken, deleteUser);

// Grant/revoke lifetime access to existing users
router.post("/subscriptions/grant-lifetime", verifyAdminToken, grantLifetimeAccess);
router.post("/subscriptions/revoke-lifetime", verifyAdminToken, revokeLifetimeAccess);

// Get all lifetime accounts
router.get("/subscriptions/lifetime", verifyAdminToken, getLifetimeAccounts);

export default router;