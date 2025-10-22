import { Router } from "express";
import { eq, and } from "drizzle-orm";
import type { AuthRequest } from "../../utils/authmiddleware.ts";
import { requireAuth } from "../../utils/authmiddleware.ts";
import { datasets } from "../../db/schema.ts";
import { db } from "../../db/client.ts";
import {
  extractFromJsonPath,
  extractFromXlsxPath,
} from "../../utils/datasetextractor.ts";
import { datasetFormatterUsingAi } from "../apis/gemini.ts";
import { supabase } from "../../utils/supabaseClient.ts";

const router = Router();

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user?.userId;
  const { type, url, template } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!type || !url) {
    return res.status(400).json({ error: "Missing type or url" });
  }

  let filedata;

  if (type === "json") {
    filedata = await extractFromJsonPath(url);
  } else {
    filedata = await extractFromXlsxPath(url);
  }

  const formattedData = await datasetFormatterUsingAi(template, type, filedata);

  try {
    const [newDataset] = await db
      .insert(datasets)
      .values({ userId, type, url })
      .returning();

    console.log("Original data from file: ", filedata);
    res.json({
      message: "Dataset saved",
      Dataset: newDataset,
      extractedData: formattedData,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to save Dataset", details: String(err) });
  }
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // 🔍 Get the dataset record
    const [existing] = await db
      .select()
      .from(datasets)
      .where(and(eq(datasets.userId, userId), eq(datasets.id, Number(id))));

    if (!existing) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    // ☁️ If it has a Supabase file URL, try deleting the file
    if (existing.url) {
      try {
        // Extract bucket path:
        // Example: https://xyz.supabase.co/storage/v1/object/public/datasets/user123/file.csv
        // We want: datasets/user123/file.csv
        const match = existing.url.match(/object\/public\/(.+)/);
        const filePath = match ? match[1] : null;

        if (filePath) {
          const [bucket, ...pathParts] = filePath.split("/");
          const path = pathParts.join("/");

          const { error: deleteError } = await supabase.storage
            .from(bucket)
            .remove([path]);

          if (deleteError) {
            console.error("❌ Supabase delete error:", deleteError);
          } else {
            console.log("☁️ Deleted from Supabase:", filePath);
          }
        }
      } catch (supabaseErr) {
        console.error(
          "❌ Failed to parse or delete from Supabase:",
          supabaseErr
        );
      }
    }

    // 🗑️ Finally, delete from DB
    await db.delete(datasets).where(eq(datasets.id, Number(id)));

    res.json({ message: "Dataset deleted" });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res
      .status(500)
      .json({ error: "Failed to delete dataset", details: String(err) });
  }
});

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const userdatasets = await db
      .select()
      .from(datasets)
      .where(eq(datasets.userId, userId));
    res.json(userdatasets);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch datasets", details: String(err) });
  }
});

export default router;
