import * as path from "path";
import { Router } from "express";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

import { getVideoDuration } from "../utils/ffmpeg.ts";
import * as MulterUtil from "../utils/multer.ts";
import cloudinary from "../utils/cloudinaryClient.ts";
import { supabase } from "../utils/supabaseClient.ts";

const router = Router();

const uploadBufferToCloudinary = (
  buffer: Buffer,
  opts: {
    folder?: string;
    resourceType?: "image" | "video" | "auto";
    public_id?: string;
  }
) => {
  return new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: opts.folder ?? "",
        resource_type: opts.resourceType ?? "auto",
        public_id: opts.public_id ?? undefined,
      },
      (err: any, result: any) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

/**
 * Helper: upload buffer to Supabase storage and return public url
 */
const uploadBufferToSupabase = async (
  bucket: string,
  destPath: string,
  buffer: Buffer,
  mimetype?: string
) => {
  // Supabase client expects ArrayBuffer or Readable
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(destPath, buffer, {
      contentType: mimetype,
      upsert: true,
    });
  if (error) throw error;
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(destPath);
  return publicUrlData.publicUrl;
};

router.post(
  "/upload-video",
  MulterUtil.uploadMemory.single("video"),
  async (req, res) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "No video uploaded" });
      }

      const publicId = `video_${uuidv4()}`;

      // Upload video buffer to Cloudinary
      const result: any = await uploadBufferToCloudinary(req.file.buffer, {
        folder: "videos",
        resourceType: "video",
        public_id: publicId,
      });

      // get duration by writing temp file (ffmpeg util expects a file path)
      const tmpFile = path.join(process.cwd(), `tmp_${uuidv4()}.mp4`);
      fs.writeFileSync(tmpFile, req.file.buffer);
      let durationSeconds = null;
      try {
        durationSeconds = await getVideoDuration(tmpFile);
      } catch (dErr) {
        console.warn("Could not get duration:", dErr);
      } finally {
        fs.unlinkSync(tmpFile);
      }

      console.log("✅ Video uploaded to Cloudinary:", result.secure_url);

      return res.json({
        url: result.secure_url,
        public_id: result.public_id,
        durationSeconds,
        size: req.file.size,
      });
    } catch (error) {
      console.error("❌ Video upload failed:", error);
      return res
        .status(500)
        .json({ error: "Upload failed", details: String(error) });
    }
  }
);

/* ---------------------------------------------------------
   /upload-image -> Cloudinary (image)
   returns { url, public_id, size }
--------------------------------------------------------- */
router.post(
  "/upload-image",
  MulterUtil.uploadMemory.single("image"),
  async (req, res) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      const publicId = `image_${uuidv4()}`;

      const result: any = await uploadBufferToCloudinary(req.file.buffer, {
        folder: "images",
        resourceType: "image",
        public_id: publicId,
      });

      console.log("✅ Image uploaded to Cloudinary:", result.secure_url);

      return res.json({
        url: result.secure_url,
        public_id: result.public_id,
        size: req.file.size,
      });
    } catch (error) {
      console.error("❌ Image upload failed:", error);
      return res
        .status(500)
        .json({ error: "Upload failed", details: String(error) });
    }
  }
);

/* ---------------------------------------------------------
   /upload-kenburns-image -> Cloudinary (image single)
--------------------------------------------------------- */
router.post(
  "/upload-kenburns-image",
  MulterUtil.uploadMemory.single("image"),
  async (req, res) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      const publicId = `kenburns_${uuidv4()}`;
      const result: any = await uploadBufferToCloudinary(req.file.buffer, {
        folder: "kenburns",
        resourceType: "image",
        public_id: publicId,
      });

      console.log("✅ KenBurns image uploaded:", result.secure_url);

      return res.json({
        url: result.secure_url,
        public_id: result.public_id,
        size: req.file.size,
      });
    } catch (error) {
      console.error("❌ KenBurns upload failed:", error);
      return res
        .status(500)
        .json({ error: "Upload failed", details: String(error) });
    }
  }
);

/* ---------------------------------------------------------
   /upload-kenburns-folder -> Cloudinary (multiple images)
   keeps same route name/behavior
--------------------------------------------------------- */
router.post(
  "/upload-kenburns-folder",
  MulterUtil.uploadMemory.array("images", 20), // max limit optional
  async (req, res) => {
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      if (files.length === 0)
        return res.status(400).json({ error: "No files uploaded" });

      const uploaded = await Promise.all(
        files.map(async (file) => {
          const publicId = `kenburns_${uuidv4()}`;
          const result: any = await uploadBufferToCloudinary(file.buffer, {
            folder: "kenburns",
            resourceType: "image",
            public_id: publicId,
          });
          return {
            url: result.secure_url,
            public_id: result.public_id,
            size: file.size,
          };
        })
      );

      console.log("✅ KenBurns folder uploaded:", uploaded);
      return res.json({ images: uploaded });
    } catch (error) {
      console.error("❌ KenBurns folder upload failed:", error);
      return res
        .status(500)
        .json({ error: "Upload failed", details: String(error) });
    }
  }
);

/* ---------------------------------------------------------
   /upload-multiple-kenburns-images -> Cloudinary (multiple)
--------------------------------------------------------- */
router.post(
  "/upload-multiple-kenburns-images",
  MulterUtil.uploadMemory.array("images"),
  async (req, res) => {
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      if (files.length === 0)
        return res.status(400).json({ error: "No files uploaded" });

      const uploaded = await Promise.all(
        files.map(async (file) => {
          const publicId = `kenburns_${uuidv4()}`;
          const result: any = await uploadBufferToCloudinary(file.buffer, {
            folder: "kenburns",
            resourceType: "image",
            public_id: publicId,
          });
          return {
            url: result.secure_url,
            public_id: result.public_id,
            size: file.size,
          };
        })
      );

      console.log("✅ Multiple KenBurns images uploaded:", uploaded);
      return res.json({ images: uploaded });
    } catch (error) {
      console.error("❌ Multiple KenBurns upload failed:", error);
      return res
        .status(500)
        .json({ error: "Upload failed", details: String(error) });
    }
  }
);

/* ---------------------------------------------------------
   /upload-multiple-images -> Cloudinary (generic multiple images)
--------------------------------------------------------- */
router.post(
  "/upload-multiple-images",
  MulterUtil.uploadMemory.array("images"),
  async (req, res) => {
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      if (files.length === 0)
        return res.status(400).json({ error: "No files uploaded" });

      const uploaded = await Promise.all(
        files.map(async (file) => {
          const publicId = `image_${uuidv4()}`;
          const result: any = await uploadBufferToCloudinary(file.buffer, {
            folder: "images",
            resourceType: "image",
            public_id: publicId,
          });
          return {
            url: result.secure_url,
            public_id: result.public_id,
            size: file.size,
          };
        })
      );

      console.log("✅ Multiple images uploaded:", uploaded);
      return res.json({ images: uploaded });
    } catch (error) {
      console.error("❌ Multiple images upload failed:", error);
      return res
        .status(500)
        .json({ error: "Upload failed", details: String(error) });
    }
  }
);

router.post(
  "/upload-datasets",
  MulterUtil.uploadMemory.single("file"),
  async (req, res) => {
    try {
      if (!req.file || !req.file.buffer)
        return res.status(400).json({ error: "No file uploaded" });

      const name = path.parse(req.file.originalname).name;
      const ext = path.extname(req.file.originalname);
      const filename = `${name}-${uuidv4()}${ext}`;
      const destPath = `datasets/${filename}`;
      const bucket = process.env.SUPABASE_BUCKET || "uploads";

      const publicUrl = await uploadBufferToSupabase(
        bucket,
        destPath,
        req.file.buffer,
        req.file.mimetype
      );

      console.log("✅ Dataset uploaded to Supabase:", publicUrl);
      return res.json({ url: publicUrl, filename, size: req.file.size });
    } catch (error) {
      console.error("❌ Dataset upload failed:", error);
      return res
        .status(500)
        .json({ error: "Upload failed", details: String(error) });
    }
  }
);

/* ---------------------------------------------------------
   /upload-audio -> Supabase
   returns { url, filename, size }
--------------------------------------------------------- */
router.post(
  "/upload-audio",
  MulterUtil.uploadMemory.single("audio"),
  async (req, res) => {
    try {
      if (!req.file || !req.file.buffer)
        return res.status(400).json({ error: "No audio uploaded" });

      const ext = path.extname(req.file.originalname) || "";
      const filename = `${uuidv4()}${ext}`;
      const destPath = `audios/${filename}`;
      const bucket = process.env.SUPABASE_BUCKET || "uploads";

      const publicUrl = await uploadBufferToSupabase(
        bucket,
        destPath,
        req.file.buffer,
        req.file.mimetype
      );

      console.log("✅ Audio uploaded to Supabase:", publicUrl);
      return res.json({ url: publicUrl, filename, size: req.file.size });
    } catch (error) {
      console.error("❌ Audio upload failed:", error);
      return res
        .status(500)
        .json({ error: "Upload failed", details: String(error) });
    }
  }
);

export default router;
