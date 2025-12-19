import { Router } from "express";
import {
  getMostUsedTemplates,
  getTopTemplates,
} from "../controllers/analytics/templatesController.ts";

const router = Router();

// Public endpoints (no authentication required)
router.get("/templates/trending", getMostUsedTemplates);
router.get("/templates/top", getTopTemplates);

export default router;