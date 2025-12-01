import express from "express";
import { requireAuth } from "../utils/authmiddleware.ts";
import { deleteGeneration, generateVideo, getGenerationById, getGenerations, testGenerateVideo } from "../controllers/veo3/veo3Controller.ts";


const router = express.Router();

router.post("/generate", requireAuth, generateVideo);
router.get("/generations", requireAuth, getGenerations);
router.get("/generations/:id", requireAuth, getGenerationById);
router.delete("/generations/:id", requireAuth, deleteGeneration);

router.post("/test", requireAuth, testGenerateVideo);

export default router;