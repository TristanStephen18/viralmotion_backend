import express from "express";
import {
  getVideoInfo,
  downloadVideo,
  getDownloads,
  getDownloadById,
  deleteDownload,
} from "../../controllers/youtube/youtubeController.ts";
import { requireAuth } from "../../utils/authmiddleware.ts";

const router = express.Router();

// Public endpoint - get video info
router.post("/info", getVideoInfo);

router.get("/test-auth", requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json({ 
    success: true, 
    message: "Auth works!", 
    user: user,
    userId: user?.id ?? user?.userId
  });
});

// Protected endpoints - require authentication
router.post("/download", requireAuth, downloadVideo);
router.get("/downloads", requireAuth, getDownloads);
router.get("/downloads/:id", requireAuth, getDownloadById);
router.delete("/downloads/:id", requireAuth, deleteDownload);

export default router;