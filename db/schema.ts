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

export const users = pgTable("users", {
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
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  propsSchema: jsonb("props_schema").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  templateId: integer("template_id")
    .references(() => templates.id)
    .notNull(),
  title: text("title").notNull(),
  props: jsonb("props").notNull(),
  projectVidUrl: text("project_vidurl").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const renders = pgTable("renders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  templateId: integer("template_id")
    .references(() => templates.id)
    .notNull(),
  type: text("type").$type<"mp4" | "gif" | "webm">().notNull(),
  outputUrl: text("output_url"),
  renderedAt: timestamp("rendered_at").defaultNow().notNull(),
});

export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  type: text("type").$type<"image" | "video" >().notNull(),
  url: text("url").notNull(), 
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const datasets = pgTable("datasets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  type: text("type").$type<"json" | "xlsx">().notNull(),
  url: text("url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const veo3Generations = pgTable("veo3_generations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  prompt: text("prompt").notNull(),
  model: text("model").default("veo-3.1-generate-preview").notNull(),
  duration: text("duration").default("8s").notNull(),
  aspectRatio: text("aspect_ratio").default("16:9").notNull(),
  status: text("status").$type<"pending" | "processing" | "completed" | "failed">().default("pending").notNull(),
  videoUrl: text("video_url"),
  referenceImageUrl: text("reference_image_url"),
  referenceType: text("reference_type"),
  thumbnailUrl: text("thumbnail_url"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const imageGenerations = pgTable("image_generations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  prompt: text("prompt").notNull(),
  model: text("model").notNull(),
  aspectRatio: text("aspect_ratio").notNull(),
  imageUrl: text("image_url").notNull(),
  status: text("status").$type<"completed" | "failed">().default("completed").notNull(),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("image_generations_user_id_idx").on(table.userId),
}));

export const youtubeDownloads = pgTable("youtube_downloads", {
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
  status: text("status").$type<"pending" | "processing" | "completed" | "failed">().default("pending").notNull(),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  revoked: boolean("revoked").default(false).notNull(),
  revokedAt: timestamp("revoked_at"),
}, (table) => ({
  userIdIdx: index("refresh_tokens_user_id_idx").on(table.userId),
  tokenIdx: index("refresh_tokens_token_idx").on(table.token),
}));

// Login attempts tracking for rate limiting
export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  ipAddress: text("ip_address").notNull(),
  attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
  successful: boolean("successful").notNull(),
}, (table) => ({
  emailIdx: index("login_attempts_email_idx").on(table.email),
  ipIdx: index("login_attempts_ip_idx").on(table.ipAddress),
}));

// Blacklisted tokens for secure logout
export const blacklistedTokens = pgTable("blacklisted_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  blacklistedAt: timestamp("blacklisted_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
}, (table) => ({
  tokenIdx: index("blacklisted_tokens_token_idx").on(table.token),
}));

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: integer("user_id")  // ✅ Correct: integer (matches users.id)
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),

    // Stripe identifiers
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 })
      .unique()
      .notNull(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull(),
    stripePriceId: varchar("stripe_price_id", { length: 255 }).notNull(),

    // Subscription details
    status: varchar("status", { length: 50 })
      .$type<"active" | "trialing" | "canceled" | "past_due" | "incomplete" | "unpaid">()
      .notNull(),
    plan: varchar("plan", { length: 50 }).notNull(),

    // Billing periods
    currentPeriodStart: timestamp("current_period_start").notNull(),
    currentPeriodEnd: timestamp("current_period_end").notNull(),

    // Cancellation
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    canceledAt: timestamp("canceled_at"),

    // Trial
    trialStart: timestamp("trial_start"),
    trialEnd: timestamp("trial_end"),

    // Metadata
    metadata: text("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdIdx: index("subscriptions_user_id_idx").on(table.userId),
      statusIdx: index("subscriptions_status_idx").on(table.status),
      stripeSubIdIdx: index("subscriptions_stripe_sub_id_idx").on(table.stripeSubscriptionId),
    };
  }
);
