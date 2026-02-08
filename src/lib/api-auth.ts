/**
 * EWF-ID API Authentication Middleware
 * SPEC.md Phase 5 - Task 5.4: API Key Authentication
 *
 * Provides authentication for API routes via session or API key
 * Uses Better Auth's built-in API key plugin
 */

import { AuthenticationError, BetterAuthAPIError } from "'defective/betterauth";
import { annotateThis } from "'defective/o11y";
import {
  convertDefective,
  killDefectiveLogic,
  TypescriptVSEffectError,
} from "'defective/wtf";
import { Tracer } from "@effect/opentelemetry";
import { APIError } from "better-auth";
import type { UserWithRole } from "better-auth/plugins";
import { Cache, Context, Data, Duration, Effect, Layer } from "effect";
import { auth } from "#auth";
import { Role } from "./permissions";

export class AuthenticationResult extends Data.TaggedClass(
  "AuthenticationResult",
)<{
  // readonly authenticated: boolean; // AuthenticationResult will allways be authenticated because else it will fail with an AuthenticationError
  readonly user?: UserWithRole;
  readonly method: "api_key" | "bearer" | "none";
}> {}

// biome-ignore lint/suspicious/noExplicitAny: Type helper
type rtp<T extends (...args: any) => any> = Awaited<ReturnType<T>>;

export class User extends Context.Tag("UserService")<
  User,
  {
    readonly fetchById: (
      userId: string,
    ) => Effect.Effect<rtp<typeof auth.api.getUser>, BetterAuthAPIError, never>;
    readonly hasRole: (
      userId: string,
      role: string,
    ) => Effect.Effect<boolean, BetterAuthAPIError, never>;
    readonly revokeSession: (
      sessionId: string,
    ) => Effect.Effect<
      rtp<typeof auth.api.revokeUserSession>,
      BetterAuthAPIError,
      never
    >;
  }
>() {}

const _internalFetchUserById = Effect.fn("service.user.fetchUserById")(
  function* (userId: string) {
    const traceparent = yield* Tracer.currentOtelSpan.pipe(
      annotateThis,
      Effect.map(
        (s) => `00-${s.spanContext().traceId}-${s.spanContext().spanId}-01`,
      ),
      Effect.orElseSucceed(() => undefined),
    );

    return yield* Effect.tryPromise({
      try: async () =>
        await auth.api.getUser({
          query: {
            id: userId,
          },
          headers: traceparent ? { traceparent } : undefined,
        }),
      catch: (error) => {
        if (
          error instanceof APIError &&
          (error.status === 404 || error.status === "NOT_FOUND")
        ) {
          return new BetterAuthAPIError({
            message: "User not found",
            code: 404,
            reason: "UserNotFound",
          });
        }

        return new BetterAuthAPIError({
          message: JSON.stringify(error),
          code: 500,
          reason: "UnexpectedThrow",
        });
      },
    }).pipe(annotateThis);
  },
);

const _internalRevokeSession = Effect.fn("service.user.revokeSession")(
  function* (sessionId: string) {
    const traceparent = yield* Tracer.currentOtelSpan.pipe(
      annotateThis,
      Effect.map(
        (s) => `00-${s.spanContext().traceId}-${s.spanContext().spanId}-01`,
      ),
      Effect.orElseSucceed(() => undefined),
    );

    return yield* Effect.tryPromise({
      try: async () =>
        await auth.api.revokeUserSession({
          body: {
            sessionToken: sessionId,
          },
          headers: traceparent
            ? {
                traceparent,
              }
            : undefined,
        }),
      catch: (error) => {
        if (
          error instanceof APIError &&
          (error.status === 404 || error.status === "NOT_FOUND")
        ) {
          return new BetterAuthAPIError({
            message: "Session not found",
            code: 404,
            reason: "SessionNotFound",
          });
        }

        return new BetterAuthAPIError({
          message: JSON.stringify(error),
          code: 500,
          reason: "UnexpectedThrow",
        });
      },
    }).pipe(annotateThis);
  },
);

export const UserLive = Layer.effect(
  User,
  Effect.gen(function* () {
    const fetchUserById = yield* Cache.make({
      capacity: 100,
      timeToLive: Duration.minutes(5),
      lookup: _internalFetchUserById,
    });

    return {
      fetchById: (userId: string) => fetchUserById.get(userId),
      revokeSession: (userId: string) => _internalRevokeSession(userId),
      hasRole: (userId: string, role: string) =>
        fetchUserById.get(userId).pipe(
          Effect.map((user) => {
            if (!user.role) return false;

            const roleHierarchy: Record<string, number> = {
              [Role.USER]: 1,
              [Role.STUDENT]: 2,
              [Role.TEACHER]: 3,
              [Role.TEAM]: 4,
              [Role.ADMIN]: 5,
            };

            const userLevel = roleHierarchy[user.role] || 0;
            const requiredLevel = roleHierarchy[role] || 0;

            return userLevel >= requiredLevel;
          }),
        ),
    };
  }),
);

/**
 * Authenticate a request using session or API key
 */
export const authenticateRequest = Effect.fn("api.authenticateRequest")(
  function* (request: Request) {
    const authHeader = request.headers.get("authorization");
    const userService = yield* User;

    // API Key Authentication
    if (authHeader?.startsWith("Bearer ")) {
      yield* Effect.log("Attempting API key authentication", {
        attributes: {
          "auth.method": "api_key",
        },
      });
      const token = authHeader.slice(7);

      const result = yield* Effect.tryPromise({
        try: async () =>
          await auth.api.verifyApiKey({
            headers: request.headers,
            body: {
              key: token,
            },
          }),
        catch: (error) => {
          return new BetterAuthAPIError({
            message: JSON.stringify(error),
            code: 500,
            reason: "UnexpectedThrow",
          });
        },
      }).pipe(
        Effect.tap((result) => {
          if (!result.valid || !result.key)
            return Effect.fail(
              new AuthenticationError({
                message: "Invalid API key",
                code: 401,
                reason: "InvalidCredentials",
              }),
            );
          return Effect.void;
        }),
        annotateThis,
        Effect.catchTag("BetterAuthAPIError", (error) => {
          return Effect.fail(
            new AuthenticationError({
              message: error.message,
              code: error.code,
              reason: "ServerError",
            }),
          );
        }),
      );

      if (!result.valid || !result.key) {
        return yield* Effect.fail(
          new TypescriptVSEffectError({
            location: "API Key Valid Check",
            path: "~/lib/api-auth.ts:authenticateRequest",
          }),
        ).pipe(annotateThis, convertDefective, killDefectiveLogic);
      }
      yield* Effect.log("API Key Authentication Succeeded");

      const user = yield* userService.fetchById(result.key.userId).pipe(
        Effect.catchTag("BetterAuthAPIError", (error) => {
          // This implies that the API key is valid but the user does not exist
          if (error.reason === "UserNotFound") {
            return new BetterAuthAPIError({
              reason: "DetachedDataState",
              message: "API key is valid but user does not exist",
              code: 409,
            });
          }
          return Effect.fail(error);
        }),
        annotateThis,
        Effect.catchTag("BetterAuthAPIError", (error) => {
          return Effect.fail(
            new AuthenticationError({
              message: error.message,
              code: error.code,
              reason: "ServerError",
            }),
          );
        }),
      );

      return yield* Effect.succeed(
        new AuthenticationResult({
          user,
          method: "api_key",
        }),
      );
    }

    // Bearer Token Authentication
    yield* Effect.log("Attempting Bearer token authentication");
    const session = yield* Effect.tryPromise({
      try: async () =>
        await auth.api.getSession({
          headers: request.headers,
        }),
      catch: (error) => {
        return new BetterAuthAPIError({
          message: JSON.stringify(error),
          code: 500,
          reason: "UnexpectedThrow",
        });
      },
    }).pipe(
      annotateThis,
      Effect.catchTag("BetterAuthAPIError", (error) => {
        return Effect.fail(
          new AuthenticationError({
            message: error.message,
            code: error.code,
            reason: "ServerError",
          }),
        );
      }),
    );

    if (session) {
      yield* Effect.log("Bearer Authentication Succeded", {
        attributes: {
          "auth.method": "bearer",
        },
      });
      // Fetch it again to get consistent user data
      const user = yield* userService.fetchById(session.user.id).pipe(
        Effect.catchTag("BetterAuthAPIError", (error) => {
          // This implies that the API key is valid but the user does not exist
          if (error.reason === "UserNotFound") {
            return new BetterAuthAPIError({
              reason: "DetachedDataState",
              message: "API key is valid but user does not exist",
              code: 409,
            });
          }
          return Effect.fail(error);
        }),
        annotateThis,
        Effect.catchTag("BetterAuthAPIError", (error) => {
          return Effect.fail(
            new AuthenticationError({
              message: error.message,
              code: error.code,
              reason: "ServerError",
            }),
          );
        }),
      );

      return yield* Effect.succeed(
        new AuthenticationResult({
          user,
          method: "bearer",
        }),
      );
    }

    return yield* Effect.fail(
      new AuthenticationError({
        reason: "InvalidCredentials",
        message: "No valid authentication provided",
        code: 401,
      }),
    );
  },
);

export const userHasRole = Effect.fn("api.userHasRole")(function* (
  _userId: string,
) {});

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(message = "Unauthorized"): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Create forbidden response
 */
export function forbiddenResponse(message = "Forbidden"): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}
