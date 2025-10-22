import { Router } from "express";
import { and, eq } from "drizzle-orm";
import type { AuthRequest } from "../../utils/authmiddleware.ts";
import { requireAuth } from "../../utils/authmiddleware.ts";
import { renders } from "../../db/schema.ts";
import { db } from "../../db/client.ts";
import cloudinary from "../../utils/cloudinaryClient.ts";

const router = Router();

// Get all renders for the authenticated user
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const allRenders = await db
      .select()
      .from(renders)
      .where(eq(renders.userId, userId));
    res.json(allRenders);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch renders", details: String(err) });
  }
});

// Insert a new render for the authenticated user
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user?.userId;
  const { templateId, outputUrl, type } = req.body;
  if (!userId || !templateId || !outputUrl || !type) {
    return res
      .status(400)
      .json({ error: "Missing userId, templateId or outputUrl" });
  }
  try {
    const [newRender] = await db
      .insert(renders)
      .values({ userId, templateId, outputUrl, type })
      .returning();
    res.json({ message: "Render saved", render: newRender });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to save render", details: String(err) });
  }
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // 🔍 Find the render entry for this user
    const [existing] = await db
      .select()
      .from(renders)
      .where(and(eq(renders.userId, userId), eq(renders.id, id)));

    if (!existing) {
      return res.status(404).json({ error: "Render not found" });
    }

    if (existing.outputUrl) {
      try {
        const match = existing.outputUrl.match(/upload\/(?:v\d+\/)?([^\.]+)/);
        const publicId = match ? match[1] : null;

        if (publicId) {
          const resourceType =
            existing.type === "gif" ? "image" : "video";

          const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
          });

          console.log("☁️ Cloudinary deletion result:", result);
        } else {
          console.warn(
            "⚠️ Could not extract Cloudinary public_id from URL:",
            existing.outputUrl
          );
        }
      } catch (cloudErr) {
        console.error("❌ Cloudinary deletion error:", cloudErr);
      }
    }

    // 🗑️ Delete from Neon DB
    await db.delete(renders).where(eq(renders.id, id));

    res.json({ message: "Render deleted successfully" });
  } catch (err) {
    console.error("❌ Failed to delete render:", err);
    res
      .status(500)
      .json({ error: "Failed to delete render", details: String(err) });
  }
});

export default router;
