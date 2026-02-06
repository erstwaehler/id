/**
 * EWF-ID Session Revocation API
 * SPEC.md Phase 5 - Task 5.2
 *
 * DELETE /api/users/me/sessions/$sessionId - Revoke a specific session
 */

import { randomUUID } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { auth } from "#auth";
import { session as sessionTable } from "~/lib/auth/schema/betterauth";
import { db } from "~/lib/auth-db";

async function getSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  return session;
}

async function createAuditLog(
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

export const Route = createFileRoute("/api/users/me/sessions/$sessionId")({
  server: {
    handlers: {
      // DELETE /api/users/me/sessions/$sessionId - Revoke session
      DELETE: async ({ request, params }) => {
        const currentSession = await getSession(request);

        if (!currentSession?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const userId = currentSession.user.id;
        const { sessionId } = params;

        // Check if session exists and belongs to user
        const [targetSession] = await db
          .select()
          .from(sessionTable)
          .where(
            and(
              eq(sessionTable.id, sessionId),
              eq(sessionTable.userId, userId),
            ),
          )
          .limit(1);

        if (!targetSession) {
          return new Response(JSON.stringify({ error: "Session not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Prevent revoking current session
        if (sessionId === currentSession.session.id) {
          return new Response(
            JSON.stringify({ error: "Cannot revoke current session" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // Delete the session
        await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));

        await createAuditLog(
          userId,
          "session.revoke",
          "session",
          sessionId,
          {
            ipAddress: targetSession.ipAddress,
            userAgent: targetSession.userAgent,
          },
          request,
        );

        return new Response(
          JSON.stringify({ success: true, message: "Session revoked" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      },
    },
  },
});
