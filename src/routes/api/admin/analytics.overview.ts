/**
 * EWF-ID Admin Analytics Overview API
 * SPEC.md Phase 5 - Task 5.3
 *
 * GET /api/admin/analytics/overview - Get dashboard stats
 */
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "#auth";
import { db } from "~/lib/auth-db";
import {
  user as userTable,
  session as sessionTable,
  account as accountTable,
} from "~/lib/auth/schema/betterauth";
import { auditLog } from "~/lib/auth/schema/audit";
import { eq, count, sql, gte, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";

async function getSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  return session;
}

function isTeamOrAdmin(role: string | null): boolean {
  return role === "team" || role === "admin";
}

async function createAuditLogEntry(
  userId: string | null,
  action: string,
  resource: string,
  resourceId: string | null,
  metadata: Record<string, unknown>,
  request: Request,
  result: "success" | "failure" = "success",
) {
  try {
    await db.insert(auditLog).values({
      id: randomUUID(),
      userId,
      action,
      resource,
      resourceId,
      metadata,
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      result,
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

export const Route = createFileRoute("/api/admin/analytics/overview")({
  server: {
    handlers: {
      // GET /api/admin/analytics/overview - Dashboard stats (team+ required)
      GET: async ({ request }) => {
        const session = await getSession(request);

        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (!isTeamOrAdmin(session.user.role)) {
          return new Response(
            JSON.stringify({ error: "Forbidden - team role required" }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // Calculate date ranges
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000,
        );

        // Total users
        const [totalUsers] = await db
          .select({ count: count() })
          .from(userTable);

        // New users this week
        const [newUsersWeek] = await db
          .select({ count: count() })
          .from(userTable)
          .where(gte(userTable.createdAt, sevenDaysAgo));

        // New users this month
        const [newUsersMonth] = await db
          .select({ count: count() })
          .from(userTable)
          .where(gte(userTable.createdAt, thirtyDaysAgo));

        // Users by role
        const usersByRole = await db
          .select({
            role: userTable.role,
            count: count(),
          })
          .from(userTable)
          .groupBy(userTable.role);

        // Users by school
        const usersBySchool = await db
          .select({
            school: userTable.school,
            count: count(),
          })
          .from(userTable)
          .groupBy(userTable.school);

        // Verified vs unverified
        const [verifiedCount] = await db
          .select({ count: count() })
          .from(userTable)
          .where(eq(userTable.emailVerified, true));

        const [unverifiedCount] = await db
          .select({ count: count() })
          .from(userTable)
          .where(eq(userTable.emailVerified, false));

        // Banned users
        const [bannedCount] = await db
          .select({ count: count() })
          .from(userTable)
          .where(eq(userTable.banned, true));

        // Active sessions
        const [activeSessions] = await db
          .select({ count: count() })
          .from(sessionTable)
          .where(gte(sessionTable.expiresAt, now));

        // Linked accounts by provider
        const accountsByProvider = await db
          .select({
            provider: accountTable.providerId,
            count: count(),
          })
          .from(accountTable)
          .groupBy(accountTable.providerId);

        // Recent signups (last 7 days)
        const recentSignups = await db
          .select({
            date: sql<string>`DATE(${userTable.createdAt})`,
            count: count(),
          })
          .from(userTable)
          .where(gte(userTable.createdAt, sevenDaysAgo))
          .groupBy(sql`DATE(${userTable.createdAt})`)
          .orderBy(sql`DATE(${userTable.createdAt})`);

        // Authentication methods used
        const authMethods = await db
          .select({
            method: userTable.lastLoginMethod,
            count: count(),
          })
          .from(userTable)
          .where(sql`${userTable.lastLoginMethod} IS NOT NULL`)
          .groupBy(userTable.lastLoginMethod);

        await createAuditLogEntry(
          session.user.id,
          "admin.analytics.view",
          "analytics",
          "overview",
          {},
          request,
        );

        return new Response(
          JSON.stringify({
            timestamp: now.toISOString(),
            users: {
              total: totalUsers?.count || 0,
              newThisWeek: newUsersWeek?.count || 0,
              newThisMonth: newUsersMonth?.count || 0,
              verified: verifiedCount?.count || 0,
              unverified: unverifiedCount?.count || 0,
              banned: bannedCount?.count || 0,
              byRole: usersByRole.reduce(
                (acc, r) => {
                  acc[r.role || "unknown"] = r.count;
                  return acc;
                },
                {} as Record<string, number>,
              ),
              bySchool: usersBySchool.reduce(
                (acc, s) => {
                  acc[s.school || "unknown"] = s.count;
                  return acc;
                },
                {} as Record<string, number>,
              ),
            },
            sessions: {
              active: activeSessions?.count || 0,
            },
            accounts: {
              byProvider: accountsByProvider.reduce(
                (acc, a) => {
                  acc[a.provider] = a.count;
                  return acc;
                },
                {} as Record<string, number>,
              ),
            },
            authentication: {
              methodsUsed: authMethods.reduce(
                (acc, m) => {
                  acc[m.method || "unknown"] = m.count;
                  return acc;
                },
                {} as Record<string, number>,
              ),
            },
            trends: {
              signupsLastWeek: recentSignups.map((s) => ({
                date: s.date,
                count: s.count,
              })),
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
