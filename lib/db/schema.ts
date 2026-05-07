import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const promptTypeEnum = pgEnum("prompt_type", [
  "system",
  "user",
  "assistant",
  "few-shot",
  "chain-of-thought",
  "instruction",
  "persona",
  "template",
  "custom",
]);

export const visibilityEnum = pgEnum("visibility", ["private", "public"]);
export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);
export const userStatusEnum = pgEnum("user_status", ["active", "pending", "disabled"]);
export const promptStatusEnum = pgEnum("prompt_status", ["draft", "active", "archived"]);
export const notificationTypeEnum = pgEnum("notification_type", ["clone", "favorite_public"]);

export type TemplateVariable = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "number";
  defaultValue?: string;
  options?: string[];
  required: boolean;
  placeholder?: string;
};

export type PromptMetadata = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  notes?: string;
};

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  role: userRoleEnum("role").default("user").notNull(),
  status: userStatusEnum("status").default("pending").notNull(),
  invitedBy: uuid("invited_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    color: text("color").default("#1d4ed8"),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index("tags_name_idx").on(table.name),
  }),
);

export const collections = pgTable(
  "collections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color").default("#1d4ed8"),
    icon: text("icon").default("folder"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    authorIdx: index("collections_author_idx").on(table.authorId),
  }),
);

export const templates = pgTable(
  "templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id),
    title: text("title").notNull(),
    description: text("description"),
    content: text("content").notNull(),
    type: promptTypeEnum("type").default("custom"),
    tags: jsonb("tags").$type<string[]>().default([]),
    visibility: visibilityEnum("visibility").default("private"),
    variables: jsonb("variables").$type<TemplateVariable[]>().default([]),
    usageCount: integer("usage_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    authorIdx: index("templates_author_idx").on(table.authorId),
    typeIdx: index("templates_type_idx").on(table.type),
  }),
);

export const prompts = pgTable(
  "prompts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id),
    templateId: uuid("template_id").references(() => templates.id, { onDelete: "set null" }),
    collectionId: uuid("collection_id").references(() => collections.id, { onDelete: "set null" }),
    clonedFromId: uuid("cloned_from_id"),
    title: text("title").notNull(),
    description: text("description"),
    content: text("content").notNull(),
    type: promptTypeEnum("type").default("custom"),
    tags: jsonb("tags").$type<string[]>().default([]),
    visibility: visibilityEnum("visibility").default("private"),
    slug: text("slug").unique(),
    version: integer("version").default(1).notNull(),
    status: promptStatusEnum("status").default("active").notNull(),
    rating: integer("rating"),
    pinned: boolean("pinned").default(false).notNull(),
    pinnedOrder: integer("pinned_order"),
    targetModels: jsonb("target_models").$type<string[]>().default([]),
    isFavorite: boolean("is_favorite").default(false).notNull(),
    copyCount: integer("copy_count").default(0).notNull(),
    cloneCount: integer("clone_count").default(0).notNull(),
    shortId: text("short_id").unique(),
    metadata: jsonb("metadata").$type<PromptMetadata>(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    authorIdx: index("prompts_author_idx").on(table.authorId),
    typeIdx: index("prompts_type_idx").on(table.type),
    statusIdx: index("prompts_status_idx").on(table.status),
    visibilityIdx: index("prompts_visibility_idx").on(table.visibility),
    shortIdIdx: index("prompts_short_id_idx").on(table.shortId),
    slugIdx: index("prompts_slug_idx").on(table.slug),
    pinnedIdx: index("prompts_pinned_idx").on(table.authorId, table.pinned),
    collectionIdx: index("prompts_collection_idx").on(table.collectionId),
  }),
);

export const promptVersions = pgTable(
  "prompt_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    changelog: text("changelog"),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    promptIdx: index("versions_prompt_idx").on(table.promptId),
  }),
);

export const promptVariants = pgTable(
  "prompt_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id),
    label: text("label").notNull(),
    content: text("content").notNull(),
    notes: text("notes"),
    rating: integer("rating"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    promptIdx: index("variants_prompt_idx").on(table.promptId),
  }),
);

export const favorites = pgTable(
  "favorites",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.promptId] }),
  }),
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    actorId: uuid("actor_id").references(() => profiles.id),
    promptId: uuid("prompt_id").references(() => prompts.id, { onDelete: "cascade" }),
    read: boolean("read").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("notifications_user_idx").on(table.userId),
    readIdx: index("notifications_read_idx").on(table.userId, table.read),
  }),
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull(),
    prefix: text("prefix").notNull(),
    lastUsed: timestamp("last_used", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("api_keys_user_idx").on(table.userId),
    hashIdx: index("api_keys_hash_idx").on(table.keyHash),
  }),
);

export const promptsRelations = relations(prompts, ({ many, one }) => ({
  author: one(profiles, { fields: [prompts.authorId], references: [profiles.id] }),
  template: one(templates, { fields: [prompts.templateId], references: [templates.id] }),
  collection: one(collections, { fields: [prompts.collectionId], references: [collections.id] }),
  versions: many(promptVersions),
  variants: many(promptVariants),
  favorites: many(favorites),
}));

export const templatesRelations = relations(templates, ({ many, one }) => ({
  author: one(profiles, { fields: [templates.authorId], references: [profiles.id] }),
  prompts: many(prompts),
}));

export const collectionsRelations = relations(collections, ({ many, one }) => ({
  author: one(profiles, { fields: [collections.authorId], references: [profiles.id] }),
  prompts: many(prompts),
}));

export type Profile = typeof profiles.$inferSelect;
export type Prompt = typeof prompts.$inferSelect;
export type NewPrompt = typeof prompts.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
