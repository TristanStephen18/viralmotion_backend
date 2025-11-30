// src/routes/removeBg.routes.ts
import { Router } from "express";
import multer from "multer";
import { RemoveBgController } from "../../controllers/apis/removebg.ts";

const router = Router();
const removeBgController = new RemoveBgController();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed."));
    }
  },
});

// POST route for background removal
router.post(
  "/remove-background",
  upload.single("image"), // 'image' is the field name
  (req, res) => removeBgController.removeBackground(req, res)
);

export default router;