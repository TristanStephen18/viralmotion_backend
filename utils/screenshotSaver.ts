import { Router } from "express";
import multer from "multer";
import cloudinary from "./cloudinaryClient.ts";

const router = Router();

// Configure multer to handle file uploads in memory
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Upload screenshot to Cloudinary
router.post("/upload-thumbnail", upload.single("thumbnail"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Convert buffer to base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: "video-editor/thumbnails", // Organize in folders
      resource_type: "image",
      transformation: [
        { width: 640, height: 360, crop: "limit" }, // Optimize size
        { quality: "auto" }, // Auto quality
        { fetch_format: "auto" }, // Auto format (WebP when supported)
      ],
    });

    // Return the Cloudinary URL
    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      thumbnailUrl: result.secure_url, // You can also generate thumbnail URLs
    });

  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({ 
      error: "Failed to upload thumbnail",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;