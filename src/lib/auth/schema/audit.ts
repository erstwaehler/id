/**
 * EWF-ID Custom Tables Schema
 * Only audit logs and two-factor table are needed.
 * Other tables (apiKey, oidc*, etc.) are managed by Better Auth plugins.
 */
import { relations } from "drizzle-orm";
import {
index,
integer,
jsonb,
pgEnum,
pgTable,
text,
timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./betterauth";

/**
 * Audit Log Result Enum
 */
export const auditResultEnum = pgEnum("audit_result", ["success", "failure"]);

/**
 * Audit Logs Table
 * Comprehensive audit trail for GDPR compliance
 * Note: IP addresses are hashed for GDPR compliance
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
// IP address should be hashed for GDPR compliance
ipAddressHash: text("ip_address_hash"),
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
export const auditLogRelations = relations(auditLog, ({ one }) => ({
user: one(user, {
fields: [auditLog.userId],
references: [user.id],
}),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
user: one(user, {
fields: [twoFactor.userId],
references: [user.id],
}),
}));
