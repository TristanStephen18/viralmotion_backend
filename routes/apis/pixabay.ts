import type { Request, Response } from "express";
import { Router } from "express";
import axios from "axios";

const router = Router();
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

if (!PIXABAY_API_KEY) {
  throw new Error("❌ Missing PIXABAY_API_KEY in .env");
}

// --- GET /api/pixabay/images?query=xxx ---
router.get("/images", async (req: Request, res: Response) => {
  try {
    const query = req.query.query || "nature";
    const url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(
      String(query)
    )}&image_type=photo&per_page=20`;

    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    console.error("Error fetching Pixabay images:", err);
    res.status(500).json({ error: "Failed to fetch images" });
  }
});

// --- GET /api/pixabay/videos?query=xxx ---
router.get("/videos", async (req: Request, res: Response) => {
  try {
    const query = req.query.query || "travel";
    const url = `https://pixabay.com/api/videos/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(
      String(query)
    )}&per_page=6`;

    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    console.error("Error fetching Pixabay videos:", err);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

export default router;
