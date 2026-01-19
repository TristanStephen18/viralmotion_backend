import { Router } from "express";
import { db } from "../db/client.ts";
import { notifications } from "../db/schema.ts";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../utils/authmiddleware.ts";
import type { AuthRequest } from "../utils/authmiddleware.ts";
import { emitNotificationUpdate } from '../services/socketService.ts';

const router = Router();

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

router.put("/:notificationId/read", requireAuth, async (req: AuthRequest, res) => {
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

    emitNotificationUpdate(userId, 'notification-read', notificationId);

    const unreadNotifications = await db
      .select()
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false))
      );

    res.json({
      success: true,
      unreadCount: unreadNotifications.length,
    });
  } catch (error: any) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

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

    emitNotificationUpdate(userId, 'notifications-all-read', {});

    res.json({
      success: true,
      unreadCount: 0,
    });
  } catch (error: any) {
    console.error("Mark all read error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete("/:notificationId", requireAuth, async (req: AuthRequest, res) => {
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

    emitNotificationUpdate(userId, 'notification-deleted', notificationId);

    res.json({ success: true });
  } catch (error: any) {
    console.error("Delete notification error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// // ✅ TEST ENDPOINT
// router.post("/test", requireAuth, async (req: AuthRequest, res) => {
//   try {
//     const userId = req.user?.userId;
//     if (!userId) {
//       return res.status(401).json({ success: false, error: "Unauthorized" });
//     }

//     const { createNotification } = await import("../services/notificationService.ts");
    
//     await createNotification({
//       userId,
//       type: "test",
//       title: "🧪 Test Notification",
//       message: "This is a real-time test notification sent at " + new Date().toLocaleTimeString(),
//       metadata: { test: true, timestamp: Date.now() }
//     });

//     res.json({ success: true, message: "Test notification sent!" });
//   } catch (error: any) {
//     console.error("Test notification error:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

export default router;