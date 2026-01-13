import { db } from "../db/client.ts";
import { notifications, notificationHistory } from "../db/schema.ts";
import { sql } from "drizzle-orm";

interface CreateNotificationParams {
  userId: number;
  type: string;
  title: string;
  message: string;
  metadata?: any;
}

export const createNotification = async (params: CreateNotificationParams) => {
  const { userId, type, title, message, metadata } = params;

  try {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId,
        type,
        title,
        message,
        metadata: metadata || null,
        isRead: false,
      })
      .returning();

    console.log(`✅ Notification created for user ${userId}: ${title}`);
    return notification;
  } catch (error) {
    console.error("❌ Failed to create notification:", error);
    throw error;
  }
};

// ✅ UPDATED: subscriptionId is string (UUID)
export const trackNotificationSent = async (
  userId: number,
  subscriptionId: string, // ✅ UUID as string
  notificationType: string,
  metadata?: any
) => {
  try {
    await db.insert(notificationHistory).values({
      userId,
      subscriptionId,
      notificationType,
      metadata: metadata || null,
    });
    console.log(`📝 Tracked: ${notificationType} for user ${userId}`);
  } catch (error) {
    console.error("❌ Failed to track notification:", error);
  }
};

// ✅ UPDATED: subscriptionId is string (UUID)
export const hasNotificationBeenSent = async (
  userId: number,
  subscriptionId: string, // ✅ UUID as string
  notificationType: string
): Promise<boolean> => {
  try {
    const history = await db
      .select()
      .from(notificationHistory)
      .where(
        sql`user_id = ${userId} AND subscription_id = ${subscriptionId}::uuid AND notification_type = ${notificationType}`
      )
      .limit(1);

    return history.length > 0;
  } catch (error) {
    console.error("❌ Error checking notification history:", error);
    return false; // ✅ Fail gracefully
  }
};