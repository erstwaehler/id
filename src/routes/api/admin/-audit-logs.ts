/**
 * EWF-ID Admin Audit Logs API
 * MIGRATED: Audit logs are now handled via OTEL/Axiom
 *
 * Note: The audit system has been migrated to use OpenTelemetry
 * with Axiom. Audit logs are now stored in Axiom and accessible
 * via the Axiom dashboard rather than this API endpoint.
 *
 * See: src/lib/audit/README.md for querying audit data in Axiom
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { auth } from "#auth";

const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

async function getSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  return session;
}

function isAdmin(role: string | null): boolean {
  return role === "admin";
}

export const Route = createFileRoute("/api/admin/audit-logs")({
  server: {
    handlers: {
      // GET /api/admin/audit-logs - Returns migration notice
      GET: async ({ request }) => {
        const session = await getSession(request);

        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (!isAdmin(session.user.role || null)) {
          return new Response(
            JSON.stringify({ error: "Forbidden - admin role required" }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // Parse query params (kept for API compatibility)
        const url = new URL(request.url);
        const queryParams = Object.fromEntries(url.searchParams.entries());
        const validation = listAuditLogsQuerySchema.safeParse(queryParams);

        if (!validation.success) {
          return new Response(
            JSON.stringify({
              error: "Invalid query parameters",
              details: validation.error.flatten().fieldErrors,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const { page, limit } = validation.data;

        // Return migration notice
        return new Response(
          JSON.stringify({
            message: "Audit logs have been migrated to OTEL/Axiom",
            info: "Audit logs are now stored in Axiom. Query them directly via the Axiom dashboard.",
            documentation: "See src/lib/audit/README.md for Axiom queries",
            note: "The Postgres audit_log table has been removed. All audit data flows through OpenTelemetry to Axiom.",
            empty_result: {
              logs: [],
              pagination: {
                page,
                limit,
                totalCount: 0,
                totalPages: 0,
                hasMore: false,
              },
            },
            example_axiom_queries: {
              all_auth_events:
                '["logs"] | where ["audit.event_category"] == "auth"',
              failed_logins:
                '["logs"] | where ["audit.event_type"] contains "login" and ["audit.result"] == "failure"',
              critical_events:
                '["logs"] | where ["audit.security_risk_level"] == "CRITICAL"',
              admin_operations:
                '["logs"] | where ["audit.event_category"] == "admin"',
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      },
    },
  },
});
