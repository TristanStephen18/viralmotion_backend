import express from "express";
import {
  generateVideo,
  getGenerations,
  getGenerationById,
  deleteGeneration,
  testGenerateVideo,
} from "../../controllers/veo3/veo3Controller.ts";
import { requireAuth } from "../../utils/authmiddleware.ts";

const router = express.Router();

router.post("/generate", requireAuth, generateVideo);
router.get("/generations", requireAuth, getGenerations);
router.get("/generations/:id", requireAuth, getGenerationById);
router.delete("/generations/:id", requireAuth, deleteGeneration);

router.post("/test", requireAuth, testGenerateVideo);

export default router;