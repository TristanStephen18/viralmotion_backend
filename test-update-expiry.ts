import { db } from "./db/client.ts";
import { subscriptions, notificationHistory } from "./db/schema.ts";
import { sql, like } from "drizzle-orm";

async function updateTestCouponExpiry() {
  console.log("🔧 Updating test coupon expiry dates...\n");

  try {
    // Find test subscriptions
    const testSubs = await db
      .select()
      .from(subscriptions)
      .where(like(subscriptions.specialNotes, "%TEST%"));

    console.log(`📊 Found ${testSubs.length} test subscriptions\n`);

    for (const sub of testSubs) {
      let newExpiry: Date;
      let label: string;

      // Determine new expiry based on coupon code
      if (sub.specialNotes?.includes("TEST7DAY")) {
        newExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
        label = "3 days";
      } else if (sub.specialNotes?.includes("TEST3DAY")) {
        newExpiry = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 1 day
        label = "1 day";
      } else if (sub.specialNotes?.includes("TEST1DAY")) {
        newExpiry = new Date(); // Today
        label = "today (0 days)";
      } else if (sub.specialNotes?.includes("TESTTODAY")) {
        newExpiry = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // Yesterday
        label = "yesterday (-1 day)";
      } else {
        continue;
      }

      // Update subscription
      await db
        .update(subscriptions)
        .set({
          currentPeriodEnd: newExpiry,
          updatedAt: new Date(),
        })
        .where(sql`id = ${sub.id}`);

      console.log(
        `✅ Updated subscription ${sub.id} (${sub.specialNotes}) → expires ${label}`
      );
    }

    // Clear notification history for test users
    console.log("\n🧹 Clearing notification history for test users...");

    await db.delete(notificationHistory).where(
      sql`user_id IN (
        SELECT user_id FROM subscriptions WHERE special_notes LIKE '%TEST%'
      )`
    );

    console.log("✅ Notification history cleared");

    // Show updated subscriptions
    console.log("\n📋 Updated test subscriptions:");
    const updated = await db
      .select()
      .from(subscriptions)
      .where(like(subscriptions.specialNotes, "%TEST%"));

    for (const sub of updated) {
      const daysRemaining = Math.ceil(
        (new Date(sub.currentPeriodEnd).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );
      console.log(
        `   - User ${sub.userId}: ${sub.specialNotes} → expires in ${daysRemaining} days`
      );
    }

    console.log("\n✅ Update complete! Now trigger the cron job.");
  } catch (error) {
    console.error("❌ Error:", error);
  }

  process.exit(0);
}

updateTestCouponExpiry();