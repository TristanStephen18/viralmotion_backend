import express from "express";
import type { Request, Response } from "express";
import cloudinary from "./cloudinaryClient.ts";

const router = express.Router();

router.post("/save-to-cloudinary", async (req: Request, res: Response): Promise<void> => {
  console.log("\n📸 ===== Save Image to Cloudinary =====");
  const startTime = Date.now();

  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      console.error("❌ No image URL provided");
      res.status(400).json({ error: "Image URL is required" });
      return;
    }

    console.log("🔗 Image URL:", imageUrl);

    // Validate Cloudinary config
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      console.error("❌ Cloudinary not configured");
      res.status(500).json({ 
        error: "Service configuration error",
        details: "Cloudinary not configured" 
      });
      return;
    }

    console.log("✅ Configuration validated");

    // Upload to Cloudinary (Cloudinary can fetch from URL directly)
    console.log("\n☁️  Uploading to Cloudinary...");
    const cloudinaryUpload = await cloudinary.uploader.upload(imageUrl, {
      folder: "ai-generated-images",
      public_id: `ai-image-${Date.now()}`,
      overwrite: true,
      resource_type: "image",
    });

    console.log("✅ Uploaded to Cloudinary");
    console.log("   URL:", cloudinaryUpload.secure_url);
    console.log("   Public ID:", cloudinaryUpload.public_id);
    console.log("   Width:", cloudinaryUpload.width);
    console.log("   Height:", cloudinaryUpload.height);

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("\n✅ ===== Save Complete =====");
    console.log(`   Total time: ${processingTime}s\n`);

    res.json({
      success: true,
      cloudinaryUrl: cloudinaryUpload.secure_url,
      publicId: cloudinaryUpload.public_id,
      width: cloudinaryUpload.width,
      height: cloudinaryUpload.height,
      processingTime: parseFloat(processingTime),
    });

  } catch (error: any) {
    console.error("\n❌ ===== ERROR =====");
    console.error("Type:", error.constructor ? error.constructor.name : 'Unknown');
    console.error("Message:", error.message);
    console.error("===================\n");

    res.status(500).json({
      error: "Failed to save image to Cloudinary",
      details: error.message,
    });
  }
});

// Health check
router.get("/health", (req: Request, res: Response) => {
  res.json({ 
    status: "ok", 
    service: "save-image",
    timestamp: new Date().toISOString()
  });
});

export default router;