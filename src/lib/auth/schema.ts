/**
 * EWF-ID Database Schema
 * Implements Better Auth tables + custom fields for SPEC.md requirements
 */
import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	json,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

/**
 * User table - Extended with EWF-ID specific fields
 */
export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),

	// Role-based access control
	role: text("role").default("student"),

	// Ban/suspension status
	banned: boolean("banned").default(false),
	banReason: text("ban_reason"),
	banExpires: timestamp("ban_expires"),

	// EWF-ID custom fields (SPEC §5.2)
	firstName: text("first_name"),
	lastName: text("last_name"),
	displayName: text("display_name"),
	bio: text("bio"),
	school: text("school"), // athenaeum, vlg, igs, ewf
	locale: text("locale").default("de"),
	lastLoginAt: timestamp("last_login_at"),
	lastLoginMethod: text("last_login_method"), // email, oidc, passkey

	// 2FA status
	twoFactorEnabled: boolean("two_factor_enabled").default(false),

	// GDPR deletion tracking
	deletionRequestedAt: timestamp("deletion_requested_at"),
	deletionScheduledAt: timestamp("deletion_scheduled_at"),
});

/**
 * Session table - For database-backed session management
 */
export const session = pgTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: timestamp("expires_at").notNull(),
		token: text("token").notNull().unique(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => new Date())
			.notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		impersonatedBy: text("impersonated_by"),

		// Multi-session tracking
		deviceName: text("device_name"),
		deviceType: text("device_type"),
		lastActiveAt: timestamp("last_active_at"),
	},
	(table) => [index("session_userId_idx").on(table.userId)],
);

/**
 * Account table - OAuth/OIDC provider accounts
 */
export const account = pgTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at"),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("account_userId_idx").on(table.userId)],
);

/**
 * Verification table - Email verification, password reset tokens
 */
export const verification = pgTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

/**
 * Passkey table - WebAuthn credentials
 */
export const passkey = pgTable(
	"passkey",
	{
		id: text("id").primaryKey(),
		name: text("name"),
		publicKey: text("public_key").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		credentialID: text("credential_id").notNull(),
		counter: integer("counter").notNull(),
		deviceType: text("device_type").notNull(),
		backedUp: boolean("backed_up").notNull(),
		transports: text("transports"),
		createdAt: timestamp("created_at"),
		aaguid: text("aaguid"),
	},
	(table) => [
		index("passkey_userId_idx").on(table.userId),
		index("passkey_credentialID_idx").on(table.credentialID),
	],
);

/**
 * Two-Factor table - TOTP and backup codes
 */
export const twoFactor = pgTable(
	"two_factor",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		secret: text("secret").notNull(), // Encrypted TOTP secret
		backupCodes: text("backup_codes"), // JSON array of hashed codes
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("two_factor_userId_idx").on(table.userId)],
);

/**
 * Audit Log table - For tracking important actions
 */
export const auditLog = pgTable(
	"audit_log",
	{
		id: text("id").primaryKey(),
		timestamp: timestamp("timestamp").defaultNow().notNull(),
		actorId: text("actor_id").references(() => user.id, {
			onDelete: "set null",
		}),
		actorType: text("actor_type").notNull(), // user, admin, system
		actorEmail: text("actor_email"),
		action: text("action").notNull(), // user.created, user.deleted, etc.
		targetId: text("target_id"),
		targetType: text("target_type"), // user, session, api_key, etc.
		changes: json("changes"), // { field: { old: x, new: y } }
		metadata: json("metadata"),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		traceId: text("trace_id"),
	},
	(table) => [
		index("audit_log_actor_idx").on(table.actorId),
		index("audit_log_action_idx").on(table.action),
		index("audit_log_timestamp_idx").on(table.timestamp),
	],
);

/**
 * OAuth Client table - For OIDC provider functionality
 */
export const oauthClient = pgTable(
	"oauth_client",
	{
		id: text("id").primaryKey(),
		clientId: text("client_id").notNull().unique(),
		clientSecret: text("client_secret").notNull(), // Hashed
		name: text("name").notNull(),
		description: text("description"),
		redirectUris: json("redirect_uris").$type<string[]>().notNull(),
		scopes: json("scopes").$type<string[]>().default([]),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		createdBy: text("created_by").references(() => user.id),
		active: boolean("active").default(true),
	},
	(table) => [index("oauth_client_clientId_idx").on(table.clientId)],
);

/**
 * OAuth Consent table - User consents to OAuth clients
 */
export const oauthConsent = pgTable(
	"oauth_consent",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		clientId: text("client_id")
			.notNull()
			.references(() => oauthClient.id, { onDelete: "cascade" }),
		scopes: json("scopes").$type<string[]>().notNull(),
		grantedAt: timestamp("granted_at").defaultNow().notNull(),
		lastUsedAt: timestamp("last_used_at"),
	},
	(table) => [
		index("oauth_consent_userId_idx").on(table.userId),
		index("oauth_consent_clientId_idx").on(table.clientId),
	],
);

/**
 * API Key table - For machine-to-machine authentication
 */
export const apiKey = pgTable(
	"api_key",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		keyHash: text("key_hash").notNull(), // SHA-256 hash
		keyPrefix: text("key_prefix").notNull(), // First 8 chars for identification
		userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
		scopes: json("scopes").$type<string[]>().default([]),
		expiresAt: timestamp("expires_at"),
		lastUsedAt: timestamp("last_used_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		revokedAt: timestamp("revoked_at"),
	},
	(table) => [
		index("api_key_userId_idx").on(table.userId),
		index("api_key_keyPrefix_idx").on(table.keyPrefix),
	],
);

/**
 * Data Export Request table - GDPR data export tracking
 */
export const dataExportRequest = pgTable(
	"data_export_request",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		status: text("status").notNull().default("pending"), // pending, processing, completed, failed
		requestedAt: timestamp("requested_at").defaultNow().notNull(),
		completedAt: timestamp("completed_at"),
		downloadUrl: text("download_url"),
		expiresAt: timestamp("expires_at"),
	},
	(table) => [index("data_export_userId_idx").on(table.userId)],
);

// ============ RELATIONS ============

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	passkeys: many(passkey),
	auditLogs: many(auditLog),
	oauthConsents: many(oauthConsent),
	apiKeys: many(apiKey),
	dataExportRequests: many(dataExportRequest),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const passkeyRelations = relations(passkey, ({ one }) => ({
	user: one(user, {
		fields: [passkey.userId],
		references: [user.id],
	}),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
	user: one(user, {
		fields: [twoFactor.userId],
		references: [user.id],
	}),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
	actor: one(user, {
		fields: [auditLog.actorId],
		references: [user.id],
	}),
}));

export const oauthConsentRelations = relations(oauthConsent, ({ one }) => ({
	user: one(user, {
		fields: [oauthConsent.userId],
		references: [user.id],
	}),
	client: one(oauthClient, {
		fields: [oauthConsent.clientId],
		references: [oauthClient.id],
	}),
}));

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
	user: one(user, {
		fields: [apiKey.userId],
		references: [user.id],
	}),
}));

export const dataExportRequestRelations = relations(
	dataExportRequest,
	({ one }) => ({
		user: one(user, {
			fields: [dataExportRequest.userId],
			references: [user.id],
		}),
	}),
);
