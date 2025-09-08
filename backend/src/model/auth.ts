import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { userProfiles } from "./profile";

// ================================
// USERS TABLE (AuthUser)
// ================================

export const authUsers = pgTable("auth_users", {
  id: uuid("id").primaryKey().defaultRandom(), // UUID
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  // passwordHash: text("password_hash").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),

  lastLoginAt: timestamp("last_login_at", { mode: "date" }).default(null),
  lockedUntil: timestamp("locked_until", { mode: "date" }).default(null),
  loginAttempts: integer("login_attempts").notNull().default(0),

  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// ================================
// SESSIONS TABLE (AuthSession)
// ================================

export const authSessions = pgTable("auth_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull().unique(),
  refreshToken: text("refresh_token").notNull().unique(),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent").notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// ================================
// PASSWORD RESETS TABLE (PasswordReset)
// ================================

export const passwordResets = pgTable("password_resets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export type InsertAuthUser = typeof authUsers.$inferInsert;
export type SelectAuthUser = typeof authUsers.$inferSelect;

export type InsertAuthSession = typeof authSessions.$inferInsert;
export type SelectAuthSession = typeof authSessions.$inferSelect;

export type InsertPasswordReset = typeof passwordResets.$inferInsert;
export type SelectPasswordReset = typeof passwordResets.$inferSelect;

export const authUsersRelations = relations(authUsers, ({ one }) => ({
  profile: one(userProfiles, {
    fields: [authUsers.id],
    references: [userProfiles.authUserId],
  }),
}));
