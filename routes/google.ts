import { Router } from "express";
import passport from "passport";
import pkg from "passport-google-oauth20";
import type { Profile } from "passport-google-oauth20";
import { eq } from "drizzle-orm";
import { users } from "../db/schema.ts";
import { db } from "../db/client.ts";
import {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
} from "../utils/tokens.ts";
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "../utils/cookies.ts";

const { Strategy: GoogleStrategy } = pkg;
const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;


const CLIENT_URL =process.env.CLIENT_URL || "https://remotion-web-application.vercel.app";
const BACKEND_URL = process.env.BACKEND_URL || "https://viralmotion-backend-ghxi.onrender.com";

console.log(`🔧 OAuth Config: Backend=${BACKEND_URL}, Client=${CLIENT_URL}`);

// ✅ SECURE: Validate OAuth credentials
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error("Google OAuth credentials not configured");
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${BACKEND_URL}/authenticate/google/callback`,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: (error: any, user?: any) => void
    ) => {
      try {
        const email = profile.emails?.[0].value;
        const name = profile.displayName;
        const photo = profile.photos?.[0].value;

        if (!email) {
          return done(new Error("No email provided by Google"), undefined);
        }

        // ✅ SECURE: Check if user exists
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.email, email));

        let user;

        if (existing) {
          // ✅ Update last login
          await db
            .update(users)
            .set({ lastLogin: new Date() })
            .where(eq(users.id, existing.id));
          
          user = existing;
        } else {
          // ✅ Create new user
          const [newUser] = await db
            .insert(users)
            .values({
              email,
              name,
              provider: "google",
              passwordHash: "", // No password for OAuth users
              profilePicture: photo,
              verified: true, // Google accounts are pre-verified
            })
            .returning();
          
          user = newUser;
        }

        return done(null, user);
      } catch (err) {
        console.error("Google OAuth error:", err);
        return done(err, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

// Start Google Login
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Google callback with token generation
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${CLIENT_URL}/login?error=google_failed`,
    session: false,
  }),
  async (req, res) => {
    try {
      const user = req.user as any;

      if (!user || !user.id || !user.email) {
        return res.redirect(`${CLIENT_URL}/login?error=auth_failed`);
      }

      // Generate tokens
      const accessToken = generateAccessToken({ userId: user.id, email: user.email });
      const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

      // Store refresh token
      const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";
      await storeRefreshToken(user.id, refreshToken, ipAddress, userAgent);

      // Set HTTP-only cookies
      setAccessTokenCookie(res, accessToken);
      setRefreshTokenCookie(res, refreshToken);

      // ✅ FIXED: Redirect to client's loading page with token
      console.log(`✅ Redirecting to: ${CLIENT_URL}/loading?token=${accessToken.substring(0, 20)}...&email=${user.email}`);
      res.redirect(`${CLIENT_URL}/loading?token=${accessToken}&email=${encodeURIComponent(user.email)}`);
    } catch (err) {
      console.error("Google callback error:", err);
      res.redirect(`${CLIENT_URL}/login?error=server_error`);
    }
  }
);

router.get("/google/user", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json({ success: true, user: req.user });
});

router.get("/google/logout", (req, res) => {
  req.logout(() => {
    res.redirect(CLIENT_URL);
  });
});

export default router;