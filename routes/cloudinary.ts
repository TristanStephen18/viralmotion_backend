


// routes/cloudinary.ts
import { Router } from "express";
import { uploadAudioFromBuffer, deleteResource } from "../utils/cloudinaryClient.ts";
import multer from "multer";

const router = Router();

// Use memory storage for multer
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Upload audio to Cloudinary using buffer upload
router.post("/upload-audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      console.error("❌ No audio file provided");
      return res.status(400).json({ error: "No audio file provided" });
    }

    console.log("📤 Uploading audio to Cloudinary...", {
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    // ✅ Use the helper function
    const result = await uploadAudioFromBuffer(
      req.file.buffer,
      req.file.mimetype,
      {
        folder: "voiceovers",
        public_id: `voiceover-${Date.now()}`,
        format: "mp3",
      }
    );

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    });

  } catch (error: any) {
    console.error("❌ Upload error:", error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "Failed to upload audio",
        message: error.message || "Unknown error",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
});

// Delete audio from Cloudinary
router.delete("/delete-audio/:publicId", async (req, res) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId);
    
    // ✅ Use the helper function
    const result = await deleteResource(publicId, "video");

    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("❌ Delete error:", error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "Failed to delete audio",
        message: error.message || "Unknown error",
      });
    }
  }
});

export default router;