/**
 * EWF-ID Admin User Detail API
 * SPEC.md Phase 5 - Task 5.3
 *
 * GET /api/admin/users/$userId - Get user details
 * PUT /api/admin/users/$userId - Update user (admin only)
 * DELETE /api/admin/users/$userId - Delete user (admin only)
 */
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "#auth";
import { db } from "~/lib/auth-db";
import {
  user as userTable,
  session as sessionTable,
  account as accountTable,
  passkey as passkeyTable,
} from "~/lib/auth/schema/betterauth";
import { auditLog, userSchool, school, apiKey } from "~/lib/auth/schema/audit";
import { eq, desc, and, count } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  role: z.enum(["user", "student", "teacher", "team", "admin"]).optional(),
  banned: z.boolean().optional(),
  banReason: z.string().max(500).optional(),
  banExpires: z.string().datetime().optional(),
});

async function getSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  return session;
}

function isTeamOrAdmin(role: string | null): boolean {
  return role === "team" || role === "admin";
}

function isAdmin(role: string | null): boolean {
  return role === "admin";
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

export const Route = createFileRoute("/api/admin/users/$userId")({
  server: {
    handlers: {
      // GET /api/admin/users/$userId - Get user details (team+ required)
      GET: async ({ request, params }) => {
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

        const { userId } = params;

        // Get user
        const [userData] = await db
          .select()
          .from(userTable)
          .where(eq(userTable.id, userId))
          .limit(1);

        if (!userData) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Get school affiliations
        const schools = await db
          .select({
            schoolId: userSchool.schoolId,
            studentId: userSchool.studentId,
            department: userSchool.department,
            graduationYear: userSchool.graduationYear,
            verified: userSchool.verified,
            verifiedAt: userSchool.verifiedAt,
            isPrimary: userSchool.isPrimary,
            schoolName: school.name,
            schoolShortName: school.shortName,
          })
          .from(userSchool)
          .leftJoin(school, eq(userSchool.schoolId, school.id))
          .where(eq(userSchool.userId, userId));

        // Get session count
        const [sessionCount] = await db
          .select({ count: count() })
          .from(sessionTable)
          .where(eq(sessionTable.userId, userId));

        // Get account count
        const [accountCount] = await db
          .select({ count: count() })
          .from(accountTable)
          .where(eq(accountTable.userId, userId));

        // Get passkey count
        const [passkeyCount] = await db
          .select({ count: count() })
          .from(passkeyTable)
          .where(eq(passkeyTable.userId, userId));

        // Get API key count
        const [apiKeyCount] = await db
          .select({ count: count() })
          .from(apiKey)
          .where(and(eq(apiKey.userId, userId), eq(apiKey.enabled, true)));

        // Get recent audit logs
        const recentLogs = await db
          .select()
          .from(auditLog)
          .where(eq(auditLog.userId, userId))
          .orderBy(desc(auditLog.timestamp))
          .limit(20);

        await createAuditLogEntry(
          session.user.id,
          "admin.user.view",
          "user",
          userId,
          {},
          request,
        );

        return new Response(
          JSON.stringify({
            user: {
              id: userData.id,
              email: userData.email,
              emailVerified: userData.emailVerified,
              name: userData.name,
              firstName: userData.firstName,
              lastName: userData.lastName,
              displayName: userData.displayName,
              bio: userData.bio,
              image: userData.image,
              locale: userData.locale,
              role: userData.role,
              school: userData.school,
              schoolVerified: userData.schoolVerified,
              banned: userData.banned,
              banReason: userData.banReason,
              banExpires: userData.banExpires,
              lastLoginAt: userData.lastLoginAt,
              lastLoginMethod: userData.lastLoginMethod,
              deletionRequestedAt: userData.deletionRequestedAt,
              deletionScheduledAt: userData.deletionScheduledAt,
              createdAt: userData.createdAt,
              updatedAt: userData.updatedAt,
            },
            schools,
            stats: {
              activeSessions: sessionCount?.count || 0,
              linkedAccounts: accountCount?.count || 0,
              passkeys: passkeyCount?.count || 0,
              apiKeys: apiKeyCount?.count || 0,
            },
            recentAuditLogs: recentLogs,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      },

      // PUT /api/admin/users/$userId - Update user (admin only)
      PUT: async ({ request, params }) => {
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

        const { userId } = params;

        // Check user exists
        const [existingUser] = await db
          .select()
          .from(userTable)
          .where(eq(userTable.id, userId))
          .limit(1);

        if (!existingUser) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const validation = updateUserSchema.safeParse(body);
        if (!validation.success) {
          return new Response(
            JSON.stringify({
              error: "Validation failed",
              details: validation.error.flatten().fieldErrors,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // Prevent self-demotion
        if (
          userId === session.user.id &&
          validation.data.role &&
          validation.data.role !== "admin"
        ) {
          return new Response(
            JSON.stringify({ error: "Cannot demote yourself" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // Build updates
        const updates: Record<string, unknown> = {};
        const changedFields: string[] = [];

        for (const [key, value] of Object.entries(validation.data)) {
          if (value !== undefined) {
            updates[key] =
              key === "banExpires" && value ? new Date(value) : value;
            changedFields.push(key);
          }
        }

        if (changedFields.length === 0) {
          return new Response(
            JSON.stringify({ error: "No fields to update" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        await db.update(userTable).set(updates).where(eq(userTable.id, userId));

        const [updatedUser] = await db
          .select()
          .from(userTable)
          .where(eq(userTable.id, userId))
          .limit(1);

        await createAuditLogEntry(
          session.user.id,
          "admin.user.update",
          "user",
          userId,
          {
            fields: changedFields,
            before: existingUser,
            after: validation.data,
          },
          request,
        );

        return new Response(
          JSON.stringify({
            success: true,
            user: {
              id: updatedUser.id,
              email: updatedUser.email,
              name: updatedUser.name,
              role: updatedUser.role,
              banned: updatedUser.banned,
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      },

      // DELETE /api/admin/users/$userId - Delete user (admin only)
      DELETE: async ({ request, params }) => {
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

        const { userId } = params;

        // Prevent self-deletion
        if (userId === session.user.id) {
          return new Response(
            JSON.stringify({
              error: "Cannot delete your own account via admin API",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // Check user exists
        const [existingUser] = await db
          .select()
          .from(userTable)
          .where(eq(userTable.id, userId))
          .limit(1);

        if (!existingUser) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Delete user (cascades to sessions, accounts, etc.)
        await db.delete(userTable).where(eq(userTable.id, userId));

        await createAuditLogEntry(
          session.user.id,
          "admin.user.delete",
          "user",
          userId,
          { deletedUser: { id: existingUser.id, email: existingUser.email } },
          request,
        );

        return new Response(
          JSON.stringify({
            success: true,
            message: "User deleted",
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
