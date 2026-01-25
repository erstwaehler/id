/**
 * EWF-ID User API Key Management API
 * SPEC.md Phase 4 - Task 4.1
 *
 * GET /api/users/me/api-keys/$keyId - Get API key details
 * DELETE /api/users/me/api-keys/$keyId - Revoke API key
 */
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "#auth";
import { db } from "~/lib/auth-db";
import { apiKey, auditLog } from "~/lib/auth/schema/audit";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";

async function getSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  return session;
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

export const Route = createFileRoute("/api/users/me/api-keys/$keyId")({
  server: {
    handlers: {
      // GET /api/users/me/api-keys/$keyId - Get API key details
      GET: async ({ request, params }) => {
        const session = await getSession(request);

        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const userId = session.user.id;
        const { keyId } = params;

        const [key] = await db
          .select({
            id: apiKey.id,
            name: apiKey.name,
            keyPrefix: apiKey.keyPrefix,
            permissions: apiKey.permissions,
            scopes: apiKey.scopes,
            lastUsedAt: apiKey.lastUsedAt,
            lastUsedIp: apiKey.lastUsedIp,
            expiresAt: apiKey.expiresAt,
            enabled: apiKey.enabled,
            createdAt: apiKey.createdAt,
          })
          .from(apiKey)
          .where(and(eq(apiKey.id, keyId), eq(apiKey.userId, userId)))
          .limit(1);

        if (!key) {
          return new Response(JSON.stringify({ error: "API key not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(
          JSON.stringify({
            ...key,
            maskedKey: `${key.keyPrefix}_${"*".repeat(32)}`,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      },

      // DELETE /api/users/me/api-keys/$keyId - Revoke API key
      DELETE: async ({ request, params }) => {
        const session = await getSession(request);

        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const userId = session.user.id;
        const { keyId } = params;

        const [key] = await db
          .select()
          .from(apiKey)
          .where(and(eq(apiKey.id, keyId), eq(apiKey.userId, userId)))
          .limit(1);

        if (!key) {
          return new Response(JSON.stringify({ error: "API key not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Disable the key (soft delete for audit purposes)
        await db
          .update(apiKey)
          .set({ enabled: false })
          .where(eq(apiKey.id, keyId));

        await createAuditLogEntry(
          userId,
          "api_key.revoke",
          "api_key",
          keyId,
          { name: key.name },
          request,
        );

        return new Response(
          JSON.stringify({
            success: true,
            message: "API key revoked",
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
