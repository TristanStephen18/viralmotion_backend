// src/controllers/removeBg.controller.ts
import type { Request, Response } from "express";
import fetch from "node-fetch";
import FormData from "form-data";
import type { UploadApiResponse } from "cloudinary";
import cloudinary from "../../utils/cloudinaryClient.ts";

export class RemoveBgController {
  async removeBackground(req: Request, res: Response): Promise<void> {
    try {
      // Validate file upload
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      // Validate API key
      const apiKey = process.env.REMOVE_BG_API_KEY;
      if (!apiKey) {
        console.error("REMOVE_BG_API_KEY is not configured");
        res.status(500).json({ error: "Service configuration error" });
        return;
      }

      const fileBuffer = req.file.buffer;

      // Prepare Remove.bg request using form-data package
      const formData = new FormData();
      formData.append("size", "auto");
      formData.append("image_file", fileBuffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      // Call Remove.bg API
      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
          ...formData.getHeaders(), // Important: includes boundary for multipart
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Remove.bg API error:", errorText);
        
        res.status(response.status).json({
          error: "Background removal failed",
          details: response.status === 403 
            ? "Invalid API key or insufficient credits" 
            : "Service temporarily unavailable",
        });
        return;
      }

      // Get removed-background PNG buffer
      const arrayBuffer = await response.arrayBuffer();
      const bgRemovedBuffer = Buffer.from(arrayBuffer);

      // Upload to Cloudinary
      const cloudResult: UploadApiResponse = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "bg-removed",
            resource_type: "image",
            format: "png",
            transformation: [
              { quality: "auto:good" },
              { fetch_format: "auto" }
            ]
          },
          (err, result) => {
            if (err) {
              console.error("Cloudinary upload error:", err);
              reject(err);
            } else if (!result) {
              reject(new Error("Cloudinary upload returned no result"));
            } else {
              resolve(result);
            }
          }
        );

        uploadStream.end(bgRemovedBuffer);
      });

      // Return Cloudinary URL
      res.json({
        url: cloudResult.secure_url,
        publicId: cloudResult.public_id,
      });

    } catch (err) {
      console.error("Remove background error:", err);
      
      res.status(500).json({
        error: "Internal server error",
        details: process.env.NODE_ENV === "production" 
          ? "An error occurred while processing your image"
          : (err as Error).message
      });
    }
  }
}