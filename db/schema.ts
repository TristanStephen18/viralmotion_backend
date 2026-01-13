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
  varchar,
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
  screenshot: text("screentshot").default(""),
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
  type: text("type").$type<"image" | "video">().notNull(),
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
  status: text("status")
    .$type<"pending" | "processing" | "completed" | "failed">()
    .default("pending")
    .notNull(),
  videoUrl: text("video_url"),
  referenceImageUrl: text("reference_image_url"),
  referenceType: text("reference_type"),
  thumbnailUrl: text("thumbnail_url"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const imageGenerations = pgTable(
  "image_generations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    prompt: text("prompt").notNull(),
    model: text("model").notNull(),
    aspectRatio: text("aspect_ratio").notNull(),
    imageUrl: text("image_url").notNull(),
    status: text("status")
      .$type<"completed" | "failed">()
      .default("completed")
      .notNull(),
    errorMessage: text("error_message"),
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("image_generations_user_id_idx").on(table.userId),
  })
);

export const youtubeDownloads = pgTable("youtube_downloads", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
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
  status: text("status")
    .$type<"pending" | "processing" | "completed" | "failed">()
    .default("pending")
    .notNull(),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
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
  },
  (table) => ({
    userIdIdx: index("refresh_tokens_user_id_idx").on(table.userId),
    tokenIdx: index("refresh_tokens_token_idx").on(table.token),
  })
);

// Login attempts tracking for rate limiting
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    ipAddress: text("ip_address").notNull(),
    attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
    successful: boolean("successful").notNull(),
  },
  (table) => ({
    emailIdx: index("login_attempts_email_idx").on(table.email),
    ipIdx: index("login_attempts_ip_idx").on(table.ipAddress),
  })
);

// Blacklisted tokens for secure logout
export const blacklistedTokens = pgTable(
  "blacklisted_tokens",
  {
    id: serial("id").primaryKey(),
    token: text("token").notNull().unique(),
    blacklistedAt: timestamp("blacklisted_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => ({
    tokenIdx: index("blacklisted_tokens_token_idx").on(table.token),
  })
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),

    // ✅ FIXED: Make these nullable for free trials
    stripeSubscriptionId: varchar("stripe_subscription_id", {
      length: 255,
    }).unique(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    stripePriceId: varchar("stripe_price_id", { length: 255 }),

    billingInterval: varchar("billing_interval", { length: 20 })
      .$type<"monthly" | "yearly">()
      .default("monthly")
      .notNull(),

    // ✅ Lifetime/Company Account Fields
    isLifetime: boolean("is_lifetime").default(false).notNull(),
    isCompanyAccount: boolean("is_company_account").default(false).notNull(),
    companyName: text("company_name"),
    specialNotes: text("special_notes"),
    grantedBy: integer("granted_by").references(() => adminUsers.id),

    // Rest stays the same...
    status: varchar("status", { length: 50 })
      .$type<
        | "active"
        | "canceled"
        | "past_due"
        | "incomplete"
        | "unpaid"
        | "lifetime"
        | "company"
      >()
      .default("active")
      .notNull(),
    plan: varchar("plan", { length: 50 })
      .$type<"free" | "starter" | "pro" | "team" | "lifetime">()
      .default("free")
      .notNull(),
    currentPeriodStart: timestamp("current_period_start").notNull(),
    currentPeriodEnd: timestamp("current_period_end").notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    canceledAt: timestamp("canceled_at"),
    trialStart: timestamp("trial_start"),
    trialEnd: timestamp("trial_end"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdIdx: index("subscriptions_user_id_idx").on(table.userId),
      statusIdx: index("subscriptions_status_idx").on(table.status),
      stripeSubIdIdx: index("subscriptions_stripe_sub_id_idx").on(
        table.stripeSubscriptionId
      ),
    };
  }
);

export const adminUsers = pgTable(
  "admin_users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: text("role")
      .$type<"super_admin" | "admin" | "viewer">()
      .default("admin")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastLogin: timestamp("last_login"),
    passwordChangedAt: timestamp("password_changed_at"),
    active: boolean("active").default(true).notNull(),
    // passwordChangedAt: timestamp("password_changed_at")
  },
  (table) => ({
    emailIdx: index("admin_users_email_idx").on(table.email),
  })
);

// Page visits tracking
export const pageVisits = pgTable(
  "page_visits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: integer("user_id").references(() => users.id),
    page: text("page").notNull(),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    referrer: text("referrer"),
    sessionId: text("session_id"),
    visitedAt: timestamp("visited_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("page_visits_user_id_idx").on(table.userId),
    pageIdx: index("page_visits_page_idx").on(table.page),
    visitedAtIdx: index("page_visits_visited_at_idx").on(table.visitedAt),
  })
);

// Analytics events (custom tracking)
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: integer("user_id").references(() => users.id),
    eventType: text("event_type").notNull(), // signup, login, subscription, video_created, etc.
    eventData: jsonb("event_data"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("analytics_events_user_id_idx").on(table.userId),
    eventTypeIdx: index("analytics_events_event_type_idx").on(table.eventType),
    createdAtIdx: index("analytics_events_created_at_idx").on(table.createdAt),
  })
);

// Admin Audit Logs (for security and compliance)
export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminId: integer("admin_id")
      .references(() => adminUsers.id, { onDelete: "cascade" })
      .notNull(),
    action: varchar("action", { length: 255 }).notNull(), // e.g., "DELETE_USER", "GRANT_LIFETIME"
    targetType: varchar("target_type", { length: 100 }), // e.g., "USER", "SUBSCRIPTION"
    targetId: integer("target_id"), // ID of affected resource
    targetEmail: text("target_email"), // Email of affected user (for easier searching)
    details: jsonb("details"), // Additional context (sanitized)
    ipAddress: varchar("ip_address", { length: 45 }), // IPv4/IPv6
    userAgent: text("user_agent"),
    status: varchar("status", { length: 50 })
      .$type<"SUCCESS" | "FAILED">()
      .notNull(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    adminIdIdx: index("admin_audit_logs_admin_id_idx").on(table.adminId),
    actionIdx: index("admin_audit_logs_action_idx").on(table.action),
    targetTypeIdx: index("admin_audit_logs_target_type_idx").on(
      table.targetType
    ),
    targetIdIdx: index("admin_audit_logs_target_id_idx").on(table.targetId),
    createdAtIdx: index("admin_audit_logs_created_at_idx").on(table.createdAt),
    statusIdx: index("admin_audit_logs_status_idx").on(table.status),
  })
);

export const usageTracking = pgTable(
  "usage_tracking",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull()
      .unique(), // One row per user
    
    // ✅ SIMPLIFIED: Only track videos created (creation = export)
    videosThisMonth: integer("videos_this_month").default(0).notNull(),
    lastVideoReset: timestamp("last_video_reset").defaultNow().notNull(),
    
    // ✅ AI generation tracking (daily limit)
    aiGenerationsToday: integer("ai_generations_today").default(0).notNull(),
    lastAiReset: timestamp("last_ai_reset").defaultNow().notNull(),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("usage_tracking_user_id_idx").on(table.userId),
  })
);


export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    description: text("description"), // What this coupon is for
    assignedTo: text("assigned_to"), // Name/email of affiliate/person
    createdBy: integer("created_by")
      .references(() => adminUsers.id)
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    expiryDate: timestamp("expiry_date"), // NULL = never expires
    maxUses: integer("max_uses").default(1).notNull(), // How many times can be used
    currentUses: integer("current_uses").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    codeIdx: index("coupons_code_idx").on(table.code),
    createdByIdx: index("coupons_created_by_idx").on(table.createdBy),
    isActiveIdx: index("coupons_is_active_idx").on(table.isActive),
  })
);

export const couponRedemptions = pgTable(
  "coupon_redemptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    couponId: uuid("coupon_id")
      .references(() => coupons.id, { onDelete: "cascade" })
      .notNull(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
  },
  (table) => ({
    couponIdIdx: index("coupon_redemptions_coupon_id_idx").on(table.couponId),
    userIdIdx: index("coupon_redemptions_user_id_idx").on(table.userId),
    uniqueUserCoupon: index("coupon_redemptions_unique_user_coupon_idx").on(
      table.userId,
      table.couponId
    ),
  })
);