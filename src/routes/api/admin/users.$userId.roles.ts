/**
 * EWF-ID Admin User Roles API
 * SPEC.md Phase 5 - Task 5.3
 *
 * POST /api/admin/users/$userId/roles - Assign role
 * DELETE /api/admin/users/$userId/roles/$role - Revoke role
 */
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "#auth";
import { db } from "~/lib/auth-db";
import { user as userTable } from "~/lib/auth/schema/betterauth";
import { auditLog } from "~/lib/auth/schema/audit";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";

const VALID_ROLES = ["user", "student", "teacher", "team", "admin"] as const;
type ValidRole = (typeof VALID_ROLES)[number];

const assignRoleSchema = z.object({
  role: z.enum(VALID_ROLES),
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

export const Route = createFileRoute("/api/admin/users/$userId/roles")({
  server: {
    handlers: {
      // POST /api/admin/users/$userId/roles - Assign role (admin only)
      POST: async ({ request, params }) => {
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

        const validation = assignRoleSchema.safeParse(body);
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

        const { role } = validation.data;
        const previousRole = existingUser.role;

        // Prevent self-demotion
        if (userId === session.user.id && role !== "admin") {
          return new Response(
            JSON.stringify({ error: "Cannot demote yourself" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // Update role
        await db
          .update(userTable)
          .set({ role })
          .where(eq(userTable.id, userId));

        await createAuditLogEntry(
          session.user.id,
          "admin.role.assign",
          "user",
          userId,
          { previousRole, newRole: role },
          request,
        );

        return new Response(
          JSON.stringify({
            success: true,
            message: `Role ${role} assigned`,
            previousRole,
            newRole: role,
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
