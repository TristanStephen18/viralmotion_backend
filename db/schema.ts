import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  jsonb,
  uuid,
  boolean
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"),
  provider: text("provider"),
  providerId: text("provider_id"),
  profilePicture: text("profile_picture"), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
  verified: boolean("verified").default(false).notNull(),
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
