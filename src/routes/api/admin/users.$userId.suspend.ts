/**
 * EWF-ID Admin User Suspend API
 * SPEC.md Phase 5 - Task 5.3
 *
 * POST /api/admin/users/$userId/suspend - Suspend account
 * POST /api/admin/users/$userId/unsuspend - Unsuspend account
 */
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "#auth";
import { db } from "~/lib/auth-db";
import {
  user as userTable,
  session as sessionTable,
} from "~/lib/auth/schema/betterauth";
import { auditLog } from "~/lib/auth/schema/audit";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";

const suspendSchema = z.object({
  reason: z.string().min(1).max(500),
  expiresAt: z.string().datetime().optional(),
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

export const Route = createFileRoute("/api/admin/users/$userId/suspend")({
  server: {
    handlers: {
      // POST /api/admin/users/$userId/suspend - Suspend account (admin only)
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

        // Prevent self-suspension
        if (userId === session.user.id) {
          return new Response(
            JSON.stringify({ error: "Cannot suspend your own account" }),
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

        if (existingUser.banned) {
          return new Response(
            JSON.stringify({ error: "User is already suspended" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
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

        const validation = suspendSchema.safeParse(body);
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

        const { reason, expiresAt } = validation.data;

        // Suspend user
        await db
          .update(userTable)
          .set({
            banned: true,
            banReason: reason,
            banExpires: expiresAt ? new Date(expiresAt) : null,
          })
          .where(eq(userTable.id, userId));

        // Revoke all sessions
        await db.delete(sessionTable).where(eq(sessionTable.userId, userId));

        await createAuditLogEntry(
          session.user.id,
          "admin.user.suspend",
          "user",
          userId,
          { reason, expiresAt, targetEmail: existingUser.email },
          request,
        );

        return new Response(
          JSON.stringify({
            success: true,
            message: "User suspended",
            reason,
            expiresAt: expiresAt || null,
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
