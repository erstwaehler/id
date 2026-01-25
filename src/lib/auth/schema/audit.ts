/**
 * EWF-ID Audit & Custom Tables Schema
 * Implements SPEC.md Phase 1 - Task 1.2
 */
import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./betterauth";

/**
 * Audit Log Result Enum
 */
export const auditResultEnum = pgEnum("audit_result", ["success", "failure"]);

/**
 * Schools Table
 * Stores school information and OIDC configuration
 */
export const school = pgTable(
	"school",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		shortName: text("short_name").notNull(),
		domain: text("domain"),
		oidcProviderId: text("oidc_provider_id"),
		oidcIssuer: text("oidc_issuer"),
		oidcClientId: text("oidc_client_id"),
		oidcClientSecret: text("oidc_client_secret"),
		oidcScopes: text("oidc_scopes").default("openid email profile"),
		logoUrl: text("logo_url"),
		primaryColor: text("primary_color"),
		enabled: boolean("enabled").default(true).notNull(),
		studentCount: integer("student_count").default(0),
		metadata: jsonb("metadata").$type<Record<string, unknown>>(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("school_short_name_idx").on(table.shortName),
		index("school_enabled_idx").on(table.enabled),
	],
);

/**
 * User Schools Table
 * Links users to their school affiliations
 */
export const userSchool = pgTable(
	"user_school",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		schoolId: text("school_id")
			.notNull()
			.references(() => school.id, { onDelete: "cascade" }),
		studentId: text("student_id"),
		department: text("department"),
		graduationYear: integer("graduation_year"),
		verified: boolean("verified").default(false).notNull(),
		verifiedAt: timestamp("verified_at"),
		verificationMethod: text("verification_method"),
		isPrimary: boolean("is_primary").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("user_school_unique_idx").on(table.userId, table.schoolId),
		index("user_school_user_id_idx").on(table.userId),
		index("user_school_school_id_idx").on(table.schoolId),
		index("user_school_verified_idx").on(table.verified),
	],
);

/**
 * Audit Logs Table
 * Comprehensive audit trail for GDPR compliance
 */
export const auditLog = pgTable(
	"audit_log",
	{
		id: text("id").primaryKey(),
		timestamp: timestamp("timestamp").defaultNow().notNull(),
		userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
		action: text("action").notNull(),
		resource: text("resource").notNull(),
		resourceId: text("resource_id"),
		metadata: jsonb("metadata").$type<Record<string, unknown>>(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		traceId: text("trace_id"),
		spanId: text("span_id"),
		result: auditResultEnum("result").notNull().default("success"),
		errorMessage: text("error_message"),
		duration: integer("duration"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("audit_log_user_id_idx").on(table.userId),
		index("audit_log_action_idx").on(table.action),
		index("audit_log_resource_idx").on(table.resource),
		index("audit_log_timestamp_idx").on(table.timestamp),
		index("audit_log_trace_id_idx").on(table.traceId),
	],
);

/**
 * API Keys Table
 * For programmatic API access
 */
export const apiKey = pgTable(
	"api_key",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		keyHash: text("key_hash").notNull(),
		keyPrefix: text("key_prefix").notNull(),
		permissions: jsonb("permissions").$type<string[]>().default([]),
		scopes: jsonb("scopes").$type<string[]>().default([]),
		rateLimit: integer("rate_limit").default(1000),
		lastUsedAt: timestamp("last_used_at"),
		lastUsedIp: text("last_used_ip"),
		expiresAt: timestamp("expires_at"),
		enabled: boolean("enabled").default(true).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("api_key_user_id_idx").on(table.userId),
		uniqueIndex("api_key_prefix_idx").on(table.keyPrefix),
		index("api_key_enabled_idx").on(table.enabled),
	],
);

/**
 * Plugin Settings Table
 * User-specific settings for plugins
 */
export const pluginSetting = pgTable(
	"plugin_setting",
	{
		id: text("id").primaryKey(),
		pluginId: text("plugin_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		settings: jsonb("settings").$type<Record<string, unknown>>().default({}),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("plugin_setting_unique_idx").on(table.pluginId, table.userId),
		index("plugin_setting_user_id_idx").on(table.userId),
		index("plugin_setting_plugin_id_idx").on(table.pluginId),
	],
);

/**
 * OIDC Clients Table
 * For OIDC provider functionality
 */
export const oidcClient = pgTable(
	"oidc_client",
	{
		id: text("id").primaryKey(),
		clientId: text("client_id").notNull().unique(),
		clientSecretHash: text("client_secret_hash").notNull(),
		name: text("name").notNull(),
		description: text("description"),
		logoUrl: text("logo_url"),
		homepageUrl: text("homepage_url"),
		termsUrl: text("terms_url"),
		privacyUrl: text("privacy_url"),
		contactEmail: text("contact_email"),
		redirectUris: jsonb("redirect_uris").$type<string[]>().default([]),
		postLogoutRedirectUris: jsonb("post_logout_redirect_uris")
			.$type<string[]>()
			.default([]),
		allowedScopes: jsonb("allowed_scopes").$type<string[]>().default([]),
		grantTypes: jsonb("grant_types")
			.$type<string[]>()
			.default(["authorization_code", "refresh_token"]),
		responseTypes: jsonb("response_types").$type<string[]>().default(["code"]),
		tokenEndpointAuthMethod: text("token_endpoint_auth_method").default(
			"client_secret_basic",
		),
		accessTokenTtl: integer("access_token_ttl").default(3600),
		refreshTokenTtl: integer("refresh_token_ttl").default(2592000),
		idTokenTtl: integer("id_token_ttl").default(3600),
		requirePkce: boolean("require_pkce").default(true).notNull(),
		requireConsent: boolean("require_consent").default(true).notNull(),
		firstParty: boolean("first_party").default(false).notNull(),
		enabled: boolean("enabled").default(true).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("oidc_client_client_id_idx").on(table.clientId),
		index("oidc_client_enabled_idx").on(table.enabled),
	],
);

/**
 * OIDC Authorization Codes Table
 */
export const oidcAuthorizationCode = pgTable(
	"oidc_authorization_code",
	{
		id: text("id").primaryKey(),
		code: text("code").notNull().unique(),
		clientId: text("client_id")
			.notNull()
			.references(() => oidcClient.clientId, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		redirectUri: text("redirect_uri").notNull(),
		scope: text("scope").notNull(),
		state: text("state"),
		nonce: text("nonce"),
		codeChallenge: text("code_challenge"),
		codeChallengeMethod: text("code_challenge_method"),
		expiresAt: timestamp("expires_at").notNull(),
		usedAt: timestamp("used_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("oidc_auth_code_code_idx").on(table.code),
		index("oidc_auth_code_user_id_idx").on(table.userId),
		index("oidc_auth_code_client_id_idx").on(table.clientId),
		index("oidc_auth_code_expires_idx").on(table.expiresAt),
	],
);

/**
 * OIDC Tokens Table
 */
export const oidcToken = pgTable(
	"oidc_token",
	{
		id: text("id").primaryKey(),
		type: text("type").notNull(),
		tokenHash: text("token_hash").notNull(),
		clientId: text("client_id")
			.notNull()
			.references(() => oidcClient.clientId, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		scope: text("scope").notNull(),
		audience: text("audience"),
		expiresAt: timestamp("expires_at").notNull(),
		revokedAt: timestamp("revoked_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("oidc_token_hash_idx").on(table.tokenHash),
		index("oidc_token_user_id_idx").on(table.userId),
		index("oidc_token_client_id_idx").on(table.clientId),
		index("oidc_token_type_idx").on(table.type),
		index("oidc_token_expires_idx").on(table.expiresAt),
	],
);

/**
 * OIDC User Consents Table
 */
export const oidcConsent = pgTable(
	"oidc_consent",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		clientId: text("client_id")
			.notNull()
			.references(() => oidcClient.clientId, { onDelete: "cascade" }),
		grantedScopes: jsonb("granted_scopes").$type<string[]>().default([]),
		deniedScopes: jsonb("denied_scopes").$type<string[]>().default([]),
		grantedAt: timestamp("granted_at").defaultNow().notNull(),
		expiresAt: timestamp("expires_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("oidc_consent_unique_idx").on(table.userId, table.clientId),
		index("oidc_consent_user_id_idx").on(table.userId),
		index("oidc_consent_client_id_idx").on(table.clientId),
	],
);

/**
 * Data Export Requests Table
 * GDPR data portability
 */
export const dataExportRequest = pgTable(
	"data_export_request",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		status: text("status").notNull().default("pending"),
		downloadUrl: text("download_url"),
		downloadToken: text("download_token"),
		expiresAt: timestamp("expires_at"),
		completedAt: timestamp("completed_at"),
		downloadedAt: timestamp("downloaded_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("data_export_user_id_idx").on(table.userId),
		index("data_export_status_idx").on(table.status),
		uniqueIndex("data_export_token_idx").on(table.downloadToken),
	],
);

/**
 * Account Deletion Requests Table
 * GDPR right to erasure with grace period
 */
export const accountDeletionRequest = pgTable(
	"account_deletion_request",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		status: text("status").notNull().default("pending"),
		reason: text("reason"),
		cancellationToken: text("cancellation_token"),
		scheduledAt: timestamp("scheduled_at").notNull(),
		cancelledAt: timestamp("cancelled_at"),
		completedAt: timestamp("completed_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("account_deletion_user_id_idx").on(table.userId),
		index("account_deletion_status_idx").on(table.status),
		uniqueIndex("account_deletion_token_idx").on(table.cancellationToken),
		index("account_deletion_scheduled_idx").on(table.scheduledAt),
	],
);

/**
 * Two Factor table (for Better Auth)
 */
export const twoFactor = pgTable(
	"two_factor",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		secret: text("secret").notNull(),
		backupCodes: text("backup_codes").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("two_factor_user_id_idx").on(table.userId)],
);

// Relations
export const schoolRelations = relations(school, ({ many }) => ({
	userSchools: many(userSchool),
}));

export const userSchoolRelations = relations(userSchool, ({ one }) => ({
	user: one(user, {
		fields: [userSchool.userId],
		references: [user.id],
	}),
	school: one(school, {
		fields: [userSchool.schoolId],
		references: [school.id],
	}),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
	user: one(user, {
		fields: [auditLog.userId],
		references: [user.id],
	}),
}));

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
	user: one(user, {
		fields: [apiKey.userId],
		references: [user.id],
	}),
}));

export const pluginSettingRelations = relations(pluginSetting, ({ one }) => ({
	user: one(user, {
		fields: [pluginSetting.userId],
		references: [user.id],
	}),
}));

export const oidcClientRelations = relations(oidcClient, ({ many }) => ({
	authorizationCodes: many(oidcAuthorizationCode),
	tokens: many(oidcToken),
	consents: many(oidcConsent),
}));

export const oidcAuthorizationCodeRelations = relations(
	oidcAuthorizationCode,
	({ one }) => ({
		client: one(oidcClient, {
			fields: [oidcAuthorizationCode.clientId],
			references: [oidcClient.clientId],
		}),
		user: one(user, {
			fields: [oidcAuthorizationCode.userId],
			references: [user.id],
		}),
	}),
);

export const oidcTokenRelations = relations(oidcToken, ({ one }) => ({
	client: one(oidcClient, {
		fields: [oidcToken.clientId],
		references: [oidcClient.clientId],
	}),
	user: one(user, {
		fields: [oidcToken.userId],
		references: [user.id],
	}),
}));

export const oidcConsentRelations = relations(oidcConsent, ({ one }) => ({
	client: one(oidcClient, {
		fields: [oidcConsent.clientId],
		references: [oidcClient.clientId],
	}),
	user: one(user, {
		fields: [oidcConsent.userId],
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

export const accountDeletionRequestRelations = relations(
	accountDeletionRequest,
	({ one }) => ({
		user: one(user, {
			fields: [accountDeletionRequest.userId],
			references: [user.id],
		}),
	}),
);

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
	user: one(user, {
		fields: [twoFactor.userId],
		references: [user.id],
	}),
}));
