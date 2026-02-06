/**
 * EWF-ID Admin Audit Logs API
 * SPEC.md Phase 5 - Task 5.3
 *
 * GET /api/admin/audit-logs - List audit logs (paginated, filtered)
 */
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "#auth";
import { db } from "~/lib/auth-db";
import { user as userTable } from "~/lib/auth/schema/betterauth";
import { auditLog } from "~/lib/auth/schema/audit";
import { eq, desc, asc, ilike, or, and, gte, lte, count } from "drizzle-orm";
import { z } from "zod";

const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  result: z.enum(["success", "failure"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
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
      // GET /api/admin/audit-logs - List audit logs (admin only)
      GET: async ({ request }) => {
        const session = await getSession(request);

        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (!isAdmin(session.user.role)) {
          return new Response(
            JSON.stringify({ error: "Forbidden - admin role required" }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // Parse query params
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

        const {
          page,
          limit,
          userId,
          action,
          resource,
          result,
          startDate,
          endDate,
          sortOrder,
        } = validation.data;
        const offset = (page - 1) * limit;

        // Build where conditions
        const conditions = [];

        if (userId) {
          conditions.push(eq(auditLog.userId, userId));
        }

        if (action) {
          conditions.push(ilike(auditLog.action, `%${action}%`));
        }

        if (resource) {
          conditions.push(ilike(auditLog.resource, `%${resource}%`));
        }

        if (result) {
          conditions.push(eq(auditLog.result, result));
        }

        if (startDate) {
          conditions.push(gte(auditLog.timestamp, new Date(startDate)));
        }

        if (endDate) {
          conditions.push(lte(auditLog.timestamp, new Date(endDate)));
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        // Build sort
        const orderBy =
          sortOrder === "asc"
            ? asc(auditLog.timestamp)
            : desc(auditLog.timestamp);

        // Get total count
        const [countResult] = await db
          .select({ count: count() })
          .from(auditLog)
          .where(whereClause);

        const totalCount = countResult?.count || 0;

        // Get logs with user info
        const logs = await db
          .select({
            id: auditLog.id,
            timestamp: auditLog.timestamp,
            userId: auditLog.userId,
            action: auditLog.action,
            resource: auditLog.resource,
            resourceId: auditLog.resourceId,
            metadata: auditLog.metadata,
            ipAddress: auditLog.ipAddress,
            userAgent: auditLog.userAgent,
            traceId: auditLog.traceId,
            result: auditLog.result,
            errorMessage: auditLog.errorMessage,
            duration: auditLog.duration,
            userName: userTable.name,
            userEmail: userTable.email,
          })
          .from(auditLog)
          .leftJoin(userTable, eq(auditLog.userId, userTable.id))
          .where(whereClause)
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset);

        return new Response(
          JSON.stringify({
            logs: logs.map((log) => ({
              id: log.id,
              timestamp: log.timestamp,
              user: log.userId
                ? {
                    id: log.userId,
                    name: log.userName,
                    email: log.userEmail,
                  }
                : null,
              action: log.action,
              resource: log.resource,
              resourceId: log.resourceId,
              metadata: log.metadata,
              ipAddress: log.ipAddress,
              userAgent: log.userAgent,
              traceId: log.traceId,
              result: log.result,
              errorMessage: log.errorMessage,
              duration: log.duration,
            })),
            pagination: {
              page,
              limit,
              totalCount,
              totalPages: Math.ceil(totalCount / limit),
              hasMore: page * limit < totalCount,
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
