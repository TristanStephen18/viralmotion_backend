import { Router } from "express";
import { eq, and, gte, desc } from "drizzle-orm";
import { users, loginAttempts, refreshTokens } from "../../db/schema.ts";
import { db } from "../../db/client.ts";
import { requireAuth, require2FA } from "../../utils/authmiddleware.ts";
import type { AuthRequest } from "../../utils/authmiddleware.ts";
import { sendEmailVerification, sendOtpEmail } from "../apis/nodemailer.ts";
import {
  authRateLimiter,
  signupRateLimiter,
  passwordResetRateLimiter,
} from "../../middleware/rateLimiter.ts";
import {
  validateSignupInput,
  validateLoginInput,
} from "../../middleware/validator.ts";
import { hashPassword, comparePassword } from "../../utils/password.ts";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  storeRefreshToken,
  revokeRefreshToken,
  blacklistToken,
} from "../../utils/tokens.ts";
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
} from "../../utils/cookies.ts";
import {
  generateTwoFactorSecret,
  generateQRCode,
  verifyTwoFactorToken,
} from "../../utils/twoFactor.ts";
import { JWT_SECRET, LOCKOUT_CONFIG } from "./config.ts";
import jwt from "jsonwebtoken";
import { GoTrueAdminApi } from "@supabase/supabase-js";

const router = Router();

const CLIENT_URL = process.env.NODE_ENV === 'production'
  ? (process.env.CLIENT_URL || "https://remotion-web-application.vercel.app")
  : "http://localhost:5173";


router.post("/signup", signupRateLimiter, validateSignupInput, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      
      return res.status(400).json({ error: "Invalid registration details" });
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash,
        provider: "local",
        profilePicture: "https://res.cloudinary.com/dnxc1lw18/image/upload/v1761048476/pfp_yitfgl.jpg",
        verified: false,
      })
      .returning();

    const protocol = req.protocol;
    const host = req.get("host");
    const baseUrl = `${protocol}://${host}`;
    await sendEmailVerification(newUser.id, email, baseUrl);

    res.json({ 
      success: true,
      message: "Signup successful. Please verify your email." 
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});


router.post("/login", authRateLimiter, validateLoginInput, async (req, res) => {
  const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
  
  try {
    const { email, password } = req.body;

    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user || !user.passwordHash) {
     
      await db.insert(loginAttempts).values({
        email,
        ipAddress,
        successful: false,
      });
      
     
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // ✅ NEW: Check if account is locked
    if (user.accountLocked && user.lockoutUntil && new Date() < user.lockoutUntil) {
      return res.status(403).json({ 
        error: "Account temporarily locked. Please try again later.",
        lockoutUntil: user.lockoutUntil
      });
    }

    
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentAttempts = await db
      .select()
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.email, email),
          gte(loginAttempts.attemptedAt, fifteenMinutesAgo),
          eq(loginAttempts.successful, false)
        )
      );

    if (recentAttempts.length >= LOCKOUT_CONFIG.maxAttempts) {
      // Lock account
      const lockoutUntil = new Date(Date.now() + LOCKOUT_CONFIG.lockoutDuration);
      await db
        .update(users)
        .set({ accountLocked: true, lockoutUntil })
        .where(eq(users.id, user.id));

      return res.status(403).json({ 
        error: "Too many failed attempts. Account locked for 15 minutes.",
        lockoutUntil
      });
    }

    if (!user.verified) {
      return res.status(403).json({ 
        error: "Please verify your email before logging in." 
      });
    }

    const valid = await comparePassword(password, user.passwordHash);
    
    if (!valid) {
      
      await db.insert(loginAttempts).values({
        email,
        ipAddress,
        successful: false,
      });
      
      return res.status(400).json({ error: "Invalid credentials" });
    }

   
    await db.insert(loginAttempts).values({
      email,
      ipAddress,
      successful: true,
    });

    
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id));

   
    if (user.twoFactorEnabled) {
      
      const tempToken = jwt.sign({ userId: user.id, requires2FA: true }, JWT_SECRET, {
        expiresIn: "5m",
      });
      
      return res.json({
        requires2FA: true,
        tempToken,
        message: "Please provide 2FA code",
      });
    }

   
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

   
    const userAgent = req.headers["user-agent"] || "unknown";
    await storeRefreshToken(user.id, refreshToken, ipAddress, userAgent);

 
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      success: true,
      message: "Login successful",
      token: accessToken, 
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});


router.post("/verify-2fa", async (req, res) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const decoded = jwt.verify(tempToken, JWT_SECRET) as { 
      userId: number; 
      requires2FA: boolean;
    };

    if (!decoded.requires2FA) {
      return res.status(400).json({ error: "Invalid token" });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId));

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const valid = verifyTwoFactorToken(code, user.twoFactorSecret);

    if (!valid) {
      return res.status(400).json({ error: "Invalid 2FA code" });
    }

   
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";
    await storeRefreshToken(user.id, refreshToken, ipAddress, userAgent);

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      success: true,
      message: "Login successful",
      token: accessToken,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error("2FA verification error:", err);
    res.status(400).json({ error: "Invalid or expired token" });
  }
});


router.post("/refresh-token", async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: "No refresh token provided" });
    }

    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

   
    const [storedToken] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, refreshToken));

    if (!storedToken || storedToken.revoked) {
      return res.status(401).json({ error: "Token has been revoked" });
    }

   
    const accessToken = generateAccessToken({ 
      userId: payload.userId, 
      email: payload.email 
    });

    setAccessTokenCookie(res, accessToken);

    res.json({
      success: true,
      token: accessToken,
    });
  } catch (err) {
    console.error("Token refresh error:", err);
    res.status(401).json({ error: "Failed to refresh token" });
  }
});


router.post("/logout", requireAuth, async (req: AuthRequest, res) => {
  try {
    const accessToken = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
    const refreshToken = req.cookies?.refreshToken;

    
    if (accessToken) {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);
      await blacklistToken(accessToken, expiresAt);
    }

    
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    clearAuthCookies(res);

    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Logout failed" });
  }
});


router.get("/verify", async (req, res) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Invalid verification link" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

    await db
      .update(users)
      .set({ verified: true })
      .where(eq(users.id, decoded.userId));

    // Dynamic URL
    res.redirect(`${CLIENT_URL}/login?verified=true`);
  } catch (err) {
    console.error("Verification error:", err);
    res.status(400).json({ error: "Invalid or expired token" });
  }
});


router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        profilePicture: users.profilePicture,
        twoFactorEnabled: users.twoFactorEnabled,
        lastLogin: users.lastLogin,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});


router.post("/2fa/enable", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: "2FA is already enabled" });
    }

    let secret: string;
    let otpauthUrl: string;

    
    if (user.twoFactorSecret) {
      
      secret = user.twoFactorSecret;
      
      
      otpauthUrl = `otpauth://totp/ViralMotion:${user.email}?secret=${secret}&issuer=ViralMotion`;
      
      console.log(`♻️ Reusing existing 2FA secret for user ${user.email}`);
    } else {
      
      const secretData = generateTwoFactorSecret(user.email);
      secret = secretData.secret;
      otpauthUrl = secretData.otpauthUrl;
      
      
      await db
        .update(users)
        .set({ twoFactorSecret: secret })
        .where(eq(users.id, userId));
      
      console.log(`✨ Generated new 2FA secret for user ${user.email}`);
    }

    const qrCode = await generateQRCode(otpauthUrl);

    res.json({
      success: true,
      secret,
      qrCode,
      message: user.twoFactorSecret 
        ? "Scan QR code with your authenticator app (reusing existing setup)"
        : "Scan QR code with your authenticator app",
    });
  } catch (err) {
    console.error("2FA enable error:", err);
    res.status(500).json({ error: "Failed to enable 2FA" });
  }
});


router.post("/2fa/confirm", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user?.userId;
  const { code } = req.body;

  if (!userId || !code) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: "2FA setup not initiated" });
    }

    const valid = verifyTwoFactorToken(code, user.twoFactorSecret);

    if (!valid) {
      return res.status(400).json({ error: "Invalid code" });
    }

    await db
      .update(users)
      .set({ twoFactorEnabled: true })
      .where(eq(users.id, userId));

    res.json({
      success: true,
      message: "2FA enabled successfully",
    });
  } catch (err) {
    console.error("2FA confirm error:", err);
    res.status(500).json({ error: "Failed to confirm 2FA" });
  }
});


router.post("/2fa/disable", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user?.userId;
  const { password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ error: "Password required" });
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const valid = await comparePassword(password, user.passwordHash);
    
    if (!valid) {
      return res.status(400).json({ error: "Invalid password" });
    }

    
    await db
      .update(users)
      .set({ 
        twoFactorEnabled: false,
       
      })
      .where(eq(users.id, userId));

    res.json({
      success: true,
      message: "2FA disabled successfully",
    });
  } catch (err) {
    console.error("2FA disable error:", err);
    res.status(500).json({ error: "Failed to disable 2FA" });
  }
});

router.post("/2fa/reset", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { secret, otpauthUrl } = generateTwoFactorSecret(user.email);
    const qrCode = await generateQRCode(otpauthUrl);

    await db
      .update(users)
      .set({ 
        twoFactorSecret: secret,
        twoFactorEnabled: false,
      })
      .where(eq(users.id, userId));

    res.json({
      success: true,
      secret,
      qrCode,
      message: "2FA reset successfully",
    });
  } catch (err) {
    console.error("2FA reset error:", err);
    res.status(500).json({ error: "Failed to reset 2FA" });
  }
});


router.put("/update-profile-picture", requireAuth, async (req: AuthRequest, res) => {
  const { profile_pic } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const [updated] = await db
      .update(users)
      .set({ profilePicture: profile_pic })
      .where(eq(users.id, userId))
      .returning();

    res.json({
      success: true,
      message: "Profile picture updated successfully",
      user: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update profile picture" });
  }
});


router.put("/update-username", requireAuth, async (req: AuthRequest, res) => {
  const { username } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const [updated] = await db
      .update(users)
      .set({ name: username })
      .where(eq(users.id, userId))
      .returning();

    res.json({ success: true, message: "Username updated successfully", user: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update username" });
  }
});


router.put("/update-password", requireAuth, async (req: AuthRequest, res) => {
  const { oldPassword, newPassword, twoFactorCode } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(400).json({ 
          error: "2FA code required",
          requires2FA: true 
        });
      }

      if (!user.twoFactorSecret) {
        return res.status(400).json({ error: "2FA not properly configured" });
      }

      const valid = verifyTwoFactorToken(twoFactorCode, user.twoFactorSecret);
      
      if (!valid) {
        return res.status(400).json({ error: "Invalid 2FA code" });
      }
    }

    const valid = await comparePassword(oldPassword, user.passwordHash);
    
    if (!valid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const newPasswordHash = await hashPassword(newPassword);
    
    await db
      .update(users)
      .set({ 
        passwordHash: newPasswordHash,
        passwordChangedAt: new Date()
      })
      .where(eq(users.id, userId));

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Password update error:", err);
    res.status(500).json({ error: "Failed to update password" });
  }
});


router.post("/reset-password", passwordResetRateLimiter, async (req, res) => {
  const { newPassword, email, resetToken } = req.body;

  if (!newPassword || !email || !resetToken) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    
    const decoded = jwt.verify(resetToken, JWT_SECRET) as { email: string };

    if (decoded.email !== email) {
      return res.status(400).json({ error: "Invalid reset token" });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newPasswordHash = await hashPassword(newPassword);

    await db
      .update(users)
      .set({ 
        passwordHash: newPasswordHash,
        passwordChangedAt: new Date()
      })
      .where(eq(users.email, email));

    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error("Password reset error:", err);
    res.status(400).json({ error: "Invalid or expired reset token" });
  }
});


router.post("/send-otp", passwordResetRateLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const [existing] = await db.select().from(users).where(eq(users.email, email));

    if (!existing) {
      
      return res.json({ 
        success: true,
        message: "If an account exists, an OTP has been sent" 
      });
    }

    const otp = await sendOtpEmail(email);
    
    res.json({ success: true, message: "OTP sent", token: otp });
  } catch (err) {
    console.error("OTP error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});


router.post("/verify-otp", async (req, res) => {
  const { email, otp, otpToken } = req.body;

  if (!email || !otp || !otpToken) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const decoded = jwt.verify(otpToken, JWT_SECRET) as { email: string; otp: string };

    if (decoded.email !== email || decoded.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const resetToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: "15m" });

    res.json({
      success: true,
      message: "OTP verified successfully",
      resetToken,
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(400).json({ error: "Invalid or expired OTP" });
  }
});


router.post("/google-login", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";
    await storeRefreshToken(user.id, refreshToken, ipAddress, userAgent);

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));

    res.json({
      success: true,
      message: "Login successful",
      token: accessToken,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;