import { Request, Response } from "express";
import { db } from "../../db/client.ts";
import {
  users,
  projects,
  renders,
  uploads,
  datasets,
  veo3Generations,
  imageGenerations,
  youtubeDownloads,
  loginAttempts,
  blacklistedTokens,
  subscriptions,
} from "../../db/schema.ts";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { password } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Password is required to delete account",
      });
    }

    // Get user data
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Verify password
    if (!user.passwordHash) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete account without password",
      });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid password",
      });
    }

    // 1. Cancel Stripe subscription if exists
    if (user.stripeCustomerId) {
      try {
        // Get all subscriptions for this customer
        const stripeSubscriptions = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          limit: 100,
        });

        // Cancel all active subscriptions
        for (const sub of stripeSubscriptions.data) {
          if (sub.status === "active" || sub.status === "trialing") {
            await stripe.subscriptions.cancel(sub.id);
          }
        }

        // Optionally delete the customer from Stripe
        // await stripe.customers.del(user.stripeCustomerId);
      } catch (stripeError) {
        console.error("Error canceling Stripe subscription:", stripeError);
        // Continue with account deletion even if Stripe fails
      }
    }

    // 2. Delete all user-related data (tables without CASCADE)
    await db.delete(projects).where(eq(projects.userId, userId));
    await db.delete(renders).where(eq(renders.userId, userId));
    await db.delete(uploads).where(eq(uploads.userId, userId));
    await db.delete(datasets).where(eq(datasets.userId, userId));
    await db.delete(veo3Generations).where(eq(veo3Generations.userId, userId));
    await db.delete(imageGenerations).where(eq(imageGenerations.userId, userId));
    await db.delete(youtubeDownloads).where(eq(youtubeDownloads.userId, userId));

    // 3. Delete login attempts by email
    await db.delete(loginAttempts).where(eq(loginAttempts.email, user.email));

    // 4. Tables with CASCADE will auto-delete:
    // - subscriptions (has onDelete: cascade)
    // - refreshTokens (has onDelete: cascade)

    // 5. Delete the user (this triggers CASCADE deletions)
    await db.delete(users).where(eq(users.id, userId));

    // 6. Add current token to blacklist
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      try {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now
        await db.insert(blacklistedTokens).values({
          token,
          expiresAt,
        });
      } catch (error) {
        console.error("Error blacklisting token:", error);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to delete account",
    });
  }
};