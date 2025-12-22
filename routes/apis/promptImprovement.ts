import express from "express";
import { improvePrompt } from "../../controllers/promptImprovement/promptImprovementController.ts";
import { requireAuth } from "../../utils/authmiddleware.ts";

const router = express.Router();

router.post("/improve", requireAuth, improvePrompt);

export default router;