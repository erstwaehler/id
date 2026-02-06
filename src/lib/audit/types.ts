/**
 * Comprehensive audit event types and interfaces for EWF-ID OIDC provider
 * Based on Better Auth plugin analysis and OTEL integration
 */

export interface AuditEvent {
  // Core identifiers
  event_type: string;
  event_category: "auth" | "admin" | "security" | "system";
  timestamp: string; // ISO 8601

  // Actor information
  actor: {
    id?: string;
    type: "user" | "admin" | "system" | "anonymous";
    email?: string;
    session_id?: string;
  };

  // Target resource
  resource: {
    type:
      | "user"
      | "session"
      | "client"
      | "api_key"
      | "passkey"
      | "2fa"
      | "oauth_token";
    id?: string;
    name?: string;
  };

  // Action taken
  action:
    | "create"
    | "read"
    | "update"
    | "delete"
    | "authenticate"
    | "authorize"
    | "verify"
    | "revoke"
    | "enable"
    | "disable";

  // Result of the action
  result: "success" | "failure" | "denied" | "error";

  // Request context
  context: {
    ip_address?: string;
    user_agent?: string;
    path: string;
    method: string;
    client_id?: string; // For OIDC flows
  };

  // Event-specific metadata
  metadata?: Record<string, any>;

  // Error information (if result is failure/error)
  error?: {
    code?: string;
    message?: string;
  };
}

// Specific event type mappings for Better Auth endpoints
export const AuditEventMap = {
  // Authentication & Session Management
  "/sign-in/email": "user.login.email",
  "/sign-in/passkey": "user.login.passkey",
  "/sign-up/email": "user.register.email",
  "/sign-out": "user.logout",
  "/verify-email": "user.email.verify",
  "/reset-password": "user.password.reset",
  "/change-password": "user.password.change",
  "/forget-password": "user.password.forgot",

  // OAuth/OIDC flows
  "/oauth2/sign-in": "oauth.sign_in.initiated",
  "/oauth2/callback/athenaeum": "oauth.callback.athenaeum",
  "/oauth2/callback/vlg": "oauth.callback.vlg",
  "/oauth2/callback/igs": "oauth.callback.igs",
  "/oauth2/link": "oauth.account.link",
  "/oauth2/unlink": "oauth.account.unlink",

  // OIDC Provider endpoints (EWF-ID as IdP)
  "/oauth2/register": "oidc.client.register",
  "/oauth2/authorize": "oidc.authorization.request",
  "/oauth2/token": "oidc.token.issue",
  "/oauth2/userinfo": "oidc.userinfo.access",
  "/oauth2/consent": "oidc.consent.decision",
  "/oauth2/introspect": "oidc.token.introspect",
  "/oauth2/revoke": "oidc.token.revoke",

  // Two-Factor Authentication
  "/two-factor/enable": "2fa.enable",
  "/two-factor/disable": "2fa.disable",
  "/two-factor/get-totp-uri": "2fa.totp.setup",
  "/two-factor/verify-totp": "2fa.totp.verify",
  "/two-factor/send-otp": "2fa.otp.send",
  "/two-factor/verify-otp": "2fa.otp.verify",
  "/two-factor/generate-backup-codes": "2fa.backup_codes.generate",
  "/two-factor/verify-backup-code": "2fa.backup_codes.verify",
  "/two-factor/view-backup-codes": "2fa.backup_codes.view",

  // Passkey (WebAuthn)
  "/passkey/add": "passkey.register",
  "/passkey/sign-in": "passkey.authenticate",
  "/passkey/list": "passkey.list",
  "/passkey/delete": "passkey.delete",
  "/passkey/update": "passkey.update",

  // Admin operations
  "/admin/create-user": "admin.user.create",
  "/admin/list-users": "admin.user.list",
  "/admin/set-role": "admin.user.role_change",
  "/admin/set-user-password": "admin.user.password_change",
  "/admin/update-user": "admin.user.update",
  "/admin/ban-user": "admin.user.ban",
  "/admin/unban-user": "admin.user.unban",
  "/admin/list-user-sessions": "admin.session.list",
  "/admin/revoke-user-session": "admin.session.revoke",
  "/admin/revoke-user-sessions": "admin.session.revoke_all",
  "/admin/impersonate-user": "admin.user.impersonate_start",
  "/admin/stop-impersonating": "admin.user.impersonate_stop",
  "/admin/remove-user": "admin.user.delete",
  "/admin/has-permission": "admin.permission.check",

  // API Key Management
  "/api-key/create": "api_key.create",
  "/api-key/verify": "api_key.verify",
  "/api-key/get": "api_key.read",
  "/api-key/update": "api_key.update",
  "/api-key/delete": "api_key.delete",
  "/api-key/list": "api_key.list",

  // Multi-Session Management
  "/multi-session/list-device-sessions": "multi_session.list",
  "/multi-session/set-active": "multi_session.switch",
  "/multi-session/revoke": "multi_session.revoke",

  // System/Docs
  "/reference": "system.docs.access",
  "/open-api/generate-schema": "system.schema.generate",
} as const;

// Helper type for event mapping
export type AuditPath = keyof typeof AuditEventMap;
export type AuditEventType = (typeof AuditEventMap)[AuditPath];

// Security risk levels for events
export const SecurityRiskLevels = {
  // Critical - immediate attention required
  CRITICAL: [
    "admin.user.delete",
    "admin.user.impersonate_start",
    "api_key.create",
    "oidc.client.register",
    "2fa.disable",
    "passkey.delete",
    "admin.user.ban",
  ],

  // High - important security events
  HIGH: [
    "user.login.email",
    "user.login.passkey",
    "user.register.email",
    "user.password.change",
    "2fa.backup_codes.verify",
    "admin.user.role_change",
    "admin.session.revoke_all",
    "oidc.token.issue",
    "oauth.account.link",
  ],

  // Medium - routine security events
  MEDIUM: [
    "user.logout",
    "2fa.totp.verify",
    "passkey.authenticate",
    "oidc.authorization.request",
    "api_key.verify",
    "multi_session.switch",
  ],

  // Low - informational events
  LOW: [
    "system.docs.access",
    "oidc.userinfo.access",
    "passkey.list",
    "api_key.list",
    "admin.user.list",
  ],
} as const;

// Categorize event types
export function getEventCategory(
  eventType: string,
): AuditEvent["event_category"] {
  if (eventType.startsWith("admin.")) return "admin";
  if (eventType.startsWith("system.")) return "system";
  if (
    eventType.includes("fail") ||
    eventType.includes("deny") ||
    eventType.includes("ban")
  )
    return "security";
  return "auth";
}

// Determine security risk level
export function getSecurityRiskLevel(
  eventType: string,
): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
  if (SecurityRiskLevels.CRITICAL.includes(eventType as any)) return "CRITICAL";
  if (SecurityRiskLevels.HIGH.includes(eventType as any)) return "HIGH";
  if (SecurityRiskLevels.MEDIUM.includes(eventType as any)) return "MEDIUM";
  return "LOW"; // Default
}
