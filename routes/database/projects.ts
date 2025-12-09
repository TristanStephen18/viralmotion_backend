// server/routes/projects.ts
import type { Response } from "express";
import { Router } from "express";
import { eq, and } from "drizzle-orm";
import type { AuthRequest } from "../../utils/authmiddleware.ts";
import { requireAuth } from "../../utils/authmiddleware.ts";
import { projects } from "../../db/schema.ts";
import { db } from "../../db/client.ts";
import cloudinary from "../../utils/cloudinaryClient.ts";

const router = Router();

// Save new project
router.post("/save", requireAuth, async (req: AuthRequest, res: Response) => {
  const { title, templateId, props, screenshot } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!title || !templateId || !props) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Check duplicate name
  const existing = await db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.title, title)));

  if (existing.length > 0) {
    return res.status(400).json({ error: "Project name already exists." });
  }

  // Insert new project with optional screenshot
  const [newProject] = await db
    .insert(projects)
    .values({
      userId,
      title,
      templateId,
      props,
      screenshot,
      lastUpdated: new Date(),
    })
    .returning();

  res.json({ message: "Project saved successfully", project: newProject });
});

// Update existing project
router.put(
  "/update/:id",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { props, screenshot } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [existing] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.userId, userId), eq(projects.id, Number(id))));

    if (!existing) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Update props and/or video url
    const [updated] = await db
      .update(projects)
      .set({ props, screenshot, lastUpdated: new Date() })
      .where(eq(projects.id, Number(id)))
      .returning();

    res.json({ message: "Project updated successfully", project: updated });
  }
);

// Get a single project by ID
router.get("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.id, Number(id))));

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  res.json(project);
});

// Get all projects for the authenticated user
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId));

    res.json(userProjects);
  } catch (err: any) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Delete a project by ID
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Ensure project exists and belongs to the user
    const [existing] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.userId, userId), eq(projects.id, Number(id))));

    if (!existing) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (existing.screenshot) {
      try {
        const match = existing.screenshot.match(
          /upload\/(?:v\d+\/)?([^\.]+)/
        );
        const publicId = match ? match[1] : null;

        if (publicId) {
          const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: "video",
          });

          console.log("☁️ Cloudinary deletion result:", result);
        } else {
          console.warn(
            "⚠️ Could not extract Cloudinary public_id from URL:",
            existing.screenshot
          );
        }
      } catch (cloudError) {
        console.error("❌ Cloudinary deletion error:", cloudError);
      }
    }

    // Delete the project
    await db.delete(projects).where(eq(projects.id, Number(id)));

    res.json({ message: "Project deleted successfully" });
  } catch (err: any) {
    console.error("Error deleting project:", err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;
