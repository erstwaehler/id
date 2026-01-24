import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  index,
  json,
  unique,
  primaryKey,
} from "drizzle-orm/pg-core";

// Main user table with expanded fields
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  
  // Name fields
  name: text("name").notNull(), // Full name for display
  firstName: text("first_name"),
  lastName: text("last_name"),
  displayName: text("display_name"),
  
  // Profile
  image: text("image"), // Profile picture URL
  bio: text("bio"), // Max 500 chars enforced in app
  locale: text("locale").default("de").notNull(), // de, en, uk
  
  // School affiliation
  school: text("school"), // athenaeum, vlg, igs, ewf
  schoolName: text("school_name"),
  
  // Auth metadata
  lastLoginAt: timestamp("last_login_at"),
  lastLoginMethod: text("last_login_method"), // email, oidc, passkey
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  twoFactorSecret: text("two_factor_secret"), // Encrypted TOTP secret
  twoFactorBackupCodes: json("two_factor_backup_codes").$type<string[]>(), // Encrypted backup codes
  
  // Admin features
  multiSessionEnabled: boolean("multi_session_enabled").default(false).notNull(),
  banned: boolean("banned").default(false).notNull(),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  
  // GDPR
  deletionScheduledAt: timestamp("deletion_scheduled_at"), // Soft delete grace period
  deletionReason: text("deletion_reason"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

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
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

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
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

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

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  passkeys: many(passkey),
  userRoles: many(userRole),
  userPermissions: many(userPermission),
  apiKeys: many(apiKey),
  oauthConsents: many(oauthConsent),
  dataExportJobs: many(dataExportJob),
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

// Roles table
export const role = pgTable("role", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // admin, team, teacher, student
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// Permissions table
export const permission = pgTable("permission", {
  id: text("id").primaryKey(),
  scope: text("scope").notNull().unique(), // app:resource:action format
  name: text("name").notNull(),
  description: text("description"),
  appId: text("app_id").notNull(), // schedule, vote, live, screens, admin, profile
  dangerous: boolean("dangerous").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User-Role junction table (many-to-many)
export const userRole = pgTable(
  "user_role",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => role.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    assignedBy: text("assigned_by"), // Admin who assigned the role
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleId] }),
    index("user_role_userId_idx").on(table.userId),
    index("user_role_roleId_idx").on(table.roleId),
  ]
);

// User-Permission junction table (user-specific permission overrides)
export const userPermission = pgTable(
  "user_permission",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permission.id, { onDelete: "cascade" }),
    granted: boolean("granted").default(true).notNull(), // true = grant, false = revoke
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    assignedBy: text("assigned_by"), // Admin who assigned the permission
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.permissionId] }),
    index("user_permission_userId_idx").on(table.userId),
    index("user_permission_permissionId_idx").on(table.permissionId),
  ]
);

// Role-Permission junction table (default permissions for each role)
export const rolePermission = pgTable(
  "role_permission",
  {
    roleId: text("role_id")
      .notNull()
      .references(() => role.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permission.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
    index("role_permission_roleId_idx").on(table.roleId),
    index("role_permission_permissionId_idx").on(table.permissionId),
  ]
);

// API Keys table
export const apiKey = pgTable("api_key", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(), // Hashed key
  keyPrefix: text("key_prefix").notNull(), // First 8 chars for display (ewf_live_)
  name: text("name").notNull(), // User-friendly name
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  scopes: json("scopes").$type<string[]>().notNull(),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("api_key_userId_idx").on(table.userId),
  index("api_key_keyPrefix_idx").on(table.keyPrefix),
]);

// Audit Log table
export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  action: text("action").notNull(), // login, logout, profile_update, role_assign, etc.
  resource: text("resource"), // users, roles, permissions, etc.
  resourceId: text("resource_id"), // ID of affected resource
  details: json("details"), // Additional context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  traceId: text("trace_id"), // OpenTelemetry trace ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("audit_log_userId_idx").on(table.userId),
  index("audit_log_action_idx").on(table.action),
  index("audit_log_createdAt_idx").on(table.createdAt),
]);

// OAuth Clients table (for OIDC provider functionality)
export const oauthClient = pgTable("oauth_client", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull().unique(),
  clientSecret: text("client_secret").notNull(), // Hashed
  name: text("name").notNull(),
  description: text("description"),
  redirectUris: json("redirect_uris").$type<string[]>().notNull(),
  allowedScopes: json("allowed_scopes").$type<string[]>().notNull(),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  privacyPolicyUrl: text("privacy_policy_url"),
  termsUrl: text("terms_url"),
  trusted: boolean("trusted").default(false).notNull(), // Skip consent screen
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// OAuth Consents table (user authorization to apps)
export const oauthConsent = pgTable("oauth_consent", {
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
}, (table) => [
  unique().on(table.userId, table.clientId),
  index("oauth_consent_userId_idx").on(table.userId),
  index("oauth_consent_clientId_idx").on(table.clientId),
]);

// OAuth Authorization Codes table (temporary codes for code flow)
export const oauthAuthorizationCode = pgTable("oauth_authorization_code", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  clientId: text("client_id")
    .notNull()
    .references(() => oauthClient.id, { onDelete: "cascade" }),
  redirectUri: text("redirect_uri").notNull(),
  scopes: json("scopes").$type<string[]>().notNull(),
  codeChallenge: text("code_challenge"), // For PKCE
  codeChallengeMethod: text("code_challenge_method"), // S256 or plain
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("oauth_authorization_code_code_idx").on(table.code),
  index("oauth_authorization_code_userId_idx").on(table.userId),
]);

// Device Authorization table (for device flow RFC 8628)
export const deviceAuthorization = pgTable("device_authorization", {
  id: text("id").primaryKey(),
  deviceCode: text("device_code").notNull().unique(),
  userCode: text("user_code").notNull().unique(),
  clientId: text("client_id")
    .notNull()
    .references(() => oauthClient.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  scopes: json("scopes").$type<string[]>().notNull(),
  approved: boolean("approved").default(false).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("device_authorization_deviceCode_idx").on(table.deviceCode),
  index("device_authorization_userCode_idx").on(table.userCode),
]);

// Data Export Jobs table (for GDPR data export)
export const dataExportJob = pgTable("data_export_job", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // pending, processing, complete, failed
  downloadUrl: text("download_url"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("data_export_job_userId_idx").on(table.userId),
  index("data_export_job_status_idx").on(table.status),
]);

// Relations
export const roleRelations = relations(role, ({ many }) => ({
  userRoles: many(userRole),
  rolePermissions: many(rolePermission),
}));

export const permissionRelations = relations(permission, ({ many }) => ({
  rolePermissions: many(rolePermission),
  userPermissions: many(userPermission),
}));

export const userRoleRelations = relations(userRole, ({ one }) => ({
  user: one(user, {
    fields: [userRole.userId],
    references: [user.id],
  }),
  role: one(role, {
    fields: [userRole.roleId],
    references: [role.id],
  }),
}));

export const userPermissionRelations = relations(userPermission, ({ one }) => ({
  user: one(user, {
    fields: [userPermission.userId],
    references: [user.id],
  }),
  permission: one(permission, {
    fields: [userPermission.permissionId],
    references: [permission.id],
  }),
}));

export const rolePermissionRelations = relations(rolePermission, ({ one }) => ({
  role: one(role, {
    fields: [rolePermission.roleId],
    references: [role.id],
  }),
  permission: one(permission, {
    fields: [rolePermission.permissionId],
    references: [permission.id],
  }),
}));

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
  user: one(user, {
    fields: [apiKey.userId],
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

export const dataExportJobRelations = relations(dataExportJob, ({ one }) => ({
  user: one(user, {
    fields: [dataExportJob.userId],
    references: [user.id],
  }),
}));
