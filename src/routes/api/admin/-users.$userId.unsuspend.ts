/**
 * EWF-ID Admin User Unsuspend API
 * SPEC.md Phase 5 - Task 5.3
 *
 * POST /api/admin/users/$userId/unsuspend - Unsuspend account
 */

import { randomUUID } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { auth } from "#auth";
import { auditLog } from "~/lib/auth/schema/audit";
import { user as userTable } from "~/lib/auth/schema/betterauth";
import { db } from "~/lib/auth-db";

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

export const Route = createFileRoute("/api/admin/users/$userId/unsuspend")({
  server: {
    handlers: {
      // POST /api/admin/users/$userId/unsuspend - Unsuspend account (admin only)
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

        if (!existingUser.banned) {
          return new Response(
            JSON.stringify({ error: "User is not suspended" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // Unsuspend user
        await db
          .update(userTable)
          .set({
            banned: false,
            banReason: null,
            banExpires: null,
          })
          .where(eq(userTable.id, userId));

        await createAuditLogEntry(
          session.user.id,
          "admin.user.unsuspend",
          "user",
          userId,
          {
            previousBanReason: existingUser.banReason,
            targetEmail: existingUser.email,
          },
          request,
        );

        return new Response(
          JSON.stringify({
            success: true,
            message: "User unsuspended",
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
