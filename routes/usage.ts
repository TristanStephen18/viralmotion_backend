import { Router } from "express";
import { requireAuth } from "../utils/authmiddleware.ts";
import {
  canCreateVideo,
  incrementVideoCount,
  canGenerateAI,
  incrementAICount,
  getUsageStats,
  getPlanFeatures,
} from "../controllers/usage/usageController.ts";

const router = Router();

// ✅ All routes require authentication
router.use(requireAuth);

// Video tracking
router.get("/can-create-video", canCreateVideo);
router.post("/increment-video", incrementVideoCount);

// AI tracking
router.get("/can-generate-ai", canGenerateAI);
router.post("/increment-ai", incrementAICount);

// Stats & features
router.get("/stats", getUsageStats);
router.get("/features", getPlanFeatures);

export default router;