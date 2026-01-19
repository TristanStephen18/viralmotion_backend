import { db } from "../db/client.ts";
import { subscriptions } from "../db/schema.ts";
import { eq } from "drizzle-orm";

async function setExpiry(userId: number, hoursFromNow: number) {
  console.log(`\n🔍 Setting expiry for user ${userId}...\n`);

  try {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (!subscription) {
      console.error(`❌ No subscription found for user ${userId}`);
      process.exit(1);
    }

    console.log("📊 BEFORE:");
    console.log(`   Current expiry: ${subscription.currentPeriodEnd}`);

    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + hoursFromNow);

    await db
      .update(subscriptions)
      .set({ currentPeriodEnd: expiryDate })
      .where(eq(subscriptions.userId, userId));

    console.log("\n✅ UPDATED:");
    console.log(`   New expiry: ${expiryDate.toISOString()}`);
    console.log(
      `   (${hoursFromNow > 0 ? `${hoursFromNow} hours from now` : `${Math.abs(hoursFromNow)} hours ago`})`
    );

    const now = new Date();
    const isExpired = expiryDate < now;
    console.log(`   Is expired: ${isExpired ? "✅ YES" : "❌ NO"}`);

    console.log("\n✅ Done!\n");
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Get user ID and hours from command line
const userId = parseInt(process.argv[2]);
const hours = parseInt(process.argv[3] || "-1"); // Default: 1 hour ago

if (!userId || isNaN(userId)) {
  console.error("\n❌ Usage: tsx scripts/setUserCouponExpiry.ts <user_id> <hours_from_now>\n");
  console.error("Examples:");
  console.error("  tsx scripts/setUserCouponExpiry.ts 123 -1   # Set to 1 hour ago (expired)");
  console.error("  tsx scripts/setUserCouponExpiry.ts 123 -24  # Set to 24 hours ago");
  console.error("  tsx scripts/setUserCouponExpiry.ts 123 24   # Set to 24 hours from now");
  console.error("  tsx scripts/setUserCouponExpiry.ts 123 168  # Set to 7 days from now\n");
  process.exit(1);
}

setExpiry(userId, hours);