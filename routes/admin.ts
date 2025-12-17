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
} from "../controllers/admin/userManagementController.ts";

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

// ========== SUPER ADMIN ONLY ROUTES ==========

// Future: Add more admin users (super admin only)
// router.post("/users/invite", verifyAdminToken, requireRole(["super_admin"]), inviteAdmin);

export default router;