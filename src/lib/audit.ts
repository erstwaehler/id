/**
 * EWF-ID Audit Logging Utility
 * SPEC.md Phase 7 - Task 7.4
 *
 * Shared audit logging functionality for all API routes
 */

import { annotateThis } from "'defective/o11y";
import { createHash, randomUUID, scryptSync } from "node:crypto";
import { Context, Data, Effect, Layer } from "effect";
import env from "#env";
import { auditLog } from "~/lib/auth/schema/audit";
import { db } from "~/lib/auth-db";

const ENCRYPTION_KEY = env.ENCRYPTION_KEY;

export class AuditError extends Data.TaggedClass("AuditError")<{
  readonly message: string;
  readonly reason: "DatabaseError" | "HashingError";
  readonly cause?: unknown;
}> {}

export interface AuditLogOptions {
  userId: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
  result?: "success" | "failure";
  errorMessage?: string;
  duration?: number;
  traceId?: string;
  spanId?: string;
}

/**
 * Audit Service Definition
 */
export class AuditService extends Context.Tag("AuditService")<
  AuditService,
  {
    readonly log: (
      options: AuditLogOptions,
      request?: Request,
    ) => Effect.Effect<void, AuditError>;
  }
>() {}

/**
 * Hash IP address for GDPR compliance using strengthened hashing
 * Uses scrypt with a complex salt derived from ENCRYPTION_KEY
 */
export const hashIpAddress = (ip: string): string => {
  // Create a complex salt using the requested combination: 2x SHA512 + MD5 of the ENCRYPTION_KEY
  const saltStage1 = createHash("sha512").update(ENCRYPTION_KEY).digest("hex");
  const saltStage2 = createHash("sha512").update(saltStage1).digest("hex");
  const finalSalt = createHash("md5").update(saltStage2).digest("hex");

  // Use scrypt for key derivation/hashing (similar strength to argon2 for this purpose)
  // We use sync here since this is likely called in contexts where async might be tricky or we want simplicity in the pure function
  // but wrapping it in Effect handles the sync nature gracefully.
  // 64 length, N=16384, r=8, p=1 are reasonable defaults for scrypt
  return scryptSync(ip, finalSalt, 32).toString("hex");
};

/**
 * Live implementation of AuditService
 */
export const AuditServiceLive = Layer.effect(
  AuditService,
  Effect.succeed({
    log: (options: AuditLogOptions, request?: Request) =>
      Effect.gen(function* () {
        const rawIp = request
          ? request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown"
          : "system";

        // Hash IP safely
        const ipAddressHash = yield* Effect.try({
          try: () => hashIpAddress(rawIp),
          catch: (error) =>
            new AuditError({
              message: "Failed to hash IP address",
              reason: "HashingError",
              cause: error,
            }),
        });

        const userAgent = request
          ? request.headers.get("user-agent") || "unknown"
          : "system";

        // Perform DB insertion
        yield* Effect.tryPromise({
          try: async () => {
            await db.insert(auditLog).values({
              id: randomUUID(),
              userId: options.userId,
              action: options.action,
              resource: options.resource,
              resourceId: options.resourceId ?? null,
              metadata: options.metadata ?? {},
              ipAddressHash,
              userAgent,
              traceId: options.traceId ?? null,
              spanId: options.spanId ?? null,
              result: options.result ?? "success",
              errorMessage: options.errorMessage ?? null,
              duration: options.duration ?? null,
            });
          },
          catch: (error) =>
            new AuditError({
              message: "Failed to insert audit log",
              reason: "DatabaseError",
              cause: error,
            }),
        });
      }).pipe(annotateThis, Effect.ignoreLogged),
  }),
);

/**
 * Audit action categories for consistency
 */
export const AuditActions = {
  // Authentication
  USER_REGISTER: "user.register",
  USER_LOGIN: "user.login",
  USER_LOGOUT: "user.logout",
  USER_VERIFY_EMAIL: "user.verify_email",
  PASSWORD_RESET_REQUEST: "password.reset_request",
  PASSWORD_RESET_COMPLETE: "password.reset_complete",
  PASSWORD_CHANGE: "password.change",

  // 2FA
  TWO_FACTOR_ENABLE: "2fa.enable",
  TWO_FACTOR_DISABLE: "2fa.disable",
  TWO_FACTOR_VERIFY: "2fa.verify",
  TWO_FACTOR_BACKUP_USE: "2fa.backup_use",

  // Passkeys
  PASSKEY_REGISTER: "passkey.register",
  PASSKEY_AUTHENTICATE: "passkey.authenticate",
  PASSKEY_REMOVE: "passkey.remove",

  // Sessions
  SESSION_CREATE: "session.create",
  SESSION_REVOKE: "session.revoke",
  SESSION_LIST: "sessions.list",

  // Profile
  PROFILE_VIEW: "profile.view",
  PROFILE_UPDATE: "profile.update",
  AVATAR_UPLOAD: "avatar.upload",
  LOCALE_CHANGE: "locale.change",

  // API Keys
  API_KEY_CREATE: "api_key.create",
  API_KEY_REVOKE: "api_key.revoke",
  API_KEY_USE: "api_key.use",

  // GDPR
  DATA_EXPORT_REQUEST: "data_export.request",
  DATA_EXPORT_DOWNLOAD: "data_export.download",
  ACCOUNT_DELETION_REQUEST: "account_deletion.request",
  ACCOUNT_DELETION_CANCEL: "account_deletion.cancel",
  ACCOUNT_DELETION_COMPLETE: "account_deletion.complete",

  // OIDC
  OIDC_AUTHORIZE: "oidc.authorize",
  OIDC_TOKEN_ISSUE: "oidc.token.issue",
  OIDC_TOKEN_REFRESH: "oidc.token.refresh",
  OIDC_TOKEN_REVOKE: "oidc.token.revoke",
  OIDC_USERINFO: "oidc.userinfo",

  // Admin - Users
  ADMIN_USER_VIEW: "admin.user.view",
  ADMIN_USER_UPDATE: "admin.user.update",
  ADMIN_USER_DELETE: "admin.user.delete",
  ADMIN_USER_SUSPEND: "admin.user.suspend",
  ADMIN_USER_UNSUSPEND: "admin.user.unsuspend",
  ADMIN_USERS_LIST: "admin.users.list",

  // Admin - Roles
  ADMIN_ROLE_ASSIGN: "admin.role.assign",
  ADMIN_ROLE_REVOKE: "admin.role.revoke",

  // Admin - Schools
  ADMIN_SCHOOL_CREATE: "admin.school.create",
  ADMIN_SCHOOL_UPDATE: "admin.school.update",
  ADMIN_SCHOOL_DELETE: "admin.school.delete",

  // Admin - OIDC Clients
  ADMIN_OIDC_CLIENT_CREATE: "admin.oidc_client.create",
  ADMIN_OIDC_CLIENT_UPDATE: "admin.oidc_client.update",
  ADMIN_OIDC_CLIENT_DELETE: "admin.oidc_client.delete",

  // Admin - Analytics
  ADMIN_ANALYTICS_VIEW: "admin.analytics.view",
} as const;

export type AuditAction = (typeof AuditActions)[keyof typeof AuditActions];

/**
 * Resource types for audit logging
 */
export const AuditResources = {
  USER: "user",
  SESSION: "session",
  PASSKEY: "passkey",
  API_KEY: "api_key",
  SCHOOL: "school",
  OIDC_CLIENT: "oidc_client",
  OIDC_AUTHORIZATION: "oidc_authorization",
  OIDC_TOKEN: "oidc_token",
  OIDC_USERINFO: "oidc_userinfo",
  DATA_EXPORT: "data_export",
  ACCOUNT_DELETION: "account_deletion",
  ANALYTICS: "analytics",
} as const;

export type AuditResource =
  (typeof AuditResources)[keyof typeof AuditResources];

/**
 * Helper to create an audit log entry (compatible with previous non-effect usage if needed,
 * but prefer using AuditService)
 */
export async function createAuditLog(
  options: AuditLogOptions,
  request?: Request,
): Promise<void> {
  // This is a bridge for legacy code. Ideally, everything should use the Effect service.
  // We construct a temporary runtime to run the effect.
  const program = Effect.gen(function* () {
    const auditService = yield* AuditService;
    return yield* auditService.log(options, request);
  }).pipe(Effect.provide(AuditServiceLive));

  await Effect.runPromise(program);
}
