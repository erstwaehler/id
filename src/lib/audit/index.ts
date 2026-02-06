/**
 * Audit system exports for EWF-ID
 * Comprehensive OIDC provider audit logging with OTEL integration
 */

export * from "./hooks";
export { auditAfterHook, auditBeforeHook } from "./hooks";
export * from "./types";

// Main exports for easy usage
export { type AuditEvent, AuditEventMap, SecurityRiskLevels } from "./types";
export * from "./utils";
export { extractAuditEvent, logAuditEvent } from "./utils";
