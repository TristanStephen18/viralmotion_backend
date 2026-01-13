import { Router } from "express";
import { db } from "../db/client.ts";
import { notifications } from "../db/schema.ts";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../utils/authmiddleware.ts";
import type { AuthRequest } from "../utils/authmiddleware.ts";

const router = Router();

// Get user notifications
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    const unreadCount = userNotifications.filter((n) => !n.isRead).length;

    res.json({
      success: true,
      notifications: userNotifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error("Get notifications error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark notification as read (Enhanced)
router.put(
  "/:notificationId/read",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      const notificationId = parseInt(req.params.notificationId);

      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, userId)
          )
        );

      // ✅ OPTIONAL: Return new unread count
      const unreadNotifications = await db
        .select()
        .from(notifications)
        .where(
          and(eq(notifications.userId, userId), eq(notifications.isRead, false))
        );

      res.json({
        success: true,
        unreadCount: unreadNotifications.length, // ✅ Helpful for frontend
      });
    } catch (error: any) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Mark all as read (Enhanced)
router.put("/read-all", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));

    res.json({
      success: true,
      unreadCount: 0, // ✅ Always 0 after marking all as read
    });
  } catch (error: any) {
    console.error("Mark all read error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark all notifications as read
router.put("/read-all", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));

    res.json({ success: true });
  } catch (error: any) {
    console.error("Mark all read error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete notification
router.delete(
  "/:notificationId",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      const notificationId = parseInt(req.params.notificationId);

      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, userId)
          )
        );

      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete notification error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;
