var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// index.ts
import express12 from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport2 from "passport";

// middleware/rateLimiter.ts
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
var rateLimitConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  // Skip failing requests and validate trust proxy
  validate: {
    trustProxy: false,
    // Disable validation in development
    xForwardedForHeader: false
  }
};
var generalRateLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 15 * 60 * 1e3,
  max: 100,
  message: { error: "Too many requests, please try again later" }
});
var authRateLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 15 * 60 * 1e3,
  max: 5,
  message: { error: "Too many login attempts, please try again after 15 minutes" },
  skipSuccessfulRequests: true
});
var signupRateLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 60 * 60 * 1e3,
  max: 3,
  message: { error: "Too many accounts created, please try again later" }
});
var passwordResetRateLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 60 * 60 * 1e3,
  max: 3,
  message: { error: "Too many password reset attempts, please try again later" }
});
var speedLimiter = slowDown({
  windowMs: 15 * 60 * 1e3,
  delayAfter: 50,
  delayMs: (hits) => hits * 100,
  validate: {
    trustProxy: false
  }
});

// middleware/securityHeaders.ts
import helmet from "helmet";
var securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536e3,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: "deny" },
  noSniff: true,
  xssFilter: true
});

// utils/tokens.ts
import jwt from "jsonwebtoken";

// db/client.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminAuditLogs: () => adminAuditLogs,
  adminUsers: () => adminUsers,
  analyticsEvents: () => analyticsEvents,
  blacklistedTokens: () => blacklistedTokens,
  datasets: () => datasets,
  imageGenerations: () => imageGenerations,
  loginAttempts: () => loginAttempts,
  pageVisits: () => pageVisits,
  projects: () => projects,
  refreshTokens: () => refreshTokens,
  renders: () => renders,
  subscriptions: () => subscriptions,
  templates: () => templates,
  uploads: () => uploads,
  usageTracking: () => usageTracking,
  users: () => users,
  veo3Generations: () => veo3Generations,
  youtubeDownloads: () => youtubeDownloads
});
import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  jsonb,
  uuid,
  boolean,
  index,
  varchar
} from "drizzle-orm/pg-core";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"),
  provider: text("provider"),
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  verified: boolean("verified").default(false).notNull(),
  // 2FA fields
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  twoFactorSecret: text("two_factor_secret"),
  // Account security fields
  accountLocked: boolean("account_locked").default(false).notNull(),
  lockoutUntil: timestamp("lockout_until"),
  lastLogin: timestamp("last_login"),
  passwordChangedAt: timestamp("password_changed_at"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique()
});
var templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  propsSchema: jsonb("props_schema").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  templateId: integer("template_id").references(() => templates.id).notNull(),
  title: text("title").notNull(),
  props: jsonb("props").notNull(),
  projectVidUrl: text("project_vidurl").default(""),
  screenshot: text("screentshot").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull()
});
var renders = pgTable("renders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  templateId: integer("template_id").references(() => templates.id).notNull(),
  type: text("type").$type().notNull(),
  outputUrl: text("output_url"),
  renderedAt: timestamp("rendered_at").defaultNow().notNull()
});
var uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").$type().notNull(),
  url: text("url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull()
});
var datasets = pgTable("datasets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").$type().notNull(),
  url: text("url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull()
});
var veo3Generations = pgTable("veo3_generations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  prompt: text("prompt").notNull(),
  model: text("model").default("veo-3.1-generate-preview").notNull(),
  duration: text("duration").default("8s").notNull(),
  aspectRatio: text("aspect_ratio").default("16:9").notNull(),
  status: text("status").$type().default("pending").notNull(),
  videoUrl: text("video_url"),
  referenceImageUrl: text("reference_image_url"),
  referenceType: text("reference_type"),
  thumbnailUrl: text("thumbnail_url"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at")
});
var imageGenerations = pgTable(
  "image_generations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    prompt: text("prompt").notNull(),
    model: text("model").notNull(),
    aspectRatio: text("aspect_ratio").notNull(),
    imageUrl: text("image_url").notNull(),
    status: text("status").$type().default("completed").notNull(),
    errorMessage: text("error_message"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (table) => ({
    userIdIdx: index("image_generations_user_id_idx").on(table.userId)
  })
);
var youtubeDownloads = pgTable("youtube_downloads", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  videoId: text("video_id").notNull(),
  videoUrl: text("video_url").notNull(),
  title: text("title").notNull(),
  thumbnail: text("thumbnail"),
  duration: text("duration"),
  views: text("views"),
  likes: text("likes"),
  quality: text("quality").notNull(),
  filesize: integer("filesize"),
  downloadedVideoUrl: text("downloaded_video_url"),
  status: text("status").$type().default("pending").notNull(),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at")
});
var refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    revoked: boolean("revoked").default(false).notNull(),
    revokedAt: timestamp("revoked_at")
  },
  (table) => ({
    userIdIdx: index("refresh_tokens_user_id_idx").on(table.userId),
    tokenIdx: index("refresh_tokens_token_idx").on(table.token)
  })
);
var loginAttempts = pgTable(
  "login_attempts",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    ipAddress: text("ip_address").notNull(),
    attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
    successful: boolean("successful").notNull()
  },
  (table) => ({
    emailIdx: index("login_attempts_email_idx").on(table.email),
    ipIdx: index("login_attempts_ip_idx").on(table.ipAddress)
  })
);
var blacklistedTokens = pgTable(
  "blacklisted_tokens",
  {
    id: serial("id").primaryKey(),
    token: text("token").notNull().unique(),
    blacklistedAt: timestamp("blacklisted_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull()
  },
  (table) => ({
    tokenIdx: index("blacklisted_tokens_token_idx").on(table.token)
  })
);
var subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    // ✅ FIXED: Make these nullable for free trials
    stripeSubscriptionId: varchar("stripe_subscription_id", {
      length: 255
    }).unique(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    stripePriceId: varchar("stripe_price_id", { length: 255 }),
    billingInterval: varchar("billing_interval", { length: 20 }).$type().default("monthly").notNull(),
    // ✅ Lifetime/Company Account Fields
    isLifetime: boolean("is_lifetime").default(false).notNull(),
    isCompanyAccount: boolean("is_company_account").default(false).notNull(),
    companyName: text("company_name"),
    specialNotes: text("special_notes"),
    grantedBy: integer("granted_by").references(() => adminUsers.id),
    // Rest stays the same...
    status: varchar("status", { length: 50 }).$type().default("active").notNull(),
    plan: varchar("plan", { length: 50 }).$type().default("free").notNull(),
    currentPeriodStart: timestamp("current_period_start").notNull(),
    currentPeriodEnd: timestamp("current_period_end").notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    canceledAt: timestamp("canceled_at"),
    trialStart: timestamp("trial_start"),
    trialEnd: timestamp("trial_end"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
  },
  (table) => {
    return {
      userIdIdx: index("subscriptions_user_id_idx").on(table.userId),
      statusIdx: index("subscriptions_status_idx").on(table.status),
      stripeSubIdIdx: index("subscriptions_stripe_sub_id_idx").on(
        table.stripeSubscriptionId
      )
    };
  }
);
var adminUsers = pgTable(
  "admin_users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: text("role").$type().default("admin").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastLogin: timestamp("last_login"),
    passwordChangedAt: timestamp("password_changed_at"),
    active: boolean("active").default(true).notNull()
    // passwordChangedAt: timestamp("password_changed_at")
  },
  (table) => ({
    emailIdx: index("admin_users_email_idx").on(table.email)
  })
);
var pageVisits = pgTable(
  "page_visits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: integer("user_id").references(() => users.id),
    page: text("page").notNull(),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    referrer: text("referrer"),
    sessionId: text("session_id"),
    visitedAt: timestamp("visited_at").defaultNow().notNull()
  },
  (table) => ({
    userIdIdx: index("page_visits_user_id_idx").on(table.userId),
    pageIdx: index("page_visits_page_idx").on(table.page),
    visitedAtIdx: index("page_visits_visited_at_idx").on(table.visitedAt)
  })
);
var analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: integer("user_id").references(() => users.id),
    eventType: text("event_type").notNull(),
    // signup, login, subscription, video_created, etc.
    eventData: jsonb("event_data"),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (table) => ({
    userIdIdx: index("analytics_events_user_id_idx").on(table.userId),
    eventTypeIdx: index("analytics_events_event_type_idx").on(table.eventType),
    createdAtIdx: index("analytics_events_created_at_idx").on(table.createdAt)
  })
);
var adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminId: integer("admin_id").references(() => adminUsers.id, { onDelete: "cascade" }).notNull(),
    action: varchar("action", { length: 255 }).notNull(),
    // e.g., "DELETE_USER", "GRANT_LIFETIME"
    targetType: varchar("target_type", { length: 100 }),
    // e.g., "USER", "SUBSCRIPTION"
    targetId: integer("target_id"),
    // ID of affected resource
    targetEmail: text("target_email"),
    // Email of affected user (for easier searching)
    details: jsonb("details"),
    // Additional context (sanitized)
    ipAddress: varchar("ip_address", { length: 45 }),
    // IPv4/IPv6
    userAgent: text("user_agent"),
    status: varchar("status", { length: 50 }).$type().notNull(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (table) => ({
    adminIdIdx: index("admin_audit_logs_admin_id_idx").on(table.adminId),
    actionIdx: index("admin_audit_logs_action_idx").on(table.action),
    targetTypeIdx: index("admin_audit_logs_target_type_idx").on(
      table.targetType
    ),
    targetIdIdx: index("admin_audit_logs_target_id_idx").on(table.targetId),
    createdAtIdx: index("admin_audit_logs_created_at_idx").on(table.createdAt),
    statusIdx: index("admin_audit_logs_status_idx").on(table.status)
  })
);
var usageTracking = pgTable(
  "usage_tracking",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
    // One row per user
    // ✅ SIMPLIFIED: Only track videos created (creation = export)
    videosThisMonth: integer("videos_this_month").default(0).notNull(),
    lastVideoReset: timestamp("last_video_reset").defaultNow().notNull(),
    // ✅ AI generation tracking (daily limit)
    aiGenerationsToday: integer("ai_generations_today").default(0).notNull(),
    lastAiReset: timestamp("last_ai_reset").defaultNow().notNull(),
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
  },
  (table) => ({
    userIdIdx: index("usage_tracking_user_id_idx").on(table.userId)
  })
);

// db/client.ts
import "dotenv/config";
var isLocal = process.env.DATABASE_URL?.includes("localhost");
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});
var db = drizzle(pool, { schema: schema_exports });

// utils/tokens.ts
import { eq, lt } from "drizzle-orm";

// routes/database/config.ts
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "super-secret-key") {
  throw new Error(
    "\u{1F6A8} CRITICAL: JWT_SECRET must be set in environment variables and cannot be the default value!"
  );
}
if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error("\u{1F6A8} CRITICAL: JWT_REFRESH_SECRET must be set in environment variables!");
}
var JWT_SECRET = process.env.JWT_SECRET;
var JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
var JWT_EXPIRES_IN = "10h";
var JWT_REFRESH_EXPIRES_IN = "30d";
var isDevelopment = process.env.NODE_ENV !== "production";
var COOKIE_OPTIONS = {
  httpOnly: true,
  // Prevents XSS attacks
  secure: !isDevelopment,
  // false in dev, true in prod
  sameSite: isDevelopment ? "lax" : "none",
  // lax for dev, none for prod
  maxAge: 30 * 24 * 60 * 60 * 1e3,
  // ✅ CHANGED: 30 days (was 7 days)
  path: "/",
  domain: isDevelopment ? void 0 : process.env.COOKIE_DOMAIN
};
var ACCESS_TOKEN_COOKIE = {
  ...COOKIE_OPTIONS,
  maxAge: 15 * 60 * 1e3
  // 15 minutes
};
var RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 5,
  // 5 attempts
  message: "Too many attempts, please try again later"
};
var LOCKOUT_CONFIG = {
  maxAttempts: 5,
  lockoutDuration: 15 * 60 * 1e3
  // 15 minutes
};
var PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
};
var BCRYPT_ROUNDS = 12;

// utils/tokens.ts
var generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
var generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};
var verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch {
    return null;
  }
};
var storeRefreshToken = async (userId, token, ipAddress, userAgent) => {
  const expiresAt = /* @__PURE__ */ new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await db.insert(refreshTokens).values({ userId, token, expiresAt, ipAddress, userAgent });
};
var revokeRefreshToken = async (token) => {
  await db.update(refreshTokens).set({ revoked: true, revokedAt: /* @__PURE__ */ new Date() }).where(eq(refreshTokens.token, token));
};
var isTokenBlacklisted = async (token) => {
  const [result] = await db.select().from(blacklistedTokens).where(eq(blacklistedTokens.token, token));
  return !!result;
};
var blacklistToken = async (token, expiresAt) => {
  await db.insert(blacklistedTokens).values({ token, expiresAt });
};
var cleanupExpiredTokens = async () => {
  const now = /* @__PURE__ */ new Date();
  await db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, now));
  await db.delete(blacklistedTokens).where(lt(blacklistedTokens.expiresAt, now));
};

// routes/proxy.ts
import express from "express";
var router = express.Router();
var PEXELS_API_KEY = process.env.PEXELS_API_KEY;
var GIPHY_API_KEY = process.env.GIPHY_API_KEY;
var FREESOUND_API_KEY = process.env.FREESOUND_API_KEY;
router.get("/pexels/photos", async (req, res) => {
  const { query, per_page = "30" } = req.query;
  try {
    let endpoint;
    if (query && String(query).trim() !== "") {
      endpoint = `https://api.pexels.com/v1/search?query=${encodeURIComponent(String(query))}&per_page=${per_page}`;
    } else {
      endpoint = `https://api.pexels.com/v1/curated?per_page=${per_page}`;
    }
    console.log("\u{1F4F8} Pexels Photos Proxy:", endpoint);
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Authorization": PEXELS_API_KEY,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      console.error("\u274C Pexels API error:", response.status, response.statusText);
      return res.status(response.status).json({
        error: "Pexels API error",
        status: response.status
      });
    }
    const data = await response.json();
    console.log("\u2705 Pexels Photos: Found", data.photos?.length || 0, "photos");
    res.json(data);
  } catch (error) {
    console.error("\u274C Pexels photos proxy error:", error);
    res.status(500).json({
      error: "Failed to fetch from Pexels",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
router.get("/pexels/videos", async (req, res) => {
  const { query, per_page = "30" } = req.query;
  try {
    let endpoint;
    if (query && String(query).trim() !== "") {
      endpoint = `https://api.pexels.com/videos/search?query=${encodeURIComponent(String(query))}&per_page=${per_page}`;
    } else {
      endpoint = `https://api.pexels.com/videos/popular?per_page=${per_page}`;
    }
    console.log("\u{1F3AC} Pexels Videos Proxy:", endpoint);
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Authorization": PEXELS_API_KEY,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      console.error("\u274C Pexels Videos API error:", response.status, response.statusText);
      return res.status(response.status).json({
        error: "Pexels API error",
        status: response.status
      });
    }
    const data = await response.json();
    console.log("\u2705 Pexels Videos: Found", data.videos?.length || 0, "videos");
    res.json(data);
  } catch (error) {
    console.error("\u274C Pexels videos proxy error:", error);
    res.status(500).json({
      error: "Failed to fetch videos from Pexels",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
router.get("/giphy/search", async (req, res) => {
  const { query, limit = "20" } = req.query;
  try {
    let endpoint;
    if (query && String(query).trim() !== "") {
      endpoint = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(String(query))}&limit=${limit}&rating=g`;
    } else {
      endpoint = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&rating=g`;
    }
    console.log("\u{1F3AD} Giphy Proxy:", endpoint.replace(GIPHY_API_KEY, "***"));
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      console.error("\u274C Giphy API error:", response.status, response.statusText);
      return res.status(response.status).json({
        error: "Giphy API error",
        status: response.status
      });
    }
    const data = await response.json();
    console.log("\u2705 Giphy: Found", data.data?.length || 0, "GIFs");
    res.json(data);
  } catch (error) {
    console.error("\u274C Giphy proxy error:", error);
    res.status(500).json({
      error: "Failed to fetch from Giphy",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
router.get("/freesound/search", async (req, res) => {
  const { query = "ambient", page_size = "20" } = req.query;
  try {
    const endpoint = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(String(query))}&fields=id,name,duration,previews,username,tags&page_size=${page_size}&token=${FREESOUND_API_KEY}`;
    console.log("\u{1F3B5} Freesound Proxy:", endpoint.replace(FREESOUND_API_KEY, "***"));
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      console.error("\u274C Freesound API error:", response.status, response.statusText);
      return res.status(response.status).json({
        error: "Freesound API error",
        status: response.status
      });
    }
    const data = await response.json();
    console.log("\u2705 Freesound: Found", data.results?.length || 0, "sounds");
    res.json(data);
  } catch (error) {
    console.error("\u274C Freesound proxy error:", error);
    res.status(500).json({
      error: "Failed to fetch from Freesound",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
router.get("/freesound/sfx", async (req, res) => {
  const { query = "sound effect", page_size = "20" } = req.query;
  try {
    const endpoint = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(String(query))}&fields=id,name,duration,previews,username,tags&page_size=${page_size}&token=${FREESOUND_API_KEY}`;
    console.log("\u{1F50A} Freesound SFX Proxy:", endpoint.replace(FREESOUND_API_KEY, "***"));
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      console.error("\u274C Freesound SFX API error:", response.status, response.statusText);
      return res.status(response.status).json({
        error: "Freesound API error",
        status: response.status
      });
    }
    const data = await response.json();
    console.log("\u2705 Freesound SFX: Found", data.results?.length || 0, "sounds");
    res.json(data);
  } catch (error) {
    console.error("\u274C Freesound SFX proxy error:", error);
    res.status(500).json({
      error: "Failed to fetch SFX from Freesound",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
var proxy_default = router;

// routes/apis/gemini.ts
import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// models/gemini_schemas.ts
import { SchemaType } from "@google/generative-ai";
var QuoteDataPropsSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      text: { type: SchemaType.STRING },
      author: { type: SchemaType.STRING }
    },
    required: ["text", "author"]
  }
};
var TextTypingTemplatePhraseSchema = {
  type: SchemaType.ARRAY,
  items: { type: SchemaType.STRING }
};
var TextTypingTemplateSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      lines: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING }
      },
      category: { type: SchemaType.STRING },
      mood: { type: SchemaType.STRING }
    },
    required: ["lines", "category", "mood"]
  }
};
var BarGraphDataSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      data: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING },
            value: { type: SchemaType.NUMBER }
          },
          required: ["name", "value"]
        }
      },
      title: { type: SchemaType.STRING },
      subtitle: { type: SchemaType.STRING }
    },
    required: ["data", "title", "subtitle"]
  }
};
var CurveLineTrendSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING },
      subtitle: { type: SchemaType.STRING },
      data: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            label: { type: SchemaType.NUMBER },
            value: { type: SchemaType.NUMBER }
          },
          required: ["label", "value"]
        }
      },
      dataType: { type: SchemaType.STRING }
    },
    required: ["title", "subtitle", "data", "dataType"]
  }
};
var FactCardsTemplateDatasetSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      intro: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          subtitle: { type: SchemaType.STRING }
        },
        required: ["title", "subtitle"]
      },
      outro: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          subtitle: { type: SchemaType.STRING }
        },
        required: ["title", "subtitle"]
      },
      facts: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING },
            description: { type: SchemaType.STRING }
          },
          required: ["title", "description"]
        }
      }
    },
    required: ["intro", "outro", "facts"]
  }
};
var KpiFlipCardsDatasetSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      cardBorderColor: { type: SchemaType.STRING },
      valueFontSize: { type: SchemaType.NUMBER },
      cardLabelFontSize: { type: SchemaType.NUMBER },
      cardLabelColor: { type: SchemaType.STRING },
      cardColorBack: { type: SchemaType.STRING },
      cardColorFront: { type: SchemaType.STRING },
      title: { type: SchemaType.STRING },
      subtitle: { type: SchemaType.STRING },
      cardsData: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            front: {
              type: SchemaType.OBJECT,
              properties: {
                label: { type: SchemaType.STRING },
                value: { type: SchemaType.STRING },
                color: { type: SchemaType.STRING }
              },
              required: ["label", "value", "color"]
            },
            back: {
              type: SchemaType.OBJECT,
              properties: {
                label: { type: SchemaType.STRING },
                value: { type: SchemaType.STRING },
                color: { type: SchemaType.STRING }
              },
              required: ["label", "value", "color"]
            }
          },
          required: ["front", "back"]
        }
      }
    },
    required: ["title", "subtitle", "cardsData", "cardLabelColor", "cardLabelFontSize", "cardColorBack", "cardColorFront", "valueFontSize", "cardBorderColor"]
  }
};
var SingleOutputQuoteSpotlightSchema = {
  type: SchemaType.OBJECT,
  properties: {
    quote: { type: SchemaType.STRING },
    author: { type: SchemaType.STRING },
    backgroundImage: { type: SchemaType.STRING },
    fontFamily: { type: SchemaType.STRING },
    fontColor: { type: SchemaType.STRING }
  },
  required: ["quote", "author", "backgroundImage", "fontFamily", "fontColor"]
};

// data/localimages.ts
var serverImages = [
  "/bgimages/philosophy/bg1.jpg",
  "/bgimages/philosophy/bg2.jpg",
  "/bgimages/philosophy/bg3.jpg",
  "/bgimages/philosophy/bg4.jpg",
  "/bgimages/philosophy/bg5.jpg",
  "/bgimages/philosophy/bg6.jpg",
  "/bgimages/philosophy/bg7.jpg",
  "/bgimages/philosophy/bg8.jpg",
  "/bgimages/philosophy/bg9.jpg",
  "/bgimages/philosophy/bg10.jpg",
  "/bgimages/philosophy/bg11.jpg",
  "/bgimages/philosophy/bg12.jpg",
  "/bgimages/philosophy/bg13.jpg",
  "/bgimages/philosophy/bg14.jpg",
  "/bgimages/philosophy/bg15.jpg",
  "/bgimages/philosophy/bg16.jpg",
  "/bgimages/philosophy/bg17.jpg",
  "/bgimages/philosophy/bg18.jpg",
  "/bgimages/philosophy/bg19.jpg",
  "/bgimages/philosophy/bg20.jpg",
  "/bgimages/philosophy/bg21.jpg",
  "/bgimages/colors/bg1.jpg",
  "/bgimages/colors/bg2.jpg",
  "/bgimages/colors/bg3.jpg",
  "/bgimages/colors/bg4.jpg",
  "/bgimages/colors/bg5.jpg",
  "/bgimages/colors/bg6.jpg",
  "/bgimages/colors/bg7.jpg",
  "/bgimages/colors/bg8.jpg",
  "/bgimages/colors/bg9.jpg",
  "/bgimages/colors/bg10.jpg",
  "/bgimages/colors/bg11.jpg",
  "/bgimages/colors/bg12.jpg",
  "/bgimages/colors/bg13.jpg",
  "/bgimages/colors/bg14.jpg",
  "/bgimages/colors/bg15.jpg",
  "/bgimages/colors/bg16.jpg",
  "/bgimages/colors/bg17.jpg",
  "/bgimages/colors/bg18.jpg",
  "/bgimages/colors/bg19.jpg",
  "/bgimages/colors/bg20.jpg",
  "/bgimages/colors/bg21.jpg",
  "/bgimages/sceneries/bg1.jpg",
  "/bgimages/sceneries/bg2.jpg",
  "/bgimages/sceneries/bg3.jpg",
  "/bgimages/sceneries/bg4.jpg",
  "/bgimages/sceneries/bg5.jpg",
  "/bgimages/sceneries/bg6.jpg",
  "/bgimages/sceneries/bg7.jpg",
  "/bgimages/sceneries/bg8.jpg",
  "/bgimages/sceneries/bg9.jpg",
  "/bgimages/sceneries/bg10.jpg",
  "/bgimages/sceneries/bg11.jpg",
  "/bgimages/sceneries/bg12.jpg",
  "/bgimages/sceneries/bg13.jpg",
  "/bgimages/sceneries/bg14.jpg",
  "/bgimages/sceneries/bg15.jpg",
  "/bgimages/sceneries/bg16.jpg",
  "/bgimages/sceneries/bg17.jpg",
  "/bgimages/sceneries/bg18.jpg",
  "/bgimages/sceneries/bg19.jpg",
  "/bgimages/sceneries/bg20.jpg",
  "/bgimages/sceneries/bg21.jpg"
];

// data/texttyping_moods_categories.ts
var CategoryOptions = [
  "motivation",
  "business",
  "dreams",
  "tech",
  "design",
  "mindfulness",
  "creativity",
  "growth",
  "wisdom",
  "innovation",
  "passion",
  "change",
  "action",
  "authenticity",
  "simplicity",
  "journey",
  "resilience",
  "possibility"
];
var MoodOptions = [
  "professional",
  "hopeful",
  "artistic",
  "thoughtful",
  "peaceful",
  "empowering",
  "challenging",
  "iconic",
  "bold",
  "playful",
  "authentic",
  "direct",
  "urgent",
  "wise",
  "minimalist",
  "encouraging",
  "balanced",
  "practical",
  "motivating"
];

// data/curvelinetrendsymbols.ts
var curveLineDataTypes = ["$", "%", "#", "number"];

// data/fonst.ts
var fontValues = [
  "'Arial', sans-serif",
  "'Playfair Display', serif",
  "'Kode Mono', monospace",
  "'Asimovian', sans-serif",
  "'Roboto', sans-serif",
  "'Bebas Neue', sans-serif",
  "'Russo One', sans-serif",
  "'Lilita One', sans-serif",
  "'Changa One', sans-serif",
  "'Archivo Black', sans-serif",
  "'Gravitas One', serif",
  "'Bungee', sans-serif",
  "'Luckiest Guy', sans-serif",
  "'Amatic SC', cursive",
  "'Tagesschrift', system-ui",
  "'Satisfy', cursive",
  "'Pacifico', cursive",
  "'Dancing Script', cursive",
  "'Story Script', sans-serif",
  "'Oleo Script', system-ui",
  "'Bitcount Grid Double', system-ui",
  "'Silkscreen', sans-serif"
];

// utils/schemaidentifier.ts
function schemaIdentifier(template) {
  console.log("Identifying schema for: ", template);
  switch (template) {
    case "bargraph":
      return BarGraphDataSchema;
    case "texttyping":
      return TextTypingTemplateSchema;
    case "kpiflipcards":
      return KpiFlipCardsDatasetSchema;
    case "curvelinetrend":
      return CurveLineTrendSchema;
    case "quote":
      return QuoteDataPropsSchema;
    case "factcards":
      return FactCardsTemplateDatasetSchema;
    default:
      console.log("unknown template cannot find schema");
      break;
  }
}

// routes/apis/gemini.ts
dotenv.config();
var router2 = Router();
var genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_2);
var model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
router2.get("/reddit", async (req, res) => {
  const prompt = `Can you fetch a random reddit post? And respond only with the url`;
  try {
    const result = await model.generateContent(prompt);
    console.log(result.response.text());
    res.send({ message: result.response.text() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating content. Please try again." });
  }
});
router2.post("/generate-textcontent", async (req, res) => {
  const { prompt } = req.body;
  var newprompt = prompt;
  if (!prompt || prompt === "") {
    newprompt = "Create a simple poem";
  }
  try {
    const result = await model.generateContent(newprompt);
    console.log(result.response.text());
    res.json({ textcontent: result.response.text() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ textcontent: "Error creating content. Please try again." });
  }
});
router2.post("/generate-quote", async (req, res) => {
  const prompt = `Suggest a quote by an author. Respond only with the quote and the author nothing else. They should be separated by a dash. Example: Some Quote - Author. Exactly like that nothing else more, don't put the quote in quotation marks, dont add a line before the name of the author, just the quote and author separated by a dash.`;
  try {
    const result = await model.generateContent(prompt);
    console.log(result.response.text());
    const data = result.response.text().split(" - ");
    const quote = data[0];
    const author = data[1].replaceAll("\n", "");
    res.json({ quote, author });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating content. Please try again." });
  }
});
router2.post("/generate-story", async (req, res) => {
  const { prompt, genres } = req.body;
  let newprompt = "";
  if (prompt && genres) {
    newprompt = `${prompt}. Genres: ${genres}`;
  } else if (prompt && !genres) {
    newprompt = prompt;
  } else if (!prompt && genres) {
    newprompt = `Create a story using the following genres: ${genres}`;
  }
  try {
    const result = await model.generateContent(newprompt);
    const text2 = result.response.text();
    console.log(text2);
    res.json({ story: text2 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ textcontent: "Error creating story. Please try again." });
  }
});
router2.post("/generate-phrase", async (req, res) => {
  const { category, mood } = req.body;
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate a phrase using the category ${category} and mood ${mood}.Break the lines of the phrases where you want to to make the array of lines. Try not to make each line too long,just make it sufficient and proper like this "Dream big, start small".`
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: TextTypingTemplatePhraseSchema
      }
    });
    const text2 = result.response.text();
    const data = JSON.parse(text2);
    console.log(text2);
    res.json({ phrase: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ textcontent: "Error creating story. Please try again." });
  }
});
router2.post("/batch-quotejson-trial", async (req, res) => {
  const { quantity } = req.body;
  console.log("Generating datasets");
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate ${quantity} random quotes from philosophers, actors, teachers, from anyone, with author.`
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: QuoteDataPropsSchema
      }
    });
    const text2 = result.response.text();
    const data = JSON.parse(text2);
    console.log(data);
    res.json({ phrase: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ textcontent: "Error creating story. Please try again." });
  }
});
router2.post("/generate/texttypingdataset", async (req, res) => {
  const { quantity } = req.body;
  console.log("Generating datasets for texttyping template");
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate ${quantity} random short phrases, with mood and category. Break the lines of the phrases where you want to to make the array of lines. Try not to make each line too long,just make it sufficient and proper like this "Dream big, start small". 
              Choose only from this moods ${MoodOptions} and categories ${CategoryOptions}. Use this as your basis for the line breaks in the lines array "lines": [
      "Dream big, start small",
      "but start today"
    ]`
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: TextTypingTemplateSchema
      }
    });
    const text2 = result.response.text();
    const data = JSON.parse(text2);
    console.log(data);
    res.json({ phrase: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ textcontent: "Error creating story. Please try again." });
  }
});
router2.post("/generate/bargraphdataset", async (req, res) => {
  const { quantity } = req.body;
  const sampledata = {
    name: "Milkshake",
    value: 10002
  };
  console.log("Generating datasets for bargraph template");
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate ${quantity} datasets that has a title, subtitle and the data. The title should be an analytics title, and the subtitle will support the title as if completing the whole header like, title: "Top Selling Items for Mcdo", subtitle: "For the month of March 2025" but don't use this as the first one okay? This is just an example. For the data, is it an array of ${sampledata}. The name should be acquinted with the title and so as the value. The maximum number of items in the data array is 8 and a minimum of 6.The difference between the values should not be wide, meaning if one value is 1092, the other ones should be 2001, 3100,1892 something like this, because if the gap is so wide the value will not be visible in the bargraph okay? Those values are just examples don't make them the basis of min and max values. You can create your own just don't make the gap between the values too wide.`
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: BarGraphDataSchema
      }
    });
    const text2 = result.response.text();
    const data = JSON.parse(text2);
    console.log(data);
    res.json({ data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ textcontent: "Error creating story. Please try again." });
  }
});
router2.post("/generate/curvelinedataset", async (req, res) => {
  const { quantity } = req.body;
  const sampledata = {
    label: 2025,
    value: 10002
  };
  console.log("Generating datasets for curveline template");
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate ${quantity} datasets that has a title, subtitle, dataType and the data. The title should be an analytics title, and the subtitle will support the title as if completing the whole header like, title: "Revenue Growth", subtitle: "2015\u20132024 \u2022 Journey" but don't use this as the first one okay? This is just an example. For the dataType, choose from this ${curveLineDataTypes}. For the data, is it an array of ${sampledata}. The label should be a year (it is not limited to the 20th century, it can be from the 90s or lower) that keeps progressing and the value is up to you, you just have to show the value over the progressing years supporting the analytics. The maximum number of items in the data array is 20 and a minimum of 10.`
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: CurveLineTrendSchema
      }
    });
    const text2 = result.response.text();
    const data = JSON.parse(text2);
    console.log(data);
    res.json({ data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ textcontent: "Error creating story. Please try again." });
  }
});
router2.post("/generate/factcardsdataset", async (req, res) => {
  const { quantity, niches } = req.body;
  console.log("Generating datasets for fact cards template", quantity);
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate ${quantity} datasets for the niches selected ${niches}. 
              The dataset shall include a introductory title with a subtitle to follow up the title. And an outro title and subtitle that you will find most fitting, 
              it could be a learn more type outro or a description type, it is up to you but keep it minimal. For the array of facts, it should be according to the niches, 
              the title for the facts should be more or less miminal it should hook the viewers attention to it and the description should be truthful and short. `
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: FactCardsTemplateDatasetSchema
      }
    });
    const text2 = result.response.text();
    const data = JSON.parse(text2);
    console.log(data);
    res.json({ data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ textcontent: "Error creating story. Please try again." });
  }
});
router2.post("/generate/kpiflipcardsdataset", async (req, res) => {
  const { quantity } = req.body;
  console.log("Generating datasets for kpiflip cards template");
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate ${quantity} of datasets for a kpiflip cad remotion template. It should have a title (short but complete in thought), a subtitle to support the title. 
              This template is an metric/measurement based template to it the title and subtitle should be based on that too. The cardsData length should be maximum of 8 and minimum of 4. 
              The value of the cards data are different metrics, no repetitions and the color should not be light. 
              As for the vaueFontSize it should depend on the value size if the value.length is longer than 7 make the valuefontsize between 40-45,but if not make it 46-48, cardlabelfontsize should be between 28 and 32. 
              For the cardcolors both back and front, it should highlight the value 
              and label meaning the colors of the card should not be contradicting wth the colors of the value and the label. 
              The cardBorder color should not be the same with the cardColorFront and back because it will not be seen.`
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: KpiFlipCardsDatasetSchema
      }
    });
    const text2 = result.response.text();
    const data = JSON.parse(text2);
    console.log(data);
    res.json({ data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ textcontent: "Error creating story. Please try again." });
  }
});
router2.post("/setup/quotetemplate", async (req, res) => {
  const { preferences } = req.body;
  console.log("Generating ai setup data for quote template");
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate a dataset that has a quote, author, backgroundImage url, fontColor and fontfamily using this ${preferences} preferences from the user. The quotes and authors must depend on the chosen preferences, there shall be no repeated quotes. Choose from this images for the backgroundImage ${serverImages}(choose randomly) and the fontFamily will be from this array of fonts ${fontValues}(it will be depending on the preferences also) but choose the whole string value not just the fontfamily from the string okay?In the fontfamily don'tbe fixated on Arial and playfair display there are many fonts available. You can decide the fontcolor depending on the user preferences, but it must be light colors, like white, yellow, yellowgreen, pink, skyblue, and more, not dark colors.`
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: SingleOutputQuoteSpotlightSchema
      }
    });
    const text2 = result.response.text();
    const data = JSON.parse(text2);
    console.log(data);
    res.json({ data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ textcontent: "Error creating story. Please try again." });
  }
});
async function datasetFormatterUsingAi(template, type, extracteddata) {
  console.log(
    "formatting given data for file type: ",
    type,
    "template: ",
    template
  );
  const formattedInput = JSON.stringify(extracteddata, null, 2);
  const formattedSchema = JSON.stringify(schemaIdentifier(template), null, 2);
  let extraRule = "";
  if (template === "texttyping") {
    extraRule = `11. For texttyping templates, choose only from these moods: ${MoodOptions} and categories: ${CategoryOptions}.
`;
  } else if (template === "curvelinetrend") {
    extraRule = `11. For curvelinetrend template, for the dataType, choose from this ${curveLineDataTypes}`;
  }
  let prompt = "You are a strict data formatter. You must strictly follow the provided JSON schema structure and types. Do not deviate from the schema in any way. Before responding, carefully and thoroughly read and analyze BOTH the input data and the schema provided below. Your job is to convert the following dataset to match the schema, using ONLY the values from the input data. Do not invent, change, or ignore any values. If you cannot use the input data as-is, return an error message instead of generating new data.\n\nRules:\n1. Carefully read and understand both the input data and the schema before making any changes or responding.\n2. STRICTLY follow the schema structure and types. Do not add, remove, or reorder properties or array items except as required to match the schema.\n3. For each row/object in the input, preserve all values exactly. Only rename keys or add missing properties with default values. Do not reorder, remove, or add rows/objects.\n4. If the input data already matches the schema, return it exactly as-is, with no changes, no reordering, and no removals.\n5. Do not change, remove, or invent any values. Only rename keys or restructure as needed to match the schema.\n6. For XLSX/tabular data: If the data is an array of objects with column names, use those column names as the 'label', 'name', or similar property in the schema. Do not change the values.\n7. If a property is missing, add it with a default value (empty string for strings, 0 for numbers, 'white' for colors, etc.), but do not remove any existing properties or array items.\n8. If the schema contains a 'title', 'subtitle', 'intro', or 'outro' property, generate a meaningful placeholder for it that accurately reflects the data contents (e.g., summarize, describe, or label the dataset), and do not leave it blank or generic.\n9. Do not introduce null values. Use default values as above.\n10. If you must rename a property to match the schema, do so, but keep the value unchanged.\n11. Never remove or filter out any data from the input, even if it is not required by the schema.\n" + (extraRule ? extraRule : "") + "\nExamples:\n- If the input is already valid, return it as-is.\n- If the input has extra properties, keep them.\n- If the input is missing properties, add them with default values.\n- For tabular data, only rename keys, never change values. For example:\n  Input: [ { year: 2020, revenue: 15000 }, { year: 2021, revenue: 18000 } ]\n  Schema: [ { label: string, value: number } ]\n  Output: [ { label: 2020, value: 15000 }, { label: 2021, value: 18000 } ]\n\nInput data (as JSON code block):\n```\n" + formattedInput + "\n```\n\nSchema (as JSON code block):\n```\n" + formattedSchema + "\n```\n";
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      // No responseSchema, let the model output plain JSON
      generationConfig: {
        responseMimeType: "application/json"
      }
    });
    const text2 = result.response.text();
    let data;
    try {
      data = JSON.parse(text2);
    } catch (e) {
      throw new Error("AI did not return valid JSON: " + text2);
    }
    console.log("Ai Formattted data: ", data);
    return data;
  } catch (error) {
    console.error(error);
  }
}
var gemini_default = router2;

// routes/rendering.ts
import { Router as Router2 } from "express";

// controllers/rendering/RenderingCon.ts
import path3 from "path";
import os from "os";
import fs from "fs";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { bundle } from "@remotion/bundler";

// utils/cloudinaryClient.ts
import { v2 as cloudinary } from "cloudinary";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
var cloudinaryClient_default = cloudinary;

// utils/ffmpeg.ts
import { spawn } from "child_process";
import * as path from "path";
import ffmpegPath from "ffmpeg-static";
import { getVideoDurationInSeconds } from "get-video-duration";
async function convertVideo(input, format) {
  return new Promise((resolve, reject) => {
    const outputDir = path.dirname(input);
    const baseName = path.basename(input, path.extname(input));
    const outputFile = `${baseName}.${format}`;
    const outputPath = path.join(outputDir, outputFile);
    const args = format === "gif" ? [
      "-i",
      input,
      "-vf",
      "fps=10,scale=480:-1:flags=lanczos",
      "-loop",
      "0",
      outputPath
    ] : [
      "-i",
      input,
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      "1M",
      "-c:a",
      "libopus",
      outputPath
    ];
    const ffmpeg = spawn(String(ffmpegPath), args);
    ffmpeg.stderr.on("data", (data) => {
      console.log(`[ffmpeg]: ${data.toString()}`);
    });
    ffmpeg.on("close", (code) => {
      if (code === 0) resolve(outputPath);
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });
  });
}
var getVideoDuration = async (filePath) => {
  try {
    const duration = await getVideoDurationInSeconds(filePath);
    return Math.round(duration);
  } catch (err) {
    console.error("\u274C Failed to get video duration:", err);
    return 0;
  }
};

// controllers/entrypoint.ts
import path2 from "path";
var entry = path2.join(
  process.cwd(),
  "./server/remotion_templates/TemplateHolder/src/index.ts"
);
var entry2 = path2.join(
  process.cwd(),
  "remotion_templates/TemplateHolder/src/index.ts"
);
var distentry = path2.join(
  process.cwd(),
  "dist/remotion_templates/TemplateHolder/src/index.ts"
);

// controllers/rendering/RenderingCon.ts
var handleExport = async (req, res) => {
  const { inputProps, format, compositionId } = req.body;
  console.log("Receive Props: ", inputProps);
  try {
    if (!fs.existsSync(entry)) {
      return res.status(404).json({ error: "Remotion entry file not found" });
    }
    const bundleLocation = await bundle({
      entryPoint: path3.resolve(entry),
      webpackOverride: (config2) => config2
    });
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      onBrowserDownload: () => {
        console.log("A compatible browser is being downloaded...");
        return {
          onProgress: ({ percent }) => {
            console.log(`${Math.round(percent * 100)}% downloaded`);
          },
          version: "recommended"
        };
      },
      inputProps
    });
    const tmpBaseName = `${compositionId}-${Date.now()}`;
    const tmpDir = os.tmpdir();
    const mp4Path = path3.join(tmpDir, `${tmpBaseName}.mp4`);
    console.log("\u{1F3AC} Rendering video to:", mp4Path);
    await renderMedia({
      serveUrl: bundleLocation,
      composition,
      codec: "h264",
      outputLocation: mp4Path,
      inputProps,
      concurrency: 1
    });
    console.log("\u2705 Render complete.");
    let finalPath = mp4Path;
    let finalFormat = "mp4";
    if (format === "gif" || format === "webm") {
      console.log(`\u{1F39E} Converting to ${format}...`);
      finalPath = await convertVideo(mp4Path, format);
      finalFormat = format;
      console.log(`\u2705 Converted to ${format}:`, finalPath);
    }
    console.log("\u2601\uFE0F Uploading to Cloudinary...");
    const resourceType = finalFormat === "gif" ? "image" : "video";
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinaryClient_default.uploader.upload(
        finalPath,
        {
          resource_type: resourceType,
          folder: "remotion_renders",
          public_id: tmpBaseName,
          format: finalFormat
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });
    setTimeout(() => {
      [mp4Path, finalPath].forEach((file) => {
        fs.unlink(file, (err) => {
          if (err) console.warn("\u26A0\uFE0F Failed to delete temp file:", err);
        });
      });
    }, 3e3);
    console.log("\u2601\uFE0F Uploaded successfully:", uploadResult.secure_url);
    return res.json({
      url: uploadResult.secure_url,
      format: finalFormat
    });
  } catch (error) {
    res.status(404).json({ message: "Error rendering video" });
  }
};

// controllers/rendering/LambdaRenderingCon.ts
import {
  getRenderProgress,
  renderMediaOnLambda
} from "@remotion/lambda/client";
var handleLambdaRendering = async (req, res) => {
  const { inputProps, format, templateId } = req.body;
  console.log(inputProps);
  console.log(inputProps.config.layers);
  try {
    const { renderId, bucketName } = await renderMediaOnLambda({
      concurrency: 5,
      region: "us-east-1",
      functionName: "remotion-render-4-0-377-mem2048mb-disk2048mb-120sec",
      serveUrl: "https://remotionlambda-useast1-0l1u2rw3fu.s3.us-east-1.amazonaws.com/sites/viral-motion/index.html",
      composition: templateId === "7" ? "ExtendedDynamicComposition" : "DynamicVideo",
      codec: format === "mp4" ? "h264" : "h264",
      inputProps,
      privacy: "public"
    });
    let progress = await getRenderProgress({
      renderId,
      bucketName,
      functionName: "remotion-render-4-0-377-mem2048mb-disk2048mb-120sec",
      region: "us-east-1"
    });
    while (!progress.done) {
      await new Promise((resolve) => setTimeout(resolve, 1e4));
      progress = await getRenderProgress({
        renderId,
        bucketName,
        functionName: "remotion-render-4-0-377-mem2048mb-disk2048mb-120sec",
        region: "us-east-1"
      });
    }
    console.log("rendering finished!!\nUrl: ", progress.outputFile);
    res.json({ url: progress.outputFile });
  } catch (error) {
    console.error("Render error:", error);
    res.status(500).json({ error: error.message });
  }
};

// routes/rendering.ts
var router3 = Router2();
router3.post("/render-video", handleExport);
router3.post("/render-video/lambda", handleLambdaRendering);
router3.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});
var rendering_default = router3;

// routes/uploads.ts
import * as path5 from "path";
import { Router as Router3 } from "express";
import fs3 from "fs";
import { v4 as uuidv42 } from "uuid";

// utils/multer.ts
import multer from "multer";
import fs2 from "fs";
import { v4 as uuidv4 } from "uuid";
import * as path4 from "path";
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path4.join(process.cwd(), "./server/public/images");
    if (!fs2.existsSync(uploadPath)) {
      fs2.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path4.extname(file.originalname);
    cb(null, `${uniqueId}${extension}`);
  }
});
var datasetsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path4.join(process.cwd(), "./server/public/datasets");
    if (!fs2.existsSync(uploadPath)) {
      fs2.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uploadPath = path4.join(process.cwd(), "./server/public/datasets");
    let originalName = file.originalname;
    let filename = originalName;
    let filePath = path4.join(uploadPath, filename);
    let counter = 2;
    while (fs2.existsSync(filePath)) {
      const ext = path4.extname(originalName);
      const base = path4.basename(originalName, ext);
      filename = `${base}(${counter})${ext}`;
      filePath = path4.join(uploadPath, filename);
      counter++;
    }
    cb(null, filename);
  }
});
var upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});
var uploadDatasets = multer({
  storage: datasetsStorage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/json",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JSON or XLSX files are allowed"));
    }
  }
});
var videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path4.join(
      process.cwd(),
      "./server/public/videos/useruploads"
    );
    if (!fs2.existsSync(uploadPath)) {
      fs2.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path4.extname(file.originalname);
    cb(null, `${uniqueId}${extension}`);
  }
});
var uploadVideo = multer({
  storage: videoStorage,
  limits: {
    fileSize: 200 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"));
    }
  }
});
var kenBurnsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path4.join(
      process.cwd(),
      "server/public/kenburnsuploads"
    );
    if (!fs2.existsSync(uploadPath)) {
      fs2.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path4.extname(file.originalname);
    cb(null, `${uniqueId}${extension}`);
  }
});
var uploadKenBurns = multer({
  storage: kenBurnsStorage,
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});
var uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024
    // 200MB
  }
});

// utils/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
var supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
  // Use service role key on server
);
var SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "Remotion Web App file bucket";

// routes/uploads.ts
var router4 = Router3();
var uploadBufferToCloudinary = (buffer, opts) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinaryClient_default.uploader.upload_stream(
      {
        folder: opts.folder ?? "",
        resource_type: opts.resourceType ?? "auto",
        public_id: opts.public_id ?? void 0
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};
var uploadBufferToSupabase = async (bucket, destPath, buffer, mimetype) => {
  const { data, error } = await supabase.storage.from(bucket).upload(destPath, buffer, {
    contentType: mimetype,
    upsert: true
  });
  if (error) throw error;
  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(destPath);
  return publicUrlData.publicUrl;
};
router4.post(
  "/upload-video",
  uploadMemory.single("video"),
  async (req, res) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "No video uploaded" });
      }
      const publicId = `video_${uuidv42()}`;
      const result = await uploadBufferToCloudinary(req.file.buffer, {
        folder: "videos",
        resourceType: "video",
        public_id: publicId
      });
      const tmpFile = path5.join(process.cwd(), `tmp_${uuidv42()}.mp4`);
      fs3.writeFileSync(tmpFile, req.file.buffer);
      let durationSeconds = null;
      try {
        durationSeconds = await getVideoDuration(tmpFile);
      } catch (dErr) {
        console.warn("Could not get duration:", dErr);
      } finally {
        fs3.unlinkSync(tmpFile);
      }
      console.log("\u2705 Video uploaded to Cloudinary:", result.secure_url);
      return res.json({
        url: result.secure_url,
        public_id: result.public_id,
        durationSeconds,
        size: req.file.size
      });
    } catch (error) {
      console.error("\u274C Video upload failed:", error);
      return res.status(500).json({ error: "Upload failed", details: String(error) });
    }
  }
);
router4.post(
  "/upload-image",
  uploadMemory.single("image"),
  async (req, res) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "No image uploaded" });
      }
      const publicId = `image_${uuidv42()}`;
      const result = await uploadBufferToCloudinary(req.file.buffer, {
        folder: "images",
        resourceType: "image",
        public_id: publicId
      });
      console.log("\u2705 Image uploaded to Cloudinary:", result.secure_url);
      return res.json({
        url: result.secure_url,
        public_id: result.public_id,
        size: req.file.size
      });
    } catch (error) {
      console.error("\u274C Image upload failed:", error);
      return res.status(500).json({ error: "Upload failed", details: String(error) });
    }
  }
);
router4.post(
  "/upload-kenburns-image",
  uploadMemory.single("image"),
  async (req, res) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "No image uploaded" });
      }
      const publicId = `kenburns_${uuidv42()}`;
      const result = await uploadBufferToCloudinary(req.file.buffer, {
        folder: "kenburns",
        resourceType: "image",
        public_id: publicId
      });
      console.log("\u2705 KenBurns image uploaded:", result.secure_url);
      return res.json({
        url: result.secure_url,
        public_id: result.public_id,
        size: req.file.size
      });
    } catch (error) {
      console.error("\u274C KenBurns upload failed:", error);
      return res.status(500).json({ error: "Upload failed", details: String(error) });
    }
  }
);
router4.post(
  "/upload-kenburns-folder",
  uploadMemory.array("images", 20),
  // max limit optional
  async (req, res) => {
    try {
      const files = req.files || [];
      if (files.length === 0)
        return res.status(400).json({ error: "No files uploaded" });
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const publicId = `kenburns_${uuidv42()}`;
          const result = await uploadBufferToCloudinary(file.buffer, {
            folder: "kenburns",
            resourceType: "image",
            public_id: publicId
          });
          return {
            url: result.secure_url,
            public_id: result.public_id,
            size: file.size
          };
        })
      );
      console.log("\u2705 KenBurns folder uploaded:", uploaded);
      return res.json({ images: uploaded });
    } catch (error) {
      console.error("\u274C KenBurns folder upload failed:", error);
      return res.status(500).json({ error: "Upload failed", details: String(error) });
    }
  }
);
router4.post(
  "/upload-multiple-kenburns-images",
  uploadMemory.array("images"),
  async (req, res) => {
    try {
      const files = req.files || [];
      if (files.length === 0)
        return res.status(400).json({ error: "No files uploaded" });
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const publicId = `kenburns_${uuidv42()}`;
          const result = await uploadBufferToCloudinary(file.buffer, {
            folder: "kenburns",
            resourceType: "image",
            public_id: publicId
          });
          return {
            url: result.secure_url,
            public_id: result.public_id,
            size: file.size
          };
        })
      );
      console.log("\u2705 Multiple KenBurns images uploaded:", uploaded);
      return res.json({ images: uploaded });
    } catch (error) {
      console.error("\u274C Multiple KenBurns upload failed:", error);
      return res.status(500).json({ error: "Upload failed", details: String(error) });
    }
  }
);
router4.post(
  "/upload-multiple-images",
  uploadMemory.array("images"),
  async (req, res) => {
    try {
      const files = req.files || [];
      if (files.length === 0)
        return res.status(400).json({ error: "No files uploaded" });
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const publicId = `image_${uuidv42()}`;
          const result = await uploadBufferToCloudinary(file.buffer, {
            folder: "images",
            resourceType: "image",
            public_id: publicId
          });
          return {
            url: result.secure_url,
            public_id: result.public_id,
            size: file.size
          };
        })
      );
      console.log("\u2705 Multiple images uploaded:", uploaded);
      return res.json({ images: uploaded });
    } catch (error) {
      console.error("\u274C Multiple images upload failed:", error);
      return res.status(500).json({ error: "Upload failed", details: String(error) });
    }
  }
);
router4.post(
  "/upload-datasets",
  uploadMemory.single("file"),
  async (req, res) => {
    try {
      if (!req.file || !req.file.buffer)
        return res.status(400).json({ error: "No file uploaded" });
      const name = path5.parse(req.file.originalname).name;
      const ext = path5.extname(req.file.originalname);
      const filename = `${name}-${uuidv42()}${ext}`;
      const destPath = `datasets/${filename}`;
      const bucket = process.env.SUPABASE_BUCKET || "uploads";
      const publicUrl = await uploadBufferToSupabase(
        bucket,
        destPath,
        req.file.buffer,
        req.file.mimetype
      );
      console.log("\u2705 Dataset uploaded to Supabase:", publicUrl);
      return res.json({ url: publicUrl, filename, size: req.file.size });
    } catch (error) {
      console.error("\u274C Dataset upload failed:", error);
      return res.status(500).json({ error: "Upload failed", details: String(error) });
    }
  }
);
router4.post(
  "/upload-audio",
  uploadMemory.single("audio"),
  async (req, res) => {
    try {
      if (!req.file || !req.file.buffer)
        return res.status(400).json({ error: "No audio uploaded" });
      const ext = path5.extname(req.file.originalname) || "";
      const filename = `${uuidv42()}${ext}`;
      const destPath = `audios/${filename}`;
      const bucket = process.env.SUPABASE_BUCKET || "uploads";
      const publicUrl = await uploadBufferToSupabase(
        bucket,
        destPath,
        req.file.buffer,
        req.file.mimetype
      );
      console.log("\u2705 Audio uploaded to Supabase:", publicUrl);
      return res.json({ url: publicUrl, filename, size: req.file.size });
    } catch (error) {
      console.error("\u274C Audio upload failed:", error);
      return res.status(500).json({ error: "Upload failed", details: String(error) });
    }
  }
);
var uploads_default = router4;

// routes/apis/elevenlabs.ts
import { Router as Router4 } from "express";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import * as dotenv2 from "dotenv";
import fs5 from "fs";
import path7 from "path";
import os2 from "os";

// controllers/functions/jsonupdater.ts
import fs4 from "fs";
import path6 from "path";
function updatechatsJsonfile(data) {
  const remotionRoot = path6.join(
    process.cwd(),
    "./server/remotion_templates/TemplateHolder"
  );
  console.log(data);
  const dataDir = path6.join(remotionRoot, "public");
  if (!fs4.existsSync(dataDir)) fs4.mkdirSync(dataDir, { recursive: true });
  fs4.writeFileSync(
    path6.join(dataDir, "chats.json"),
    JSON.stringify(data, null, 2)
  );
  console.log("\u2705 chats.json file updated with duration & word timestamps");
}
function updateRedditScriptJson(script) {
  const remotionRoot = path6.join(
    process.cwd(),
    "./server/remotion_templates/TemplateHolder"
  );
  const dataDir = path6.join(remotionRoot, "data/others");
  if (!fs4.existsSync(dataDir)) fs4.mkdirSync(dataDir, { recursive: true });
  fs4.writeFileSync(
    path6.join(dataDir, "redditstoryscript.json"),
    JSON.stringify(script, null, 2)
  );
  console.log(
    "\u2705 redditstoryscript.json file updated with duration & word timestamps"
  );
}
function updateStoryTellingScriptJson(script) {
  const remotionRoot = path6.join(
    process.cwd(),
    "./server/remotion_templates/TemplateHolder"
  );
  const dataDir = path6.join(remotionRoot, "data/others");
  if (!fs4.existsSync(dataDir)) fs4.mkdirSync(dataDir, { recursive: true });
  fs4.writeFileSync(
    path6.join(dataDir, "storytellingscript.json"),
    JSON.stringify(script, null, 2)
  );
  console.log(
    "\u2705 storytellingscript.json file updated with duration & word timestamps"
  );
}

// routes/apis/elevenlabs.ts
import { getAudioDurationInSeconds } from "get-audio-duration";
dotenv2.config();
var router5 = Router4();
var elevenLabs = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_LABS_API_KEY
});
async function webStreamToBuffer(webStream) {
  const reader = webStream.getReader();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c)));
}
router5.post("/test-generate", async (req, res) => {
  console.log(req.body.chats);
  try {
    let getVoiceForSpeaker = function(speaker) {
      if (!speakerToVoice[speaker]) {
        speakerToVoice[speaker] = voices[nextVoiceIndex % voices.length];
        nextVoiceIndex++;
      }
      return speakerToVoice[speaker];
    };
    const voices = req.body.voices || [
      "EXAVITQu4vr4xnSDxMaL",
      "XrExE9yKIg1WjnnlVkGX"
    ];
    const chats = req.body.chats || [
      { speaker: "person_1", text: "Hey, have you tried The Green Fork yet?" },
      { speaker: "person_2", text: "Not yet. Is it any good?" }
    ];
    if (!Array.isArray(chats) || chats.length === 0) {
      return res.status(400).json({ error: "No chats provided" });
    }
    const speakerToVoice = {};
    let nextVoiceIndex = 0;
    const audioBuffers = [];
    const segments = [];
    let currentTime = 0;
    for (let i = 0; i < chats.length; i++) {
      const { text: text2, speaker } = chats[i];
      const voiceId = getVoiceForSpeaker(speaker);
      console.log("\u{1F3A4} Generating voiceover...", {
        voiceId,
        speaker,
        preview: text2.slice(0, 80)
      });
      const audioStream = await elevenLabs.textToSpeech.convert(
        voiceId,
        {
          modelId: "eleven_multilingual_v2",
          text: text2
        }
      );
      const buffer = await webStreamToBuffer(audioStream);
      audioBuffers.push(buffer);
      const tmpFile = path7.join(
        os2.tmpdir(),
        `utterance-${i}-${Date.now()}.mp3`
      );
      fs5.writeFileSync(tmpFile, buffer);
      const dur = await getAudioDurationInSeconds(tmpFile);
      fs5.unlinkSync(tmpFile);
      segments.push({
        text: text2,
        start_time: currentTime,
        end_time: currentTime + dur,
        speaker: {
          id: speaker,
          name: speaker.replace("_", " ")
        }
      });
      currentTime += dur;
    }
    const finalAudio = Buffer.concat(audioBuffers);
    const fileName = `fakeconvo-${Date.now()}.mp3`;
    const remotePath = `audios/fakeconvo/${fileName}`;
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).upload(remotePath, finalAudio, {
      contentType: "audio/mpeg",
      upsert: true
    });
    if (error) {
      console.error("\u274C Supabase upload failed:", error.message);
      return res.status(500).json({ error: "Supabase upload failed" });
    }
    const { data: publicUrlData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(remotePath);
    const publicUrl = publicUrlData.publicUrl;
    console.log("\u2705 Uploaded to Supabase:", publicUrl);
    const tmpFinal = path7.join(os2.tmpdir(), `final-${Date.now()}.mp3`);
    fs5.writeFileSync(tmpFinal, finalAudio);
    const duration = await getAudioDurationInSeconds(tmpFinal);
    fs5.unlinkSync(tmpFinal);
    const chatsjson = {
      language_code: "eng",
      segments
    };
    updatechatsJsonfile(chatsjson);
    res.json({
      language_code: "eng",
      audioUrl: publicUrl,
      segments,
      duration: duration + 1
    });
  } catch (err) {
    console.error("Generation error:", err);
    res.status(500).json({
      error: "Failed to generate conversation",
      details: String(err)
    });
  }
});
router5.post("/reddit", async (req, res) => {
  console.log("template updating");
  try {
    const { title, textcontent, voiceid } = req.body;
    if (!title || !textcontent || !voiceid) {
      return res.status(400).json({
        error: "Missing required fields: title, textcontent, voiceid"
      });
    }
    const endsWithPunct = /[.!?]$/.test(title.trim());
    const story = endsWithPunct ? `${title.trim()} ${textcontent.trim()}` : `${title.trim()}. ${textcontent.trim()}`;
    console.log("\u{1F3A4} Generating single TTS...", {
      title,
      voiceid,
      preview: story.slice(0, 80)
    });
    const audioStream = await elevenLabs.textToSpeech.convert(
      voiceid,
      {
        modelId: "eleven_multilingual_v2",
        text: story
      }
    );
    const buffer = await webStreamToBuffer(audioStream);
    const fileName = `reddit-${Date.now()}.mp3`;
    const remotePath = `audios/reddit/${fileName}`;
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).upload(remotePath, buffer, {
      contentType: "audio/mpeg",
      upsert: true
    });
    if (error) {
      console.error("\u274C Supabase upload failed:", error.message);
      return res.status(500).json({ error: "Supabase upload failed" });
    }
    const { data: publicData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(remotePath);
    const publicUrl = publicData.publicUrl;
    console.log("\u2705 Uploaded to Supabase:", publicUrl);
    const tempPath = path7.join(os2.tmpdir(), fileName);
    fs5.writeFileSync(tempPath, buffer);
    const duration = await getAudioDurationInSeconds(tempPath);
    const alignment = await elevenLabs.forcedAlignment.create({
      file: fs5.createReadStream(tempPath),
      text: story
    });
    const words = alignment.words.map((w) => ({
      word: w.text,
      start: w.start,
      end: w.end
    }));
    const script = {
      story,
      duration,
      words,
      title,
      text: textcontent
    };
    updateRedditScriptJson(script);
    res.json({
      script,
      duration,
      audioUrl: publicUrl
      // ✅ URL from Supabase
    });
  } catch (err) {
    console.error("Single TTS + alignment error:", err);
    res.status(500).json({
      error: "Failed to generate single TTS with alignment",
      details: String(err)
    });
  }
});
router5.post("/story", async (req, res) => {
  console.log("template updating");
  try {
    const { content, voiceid } = req.body;
    if (!content || !voiceid) {
      return res.status(400).json({
        error: "Missing required fields: content or voiceid"
      });
    }
    console.log("\u{1F3A4} Generating single TTS...", {
      voiceid,
      preview: content.slice(0, 80)
    });
    const audioStream = await elevenLabs.textToSpeech.convert(
      voiceid,
      {
        modelId: "eleven_multilingual_v2",
        text: content
      }
    );
    const buffer = await webStreamToBuffer(audioStream);
    const fileName = `story-${Date.now()}.mp3`;
    const remotePath = `audios/story/${fileName}`;
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).upload(remotePath, buffer, {
      contentType: "audio/mpeg",
      upsert: true
    });
    if (error) {
      console.error("\u274C Supabase upload failed:", error.message);
      return res.status(500).json({ error: "Supabase upload failed" });
    }
    const { data: publicData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(remotePath);
    const publicUrl = publicData.publicUrl;
    console.log("\u2705 Uploaded to Supabase:", publicUrl);
    const tmpPath = path7.join(os2.tmpdir(), fileName);
    fs5.writeFileSync(tmpPath, buffer);
    const duration = await getAudioDurationInSeconds(tmpPath);
    console.log("\u{1F4D0} Performing forced alignment...");
    const alignment = await elevenLabs.forcedAlignment.create({
      file: fs5.createReadStream(tmpPath),
      text: content
    });
    console.log("\u2705 Alignment received");
    const words = alignment.words.map((w) => ({
      word: w.text,
      start: w.start,
      end: w.end
    }));
    const script = {
      story: content,
      duration,
      words
    };
    updateStoryTellingScriptJson(script);
    fs5.unlinkSync(tmpPath);
    res.json({
      script,
      duration,
      audioUrl: publicUrl
    });
  } catch (err) {
    console.error("Single TTS + alignment error:", err);
    res.status(500).json({
      error: "Failed to generate single TTS with alignment",
      details: String(err)
    });
  }
});
router5.post("/generate-voiceover", async (req, res) => {
  console.log("\n\u{1F4E8} ElevenLabs Voiceover request received");
  console.log("Time:", (/* @__PURE__ */ new Date()).toISOString());
  try {
    const { text: text2, voice, speed } = req.body;
    if (!text2 || !voice) {
      console.log("\u274C Missing required fields");
      return res.status(400).json({
        error: "Missing required fields: text, voice"
      });
    }
    if (!process.env.ELEVEN_LABS_API_KEY) {
      console.error("\u274C ELEVEN_LABS_API_KEY not set");
      return res.status(500).json({
        error: "Server configuration error"
      });
    }
    console.log("\u2705 Validation passed");
    console.log("\u{1F4DD} Text length:", text2.length);
    console.log("\u{1F3A4} Voice:", voice);
    console.log("\u26A1 Speed:", speed);
    const VOICE_MAP = {
      "alloy": "EXAVITQu4vr4xnSDxMaL",
      // Bella (neutral)
      "echo": "pNInz6obpgDQGcFmaJgB",
      // Adam (male)
      "fable": "N2lVS1w4EtoT3dr4eOWO",
      // Callum (male)
      "onyx": "VR6AewLTigWG4xSOukaG",
      // Arnold (deep male)
      "nova": "EXAVITQu4vr4xnSDxMaL",
      // Bella (female)
      "shimmer": "ThT5KcBeYPX3keUQqHPh"
      // Dorothy (soft female)
    };
    const voiceId = VOICE_MAP[voice] || VOICE_MAP["alloy"];
    console.log("\u{1F3AD} Using ElevenLabs Voice ID:", voiceId);
    console.log("\u{1F310} Calling ElevenLabs TTS API...");
    const audioStream = await elevenLabs.textToSpeech.convert(
      voiceId,
      {
        modelId: "eleven_multilingual_v2",
        text: text2
      }
    );
    console.log("\u2705 Converting stream to buffer...");
    const buffer = await webStreamToBuffer(audioStream);
    console.log("\u2705 Audio size:", buffer.byteLength, "bytes");
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.byteLength.toString());
    res.send(buffer);
    console.log("\u2705 Audio sent successfully\n");
  } catch (error) {
    console.error("\u274C SERVER ERROR:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({
      error: "Server error",
      details: errorMessage
    });
  }
});
var elevenlabs_default = router5;

// routes/apis/reddit.ts
import { Router as Router5 } from "express";
var router6 = Router5();
router6.post("/getpost", async (req, res) => {
  console.log("\u{1F50D} Received Reddit fetch request");
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Missing url query param" });
    }
    const cleanUrl = url.split("?")[0];
    const jsonUrl = cleanUrl.endsWith(".json") ? cleanUrl : cleanUrl + ".json";
    console.log("Fetching Reddit JSON:", jsonUrl);
    const redditRes = await fetch(jsonUrl, {
      headers: { "User-Agent": "RedditVideoApp/1.0 by u/yourredditusername" }
    });
    console.log("Reddit status:", redditRes.status, redditRes.statusText);
    if (!redditRes.ok) {
      return res.status(redditRes.status).json({ error: "Failed to fetch Reddit" });
    }
    console.log("Fetching Reddit data for URL:", url);
    const data = await redditRes.json();
    console.log("Fetched Reddit data for URL:", url);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching Reddit" });
  }
});
var reddit_default = router6;

// routes/database/auth.ts
import { Router as Router6 } from "express";
import { eq as eq3, and, gte } from "drizzle-orm";

// utils/authmiddleware.ts
import jwt2 from "jsonwebtoken";
import { eq as eq2 } from "drizzle-orm";
var requireAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;
    if (!token) {
      const authHeader = req.headers["authorization"];
      token = authHeader?.split(" ")[1];
    }
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({ error: "Token has been revoked" });
    }
    const decoded = jwt2.verify(token, JWT_SECRET);
    const [user] = await db.select({
      id: users.id,
      accountLocked: users.accountLocked,
      lockoutUntil: users.lockoutUntil
    }).from(users).where(eq2(users.id, decoded.userId));
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    if (user.accountLocked) {
      if (user.lockoutUntil && /* @__PURE__ */ new Date() < user.lockoutUntil) {
        return res.status(403).json({
          error: "Account is temporarily locked due to multiple failed login attempts",
          lockoutUntil: user.lockoutUntil
        });
      } else {
        await db.update(users).set({ accountLocked: false, lockoutUntil: null }).where(eq2(users.id, user.id));
      }
    }
    req.user = { userId: decoded.userId, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// routes/apis/nodemailer.ts
import jwt3 from "jsonwebtoken";
import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
async function sendEmailVerification(userId, email, baseUrl) {
  console.log("\u{1F4E7} [SendGrid] Preparing to send verification email");
  console.log("\u{1F4E7} [SendGrid] To:", email);
  console.log("\u{1F4E7} [SendGrid] From:", "viralmotion.app@gmail.com");
  console.log("\u{1F4E7} [SendGrid] API Key exists:", !!process.env.SENDGRID_API_KEY);
  console.log("\u{1F4E7} [SendGrid] API Key starts with:", process.env.SENDGRID_API_KEY?.substring(0, 10));
  const token = jwt3.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
  const url = `${baseUrl}/auth/verify?token=${token}`;
  console.log("\u{1F4E7} [SendGrid] Verification URL:", url);
  const msg = {
    to: email,
    from: {
      name: "Viral Motion",
      email: "viralmotion.app@gmail.com"
    },
    subject: "Verify Your Email",
    text: `Click this link to verify your account: ${url}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Email Verification</h2>
        <p>Please click the button below to verify your account:</p>
        <p>
          <a href="${url}" 
             style="display: inline-block; background-color: #4CAF50; color: white; 
                    padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
        </p>
        <p>If the button doesn't work, copy and paste this link:</p>
        <p><a href="${url}">${url}</a></p>
      </div>
    `
  };
  console.log("\u{1F4E7} [SendGrid] Sending email...");
  try {
    const response = await sgMail.send(msg);
    console.log("\u2705 [SendGrid] Email sent successfully!");
    console.log("\u2705 [SendGrid] Response status:", response[0]?.statusCode);
    console.log("\u2705 [SendGrid] Response headers:", JSON.stringify(response[0]?.headers, null, 2));
  } catch (error) {
    console.error("\u274C [SendGrid] Email send error:");
    console.error("\u274C [SendGrid] Status code:", error.code);
    console.error("\u274C [SendGrid] Message:", error.message);
    console.error("\u274C [SendGrid] Response body:", JSON.stringify(error.response?.body, null, 2));
    throw error;
  }
}
async function sendOtpEmail(email) {
  const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
  const otpToken = jwt3.sign({ email, otp }, JWT_SECRET, { expiresIn: "10m" });
  const msg = {
    to: email,
    from: {
      name: "Viral Motion",
      email: "viralmotion.app@gmail.com"
      // same sender
    },
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; text-align: center;">
        <h2>Your OTP Code</h2>
        <p>Use the following OTP to reset your password. It will expire in <strong>10 minutes</strong>.</p>
        <div style="font-size: 24px; font-weight: bold; margin: 20px 0; color: #4CAF50;">
          ${otp}
        </div>
        <p>If you didn\u2019t request this, please ignore this email.</p>
      </div>
    `
  };
  try {
    await sgMail.send(msg);
    console.log("\u2705 OTP email sent successfully!");
    return otpToken;
  } catch (error) {
    console.error("\u274C OTP send error:", error.response?.body || error.message);
    return null;
  }
}
async function sendWelcomeEmail(email, name) {
  const msg = {
    to: email,
    from: {
      name: "Viral Motion",
      email: "viralmotion.app@gmail.com"
    },
    subject: "Welcome to Viral Motion! \u{1F389}",
    text: `Welcome to Viral Motion${name ? `, ${name}` : ""}! We're excited to have you on board.`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(139, 92, 246, 0.15);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 50px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Welcome to Viral Motion!</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Your journey starts here</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            ${name ? `<p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">Hi <strong style="color: #7c3aed;">${name}</strong>,</p>` : '<p style="font-size: 18px; color: #1a1a1a; margin-bottom: 20px;">Hi there,</p>'}
            
            <p style="color: #4a4a4a; line-height: 1.8; margin-bottom: 20px; font-size: 15px;">
              We're <strong style="color: #1a1a1a;">thrilled</strong> to have you join our community! \u{1F389} Your account has been successfully verified and you're all set to get started.
            </p>
            
            <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-left: 4px solid #7c3aed; padding: 25px; margin: 30px 0; border-radius: 8px;">
              <h3 style="color: #7c3aed; margin-top: 0; font-size: 18px; font-weight: 600;">What's Next?</h3>
              <ul style="color: #4a4a4a; line-height: 2; padding-left: 20px; margin-bottom: 0; font-size: 15px;">
                <li>\u{1F680} Explore the dashboard and discover all features</li>
                <li>\u2728 Create your first project and bring your ideas to life</li>
              </ul>
            </div>
            
            <p style="color: #4a4a4a; line-height: 1.8; margin-bottom: 30px; font-size: 15px;">
              If you have any questions or need assistance, our support team is always here to help. Just reply to this email!
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="#" 
                 style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; 
                        padding: 16px 45px; text-decoration: none; border-radius: 50px; font-weight: 600; 
                        font-size: 16px; box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4); transition: all 0.3s ease;">
                Get Started Now
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #fafafa; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
            <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
              Best regards,<br>
              <strong style="color: #7c3aed;">The Viral Motion Team</strong>
            </p>
            <p style="color: #999; font-size: 12px; margin: 20px 0 0 0;">
              \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Viral Motion. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `
  };
  try {
    await sgMail.send(msg);
    console.log("\u2705 Welcome email sent successfully!");
  } catch (error) {
    console.error("\u274C Welcome email send error:", error.response?.body || error.message);
  }
}

// middleware/validator.ts
import validator from "validator";
var validateEmail = (email) => {
  return validator.isEmail(email) && email.length <= 255;
};
var validatePassword = (password) => {
  const errors = [];
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  }
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  return { valid: errors.length === 0, errors };
};
var sanitizeInput = (input) => {
  return validator.trim(validator.escape(input));
};
var validateSignupInput = (req, res, next) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "All fields are required" });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    return res.status(400).json({ error: passwordCheck.errors.join(". ") });
  }
  if (name.length < 2 || name.length > 50) {
    return res.status(400).json({ error: "Name must be between 2 and 50 characters" });
  }
  req.body.email = validator.normalizeEmail(email) || email.toLowerCase();
  req.body.name = sanitizeInput(name);
  next();
};
var validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }
  req.body.email = validator.normalizeEmail(email) || email.toLowerCase();
  next();
};

// utils/password.ts
import bcrypt from "bcrypt";
var hashPassword = async (password) => {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};
var comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// utils/cookies.ts
var setAccessTokenCookie = (res, token) => {
  res.cookie("accessToken", token, ACCESS_TOKEN_COOKIE);
};
var setRefreshTokenCookie = (res, token) => {
  res.cookie("refreshToken", token, COOKIE_OPTIONS);
};
var clearAuthCookies = (res) => {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });
};

// utils/twoFactor.ts
import speakeasy from "speakeasy";
import QRCode from "qrcode";
var generateTwoFactorSecret = (email) => {
  const secret = speakeasy.generateSecret({
    name: `ViralMotion (${email})`,
    issuer: "ViralMotion",
    length: 32
  });
  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url
  };
};
var generateQRCode = async (otpauthUrl) => {
  return QRCode.toDataURL(otpauthUrl);
};
var verifyTwoFactorToken = (token, secret) => {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 2
    // Allow ±30 seconds
  });
};

// routes/database/auth.ts
import jwt4 from "jsonwebtoken";

// config/stripe.ts
import Stripe from "stripe";
var STRIPE_MODE = process.env.STRIPE_MODE || "test";
var isTestMode = STRIPE_MODE === "test";
var isLiveMode = STRIPE_MODE === "live";
var STRIPE_SECRET_KEY = isTestMode ? process.env.STRIPE_SECRET_KEY_TEST : process.env.STRIPE_SECRET_KEY_LIVE;
if (!STRIPE_SECRET_KEY) {
  throw new Error(
    `STRIPE_SECRET_KEY is not set for ${STRIPE_MODE} mode. Please set STRIPE_SECRET_KEY_${STRIPE_MODE.toUpperCase()} in your .env file.`
  );
}
var stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-09-30.clover"
});
var STRIPE_CONFIG = {
  // Price IDs
  starterPriceId: isTestMode ? process.env.STRIPE_PRICE_ID_STARTER_TEST || "" : process.env.STRIPE_PRICE_ID_STARTER_LIVE || "",
  proPriceId: isTestMode ? process.env.STRIPE_PRICE_ID_PRO_TEST || "" : process.env.STRIPE_PRICE_ID_PRO_LIVE || "",
  teamPriceId: isTestMode ? process.env.STRIPE_PRICE_ID_TEAM_TEST || "" : process.env.STRIPE_PRICE_ID_TEAM_LIVE || "",
  // Webhook secret
  webhookSecret: isTestMode ? process.env.STRIPE_WEBHOOK_SECRET_TEST || "" : process.env.STRIPE_WEBHOOK_SECRET_LIVE || "",
  // Publishable key
  publishableKey: isTestMode ? process.env.STRIPE_PUBLISHABLE_KEY_TEST || "" : process.env.STRIPE_PUBLISHABLE_KEY_LIVE || "",
  // Mode info
  mode: STRIPE_MODE,
  isTestMode,
  isLiveMode
};
var missingVars = [];
if (!STRIPE_CONFIG.starterPriceId) {
  missingVars.push(`STRIPE_PRICE_ID_STARTER_${STRIPE_MODE.toUpperCase()}`);
}
if (!STRIPE_CONFIG.proPriceId) {
  missingVars.push(`STRIPE_PRICE_ID_PRO_${STRIPE_MODE.toUpperCase()}`);
}
if (!STRIPE_CONFIG.teamPriceId) {
  missingVars.push(`STRIPE_PRICE_ID_TEAM_${STRIPE_MODE.toUpperCase()}`);
}
if (!STRIPE_CONFIG.webhookSecret) {
  missingVars.push(`STRIPE_WEBHOOK_SECRET_${STRIPE_MODE.toUpperCase()}`);
}
if (!STRIPE_CONFIG.publishableKey) {
  missingVars.push(`STRIPE_PUBLISHABLE_KEY_${STRIPE_MODE.toUpperCase()}`);
}
if (missingVars.length > 0) {
  console.error("\u274C Missing required Stripe environment variables:");
  missingVars.forEach((varName) => console.error(`   - ${varName}`));
  throw new Error(`Missing Stripe configuration for ${STRIPE_MODE} mode`);
}
if (process.env.NODE_ENV === "production" && isTestMode) {
  console.error("\u274C CRITICAL ERROR: Production environment is using TEST Stripe keys!");
  console.error("   Set STRIPE_MODE=live in production environment variables.");
  throw new Error("Cannot use Stripe test mode in production");
}
if (process.env.NODE_ENV === "development" && isLiveMode) {
  console.warn("\u26A0\uFE0F  WARNING: Development environment is using LIVE Stripe keys!");
  console.warn("   Real money will be charged. Consider using STRIPE_MODE=test");
  console.warn("   Press Ctrl+C within 5 seconds to abort...");
  await new Promise((resolve) => setTimeout(resolve, 5e3));
}
console.log("\n" + "=".repeat(60));
console.log("\u{1F527} Stripe Configuration Loaded:");
console.log("=".repeat(60));
console.log(`   Mode:           ${STRIPE_MODE.toUpperCase()} ${isTestMode ? "(Safe)" : "(LIVE CHARGES)"}`);
console.log(`   Environment:    ${process.env.NODE_ENV || "development"}`);
console.log(`   Secret Key:     ${STRIPE_SECRET_KEY.substring(0, 12)}...`);
console.log(`   Publishable:    ${STRIPE_CONFIG.publishableKey.substring(0, 12)}...`);
console.log(`   Webhook Secret: ${STRIPE_CONFIG.webhookSecret.substring(0, 12)}...`);
console.log("\n   Price IDs:");
console.log(`   - Starter:      ${STRIPE_CONFIG.starterPriceId}`);
console.log(`   - Pro:          ${STRIPE_CONFIG.proPriceId}`);
console.log(`   - Team:         ${STRIPE_CONFIG.teamPriceId}`);
console.log("=".repeat(60) + "\n");
function getPriceId(plan) {
  let priceId;
  switch (plan) {
    case "starter":
      priceId = STRIPE_CONFIG.starterPriceId;
      break;
    case "pro":
      priceId = STRIPE_CONFIG.proPriceId;
      break;
    case "team":
      priceId = STRIPE_CONFIG.teamPriceId;
      break;
    default:
      throw new Error(`Invalid plan: ${plan}`);
  }
  if (!priceId) {
    throw new Error(`No price ID configured for plan: ${plan} in ${STRIPE_MODE} mode`);
  }
  return priceId;
}
function getPlanFromPriceId(priceId) {
  if (priceId === STRIPE_CONFIG.starterPriceId) return "starter";
  if (priceId === STRIPE_CONFIG.proPriceId) return "pro";
  if (priceId === STRIPE_CONFIG.teamPriceId) return "team";
  console.warn(`\u26A0\uFE0F Unknown price ID: ${priceId} - defaulting to null`);
  return null;
}

// routes/database/auth.ts
var router7 = Router6();
var CLIENT_URL = process.env.NODE_ENV === "production" ? process.env.CLIENT_URL || "https://remotion-web-application.vercel.app" : "http://localhost:5173";
router7.post(
  "/signup",
  signupRateLimiter,
  validateSignupInput,
  async (req, res) => {
    try {
      const { email, password, name } = req.body;
      const existing = await db.select().from(users).where(eq3(users.email, email));
      if (existing.length > 0) {
        return res.status(400).json({ error: "Invalid registration details" });
      }
      const passwordHash = await hashPassword(password);
      const [newUser] = await db.insert(users).values({
        email,
        name,
        passwordHash,
        provider: "local",
        profilePicture: "https://res.cloudinary.com/dnxc1lw18/image/upload/v1761048476/pfp_yitfgl.jpg",
        verified: false
      }).returning();
      console.log(`\u2705 New user created: ${newUser.id} (${email}) - Free plan (no subscription)`);
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
  }
);
router7.post("/login", authRateLimiter, validateLoginInput, async (req, res) => {
  const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
  try {
    const { email, password } = req.body;
    const [user] = await db.select().from(users).where(eq3(users.email, email));
    if (!user || !user.passwordHash) {
      await db.insert(loginAttempts).values({
        email,
        ipAddress,
        successful: false
      });
      return res.status(400).json({ error: "Invalid credentials" });
    }
    if (user.accountLocked && user.lockoutUntil && /* @__PURE__ */ new Date() < user.lockoutUntil) {
      return res.status(403).json({
        error: "Account temporarily locked. Please try again later.",
        lockoutUntil: user.lockoutUntil
      });
    }
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1e3);
    const recentAttempts = await db.select().from(loginAttempts).where(
      and(
        eq3(loginAttempts.email, email),
        gte(loginAttempts.attemptedAt, fifteenMinutesAgo),
        eq3(loginAttempts.successful, false)
      )
    );
    if (recentAttempts.length >= LOCKOUT_CONFIG.maxAttempts) {
      const lockoutUntil = new Date(
        Date.now() + LOCKOUT_CONFIG.lockoutDuration
      );
      await db.update(users).set({ accountLocked: true, lockoutUntil }).where(eq3(users.id, user.id));
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
        successful: false
      });
      return res.status(400).json({ error: "Invalid credentials" });
    }
    await db.insert(loginAttempts).values({
      email,
      ipAddress,
      successful: true
    });
    await db.update(users).set({ lastLogin: /* @__PURE__ */ new Date() }).where(eq3(users.id, user.id));
    if (user.twoFactorEnabled) {
      const tempToken = jwt4.sign(
        { userId: user.id, requires2FA: true },
        JWT_SECRET,
        {
          expiresIn: "5m"
        }
      );
      return res.json({
        requires2FA: true,
        tempToken,
        message: "Please provide 2FA code"
      });
    }
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email
    });
    const userAgent = req.headers["user-agent"] || "unknown";
    await storeRefreshToken(user.id, refreshToken, ipAddress, userAgent);
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);
    res.json({
      success: true,
      message: "Login successful",
      token: accessToken,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});
router7.post("/verify-2fa", async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const decoded = jwt4.verify(tempToken, JWT_SECRET);
    if (!decoded.requires2FA) {
      return res.status(400).json({ error: "Invalid token" });
    }
    const [user] = await db.select().from(users).where(eq3(users.id, decoded.userId));
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: "Invalid request" });
    }
    const valid = verifyTwoFactorToken(code, user.twoFactorSecret);
    if (!valid) {
      return res.status(400).json({ error: "Invalid 2FA code" });
    }
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email
    });
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";
    await storeRefreshToken(user.id, refreshToken, ipAddress, userAgent);
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);
    res.json({
      success: true,
      message: "Login successful",
      token: accessToken,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (err) {
    console.error("2FA verification error:", err);
    res.status(400).json({ error: "Invalid or expired token" });
  }
});
router7.post("/refresh-token", async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: "No refresh token provided" });
    }
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
    const [storedToken] = await db.select().from(refreshTokens).where(eq3(refreshTokens.token, refreshToken));
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
      token: accessToken
    });
  } catch (err) {
    console.error("Token refresh error:", err);
    res.status(401).json({ error: "Failed to refresh token" });
  }
});
router7.post("/logout", requireAuth, async (req, res) => {
  try {
    const accessToken = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
    const refreshToken = req.cookies?.refreshToken;
    if (accessToken) {
      const expiresAt = /* @__PURE__ */ new Date();
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
router7.get("/verify", async (req, res) => {
  const { token } = req.query;
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Invalid verification link" });
  }
  try {
    const decoded = jwt4.verify(token, JWT_SECRET);
    const response = await db.update(users).set({ verified: true }).where(eq3(users.id, decoded.userId)).returning();
    const userdata = response[0];
    await sendWelcomeEmail(userdata.email, userdata.name);
    res.redirect(`${CLIENT_URL}/login?verified=true`);
  } catch (err) {
    console.error("Verification error:", err);
    res.status(400).json({ error: "Invalid or expired token" });
  }
});
router7.get("/", requireAuth, async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      profilePicture: users.profilePicture,
      twoFactorEnabled: users.twoFactorEnabled,
      lastLogin: users.lastLogin
    }).from(users).where(eq3(users.id, userId));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});
router7.post("/2fa/enable", requireAuth, async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const [user] = await db.select().from(users).where(eq3(users.id, userId));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: "2FA is already enabled" });
    }
    let secret;
    let otpauthUrl;
    if (user.twoFactorSecret) {
      secret = user.twoFactorSecret;
      otpauthUrl = `otpauth://totp/ViralMotion:${user.email}?secret=${secret}&issuer=ViralMotion`;
      console.log(`\u267B\uFE0F Reusing existing 2FA secret for user ${user.email}`);
    } else {
      const secretData = generateTwoFactorSecret(user.email);
      secret = secretData.secret;
      otpauthUrl = secretData.otpauthUrl;
      await db.update(users).set({ twoFactorSecret: secret }).where(eq3(users.id, userId));
      console.log(`\u2728 Generated new 2FA secret for user ${user.email}`);
    }
    const qrCode = await generateQRCode(otpauthUrl);
    res.json({
      success: true,
      secret,
      qrCode,
      message: user.twoFactorSecret ? "Scan QR code with your authenticator app (reusing existing setup)" : "Scan QR code with your authenticator app"
    });
  } catch (err) {
    console.error("2FA enable error:", err);
    res.status(500).json({ error: "Failed to enable 2FA" });
  }
});
router7.post("/2fa/confirm", requireAuth, async (req, res) => {
  const userId = req.user?.userId;
  const { code } = req.body;
  if (!userId || !code) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const [user] = await db.select().from(users).where(eq3(users.id, userId));
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: "2FA setup not initiated" });
    }
    const valid = verifyTwoFactorToken(code, user.twoFactorSecret);
    if (!valid) {
      return res.status(400).json({ error: "Invalid code" });
    }
    await db.update(users).set({ twoFactorEnabled: true }).where(eq3(users.id, userId));
    res.json({
      success: true,
      message: "2FA enabled successfully"
    });
  } catch (err) {
    console.error("2FA confirm error:", err);
    res.status(500).json({ error: "Failed to confirm 2FA" });
  }
});
router7.post("/2fa/disable", requireAuth, async (req, res) => {
  const userId = req.user?.userId;
  const { password } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ error: "Password required" });
  }
  try {
    const [user] = await db.select().from(users).where(eq3(users.id, userId));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ error: "Invalid password" });
    }
    await db.update(users).set({
      twoFactorEnabled: false
    }).where(eq3(users.id, userId));
    res.json({
      success: true,
      message: "2FA disabled successfully"
    });
  } catch (err) {
    console.error("2FA disable error:", err);
    res.status(500).json({ error: "Failed to disable 2FA" });
  }
});
router7.post("/2fa/reset", requireAuth, async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const [user] = await db.select().from(users).where(eq3(users.id, userId));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const { secret, otpauthUrl } = generateTwoFactorSecret(user.email);
    const qrCode = await generateQRCode(otpauthUrl);
    await db.update(users).set({
      twoFactorSecret: secret,
      twoFactorEnabled: false
    }).where(eq3(users.id, userId));
    res.json({
      success: true,
      secret,
      qrCode,
      message: "2FA reset successfully"
    });
  } catch (err) {
    console.error("2FA reset error:", err);
    res.status(500).json({ error: "Failed to reset 2FA" });
  }
});
router7.put(
  "/update-profile-picture",
  requireAuth,
  async (req, res) => {
    const { profile_pic } = req.body;
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const [updated] = await db.update(users).set({ profilePicture: profile_pic }).where(eq3(users.id, userId)).returning();
      res.json({
        success: true,
        message: "Profile picture updated successfully",
        user: updated
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update profile picture" });
    }
  }
);
router7.put("/update-username", requireAuth, async (req, res) => {
  const { username } = req.body;
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const [updated] = await db.update(users).set({ name: username }).where(eq3(users.id, userId)).returning();
    res.json({
      success: true,
      message: "Username updated successfully",
      user: updated
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update username" });
  }
});
router7.put("/update-password", requireAuth, async (req, res) => {
  const { oldPassword, newPassword, twoFactorCode } = req.body;
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const [user] = await db.select().from(users).where(eq3(users.id, userId));
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
      const valid2 = verifyTwoFactorToken(twoFactorCode, user.twoFactorSecret);
      if (!valid2) {
        return res.status(400).json({ error: "Invalid 2FA code" });
      }
    }
    const valid = await comparePassword(oldPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }
    const newPasswordHash = await hashPassword(newPassword);
    await db.update(users).set({
      passwordHash: newPasswordHash,
      passwordChangedAt: /* @__PURE__ */ new Date()
    }).where(eq3(users.id, userId));
    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Password update error:", err);
    res.status(500).json({ error: "Failed to update password" });
  }
});
router7.post("/reset-password", passwordResetRateLimiter, async (req, res) => {
  const { newPassword, email, resetToken } = req.body;
  if (!newPassword || !email || !resetToken) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const decoded = jwt4.verify(resetToken, JWT_SECRET);
    if (decoded.email !== email) {
      return res.status(400).json({ error: "Invalid reset token" });
    }
    const [user] = await db.select().from(users).where(eq3(users.email, email));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const newPasswordHash = await hashPassword(newPassword);
    await db.update(users).set({
      passwordHash: newPasswordHash,
      passwordChangedAt: /* @__PURE__ */ new Date()
    }).where(eq3(users.email, email));
    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error("Password reset error:", err);
    res.status(400).json({ error: "Invalid or expired reset token" });
  }
});
router7.post("/send-otp", passwordResetRateLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  try {
    const [existing] = await db.select().from(users).where(eq3(users.email, email));
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
router7.post("/verify-otp", async (req, res) => {
  const { email, otp, otpToken } = req.body;
  if (!email || !otp || !otpToken) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const decoded = jwt4.verify(otpToken, JWT_SECRET);
    if (decoded.email !== email || decoded.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }
    const resetToken = jwt4.sign({ email }, JWT_SECRET, { expiresIn: "15m" });
    res.json({
      success: true,
      message: "OTP verified successfully",
      resetToken
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(400).json({ error: "Invalid or expired OTP" });
  }
});
router7.post("/google-login", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }
    const [user] = await db.select().from(users).where(eq3(users.email, email));
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email
    });
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";
    await storeRefreshToken(user.id, refreshToken, ipAddress, userAgent);
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);
    await db.update(users).set({ lastLogin: /* @__PURE__ */ new Date() }).where(eq3(users.id, user.id));
    res.json({
      success: true,
      message: "Login successful",
      token: accessToken,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});
router7.delete("/delete-account", requireAuth, async (req, res) => {
  const userId = req.user?.userId;
  const { password, twoFactorCode } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ error: "Password required" });
  }
  try {
    const [user] = await db.select().from(users).where(eq3(users.id, userId));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ error: "Invalid password" });
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
      const valid2FA = verifyTwoFactorToken(twoFactorCode, user.twoFactorSecret);
      if (!valid2FA) {
        return res.status(400).json({ error: "Invalid 2FA code" });
      }
    }
    const [subscription] = await db.select().from(subscriptions).where(eq3(subscriptions.userId, userId)).limit(1);
    if (subscription?.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        console.log(`\u2705 Canceled Stripe subscription: ${subscription.stripeSubscriptionId}`);
      } catch (stripeError) {
        console.error("\u26A0\uFE0F Failed to cancel Stripe subscription:", stripeError);
      }
    }
    await db.delete(projects).where(eq3(projects.userId, userId));
    await db.delete(renders).where(eq3(renders.userId, userId));
    await db.delete(uploads).where(eq3(uploads.userId, userId));
    await db.delete(datasets).where(eq3(datasets.userId, userId));
    await db.delete(veo3Generations).where(eq3(veo3Generations.userId, userId));
    await db.delete(imageGenerations).where(eq3(imageGenerations.userId, userId));
    await db.delete(youtubeDownloads).where(eq3(youtubeDownloads.userId, userId));
    await db.delete(loginAttempts).where(eq3(loginAttempts.email, user.email));
    await db.delete(users).where(eq3(users.id, userId));
    clearAuthCookies(res);
    console.log(`\u2705 Account deleted for user ${user.email} (ID: ${userId})`);
    res.json({
      success: true,
      message: "Account deleted successfully"
    });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
});
var auth_default = router7;

// routes/database/projects.ts
import { Router as Router7 } from "express";
import { eq as eq4, and as and2 } from "drizzle-orm";
var router8 = Router7();
router8.post("/save", requireAuth, async (req, res) => {
  const { title, templateId, props, screenshot } = req.body;
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!title || !templateId || !props) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const existing = await db.select().from(projects).where(and2(eq4(projects.userId, userId), eq4(projects.title, title)));
  if (existing.length > 0) {
    return res.status(400).json({ error: "Project name already exists." });
  }
  const [newProject] = await db.insert(projects).values({
    userId,
    title,
    templateId,
    props,
    screenshot,
    lastUpdated: /* @__PURE__ */ new Date()
  }).returning();
  res.json({ message: "Project saved successfully", project: newProject });
});
router8.put(
  "/update/:id",
  requireAuth,
  async (req, res) => {
    const { id } = req.params;
    const { props, screenshot } = req.body;
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const [existing] = await db.select().from(projects).where(and2(eq4(projects.userId, userId), eq4(projects.id, Number(id))));
    if (!existing) {
      return res.status(404).json({ error: "Project not found" });
    }
    const [updated] = await db.update(projects).set({ props, screenshot, lastUpdated: /* @__PURE__ */ new Date() }).where(eq4(projects.id, Number(id))).returning();
    res.json({ message: "Project updated successfully", project: updated });
  }
);
router8.put(
  "/update-name/:id",
  requireAuth,
  async (req, res) => {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const [existing] = await db.select().from(projects).where(and2(eq4(projects.userId, userId), eq4(projects.id, Number(id))));
    if (!existing) {
      return res.status(404).json({ error: "Project not found" });
    }
    const [updated] = await db.update(projects).set({ title, lastUpdated: /* @__PURE__ */ new Date() }).where(eq4(projects.id, Number(id))).returning();
    res.json({ message: "Project updated successfully", project: updated });
  }
);
router8.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const [project] = await db.select().from(projects).where(and2(eq4(projects.userId, userId), eq4(projects.id, Number(id))));
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }
  res.json(project);
});
router8.get("/", requireAuth, async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const userProjects = await db.select().from(projects).where(eq4(projects.userId, userId));
    res.json(userProjects);
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});
router8.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const [existing] = await db.select().from(projects).where(and2(eq4(projects.userId, userId), eq4(projects.id, Number(id))));
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
          const result = await cloudinaryClient_default.uploader.destroy(publicId, {
            resource_type: "image"
          });
          console.log("\u2601\uFE0F Cloudinary deletion result:", result);
        } else {
          console.warn(
            "\u26A0\uFE0F Could not extract Cloudinary public_id from URL:",
            existing.screenshot
          );
        }
      } catch (cloudError) {
        console.error("\u274C Cloudinary deletion error:", cloudError);
      }
    }
    await db.delete(projects).where(eq4(projects.id, Number(id)));
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});
var projects_default = router8;

// routes/database/useruploads.ts
import { Router as Router8 } from "express";
import { eq as eq5, and as and3 } from "drizzle-orm";

// utils/publicidextractor.ts
var extractPublicId = (url) => {
  const cleanUrl = url.split("?")[0];
  const match = cleanUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
};

// routes/database/useruploads.ts
var router9 = Router8();
router9.post("/", requireAuth, async (req, res) => {
  const userId = req.user?.userId;
  const { type, url } = req.body;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!type || !url) {
    return res.status(400).json({ error: "Missing type or url" });
  }
  try {
    const [newUpload] = await db.insert(uploads).values({ userId, type, url }).returning();
    res.json({ message: "Upload saved", upload: newUpload });
  } catch (err) {
    res.status(500).json({ error: "Failed to save upload", details: String(err) });
  }
});
router9.delete("/:id", requireAuth, async (req, res) => {
  const userId = req.user?.userId;
  const { id } = req.params;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const [existing] = await db.select().from(uploads).where(and3(eq5(uploads.userId, userId), eq5(uploads.id, Number(id))));
    if (!existing) {
      return res.status(404).json({ error: "Upload not found" });
    }
    if (existing.url) {
      try {
        const publicId = extractPublicId(existing.url);
        const resourceType = existing.url.includes("/video/") ? "video" : "image";
        if (publicId) {
          const result = await cloudinaryClient_default.uploader.destroy(publicId, {
            resource_type: resourceType
            // since you’re deleting videos
          });
          if (result.result === "ok") {
            console.log("\u2705 Cloudinary file deleted:", publicId);
          } else {
            console.warn("\u26A0\uFE0F Cloudinary delete issue:", result);
          }
        } else {
          console.warn("\u26A0\uFE0F Could not extract Cloudinary public ID from URL");
        }
      } catch (cloudErr) {
        console.error("\u274C Cloudinary delete error:", cloudErr);
      }
    }
    await db.delete(uploads).where(eq5(uploads.id, Number(id)));
    res.json({ message: "Upload deleted successfully" });
  } catch (err) {
    console.error("\u274C Failed to delete upload:", err);
    res.status(500).json({ error: "Failed to delete upload", details: String(err) });
  }
});
router9.get("/", requireAuth, async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const userUploads = await db.select().from(uploads).where(eq5(uploads.userId, userId));
    res.json(userUploads);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch uploads", details: String(err) });
  }
});
router9.get("/images", requireAuth, async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const userImages = await db.select().from(uploads).where(and3(eq5(uploads.userId, userId), eq5(uploads.type, "image")));
    res.json(userImages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch images", details: String(err) });
  }
});
router9.get("/videos", requireAuth, async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const userVideos = await db.select().from(uploads).where(and3(eq5(uploads.userId, userId), eq5(uploads.type, "video")));
    res.json(userVideos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch videos", details: String(err) });
  }
});
var useruploads_default = router9;

// routes/apis/pixabay.ts
import { Router as Router9 } from "express";
import axios from "axios";
var router10 = Router9();
var PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
if (!PIXABAY_API_KEY) {
  throw new Error("\u274C Missing PIXABAY_API_KEY in .env");
}
router10.get("/images", async (req, res) => {
  try {
    const query = req.query.query || "nature";
    const url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(
      String(query)
    )}&image_type=photo&per_page=20`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    console.error("Error fetching Pixabay images:", err);
    res.status(500).json({ error: "Failed to fetch images" });
  }
});
router10.get("/videos", async (req, res) => {
  try {
    const query = req.query.query || "travel";
    const url = `https://pixabay.com/api/videos/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(
      String(query)
    )}&per_page=6`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    console.error("Error fetching Pixabay videos:", err);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});
var pixabay_default = router10;

// routes/database/renders.ts
import { Router as Router10 } from "express";
import { and as and4, eq as eq6 } from "drizzle-orm";
var router11 = Router10();
router11.get("/", requireAuth, async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const allRenders = await db.select().from(renders).where(eq6(renders.userId, userId));
    res.json(allRenders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch renders", details: String(err) });
  }
});
router11.post("/", requireAuth, async (req, res) => {
  const userId = req.user?.userId;
  const { templateId, outputUrl, type } = req.body;
  if (!userId || !templateId || !outputUrl || !type) {
    return res.status(400).json({ error: "Missing userId, templateId or outputUrl" });
  }
  try {
    const [newRender] = await db.insert(renders).values({ userId, templateId, outputUrl, type }).returning();
    res.json({ message: "Render saved", render: newRender });
  } catch (err) {
    res.status(500).json({ error: "Failed to save render", details: String(err) });
  }
});
router11.delete("/:id", requireAuth, async (req, res) => {
  const userId = req.user?.userId;
  const { id } = req.params;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const [existing] = await db.select().from(renders).where(and4(eq6(renders.userId, userId), eq6(renders.id, id)));
    if (!existing) {
      return res.status(404).json({ error: "Render not found" });
    }
    if (existing.outputUrl) {
      try {
        const match = existing.outputUrl.match(/upload\/(?:v\d+\/)?([^\.]+)/);
        const publicId = match ? match[1] : null;
        if (publicId) {
          const resourceType = existing.type === "gif" ? "image" : "video";
          const result = await cloudinaryClient_default.uploader.destroy(publicId, {
            resource_type: resourceType
          });
          console.log("\u2601\uFE0F Cloudinary deletion result:", result);
        } else {
          console.warn(
            "\u26A0\uFE0F Could not extract Cloudinary public_id from URL:",
            existing.outputUrl
          );
        }
      } catch (cloudErr) {
        console.error("\u274C Cloudinary deletion error:", cloudErr);
      }
    }
    await db.delete(renders).where(eq6(renders.id, id));
    res.json({ message: "Render deleted successfully" });
  } catch (err) {
    console.error("\u274C Failed to delete render:", err);
    res.status(500).json({ error: "Failed to delete render", details: String(err) });
  }
});
var renders_default = router11;

// routes/database/datasetsupload.ts
import { Router as Router11 } from "express";
import { eq as eq7, and as and5 } from "drizzle-orm";

// utils/datasetextractor.ts
import fs6 from "fs";
import XLSX from "xlsx";
import fetch2 from "node-fetch";
async function extractFromJsonPath(filePath) {
  let fileContent;
  if (filePath.startsWith("http")) {
    const response = await fetch2(filePath);
    if (!response.ok) throw new Error(`Failed to fetch JSON file: ${response.statusText}`);
    fileContent = await response.text();
  } else {
    fileContent = await fs6.promises.readFile(filePath, "utf8");
  }
  let parsed = JSON.parse(fileContent);
  if (typeof parsed === "object" && !Array.isArray(parsed)) {
    parsed = [parsed];
  }
  if (!Array.isArray(parsed)) {
    throw new Error("JSON file must contain an array or object at the top level.");
  }
  if (!parsed.every((item) => typeof item === "object" && item !== null)) {
    throw new Error("JSON array must contain objects.");
  }
  return parsed;
}
async function extractFromXlsxPath(filePath) {
  let workbook;
  if (filePath.startsWith("http")) {
    const response = await fetch2(filePath);
    if (!response.ok) throw new Error(`Failed to fetch XLSX file: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    workbook = XLSX.read(buffer, { type: "buffer" });
  } else {
    workbook = XLSX.readFile(filePath);
  }
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error("No sheets found in XLSX file.");
  }
  const result = {};
  let foundData = false;
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
    if (Array.isArray(data) && data.length > 0) {
      result[sheetName] = data;
      foundData = true;
    }
  }
  if (!foundData) {
    throw new Error("No data found in any sheet of the XLSX file.");
  }
  if (Object.keys(result).length === 1) {
    return result[workbook.SheetNames[0]];
  }
  return result;
}

// routes/database/datasetsupload.ts
var router12 = Router11();
router12.post("/", requireAuth, async (req, res) => {
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
    const [newDataset] = await db.insert(datasets).values({ userId, type, url }).returning();
    console.log("Original data from file: ", filedata);
    res.json({
      message: "Dataset saved",
      Dataset: newDataset,
      extractedData: formattedData
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to save Dataset", details: String(err) });
  }
});
router12.delete("/:id", requireAuth, async (req, res) => {
  const userId = req.user?.userId;
  const { id } = req.params;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const [existing] = await db.select().from(datasets).where(and5(eq7(datasets.userId, userId), eq7(datasets.id, Number(id))));
    if (!existing) {
      return res.status(404).json({ error: "Dataset not found" });
    }
    if (existing.url) {
      try {
        const match = existing.url.match(/object\/public\/(.+)/);
        const filePath = match ? match[1] : null;
        if (filePath) {
          const [bucket, ...pathParts] = filePath.split("/");
          const path15 = pathParts.join("/");
          const { error: deleteError } = await supabase.storage.from(bucket).remove([path15]);
          if (deleteError) {
            console.error("\u274C Supabase delete error:", deleteError);
          } else {
            console.log("\u2601\uFE0F Deleted from Supabase:", filePath);
          }
        }
      } catch (supabaseErr) {
        console.error(
          "\u274C Failed to parse or delete from Supabase:",
          supabaseErr
        );
      }
    }
    await db.delete(datasets).where(eq7(datasets.id, Number(id)));
    res.json({ message: "Dataset deleted" });
  } catch (err) {
    console.error("\u274C Delete error:", err);
    res.status(500).json({ error: "Failed to delete dataset", details: String(err) });
  }
});
router12.get("/", requireAuth, async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const userdatasets = await db.select().from(datasets).where(eq7(datasets.userId, userId));
    res.json(userdatasets);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch datasets", details: String(err) });
  }
});
var datasetsupload_default = router12;

// routes/apis/fromuploadsextraction.ts
import { Router as Router12 } from "express";
var router13 = Router12();
router13.post("/", requireAuth, async (req, res) => {
  const { fileurl, type, template } = req.body;
  console.log(fileurl);
  if (!type || !fileurl) {
    return res.status(400).json({ error: "Missing type or url" });
  }
  let filedata;
  if (type === "json") {
    filedata = await extractFromJsonPath(fileurl);
  } else {
    filedata = await extractFromXlsxPath(fileurl);
  }
  try {
    const formattedData = await datasetFormatterUsingAi(
      template,
      type,
      filedata
    );
    res.json({ extractedData: formattedData });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch Dataset data", details: String(err) });
  }
});
var fromuploadsextraction_default = router13;

// routes/google.ts
import { Router as Router13 } from "express";
import passport from "passport";
import pkg from "passport-google-oauth20";
import { eq as eq8 } from "drizzle-orm";
var { Strategy: GoogleStrategy } = pkg;
var router14 = Router13();
var GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
var GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
var CLIENT_URL2 = process.env.CLIENT_URL || "https://www.viralmotion.ai";
var BACKEND_URL = process.env.BACKEND_URL || "https://viralmotion-backend-kx15.onrender.com";
console.log(`\u{1F527} OAuth Config: Backend=${BACKEND_URL}, Client=${CLIENT_URL2}`);
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error("Google OAuth credentials not configured");
}
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${BACKEND_URL}/authenticate/google/callback`
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        const name = profile.displayName;
        const photo = profile.photos?.[0].value;
        if (!email) {
          return done(new Error("No email provided by Google"), void 0);
        }
        const [existing] = await db.select().from(users).where(eq8(users.email, email));
        let user;
        if (existing) {
          await db.update(users).set({ lastLogin: /* @__PURE__ */ new Date() }).where(eq8(users.id, existing.id));
          user = existing;
          console.log(`\u2705 Existing Google user logged in: ${email}`);
        } else {
          const [newUser] = await db.insert(users).values({
            email,
            name,
            provider: "google",
            passwordHash: "",
            profilePicture: photo,
            verified: true
          }).returning();
          user = newUser;
          console.log(`\u2728 New Google user created: ${email} (ID: ${user.id}) - Free plan (no subscription)`);
          await sendWelcomeEmail(email, newUser.name);
        }
        return done(null, user);
      } catch (err) {
        console.error("Google OAuth error:", err);
        return done(err, void 0);
      }
    }
  )
);
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});
router14.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
);
router14.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${CLIENT_URL2}/login?error=google_failed`,
    session: false
  }),
  async (req, res) => {
    try {
      const user = req.user;
      if (!user || !user.id || !user.email) {
        return res.redirect(`${CLIENT_URL2}/login?error=auth_failed`);
      }
      const accessToken = generateAccessToken({ userId: user.id, email: user.email });
      const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });
      const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";
      await storeRefreshToken(user.id, refreshToken, ipAddress, userAgent);
      setAccessTokenCookie(res, accessToken);
      setRefreshTokenCookie(res, refreshToken);
      console.log(`\u2705 Google OAuth complete for ${user.email}, redirecting to loading page`);
      res.redirect(`${CLIENT_URL2}/loading?token=${accessToken}&email=${encodeURIComponent(user.email)}`);
    } catch (err) {
      console.error("Google callback error:", err);
      res.redirect(`${CLIENT_URL2}/login?error=server_error`);
    }
  }
);
router14.get("/google/user", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json({ success: true, user: req.user });
});
router14.get("/google/logout", (req, res) => {
  req.logout(() => {
    res.redirect(CLIENT_URL2);
  });
});
var google_default = router14;

// routes/apis/removebg.ts
import { Router as Router14 } from "express";
import multer2 from "multer";

// controllers/apis/removebg.ts
import fetch3 from "node-fetch";
import FormData from "form-data";
var RemoveBgController = class {
  async removeBackground(req, res) {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }
      const apiKey = process.env.REMOVE_BG_API_KEY;
      if (!apiKey) {
        console.error("REMOVE_BG_API_KEY is not configured");
        res.status(500).json({ error: "Service configuration error" });
        return;
      }
      const fileBuffer = req.file.buffer;
      const formData = new FormData();
      formData.append("size", "auto");
      formData.append("image_file", fileBuffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });
      const response = await fetch3("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
          ...formData.getHeaders()
          // Important: includes boundary for multipart
        },
        body: formData
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Remove.bg API error:", errorText);
        res.status(response.status).json({
          error: "Background removal failed",
          details: response.status === 403 ? "Invalid API key or insufficient credits" : "Service temporarily unavailable"
        });
        return;
      }
      const arrayBuffer = await response.arrayBuffer();
      const bgRemovedBuffer = Buffer.from(arrayBuffer);
      const cloudResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinaryClient_default.uploader.upload_stream(
          {
            folder: "bg-removed",
            resource_type: "image",
            format: "png",
            transformation: [
              { quality: "auto:good" },
              { fetch_format: "auto" }
            ]
          },
          (err, result) => {
            if (err) {
              console.error("Cloudinary upload error:", err);
              reject(err);
            } else if (!result) {
              reject(new Error("Cloudinary upload returned no result"));
            } else {
              resolve(result);
            }
          }
        );
        uploadStream.end(bgRemovedBuffer);
      });
      res.json({
        url: cloudResult.secure_url,
        publicId: cloudResult.public_id
      });
    } catch (err) {
      console.error("Remove background error:", err);
      res.status(500).json({
        error: "Internal server error",
        details: process.env.NODE_ENV === "production" ? "An error occurred while processing your image" : err.message
      });
    }
  }
};

// routes/apis/removebg.ts
var router15 = Router14();
var removeBgController = new RemoveBgController();
var upload2 = multer2({
  storage: multer2.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp"
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed."));
    }
  }
});
router15.post(
  "/remove-background",
  upload2.single("image"),
  // 'image' is the field name
  (req, res) => removeBgController.removeBackground(req, res)
);
var removebg_default = router15;

// routes/apis/seeDream.ts
import express2 from "express";
import { z } from "zod";

// services/seeDreamClient.ts
import axios2 from "axios";
var API_KEY = process.env.SEEDREAM_API_KEY;
var BASE = process.env.SEEDREAM_API_BASE || "https://ark.ap-southeast.bytepluses.com";
var PATH = process.env.SEEDREAM_API_PATH || "/api/v3/images/generations";
if (!API_KEY) {
  console.warn("Warning: SEEDREAM_API_KEY is not set. Set it in your .env");
}
var SeedreamClient = class {
  client;
  fullUrl;
  constructor() {
    this.fullUrl = `${BASE}${PATH}`;
    this.client = axios2.create({
      timeout: 6e4,
      // Increased timeout for image generation
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "Accept": "application/json"
      }
    });
  }
  async generate(payload) {
    try {
      console.log("Making request to:", this.fullUrl);
      console.log("Request payload:", JSON.stringify(payload, null, 2));
      const resp = await this.client.post(this.fullUrl, payload);
      console.log("Seedream API raw response:", JSON.stringify(resp.data, null, 2));
      return { raw: resp.data };
    } catch (err) {
      console.error("Full error object:", err);
      console.error("STATUS:", err?.response?.status);
      console.error("HEADERS:", err?.response?.headers);
      console.error("BODY:", JSON.stringify(err?.response?.data, null, 2));
      console.error("Request URL:", this.fullUrl);
      console.error("Request config:", err?.config);
      const message = err?.response?.data?.message || err.message;
      const status = err?.response?.status || 500;
      const error = new Error(message);
      error.status = status;
      error.details = err?.response?.data;
      throw error;
    }
  }
};
var seeDreamClient_default = new SeedreamClient();

// routes/apis/seeDream.ts
var router16 = express2.Router();
var bodySchema = z.object({
  prompt: z.string().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  steps: z.number().int().positive().optional(),
  n: z.number().int().positive().optional()
});
router16.post("/generate", async (req, res, next) => {
  try {
    const parsed = bodySchema.parse(req.body);
    const payload = {
      model: "seedream-4-0-250828",
      // ✅ FIXED: Correct Seedream 4.0 model name
      prompt: parsed.prompt,
      size: parsed.width && parsed.height ? `${parsed.width}x${parsed.height}` : "1024x1024",
      n: parsed.n || 1,
      response_format: "url"
    };
    console.log("Sending payload to Seedream:", payload);
    const result = await seeDreamClient_default.generate(payload);
    res.json({ ok: true, result: result.raw });
  } catch (err) {
    console.error("Route error:", err);
    console.error("Error details:", err?.details);
    next(err);
  }
});
var seeDream_default = router16;

// routes/apis/huggingFace.ts
import express3 from "express";
import { z as z2 } from "zod";

// services/HhuggingFaceClient.ts
import axios3 from "axios";
var API_KEY2 = process.env.HUGGINGFACE_API_KEY;
var BASE_URL = " https://router.huggingface.co/models";
if (!API_KEY2) {
  console.warn("Warning: HUGGINGFACE_API_KEY is not set. Set it in your .env");
}
var HuggingFaceClient = class {
  client;
  // Default to SDXL as it's the most reliable free model
  model = "stabilityai/stable-diffusion-xl-base-1.0";
  constructor(model2) {
    if (model2) this.model = model2;
    this.client = axios3.create({
      timeout: 12e4,
      // 2 minutes for image generation
      headers: {
        "Authorization": `Bearer ${API_KEY2}`,
        "Content-Type": "application/json"
      }
    });
  }
  /**
   * Generate an image from a prompt
   */
  async generate(payload) {
    const url = `${BASE_URL}/${this.model}`;
    try {
      console.log(`Generating image with model: ${this.model}`);
      console.log("Prompt:", payload.inputs);
      const requestPayload = {
        ...payload,
        options: {
          wait_for_model: true,
          use_cache: false
        }
      };
      const response = await this.client.post(url, requestPayload, {
        responseType: "arraybuffer"
        // Get image as binary
      });
      const base64Image = Buffer.from(response.data, "binary").toString("base64");
      return {
        image: `data:image/png;base64,${base64Image}`
      };
    } catch (err) {
      console.error("HuggingFace API Error:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        model: this.model
      });
      if (err.response?.status === 410) {
        let errorMessage2 = "This model is no longer available on Hugging Face's free tier.";
        try {
          const errorText = Buffer.from(err.response.data).toString();
          console.error("410 Error details:", errorText);
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            errorMessage2 = errorJson.error;
          }
        } catch (parseErr) {
        }
        throw new Error(`${errorMessage2}

Recommendation: Use Pollinations (free, no API key) or switch to Stable Diffusion XL model.`);
      }
      if (err.response?.status === 404) {
        throw new Error(`Model '${this.model}' not found. It may have been removed from the free tier. Try using Stable Diffusion XL or Pollinations instead.`);
      }
      if (err.response?.status === 503) {
        try {
          const errorText = Buffer.from(err.response.data).toString();
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.includes("loading") || errorJson.error?.includes("currently loading")) {
            return {
              error: "Model is loading, please wait 20-30 seconds and try again...",
              estimated_time: errorJson.estimated_time || 20
            };
          }
        } catch (parseErr) {
          return {
            error: "Model is loading, please wait and try again...",
            estimated_time: 20
          };
        }
      }
      if (err.response?.status === 429) {
        throw new Error("Rate limit exceeded. Please wait a moment before trying again, or use Pollinations (no rate limits).");
      }
      if (err.response?.status === 401 || err.response?.status === 403) {
        throw new Error("Invalid API key. Please check your HUGGINGFACE_API_KEY in .env file.");
      }
      const errorMessage = err.message || "Image generation failed";
      throw new Error(`${errorMessage}. Consider using Pollinations instead - it's free and more reliable!`);
    }
  }
  /**
   * Change the model being used
   */
  setModel(model2) {
    this.model = model2;
    console.log(`Switched to model: ${model2}`);
  }
  /**
   * Get current model
   */
  getModel() {
    return this.model;
  }
};
var HhuggingFaceClient_default = new HuggingFaceClient();

// routes/apis/huggingFace.ts
var router17 = express3.Router();
var bodySchema2 = z2.object({
  prompt: z2.string().min(1),
  negative_prompt: z2.string().optional(),
  width: z2.number().int().positive().optional(),
  height: z2.number().int().positive().optional(),
  steps: z2.number().int().positive().optional(),
  guidance_scale: z2.number().positive().optional(),
  model: z2.string().optional()
});
router17.get("/models", (req, res) => {
  res.json({
    models: [
      {
        id: "stabilityai/stable-diffusion-xl-base-1.0",
        name: "Stable Diffusion XL (RECOMMENDED)",
        description: "Still working on free tier",
        status: "\u2705 Active"
      },
      {
        id: "runwayml/stable-diffusion-v1-5",
        name: "Stable Diffusion v1.5",
        description: "Classic model, may work",
        status: "\u26A0\uFE0F Limited"
      },
      {
        id: "CompVis/stable-diffusion-v1-4",
        name: "Stable Diffusion v1.4",
        description: "Older model, may work",
        status: "\u26A0\uFE0F Limited"
      }
    ],
    note: "Many HF models are no longer available on free tier. Consider using Pollinations (free, no API key) instead."
  });
});
router17.post("/generate", async (req, res, next) => {
  try {
    const parsed = bodySchema2.parse(req.body);
    const modelToUse = parsed.model || "stabilityai/stable-diffusion-xl-base-1.0";
    HhuggingFaceClient_default.setModel(modelToUse);
    const payload = {
      inputs: parsed.prompt,
      parameters: {
        negative_prompt: parsed.negative_prompt,
        num_inference_steps: parsed.steps || 30,
        guidance_scale: parsed.guidance_scale || 7.5,
        // Note: SDXL doesn't always respect width/height in free tier
        width: parsed.width || 1024,
        height: parsed.height || 1024
      }
    };
    console.log("Sending to Hugging Face:", payload);
    const result = await HhuggingFaceClient_default.generate(payload);
    if (result.error && result.estimated_time) {
      return res.status(202).json({
        ok: false,
        message: result.error,
        estimated_time: result.estimated_time,
        retry_after: result.estimated_time
      });
    }
    res.json({
      ok: true,
      image: result.image,
      model: HhuggingFaceClient_default.getModel()
    });
  } catch (err) {
    console.error("HuggingFace route error:", err);
    res.status(err.status || 500).json({
      ok: false,
      error: err.message || "Image generation failed",
      suggestion: "Try using Pollinations instead - it's free and requires no API key!"
    });
  }
});
var huggingFace_default = router17;

// routes/apis/imagegeneration/gemini.ts
import { GoogleGenAI } from "@google/genai";
import { GoogleGenerativeAI as GoogleGenerativeAI2 } from "@google/generative-ai";
import { Router as Router15 } from "express";
var router18 = Router15();
var genAI2 = new GoogleGenerativeAI2(process.env.GEMINI_API_KEY || "");
var textModel = genAI2.getGenerativeModel({ model: "gemini-pro" });
function getSystemPromptForModel(modelType) {
  switch (modelType) {
    case "flux-realism":
      return "You are an expert at creating photorealistic image prompts. Enhance prompts with realistic details, proper lighting (golden hour, soft natural light, etc.), camera settings (depth of field, bokeh), and natural elements.";
    case "flux-anime":
      return "You are an expert at creating anime-style image prompts. Enhance prompts with anime aesthetics, character details (expressive eyes, dynamic poses), vibrant colors, cel-shading, and manga/anime art style elements.";
    case "turbo":
      return "You are an expert at creating creative and artistic image prompts for the Nano Banana (Turbo) model. This model excels at fast, experimental, and creative outputs. Enhance prompts with imaginative details, unique artistic styles, bold colors, surreal elements, and experimental visual concepts.";
    case "imagen-3":
    case "imagen-4":
      return "You are an expert at creating prompts for Google's Imagen model. Enhance prompts with photorealistic details, natural lighting, vivid colors, and precise composition descriptions. Focus on clarity and visual accuracy.";
    case "flux":
    default:
      return "You are an expert at creating detailed image generation prompts. Enhance prompts with vivid descriptions, artistic elements, visual details, and creative direction.";
  }
}
router18.post("/improve-prompt", async (req, res) => {
  try {
    const { prompt, model: model2 } = req.body;
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Valid prompt is required"
      });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY not configured"
      });
    }
    console.log(`[Gemini] Improving prompt for model: ${model2 || "default"}`);
    const systemPrompt = getSystemPromptForModel(model2);
    const fullPrompt = `${systemPrompt}

Original prompt: "${prompt}"

Please provide an improved, detailed version of this image generation prompt. Focus on:
- Adding vivid visual details
- Specifying lighting, atmosphere, and mood
- Including artistic style elements
- Enhancing composition suggestions
- Adding color palette descriptions

Return ONLY the improved prompt without any explanations or additional text.`;
    const result = await textModel.generateContent(fullPrompt);
    const response = await result.response;
    const improvedPrompt = response.text().trim().replace(/^["']|["']$/g, "").replace(/^```|```$/g, "").trim();
    console.log(`[Gemini] Prompt improved successfully`);
    res.json({
      success: true,
      improvedPrompt,
      originalPrompt: prompt
    });
  } catch (error) {
    console.error("[Gemini] Improve prompt error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to improve prompt"
    });
  }
});
router18.post("/image-generate", async (req, res) => {
  try {
    const { prompt, width, height, model: model2 } = req.body;
    if (!prompt) {
      return res.status(400).json({ ok: false, error: "Prompt is required" });
    }
    if (!process.env.GEMINI_API_KEY_2) {
      return res.status(500).json({
        ok: false,
        error: "GEMINI_API_KEY_2 not configured"
      });
    }
    const ai3 = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY_2
    });
    let aspectRatio = "1:1";
    if (width && height) {
      const ratio = width / height;
      if (ratio > 1.5) aspectRatio = "16:9";
      else if (ratio < 0.7) aspectRatio = "9:16";
      else if (ratio > 1.1 && ratio < 1.4) aspectRatio = "4:3";
      else if (ratio > 0.7 && ratio < 0.9) aspectRatio = "3:4";
    }
    const imagenModel = model2 === "imagen-3" ? "imagen-3.0-generate-002" : "imagen-4.0-generate-001";
    console.log(`[Gemini] Generating image with ${imagenModel}, aspect ratio: ${aspectRatio}`);
    const response = await ai3.models.generateImages({
      model: imagenModel,
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio,
        outputMimeType: "image/jpeg",
        includeRaiReason: true,
        safetyFilterLevel: "BLOCK_LOW_AND_ABOVE",
        personGeneration: "ALLOW_ADULT"
      }
    });
    const generatedImage = response.generatedImages?.[0];
    if (!generatedImage || !generatedImage.image?.imageBytes) {
      throw new Error("No image generated");
    }
    const imageBase64 = `data:image/jpeg;base64,${generatedImage.image.imageBytes}`;
    console.log(`[Gemini] Image generated successfully`);
    res.json({
      ok: true,
      success: true,
      image: imageBase64,
      model: imagenModel,
      aspectRatio
    });
  } catch (error) {
    console.error("[Gemini] Image generation error:", error);
    res.status(500).json({
      ok: false,
      success: false,
      error: error.message || "Failed to generate image with Gemini"
    });
  }
});
var gemini_default2 = router18;

// routes/apis/imagegeneration/openai.ts
import OpenAI from "openai";
import { Router as Router16 } from "express";
var router19 = Router16();
router19.post("/image-generate", async (req, res) => {
  try {
    const { prompt, size = "1024x1024" } = req.body;
    if (!prompt) {
      return res.status(400).json({ ok: false, error: "Prompt is required" });
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const [w, h] = size.split("x").map(Number);
    let finalSize = "1024x1024";
    if (w > h) finalSize = "1792x1024";
    else if (h > w) finalSize = "1024x1792";
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: finalSize,
      quality: "standard"
    });
    res.json({ ok: true, image: response.data[0].url, result: response });
  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});
var openai_default = router19;

// routes/apis/videogeneration/huggingface.ts
import { Router as Router17 } from "express";
import { HfInference } from "@huggingface/inference";
import fs7 from "fs";
import path8 from "path";
import dotenv3 from "dotenv";
dotenv3.config();
var router20 = Router17();
var hf = new HfInference(process.env.HUGGINGFACE_API_KEY || "your_HUGGINGFACE_API_KEY_here");
async function generateWithRetry(prompt, model2 = "THUDM/CogVideoX-5b", maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(
        `https://huggingface.co/api/models/${model2}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ inputs: prompt })
        }
      );
      if (!response.ok) {
        if (response.status === 503 && i < maxRetries - 1) {
          console.log(`Retry ${i + 1}/${maxRetries}... Model is loading`);
          await new Promise((resolve) => setTimeout(resolve, 5e3));
          continue;
        }
        const errorText = await response.text();
        throw new Error(`API error: ${response.statusText} - ${errorText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      if (i < maxRetries - 1 && (error.message?.includes("503") || error.message?.includes("loading"))) {
        console.log(`Retry ${i + 1}/${maxRetries}...`);
        await new Promise((resolve) => setTimeout(resolve, 5e3));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}
function ensureDirectoryExists(dirPath) {
  if (!fs7.existsSync(dirPath)) {
    fs7.mkdirSync(dirPath, { recursive: true });
  }
}
router20.post("/generate", async (req, res) => {
  try {
    const { prompt, model: model2 = "THUDM/CogVideoX-5b" } = req.body;
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required"
      });
    }
    console.log("Generating video for prompt:", prompt);
    const buffer = await generateWithRetry(prompt, model2);
    const filename = `video_${Date.now()}.mp4`;
    const generatedDir = path8.join(process.cwd(), "generated_videos");
    const filepath = path8.join(generatedDir, filename);
    ensureDirectoryExists(generatedDir);
    fs7.writeFileSync(filepath, buffer);
    res.set({
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${filename}"`
    });
    res.send(buffer);
  } catch (error) {
    console.error("Video generation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate video",
      details: error.message
    });
  }
});
router20.post("/generate-direct", async (req, res) => {
  try {
    const {
      prompt,
      model: model2 = "THUDM/CogVideoX-5b",
      numFrames = 49,
      fps = 8
    } = req.body;
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required"
      });
    }
    console.log("Generating video directly for prompt:", prompt);
    const response = await fetch(
      `https://huggingface.co/api/models/${model2}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            num_frames: numFrames,
            fps
          }
        })
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.statusText} - ${errorText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = `video_${Date.now()}.mp4`;
    const generatedDir = path8.join(process.cwd(), "generated_videos");
    const filepath = path8.join(generatedDir, filename);
    ensureDirectoryExists(generatedDir);
    fs7.writeFileSync(filepath, buffer);
    res.set({
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${filename}"`
    });
    res.send(buffer);
  } catch (error) {
    console.error("Video generation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate video",
      details: error.message
    });
  }
});
router20.get("/models", (req, res) => {
  const models = [
    {
      id: "THUDM/CogVideoX-5b",
      name: "CogVideoX-5b",
      description: "Good quality 6-second videos"
    },
    {
      id: "guoyww/animatediff",
      name: "AnimateDiff",
      description: "Good for animations"
    },
    {
      id: "stabilityai/stable-video-diffusion-img2vid-xt",
      name: "Stable Video Diffusion",
      description: "Image to video conversion"
    },
    {
      id: "Lightricks/LTX-Video",
      name: "LTX-Video",
      description: "Fast generation"
    }
  ];
  res.json({ success: true, models });
});
router20.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
router20.post("/test-api", async (req, res) => {
  try {
    const response = await fetch(
      "https://router.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: "a cat" })
      }
    );
    const responseText = await response.text();
    res.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      bodyPreview: responseText.substring(0, 200),
      apiKeySet: !!process.env.HUGGINGFACE_API_KEY,
      message: response.ok ? "API key is valid! But video generation may not be available on free tier." : "API call failed - check your API key"
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      apiKeySet: !!process.env.HUGGINGFACE_API_KEY
    });
  }
});
var huggingface_default = router20;

// routes/apis/videogeneration/tavus.ts
import { Router as Router18 } from "express";
import dotenv4 from "dotenv";
dotenv4.config();
var router21 = Router18();
var TAVUS_API_KEY = process.env.TAVUS_API_KEY;
var TAVUS_API_BASE = "https://tavusapi.com/v2";
router21.post("/generate", async (req, res) => {
  try {
    const { script, replica_id, video_name, background_url } = req.body;
    if (!script) {
      return res.status(400).json({
        success: false,
        error: "Script is required"
      });
    }
    if (!TAVUS_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "Tavus API key not configured"
      });
    }
    console.log("Generating Tavus video with script:", script);
    const response = await fetch(`${TAVUS_API_BASE}/videos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": TAVUS_API_KEY
      },
      body: JSON.stringify({
        replica_id,
        // Use provided replica or default stock replica
        script,
        video_name: video_name || `Video ${Date.now()}`,
        background_url
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tavus API error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    res.json({
      success: true,
      video_id: data.video_id,
      video_name: data.video_name,
      status: data.status,
      hosted_url: data.hosted_url,
      message: "Video generation started. Use the video_id to check status."
    });
  } catch (error) {
    console.error("Tavus video generation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate video",
      details: error.message
    });
  }
});
router21.get("/status/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;
    if (!TAVUS_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "Tavus API key not configured"
      });
    }
    const response = await fetch(`${TAVUS_API_BASE}/videos/${videoId}`, {
      method: "GET",
      headers: {
        "x-api-key": TAVUS_API_KEY
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tavus API error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    res.json({
      success: true,
      video_id: data.video_id,
      status: data.status,
      hosted_url: data.hosted_url,
      download_url: data.download_url,
      created_at: data.created_at,
      ready: data.status === "ready"
    });
  } catch (error) {
    console.error("Tavus status check error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check video status",
      details: error.message
    });
  }
});
router21.get("/replicas", async (req, res) => {
  try {
    if (!TAVUS_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "Tavus API key not configured"
      });
    }
    const response = await fetch(`${TAVUS_API_BASE}/replicas`, {
      method: "GET",
      headers: {
        "x-api-key": TAVUS_API_KEY
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tavus API error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    res.json({
      success: true,
      replicas: data
    });
  } catch (error) {
    console.error("Tavus replicas list error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to list replicas",
      details: error.message
    });
  }
});
router21.get("/download/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;
    if (!TAVUS_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "Tavus API key not configured"
      });
    }
    const statusResponse = await fetch(`${TAVUS_API_BASE}/videos/${videoId}`, {
      method: "GET",
      headers: {
        "x-api-key": TAVUS_API_KEY
      }
    });
    if (!statusResponse.ok) {
      throw new Error(`Failed to get video status: ${statusResponse.statusText}`);
    }
    const videoData = await statusResponse.json();
    if (videoData.status !== "ready") {
      return res.status(400).json({
        success: false,
        error: "Video is not ready yet",
        status: videoData.status
      });
    }
    const downloadUrl = videoData.download_url || videoData.hosted_url;
    const videoResponse = await fetch(downloadUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    res.set({
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="tavus_${videoId}.mp4"`
    });
    res.send(videoBuffer);
  } catch (error) {
    console.error("Tavus video download error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to download video",
      details: error.message
    });
  }
});
router21.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "Tavus Video Generation",
    api_key_configured: !!TAVUS_API_KEY,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
var tavus_default = router21;

// routes/tools/veo.ts
import express4 from "express";
import { GoogleGenAI as GoogleGenAI2 } from "@google/genai";
import { v2 as cloudinary2 } from "cloudinary";
import fs8 from "fs";
import path9 from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
var router22 = express4.Router();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path9.dirname(__filename);
var ai = new GoogleGenAI2({ apiKey: process.env.GEMINI_API_KEY });
var SUPPORTED_MODELS = /* @__PURE__ */ new Set([
  "veo-3.1-generate-preview",
  "veo-3.1-fast-generate-preview"
]);
var generationsStore = /* @__PURE__ */ new Map();
setInterval(() => {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1e3;
  for (const [id, gen] of generationsStore.entries()) {
    if (gen.createdAt.getTime() < oneDayAgo) {
      generationsStore.delete(id);
      console.log(`\u{1F9F9} Cleaned up old generation: ${id}`);
    }
  }
}, 60 * 60 * 1e3);
var outputsDir = path9.join(__dirname, "../outputs");
if (!fs8.existsSync(outputsDir)) {
  fs8.mkdirSync(outputsDir, { recursive: true });
}
router22.post("/generate", async (req, res) => {
  console.log("\n\u{1F3AC} ===== VEO3 Video Generation =====");
  const startTime = Date.now();
  try {
    const { prompt, model: model2, duration, aspectRatio } = req.body;
    if (!prompt || prompt.trim().length === 0) {
      console.error("\u274C No prompt provided");
      res.status(400).json({ success: false, error: "Prompt is required" });
      return;
    }
    console.log("\u{1F4DD} Request parameters:");
    console.log("   Prompt:", prompt.trim());
    console.log("   Model:", model2 || "default");
    console.log("   Duration (raw):", duration, typeof duration);
    console.log("   Aspect Ratio:", aspectRatio || "default");
    if (!process.env.GEMINI_API_KEY) {
      console.error("\u274C Google AI Studio API key not configured");
      res.status(500).json({
        success: false,
        error: "Service configuration error",
        details: "Google AI Studio not configured"
      });
      return;
    }
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("\u274C Cloudinary not configured");
      res.status(500).json({
        success: false,
        error: "Service configuration error",
        details: "Cloudinary not configured"
      });
      return;
    }
    console.log("\u2705 Configuration validated");
    const requestedModel = typeof model2 === "string" ? model2 : "";
    const modelId = SUPPORTED_MODELS.has(requestedModel) ? requestedModel : "veo-3.1-generate-preview";
    const parsedDuration = parseInt(String(duration), 10);
    const durationSeconds = Number.isNaN(parsedDuration) ? 8 : Math.min(Math.max(parsedDuration, 4), 8) | 0;
    const ratio = aspectRatio || "16:9";
    const generationId = randomUUID();
    console.log("\n\u{1F4CB} Final parameters:");
    console.log("   Generation ID:", generationId);
    console.log("   Model:", modelId);
    console.log("   Duration:", durationSeconds, typeof durationSeconds);
    console.log("   Aspect Ratio:", ratio);
    generationsStore.set(generationId, {
      id: generationId,
      status: "pending",
      prompt: prompt.trim(),
      model: modelId,
      duration: durationSeconds,
      aspectRatio: ratio,
      createdAt: /* @__PURE__ */ new Date()
    });
    console.log("\u2705 Generation record created");
    const initTime = ((Date.now() - startTime) / 1e3).toFixed(2);
    console.log(`
\u2705 ===== Request Accepted (${initTime}s) =====
`);
    res.status(202).json({
      success: true,
      generation: {
        id: generationId,
        status: "pending",
        message: "Video generation started"
      }
    });
    processVideoGeneration(generationId, prompt.trim(), modelId, durationSeconds, ratio).catch(
      (error) => {
        console.error(`
\u274C Async processing error for ${generationId}:`, error.message);
      }
    );
  } catch (error) {
    console.error("\n\u274C ===== ERROR =====");
    console.error("Type:", error.constructor ? error.constructor.name : "Unknown");
    console.error("Message:", error.message);
    console.error("===================\n");
    res.status(500).json({
      success: false,
      error: "Failed to start video generation",
      details: error.message
    });
  }
});
async function processVideoGeneration(generationId, prompt, model2, duration, aspectRatio) {
  const startTime = Date.now();
  console.log(`
\u{1F3A5} ===== Processing Generation: ${generationId} =====`);
  console.log("   Model:", model2);
  console.log("   Duration:", duration, typeof duration);
  console.log("   Aspect:", aspectRatio);
  console.log("   Prompt:", prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""));
  try {
    const generation = generationsStore.get(generationId);
    if (generation) {
      generation.status = "processing";
      console.log("\u{1F4CA} Status: pending \u2192 processing");
    }
    const config2 = {};
    if (aspectRatio && ["16:9", "9:16", "1:1"].includes(aspectRatio)) {
      config2.aspectRatio = aspectRatio;
    }
    console.log("\n\u{1F4E4} Step 1: Calling Google Gemini VEO API...");
    console.log("   Config being sent:", JSON.stringify(config2));
    let operation = await ai.models.generateVideos({
      model: model2,
      prompt,
      config: Object.keys(config2).length > 0 ? config2 : void 0
    });
    console.log("\u2705 Operation started");
    console.log("   Operation ID:", operation.name);
    console.log("\n\u23F3 Step 2: Waiting for video generation...");
    let attempts = 0;
    const maxAttempts = 60;
    while (!operation.done && attempts < maxAttempts) {
      attempts++;
      const elapsed = ((Date.now() - startTime) / 1e3).toFixed(0);
      console.log(`   Polling... (${attempts}/${maxAttempts}) - Elapsed: ${elapsed}s`);
      await new Promise((resolve) => setTimeout(resolve, 1e4));
      operation = await ai.operations.getVideosOperation({ operation });
    }
    if (!operation.done) {
      throw new Error("Video generation timeout");
    }
    if (!operation.response?.generatedVideos?.[0]) {
      throw new Error("No video generated");
    }
    const genTime = ((Date.now() - startTime) / 1e3).toFixed(2);
    console.log(`\u2705 Video generated (${genTime}s)`);
    const generatedVideo = operation.response.generatedVideos[0];
    console.log("\n\u{1F4BE} Step 3: Downloading video...");
    const tempVideoPath = path9.join(outputsDir, `${generationId}_temp.mp4`);
    await ai.files.download({
      file: generatedVideo.video,
      downloadPath: tempVideoPath
    });
    const fileSize = fs8.statSync(tempVideoPath).size;
    console.log("\u2705 Video downloaded");
    console.log("   Path:", tempVideoPath);
    console.log("   Size:", (fileSize / 1024 / 1024).toFixed(2), "MB");
    console.log("\n\u2601\uFE0F  Step 4: Uploading to Cloudinary...");
    const cloudinaryResult = await cloudinary2.uploader.upload(tempVideoPath, {
      resource_type: "video",
      folder: "veo3_generations",
      public_id: generationId
    });
    console.log("\u2705 Uploaded to Cloudinary");
    console.log("   URL:", cloudinaryResult.secure_url);
    console.log("   Public ID:", cloudinaryResult.public_id);
    console.log("   Format:", cloudinaryResult.format);
    console.log("   Size:", (cloudinaryResult.bytes / 1024 / 1024).toFixed(2), "MB");
    console.log("\n\u{1F5BC}\uFE0F  Step 5: Generating thumbnail...");
    const thumbnailUrl = cloudinary2.url(`veo3_generations/${generationId}`, {
      resource_type: "video",
      format: "jpg",
      transformation: [{ width: 640, height: 360, crop: "fill", start_offset: "1" }]
    });
    console.log("\u2705 Thumbnail generated");
    console.log("   URL:", thumbnailUrl);
    console.log("\n\u{1F9F9} Step 6: Cleaning up...");
    if (fs8.existsSync(tempVideoPath)) {
      fs8.unlinkSync(tempVideoPath);
      console.log("\u2705 Temp file deleted");
    }
    const finalGeneration = generationsStore.get(generationId);
    if (finalGeneration) {
      finalGeneration.status = "completed";
      finalGeneration.videoUrl = cloudinaryResult.secure_url;
      finalGeneration.thumbnailUrl = thumbnailUrl;
      finalGeneration.completedAt = /* @__PURE__ */ new Date();
    }
    const totalTime = ((Date.now() - startTime) / 1e3).toFixed(2);
    console.log("\n\u2705 ===== Generation Complete =====");
    console.log(`   Total time: ${totalTime}s`);
    console.log(`   Video URL: ${cloudinaryResult.secure_url}`);
    console.log("===================================\n");
  } catch (error) {
    console.error("\n\u274C ===== GENERATION ERROR =====");
    console.error("Generation ID:", generationId);
    console.error("Type:", error.constructor ? error.constructor.name : "Unknown");
    console.error("Message:", error.message);
    if (error.stack) {
      console.error("Stack:", error.stack);
    }
    console.error("================================\n");
    const generation = generationsStore.get(generationId);
    if (generation) {
      generation.status = "failed";
      generation.errorMessage = error.message || "Unknown error";
    }
    const tempVideoPath = path9.join(outputsDir, `${generationId}_temp.mp4`);
    if (fs8.existsSync(tempVideoPath)) {
      fs8.unlinkSync(tempVideoPath);
      console.log("\u{1F9F9} Temp file cleaned up");
    }
  }
}
router22.get("/status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`\u{1F4CA} Status check for: ${id}`);
    const generation = generationsStore.get(id);
    if (!generation) {
      console.log(`\u274C Generation not found: ${id}`);
      res.status(404).json({
        success: false,
        error: "Generation not found"
      });
      return;
    }
    console.log(`\u2705 Status: ${generation.status}`);
    res.json({
      success: true,
      generation: {
        id: generation.id,
        status: generation.status,
        prompt: generation.prompt,
        model: generation.model,
        duration: generation.duration,
        aspectRatio: generation.aspectRatio,
        videoUrl: generation.videoUrl,
        thumbnailUrl: generation.thumbnailUrl,
        errorMessage: generation.errorMessage,
        createdAt: generation.createdAt,
        completedAt: generation.completedAt
      }
    });
  } catch (error) {
    console.error("\u274C Status check error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch generation status",
      details: error.message
    });
  }
});
router22.post("/test", async (req, res) => {
  console.log("\n\u{1F9EA} ===== VEO3 Test =====");
  const startTime = Date.now();
  try {
    const { prompt } = req.body;
    if (!prompt || prompt.trim().length === 0) {
      console.error("\u274C No prompt provided");
      res.status(400).json({ success: false, error: "Prompt is required" });
      return;
    }
    console.log("\u{1F4DD} Test prompt:", prompt);
    if (!process.env.GOOGLE_AI_STUDIO) {
      console.error("\u274C Google AI Studio API key not configured");
      res.status(500).json({
        success: false,
        error: "Service configuration error",
        details: "Google AI Studio not configured"
      });
      return;
    }
    console.log("\u2705 Configuration validated");
    console.log("\n\u{1F4E4} Calling VEO API (no config)...");
    let operation = await ai.models.generateVideos({
      model: "veo-3.1-generate-preview",
      prompt
    });
    console.log("\u2705 Operation started");
    console.log("   Operation ID:", operation.name);
    console.log("\n\u23F3 Waiting for completion...");
    let attempts = 0;
    const maxAttempts = 60;
    while (!operation.done && attempts < maxAttempts) {
      attempts++;
      const elapsed = ((Date.now() - startTime) / 1e3).toFixed(0);
      console.log(`   Polling... (${attempts}/${maxAttempts}) - Elapsed: ${elapsed}s`);
      await new Promise((resolve) => setTimeout(resolve, 1e4));
      operation = await ai.operations.getVideosOperation({ operation });
    }
    if (!operation.done) {
      throw new Error("Timeout - video generation took too long");
    }
    if (!operation.response?.generatedVideos?.[0]) {
      throw new Error("No video generated in response");
    }
    const testTime = ((Date.now() - startTime) / 1e3).toFixed(2);
    console.log("\n\u2705 ===== Test Complete =====");
    console.log(`   Total time: ${testTime}s`);
    console.log("============================\n");
    res.json({
      success: true,
      message: "Test video generated successfully!",
      operationName: operation.name,
      videoGenerated: true,
      processingTime: parseFloat(testTime)
    });
  } catch (error) {
    console.error("\n\u274C ===== TEST ERROR =====");
    console.error("Type:", error.constructor ? error.constructor.name : "Unknown");
    console.error("Message:", error.message);
    console.error("=========================\n");
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate test video",
      details: error.message
    });
  }
});
router22.get("/health", (req, res) => {
  const status = {
    status: "ok",
    service: "veo3-video-generation",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    config: {
      googleAI: !!process.env.GOOGLE_AI_STUDIO,
      cloudinary: {
        cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
        api_key: !!process.env.CLOUDINARY_API_KEY,
        api_secret: !!process.env.CLOUDINARY_API_SECRET
      }
    },
    stats: {
      activeGenerations: generationsStore.size,
      pendingGenerations: Array.from(generationsStore.values()).filter(
        (g) => g.status === "pending"
      ).length,
      processingGenerations: Array.from(generationsStore.values()).filter(
        (g) => g.status === "processing"
      ).length,
      completedGenerations: Array.from(generationsStore.values()).filter(
        (g) => g.status === "completed"
      ).length,
      failedGenerations: Array.from(generationsStore.values()).filter(
        (g) => g.status === "failed"
      ).length
    }
  };
  console.log("\u{1F3E5} Health check:", status);
  res.json(status);
});
var veo_default = router22;

// routes/tools/yt_2.ts
import { Router as Router19 } from "express";
import { exec } from "child_process";
import { promisify } from "util";
import fs9 from "fs";
import path10 from "path";
import os3 from "os";
var execPromise = promisify(exec);
var router23 = Router19();
var activeDownloads = /* @__PURE__ */ new Map();
async function runYtDlp(args) {
  const quotedArgs = args.map((arg) => {
    if (arg.includes(" ") || arg.includes("\\") || arg.includes("&") || arg.includes("?")) {
      return `"${arg}"`;
    }
    return arg;
  });
  const command = process.platform === "win32" ? `python -m yt_dlp ${quotedArgs.join(" ")}` : `yt-dlp ${quotedArgs.join(" ")}`;
  const { stdout } = await execPromise(command);
  return stdout;
}
async function getVideoInfo(videoId) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const output = await runYtDlp([
    "--dump-json",
    "--no-warnings",
    "--skip-download",
    url
  ]);
  return JSON.parse(output);
}
async function uploadToSupabase(filePath, filename, contentType) {
  const fileBuffer = fs9.readFileSync(filePath);
  const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).upload(`downloads/${filename}`, fileBuffer, {
    contentType,
    upsert: false
  });
  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }
  const { data: urlData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(`downloads/${filename}`);
  return urlData.publicUrl;
}
function cleanupTempFile(filePath) {
  try {
    if (fs9.existsSync(filePath)) {
      fs9.unlinkSync(filePath);
    }
  } catch (err) {
    console.error("Cleanup error:", err);
  }
}
router23.get("/info", async (req, res) => {
  try {
    const { videoId } = req.query;
    if (!videoId || typeof videoId !== "string") {
      return res.status(400).json({ error: "Video ID is required" });
    }
    console.log(`\u{1F4F9} Fetching info: ${videoId}`);
    const info = await getVideoInfo(videoId);
    const title = info?.title || "Unknown Title";
    const duration = parseInt(info?.duration) || 0;
    const thumbnail = info?.thumbnail || "";
    const author = info?.uploader || "Unknown";
    const viewCount = parseInt(info?.view_count) || 0;
    console.log(`\u2705 Info fetched: ${title}`);
    res.json({
      title,
      duration,
      thumbnail,
      author,
      viewCount
    });
  } catch (error) {
    console.error("\u274C Error:", error.message);
    res.status(500).json({
      error: "Failed to fetch video info",
      details: error.message
    });
  }
});
router23.get("/download-progress/:downloadId", (req, res) => {
  const { downloadId } = req.params;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  const interval = setInterval(() => {
    const download = activeDownloads.get(downloadId);
    if (download) {
      res.write(`data: ${JSON.stringify(download)}

`);
      if (download.progress >= 100 || download.status === "error") {
        clearInterval(interval);
        res.end();
      }
    }
  }, 500);
  req.on("close", () => clearInterval(interval));
});
function extractVideoId(input) {
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return null;
}
router23.post("/download", async (req, res) => {
  const downloadId = Date.now().toString();
  let tempFilePath = "";
  try {
    const { videoId, quality = "720p", format = "mp4" } = req.body;
    if (!videoId) {
      return res.status(400).json({ error: "Video ID is required" });
    }
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const timestamp2 = Date.now();
    const tempDir = os3.tmpdir();
    console.log(`
\u{1F4E5} Download: ${videoId} (${format} ${quality})`);
    activeDownloads.set(downloadId, {
      progress: 0,
      status: "Starting download...",
      startTime: Date.now()
    });
    const info = await getVideoInfo(videoId);
    const sanitizedTitle = (info.title || "video").replace(/[^a-z0-9]/gi, "_").substring(0, 50);
    if (format === "mp3") {
      const filename = `${sanitizedTitle}_${timestamp2}.mp3`;
      tempFilePath = path10.join(tempDir, filename);
      activeDownloads.set(downloadId, {
        progress: 10,
        status: "Downloading audio...",
        startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
      });
      await runYtDlp([
        "-x",
        "--audio-format",
        "mp3",
        "--audio-quality",
        "0",
        "-o",
        tempFilePath,
        "--no-warnings",
        url
      ]);
      activeDownloads.set(downloadId, {
        progress: 70,
        status: "Uploading to cloud...",
        startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
      });
      const publicUrl = await uploadToSupabase(
        tempFilePath,
        filename,
        "audio/mpeg"
      );
      const fileSize = fs9.statSync(tempFilePath).size;
      cleanupTempFile(tempFilePath);
      console.log(`\u2705 Complete: ${(fileSize / 1024 / 1024).toFixed(2)} MB
`);
      activeDownloads.set(downloadId, {
        progress: 100,
        status: "Complete!",
        startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
      });
      return res.json({
        downloadId,
        url: publicUrl,
        filename,
        format: "mp3",
        fileSize
      });
    } else {
      const ext = format === "webm" ? "webm" : "mp4";
      const filename = `${sanitizedTitle}_${timestamp2}.${ext}`;
      tempFilePath = path10.join(tempDir, filename);
      let formatString = "best";
      if (quality === "720p") formatString = "bestvideo[height<=720]+bestaudio/best[height<=720]";
      if (quality === "1080p") formatString = "bestvideo[height<=1080]+bestaudio/best[height<=1080]";
      if (quality === "4K") formatString = "bestvideo[height<=2160]+bestaudio/best[height<=2160]";
      activeDownloads.set(downloadId, {
        progress: 10,
        status: "Downloading video...",
        startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
      });
      await runYtDlp([
        "-f",
        formatString,
        "--merge-output-format",
        ext,
        "-o",
        tempFilePath,
        "--no-warnings",
        url
      ]);
      activeDownloads.set(downloadId, {
        progress: 70,
        status: "Uploading to cloud...",
        startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
      });
      const publicUrl = await uploadToSupabase(
        tempFilePath,
        filename,
        `video/${ext}`
      );
      const fileSize = fs9.statSync(tempFilePath).size;
      cleanupTempFile(tempFilePath);
      console.log(`\u2705 Complete: ${(fileSize / 1024 / 1024).toFixed(2)} MB
`);
      activeDownloads.set(downloadId, {
        progress: 100,
        status: "Complete!",
        startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
      });
      return res.json({
        downloadId,
        url: publicUrl,
        filename,
        format: ext,
        fileSize
      });
    }
  } catch (error) {
    console.error(`\u274C Failed: ${error.message}
`);
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
    activeDownloads.set(downloadId, {
      progress: 0,
      status: "error",
      error: error.message
    });
    res.status(500).json({
      error: "Download failed",
      details: error.message
    });
  }
});
router23.get("/test-ytdlp", async (req, res) => {
  try {
    const version = await runYtDlp(["--version"]);
    res.json({ installed: true, version: version.trim() });
  } catch (error) {
    res.status(500).json({ installed: false, error: error.message });
  }
});
router23.get("/list-downloads", async (req, res) => {
  try {
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).list("downloads", {
      limit: 100,
      offset: 0,
      sortBy: { column: "created_at", order: "desc" }
    });
    if (error) throw error;
    const fileDetails = data.map((file) => ({
      name: file.name,
      size: `${(file.metadata.size / 1024 / 1024).toFixed(2)} MB`,
      created: file.created_at,
      url: supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(`downloads/${file.name}`).data.publicUrl
    }));
    res.json({ files: fileDetails, bucket: SUPABASE_BUCKET });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router23.delete("/delete/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const { error } = await supabase.storage.from(SUPABASE_BUCKET).remove([`downloads/${filename}`]);
    if (error) throw error;
    res.json({ success: true, message: "File deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router23.post("/download-url", async (req, res) => {
  const downloadId = Date.now().toString();
  let tempFilePath = "";
  try {
    const { url, quality = "720p", format = "mp4" } = req.body;
    if (!url) {
      return res.status(400).json({ error: "YouTube URL is required" });
    }
    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const timestamp2 = Date.now();
    const tempDir = os3.tmpdir();
    console.log(`
\u{1F4E5} Download from URL: ${url}`);
    console.log(`   Video ID: ${videoId}`);
    activeDownloads.set(downloadId, {
      progress: 0,
      status: "Starting download...",
      startTime: Date.now()
    });
    const info = await getVideoInfo(videoId);
    const sanitizedTitle = (info.title || "video").replace(/[^a-z0-9]/gi, "_").substring(0, 50);
    if (format === "mp3") {
      const filename = `${sanitizedTitle}_${timestamp2}.mp3`;
      tempFilePath = path10.join(tempDir, filename);
      activeDownloads.set(downloadId, {
        progress: 10,
        status: "Downloading audio...",
        startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
      });
      await runYtDlp([
        "-x",
        "--audio-format",
        "mp3",
        "--audio-quality",
        "0",
        "-o",
        tempFilePath,
        "--no-warnings",
        youtubeUrl
      ]);
      activeDownloads.set(downloadId, {
        progress: 70,
        status: "Uploading to cloud...",
        startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
      });
      const publicUrl = await uploadToSupabase(
        tempFilePath,
        filename,
        "audio/mpeg"
      );
      const fileSize = fs9.statSync(tempFilePath).size;
      cleanupTempFile(tempFilePath);
      console.log(`\u2705 Complete: ${(fileSize / 1024 / 1024).toFixed(2)} MB
`);
      activeDownloads.set(downloadId, {
        progress: 100,
        status: "Complete!",
        startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
      });
      return res.json({
        downloadId,
        url: publicUrl,
        filename,
        format: "mp3",
        fileSize,
        videoId,
        title: info.title
      });
    } else {
      const ext = format === "webm" ? "webm" : "mp4";
      const filename = `${sanitizedTitle}_${timestamp2}.${ext}`;
      tempFilePath = path10.join(tempDir, filename);
      let formatString = "best";
      if (quality === "720p") formatString = "bestvideo[height<=720]+bestaudio/best[height<=720]";
      if (quality === "1080p") formatString = "bestvideo[height<=1080]+bestaudio/best[height<=1080]";
      if (quality === "4K") formatString = "bestvideo[height<=2160]+bestaudio/best[height<=2160]";
      activeDownloads.set(downloadId, {
        progress: 10,
        status: "Downloading video...",
        startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
      });
      await runYtDlp([
        "-f",
        formatString,
        "--merge-output-format",
        ext,
        "-o",
        tempFilePath,
        "--no-warnings",
        youtubeUrl
      ]);
      activeDownloads.set(downloadId, {
        progress: 70,
        status: "Uploading to cloud...",
        startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
      });
      const publicUrl = await uploadToSupabase(
        tempFilePath,
        filename,
        `video/${ext}`
      );
      const fileSize = fs9.statSync(tempFilePath).size;
      cleanupTempFile(tempFilePath);
      console.log(`\u2705 Complete: ${(fileSize / 1024 / 1024).toFixed(2)} MB
`);
      activeDownloads.set(downloadId, {
        progress: 100,
        status: "Complete!",
        startTime: activeDownloads.get(downloadId)?.startTime || Date.now()
      });
      return res.json({
        downloadId,
        url: publicUrl,
        filename,
        format: ext,
        fileSize,
        videoId,
        title: info.title
      });
    }
  } catch (error) {
    console.error(`\u274C Failed: ${error.message}
`);
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
    activeDownloads.set(downloadId, {
      progress: 0,
      status: "error",
      error: error.message
    });
    res.status(500).json({
      error: "Download failed",
      details: error.message
    });
  }
});
var yt_2_default = router23;

// routes/tools/audio.ts
import { Router as Router20 } from "express";
import multer3 from "multer";

// utils/auphonicEnhancer.ts
import axios4 from "axios";
import FormData2 from "form-data";
import fs10 from "fs";
import path11 from "path";
import https from "https";
var AuphonicEnhancer = class {
  apiToken;
  constructor() {
    this.apiToken = process.env.AUPHONIC_API_TOKEN || "";
    if (!this.apiToken) {
      throw new Error("AUPHONIC_API_TOKEN must be set in .env");
    }
    console.log("\u2705 Auphonic API token loaded");
  }
  getHeaders() {
    return {
      "Authorization": `Bearer ${this.apiToken}`
    };
  }
  async enhanceAudio(audioBuffer, options) {
    console.log("\n\u{1F3B5} === Auphonic Enhancement Started ===");
    console.log("\u{1F4CA} Options:", options);
    try {
      console.log("\u{1F4CB} Step 1: Creating production...");
      const production = await this.createProduction(options);
      console.log(`\u2705 Production created: ${production.uuid}`);
      console.log("\u{1F4E4} Step 2: Uploading audio...");
      await this.uploadAudio(production.uuid, audioBuffer);
      console.log("\u2705 Upload complete");
      console.log("\u2699\uFE0F  Step 3: Starting enhancement...");
      await this.startProduction(production.uuid);
      console.log("\u2705 Enhancement started");
      console.log("\u23F3 Step 4: Waiting for completion...");
      const result = await this.waitForCompletion(production.uuid);
      console.log("\u2705 Enhancement complete!");
      console.log("\u{1F4E5} Step 5: Downloading enhanced audio...");
      if (!result.output_files || result.output_files.length === 0) {
        throw new Error("No output files found in production result");
      }
      const outputFile = result.output_files[0];
      console.log("\u{1F4C4} Output file:", outputFile.filename);
      console.log("\u{1F517} Download URL:", outputFile.download_url);
      const enhancedAudio = await this.downloadAudioWithAuth(production.uuid, outputFile.filename);
      console.log(`\u2705 Downloaded ${(enhancedAudio.length / 1024 / 1024).toFixed(2)} MB`);
      const filename = `enhanced-${Date.now()}.mp3`;
      const outputPath = path11.join(process.cwd(), "downloads", filename);
      const downloadsDir = path11.join(process.cwd(), "downloads");
      if (!fs10.existsSync(downloadsDir)) {
        fs10.mkdirSync(downloadsDir, { recursive: true });
      }
      fs10.writeFileSync(outputPath, enhancedAudio);
      console.log("\u{1F4BE} Saved to:", outputPath);
      const localUrl = `http://localhost:3000/downloads/${filename}`;
      console.log("\u{1F389} Success! URL:", localUrl);
      console.log("=== Enhancement Complete ===\n");
      return {
        audioUrl: localUrl,
        productionUuid: production.uuid,
        statistics: result.statistics
      };
    } catch (error) {
      console.error("\u274C Auphonic enhancement failed:", error.message);
      if (error.response?.data) {
        console.error("\u{1F4CB} API Error Details:", error.response.data);
      }
      throw error;
    }
  }
  async createProduction(options) {
    const response = await axios4.post(
      "https://auphonic.com/api/productions.json",
      {
        metadata: {
          title: `Enhanced Audio ${Date.now()}`
        },
        algorithms: {
          denoise: options.denoiseLevel > 0,
          normloudness: options.enhanceClarity,
          filtering: options.removeEcho,
          hipfilter: true,
          leveler: true
        },
        output_files: [
          {
            format: "mp3",
            bitrate: 192,
            mono_mixdown: false
          }
        ]
      },
      {
        headers: this.getHeaders()
      }
    );
    return response.data.data;
  }
  async uploadAudio(uuid2, audioBuffer) {
    const formData = new FormData2();
    formData.append("input_file", audioBuffer, {
      filename: "audio.mp3",
      contentType: "audio/mpeg"
    });
    await axios4.post(
      `https://auphonic.com/api/production/${uuid2}/upload.json`,
      formData,
      {
        headers: {
          ...this.getHeaders(),
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
  }
  async startProduction(uuid2) {
    await axios4.post(
      `https://auphonic.com/api/production/${uuid2}/start.json`,
      {},
      {
        headers: this.getHeaders()
      }
    );
  }
  async waitForCompletion(uuid2, maxAttempts = 60) {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await axios4.get(
        `https://auphonic.com/api/production/${uuid2}.json`,
        {
          headers: this.getHeaders()
        }
      );
      const status = response.data.data.status_string;
      const progress = response.data.data.status || 0;
      console.log(`   \u{1F4CA} Status: ${status} ${progress > 0 ? `(${progress}%)` : ""}`);
      if (status === "Done") {
        return response.data.data;
      }
      if (status === "Error") {
        const errorMsg = response.data.data.error_message || "Unknown error";
        throw new Error(`Production failed: ${errorMsg}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 5e3));
    }
    throw new Error("Production timeout - took longer than 5 minutes");
  }
  // FIXED: Download with authentication using axios
  async downloadAudioWithAuth(uuid2, filename) {
    try {
      const url = `https://auphonic.com/api/production/${uuid2}/output_files/${filename}`;
      console.log("\u{1F517} Downloading from:", url);
      const response = await axios4.get(url, {
        headers: this.getHeaders(),
        responseType: "arraybuffer",
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      return Buffer.from(response.data);
    } catch (error) {
      console.error("\u274C Download failed with API endpoint, trying direct download...");
      try {
        const prodResponse = await axios4.get(
          `https://auphonic.com/api/production/${uuid2}.json`,
          {
            headers: this.getHeaders()
          }
        );
        const outputFile = prodResponse.data.data.output_files[0];
        const downloadUrl = outputFile.download_url;
        console.log("\u{1F517} Trying direct download:", downloadUrl);
        const response = await axios4.get(downloadUrl, {
          headers: this.getHeaders(),
          responseType: "arraybuffer",
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        });
        return Buffer.from(response.data);
      } catch (innerError) {
        console.error("\u274C Both download methods failed");
        throw new Error(`Failed to download audio: ${innerError.message}`);
      }
    }
  }
  // Keep the old method as backup (but it won't work without auth)
  async downloadAudio(url) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      https.get(url, {
        headers: this.getHeaders()
      }, (response) => {
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
        response.on("error", reject);
      }).on("error", reject);
    });
  }
};

// controllers/tools/audioController.ts
var auphonicEnhancer = new AuphonicEnhancer();
async function enhanceAudioController(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No audio file provided"
      });
    }
    console.log("\u{1F4E5} Received enhancement request:", {
      filename: req.file.originalname,
      size: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
      mimetype: req.file.mimetype
    });
    const denoiseLevel = parseInt(req.body.denoiseLevel) || 7;
    const enhanceClarity = req.body.enhanceClarity === "true";
    const removeEcho = req.body.removeEcho === "true";
    console.log("\u2699\uFE0F  Enhancement settings:", {
      denoiseLevel,
      enhanceClarity,
      removeEcho
    });
    const result = await auphonicEnhancer.enhanceAudio(req.file.buffer, {
      denoiseLevel,
      enhanceClarity,
      removeEcho
    });
    console.log("\u2705 Enhancement completed successfully");
    res.json({
      success: true,
      audioUrl: result.audioUrl,
      productionUuid: result.productionUuid,
      statistics: result.statistics
    });
  } catch (error) {
    console.error("\u274C Enhancement failed:", error);
    res.status(500).json({
      success: false,
      error: "Enhancement failed",
      details: error.message
    });
  }
}

// routes/tools/audio.ts
var router24 = Router20();
var upload3 = multer3({
  storage: multer3.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024
    // 100MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/wave",
      "audio/x-wav",
      "audio/mp4",
      "audio/m4a",
      "audio/x-m4a",
      "audio/ogg",
      "audio/webm",
      "audio/flac",
      "audio/aac"
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only audio files are allowed.`));
    }
  }
});
router24.post("/enhance-speech", upload3.single("audio"), enhanceAudioController);
var audio_default = router24;

// routes/tools/enhanceSpeech.ts
import express5 from "express";
import multer4 from "multer";
import fs11 from "fs";
import path12 from "path";
import { spawn as spawn2 } from "child_process";
var router25 = express5.Router();
var upload4 = multer4({ dest: "uploads/temp/" });
if (!fs11.existsSync("uploads/temp")) {
  fs11.mkdirSync("uploads/temp", { recursive: true });
}
router25.post(
  "/enhance-speech",
  upload4.single("audio"),
  async (req, res) => {
    console.log("\n\u{1F399}\uFE0F  ===== Speech Enhancement (Python/noisereduce) =====");
    const startTime = Date.now();
    try {
      if (!req.file) {
        console.error("\u274C No audio file provided");
        res.status(400).json({ error: "No audio file provided" });
        return;
      }
      console.log("\u{1F4C1} Audio received:");
      console.log("   File:", req.file.originalname);
      console.log("   Size:", (req.file.size / 1024 / 1024).toFixed(2), "MB");
      console.log("   Type:", req.file.mimetype);
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error("\u274C Cloudinary not configured");
        res.status(500).json({
          error: "Service configuration error",
          details: "Cloudinary not configured"
        });
        return;
      }
      console.log("\u2705 Configuration validated");
      console.log("\n\u{1F4E4} Step 1: Enhancing audio with Python...");
      const enhancedFileName = `enhanced-${Date.now()}.wav`;
      const enhancedFilePath = path12.join("uploads/temp", enhancedFileName);
      const pythonCommand = process.platform === "win32" ? "python" : "python3";
      const pythonProcess = spawn2(pythonCommand, [
        path12.join("scripts", "enhance_audio.py"),
        req.file.path,
        enhancedFilePath
      ]);
      let pythonOutput = "";
      let pythonError = "";
      pythonProcess.stdout.on("data", (data) => {
        const output = data.toString();
        pythonOutput += output;
        console.log("   Python:", output.trim());
      });
      pythonProcess.stderr.on("data", (data) => {
        const error = data.toString();
        pythonError += error;
        console.error("   Python Error:", error.trim());
      });
      await new Promise((resolve, reject) => {
        pythonProcess.on("close", (code) => {
          if (code !== 0) {
            reject(new Error(`Python process exited with code ${code}: ${pythonError}`));
          } else {
            resolve();
          }
        });
      });
      console.log("\u2705 Audio enhanced");
      if (!fs11.existsSync(enhancedFilePath)) {
        throw new Error("Enhanced file was not created");
      }
      const enhancedFileSize = fs11.statSync(enhancedFilePath).size;
      console.log("   Enhanced size:", (enhancedFileSize / 1024 / 1024).toFixed(2), "MB");
      console.log("\n\u2601\uFE0F  Step 2: Uploading to Cloudinary...");
      const cloudinaryUpload = await cloudinaryClient_default.uploader.upload(enhancedFilePath, {
        folder: "enhanced-speech",
        resource_type: "video",
        public_id: `speech-${Date.now()}`,
        overwrite: true
      });
      console.log("\u2705 Uploaded to Cloudinary");
      console.log("   URL:", cloudinaryUpload.secure_url);
      console.log("   Public ID:", cloudinaryUpload.public_id);
      console.log("\n\u{1F9F9} Step 3: Cleaning up...");
      fs11.unlinkSync(req.file.path);
      fs11.unlinkSync(enhancedFilePath);
      console.log("\u2705 Temp files deleted");
      const processingTime = ((Date.now() - startTime) / 1e3).toFixed(2);
      console.log("\n\u2705 ===== Enhancement Complete =====");
      console.log(`   Total time: ${processingTime}s
`);
      res.json({
        success: true,
        audioUrl: cloudinaryUpload.secure_url,
        cloudinaryPublicId: cloudinaryUpload.public_id,
        message: "Speech enhanced successfully",
        processingTime: parseFloat(processingTime)
      });
    } catch (error) {
      console.error("\n\u274C ===== ERROR =====");
      console.error("Type:", error.constructor ? error.constructor.name : "Unknown");
      console.error("Message:", error.message);
      console.error("===================\n");
      if (req.file && fs11.existsSync(req.file.path)) {
        fs11.unlinkSync(req.file.path);
      }
      res.status(500).json({
        error: "Failed to enhance speech",
        details: error.message
      });
    }
  }
);
router25.get("/health", (req, res) => {
  const status = {
    status: "ok",
    service: "speech-enhancement-python",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    config: {
      cloudinary: {
        cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
        api_key: !!process.env.CLOUDINARY_API_KEY,
        api_secret: !!process.env.CLOUDINARY_API_SECRET
      }
    }
  };
  console.log("\u{1F3E5} Health check:", status);
  res.json(status);
});
var enhanceSpeech_default = router25;

// routes/apis/veo3.ts
import express6 from "express";
import multer5 from "multer";

// controllers/veo3/veo3Controller.ts
import { GoogleGenAI as GoogleGenAI3 } from "@google/genai";
import { eq as eq10, desc as desc3 } from "drizzle-orm";
import { v2 as cloudinary3 } from "cloudinary";
import fs12 from "fs";
import path13 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";

// utils/usageHelper.ts
import { eq as eq9, desc as desc2 } from "drizzle-orm";
var PLAN_LIMITS = {
  free: { aiGenerationsPerDay: 1, requiresTracking: true },
  starter: { aiGenerationsPerDay: 20, requiresTracking: true },
  pro: { aiGenerationsPerDay: Infinity, requiresTracking: false },
  team: { aiGenerationsPerDay: Infinity, requiresTracking: false },
  lifetime: { aiGenerationsPerDay: Infinity, requiresTracking: false }
};
async function getOrCreateUsageTracking(userId) {
  let [usage] = await db.select().from(usageTracking).where(eq9(usageTracking.userId, userId));
  if (!usage) {
    [usage] = await db.insert(usageTracking).values({
      userId,
      videosThisMonth: 0,
      aiGenerationsToday: 0,
      lastVideoReset: /* @__PURE__ */ new Date(),
      lastAiReset: /* @__PURE__ */ new Date()
    }).returning();
  }
  return usage;
}
function needsDailyReset(lastReset) {
  return (/* @__PURE__ */ new Date()).toDateString() !== lastReset.toDateString();
}
async function getUserPlan(userId) {
  const [subscription] = await db.select().from(subscriptions).where(eq9(subscriptions.userId, userId)).orderBy(desc2(subscriptions.createdAt)).limit(1);
  if (!subscription) return "free";
  if (subscription.isLifetime) return "lifetime";
  if (subscription.status === "active") return subscription.plan;
  return "free";
}
async function checkAIGenerationAllowed(userId) {
  const plan = await getUserPlan(userId);
  const config2 = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  if (!config2.requiresTracking) return { allowed: true, unlimited: true, used: 0, limit: Infinity, plan };
  let usage = await getOrCreateUsageTracking(userId);
  if (needsDailyReset(usage.lastAiReset)) {
    [usage] = await db.update(usageTracking).set({ aiGenerationsToday: 0, lastAiReset: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq9(usageTracking.userId, userId)).returning();
  }
  return {
    allowed: usage.aiGenerationsToday < config2.aiGenerationsPerDay,
    used: usage.aiGenerationsToday,
    limit: config2.aiGenerationsPerDay,
    plan,
    unlimited: false
  };
}
async function incrementAIGeneration(userId) {
  const plan = await getUserPlan(userId);
  const config2 = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  if (!config2.requiresTracking) return true;
  let usage = await getOrCreateUsageTracking(userId);
  if (needsDailyReset(usage.lastAiReset)) {
    usage.aiGenerationsToday = 0;
  }
  await db.update(usageTracking).set({
    aiGenerationsToday: usage.aiGenerationsToday + 1,
    lastAiReset: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq9(usageTracking.userId, userId));
  return true;
}

// controllers/veo3/veo3Controller.ts
var ai2 = new GoogleGenAI3({ apiKey: process.env.GEMINI_API_KEY });
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path13.dirname(__filename2);
var SUPPORTED_MODELS2 = /* @__PURE__ */ new Set([
  "veo-3.1-generate-preview",
  "veo-3.1-fast-generate-preview"
]);
var generateVideo = async (req, res) => {
  try {
    const authUser = req.user;
    const userId = authUser?.id ?? authUser?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const { prompt, model: model2, duration, aspectRatio, referenceType } = req.body;
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Prompt is required" });
    }
    const usageCheck = await checkAIGenerationAllowed(userId);
    if (!usageCheck.allowed) {
      return res.status(429).json({ success: false, error: "AI generation limit reached", usageInfo: usageCheck });
    }
    const file = req.file;
    let referenceImageUrl = null;
    if (file) {
      try {
        const uploadResult = await cloudinary3.uploader.upload(file.path, {
          folder: "veo3_reference_images",
          resource_type: "image"
        });
        referenceImageUrl = uploadResult.secure_url;
        console.log("[VEO3] Reference image uploaded:", referenceImageUrl);
      } catch (uploadErr) {
        console.error("[VEO3] Reference image upload error:", uploadErr);
      } finally {
        if (file.path && fs12.existsSync(file.path)) {
          fs12.unlinkSync(file.path);
        }
      }
    }
    const requestedModel = typeof model2 === "string" ? model2 : "";
    const modelId = SUPPORTED_MODELS2.has(requestedModel) ? requestedModel : "veo-3.1-generate-preview";
    const parsedDuration = Number(duration);
    const durationSeconds = parsedDuration === 4 ? 4 : 8;
    const ratio = aspectRatio || "16:9";
    const refType = referenceType || "ASSET";
    const [generation] = await db.insert(veo3Generations).values({
      userId,
      prompt: prompt.trim(),
      model: modelId,
      duration: `${durationSeconds}s`,
      aspectRatio: ratio,
      status: "pending",
      referenceImageUrl,
      referenceType: refType
    }).returning();
    console.log(`[VEO3] Created generation record: ${generation.id}`);
    res.status(202).json({
      success: true,
      generation: {
        id: generation.id,
        status: "pending",
        message: "Video generation started"
      }
    });
    processVideoGeneration2(
      generation.id,
      prompt.trim(),
      modelId,
      durationSeconds,
      ratio,
      referenceImageUrl,
      refType,
      userId
    ).catch((error) => {
      console.error(
        `[VEO3] Async processing error for ${generation.id}:`,
        error
      );
    });
  } catch (error) {
    console.error("[VEO3] Generation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start video generation"
    });
  }
};
async function processVideoGeneration2(generationId, prompt, model2, duration, aspectRatio, referenceImageUrl, referenceType, userId) {
  try {
    console.log(`[VEO3] Starting generation for: ${generationId}`);
    console.log(
      `[VEO3] Model: ${model2}, Duration: ${duration}s, Aspect: ${aspectRatio}`
    );
    await db.update(veo3Generations).set({ status: "processing" }).where(eq10(veo3Generations.id, generationId));
    const config2 = {
      aspectRatio,
      durationSeconds: duration,
      resolution: "720p"
    };
    console.log(`[VEO3] Calling ai.models.generateVideos...`);
    const operationStart = await ai2.models.generateVideos({
      model: model2,
      prompt,
      config: config2
    });
    let operation = operationStart;
    console.log(`[VEO3] Operation started: ${operation.name}`);
    let attempts = 0;
    const maxAttempts = 60;
    while (!operation.done && attempts < maxAttempts) {
      console.log(`[VEO3] Waiting... (${attempts + 1}/${maxAttempts})`);
      await new Promise((resolve) => setTimeout(resolve, 1e4));
      operation = await ai2.operations.getVideosOperation({ operation });
      attempts++;
    }
    if (!operation.done) {
      throw new Error("Video generation timeout");
    }
    if (!operation.response?.generatedVideos?.[0]) {
      throw new Error("No video generated");
    }
    console.log(`[VEO3] Video generation completed for ${generationId}`);
    const generatedVideo = operation.response.generatedVideos[0];
    const outputsDir2 = path13.join(__dirname2, "../../outputs");
    if (!fs12.existsSync(outputsDir2)) {
      fs12.mkdirSync(outputsDir2, { recursive: true });
    }
    const tempVideoPath = path13.join(outputsDir2, `${generationId}_temp.mp4`);
    await ai2.files.download({
      file: generatedVideo.video,
      downloadPath: tempVideoPath
    });
    console.log(`[VEO3] Video downloaded to: ${tempVideoPath}`);
    const cloudinaryResult = await cloudinary3.uploader.upload(tempVideoPath, {
      resource_type: "video",
      folder: "veo3_generations",
      public_id: generationId
    });
    console.log(
      `[VEO3] Uploaded to Cloudinary: ${cloudinaryResult.secure_url}`
    );
    const thumbnailUrl = cloudinary3.url(generationId, {
      resource_type: "video",
      format: "jpg",
      transformation: [
        { width: 640, height: 360, crop: "fill", start_offset: "1" }
      ]
    });
    if (fs12.existsSync(tempVideoPath)) {
      fs12.unlinkSync(tempVideoPath);
    }
    await db.update(veo3Generations).set({
      status: "completed",
      videoUrl: cloudinaryResult.secure_url,
      thumbnailUrl,
      completedAt: /* @__PURE__ */ new Date(),
      metadata: {
        duration: cloudinaryResult.duration,
        format: cloudinaryResult.format,
        size: cloudinaryResult.bytes,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        referenceImageUsed: !!referenceImageUrl,
        referenceType
      }
    }).where(eq10(veo3Generations.id, generationId));
    if (userId) {
      await incrementAIGeneration(userId);
    }
    console.log(`[VEO3] \u2705 Completed: ${generationId}`);
  } catch (error) {
    console.error(`[VEO3] \u274C Error:`, error);
    await db.update(veo3Generations).set({
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error"
    }).where(eq10(veo3Generations.id, generationId));
  }
}
var getGenerations = async (req, res) => {
  try {
    const authUser = req.user;
    const userId = authUser?.id ?? authUser?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const generations = await db.select().from(veo3Generations).where(eq10(veo3Generations.userId, userId)).orderBy(desc3(veo3Generations.createdAt)).limit(limit).offset(offset);
    res.json({ success: true, generations });
  } catch (error) {
    console.error("[VEO3] Get generations error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch generations" });
  }
};
var getGenerationById = async (req, res) => {
  try {
    const authUser = req.user;
    const userId = authUser?.id ?? authUser?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const { id } = req.params;
    const [generation] = await db.select().from(veo3Generations).where(eq10(veo3Generations.id, id));
    if (!generation) {
      return res.status(404).json({ success: false, error: "Generation not found" });
    }
    if (generation.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    res.json({ success: true, generation });
  } catch (error) {
    console.error("[VEO3] Get generation error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch generation" });
  }
};
var deleteGeneration = async (req, res) => {
  try {
    const authUser = req.user;
    const userId = authUser?.id ?? authUser?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const { id } = req.params;
    const [generation] = await db.select().from(veo3Generations).where(eq10(veo3Generations.id, id));
    if (!generation) {
      return res.status(404).json({ success: false, error: "Generation not found" });
    }
    if (generation.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    if (generation.referenceImageUrl) {
      try {
        const url = new URL(generation.referenceImageUrl);
        const parts = url.pathname.split("/");
        const filename = parts[parts.length - 1];
        const folder = parts[parts.length - 2];
        const publicId = `${folder}/${filename.split(".")[0]}`;
        await cloudinary3.uploader.destroy(publicId, { resource_type: "image" });
        console.log(
          "[VEO3] Reference image deleted from Cloudinary:",
          publicId
        );
      } catch (refErr) {
        console.error("[VEO3] Reference image deletion error:", refErr);
      }
    }
    if (generation.videoUrl) {
      try {
        await cloudinary3.uploader.destroy(id, { resource_type: "video" });
      } catch (cloudError) {
        console.error("[VEO3] Cloudinary deletion error:", cloudError);
      }
    }
    await db.delete(veo3Generations).where(eq10(veo3Generations.id, id));
    res.json({ success: true, message: "Generation deleted successfully" });
  } catch (error) {
    console.error("[VEO3] Delete generation error:", error);
    res.status(500).json({ success: false, error: "Failed to delete generation" });
  }
};

// routes/apis/veo3.ts
import fs13 from "fs";
var router26 = express6.Router();
var uploadDir = "uploads/veo3-references";
if (!fs13.existsSync(uploadDir)) {
  fs13.mkdirSync(uploadDir, { recursive: true });
}
var upload5 = multer5({ dest: uploadDir });
router26.post("/generate", requireAuth, upload5.single("referenceImage"), generateVideo);
router26.get("/generations", requireAuth, getGenerations);
router26.get("/generations/:id", requireAuth, getGenerationById);
router26.delete("/generations/:id", requireAuth, deleteGeneration);
var veo3_default = router26;

// routes/apis/youtube.ts
import express7 from "express";

// controllers/youtube/youtubeController.ts
import ytDlpExec from "yt-dlp-exec";
import { eq as eq11, desc as desc4 } from "drizzle-orm";
import { v2 as cloudinary4 } from "cloudinary";
import fs14 from "fs";
import path14 from "path";
import { fileURLToPath as fileURLToPath3 } from "url";
var __filename3 = fileURLToPath3(import.meta.url);
var __dirname3 = path14.dirname(__filename3);
var getVideoInfo2 = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({
        success: false,
        error: "YouTube URL is required"
      });
    }
    console.log("[YouTube] Fetching video info for:", url);
    const info = await ytDlpExec(url, {
      dumpSingleJson: true,
      noCheckCertificate: true,
      noWarnings: true,
      preferFreeFormats: true
    });
    const formatDuration = (seconds) => {
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    };
    const formatNumber = (num) => {
      if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
      if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
      return num.toString();
    };
    const formats = info.formats?.filter(
      (format) => format.ext === "mp4" && format.vcodec !== "none" && format.height
    ).map((format) => ({
      quality: `${format.height}p`,
      filesize: format.filesize || 0,
      type: format.height >= 720 ? format.height >= 1080 ? "Full HD" : "HD" : "SD"
    })).filter(
      (format, index2, self) => index2 === self.findIndex((f) => f.quality === format.quality)
    ).sort((a, b) => parseInt(b.quality) - parseInt(a.quality)) || [];
    const standardQualities = ["1080p", "720p", "480p"];
    const availableQualities = formats.map((f) => f.quality);
    standardQualities.forEach((quality) => {
      if (!availableQualities.includes(quality)) {
        formats.push({
          quality,
          filesize: 0,
          type: quality === "1080p" ? "Full HD" : quality === "720p" ? "HD" : "SD"
        });
      }
    });
    formats.sort((a, b) => parseInt(b.quality) - parseInt(a.quality));
    const videoInfo = {
      id: info.id,
      title: info.title || "Unknown Title",
      thumbnail: info.thumbnail || "",
      duration: formatDuration(info.duration || 0),
      views: `${formatNumber(info.view_count || 0)} views`,
      likes: `${formatNumber(info.like_count || 0)} likes`,
      formats: formats.slice(0, 3)
    };
    console.log("[YouTube] Video info fetched successfully:", videoInfo.title);
    res.json({ success: true, video: videoInfo });
  } catch (error) {
    console.error("[YouTube] Get video info error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch video information. Please check the URL and try again."
    });
  }
};
var downloadVideo = async (req, res) => {
  try {
    console.log("=== BACKEND DOWNLOAD DEBUG ===");
    console.log("1. Request body:", JSON.stringify(req.body, null, 2));
    console.log("2. URL:", req.body.url);
    console.log("3. Quality:", req.body.quality);
    console.log("4. User object:", req.user);
    console.log("==============================");
    const authUser = req.user;
    const userId = authUser?.id ?? authUser?.userId;
    console.log("5. Extracted userId:", userId);
    if (!userId) {
      console.log("\u274C REJECTED: No userId");
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const { url, quality } = req.body;
    if (!url || !url.trim()) {
      console.log("\u274C REJECTED: URL missing or empty");
      return res.status(400).json({
        success: false,
        error: "YouTube URL is required"
      });
    }
    if (!quality) {
      console.log("\u274C REJECTED: Quality missing");
      return res.status(400).json({
        success: false,
        error: "Quality is required"
      });
    }
    console.log(`\u2705 VALIDATION PASSED: ${url} at ${quality}`);
    const info = await ytDlpExec(url, {
      dumpSingleJson: true,
      noCheckCertificate: true,
      noWarnings: true
    });
    const [download] = await db.insert(youtubeDownloads).values({
      userId,
      videoId: info.id,
      videoUrl: url,
      title: info.title || "Unknown Title",
      thumbnail: info.thumbnail || null,
      duration: info.duration ? `${info.duration}s` : null,
      views: info.view_count ? `${info.view_count}` : null,
      likes: info.like_count ? `${info.like_count}` : null,
      quality,
      filesize: null,
      status: "pending"
    }).returning();
    console.log(`[YouTube] Created download record: ${download.id}`);
    res.status(202).json({
      success: true,
      download: {
        id: download.id,
        status: "pending",
        message: "Download started"
      }
    });
    processVideoDownload(download.id, url, quality, info).catch((error) => {
      console.error(
        `[YouTube] Async processing error for ${download.id}:`,
        error
      );
    });
  } catch (error) {
    console.error("[YouTube] Download error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start download"
    });
  }
};
async function processVideoDownload(downloadId, url, quality, videoInfo) {
  try {
    console.log(`[YouTube] Processing download: ${downloadId}`);
    await db.update(youtubeDownloads).set({ status: "processing" }).where(eq11(youtubeDownloads.id, downloadId));
    const outputsDir2 = path14.join(__dirname3, "../../outputs");
    if (!fs14.existsSync(outputsDir2)) {
      fs14.mkdirSync(outputsDir2, { recursive: true });
    }
    const tempVideoPath = path14.join(outputsDir2, `${downloadId}.mp4`);
    console.log(`[YouTube] Downloading video to: ${tempVideoPath}`);
    const qualityHeight = parseInt(quality);
    const formatString = `bestvideo[height<=${qualityHeight}][vcodec^=avc1]+bestaudio[acodec=mp4a]/bestvideo[height<=${qualityHeight}][vcodec^=avc]+bestaudio[acodec=mp4a]/bestvideo[height<=${qualityHeight}]+bestaudio[acodec=mp4a]/bestvideo[height<=${qualityHeight}]+bestaudio/best[height<=${qualityHeight}]/best`;
    console.log(`[YouTube] Format: H.264 video + AAC audio for compatibility`);
    await ytDlpExec(url, {
      output: tempVideoPath,
      format: formatString,
      mergeOutputFormat: "mp4",
      // ✅ CRITICAL: Convert audio to AAC if needed
      postprocessorArgs: "ffmpeg:-c:v copy -c:a aac -b:a 192k",
      noCheckCertificate: true,
      noWarnings: true,
      noPart: true
    });
    console.log(`[YouTube] Download command completed`);
    let actualFilePath = tempVideoPath;
    if (!fs14.existsSync(tempVideoPath)) {
      console.log(`[YouTube] File not at expected path, searching...`);
      const files = fs14.readdirSync(outputsDir2);
      const matchingFile = files.find((f) => f.startsWith(downloadId) && f.endsWith(".mp4"));
      if (!matchingFile) {
        const anyFile = files.find((f) => f.startsWith(downloadId));
        if (anyFile) {
          console.log(`[YouTube] \u26A0\uFE0F Found file: ${anyFile}`);
          throw new Error(`Downloaded file format issue: ${anyFile}`);
        }
        throw new Error("Downloaded MP4 file not found");
      }
      actualFilePath = path14.join(outputsDir2, matchingFile);
      console.log(`[YouTube] Found file at: ${actualFilePath}`);
    }
    console.log(`[YouTube] Video downloaded successfully with AAC audio`);
    const stats = fs14.statSync(actualFilePath);
    const filesize = stats.size;
    console.log(`[YouTube] File size: ${(filesize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`[YouTube] Uploading to Cloudinary...`);
    const cloudinaryResult = await cloudinary4.uploader.upload(actualFilePath, {
      resource_type: "video",
      folder: "youtube_downloads",
      public_id: downloadId
    });
    console.log(`[YouTube] Uploaded to Cloudinary: ${cloudinaryResult.secure_url}`);
    if (fs14.existsSync(actualFilePath)) {
      fs14.unlinkSync(actualFilePath);
      console.log(`[YouTube] Temp file deleted`);
    }
    await db.update(youtubeDownloads).set({
      status: "completed",
      downloadedVideoUrl: cloudinaryResult.secure_url,
      filesize,
      completedAt: /* @__PURE__ */ new Date(),
      metadata: {
        duration: cloudinaryResult.duration,
        format: cloudinaryResult.format,
        size: cloudinaryResult.bytes,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height
      }
    }).where(eq11(youtubeDownloads.id, downloadId));
    console.log(`[YouTube] \u2705 Download completed: ${downloadId}`);
  } catch (error) {
    console.error(`[YouTube] \u274C Processing error:`, error);
    await db.update(youtubeDownloads).set({
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error"
    }).where(eq11(youtubeDownloads.id, downloadId));
  }
}
var getDownloads = async (req, res) => {
  try {
    const authUser = req.user;
    const userId = authUser?.id ?? authUser?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const downloads = await db.select().from(youtubeDownloads).where(eq11(youtubeDownloads.userId, userId)).orderBy(desc4(youtubeDownloads.createdAt)).limit(limit).offset(offset);
    res.json({ success: true, downloads });
  } catch (error) {
    console.error("[YouTube] Get downloads error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch downloads" });
  }
};
var getDownloadById = async (req, res) => {
  try {
    const authUser = req.user;
    const userId = authUser?.id ?? authUser?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const { id } = req.params;
    const [download] = await db.select().from(youtubeDownloads).where(eq11(youtubeDownloads.id, id));
    if (!download) {
      return res.status(404).json({ success: false, error: "Download not found" });
    }
    if (download.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    res.json({ success: true, download });
  } catch (error) {
    console.error("[YouTube] Get download error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch download" });
  }
};
var deleteDownload = async (req, res) => {
  try {
    const authUser = req.user;
    const userId = authUser?.id ?? authUser?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const { id } = req.params;
    const [download] = await db.select().from(youtubeDownloads).where(eq11(youtubeDownloads.id, id));
    if (!download) {
      return res.status(404).json({ success: false, error: "Download not found" });
    }
    if (download.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    if (download.downloadedVideoUrl) {
      try {
        await cloudinary4.uploader.destroy(id, { resource_type: "video" });
        console.log(`[YouTube] Deleted from Cloudinary: ${id}`);
      } catch (cloudError) {
        console.error("[YouTube] Cloudinary deletion error:", cloudError);
      }
    }
    await db.delete(youtubeDownloads).where(eq11(youtubeDownloads.id, id));
    res.json({ success: true, message: "Download deleted successfully" });
  } catch (error) {
    console.error("[YouTube] Delete download error:", error);
    res.status(500).json({ success: false, error: "Failed to delete download" });
  }
};

// routes/apis/youtube.ts
var router27 = express7.Router();
router27.post("/info", getVideoInfo2);
router27.get("/test-auth", requireAuth, (req, res) => {
  const user = req.user;
  res.json({
    success: true,
    message: "Auth works!",
    user,
    userId: user?.id ?? user?.userId
  });
});
router27.post("/download", requireAuth, downloadVideo);
router27.get("/downloads", requireAuth, getDownloads);
router27.get("/downloads/:id", requireAuth, getDownloadById);
router27.delete("/downloads/:id", requireAuth, deleteDownload);
var youtube_default = router27;

// utils/saveImage.ts
import express8 from "express";
var router28 = express8.Router();
router28.post("/save-to-cloudinary", async (req, res) => {
  console.log("\n\u{1F4F8} ===== Save Image to Cloudinary =====");
  const startTime = Date.now();
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      console.error("\u274C No image URL provided");
      res.status(400).json({ error: "Image URL is required" });
      return;
    }
    console.log("\u{1F517} Image URL:", imageUrl);
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("\u274C Cloudinary not configured");
      res.status(500).json({
        error: "Service configuration error",
        details: "Cloudinary not configured"
      });
      return;
    }
    console.log("\u2705 Configuration validated");
    console.log("\n\u2601\uFE0F  Uploading to Cloudinary...");
    const cloudinaryUpload = await cloudinaryClient_default.uploader.upload(imageUrl, {
      folder: "ai-generated-images",
      public_id: `ai-image-${Date.now()}`,
      overwrite: true,
      resource_type: "image"
    });
    console.log("\u2705 Uploaded to Cloudinary");
    console.log("   URL:", cloudinaryUpload.secure_url);
    console.log("   Public ID:", cloudinaryUpload.public_id);
    console.log("   Width:", cloudinaryUpload.width);
    console.log("   Height:", cloudinaryUpload.height);
    const processingTime = ((Date.now() - startTime) / 1e3).toFixed(2);
    console.log("\n\u2705 ===== Save Complete =====");
    console.log(`   Total time: ${processingTime}s
`);
    res.json({
      success: true,
      cloudinaryUrl: cloudinaryUpload.secure_url,
      publicId: cloudinaryUpload.public_id,
      width: cloudinaryUpload.width,
      height: cloudinaryUpload.height,
      processingTime: parseFloat(processingTime)
    });
  } catch (error) {
    console.error("\n\u274C ===== ERROR =====");
    console.error("Type:", error.constructor ? error.constructor.name : "Unknown");
    console.error("Message:", error.message);
    console.error("===================\n");
    res.status(500).json({
      error: "Failed to save image to Cloudinary",
      details: error.message
    });
  }
});
router28.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "save-image",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
var saveImage_default = router28;

// routes/tools/imageGen.ts
import { Router as Router21 } from "express";

// controllers/imageGen/imageGenController.ts
import { eq as eq12, desc as desc5 } from "drizzle-orm";
import axios5 from "axios";
import { GoogleGenerativeAI as GoogleGenerativeAI4 } from "@google/generative-ai";

// services/nanoBanana.service.ts
import { GoogleGenerativeAI as GoogleGenerativeAI3 } from "@google/generative-ai";
var NanoBananaService = class {
  apiKeys;
  currentKeyIndex = 0;
  constructor() {
    const key1 = process.env.GEMINI_API_KEY || "";
    const key2 = process.env.GEMINI_API_KEY_2 || "";
    this.apiKeys = [key1, key2].filter((key) => key.length > 0);
    if (this.apiKeys.length === 0) {
      console.warn("\u26A0\uFE0F No GEMINI_API_KEY found in environment variables");
    } else {
      console.log(`\u2705 Loaded ${this.apiKeys.length} Gemini API key(s) for Nano Banana`);
    }
  }
  /**
   * Get the current API key
   */
  getCurrentApiKey() {
    if (this.apiKeys.length === 0) {
      throw new Error("No Gemini API keys configured");
    }
    return this.apiKeys[this.currentKeyIndex % this.apiKeys.length];
  }
  /**
   * Rotate to the next API key (for fallback on rate limit)
   */
  rotateApiKey() {
    if (this.apiKeys.length > 1) {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      console.log(`\u{1F504} [NanoBanana] Rotated to API key #${this.currentKeyIndex + 1}`);
    }
  }
  /**
   * Convert aspect ratio to dimensions (for logging/metadata)
   */
  getImageDimensions(aspectRatio) {
    switch (aspectRatio) {
      case "9:16":
        return { width: 512, height: 912 };
      case "16:9":
        return { width: 912, height: 512 };
      case "1:1":
        return { width: 1024, height: 1024 };
      case "4:5":
        return { width: 720, height: 900 };
      default:
        return { width: 512, height: 912 };
    }
  }
  /**
   * Validate if the model is supported for image generation
   */
  isValidModel(model2) {
    const validModels = [
      "gemini-2.5-flash-image",
      "gemini-2.5-flash-image-preview",
      "gemini-3-pro-image-preview",
      "nano-banana-pro-preview"
    ];
    return validModels.includes(model2);
  }
  /**
   * Generate image using a specific API key
   */
  async generateWithKey(apiKey, prompt, model2, aspectRatio) {
    const genAI4 = new GoogleGenerativeAI3(apiKey);
    const imageModel = genAI4.getGenerativeModel({ model: model2 });
    const result = await imageModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate an image with the following description: ${prompt}. The aspect ratio should be ${aspectRatio}.`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192
      }
    });
    const response = await result.response;
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No image generated from API");
    }
    const candidate = response.candidates[0];
    if (candidate.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          const base64Image = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || "image/png";
          return `data:${mimeType};base64,${base64Image}`;
        }
      }
    }
    const textContent = response.text();
    if (textContent) {
      try {
        const jsonResponse = JSON.parse(textContent);
        if (jsonResponse.image || jsonResponse.imageUrl) {
          return jsonResponse.image || jsonResponse.imageUrl;
        }
      } catch (parseError) {
      }
    }
    throw new Error("No image data found in response");
  }
  /**
   * Main method to generate image with automatic fallback
   */
  async generateImage(params) {
    try {
      const { prompt, model: model2, aspectRatio } = params;
      if (!this.isValidModel(model2)) {
        return {
          success: false,
          error: `Invalid model: ${model2}. Supported models: gemini-2.5-flash-image, gemini-2.5-flash-image-preview, gemini-3-pro-image-preview, nano-banana-pro-preview`
        };
      }
      const { width, height } = this.getImageDimensions(aspectRatio);
      console.log(`\u{1F34C} [NanoBanana] Generating image with model: ${model2}`);
      console.log(`\u{1F4D0} [NanoBanana] Dimensions: ${width}x${height}`);
      console.log(`\u270F\uFE0F [NanoBanana] Prompt: ${prompt.substring(0, 100)}...`);
      try {
        const currentKey = this.getCurrentApiKey();
        const imageUrl = await this.generateWithKey(
          currentKey,
          prompt,
          model2,
          aspectRatio
        );
        console.log(`\u2705 [NanoBanana] Image generated successfully`);
        return {
          success: true,
          imageUrl
        };
      } catch (primaryError) {
        console.error(`\u274C [NanoBanana] Primary key failed:`, primaryError.message);
        if (this.apiKeys.length > 1) {
          console.log(`\u{1F504} [NanoBanana] Trying fallback API key...`);
          this.rotateApiKey();
          try {
            const fallbackKey = this.getCurrentApiKey();
            const imageUrl = await this.generateWithKey(
              fallbackKey,
              prompt,
              model2,
              aspectRatio
            );
            console.log(`\u2705 [NanoBanana] Image generated with fallback key`);
            return {
              success: true,
              imageUrl
            };
          } catch (fallbackError) {
            console.error(`\u274C [NanoBanana] Fallback key also failed:`, fallbackError.message);
            throw fallbackError;
          }
        }
        throw primaryError;
      }
    } catch (error) {
      console.error(`\u274C [NanoBanana] Generation error:`, error);
      let errorMessage = "Failed to generate image";
      if (error.message?.includes("API key") || error.message?.includes("401")) {
        errorMessage = "Invalid API key. Please check your Gemini API configuration.";
      } else if (error.message?.includes("quota") || error.message?.includes("rate limit") || error.message?.includes("429")) {
        errorMessage = "Rate limit exceeded. Please try again in a few moments.";
      } else if (error.message?.includes("model") || error.message?.includes("404")) {
        errorMessage = `Model not available or not supported for image generation.`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      return {
        success: false,
        error: errorMessage
      };
    }
  }
  /**
   * Test if API keys are valid
   */
  async testApiKeys() {
    const results = {
      primary: false,
      secondary: false
    };
    if (this.apiKeys.length > 0) {
      try {
        const genAI4 = new GoogleGenerativeAI3(this.apiKeys[0]);
        const model2 = genAI4.getGenerativeModel({ model: "gemini-2.5-flash" });
        await model2.generateContent("test");
        results.primary = true;
        console.log("\u2705 [NanoBanana] Primary API key is valid");
      } catch (error) {
        console.error("\u274C [NanoBanana] Primary API key is invalid");
      }
    }
    if (this.apiKeys.length > 1) {
      try {
        const genAI4 = new GoogleGenerativeAI3(this.apiKeys[1]);
        const model2 = genAI4.getGenerativeModel({ model: "gemini-2.5-flash" });
        await model2.generateContent("test");
        results.secondary = true;
        console.log("\u2705 [NanoBanana] Secondary API key is valid");
      } catch (error) {
        console.error("\u274C [NanoBanana] Secondary API key is invalid");
      }
    }
    return results;
  }
  /**
   * Get list of supported models
   */
  getSupportedModels() {
    return [
      "gemini-2.5-flash-image",
      "gemini-2.5-flash-image-preview",
      "gemini-3-pro-image-preview",
      "nano-banana-pro-preview"
    ];
  }
  /**
   * Get current API key status
   */
  getStatus() {
    return {
      keysConfigured: this.apiKeys.length,
      currentKeyIndex: this.currentKeyIndex,
      supportedModels: this.getSupportedModels()
    };
  }
};
var nanoBananaService = new NanoBananaService();

// controllers/imageGen/imageGenController.ts
var genAI3 = new GoogleGenerativeAI4(process.env.GEMINI_API_KEY || "");
var textModel2 = genAI3.getGenerativeModel({ model: "gemini-2.5-flash" });
function getSystemPromptForModel2(modelType) {
  switch (modelType) {
    case "flux-realism":
      return "You are an expert at creating photorealistic image prompts. Enhance prompts with realistic details, proper lighting (golden hour, soft natural light, etc.), camera settings (depth of field, bokeh), and natural elements.";
    case "flux-anime":
      return "You are an expert at creating anime-style image prompts. Enhance prompts with anime aesthetics, character details (expressive eyes, dynamic poses), vibrant colors, cel-shading, and manga/anime art style elements.";
    case "turbo":
      return "You are an expert at creating creative and artistic image prompts for the Turbo model. This model excels at fast, experimental, and creative outputs. Enhance prompts with imaginative details, unique artistic styles, bold colors, surreal elements, and experimental visual concepts.";
    case "gemini-2.5-flash-image":
    case "gemini-2.5-flash-image-preview":
    case "gemini-3-pro-image-preview":
    case "nano-banana-pro-preview":
      return "You are an expert at creating prompts for Google's Gemini image generation models (Nano Banana). Enhance prompts with photorealistic details, artistic elements, vivid colors, precise composition descriptions, and creative visual concepts.";
    case "imagen-3":
    case "imagen-4":
      return "You are an expert at creating prompts for Google's Imagen model. Enhance prompts with photorealistic details, natural lighting, vivid colors, and precise composition descriptions. Focus on clarity and visual accuracy.";
    case "flux":
    default:
      return "You are an expert at creating detailed image generation prompts. Enhance prompts with vivid descriptions, artistic elements, visual details, and creative direction.";
  }
}
var saveImageGeneration = async (req, res) => {
  try {
    const authUser = req.user;
    const userId = authUser?.id ?? authUser?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const { prompt, model: model2, aspectRatio, imageUrl } = req.body;
    if (!prompt || !model2 || !aspectRatio || !imageUrl) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }
    const usageCheck = await checkAIGenerationAllowed(userId);
    if (!usageCheck.allowed) {
      return res.status(429).json({ success: false, error: "AI generation limit reached", usageInfo: usageCheck });
    }
    let permanentUrl = imageUrl;
    if (imageUrl.includes("cloudinary.com")) {
      permanentUrl = imageUrl;
    } else if (imageUrl.startsWith("data:image")) {
      try {
        console.log("[ImageGen] Uploading base64 image to Cloudinary...");
        const uploadResult = await cloudinaryClient_default.uploader.upload(imageUrl, {
          folder: "ai_image_generations",
          resource_type: "image"
        });
        permanentUrl = uploadResult.secure_url;
        console.log("[ImageGen] \u2705 Base64 uploaded to Cloudinary:", permanentUrl);
      } catch (uploadErr) {
        console.error("[ImageGen] \u274C Cloudinary upload failed for base64:", uploadErr);
        console.warn("[ImageGen] \u26A0\uFE0F Using base64 URL as fallback");
      }
    } else {
      try {
        console.log("[ImageGen] Downloading and uploading URL to Cloudinary...");
        const imageResponse = await axios5.get(imageUrl, {
          responseType: "arraybuffer",
          timeout: 3e4
        });
        const imageBuffer = Buffer.from(imageResponse.data);
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinaryClient_default.uploader.upload_stream(
            { folder: "ai_image_generations", resource_type: "image" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(imageBuffer);
        });
        permanentUrl = uploadResult.secure_url;
        console.log("[ImageGen] \u2705 URL uploaded to Cloudinary:", permanentUrl);
      } catch (uploadErr) {
        console.error("[ImageGen] \u274C Cloudinary upload failed for URL:", uploadErr);
        console.warn("[ImageGen] \u26A0\uFE0F Using original URL as fallback");
      }
    }
    const [generation] = await db.insert(imageGenerations).values({
      userId,
      prompt: prompt.trim(),
      model: model2,
      aspectRatio,
      imageUrl: permanentUrl,
      status: "completed",
      metadata: {
        originalUrl: imageUrl,
        uploadedToCloudinary: permanentUrl !== imageUrl && !imageUrl.includes("cloudinary.com"),
        isBase64: imageUrl.startsWith("data:image")
      }
    }).returning();
    await incrementAIGeneration(userId);
    console.log(`[ImageGen] \u2705 Saved generation: ${generation.id}`);
    res.status(201).json({ success: true, generation });
  } catch (error) {
    console.error("[ImageGen] \u274C Save error:", error);
    res.status(500).json({ success: false, error: "Failed to save image generation" });
  }
};
var getGenerations2 = async (req, res) => {
  try {
    const authUser = req.user;
    const userId = authUser?.id ?? authUser?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const generations = await db.select().from(imageGenerations).where(eq12(imageGenerations.userId, userId)).orderBy(desc5(imageGenerations.createdAt)).limit(limit).offset(offset);
    res.json({ success: true, generations });
  } catch (error) {
    console.error("[ImageGen] Get generations error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch generations" });
  }
};
var deleteGeneration2 = async (req, res) => {
  try {
    const authUser = req.user;
    const userId = authUser?.id ?? authUser?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const { id } = req.params;
    const [generation] = await db.select().from(imageGenerations).where(eq12(imageGenerations.id, id));
    if (!generation) {
      return res.status(404).json({ success: false, error: "Generation not found" });
    }
    if (generation.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    if (generation.imageUrl.includes("cloudinary.com")) {
      try {
        const urlParts = generation.imageUrl.split("/");
        const filename = urlParts[urlParts.length - 1];
        const folder = urlParts[urlParts.length - 2];
        const publicId = `${folder}/${filename.split(".")[0]}`;
        await cloudinaryClient_default.uploader.destroy(publicId, { resource_type: "image" });
        console.log("[ImageGen] Deleted from Cloudinary:", publicId);
      } catch (cloudError) {
        console.error("[ImageGen] Cloudinary deletion error:", cloudError);
      }
    }
    await db.delete(imageGenerations).where(eq12(imageGenerations.id, id));
    res.json({ success: true, message: "Generation deleted successfully" });
  } catch (error) {
    console.error("[ImageGen] Delete generation error:", error);
    res.status(500).json({ success: false, error: "Failed to delete generation" });
  }
};
var improvePrompt = async (req, res) => {
  try {
    const authUser = req.user;
    const userId = authUser?.id ?? authUser?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const { prompt, model: model2 } = req.body;
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Valid prompt is required" });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, error: "GEMINI_API_KEY not configured" });
    }
    console.log(`[ImageGen] Improving prompt for model: ${model2 || "default"}`);
    const systemPrompt = getSystemPromptForModel2(model2);
    const fullPrompt = `${systemPrompt}

Original prompt: "${prompt}"

Please provide an improved, detailed version of this image generation prompt. Focus on:
- Adding vivid visual details
- Specifying lighting, atmosphere, and mood
- Including artistic style elements
- Enhancing composition suggestions
- Adding color palette descriptions

Return ONLY the improved prompt without any explanations or additional text.`;
    const result = await textModel2.generateContent(fullPrompt);
    const response = await result.response;
    const improvedPrompt = response.text().trim().replace(/^["']|["']$/g, "").replace(/^```|```$/g, "").trim();
    console.log(`[ImageGen] Prompt improved successfully`);
    res.json({ success: true, improvedPrompt, originalPrompt: prompt });
  } catch (error) {
    console.error("[ImageGen] Improve prompt error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to improve prompt" });
  }
};
var generateWithNanoBanana = async (req, res) => {
  try {
    const authUser = req.user;
    const userId = authUser?.id ?? authUser?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const { prompt, model: model2, aspectRatio } = req.body;
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Valid prompt is required" });
    }
    if (!model2) {
      return res.status(400).json({ success: false, error: "Model is required" });
    }
    if (!aspectRatio) {
      return res.status(400).json({ success: false, error: "Aspect ratio is required" });
    }
    const usageCheck = await checkAIGenerationAllowed(userId);
    if (!usageCheck.allowed) {
      return res.status(429).json({ success: false, error: "AI generation limit reached", usageInfo: usageCheck });
    }
    const result = await nanoBananaService.generateImage({
      prompt: prompt.trim(),
      model: model2,
      aspectRatio
    });
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || "Failed to generate image"
      });
    }
    await incrementAIGeneration(userId);
    return res.status(200).json({
      success: true,
      imageUrl: result.imageUrl
    });
  } catch (error) {
    console.error("[NanoBanana] Controller error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate image with Nano Banana"
    });
  }
};

// routes/tools/imageGen.ts
var router29 = Router21();
router29.use(requireAuth);
router29.post("/save", saveImageGeneration);
router29.get("/generations", getGenerations2);
router29.delete("/generations/:id", deleteGeneration2);
router29.post("/improve-prompt", improvePrompt);
router29.post("/nano-banana", generateWithNanoBanana);
var imageGen_default = router29;

// routes/subscription.ts
import express9 from "express";

// controllers/subscription/subscriptionController.ts
import { eq as eq13, and as and6, desc as desc6, sql } from "drizzle-orm";
async function hasLifetimeAccess(userId) {
  const [subscription] = await db.select().from(subscriptions).where(
    and6(
      eq13(subscriptions.userId, userId),
      eq13(subscriptions.isLifetime, true),
      sql`${subscriptions.status} IN ('lifetime', 'company')`
    )
  ).limit(1);
  return !!subscription;
}
async function getActiveSubscription(userId) {
  const allSubs = await db.select().from(subscriptions).where(eq13(subscriptions.userId, userId)).orderBy(desc6(subscriptions.createdAt));
  return allSubs.find((sub) => {
    if (sub.status === "lifetime" || sub.status === "company") {
      return sub.isLifetime === true;
    }
    return sub.status === "active";
  });
}
var createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { plan } = req.body;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    if (!plan || !["starter", "pro", "team"].includes(plan)) {
      return res.status(400).json({
        success: false,
        error: "Invalid plan selected"
      });
    }
    const [user] = await db.select().from(users).where(eq13(users.id, userId));
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    const existingSubscription = await getActiveSubscription(userId);
    if (existingSubscription && !existingSubscription.isLifetime) {
      return res.status(400).json({
        success: false,
        error: "You already have an active subscription"
      });
    }
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || void 0,
        metadata: { userId: user.id.toString() }
      });
      customerId = customer.id;
      await db.update(users).set({ stripeCustomerId: customerId }).where(eq13(users.id, userId));
    }
    const priceId = getPriceId(plan);
    const session2 = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      subscription_data: {
        metadata: {
          userId: user.id.toString(),
          plan
          // ✅ Store plan in metadata
        }
      },
      success_url: `${process.env.CLIENT_URL || process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || process.env.FRONTEND_URL}/pricing`,
      metadata: {
        userId: user.id.toString(),
        plan
        // ✅ Store plan
      }
    });
    console.log(
      `\u2705 Checkout session created for user ${userId} - ${plan} plan`
    );
    res.json({ success: true, url: session2.url });
  } catch (error) {
    console.error("\u274C Create checkout error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
var getSubscriptionStatus = async (req, res) => {
  try {
    const authUser = req.user;
    if (!authUser) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const [user] = await db.select().from(users).where(eq13(users.id, authUser.userId));
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    console.log(`\u{1F4CA} Checking subscription status for user ${user.id} (${user.email})`);
    const isLifetime = await hasLifetimeAccess(user.id);
    if (isLifetime) {
      console.log(`\u2705 User ${user.id} has lifetime access`);
      return res.json({
        success: true,
        hasSubscription: true,
        status: "lifetime",
        plan: "lifetime",
        isLifetime: true
      });
    }
    const subscription = await getActiveSubscription(user.id);
    if (!subscription) {
      console.log(`\u2139\uFE0F User ${user.id} has no subscription - Free plan`);
      return res.json({
        success: true,
        hasSubscription: false,
        status: null,
        plan: "free",
        // ✅ Default to free
        isLifetime: false
      });
    }
    res.json({
      success: true,
      hasSubscription: subscription.status === "active",
      status: subscription.status,
      plan: subscription.plan,
      // ✅ Include plan
      isLifetime: false
    });
  } catch (error) {
    console.error("\u274C Get subscription status error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
var getSubscriptionDetails = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    let subscription = await getActiveSubscription(userId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: "No subscription found"
      });
    }
    const formattedSubscription = {
      ...subscription,
      currentPeriodStart: subscription.currentPeriodStart?.toISOString() || null,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
      trialStart: subscription.trialStart?.toISOString() || null,
      trialEnd: subscription.trialEnd?.toISOString() || null,
      canceledAt: subscription.canceledAt?.toISOString() || null,
      createdAt: subscription.createdAt?.toISOString() || (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: subscription.updatedAt?.toISOString() || (/* @__PURE__ */ new Date()).toISOString(),
      isLifetime: subscription.isLifetime || false,
      isCompanyAccount: subscription.isCompanyAccount || false,
      companyName: subscription.companyName || null,
      specialNotes: subscription.specialNotes || null
    };
    res.json({
      success: true,
      subscription: formattedSubscription
    });
  } catch (error) {
    console.error("\u274C Get subscription details error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
var createPortalSession = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const [user] = await db.select().from(users).where(eq13(users.id, userId));
    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({
        success: false,
        error: "No Stripe customer found"
      });
    }
    const session2 = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || process.env.CLIENT_URL}/profile`
    });
    res.json({ success: true, url: session2.url });
  } catch (error) {
    console.error("\u274C Create portal session error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
var cancelSubscription = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const subscription = await getActiveSubscription(userId);
    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(404).json({
        success: false,
        error: "No active subscription found"
      });
    }
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });
    await db.update(subscriptions).set({
      cancelAtPeriodEnd: true,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq13(subscriptions.id, subscription.id));
    res.json({
      success: true,
      message: "Subscription will cancel at period end"
    });
  } catch (error) {
    console.error("\u274C Cancel subscription error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
var reactivateSubscription = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const subscription = await getActiveSubscription(userId);
    if (!subscription || !subscription.cancelAtPeriodEnd || !subscription.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        error: "Subscription is not scheduled for cancellation"
      });
    }
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false
    });
    await db.update(subscriptions).set({
      cancelAtPeriodEnd: false,
      canceledAt: null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq13(subscriptions.id, subscription.id));
    res.json({
      success: true,
      message: "Subscription reactivated"
    });
  } catch (error) {
    console.error("\u274C Reactivate subscription error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
var createSetupIntent = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { plan = "pro" } = req.body;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const [user] = await db.select().from(users).where(eq13(users.id, userId));
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    const existingSubscription = await getActiveSubscription(userId);
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        error: "You already have an active subscription"
      });
    }
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || void 0,
        metadata: { userId: user.id.toString() }
      });
      customerId = customer.id;
      await db.update(users).set({ stripeCustomerId: customerId }).where(eq13(users.id, userId));
    }
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      metadata: {
        userId: user.id.toString(),
        plan
        // ✅ Store plan
      }
    });
    console.log(`\u2705 Setup intent created for user ${userId} - ${plan} plan`);
    res.json({
      success: true,
      clientSecret: setupIntent.client_secret,
      customerId,
      publishableKey: STRIPE_CONFIG.publishableKey,
      plan
      // ✅ Send back to frontend
    });
  } catch (error) {
    console.error("\u274C Create setup intent error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
var confirmSubscription = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { paymentMethodId, plan = "pro" } = req.body;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    if (!paymentMethodId) {
      return res.status(400).json({ success: false, error: "Payment method required" });
    }
    if (!["starter", "pro", "team"].includes(plan)) {
      return res.status(400).json({ success: false, error: "Invalid plan" });
    }
    const [user] = await db.select().from(users).where(eq13(users.id, userId));
    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ success: false, error: "Customer not found" });
    }
    console.log(
      `\u{1F4DD} Confirming ${plan} subscription for user ${userId}...`
    );
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.stripeCustomerId
    });
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });
    const priceId = getPriceId(plan);
    const subscription = await stripe.subscriptions.create({
      customer: user.stripeCustomerId,
      items: [{ price: priceId }],
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription"
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        userId: user.id.toString(),
        plan
        // ✅ Store plan
      }
    });
    const subData = subscription;
    const subscriptionItem = subData.items?.data?.[0];
    let periodStart = subscriptionItem?.current_period_start || subData.billing_cycle_anchor || subData.created;
    let periodEnd = subscriptionItem?.current_period_end;
    if (!periodStart || !periodEnd) {
      console.error(`\u274C Missing period timestamps from Stripe`);
      return res.status(500).json({
        success: false,
        error: "Invalid subscription data from Stripe"
      });
    }
    const toDate = (ts) => {
      if (!ts) return null;
      const timestamp2 = Number(ts);
      if (isNaN(timestamp2)) return null;
      return new Date(timestamp2 * 1e3);
    };
    const currentPeriodStart = toDate(periodStart);
    const currentPeriodEnd = toDate(periodEnd);
    if (!currentPeriodStart || !currentPeriodEnd || isNaN(currentPeriodStart.getTime()) || isNaN(currentPeriodEnd.getTime())) {
      console.error(`\u274C Failed to convert timestamps to valid dates`);
      return res.status(500).json({
        success: false,
        error: "Failed to process subscription dates"
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 2e3));
    const [webhookCreated] = await db.select().from(subscriptions).where(eq13(subscriptions.stripeSubscriptionId, subscription.id));
    if (webhookCreated) {
      return res.json({
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          plan: webhookCreated.plan,
          currentPeriodEnd: currentPeriodEnd.toISOString()
        }
      });
    }
    await db.insert(subscriptions).values({
      userId: user.id,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: user.stripeCustomerId,
      stripePriceId: priceId,
      status: subscription.status,
      plan,
      // ✅ Store plan
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
      trialStart: null,
      trialEnd: null
    });
    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan,
        currentPeriodEnd: currentPeriodEnd.toISOString()
      }
    });
  } catch (error) {
    console.error("\u274C Confirm subscription error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// routes/subscription.ts
var router30 = express9.Router();
router30.post("/create-setup-intent", requireAuth, createSetupIntent);
router30.post("/confirm", requireAuth, confirmSubscription);
router30.post("/create-checkout", requireAuth, createCheckoutSession);
router30.get("/status", requireAuth, getSubscriptionStatus);
router30.get("/details", requireAuth, getSubscriptionDetails);
router30.post("/portal", requireAuth, createPortalSession);
router30.post("/cancel", requireAuth, cancelSubscription);
router30.post("/reactivate", requireAuth, reactivateSubscription);
var subscription_default = router30;

// utils/screenshotSaver.ts
import { Router as Router22 } from "express";
import multer6 from "multer";
var router31 = Router22();
var upload6 = multer6({
  storage: multer6.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB limit
  }
});
router31.post("/upload-thumbnail", upload6.single("thumbnail"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const result = await cloudinaryClient_default.uploader.upload(base64Image, {
      folder: "video-editor/thumbnails",
      // Organize in folders
      resource_type: "image",
      transformation: [
        { width: 640, height: 360, crop: "limit" },
        // Optimize size
        { quality: "auto" },
        // Auto quality
        { fetch_format: "auto" }
        // Auto format (WebP when supported)
      ]
    });
    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      thumbnailUrl: result.secure_url
      // You can also generate thumbnail URLs
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({
      error: "Failed to upload thumbnail",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
var screenshotSaver_default = router31;

// controllers/subscription/webhookController.ts
import { eq as eq14 } from "drizzle-orm";
function safeTimestampToDate(timestamp2) {
  if (!timestamp2) return null;
  const ts = Number(timestamp2);
  if (isNaN(ts) || ts <= 0) return null;
  const date = new Date(ts * 1e3);
  if (isNaN(date.getTime())) return null;
  return date;
}
var handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  if (!sig) {
    console.error("\u274C No stripe-signature header");
    return res.status(400).send("No signature");
  }
  console.log("\u{1F50D} Webhook request details:");
  console.log("   - Body type:", typeof req.body);
  console.log("   - Body is Buffer:", Buffer.isBuffer(req.body));
  console.log("   - Signature present:", !!sig);
  console.log("\n\u{1F41B} ============ WEBHOOK DEBUG ============");
  console.log("Request URL:", req.url);
  console.log("Request path:", req.path);
  console.log("Body type:", typeof req.body);
  console.log("Body is Buffer:", Buffer.isBuffer(req.body));
  console.log("Body is Object:", typeof req.body === "object" && !Buffer.isBuffer(req.body));
  console.log("Body length:", req.body?.length);
  console.log("Headers:", {
    "content-type": req.headers["content-type"],
    "stripe-signature": req.headers["stripe-signature"]?.substring(0, 20) + "..."
  });
  console.log("Webhook secret:", STRIPE_CONFIG.webhookSecret.substring(0, 20) + "...");
  console.log("============ END DEBUG ============\n");
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      // This should be a Buffer
      sig,
      STRIPE_CONFIG.webhookSecret
    );
    console.log(`\u2705 Webhook verified: ${event.type}`);
  } catch (err) {
    console.error("\u274C Webhook signature verification failed:", err.message);
    console.error("   - Webhook secret used:", STRIPE_CONFIG.webhookSecret.substring(0, 15) + "...");
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  console.log(`\u{1F514} Processing webhook: ${event.type}`);
  try {
    switch (event.type) {
      // ... rest of your existing switch cases stay the same ...
      case "checkout.session.completed": {
        const session2 = event.data.object;
        const userId = session2.metadata?.userId;
        if (userId && session2.subscription) {
          const subscriptionId = typeof session2.subscription === "string" ? session2.subscription : session2.subscription.id;
          const stripeSubscription = await stripe.subscriptions.retrieve(
            subscriptionId
          );
          const subData = stripeSubscription;
          const stripePriceId = stripeSubscription.items.data[0].price.id;
          const plan = getPlanFromPriceId(stripePriceId) || "pro";
          const periodStart = subData.current_period_start || subData.created;
          const periodEnd = subData.current_period_end;
          if (!periodStart || !periodEnd) {
            console.error("\u274C Cannot determine period dates for subscription");
            break;
          }
          const periodStartDate = safeTimestampToDate(periodStart);
          const periodEndDate = safeTimestampToDate(periodEnd);
          if (!periodStartDate || !periodEndDate) {
            console.error("\u274C Invalid period dates");
            break;
          }
          await db.insert(subscriptions).values({
            userId: parseInt(userId, 10),
            stripeSubscriptionId: stripeSubscription.id,
            stripeCustomerId: typeof stripeSubscription.customer === "string" ? stripeSubscription.customer : stripeSubscription.customer?.id || "",
            stripePriceId: stripeSubscription.items.data[0].price.id,
            status: stripeSubscription.status,
            plan,
            currentPeriodStart: periodStartDate,
            currentPeriodEnd: periodEndDate,
            cancelAtPeriodEnd: subData.cancel_at_period_end || false,
            trialStart: null,
            trialEnd: null
          });
          console.log(`\u2705 ${plan} subscription created for user ${userId}`);
        }
        break;
      }
      case "customer.subscription.created": {
        const stripeSubscription = event.data.object;
        const subData = stripeSubscription;
        console.log(`\u{1F4E6} Subscription created: ${stripeSubscription.id}`);
        const userId = subData.metadata?.userId;
        if (!userId) {
          console.log(`\u26A0\uFE0F No userId in metadata, skipping`);
          break;
        }
        const stripePriceId = stripeSubscription.items.data[0].price.id;
        const plan = getPlanFromPriceId(stripePriceId) || "pro";
        console.log(`   User: ${userId}, Plan: ${plan}, Status: ${stripeSubscription.status}`);
        const [existing] = await db.select().from(subscriptions).where(eq14(subscriptions.stripeSubscriptionId, stripeSubscription.id));
        if (existing) {
          console.log(`\u2139\uFE0F Subscription already exists, skipping`);
          break;
        }
        const subscriptionItem = subData.items?.data?.[0];
        const periodStartRaw = subscriptionItem?.current_period_start || subData.billing_cycle_anchor || subData.created;
        const periodEndRaw = subscriptionItem?.current_period_end;
        let periodStart = null;
        let periodEnd = null;
        try {
          if (periodStartRaw) {
            periodStart = new Date(Number(periodStartRaw) * 1e3);
          }
          if (periodEndRaw) {
            periodEnd = new Date(Number(periodEndRaw) * 1e3);
          }
        } catch (dateError) {
          console.error(`\u274C Error converting dates:`, dateError.message);
        }
        if (!periodStart || !periodEnd || isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
          console.error(`\u274C Invalid period dates`);
          break;
        }
        await db.insert(subscriptions).values({
          userId: parseInt(userId, 10),
          stripeSubscriptionId: stripeSubscription.id,
          stripeCustomerId: typeof stripeSubscription.customer === "string" ? stripeSubscription.customer : stripeSubscription.customer?.id || "",
          stripePriceId: stripeSubscription.items.data[0].price.id,
          status: stripeSubscription.status,
          plan,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: subData.cancel_at_period_end || false,
          trialStart: null,
          trialEnd: null
        });
        console.log(`\u2705 ${plan} subscription created in database`);
        break;
      }
      case "customer.subscription.updated": {
        const stripeSubscription = event.data.object;
        const subData = stripeSubscription;
        console.log(`\u{1F4DD} Updating subscription: ${stripeSubscription.id}`);
        const [existingSubscription] = await db.select().from(subscriptions).where(eq14(subscriptions.stripeSubscriptionId, stripeSubscription.id));
        if (!existingSubscription) {
          console.log(`\u26A0\uFE0F Subscription not found in database`);
          break;
        }
        if (existingSubscription.isLifetime) {
          console.log(`\u23ED\uFE0F Ignoring webhook for lifetime user`);
          break;
        }
        const updateData = {
          status: stripeSubscription.status,
          updatedAt: /* @__PURE__ */ new Date()
        };
        const subscriptionItem = subData.items?.data?.[0];
        const periodStartRaw = subscriptionItem?.current_period_start;
        const periodEndRaw = subscriptionItem?.current_period_end;
        if (periodStartRaw) {
          const periodStart = new Date(Number(periodStartRaw) * 1e3);
          if (!isNaN(periodStart.getTime())) {
            updateData.currentPeriodStart = periodStart;
          }
        }
        if (periodEndRaw) {
          const periodEnd = new Date(Number(periodEndRaw) * 1e3);
          if (!isNaN(periodEnd.getTime())) {
            updateData.currentPeriodEnd = periodEnd;
          }
        }
        if (subData.cancel_at_period_end !== void 0) {
          updateData.cancelAtPeriodEnd = Boolean(subData.cancel_at_period_end);
        }
        const canceledAt = safeTimestampToDate(subData.canceled_at);
        if (canceledAt) {
          updateData.canceledAt = canceledAt;
        } else if (subData.canceled_at === null) {
          updateData.canceledAt = null;
        }
        await db.update(subscriptions).set(updateData).where(eq14(subscriptions.id, existingSubscription.id));
        console.log(`\u2705 Subscription updated`);
        break;
      }
      case "customer.subscription.deleted": {
        const stripeSubscription = event.data.object;
        const [existingSubscription] = await db.select().from(subscriptions).where(eq14(subscriptions.stripeSubscriptionId, stripeSubscription.id));
        if (existingSubscription) {
          if (existingSubscription.isLifetime) {
            console.log(`\u23ED\uFE0F Ignoring deletion webhook for lifetime user`);
            break;
          }
          await db.update(subscriptions).set({
            status: "canceled",
            canceledAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq14(subscriptions.id, existingSubscription.id));
          console.log(`\u274C Subscription canceled`);
        }
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        if (subscriptionId && typeof subscriptionId === "string") {
          const [existingSubscription] = await db.select().from(subscriptions).where(eq14(subscriptions.stripeSubscriptionId, subscriptionId));
          if (existingSubscription) {
            if (existingSubscription.isLifetime) {
              console.log(`\u23ED\uFE0F Ignoring payment webhook for lifetime user`);
              break;
            }
            if (existingSubscription.status === "past_due") {
              await db.update(subscriptions).set({
                status: "active",
                updatedAt: /* @__PURE__ */ new Date()
              }).where(eq14(subscriptions.id, existingSubscription.id));
              console.log(`\u2705 Payment succeeded`);
            }
          }
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        if (subscriptionId && typeof subscriptionId === "string") {
          const [existingSubscription] = await db.select().from(subscriptions).where(eq14(subscriptions.stripeSubscriptionId, subscriptionId));
          if (existingSubscription) {
            if (existingSubscription.isLifetime) {
              console.log(`\u23ED\uFE0F Ignoring payment failure for lifetime user`);
              break;
            }
            await db.update(subscriptions).set({
              status: "past_due",
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq14(subscriptions.id, existingSubscription.id));
            console.log(`\u26A0\uFE0F Payment failed`);
          }
        }
        break;
      }
      default:
        console.log(`\u2139\uFE0F Unhandled event: ${event.type}`);
    }
    res.json({ received: true });
  } catch (error) {
    console.error("\u274C Webhook handler error:", error.message);
    console.error("   Event type:", event?.type);
    console.error("   Stack:", error.stack);
    res.status(500).json({ error: error.message });
  }
};

// routes/admin.ts
import { Router as Router23 } from "express";

// middleware/adminAuth.ts
import jwt5 from "jsonwebtoken";
import { eq as eq16, gte as gte3 } from "drizzle-orm";

// utils/auditLogger.ts
import { and as and7, desc as desc7, eq as eq15, gte as gte2 } from "drizzle-orm";
var logAdminAction = async (req, data) => {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";
    const sanitizedDetails = data.details ? sanitizeDetails(data.details) : null;
    await db.insert(adminAuditLogs).values({
      adminId: data.adminId,
      action: data.action,
      targetType: data.targetType || null,
      targetId: data.targetId || null,
      targetEmail: data.targetEmail || null,
      details: sanitizedDetails,
      ipAddress,
      userAgent,
      status: data.status,
      errorMessage: data.errorMessage || null
    });
    const emoji = data.status === "SUCCESS" ? "\u2705" : "\u274C";
    console.log(
      `${emoji} [AUDIT] Admin ${data.adminId} | ${data.action} | ${data.status}` + (data.targetEmail ? ` | Target: ${data.targetEmail}` : "") + (data.errorMessage ? ` | Error: ${data.errorMessage}` : "")
    );
  } catch (error) {
    console.error("\u274C CRITICAL: Failed to log admin action:", error);
    console.error("Failed audit log data:", {
      adminId: data.adminId,
      action: data.action,
      status: data.status
    });
  }
};
var sanitizeDetails = (details) => {
  if (!details || typeof details !== "object") {
    return details;
  }
  const sanitized = { ...details };
  const sensitiveFields = [
    "password",
    "passwordHash",
    "token",
    "secret",
    "apiKey",
    "privateKey",
    "creditCard",
    "ssn",
    "twoFactorSecret"
  ];
  const removeSensitiveFields = (obj) => {
    if (!obj || typeof obj !== "object") {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => removeSensitiveFields(item));
    }
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveFields.some(
        (field) => lowerKey.includes(field.toLowerCase())
      );
      if (isSensitive) {
        cleaned[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        cleaned[key] = removeSensitiveFields(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  };
  return removeSensitiveFields(sanitized);
};
var ADMIN_ACTIONS = {
  // ========== AUTHENTICATION ==========
  LOGIN: "ADMIN_LOGIN",
  LOGIN_FAILED: "ADMIN_LOGIN_FAILED",
  LOGOUT: "ADMIN_LOGOUT",
  REAUTH_SUCCESS: "ADMIN_REAUTH_SUCCESS",
  REAUTH_FAILED: "ADMIN_REAUTH_FAILED",
  EXTEND_SESSION: "ADMIN_EXTEND_SESSION",
  CHANGE_PASSWORD: "ADMIN_CHANGE_PASSWORD",
  UPDATE_PROFILE: "ADMIN_UPDATE_PROFILE",
  // ========== USER MANAGEMENT ==========
  VIEW_USER_LIST: "VIEW_USER_LIST",
  VIEW_USER_DETAILS: "VIEW_USER_DETAILS",
  DELETE_USER: "DELETE_USER",
  DELETE_USER_FAILED: "DELETE_USER_FAILED",
  CREATE_LIFETIME_ACCOUNT: "CREATE_LIFETIME_ACCOUNT",
  CREATE_LIFETIME_ACCOUNT_FAILED: "CREATE_LIFETIME_ACCOUNT_FAILED",
  // ========== SUBSCRIPTION MANAGEMENT ==========
  GRANT_LIFETIME: "GRANT_LIFETIME_ACCESS",
  GRANT_LIFETIME_FAILED: "GRANT_LIFETIME_ACCESS_FAILED",
  REVOKE_LIFETIME: "REVOKE_LIFETIME_ACCESS",
  REVOKE_LIFETIME_FAILED: "REVOKE_LIFETIME_ACCESS_FAILED",
  // ========== ANALYTICS ==========
  VIEW_DASHBOARD: "VIEW_ADMIN_DASHBOARD",
  VIEW_ANALYTICS: "VIEW_ANALYTICS",
  EXPORT_DATA: "EXPORT_DATA",
  // ========== SECURITY ==========
  UNAUTHORIZED_ACCESS_ATTEMPT: "UNAUTHORIZED_ACCESS_ATTEMPT",
  INACTIVE_ADMIN_ACCESS_ATTEMPT: "INACTIVE_ADMIN_ACCESS_ATTEMPT",
  SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY"
};

// middleware/adminAuth.ts
var JWT_SECRET2 = process.env.JWT_SECRET;
if (!JWT_SECRET2) {
  throw new Error("CRITICAL: JWT_SECRET environment variable is not set!");
}
var ADMIN_JWT_EXPIRES_IN = "1hr";
var verifyAdminToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "No admin token provided"
      });
    }
    const token = authHeader.substring(7);
    const [blacklisted] = await db.select().from(blacklistedTokens).where(eq16(blacklistedTokens.token, token)).limit(1);
    if (blacklisted) {
      return res.status(401).json({
        success: false,
        error: "Token has been revoked. Please login again."
      });
    }
    let decoded;
    try {
      decoded = jwt5.verify(token, JWT_SECRET2);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          error: "Admin session expired. Please login again."
        });
      }
      return res.status(401).json({
        success: false,
        error: "Invalid admin token"
      });
    }
    const [admin] = await db.select().from(adminUsers).where(eq16(adminUsers.id, decoded.adminId));
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: "Admin account not found"
      });
    }
    if (!admin.active) {
      await logAdminAction(req, {
        adminId: admin.id,
        action: ADMIN_ACTIONS.INACTIVE_ADMIN_ACCESS_ATTEMPT,
        status: "FAILED",
        errorMessage: "Attempted access with inactive account"
      });
      return res.status(401).json({
        success: false,
        error: "Admin account is disabled"
      });
    }
    if (admin.passwordChangedAt) {
      const tokenIssuedAt = new Date(decoded.iat * 1e3);
      const passwordChangedAt = new Date(admin.passwordChangedAt);
      if (tokenIssuedAt < passwordChangedAt) {
        return res.status(401).json({
          success: false,
          error: "Password was changed. Please login again."
        });
      }
    }
    req.admin = {
      adminId: admin.id,
      email: admin.email,
      role: admin.role
    };
    next();
  } catch (error) {
    console.error("\u274C Admin auth error:", error);
    return res.status(401).json({
      success: false,
      error: "Authentication failed"
    });
  }
};
var requireReAuth = () => {
  return (req, res, next) => {
    const reAuthToken = req.headers["x-reauth-token"];
    if (!reAuthToken) {
      return res.status(403).json({
        success: false,
        error: "This critical operation requires password confirmation",
        requiresReAuth: true
      });
    }
    try {
      const decoded = jwt5.verify(reAuthToken, JWT_SECRET2);
      const tokenAge = Date.now() - decoded.iat * 1e3;
      if (tokenAge > 2 * 60 * 1e3) {
        return res.status(403).json({
          success: false,
          error: "Re-authentication expired. Please confirm password again.",
          requiresReAuth: true
        });
      }
      if (decoded.adminId !== req.admin?.adminId) {
        return res.status(403).json({
          success: false,
          error: "Invalid re-authentication token"
        });
      }
      next();
    } catch (error) {
      return res.status(403).json({
        success: false,
        error: "Invalid re-authentication. Please confirm password.",
        requiresReAuth: true
      });
    }
  };
};
var blacklistToken2 = async (token, expiresAt) => {
  try {
    await db.insert(blacklistedTokens).values({
      token,
      expiresAt
    });
  } catch (error) {
    console.error("\u274C Failed to blacklist token:", error);
  }
};

// controllers/admin/authController.ts
import bcrypt2 from "bcryptjs";
import jwt6 from "jsonwebtoken";
import { eq as eq17 } from "drizzle-orm";
var JWT_SECRET3 = process.env.JWT_SECRET;
if (!JWT_SECRET3) {
  throw new Error("CRITICAL: JWT_SECRET environment variable is not set!");
}
var ADMIN_PASSWORD_REQUIREMENTS = {
  minLength: 14,
  // Longer than users
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
};
var validateAdminPassword = (password) => {
  const errors = [];
  if (password.length < ADMIN_PASSWORD_REQUIREMENTS.minLength) {
    errors.push(
      `Password must be at least ${ADMIN_PASSWORD_REQUIREMENTS.minLength} characters`
    );
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain uppercase letters");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain lowercase letters");
  }
  if (!/\d/.test(password)) {
    errors.push("Password must contain numbers");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain special characters");
  }
  return { valid: errors.length === 0, errors };
};
var adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password required"
      });
    }
    const [admin] = await db.select().from(adminUsers).where(eq17(adminUsers.email, email.toLowerCase()));
    if (!admin || !admin.active) {
      if (admin) {
        await logAdminAction(req, {
          adminId: admin.id,
          action: ADMIN_ACTIONS.LOGIN_FAILED,
          status: "FAILED",
          targetEmail: email,
          errorMessage: admin.active ? "Invalid password" : "Account disabled"
        });
      }
      return res.status(401).json({
        success: false,
        error: "Invalid credentials"
      });
    }
    const isValid = await bcrypt2.compare(password, admin.passwordHash);
    if (!isValid) {
      await logAdminAction(req, {
        adminId: admin.id,
        action: ADMIN_ACTIONS.LOGIN_FAILED,
        status: "FAILED",
        targetEmail: email,
        errorMessage: "Invalid password"
      });
      return res.status(401).json({
        success: false,
        error: "Invalid credentials"
      });
    }
    await db.update(adminUsers).set({ lastLogin: /* @__PURE__ */ new Date() }).where(eq17(adminUsers.id, admin.id));
    const token = jwt6.sign(
      {
        adminId: admin.id,
        email: admin.email,
        role: admin.role
      },
      JWT_SECRET3,
      { expiresIn: ADMIN_JWT_EXPIRES_IN }
    );
    await logAdminAction(req, {
      adminId: admin.id,
      action: ADMIN_ACTIONS.LOGIN,
      status: "SUCCESS",
      details: {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"]
      }
    });
    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      },
      expiresIn: ADMIN_JWT_EXPIRES_IN,
      // ✅ Warn about session timeout
      sessionWarning: "Admin sessions expire after 1 hour for security."
    });
  } catch (error) {
    console.error("\u274C Admin login error:", error);
    res.status(500).json({
      success: false,
      error: "Login failed"
    });
  }
};
var adminLogout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const admin = req.admin;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const expiresAt = /* @__PURE__ */ new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      await blacklistToken2(token, expiresAt);
    }
    if (admin) {
      await logAdminAction(req, {
        adminId: admin.adminId,
        action: ADMIN_ACTIONS.LOGOUT,
        status: "SUCCESS"
      });
    }
    res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("\u274C Admin logout error:", error);
    res.status(500).json({
      success: false,
      error: "Logout failed"
    });
  }
};
var createFirstAdmin = async (req, res) => {
  try {
    const { email, password, name, setupKey } = req.body;
    if (setupKey !== process.env.ADMIN_SETUP_KEY) {
      return res.status(401).json({
        success: false,
        error: "Invalid setup key"
      });
    }
    const existingAdmins = await db.select().from(adminUsers).limit(1);
    if (existingAdmins.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Admin already exists"
      });
    }
    const passwordCheck = validateAdminPassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        error: passwordCheck.errors.join(". ")
      });
    }
    const passwordHash = await bcrypt2.hash(password, 12);
    const [newAdmin] = await db.insert(adminUsers).values({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: "admin"
      // Since all admins are equal
    }).returning();
    console.log(`\u2705 First admin created: ${newAdmin.email}`);
    res.json({
      success: true,
      message: "Admin created successfully",
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name
      }
    });
  } catch (error) {
    console.error("\u274C Create admin error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create admin"
    });
  }
};
var generateReAuthToken = async (req, res) => {
  try {
    const { password } = req.body;
    const admin = req.admin;
    if (!admin || !password) {
      return res.status(400).json({
        success: false,
        error: "Password required for confirmation"
      });
    }
    const [adminUser] = await db.select().from(adminUsers).where(eq17(adminUsers.id, admin.adminId));
    if (!adminUser) {
      return res.status(401).json({
        success: false,
        error: "Admin not found"
      });
    }
    const isValid = await bcrypt2.compare(password, adminUser.passwordHash);
    if (!isValid) {
      await logAdminAction(req, {
        adminId: admin.adminId,
        action: ADMIN_ACTIONS.REAUTH_FAILED,
        status: "FAILED",
        errorMessage: "Invalid password"
      });
      return res.status(401).json({
        success: false,
        error: "Invalid password"
      });
    }
    const reAuthToken = jwt6.sign(
      {
        adminId: admin.adminId,
        purpose: "reauth"
      },
      JWT_SECRET3,
      { expiresIn: "2m" }
    );
    await logAdminAction(req, {
      adminId: admin.adminId,
      action: ADMIN_ACTIONS.REAUTH_SUCCESS,
      status: "SUCCESS"
    });
    res.json({
      success: true,
      reAuthToken,
      expiresIn: "2m",
      message: "Password confirmed. You have 2 minutes to complete this action."
    });
  } catch (error) {
    console.error("\u274C Re-auth error:", error);
    res.status(500).json({
      success: false,
      error: "Re-authentication failed"
    });
  }
};
var createAdminUser = async (req, res) => {
  const creatorAdminId = req.admin?.adminId;
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: "Email, password, and name are required"
      });
    }
    const passwordCheck = validateAdminPassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        error: passwordCheck.errors.join(". ")
      });
    }
    const [existingAdmin] = await db.select().from(adminUsers).where(eq17(adminUsers.email, email.toLowerCase()));
    if (existingAdmin) {
      await logAdminAction(req, {
        adminId: creatorAdminId,
        action: "CREATE_ADMIN_USER_FAILED",
        targetType: "ADMIN",
        targetEmail: email,
        status: "FAILED",
        errorMessage: "Email already exists"
      });
      return res.status(400).json({
        success: false,
        error: "An admin with this email already exists"
      });
    }
    const passwordHash = await bcrypt2.hash(password, 12);
    const [newAdmin] = await db.insert(adminUsers).values({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: "admin",
      // All admins have equal access
      active: true
    }).returning();
    await logAdminAction(req, {
      adminId: creatorAdminId,
      action: "CREATE_ADMIN_USER",
      targetType: "ADMIN",
      targetId: newAdmin.id,
      targetEmail: newAdmin.email,
      status: "SUCCESS",
      details: {
        createdAdminName: newAdmin.name,
        createdAdminEmail: newAdmin.email
      }
    });
    console.log(
      `\u2705 New admin created: ${newAdmin.email} by admin ${creatorAdminId}`
    );
    res.json({
      success: true,
      message: "Admin user created successfully",
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role
      }
    });
  } catch (error) {
    console.error("\u274C Create admin user error:", error);
    await logAdminAction(req, {
      adminId: creatorAdminId,
      action: "CREATE_ADMIN_USER_FAILED",
      targetType: "ADMIN",
      targetEmail: req.body.email,
      status: "FAILED",
      errorMessage: error.message
    });
    res.status(500).json({
      success: false,
      error: "Failed to create admin user"
    });
  }
};
var extendAdminSession = async (req, res) => {
  try {
    const admin = req.admin;
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }
    const newToken = jwt6.sign(
      {
        adminId: admin.adminId,
        email: admin.email,
        role: admin.role
      },
      JWT_SECRET3,
      { expiresIn: ADMIN_JWT_EXPIRES_IN }
    );
    await logAdminAction(req, {
      adminId: admin.adminId,
      action: "EXTEND_SESSION",
      status: "SUCCESS"
    });
    res.json({
      success: true,
      token: newToken,
      expiresIn: ADMIN_JWT_EXPIRES_IN,
      message: "Session extended successfully"
    });
  } catch (error) {
    console.error("\u274C Extend session error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to extend session"
    });
  }
};
var changeAdminPassword = async (req, res) => {
  try {
    const admin = req.admin;
    const { currentPassword, newPassword, logoutAllDevices } = req.body;
    console.log("\u{1F510} Change password request received for admin:", admin.adminId);
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password and new password are required"
      });
    }
    if (newPassword.length < 14) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 14 characters"
      });
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: "Password must contain uppercase, lowercase, number, and special character"
      });
    }
    const adminUsers_result = await db.select().from(adminUsers).where(eq17(adminUsers.id, admin.adminId)).limit(1);
    console.log("\u{1F4CA} Query result:", {
      found: adminUsers_result.length > 0,
      fields: adminUsers_result[0] ? Object.keys(adminUsers_result[0]) : []
    });
    const [adminUser] = adminUsers_result;
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        error: "Admin not found"
      });
    }
    if (!adminUser.passwordHash) {
      console.error("\u274C passwordHash is missing from admin user:", {
        id: adminUser.id,
        email: adminUser.email,
        availableFields: Object.keys(adminUser)
      });
      return res.status(500).json({
        success: false,
        error: "Password hash not found in database"
      });
    }
    console.log("\u2705 passwordHash found, comparing passwords...");
    const isValidPassword = await bcrypt2.compare(
      currentPassword,
      adminUser.passwordHash
    );
    if (!isValidPassword) {
      console.log("\u274C Current password is incorrect");
      await logAdminAction(req, {
        adminId: admin.adminId,
        action: "CHANGE_PASSWORD",
        status: "FAILED",
        errorMessage: "Invalid current password"
      });
      return res.status(400).json({
        success: false,
        error: "Current password is incorrect"
      });
    }
    console.log("\u2705 Current password verified, hashing new password...");
    const hashedPassword = await bcrypt2.hash(newPassword, 12);
    const updateData = {
      passwordHash: hashedPassword
    };
    if (logoutAllDevices) {
      updateData.passwordChangedAt = /* @__PURE__ */ new Date();
      console.log("\u{1F504} Will log out all devices");
    }
    console.log("\u{1F4BE} Updating password in database...");
    await db.update(adminUsers).set(updateData).where(eq17(adminUsers.id, admin.adminId));
    console.log("\u2705 Password updated successfully");
    await logAdminAction(req, {
      adminId: admin.adminId,
      action: "CHANGE_PASSWORD",
      status: "SUCCESS",
      details: {
        logoutAllDevices: logoutAllDevices || false
      }
    });
    res.json({
      success: true,
      message: logoutAllDevices ? "Password changed successfully. All sessions have been logged out." : "Password changed successfully"
    });
  } catch (error) {
    console.error("\u274C Change password error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      error: "Failed to change password"
    });
  }
};
var updateAdminProfile = async (req, res) => {
  try {
    const admin = req.admin;
    const { name } = req.body;
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Name must be at least 2 characters"
      });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        error: "Name must be less than 100 characters"
      });
    }
    await db.update(adminUsers).set({
      name: name.trim()
    }).where(eq17(adminUsers.id, admin.adminId));
    const [updatedAdmin] = await db.select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
      lastLogin: adminUsers.lastLogin
    }).from(adminUsers).where(eq17(adminUsers.id, admin.adminId)).limit(1);
    await logAdminAction(req, {
      adminId: admin.adminId,
      action: "UPDATE_PROFILE",
      status: "SUCCESS",
      details: {
        oldName: admin.name,
        newName: name.trim()
      }
    });
    res.json({
      success: true,
      message: "Profile updated successfully",
      admin: updatedAdmin
      // ✅ Include updated admin
    });
  } catch (error) {
    console.error("\u274C Update profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update profile"
    });
  }
};

// controllers/admin/analyticsController.ts
import { sql as sql2, count, eq as eq18, and as and8, gte as gte4, desc as desc8 } from "drizzle-orm";
import jwt7 from "jsonwebtoken";
var getDashboardStats = async (req, res) => {
  try {
    const now = /* @__PURE__ */ new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
    const [totalUsersResult] = await db.select({ count: count() }).from(users);
    const totalUsers = totalUsersResult.count;
    const [activeSubsResult] = await db.select({ count: count() }).from(subscriptions).where(sql2`status IN ('active', 'trialing', 'free_trial')`);
    const activeSubscriptions = activeSubsResult.count;
    const [paidSubsResult] = await db.select({ count: count() }).from(subscriptions).where(sql2`status IN ('active', 'trialing')`);
    const paidSubscriptions = paidSubsResult.count;
    const [freeTrialResult] = await db.select({ count: count() }).from(subscriptions).where(eq18(subscriptions.status, "free_trial"));
    const freeTrialUsers = freeTrialResult.count;
    const [newUsers7d] = await db.select({ count: count() }).from(users).where(gte4(users.createdAt, last7Days));
    const [newUsers30d] = await db.select({ count: count() }).from(users).where(gte4(users.createdAt, last30Days));
    const [visits7d] = await db.select({ count: count() }).from(pageVisits).where(gte4(pageVisits.visitedAt, last7Days));
    const [visits30d] = await db.select({ count: count() }).from(pageVisits).where(gte4(pageVisits.visitedAt, last30Days));
    const [totalProjectsResult] = await db.select({ count: count() }).from(projects);
    const totalProjects = totalProjectsResult.count;
    const [totalRendersResult] = await db.select({ count: count() }).from(renders);
    const totalRenders = totalRendersResult.count;
    const subscriptionPrice = 19.99;
    const mrr = paidSubscriptions * subscriptionPrice;
    const conversionRate = totalUsers > 0 ? (paidSubscriptions / totalUsers * 100).toFixed(2) : 0;
    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          newLast7Days: newUsers7d.count,
          newLast30Days: newUsers30d.count
        },
        subscriptions: {
          total: activeSubscriptions,
          paid: paidSubscriptions,
          freeTrial: freeTrialUsers,
          conversionRate: `${conversionRate}%`
        },
        revenue: {
          mrr: `$${mrr.toFixed(2)}`,
          arr: `$${(mrr * 12).toFixed(2)}`
        },
        visits: {
          last7Days: visits7d.count,
          last30Days: visits30d.count
        },
        content: {
          totalProjects,
          totalRenders
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
var getVisitAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = /* @__PURE__ */ new Date();
    startDate.setDate(startDate.getDate() - days);
    const [totalVisits] = await db.select({ count: count() }).from(pageVisits).where(gte4(pageVisits.visitedAt, startDate));
    const [uniqueVisitors] = await db.select({
      count: sql2`COUNT(DISTINCT ${pageVisits.sessionId})`
    }).from(pageVisits).where(gte4(pageVisits.visitedAt, startDate));
    const visitsByPage = await db.select({
      page: pageVisits.page,
      visits: count()
    }).from(pageVisits).where(gte4(pageVisits.visitedAt, startDate)).groupBy(pageVisits.page).orderBy(desc8(count())).limit(20);
    const topReferrers = await db.select({
      referrer: pageVisits.referrer,
      visits: count()
    }).from(pageVisits).where(
      and8(
        gte4(pageVisits.visitedAt, startDate),
        sql2`${pageVisits.referrer} IS NOT NULL AND ${pageVisits.referrer} != ''`
      )
    ).groupBy(pageVisits.referrer).orderBy(desc8(count())).limit(10);
    const visitsByDate = await db.select({
      date: sql2`DATE(${pageVisits.visitedAt})`,
      visits: count(),
      uniqueVisitors: sql2`COUNT(DISTINCT ${pageVisits.sessionId})`
    }).from(pageVisits).where(gte4(pageVisits.visitedAt, startDate)).groupBy(sql2`DATE(${pageVisits.visitedAt})`).orderBy(sql2`DATE(${pageVisits.visitedAt})`);
    res.json({
      success: true,
      analytics: {
        summary: {
          totalVisits: totalVisits.count,
          uniqueVisitors: Number(uniqueVisitors.count),
          avgPageViewsPerVisitor: Number(uniqueVisitors.count) > 0 ? (totalVisits.count / Number(uniqueVisitors.count)).toFixed(2) : 0
        },
        visitsByPage,
        topReferrers,
        visitsByDate,
        dateRange: {
          start: startDate.toISOString(),
          end: (/* @__PURE__ */ new Date()).toISOString()
        }
      }
    });
  } catch (error) {
    console.error("Visit analytics error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
var trackAnalyticsBatch = async (req, res) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid events array"
      });
    }
    if (events.length > 50) {
      return res.status(400).json({
        success: false,
        error: "Maximum 50 events per batch"
      });
    }
    const token = req.headers.authorization?.substring(7);
    let userId = null;
    if (token) {
      try {
        const decoded = jwt7.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch {
      }
    }
    const pageViewPromises = [];
    const eventPromises = [];
    for (const event of events) {
      if (event.type === "pageView") {
        pageViewPromises.push(
          db.insert(pageVisits).values({
            userId,
            page: event.page,
            sessionId: event.sessionId,
            userAgent: event.userAgent || req.headers["user-agent"] || null,
            ipAddress: req.ip || null,
            referrer: event.referrer || req.headers.referer || null,
            visitedAt: new Date(event.timestamp)
          })
        );
      } else if (event.type === "event" || event.type === "engagement") {
        eventPromises.push(
          db.insert(analyticsEvents).values({
            userId,
            eventType: event.eventType || event.type,
            eventData: {
              page: event.page,
              timeOnPage: event.timeOnPage,
              maxScrollDepth: event.maxScrollDepth,
              ...event.eventData
            },
            createdAt: new Date(event.timestamp)
          })
        );
      }
    }
    await Promise.all([...pageViewPromises, ...eventPromises]);
    res.json({ success: true, tracked: events.length });
  } catch (error) {
    console.error("Batch analytics error:", error);
    res.status(500).json({ success: false, error: "Analytics tracking failed" });
  }
};
var getEngagementMetrics = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = /* @__PURE__ */ new Date();
    startDate.setDate(startDate.getDate() - days);
    const engagementData = await db.select({
      page: sql2`event_data->>'page'`,
      avgTimeOnPage: sql2`AVG((event_data->>'timeOnPage')::int)`,
      avgScrollDepth: sql2`AVG((event_data->>'maxScrollDepth')::int)`,
      totalSessions: count()
    }).from(analyticsEvents).where(
      and8(
        eq18(analyticsEvents.eventType, "engagement"),
        gte4(analyticsEvents.createdAt, startDate)
      )
    ).groupBy(sql2`event_data->>'page'`).orderBy(desc8(count())).limit(20);
    res.json({
      success: true,
      engagement: engagementData.map((row) => ({
        page: row.page,
        avgTimeOnPage: Math.round(Number(row.avgTimeOnPage || 0)),
        avgScrollDepth: Math.round(Number(row.avgScrollDepth || 0)),
        totalSessions: row.totalSessions
      }))
    });
  } catch (error) {
    console.error("Engagement metrics error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// controllers/admin/userManagementController.ts
import {
  eq as eq19,
  sql as sql3,
  desc as desc9,
  asc,
  ilike,
  or,
  and as and9,
  gte as gte5,
  lte as lte2,
  count as count2
} from "drizzle-orm";
var getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;
    const subscriptionFilter = req.query.subscription;
    const verifiedFilter = req.query.verified;
    const providerFilter = req.query.provider;
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder || "desc";
    let query = db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      createdAt: users.createdAt,
      verified: users.verified,
      provider: users.provider,
      stripeCustomerId: users.stripeCustomerId,
      subscriptionStatus: subscriptions.status,
      subscriptionPlan: subscriptions.plan,
      currentPeriodEnd: subscriptions.currentPeriodEnd
    }).from(users).leftJoin(
      subscriptions,
      sql3`${users.id} = ${subscriptions.userId} AND ${subscriptions.status} IN ('active', 'trialing', 'free_trial', 'lifetime', 'company')`
    );
    const conditions = [];
    if (search) {
      conditions.push(
        or(ilike(users.email, `%${search}%`), ilike(users.name, `%${search}%`))
      );
    }
    if (subscriptionFilter) {
      if (subscriptionFilter === "none") {
        conditions.push(sql3`${subscriptions.status} IS NULL`);
      } else if (subscriptionFilter === "paid") {
        conditions.push(sql3`${subscriptions.status} IN ('active', 'trialing')`);
      } else if (subscriptionFilter === "free_trial") {
        conditions.push(eq19(subscriptions.status, "free_trial"));
      } else if (subscriptionFilter === "lifetime") {
        conditions.push(eq19(subscriptions.status, "lifetime"));
      } else if (subscriptionFilter === "company") {
        conditions.push(eq19(subscriptions.status, "company"));
      } else {
        conditions.push(eq19(subscriptions.status, subscriptionFilter));
      }
    }
    if (verifiedFilter) {
      conditions.push(eq19(users.verified, verifiedFilter === "true"));
    }
    if (providerFilter) {
      if (providerFilter === "local") {
        conditions.push(
          or(eq19(users.provider, "local"), sql3`${users.provider} IS NULL`)
        );
      } else {
        conditions.push(eq19(users.provider, providerFilter));
      }
    }
    if (dateFrom) {
      conditions.push(gte5(users.createdAt, new Date(dateFrom)));
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(lte2(users.createdAt, endDate));
    }
    if (conditions.length > 0) {
      query = query.where(and9(...conditions));
    }
    const orderFunction = sortOrder === "asc" ? asc : desc9;
    if (sortBy === "name") {
      query = query.orderBy(orderFunction(users.name));
    } else if (sortBy === "email") {
      query = query.orderBy(orderFunction(users.email));
    } else {
      query = query.orderBy(orderFunction(users.createdAt));
    }
    const usersList = await query.limit(limit).offset(offset);
    let countQuery = db.select({ count: sql3`count(*)` }).from(users).leftJoin(
      subscriptions,
      sql3`${users.id} = ${subscriptions.userId} AND ${subscriptions.status} IN ('active', 'trialing', 'free_trial', 'lifetime', 'company')`
    );
    if (conditions.length > 0) {
      countQuery = countQuery.where(and9(...conditions));
    }
    const [totalResult] = await countQuery;
    res.json({
      success: true,
      users: usersList,
      pagination: {
        page,
        limit,
        total: Number(totalResult.count),
        pages: Math.ceil(Number(totalResult.count) / limit)
      }
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
var getUserDetails = async (req, res) => {
  const adminId = req.admin?.adminId;
  try {
    const userId = parseInt(req.params.userId);
    const [user] = await db.select().from(users).where(eq19(users.id, userId));
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    const userSubscriptions = await db.select().from(subscriptions).where(eq19(subscriptions.userId, userId)).orderBy(desc9(subscriptions.createdAt));
    const [projectsCount] = await db.select({ count: count2() }).from(projects).where(eq19(projects.userId, userId));
    const [rendersCount] = await db.select({ count: count2() }).from(renders).where(eq19(renders.userId, userId));
    const recentProjects = await db.select().from(projects).where(eq19(projects.userId, userId)).orderBy(desc9(projects.createdAt)).limit(5);
    const recentRenders = await db.select().from(renders).where(eq19(renders.userId, userId)).orderBy(desc9(renders.renderedAt)).limit(5);
    const thirtyDaysAgo = /* @__PURE__ */ new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [visitsCount] = await db.select({ count: count2() }).from(pageVisits).where(
      and9(
        eq19(pageVisits.userId, userId),
        gte5(pageVisits.visitedAt, thirtyDaysAgo)
      )
    );
    const [veoCount] = await db.select({ count: count2() }).from(veo3Generations).where(eq19(veo3Generations.userId, userId));
    const [imageGenCount] = await db.select({ count: count2() }).from(imageGenerations).where(eq19(imageGenerations.userId, userId));
    const recentVisits = await db.select({
      page: pageVisits.page,
      visitedAt: pageVisits.visitedAt
    }).from(pageVisits).where(eq19(pageVisits.userId, userId)).orderBy(desc9(pageVisits.visitedAt)).limit(10);
    await logAdminAction(req, {
      adminId,
      action: ADMIN_ACTIONS.VIEW_USER_DETAILS,
      targetType: "USER",
      targetId: userId,
      targetEmail: user.email,
      status: "SUCCESS"
    });
    res.json({
      success: true,
      user: {
        ...user,
        stats: {
          totalProjects: projectsCount.count,
          totalRenders: rendersCount.count,
          totalVisits: visitsCount.count,
          totalVeoGenerations: veoCount.count,
          totalImageGenerations: imageGenCount.count
        },
        subscriptions: userSubscriptions,
        recentProjects,
        recentRenders,
        recentVisits
      }
    });
  } catch (error) {
    console.error("Get user details error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
var createLifetimeAccount = async (req, res) => {
  const adminId = req.admin?.adminId;
  try {
    const { email, name, companyName, notes } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required"
      });
    }
    const [existing] = await db.select().from(users).where(eq19(users.email, email.toLowerCase().trim())).limit(1);
    if (existing) {
      await logAdminAction(req, {
        adminId,
        action: ADMIN_ACTIONS.CREATE_LIFETIME_ACCOUNT_FAILED,
        targetType: "USER",
        targetEmail: email,
        status: "FAILED",
        errorMessage: "Email already exists"
      });
      return res.status(400).json({
        success: false,
        error: "User with this email already exists"
      });
    }
    console.log(`\u{1F464} Admin ${adminId} creating lifetime account for ${email}`);
    const [newUser] = await db.insert(users).values({
      email: email.toLowerCase().trim(),
      name: name?.trim() || null,
      passwordHash: null,
      verified: true,
      provider: "admin_created",
      createdAt: /* @__PURE__ */ new Date()
    }).returning();
    await db.insert(subscriptions).values({
      userId: newUser.id,
      stripeSubscriptionId: null,
      stripeCustomerId: null,
      stripePriceId: null,
      status: companyName ? "company" : "lifetime",
      plan: companyName ? "company" : "lifetime",
      isLifetime: true,
      isCompanyAccount: !!companyName,
      companyName: companyName?.trim() || null,
      specialNotes: notes?.trim() || null,
      grantedBy: adminId,
      currentPeriodStart: /* @__PURE__ */ new Date(),
      currentPeriodEnd: /* @__PURE__ */ new Date("2099-12-31"),
      cancelAtPeriodEnd: false,
      trialStart: null,
      trialEnd: null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    });
    await logAdminAction(req, {
      adminId,
      action: ADMIN_ACTIONS.CREATE_LIFETIME_ACCOUNT,
      targetType: "USER",
      targetId: newUser.id,
      targetEmail: newUser.email,
      status: "SUCCESS",
      details: {
        userName: newUser.name,
        accountType: companyName ? "Company" : "Personal",
        companyName: companyName || null,
        hasNotes: !!notes
      }
    });
    console.log(`\u2705 Lifetime account created: ${newUser.email} by admin ${adminId}`);
    res.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      },
      message: `Lifetime account created. User can set password via "Forgot Password" using: ${newUser.email}`
    });
  } catch (error) {
    console.error("\u274C Create lifetime account error:", error);
    await logAdminAction(req, {
      adminId,
      action: ADMIN_ACTIONS.CREATE_LIFETIME_ACCOUNT_FAILED,
      targetType: "USER",
      targetEmail: req.body.email,
      status: "FAILED",
      errorMessage: error.message
    });
    res.status(500).json({ success: false, error: "Failed to create lifetime account" });
  }
};
var deleteUser = async (req, res) => {
  const adminId = req.admin?.adminId;
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required"
      });
    }
    const userIdNum = parseInt(userId, 10);
    console.log(`\u{1F5D1}\uFE0F Admin ${adminId} is deleting user ${userIdNum}`);
    const [user] = await db.select().from(users).where(eq19(users.id, userIdNum));
    if (!user) {
      await logAdminAction(req, {
        adminId,
        action: ADMIN_ACTIONS.DELETE_USER_FAILED,
        targetType: "USER",
        targetId: userIdNum,
        status: "FAILED",
        errorMessage: "User not found"
      });
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    const [projectsCount] = await db.select({ count: count2() }).from(projects).where(eq19(projects.userId, userIdNum));
    const [rendersCount] = await db.select({ count: count2() }).from(renders).where(eq19(renders.userId, userIdNum));
    const [subscription] = await db.select().from(subscriptions).where(eq19(subscriptions.userId, userIdNum)).limit(1);
    if (subscription?.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        console.log(`\u2705 Canceled Stripe subscription: ${subscription.stripeSubscriptionId}`);
      } catch (stripeError) {
        console.error("\u26A0\uFE0F Failed to cancel Stripe subscription:", stripeError);
      }
    }
    await db.delete(projects).where(eq19(projects.userId, userIdNum));
    await db.delete(renders).where(eq19(renders.userId, userIdNum));
    await db.delete(uploads).where(eq19(uploads.userId, userIdNum));
    await db.delete(datasets).where(eq19(datasets.userId, userIdNum));
    await db.delete(veo3Generations).where(eq19(veo3Generations.userId, userIdNum));
    await db.delete(imageGenerations).where(eq19(imageGenerations.userId, userIdNum));
    await db.delete(youtubeDownloads).where(eq19(youtubeDownloads.userId, userIdNum));
    await db.delete(loginAttempts).where(eq19(loginAttempts.email, user.email));
    await db.delete(pageVisits).where(eq19(pageVisits.userId, userIdNum));
    await db.delete(users).where(eq19(users.id, userIdNum));
    await logAdminAction(req, {
      adminId,
      action: ADMIN_ACTIONS.DELETE_USER,
      targetType: "USER",
      targetId: userIdNum,
      targetEmail: user.email,
      status: "SUCCESS",
      details: {
        userName: user.name,
        userEmail: user.email,
        totalProjects: projectsCount.count,
        totalRenders: rendersCount.count,
        hadStripeSubscription: !!subscription?.stripeSubscriptionId,
        subscriptionStatus: subscription?.status
      }
    });
    console.log(`\u2705 User deleted: ${user.email} (ID: ${userIdNum}) by admin ${adminId}`);
    res.json({
      success: true,
      message: `User ${user.email} deleted successfully`
    });
  } catch (error) {
    console.error("\u274C Admin delete user error:", error);
    await logAdminAction(req, {
      adminId,
      action: ADMIN_ACTIONS.DELETE_USER_FAILED,
      targetType: "USER",
      targetId: parseInt(req.params.userId, 10),
      status: "FAILED",
      errorMessage: error.message
    });
    res.status(500).json({ success: false, error: "Failed to delete user" });
  }
};

// controllers/admin/subscriptionManagement.ts
import { eq as eq20, and as and10 } from "drizzle-orm";
var grantLifetimeAccess = async (req, res) => {
  const adminId = req.admin?.id;
  try {
    const { userId, companyName, notes } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required"
      });
    }
    console.log(`\u{1F31F} Admin ${adminId} granting lifetime access to user ${userId}`);
    const [user] = await db.select().from(users).where(eq20(users.id, parseInt(userId, 10))).limit(1);
    if (!user) {
      await logAdminAction(req, {
        adminId,
        action: ADMIN_ACTIONS.GRANT_LIFETIME_FAILED,
        targetType: "USER",
        targetId: parseInt(userId, 10),
        status: "FAILED",
        errorMessage: "User not found"
      });
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    const [existingSub] = await db.select().from(subscriptions).where(eq20(subscriptions.userId, userId)).limit(1);
    if (existingSub && existingSub.stripeSubscriptionId) {
      console.log(`\u{1F6AB} Canceling Stripe subscription: ${existingSub.stripeSubscriptionId}`);
      try {
        await stripe.subscriptions.cancel(existingSub.stripeSubscriptionId);
        console.log(`\u2705 Stripe subscription ${existingSub.stripeSubscriptionId} canceled`);
      } catch (stripeError) {
        if (stripeError.code === "resource_missing") {
          console.log(`\u26A0\uFE0F Subscription not found in Stripe (already canceled)`);
        } else {
          console.error(`\u274C Error canceling Stripe subscription:`, stripeError);
        }
      }
    }
    const lifetimeData = {
      userId: parseInt(userId, 10),
      stripeSubscriptionId: null,
      stripeCustomerId: null,
      stripePriceId: null,
      status: companyName ? "company" : "lifetime",
      plan: companyName ? "company" : "lifetime",
      isLifetime: true,
      isCompanyAccount: !!companyName,
      companyName: companyName || null,
      specialNotes: notes || null,
      grantedBy: adminId,
      currentPeriodStart: /* @__PURE__ */ new Date(),
      currentPeriodEnd: /* @__PURE__ */ new Date("2099-12-31"),
      cancelAtPeriodEnd: false,
      canceledAt: existingSub?.stripeSubscriptionId ? /* @__PURE__ */ new Date() : null,
      trialStart: null,
      trialEnd: null,
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (existingSub) {
      await db.update(subscriptions).set(lifetimeData).where(eq20(subscriptions.id, existingSub.id));
    } else {
      await db.insert(subscriptions).values({
        ...lifetimeData,
        createdAt: /* @__PURE__ */ new Date()
      });
    }
    await logAdminAction(req, {
      adminId,
      action: ADMIN_ACTIONS.GRANT_LIFETIME,
      targetType: "USER",
      targetId: parseInt(userId, 10),
      targetEmail: user.email,
      status: "SUCCESS",
      details: {
        accountType: companyName ? "Company" : "Personal",
        companyName: companyName || null,
        hadPreviousSubscription: !!existingSub,
        previousStatus: existingSub?.status,
        canceledStripeSubscription: !!existingSub?.stripeSubscriptionId
      }
    });
    console.log(`\u2705 Lifetime access granted to user ${userId} by admin ${adminId}`);
    res.json({
      success: true,
      message: `Lifetime access granted. ${existingSub?.stripeSubscriptionId ? "Stripe subscription canceled." : ""}`
    });
  } catch (error) {
    console.error("\u274C Grant lifetime access error:", error);
    await logAdminAction(req, {
      adminId,
      action: ADMIN_ACTIONS.GRANT_LIFETIME_FAILED,
      targetType: "USER",
      targetId: parseInt(req.body.userId, 10),
      status: "FAILED",
      errorMessage: error.message
    });
    res.status(500).json({ success: false, error: "Failed to grant lifetime access" });
  }
};
var revokeLifetimeAccess = async (req, res) => {
  const adminId = req.admin?.id;
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required"
      });
    }
    console.log(`\u{1F6AB} Admin ${adminId} revoking lifetime access from user ${userId}`);
    const [user] = await db.select().from(users).where(eq20(users.id, parseInt(userId, 10))).limit(1);
    const [lifetimeSub] = await db.select().from(subscriptions).where(
      and10(
        eq20(subscriptions.userId, parseInt(userId, 10)),
        eq20(subscriptions.isLifetime, true)
      )
    ).limit(1);
    if (!lifetimeSub) {
      await logAdminAction(req, {
        adminId,
        action: ADMIN_ACTIONS.REVOKE_LIFETIME_FAILED,
        targetType: "USER",
        targetId: parseInt(userId, 10),
        targetEmail: user?.email,
        status: "FAILED",
        errorMessage: "No lifetime subscription found"
      });
      return res.status(404).json({
        success: false,
        error: "No lifetime subscription found for this user"
      });
    }
    await db.update(subscriptions).set({
      status: "canceled",
      isLifetime: false,
      isCompanyAccount: false,
      canceledAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq20(subscriptions.id, lifetimeSub.id));
    await logAdminAction(req, {
      adminId,
      action: ADMIN_ACTIONS.REVOKE_LIFETIME,
      targetType: "USER",
      targetId: parseInt(userId, 10),
      targetEmail: user?.email,
      status: "SUCCESS",
      details: {
        previousAccountType: lifetimeSub.isCompanyAccount ? "Company" : "Personal",
        companyName: lifetimeSub.companyName
      }
    });
    console.log(`\u2705 Lifetime access revoked from user ${userId} by admin ${adminId}`);
    res.json({
      success: true,
      message: `Lifetime access revoked from user ${userId}`
    });
  } catch (error) {
    console.error("\u274C Revoke lifetime access error:", error);
    await logAdminAction(req, {
      adminId,
      action: ADMIN_ACTIONS.REVOKE_LIFETIME_FAILED,
      targetType: "USER",
      targetId: parseInt(req.body.userId, 10),
      status: "FAILED",
      errorMessage: error.message
    });
    res.status(500).json({ success: false, error: "Failed to revoke lifetime access" });
  }
};
var getLifetimeAccounts = async (req, res) => {
  try {
    const lifetimeAccounts = await db.select().from(subscriptions).where(eq20(subscriptions.isLifetime, true));
    res.json({
      success: true,
      accounts: lifetimeAccounts,
      total: lifetimeAccounts.length
    });
  } catch (error) {
    console.error("\u274C Get lifetime accounts error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// controllers/admin/auditController.ts
import { eq as eq21, desc as desc10, and as and11, gte as gte6, sql as sql4 } from "drizzle-orm";
var getAuditLogs = async (req, res) => {
  try {
    const {
      adminId,
      action,
      targetType,
      status,
      days = 7,
      limit = 100
    } = req.query;
    const conditions = [];
    if (adminId) {
      conditions.push(eq21(adminAuditLogs.adminId, parseInt(adminId)));
    }
    if (action) {
      conditions.push(eq21(adminAuditLogs.action, action));
    }
    if (targetType) {
      conditions.push(eq21(adminAuditLogs.targetType, targetType));
    }
    if (status) {
      conditions.push(eq21(adminAuditLogs.status, status));
    }
    const since = /* @__PURE__ */ new Date();
    since.setDate(since.getDate() - parseInt(days));
    conditions.push(gte6(adminAuditLogs.createdAt, since));
    const logs = await db.select({
      log: adminAuditLogs,
      admin: {
        id: adminUsers.id,
        name: adminUsers.name,
        email: adminUsers.email,
        role: adminUsers.role
      }
    }).from(adminAuditLogs).leftJoin(adminUsers, eq21(adminAuditLogs.adminId, adminUsers.id)).where(conditions.length > 0 ? and11(...conditions) : void 0).orderBy(desc10(adminAuditLogs.createdAt)).limit(parseInt(limit) || 100);
    res.json({
      success: true,
      logs,
      total: logs.length
    });
  } catch (error) {
    console.error("\u274C Get audit logs error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve audit logs"
    });
  }
};
var getAuditStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = /* @__PURE__ */ new Date();
    since.setDate(since.getDate() - parseInt(days));
    const [totalActions] = await db.select({ count: sql4`count(*)` }).from(adminAuditLogs).where(gte6(adminAuditLogs.createdAt, since));
    const [failedActions] = await db.select({ count: sql4`count(*)` }).from(adminAuditLogs).where(
      and11(
        gte6(adminAuditLogs.createdAt, since),
        eq21(adminAuditLogs.status, "FAILED")
      )
    );
    const actionsByAdmin = await db.select({
      adminId: adminAuditLogs.adminId,
      adminName: adminUsers.name,
      count: sql4`count(*)`
    }).from(adminAuditLogs).leftJoin(adminUsers, eq21(adminAuditLogs.adminId, adminUsers.id)).where(gte6(adminAuditLogs.createdAt, since)).groupBy(adminAuditLogs.adminId, adminUsers.name).orderBy(desc10(sql4`count(*)`));
    const criticalActions = await db.select({
      log: adminAuditLogs,
      admin: {
        id: adminUsers.id,
        name: adminUsers.name,
        email: adminUsers.email,
        role: adminUsers.role
      }
    }).from(adminAuditLogs).leftJoin(adminUsers, eq21(adminAuditLogs.adminId, adminUsers.id)).where(
      and11(
        gte6(adminAuditLogs.createdAt, since),
        sql4`${adminAuditLogs.action} IN ('DELETE_USER', 'GRANT_LIFETIME_ACCESS', 'REVOKE_LIFETIME_ACCESS')`
      )
    ).orderBy(desc10(adminAuditLogs.createdAt)).limit(10);
    res.json({
      success: true,
      stats: {
        totalActions: Number(totalActions.count),
        failedActions: Number(failedActions.count),
        successRate: Number(totalActions.count) > 0 ? ((Number(totalActions.count) - Number(failedActions.count)) / Number(totalActions.count) * 100).toFixed(2) : "100.00",
        actionsByAdmin,
        recentCriticalActions: criticalActions
      },
      period: `Last ${days} days`
    });
  } catch (error) {
    console.error("\u274C Get audit stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve audit statistics"
    });
  }
};

// middleware/adminRateLimiter.ts
import rateLimit2 from "express-rate-limit";
import slowDown2 from "express-slow-down";
var rateLimitConfig2 = {
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false
  }
};
var adminLoginRateLimiter = rateLimit2({
  ...rateLimitConfig2,
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 3,
  // Only 3 attempts per 15 minutes per IP+email
  message: {
    success: false,
    error: "Too many admin login attempts. Account locked for 15 minutes for security."
  },
  skipSuccessfulRequests: true,
  // ✅ FIXED: Simple key without IP manipulation
  keyGenerator: (req) => {
    const email = req.body?.email || "unknown";
    return `admin-login:${email}`;
  }
});
var adminOperationsRateLimiter = rateLimit2({
  ...rateLimitConfig2,
  windowMs: 60 * 1e3,
  // 1 minute
  max: 20,
  // Max 20 operations per minute
  message: {
    success: false,
    error: "Too many admin operations. Please slow down."
  },
  // ✅ FIXED: Use admin ID from request, not IP
  keyGenerator: (req) => {
    const adminId = req.admin?.adminId || "unknown";
    return `admin-ops:${adminId}`;
  }
});
var adminCriticalRateLimiter = rateLimit2({
  ...rateLimitConfig2,
  windowMs: 60 * 60 * 1e3,
  // 1 hour
  max: 5,
  // Only 5 critical operations per hour
  message: {
    success: false,
    error: "Critical operation limit reached. Maximum 5 critical operations per hour for security."
  },
  // ✅ FIXED: Use admin ID from request, not IP
  keyGenerator: (req) => {
    const adminId = req.admin?.adminId || "unknown";
    return `admin-critical:${adminId}`;
  }
});
var adminDataAccessRateLimiter = rateLimit2({
  ...rateLimitConfig2,
  windowMs: 60 * 1e3,
  // 1 minute
  max: 10,
  // Max 10 user detail views per minute
  message: {
    success: false,
    error: "Too many user data requests. Please slow down."
  },
  // ✅ FIXED: Use admin ID from request, not IP
  keyGenerator: (req) => {
    const adminId = req.admin?.adminId || "unknown";
    return `admin-data:${adminId}`;
  }
});
var adminSpeedLimiter = slowDown2({
  windowMs: 15 * 60 * 1e3,
  delayAfter: 5,
  // Start slowing down after just 5 requests
  delayMs: (hits) => hits * 300,
  // Add 300ms delay per request
  validate: {
    trustProxy: false
  }
  // ✅ No custom keyGenerator needed - uses default IP-based limiting
});

// middleware/adminValidator.ts
import validator2 from "validator";
var validateUserId = (req, res, next) => {
  try {
    const userId = req.params?.userId || req.body?.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required"
      });
    }
    const userIdNum = parseInt(String(userId), 10);
    if (isNaN(userIdNum) || userIdNum <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID format"
      });
    }
    if (req.params && "userId" in req.params) {
      req.params.userId = String(userIdNum);
    }
    if (req.body && "userId" in req.body) {
      req.body.userId = userIdNum;
    }
    next();
  } catch (error) {
    console.error("\u274C validateUserId error:", error);
    return res.status(400).json({
      success: false,
      error: "Invalid user ID"
    });
  }
};
var validateGrantLifetime = (req, res, next) => {
  const { companyName, notes } = req.body || {};
  if (companyName && companyName.length > 255) {
    return res.status(400).json({
      success: false,
      error: "Company name too long (max 255 characters)"
    });
  }
  if (notes && notes.length > 1e3) {
    return res.status(400).json({
      success: false,
      error: "Notes too long (max 1000 characters)"
    });
  }
  if (companyName) {
    req.body.companyName = validator2.escape(companyName.trim());
  }
  if (notes) {
    req.body.notes = validator2.escape(notes.trim());
  }
  next();
};
var validateCreateLifetimeAccount = (req, res, next) => {
  const { email, name, companyName, notes } = req.body || {};
  if (!email) {
    return res.status(400).json({
      success: false,
      error: "Email is required"
    });
  }
  if (!validator2.isEmail(email)) {
    return res.status(400).json({
      success: false,
      error: "Invalid email format"
    });
  }
  req.body.email = validator2.normalizeEmail(email.trim()) || email.trim();
  if (name && name.length > 255) {
    return res.status(400).json({
      success: false,
      error: "Name too long (max 255 characters)"
    });
  }
  if (companyName && companyName.length > 255) {
    return res.status(400).json({
      success: false,
      error: "Company name too long (max 255 characters)"
    });
  }
  if (notes && notes.length > 1e3) {
    return res.status(400).json({
      success: false,
      error: "Notes too long (max 1000 characters)"
    });
  }
  if (name) {
    req.body.name = validator2.escape(name.trim());
  }
  if (companyName) {
    req.body.companyName = validator2.escape(companyName.trim());
  }
  if (notes) {
    req.body.notes = validator2.escape(notes.trim());
  }
  next();
};
var validateUserListQuery = (req, res, next) => {
  const query = req.query || {};
  const { page, limit, search, sortBy, sortOrder } = query;
  if (page) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        error: "Invalid page number"
      });
    }
  }
  if (limit) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: "Invalid limit (1-100)"
      });
    }
  }
  if (search && search.length > 100) {
    return res.status(400).json({
      success: false,
      error: "Search query too long (max 100 characters)"
    });
  }
  if (sortBy) {
    const allowedSortFields = ["id", "email", "name", "createdAt", "lastLogin"];
    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        error: "Invalid sort field"
      });
    }
  }
  if (sortOrder && !["asc", "desc"].includes(sortOrder.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: "Invalid sort order (must be 'asc' or 'desc')"
    });
  }
  next();
};

// routes/admin.ts
import rateLimit3 from "express-rate-limit";
var router32 = Router23();
router32.post("/auth/login", adminLoginRateLimiter, adminLogin);
router32.post("/auth/setup", createFirstAdmin);
var analyticsRateLimiter = rateLimit3({
  windowMs: 60 * 1e3,
  // 1 minute
  max: 30,
  // Max 30 requests per minute per IP
  message: { success: false, error: "Too many analytics requests" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false
  }
});
router32.post("/analytics/track", analyticsRateLimiter, trackAnalyticsBatch);
router32.use(verifyAdminToken);
router32.use(adminSpeedLimiter);
router32.post("/auth/logout", adminLogout);
router32.post("/auth/reauth", adminOperationsRateLimiter, generateReAuthToken);
router32.post(
  "/auth/create-admin",
  adminCriticalRateLimiter,
  requireReAuth(),
  createAdminUser
);
router32.get(
  "/analytics/stats",
  adminOperationsRateLimiter,
  getDashboardStats
);
router32.get(
  "/analytics/visits",
  adminOperationsRateLimiter,
  getVisitAnalytics
);
router32.get(
  "/analytics/engagement",
  adminOperationsRateLimiter,
  getEngagementMetrics
);
router32.get(
  "/users",
  adminDataAccessRateLimiter,
  validateUserListQuery,
  getUsers
);
router32.get(
  "/users/:userId",
  adminDataAccessRateLimiter,
  validateUserId,
  getUserDetails
);
router32.post(
  "/users/create-lifetime",
  adminCriticalRateLimiter,
  validateCreateLifetimeAccount,
  requireReAuth(),
  createLifetimeAccount
);
router32.delete(
  "/users/:userId",
  adminCriticalRateLimiter,
  validateUserId,
  requireReAuth(),
  deleteUser
);
router32.post(
  "/subscriptions/grant-lifetime",
  adminCriticalRateLimiter,
  validateUserId,
  validateGrantLifetime,
  requireReAuth(),
  grantLifetimeAccess
);
router32.post(
  "/subscriptions/revoke-lifetime",
  adminCriticalRateLimiter,
  validateUserId,
  requireReAuth(),
  revokeLifetimeAccess
);
router32.get(
  "/subscriptions/lifetime",
  adminOperationsRateLimiter,
  getLifetimeAccounts
);
router32.get(
  "/audit/logs",
  adminOperationsRateLimiter,
  getAuditLogs
);
router32.get(
  "/audit/stats",
  adminOperationsRateLimiter,
  getAuditStats
);
router32.post(
  "/auth/extend-session",
  adminOperationsRateLimiter,
  requireReAuth(),
  extendAdminSession
);
router32.post(
  "/auth/change-password",
  adminOperationsRateLimiter,
  requireReAuth(),
  changeAdminPassword
);
router32.post(
  "/auth/update-profile",
  adminOperationsRateLimiter,
  requireReAuth(),
  updateAdminProfile
);
var admin_default = router32;

// routes/analytics.ts
import { Router as Router24 } from "express";

// controllers/analytics/templatesController.ts
import { sql as sql5, and as and12, gte as gte7, lte as lte3, desc as desc11 } from "drizzle-orm";
var templatesWithTheirIds = {
  "1": "Quote Template",
  "2": "Text Typing Template",
  "3": "Bar Graph Analytics",
  "4": "Kpi Flip Cards",
  "5": "Curve Line Trend",
  "6": "Split Screen Video",
  "7": "Fact Cards Template",
  "8": "Ken Burns Carousel",
  "9": "Fake Text Conversation",
  "10": "Reddit Post Narration",
  "11": "Ai Story Narration",
  "12": "Kinetic Typography",
  "13": "Neon Flicker",
  "14": "Heat Map",
  "15": "Flip Cards",
  "16": "Parallax",
  "17": "Neon Tube",
  "18": "Retro Neon Text",
  "19": "Collage"
};
var getMostUsedTemplates = async (req, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : (/* @__PURE__ */ new Date()).getFullYear();
    console.log(`\u{1F4CA} Fetching most used templates for year: ${year}`);
    const startDate = /* @__PURE__ */ new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = /* @__PURE__ */ new Date(`${year}-12-31T23:59:59.999Z`);
    const templates2 = await db.select({
      templateId: renders.templateId,
      count: sql5`cast(count(*) as integer)`
    }).from(renders).where(
      and12(
        gte7(renders.renderedAt, startDate),
        lte3(renders.renderedAt, endDate)
      )
    ).groupBy(renders.templateId).orderBy(desc11(sql5`count(*)`)).limit(1);
    if (templates2.length === 0) {
      console.log(`\u26A0\uFE0F No templates found for year ${year}`);
      return res.json({
        success: true,
        data: {
          templateName: "No data yet",
          count: 0,
          year
        }
      });
    }
    const topTemplate = templates2[0];
    const templateName = templatesWithTheirIds[topTemplate.templateId] || "Unknown Template";
    console.log(
      `\u2705 Most used template in ${year}: ${templateName} (${topTemplate.count} uses) - Template ID: ${topTemplate.templateId}`
    );
    res.json({
      success: true,
      data: {
        templateName,
        count: Number(topTemplate.count),
        templateId: topTemplate.templateId,
        year
      }
    });
  } catch (error) {
    console.error("\u274C Get most used templates error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch template statistics"
    });
  }
};
var getTopTemplates = async (req, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : (/* @__PURE__ */ new Date()).getFullYear();
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const startDate = /* @__PURE__ */ new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = /* @__PURE__ */ new Date(`${year}-12-31T23:59:59.999Z`);
    const templates2 = await db.select({
      templateId: renders.templateId,
      count: sql5`cast(count(*) as integer)`
    }).from(renders).where(
      and12(
        gte7(renders.renderedAt, startDate),
        lte3(renders.renderedAt, endDate)
      )
    ).groupBy(renders.templateId).orderBy(desc11(sql5`count(*)`)).limit(limit);
    const results = templates2.map((t) => ({
      templateId: t.templateId,
      templateName: templatesWithTheirIds[t.templateId] || "Unknown Template",
      count: Number(t.count)
    }));
    res.json({
      success: true,
      data: results,
      year
    });
  } catch (error) {
    console.error("Get top templates error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// routes/analytics.ts
var router33 = Router24();
router33.get("/templates/trending", getMostUsedTemplates);
router33.get("/templates/top", getTopTemplates);
var analytics_default = router33;

// routes/apis/promptImprovement.ts
import express10 from "express";

// controllers/promptImprovement/promptImprovementController.ts
import axios6 from "axios";
var improvePrompt2 = async (req, res) => {
  try {
    const authUser = req.user;
    const userId = authUser?.id ?? authUser?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const { prompt, type } = req.body;
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required"
      });
    }
    const improvementType = type === "video" ? "video" : "image";
    const systemPrompt = improvementType === "video" ? `You are an expert at writing video generation prompts. Improve the following prompt to be more detailed, specific, and effective for AI video generation. Include details about camera movement, lighting, scene composition, mood, and visual style. Keep it concise but descriptive (max 150 words). Return ONLY the improved prompt, nothing else.` : `You are an expert at writing image generation prompts. Improve the following prompt to be more detailed, specific, and effective for AI image generation. Include details about style, composition, lighting, colors, and atmosphere. Keep it concise but descriptive (max 100 words). Return ONLY the improved prompt, nothing else.`;
    console.log(`[PromptImprovement] Improving ${improvementType} prompt for user ${userId}`);
    const apiKey = process.env.GEMINI_API_KEY;
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}

Original prompt: ${prompt.trim()}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500
      }
    };
    const response = await axios6.post(geminiUrl, requestBody, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("No response from Gemini API");
    }
    const improvedPrompt = response.data.candidates[0].content.parts[0].text.trim();
    console.log(`[PromptImprovement] \u2705 Successfully improved ${improvementType} prompt`);
    res.json({
      success: true,
      originalPrompt: prompt.trim(),
      improvedPrompt
    });
  } catch (error) {
    console.error("[PromptImprovement] \u274C Error:", error);
    if (axios6.isAxiosError(error)) {
      console.error("[PromptImprovement] Gemini API Error:", error.response?.data);
    }
    res.status(500).json({
      success: false,
      error: "Failed to improve prompt",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// routes/apis/promptImprovement.ts
var router34 = express10.Router();
router34.post("/improve", requireAuth, improvePrompt2);
var promptImprovement_default = router34;

// routes/apis/bunny.ts
import express11 from "express";
import multer7 from "multer";

// controllers/bunny/bunnyUploadController.ts
import axios7 from "axios";

// config/bunny.ts
var BUNNY_STORAGE_CONFIG = {
  apiKey: process.env.BUNNY_STORAGE_API_KEY || "YOUR_STORAGE_API_KEY",
  storageZoneName: process.env.BUNNY_STORAGE_ZONE_NAME || "YOUR_STORAGE_ZONE_NAME",
  storageEndpoint: process.env.BUNNY_STORAGE_ENDPOINT || "storage.bunnycdn.com",
  pullZoneUrl: process.env.BUNNY_PULL_ZONE_URL || "https://your-pullzone.b-cdn.net"
};
var BUNNY_STREAM_CONFIG = {
  apiKey: process.env.BUNNY_STREAM_API_KEY || "YOUR_STREAM_API_KEY",
  libraryId: process.env.BUNNY_STREAM_LIBRARY_ID || "YOUR_LIBRARY_ID",
  cdnUrl: process.env.BUNNY_STREAM_CDN_URL || "https://vz-xxxxx-xxx.b-cdn.net"
};

// controllers/bunny/bunnyUploadController.ts
var uploadFileToBunny = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const { originalname, buffer, mimetype } = req.file;
    const timestamp2 = Date.now();
    const filename = `${timestamp2}-${originalname}`;
    const uploadUrl = `https://${BUNNY_STORAGE_CONFIG.storageEndpoint}/${BUNNY_STORAGE_CONFIG.storageZoneName}/${filename}`;
    const response = await axios7.put(uploadUrl, buffer, {
      headers: {
        "AccessKey": BUNNY_STORAGE_CONFIG.apiKey,
        "Content-Type": mimetype
      }
    });
    if (response.status === 201) {
      const fileUrl = `https://${BUNNY_STORAGE_CONFIG.pullZoneUrl}/${filename}`;
      return res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        file: {
          name: filename,
          originalName: originalname,
          url: fileUrl,
          size: buffer.length,
          mimetype
        }
      });
    } else {
      return res.status(response.status).json({
        error: "Upload failed",
        details: response.data
      });
    }
  } catch (error) {
    console.error("Bunny upload error:", error.response?.data || error.message);
    return res.status(500).json({
      error: "Failed to upload file",
      details: error.response?.data || error.message
    });
  }
};
var deleteFileFromBunny = async (req, res) => {
  try {
    const { filename } = req.params;
    if (!filename) {
      return res.status(400).json({ error: "Filename is required" });
    }
    const deleteUrl = `https://${BUNNY_STORAGE_CONFIG.storageEndpoint}/${BUNNY_STORAGE_CONFIG.storageZoneName}/${filename}`;
    const response = await axios7.delete(deleteUrl, {
      headers: {
        "AccessKey": BUNNY_STORAGE_CONFIG.apiKey
      }
    });
    if (response.status === 200) {
      return res.status(200).json({
        success: true,
        message: "File deleted successfully"
      });
    } else {
      return res.status(response.status).json({
        error: "Delete failed",
        details: response.data
      });
    }
  } catch (error) {
    console.error("Bunny delete error:", error.response?.data || error.message);
    return res.status(500).json({
      error: "Failed to delete file",
      details: error.response?.data || error.message
    });
  }
};
var listFilesFromBunny = async (req, res) => {
  try {
    const listUrl = `https://${BUNNY_STORAGE_CONFIG.storageEndpoint}/${BUNNY_STORAGE_CONFIG.storageZoneName}/`;
    const response = await axios7.get(listUrl, {
      headers: {
        "AccessKey": BUNNY_STORAGE_CONFIG.apiKey
      }
    });
    return res.status(200).json({
      success: true,
      files: response.data
    });
  } catch (error) {
    console.error("Bunny list error:", error.response?.data || error.message);
    return res.status(500).json({
      error: "Failed to list files",
      details: error.response?.data || error.message
    });
  }
};

// routes/apis/bunny.ts
var router35 = express11.Router();
var storage2 = multer7.memoryStorage();
var upload7 = multer7({
  storage: storage2,
  limits: {
    fileSize: 100 * 1024 * 1024
    // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});
router35.post("/upload", upload7.single("file"), uploadFileToBunny);
router35.delete("/delete/:filename", deleteFileFromBunny);
router35.get("/list", listFilesFromBunny);
var bunny_default = router35;

// routes/usage.ts
import { Router as Router25 } from "express";

// controllers/usage/usageController.ts
import { eq as eq22, desc as desc12 } from "drizzle-orm";
var PLAN_LIMITS2 = {
  free: {
    videosPerMonth: 5,
    aiGenerationsPerDay: 1,
    maxQuality: "720p",
    hasWatermark: true,
    templates: "basic",
    requiresTracking: true
  },
  starter: {
    videosPerMonth: 30,
    aiGenerationsPerDay: 20,
    maxQuality: "1080p",
    hasWatermark: false,
    templates: "all",
    requiresTracking: true
  },
  pro: {
    videosPerMonth: Infinity,
    aiGenerationsPerDay: Infinity,
    maxQuality: "4K",
    hasWatermark: false,
    templates: "all",
    requiresTracking: false
    // ✅ Unlimited = no tracking
  },
  team: {
    videosPerMonth: Infinity,
    aiGenerationsPerDay: Infinity,
    maxQuality: "4K",
    hasWatermark: false,
    templates: "all",
    requiresTracking: false
    // ✅ Unlimited = no tracking
  },
  lifetime: {
    videosPerMonth: Infinity,
    aiGenerationsPerDay: Infinity,
    maxQuality: "4K",
    hasWatermark: false,
    templates: "all",
    requiresTracking: false
    // ✅ Unlimited = no tracking
  }
};
async function getOrCreateUsageTracking2(userId) {
  let [usage] = await db.select().from(usageTracking).where(eq22(usageTracking.userId, userId));
  if (!usage) {
    [usage] = await db.insert(usageTracking).values({
      userId,
      videosThisMonth: 0,
      aiGenerationsToday: 0,
      lastVideoReset: /* @__PURE__ */ new Date(),
      lastAiReset: /* @__PURE__ */ new Date()
    }).returning();
  }
  return usage;
}
function needsMonthlyReset(lastReset) {
  const now = /* @__PURE__ */ new Date();
  return now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
}
function needsDailyReset2(lastReset) {
  const now = /* @__PURE__ */ new Date();
  return now.toDateString() !== lastReset.toDateString();
}
async function getUserPlan2(userId) {
  const [subscription] = await db.select().from(subscriptions).where(eq22(subscriptions.userId, userId)).orderBy(desc12(subscriptions.createdAt)).limit(1);
  if (!subscription) {
    return "free";
  }
  if (subscription.isLifetime) {
    return "lifetime";
  }
  if (subscription.status === "active") {
    return subscription.plan;
  }
  return "free";
}
var canCreateVideo = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const plan = await getUserPlan2(userId);
    const planConfig = PLAN_LIMITS2[plan];
    if (!planConfig.requiresTracking) {
      return res.json({
        canCreate: true,
        remaining: Infinity,
        limit: Infinity,
        used: 0,
        plan,
        unlimited: true
      });
    }
    let usage = await getOrCreateUsageTracking2(userId);
    if (needsMonthlyReset(usage.lastVideoReset)) {
      [usage] = await db.update(usageTracking).set({
        videosThisMonth: 0,
        lastVideoReset: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq22(usageTracking.userId, userId)).returning();
    }
    const canCreate = usage.videosThisMonth < planConfig.videosPerMonth;
    const remaining = Math.max(0, planConfig.videosPerMonth - usage.videosThisMonth);
    res.json({
      canCreate,
      remaining,
      limit: planConfig.videosPerMonth,
      used: usage.videosThisMonth,
      plan,
      unlimited: false
    });
  } catch (error) {
    console.error("Error checking video creation:", error);
    res.status(500).json({ error: "Failed to check usage" });
  }
};
var incrementVideoCount = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const plan = await getUserPlan2(userId);
    const planConfig = PLAN_LIMITS2[plan];
    if (!planConfig.requiresTracking) {
      return res.json({
        success: true,
        videosCreated: 0,
        unlimited: true
      });
    }
    let usage = await getOrCreateUsageTracking2(userId);
    if (needsMonthlyReset(usage.lastVideoReset)) {
      usage.videosThisMonth = 0;
      usage.lastVideoReset = /* @__PURE__ */ new Date();
    }
    [usage] = await db.update(usageTracking).set({
      videosThisMonth: usage.videosThisMonth + 1,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq22(usageTracking.userId, userId)).returning();
    res.json({
      success: true,
      videosCreated: usage.videosThisMonth,
      unlimited: false
    });
  } catch (error) {
    console.error("Error incrementing video count:", error);
    res.status(500).json({ error: "Failed to increment usage" });
  }
};
var canGenerateAI = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const plan = await getUserPlan2(userId);
    const planConfig = PLAN_LIMITS2[plan];
    if (!planConfig.requiresTracking) {
      return res.json({
        canGenerate: true,
        remaining: Infinity,
        limit: Infinity,
        used: 0,
        plan,
        unlimited: true
      });
    }
    let usage = await getOrCreateUsageTracking2(userId);
    if (needsDailyReset2(usage.lastAiReset)) {
      [usage] = await db.update(usageTracking).set({
        aiGenerationsToday: 0,
        lastAiReset: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq22(usageTracking.userId, userId)).returning();
    }
    const canGenerate = usage.aiGenerationsToday < planConfig.aiGenerationsPerDay;
    const remaining = Math.max(0, planConfig.aiGenerationsPerDay - usage.aiGenerationsToday);
    res.json({
      canGenerate,
      remaining,
      limit: planConfig.aiGenerationsPerDay,
      used: usage.aiGenerationsToday,
      plan,
      unlimited: false
    });
  } catch (error) {
    console.error("Error checking AI generation:", error);
    res.status(500).json({ error: "Failed to check usage" });
  }
};
var incrementAICount = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const plan = await getUserPlan2(userId);
    const planConfig = PLAN_LIMITS2[plan];
    if (!planConfig.requiresTracking) {
      return res.json({
        success: true,
        aiGenerations: 0,
        unlimited: true
      });
    }
    let usage = await getOrCreateUsageTracking2(userId);
    if (needsDailyReset2(usage.lastAiReset)) {
      usage.aiGenerationsToday = 0;
      usage.lastAiReset = /* @__PURE__ */ new Date();
    }
    [usage] = await db.update(usageTracking).set({
      aiGenerationsToday: usage.aiGenerationsToday + 1,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq22(usageTracking.userId, userId)).returning();
    res.json({
      success: true,
      aiGenerations: usage.aiGenerationsToday,
      unlimited: false
    });
  } catch (error) {
    console.error("Error incrementing AI count:", error);
    res.status(500).json({ error: "Failed to increment usage" });
  }
};
var getUsageStats = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const plan = await getUserPlan2(userId);
    const planConfig = PLAN_LIMITS2[plan];
    if (!planConfig.requiresTracking) {
      return res.json({
        plan,
        unlimited: true,
        limits: {
          videosPerMonth: Infinity,
          aiGenerationsPerDay: Infinity
        },
        usage: {
          videosThisMonth: 0,
          aiGenerationsToday: 0
        },
        remaining: {
          videos: Infinity,
          aiGenerations: Infinity
        },
        features: {
          maxQuality: planConfig.maxQuality,
          hasWatermark: planConfig.hasWatermark,
          templates: planConfig.templates
        }
      });
    }
    let usage = await getOrCreateUsageTracking2(userId);
    if (needsMonthlyReset(usage.lastVideoReset)) {
      usage.videosThisMonth = 0;
    }
    if (needsDailyReset2(usage.lastAiReset)) {
      usage.aiGenerationsToday = 0;
    }
    res.json({
      plan,
      unlimited: false,
      limits: {
        videosPerMonth: planConfig.videosPerMonth,
        aiGenerationsPerDay: planConfig.aiGenerationsPerDay
      },
      usage: {
        videosThisMonth: usage.videosThisMonth,
        aiGenerationsToday: usage.aiGenerationsToday
      },
      remaining: {
        videos: Math.max(0, planConfig.videosPerMonth - usage.videosThisMonth),
        aiGenerations: Math.max(0, planConfig.aiGenerationsPerDay - usage.aiGenerationsToday)
      },
      features: {
        maxQuality: planConfig.maxQuality,
        hasWatermark: planConfig.hasWatermark,
        templates: planConfig.templates
      }
    });
  } catch (error) {
    console.error("Error getting usage stats:", error);
    res.status(500).json({ error: "Failed to get usage stats" });
  }
};
var getPlanFeatures = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const plan = await getUserPlan2(userId);
    const planConfig = PLAN_LIMITS2[plan];
    res.json({
      plan,
      features: {
        maxQuality: planConfig.maxQuality,
        hasWatermark: planConfig.hasWatermark,
        templates: planConfig.templates
      },
      limits: {
        videosPerMonth: planConfig.videosPerMonth,
        aiGenerationsPerDay: planConfig.aiGenerationsPerDay
      }
    });
  } catch (error) {
    console.error("Error getting plan features:", error);
    res.status(500).json({ error: "Failed to get plan features" });
  }
};

// routes/usage.ts
var router36 = Router25();
router36.use(requireAuth);
router36.get("/can-create-video", canCreateVideo);
router36.post("/increment-video", incrementVideoCount);
router36.get("/can-generate-ai", canGenerateAI);
router36.post("/increment-ai", incrementAICount);
router36.get("/stats", getUsageStats);
router36.get("/features", getPlanFeatures);
var usage_default = router36;

// routes/apis/pollinations.ts
import { Router as Router26 } from "express";
import axios8 from "axios";
var router37 = Router26();
var POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY || "";
router37.post("/generate", async (req, res) => {
  try {
    const { prompt, width, height, model: model2, seed } = req.body;
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required"
      });
    }
    console.log("[Pollinations] Generating image...", {
      prompt: prompt.substring(0, 50),
      model: model2,
      dimensions: `${width}x${height}`,
      seed,
      hasApiKey: !!POLLINATIONS_API_KEY
    });
    const encodedPrompt = encodeURIComponent(prompt);
    let imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model2}&nologo=true&enhance=false`;
    if (seed) {
      imageUrl += `&seed=${seed}`;
    }
    if (POLLINATIONS_API_KEY) {
      imageUrl += `&apikey=${POLLINATIONS_API_KEY}`;
    }
    const headers = {
      "User-Agent": "ViralMotion/1.0"
    };
    const response = await axios8.get(imageUrl, {
      headers,
      responseType: "arraybuffer",
      timeout: 6e4,
      // 60 seconds
      maxContentLength: 10 * 1024 * 1024
      // 10MB max
    });
    const base64Image = Buffer.from(response.data).toString("base64");
    const mimeType = response.headers["content-type"] || "image/png";
    const dataUri = `data:${mimeType};base64,${base64Image}`;
    console.log("[Pollinations] \u2705 Image generated successfully");
    res.json({
      success: true,
      imageUrl: dataUri,
      metadata: {
        model: model2,
        dimensions: `${width}x${height}`,
        seed
      }
    });
  } catch (error) {
    console.error("[Pollinations] \u274C Generation error:", error.message);
    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: "Rate limit exceeded. Please try again in a moment."
      });
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.status(401).json({
        success: false,
        error: "Invalid API credentials. Please check your Pollinations API key."
      });
    }
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return res.status(504).json({
        success: false,
        error: "Request timed out. The image generation took too long."
      });
    }
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate image with Pollinations",
      details: process.env.NODE_ENV === "development" ? error.stack : void 0
    });
  }
});
router37.get("/health", async (req, res) => {
  try {
    const testUrl = "https://image.pollinations.ai/prompt/test?width=64&height=64&nologo=true";
    const response = await axios8.get(testUrl, {
      timeout: 5e3,
      validateStatus: (status) => status < 500
    });
    res.json({
      success: true,
      status: "operational",
      responseTime: response.headers["x-response-time"] || "unknown",
      hasApiKey: !!POLLINATIONS_API_KEY
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: "degraded",
      error: error.message
    });
  }
});
var pollinations_default = router37;

// index.ts
var app = express12();
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
} else {
  app.set("trust proxy", false);
}
app.use(securityHeaders);
app.use(cookieParser());
var allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "https://remotion-web-application.vercel.app",
  "http://localhost:5173"
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-2FA-Verified", "X-Reauth-Token"],
    exposedHeaders: ["Set-Cookie"]
  })
);
app.post(
  "/api/subscription/webhook",
  express12.raw({ type: "application/json" }),
  handleStripeWebhook
);
app.use(generalRateLimiter);
app.use(speedLimiter);
app.use(express12.json({ limit: "10mb" }));
app.use(express12.urlencoded({ extended: true, limit: "10mb" }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1e3
    }
  })
);
app.use(passport2.initialize());
app.use(passport2.session());
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptime: process.uptime()
  });
});
app.use("/api", gemini_default);
app.use("/generatevideo", rendering_default);
app.use("/uploadhandler", uploads_default);
app.use("/useruploads", useruploads_default);
app.use("/sound", elevenlabs_default);
app.use("/reddit", reddit_default);
app.use("/auth", auth_default);
app.use("/projects", projects_default);
app.use("/pixabay", pixabay_default);
app.use("/renders", renders_default);
app.use("/datasets", datasetsupload_default);
app.use("/fromuploadsdataset", fromuploadsextraction_default);
app.use("/authenticate", google_default);
app.use("/api/picture", removebg_default);
app.use("/api/seedream", seeDream_default);
app.use("/api/huggingFace", huggingFace_default);
app.use("/api/gemini-image", gemini_default2);
app.use("/api/openai-image", openai_default);
app.use("/api/video-generation/huggingface", huggingface_default);
app.use("/api/video-generation/tavus", tavus_default);
app.use("/api/veo3", veo_default);
app.use("/api/youtube", yt_2_default);
app.use("/api/tools/audio", audio_default);
app.use("/api/tools/speech-enhancement", enhanceSpeech_default);
app.use("/api/veo3-video-generation", veo3_default);
app.use("/api/youtube-v2", youtube_default);
app.use("/api/tools/save-image", saveImage_default);
app.use("/api/image-generation", imageGen_default);
app.use("/api/subscription", subscription_default);
app.use("/admin", admin_default);
app.use("/api/analytics", analytics_default);
app.use("/api/prompt-improvement", promptImprovement_default);
app.use("/api/proxy", proxy_default);
app.use("/api/usage", usage_default);
app.use("/cloudinary", screenshotSaver_default);
app.use("/api/bunny", bunny_default);
app.use("/api/pollinations", pollinations_default);
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path
  });
});
app.use((err, req, res, next) => {
  console.error("\u274C Global error:", err);
  const message = process.env.NODE_ENV === "production" ? "Internal server error" : err.message;
  res.status(err.status || 500).json({
    error: message,
    ...process.env.NODE_ENV !== "production" && { stack: err.stack }
  });
});
setInterval(() => {
  cleanupExpiredTokens().then(() => console.log("\u2705 Cleaned up expired tokens")).catch((err) => console.error("\u274C Token cleanup error:", err));
}, 60 * 60 * 1e3);
process.on("SIGTERM", () => {
  console.log("\u{1F6D1} SIGTERM received, cleaning up...");
  cleanupExpiredTokens().then(() => {
    console.log("\u2705 Cleanup complete");
    process.exit(0);
  }).catch((err) => {
    console.error("\u274C Cleanup error:", err);
    process.exit(1);
  });
});
var PORT = parseInt(process.env.PORT || "3000", 10);
app.listen(PORT, "0.0.0.0", () => {
  console.log("=================================");
  console.log(`\u2705 Server running on http://0.0.0.0:${PORT}`);
  console.log(`\u{1F512} Security features enabled`);
  console.log(`\u{1F310} CORS origins: ${allowedOrigins.join(", ")}`);
  console.log(`\u{1F6E1}\uFE0F  Rate limiting: Active`);
  console.log(`\u{1F36A} Cookie support: Active`);
  console.log(`\u{1F4CA} Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`\u{1FA9D} Webhook endpoint: POST /api/subscription/webhook`);
  console.log("=================================");
});
var index_default = app;
export {
  index_default as default
};
