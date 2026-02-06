/**
 * Enhanced Better Auth hooks with comprehensive audit logging
 * Supports all plugins: twoFactor, admin, passkey, bearer, multiSession,
 * genericOAuth, oidcProvider, apiKey, and core auth flows
 */

import { createAuthMiddleware } from "better-auth/plugins";
import { useServerTrace } from "../telemery/defective";
import { extractAuditEvent, logAuditEvent } from "./utils";

/**
 * Enhanced "before" hook with audit logging
 * Captures the initiation of all auth operations
 */
export const auditBeforeHook = createAuthMiddleware(async (ctx) => {
  const { startTrace } = useServerTrace();
  const trace = startTrace("auth.hook.before");

  try {
    // Extract trace context from incoming request
    trace.extractFromHeaders(ctx.request?.headers ?? {});
    trace.setAttribute("path", ctx.path);
    trace.setAttribute("method", ctx.method || "POST");
    trace.addEvent("auth_hook_before_executed");

    // Log the request initiation (before processing)
    const auditEvent = extractAuditEvent({
      path: ctx.path,
      method: ctx.method,
      headers: ctx.request?.headers,
      body: ctx.body,
      query: ctx.query,
      context: {
        // Before hook - no results yet
      },
    });

    if (auditEvent) {
      // Override result to 'pending' for before hooks
      auditEvent.result = "success"; // Will be updated in after hook
      auditEvent.metadata = {
        ...auditEvent.metadata,
        hook_phase: "before",
        request_id: trace.getTraceId(),
      };
      logAuditEvent(auditEvent);
    }

    trace.end();

    // Return enhanced context with trace headers
    return {
      context: {
        ...ctx,
        request: {
          ...ctx.request,
          headers: {
            ...ctx.request?.headers,
            ...trace.getHeaders(),
          },
        },
      },
    };
  } catch (error) {
    trace.error(error);
    throw error;
  }
});

/**
 * Enhanced "after" hook with comprehensive audit logging
 * Captures the completion and results of all auth operations
 */
export const auditAfterHook = createAuthMiddleware(async (ctx) => {
  const { startTrace } = useServerTrace();
  const trace = startTrace("auth.hook.after");

  try {
    // Extract trace context from request
    trace.extractFromHeaders(ctx.request?.headers ?? {});
    trace.setAttribute("path", ctx.path);
    trace.setAttribute("method", ctx.method || "POST");

    // Determine if the operation was successful
    const isError = !!ctx.context.error;
    const hasNewSession = !!ctx.context.newSession;
    const wasSuccessful =
      !isError &&
      (hasNewSession ||
        ctx.path.includes("/list") ||
        ctx.path.includes("/get") ||
        ctx.path === "/sign-out");

    trace.setAttribute("operation_successful", wasSuccessful);
    trace.setAttribute("has_new_session", hasNewSession);
    trace.setAttribute("has_error", isError);

    // Extract comprehensive audit event data
    const auditEvent = extractAuditEvent({
      path: ctx.path,
      method: ctx.method,
      headers: ctx.request?.headers,
      body: ctx.body,
      query: ctx.query,
      context: {
        newSession: ctx.context.newSession,
        user: ctx.context.user,
        session: ctx.context.session,
        returned: ctx.context.returned,
        responseHeaders: ctx.context.responseHeaders,
        authCookies: ctx.context.authCookies,
        error: ctx.context.error,
        // Admin context
        adminUserId: ctx.context.adminUserId,
        targetUserId: ctx.context.targetUserId,
        impersonatedBy: ctx.context.impersonatedBy,
      },
    });

    if (auditEvent) {
      // Add after-hook specific metadata
      auditEvent.metadata = {
        ...auditEvent.metadata,
        hook_phase: "after",
        request_id: trace.getTraceId(),
        operation_successful: wasSuccessful,
        has_new_session: hasNewSession,

        // Session information if available
        ...(ctx.context.newSession && {
          session_token: `${ctx.context.newSession.session?.token?.substring(0, 8)}...`,
          session_user_id: ctx.context.newSession.user?.id,
          session_user_email: ctx.context.newSession.user?.email,
        }),

        // Error context if present
        ...(ctx.context.error && {
          error_type: ctx.context.error.constructor?.name,
          error_code: (ctx.context.error as any).code,
        }),
      };

      // Enhanced event logging with path-specific attributes
      addPathSpecificAuditAttributes(ctx.path, auditEvent, ctx);

      logAuditEvent(auditEvent);
    }

    trace.addEvent("auth_hook_after_executed", {
      path: ctx.path,
      successful: wasSuccessful,
      has_session: hasNewSession,
    });

    trace.end();

    // Prepare response headers with trace information
    const traceHeaders = trace.getHeaders();
    const responseHeaders = new Headers(ctx.context.responseHeaders);

    // Add trace headers to response
    Object.entries(traceHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    // Add audit metadata to response headers (for debugging in dev)
    if (process.env.NODE_ENV === "development" && auditEvent) {
      responseHeaders.set("x-audit-event-type", auditEvent.event_type);
      responseHeaders.set("x-audit-request-id", trace.getTraceId());
    }

    return {
      context: {
        ...ctx,
        responseHeaders,
      },
    };
  } catch (error) {
    trace.error(error);
    throw error;
  }
});

/**
 * Add path-specific audit attributes based on Better Auth endpoint
 */
function addPathSpecificAuditAttributes(
  path: string,
  auditEvent: any,
  ctx: any,
) {
  const metadata = auditEvent.metadata || {};

  // Two-Factor Authentication specific attributes
  if (path.startsWith("/two-factor/")) {
    if (ctx.body?.code) metadata.code_length = ctx.body.code.length;
    if (ctx.body?.trust_device !== undefined)
      metadata.trust_device = ctx.body.trust_device;
    if (path.includes("backup-code")) metadata.backup_code_used = true;
    if (path.includes("totp")) metadata.auth_method = "totp";
    if (path.includes("otp")) metadata.auth_method = "otp";
  }

  // Admin operations specific attributes
  else if (path.startsWith("/admin/")) {
    if (ctx.body?.role) metadata.target_role = ctx.body.role;
    if (ctx.body?.ban_reason) metadata.ban_reason = ctx.body.ban_reason;
    if (ctx.body?.ban_expires_in)
      metadata.ban_duration = ctx.body.ban_expires_in;
    if (ctx.context?.targetUserId)
      metadata.target_user_id = ctx.context.targetUserId;
    if (path.includes("impersonate"))
      metadata.admin_operation = "impersonation";
    if (path.includes("ban")) metadata.admin_operation = "user_management";
    if (path.includes("role"))
      metadata.admin_operation = "permission_management";
  }

  // Passkey (WebAuthn) specific attributes
  else if (path.startsWith("/passkey/")) {
    if (ctx.body?.name) metadata.passkey_name = ctx.body.name;
    if (ctx.body?.authenticator_type)
      metadata.authenticator_type = ctx.body.authenticator_type;
    if (ctx.context?.authenticatorId)
      metadata.authenticator_id = ctx.context.authenticatorId;
    if (path.includes("sign-in")) metadata.auth_method = "passkey";
  }

  // API Key specific attributes
  else if (path.startsWith("/api-key/")) {
    if (ctx.body?.name) metadata.api_key_name = ctx.body.name;
    if (ctx.body?.permissions)
      metadata.api_key_permissions = ctx.body.permissions;
    if (ctx.body?.expires_in) metadata.api_key_expires_in = ctx.body.expires_in;
    if (ctx.context?.keyId) metadata.api_key_id = ctx.context.keyId;
  }

  // OAuth/OIDC specific attributes
  else if (path.startsWith("/oauth2/")) {
    if (ctx.query?.client_id || ctx.body?.client_id) {
      metadata.client_id = ctx.query?.client_id || ctx.body?.client_id;
    }
    if (ctx.query?.scopes || ctx.body?.scopes) {
      metadata.requested_scopes = ctx.query?.scopes || ctx.body?.scopes;
    }
    if (ctx.body?.grant_type) metadata.grant_type = ctx.body.grant_type;
    if (ctx.body?.response_type)
      metadata.response_type = ctx.body.response_type;
    if (ctx.query?.redirect_uri || ctx.body?.redirect_uri) {
      metadata.redirect_uri = ctx.query?.redirect_uri || ctx.body?.redirect_uri;
    }

    // Provider-specific for OAuth callbacks
    if (path.includes("callback/")) {
      const provider = path.split("callback/")[1];
      metadata.oauth_provider = provider;
      metadata.auth_method = `oauth_${provider}`;
    }

    // OIDC Provider specific (when EWF-ID acts as IdP)
    if (path.includes("authorize")) metadata.oidc_flow = "authorization_code";
    if (path.includes("token")) metadata.oidc_flow = "token_exchange";
    if (path.includes("userinfo")) metadata.oidc_endpoint = "userinfo";
    if (path.includes("consent")) metadata.oidc_flow = "consent_decision";
  }

  // Multi-session specific attributes
  else if (path.startsWith("/multi-session/")) {
    if (ctx.body?.session_token)
      metadata.target_session = ctx.body.session_token.substring(0, 8) + "...";
    if (path.includes("list")) metadata.session_operation = "list";
    if (path.includes("set-active")) metadata.session_operation = "switch";
    if (path.includes("revoke")) metadata.session_operation = "revoke";
  }

  // Core authentication flows
  else if (path.startsWith("/sign-")) {
    if (ctx.body?.email) metadata.email_domain = ctx.body.email.split("@")[1];
    if (ctx.body?.provider) metadata.auth_provider = ctx.body.provider;
    if (path.includes("sign-in")) {
      metadata.auth_method = ctx.body?.provider
        ? `oauth_${ctx.body.provider}`
        : "email_password";
    }
    if (path.includes("sign-up")) {
      metadata.registration_method = ctx.body?.provider
        ? `oauth_${ctx.body.provider}`
        : "email_password";
      if (ctx.context?.newSession?.user?.school) {
        metadata.user_school = ctx.context.newSession.user.school;
      }
    }
  }

  // Password operations
  else if (path.includes("password")) {
    if (path.includes("reset")) metadata.password_operation = "reset";
    if (path.includes("change")) metadata.password_operation = "change";
    if (path.includes("forget")) metadata.password_operation = "forgot";
    if (ctx.body?.compromised_check !== undefined)
      metadata.hibp_check = ctx.body.compromised_check;
  }

  // Email verification
  else if (path.includes("verify-email")) {
    metadata.verification_method = "email";
    if (ctx.query?.token) metadata.has_verification_token = true;
  }

  auditEvent.metadata = metadata;
}
