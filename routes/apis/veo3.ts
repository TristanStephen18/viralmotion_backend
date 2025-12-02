import express from "express";
import multer from "multer";
import {
  generateVideo,
  getGenerations,
  getGenerationById,
  deleteGeneration,
} from "../../controllers/veo3/veo3Controller.ts";
import { requireAuth } from "../../utils/authmiddleware.ts";


const router = express.Router();

import fs from "fs";
const uploadDir = "uploads/veo3-references";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });


router.post("/generate", requireAuth, upload.single("referenceImage"), generateVideo);
router.get("/generations", requireAuth, getGenerations);
router.get("/generations/:id", requireAuth, getGenerationById);
router.delete("/generations/:id", requireAuth, deleteGeneration);

export default router;