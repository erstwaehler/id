/**
 * EWF-ID Session Revocation API
 * SPEC.md Phase 5 - Task 5.2
 *
 * DELETE /api/users/me/sessions/$sessionId - Revoke a specific session
 */

import { BetterAuthAPIError } from "'defective/betterauth";
import { annotateThis, otelLive } from "'defective/o11y";
import { Tracer } from "@effect/opentelemetry";
import { createFileRoute } from "@tanstack/react-router";
import { Effect } from "effect";
import { authenticateRequest, User, UserLive } from "~/lib/api-auth";
import { useServerTrace } from "~/lib/telemery/defective";
import { posthog } from "~/server";

export const Route = createFileRoute("/api/users/me/sessions/$sessionId")({
  server: {
    handlers: {
      DELETE: async ({ request, params }) => {
        const { startTrace } = useServerTrace();

        const program = Effect.gen(function* () {
          yield* authenticateRequest(request);
          const user = yield* User;

          yield* user.revokeSession(params.sessionId).pipe(
            annotateThis,
            Effect.tap((res) => {
              if (!res.success) {
                return Effect.fail(
                  new BetterAuthAPIError({
                    code: 400,
                    message: "Session not found",
                    reason: "SessionNotFound",
                  }),
                );
              }
            }),
          );

          return new Response("Session revoked", { status: 200 });
        }).pipe(
          annotateThis,
          Effect.tapError((error) =>
            Effect.sync(() => {
              posthog?.capture({
                distinctId: "server",
                event: "telemetry.error",
                properties: {
                  traceId: trace.getTraceId(),
                  error: String(error),
                },
              });
            }),
          ),
          // Fehler-Mapping auf Response Objekte
          Effect.catchTag("AuthenticationError", (error) =>
            Effect.succeed(
              new Response(error.message, {
                status: error.code,
                statusText: error.reason,
              }),
            ),
          ),
          Effect.withSpan("handleAxiosResponse"),
        );

        const trace = startTrace("api.users.me.sessions.$sessionId DELETE");
        trace.extractFromHeaders(request.headers);
        trace.setAttributes({
          "http.method": request.method,
          "http.url": request.url,
        });

        const ctx = trace.getSpanContext();

        const response = await Effect.runPromise(
          program.pipe(
            Effect.provide(UserLive),
            Effect.provide(otelLive),
            Tracer.withSpanContext(ctx),
          ),
        );
        trace.end();
        return response;
      },
    },
  },
});
