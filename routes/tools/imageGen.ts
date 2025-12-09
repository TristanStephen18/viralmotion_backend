import { Router } from "express";
import { requireAuth } from "../../utils/authmiddleware.ts";
import * as imageGenController from "../../controllers/imageGen/imageGenController.ts";

const router = Router();

// All routes require authentication
router.use(requireAuth);

router.post("/save", imageGenController.saveImageGeneration);
router.get("/generations", imageGenController.getGenerations);
router.delete("/generations/:id", imageGenController.deleteGeneration);

export default router;