import express from "express";
import type { Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import cloudinary from "../../utils/cloudinaryClient.ts";


const router = express.Router();

const upload = multer({ dest: "uploads/temp/" });

if (!fs.existsSync("uploads/temp")) {
  fs.mkdirSync("uploads/temp", { recursive: true });
}

// Speech Enhancement using Python (noisereduce)
router.post(
  "/enhance-speech",
  upload.single("audio"),
  async (req: Request, res: Response): Promise<void> => {
    console.log("\n🎙️  ===== Speech Enhancement (Python/noisereduce) =====");
    const startTime = Date.now();
    
    try {
      if (!req.file) {
        console.error("❌ No audio file provided");
        res.status(400).json({ error: "No audio file provided" });
        return;
      }

      console.log("📁 Audio received:");
      console.log("   File:", req.file.originalname);
      console.log("   Size:", (req.file.size / 1024 / 1024).toFixed(2), "MB");
      console.log("   Type:", req.file.mimetype);

      // Validate Cloudinary
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

      // Step 1: Run Python script for enhancement
      console.log("\n📤 Step 1: Enhancing audio with Python...");
      const enhancedFileName = `enhanced-${Date.now()}.wav`;
      const enhancedFilePath = path.join("uploads/temp", enhancedFileName);

      // Use 'python' for Windows (not 'python3')
      const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
      
      const pythonProcess = spawn(pythonCommand, [
        path.join("scripts", "enhance_audio.py"),
        req.file.path,
        enhancedFilePath,
      ]);

      let pythonOutput = "";
      let pythonError = "";

      pythonProcess.stdout.on("data", (data) => {
        const output = data.toString();
        pythonOutput += output;
        console.log("   Python:", output.trim());
      });

      pythonProcess.stderr.on("data", (data) => {
        const error = data.toString();
        pythonError += error;
        console.error("   Python Error:", error.trim());
      });

      await new Promise<void>((resolve, reject) => {
        pythonProcess.on("close", (code) => {
          if (code !== 0) {
            reject(new Error(`Python process exited with code ${code}: ${pythonError}`));
          } else {
            resolve();
          }
        });
      });

      console.log("✅ Audio enhanced");

      // Check if enhanced file exists
      if (!fs.existsSync(enhancedFilePath)) {
        throw new Error("Enhanced file was not created");
      }

      const enhancedFileSize = fs.statSync(enhancedFilePath).size;
      console.log("   Enhanced size:", (enhancedFileSize / 1024 / 1024).toFixed(2), "MB");

      // Step 2: Upload to Cloudinary
      console.log("\n☁️  Step 2: Uploading to Cloudinary...");
      
      const cloudinaryUpload = await cloudinary.uploader.upload(enhancedFilePath, {
        folder: "enhanced-speech",
        resource_type: "video",
        public_id: `speech-${Date.now()}`,
        overwrite: true,
      });

      console.log("✅ Uploaded to Cloudinary");
      console.log("   URL:", cloudinaryUpload.secure_url);
      console.log("   Public ID:", cloudinaryUpload.public_id);

      // Step 3: Cleanup temp files
      console.log("\n🧹 Step 3: Cleaning up...");
      fs.unlinkSync(req.file.path);
      fs.unlinkSync(enhancedFilePath);
      console.log("✅ Temp files deleted");

      const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log("\n✅ ===== Enhancement Complete =====");
      console.log(`   Total time: ${processingTime}s\n`);

      res.json({
        success: true,
        audioUrl: cloudinaryUpload.secure_url,
        cloudinaryPublicId: cloudinaryUpload.public_id,
        message: "Speech enhanced successfully",
        processingTime: parseFloat(processingTime),
      });

    } catch (error: any) {
      console.error("\n❌ ===== ERROR =====");
      console.error("Type:", error.constructor ? error.constructor.name : 'Unknown');
      console.error("Message:", error.message);
      console.error("===================\n");

      // Cleanup on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        error: "Failed to enhance speech",
        details: error.message,
      });
    }
  }
);

// Health check endpoint
router.get("/health", (req: Request, res: Response) => {
  const status = {
    status: "ok",
    service: "speech-enhancement-python",
    timestamp: new Date().toISOString(),
    config: {
      cloudinary: {
        cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
        api_key: !!process.env.CLOUDINARY_API_KEY,
        api_secret: !!process.env.CLOUDINARY_API_SECRET,
      },
    },
  };
  
  console.log("🏥 Health check:", status);
  res.json(status);
});

export default router;