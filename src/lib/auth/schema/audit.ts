// /**
//  * EWF-ID Custom Tables Schema
//  * Only audit logs are needed - other tables are managed by Better Auth plugins.
//  */
// import { relations } from "drizzle-orm";
// import {
//   index,
//   integer,
//   jsonb,
//   pgEnum,
//   pgTable,
//   text,
//   timestamp,
// } from "drizzle-orm/pg-core";
// import { user } from "./betterauth";

// /**
//  * Audit Log Result Enum
//  */
// export const auditResultEnum = pgEnum("audit_result", ["success", "failure"]);

// /**
//  * Audit Logs Table
//  * Comprehensive audit trail for GDPR compliance
//  * Note: IP addresses are hashed for GDPR compliance
//  */
// export const auditLog = pgTable(
//   "audit_log",
//   {
//     id: text("id").primaryKey(),
//     timestamp: timestamp("timestamp").defaultNow().notNull(),
//     userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
//     action: text("action").notNull(),
//     resource: text("resource").notNull(),
//     resourceId: text("resource_id"),
//     metadata: jsonb("metadata").$type<Record<string, unknown>>(),
//     ipAddressHash: text("ip_address_hash"),
//     userAgent: text("user_agent"),
//     traceId: text("trace_id"),
//     spanId: text("span_id"),
//     result: auditResultEnum("result").notNull().default("success"),
//     errorMessage: text("error_message"),
//     duration: integer("duration"),
//     createdAt: timestamp("created_at").defaultNow().notNull(),
//   },
//   (table) => [
//     index("audit_log_user_id_idx").on(table.userId),
//     index("audit_log_action_idx").on(table.action),
//     index("audit_log_resource_idx").on(table.resource),
//     index("audit_log_timestamp_idx").on(table.timestamp),
//     index("audit_log_trace_id_idx").on(table.traceId),
//   ],
// );

// // Relations
// export const auditLogRelations = relations(auditLog, ({ one }) => ({
//   user: one(user, {
//     fields: [auditLog.userId],
//     references: [user.id],
//   }),
// }));
