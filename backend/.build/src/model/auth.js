"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authUsersRelations = exports.passwordResets = exports.authSessions = exports.authUsers = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const profile_1 = require("./profile");
// ================================
// USERS TABLE (AuthUser)
// ================================
exports.authUsers = (0, pg_core_1.pgTable)("auth_users", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(), // UUID
    email: (0, pg_core_1.text)("email").notNull().unique(),
    username: (0, pg_core_1.text)("username").notNull().unique(),
    // passwordHash: text("password_hash"),
    emailVerified: (0, pg_core_1.boolean)("email_verified").notNull().default(false),
    twoFactorEnabled: (0, pg_core_1.boolean)("two_factor_enabled").notNull().default(false),
    lastLoginAt: (0, pg_core_1.timestamp)("last_login_at", { mode: "date" }).default(null),
    lockedUntil: (0, pg_core_1.timestamp)("locked_until", { mode: "date" }).default(null),
    loginAttempts: (0, pg_core_1.integer)("login_attempts").notNull().default(0),
    isActive: (0, pg_core_1.boolean)("is_active").notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { mode: "date" }).notNull().defaultNow(),
});
// ================================
// SESSIONS TABLE (AuthSession)
// ================================
exports.authSessions = (0, pg_core_1.pgTable)("auth_sessions", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(() => exports.authUsers.id, { onDelete: "cascade" }),
    sessionToken: (0, pg_core_1.text)("session_token").notNull().unique(),
    refreshToken: (0, pg_core_1.text)("refresh_token").notNull().unique(),
    ipAddress: (0, pg_core_1.text)("ip_address").notNull(),
    userAgent: (0, pg_core_1.text)("user_agent").notNull(),
    expiresAt: (0, pg_core_1.timestamp)("expires_at", { mode: "date" }).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: "date" }).notNull().defaultNow(),
});
// ================================
// PASSWORD RESETS TABLE (PasswordReset)
// ================================
exports.passwordResets = (0, pg_core_1.pgTable)("password_resets", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(() => exports.authUsers.id, { onDelete: "cascade" }),
    token: (0, pg_core_1.text)("token").notNull().unique(),
    expiresAt: (0, pg_core_1.timestamp)("expires_at", { mode: "date" }).notNull(),
    used: (0, pg_core_1.boolean)("used").notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: "date" }).notNull().defaultNow(),
});
exports.authUsersRelations = (0, drizzle_orm_1.relations)(exports.authUsers, ({ one }) => ({
    profile: one(profile_1.userProfiles, {
        fields: [exports.authUsers.id],
        references: [profile_1.userProfiles.authUserId],
    }),
}));
