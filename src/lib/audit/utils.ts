/**
 * Audit logging utilities for OTEL integration
 * Extracts audit-relevant data from Better Auth context
 */

import { useServerTrace } from "../telemery/defective";
import type { AuditEvent, AuditPath } from "./types";
import { AuditEventMap, getEventCategory, getSecurityRiskLevel } from "./types";

interface BetterAuthContext {
  path: string;
  method?: string;
  headers?: Headers | Record<string, string>;
  body?: any;
  query?: any;
  context?: {
    newSession?: any; // Better Auth session object
    user?: any;
    session?: any;
    returned?: any;
    responseHeaders?: Headers;
    authCookies?: any;
    // Admin context
    adminUserId?: string;
    targetUserId?: string;
    impersonatedBy?: string;
    // Error context
    error?: Error | { message: string; code?: string };
  };
}

/**
 * Extract audit event from Better Auth context
 */
export function extractAuditEvent(ctx: BetterAuthContext): AuditEvent | null {
  const eventType = AuditEventMap[ctx.path as AuditPath];
  if (!eventType) {
    // Unknown path - log as generic event
    return null;
  }

  const timestamp = new Date().toISOString();
  const session = ctx.context?.newSession;
  const user = session?.user || ctx.context?.user;

  // Determine if operation was successful
  const isError = !!ctx.context?.error;
  const result = isError ? "failure" : "success";

  // Extract IP and User Agent
  let ipAddress: string | undefined;
  let userAgent: string | undefined;

  if (ctx.headers) {
    if (ctx.headers instanceof Headers) {
      ipAddress =
        ctx.headers.get("x-forwarded-for") ||
        ctx.headers.get("x-real-ip") ||
        undefined;
      userAgent = ctx.headers.get("user-agent") || undefined;
    } else {
      ipAddress =
        ctx.headers["x-forwarded-for"] || ctx.headers["x-real-ip"] || undefined;
      userAgent = ctx.headers["user-agent"] || undefined;
    }
  }

  const auditEvent: AuditEvent = {
    event_type: eventType,
    event_category: getEventCategory(eventType),
    timestamp,

    actor: {
      id: user?.id || ctx.context?.adminUserId,
      type: determineActorType(user, ctx.context?.adminUserId),
      email: user?.email,
      session_id: session?.token || ctx.context?.session?.id,
    },

    resource: {
      type: determineResourceType(eventType),
      id: determineResourceId(ctx),
      name: determineResourceName(eventType, ctx),
    },

    action: determineAction(eventType),
    result,

    context: {
      ip_address: ipAddress,
      user_agent: userAgent,
      path: ctx.path,
      method: ctx.method || "POST",
      client_id: extractClientId(ctx),
    },

    metadata: extractMetadata(eventType, ctx),

    error: isError
      ? {
          code: (ctx.context?.error as any)?.code,
          message: ctx.context?.error?.message || String(ctx.context?.error),
        }
      : undefined,
  };

  return auditEvent;
}

/**
 * Log audit event to OTEL with proper attributes
 */
export function logAuditEvent(auditEvent: AuditEvent) {
  const { startTrace } = useServerTrace();
  const trace = startTrace(`audit.${auditEvent.event_type}`);

  // Set core audit attributes
  trace.setAttributes({
    // Event identification
    "audit.event_type": auditEvent.event_type,
    "audit.event_category": auditEvent.event_category,
    "audit.timestamp": auditEvent.timestamp,
    "audit.security_risk_level": getSecurityRiskLevel(auditEvent.event_type),

    // Actor attributes
    "audit.actor.id": auditEvent.actor.id || "anonymous",
    "audit.actor.type": auditEvent.actor.type,
    "audit.actor.email": auditEvent.actor.email || "unknown",
    "audit.actor.session_id": auditEvent.actor.session_id || "none",

    // Resource attributes
    "audit.resource.type": auditEvent.resource.type,
    "audit.resource.id": auditEvent.resource.id || "unknown",
    "audit.resource.name": auditEvent.resource.name || "unknown",

    // Action and result
    "audit.action": auditEvent.action,
    "audit.result": auditEvent.result,

    // Context attributes
    "audit.context.ip_address": auditEvent.context.ip_address || "unknown",
    "audit.context.user_agent": auditEvent.context.user_agent || "unknown",
    "audit.context.path": auditEvent.context.path,
    "audit.context.method": auditEvent.context.method,
    "audit.context.client_id": auditEvent.context.client_id || "none",
  });

  // Add metadata as individual attributes
  if (auditEvent.metadata) {
    for (const [key, value] of Object.entries(auditEvent.metadata)) {
      trace.setAttribute(`audit.metadata.${key}`, String(value));
    }
  }

  // Add error information if present
  if (auditEvent.error) {
    trace.setAttribute("audit.error.code", auditEvent.error.code || "unknown");
    trace.setAttribute(
      "audit.error.message",
      auditEvent.error.message || "unknown",
    );
  }

  // Add event to span
  trace.addEvent("audit_event_logged", {
    event_type: auditEvent.event_type,
    result: auditEvent.result,
    actor_id: auditEvent.actor.id || "anonymous",
  });

  trace.end();
}

/**
 * Helper functions for audit data extraction
 */

function determineActorType(
  user?: any,
  adminUserId?: string,
): "user" | "admin" | "system" | "anonymous" {
  if (adminUserId) return "admin";
  if (user?.role === "admin") return "admin";
  if (user) return "user";
  return "anonymous";
}

function determineResourceType(
  eventType: string,
): AuditEvent["resource"]["type"] {
  if (eventType.includes("session")) return "session";
  if (eventType.includes("api_key")) return "api_key";
  if (eventType.includes("passkey")) return "passkey";
  if (eventType.includes("2fa")) return "2fa";
  if (eventType.includes("oidc") || eventType.includes("oauth"))
    return "oauth_token";
  if (eventType.includes("client")) return "client";
  return "user";
}

function determineResourceId(ctx: BetterAuthContext): string | undefined {
  const user = ctx.context?.newSession?.user || ctx.context?.user;
  const targetUserId = ctx.context?.targetUserId;

  if (targetUserId) return targetUserId;
  if (user?.id) return user.id;

  // Try to extract from body/query
  if (ctx.body?.userId) return ctx.body.userId;
  if (ctx.query?.userId) return ctx.query.userId;
  if (ctx.body?.user_id) return ctx.body.user_id;

  return undefined;
}

function determineResourceName(
  eventType: string,
  ctx: BetterAuthContext,
): string | undefined {
  const user = ctx.context?.newSession?.user || ctx.context?.user;

  if (eventType.includes("passkey") && ctx.body?.name) return ctx.body.name;
  if (eventType.includes("api_key") && ctx.body?.name) return ctx.body.name;
  if (user?.email) return user.email;

  return undefined;
}

function determineAction(eventType: string): AuditEvent["action"] {
  if (
    eventType.includes("create") ||
    eventType.includes("register") ||
    eventType.includes("generate")
  )
    return "create";
  if (
    eventType.includes("delete") ||
    eventType.includes("remove") ||
    eventType.includes("revoke")
  )
    return "delete";
  if (
    eventType.includes("update") ||
    eventType.includes("change") ||
    eventType.includes("enable") ||
    eventType.includes("disable")
  )
    return "update";
  if (
    eventType.includes("list") ||
    eventType.includes("access") ||
    eventType.includes("view")
  )
    return "read";
  if (
    eventType.includes("login") ||
    eventType.includes("verify") ||
    eventType.includes("authenticate")
  )
    return "authenticate";
  if (eventType.includes("authorize") || eventType.includes("consent"))
    return "authorize";

  return "authenticate"; // Default for most auth operations
}

function extractClientId(ctx: BetterAuthContext): string | undefined {
  return ctx.query?.client_id || ctx.body?.client_id || ctx.body?.clientId;
}

function extractMetadata(
  eventType: string,
  ctx: BetterAuthContext,
): Record<string, any> | undefined {
  const metadata: Record<string, any> = {};

  // Common metadata
  if (ctx.query?.scopes || ctx.body?.scopes) {
    metadata.scopes = ctx.query?.scopes || ctx.body?.scopes;
  }

  if (ctx.body?.grant_type) {
    metadata.grant_type = ctx.body.grant_type;
  }

  if (ctx.body?.response_type) {
    metadata.response_type = ctx.body.response_type;
  }

  // Event-specific metadata
  if (eventType.includes("2fa")) {
    if (ctx.body?.trust_device !== undefined)
      metadata.trust_device = ctx.body.trust_device;
    if (ctx.body?.backup_code_used) metadata.backup_code_used = true;
  }

  if (eventType.includes("admin")) {
    if (ctx.context?.adminUserId)
      metadata.admin_user_id = ctx.context.adminUserId;
    if (ctx.context?.targetUserId)
      metadata.target_user_id = ctx.context.targetUserId;
    if (ctx.body?.role) metadata.new_role = ctx.body.role;
    if (ctx.body?.ban_reason) metadata.ban_reason = ctx.body.ban_reason;
  }

  if (eventType.includes("oauth") || eventType.includes("oidc")) {
    if (ctx.query?.provider_id || ctx.body?.provider_id) {
      metadata.provider_id = ctx.query?.provider_id || ctx.body?.provider_id;
    }
    if (ctx.query?.redirect_uri || ctx.body?.redirect_uri) {
      metadata.redirect_uri = ctx.query?.redirect_uri || ctx.body?.redirect_uri;
    }
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}
