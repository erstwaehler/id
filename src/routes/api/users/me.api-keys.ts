/**
 * EWF-ID User API Keys API
 * SPEC.md Phase 4 - Task 4.1
 *
 * GET /api/users/me/api-keys - List API keys
 * POST /api/users/me/api-keys - Create API key
 */
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "#auth";
import { db } from "~/lib/auth-db";
import { apiKey, auditLog } from "~/lib/auth/schema/audit";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import argon2 from "argon2";
import { z } from "zod";

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.string()).default([]),
  scopes: z.array(z.string()).default([]),
  expiresIn: z.number().min(3600).max(31536000).optional(), // 1 hour to 1 year
});

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

function generateApiKey(): { key: string; prefix: string } {
  const prefix = `ewf_${randomBytes(4).toString("hex")}`;
  const secret = randomBytes(32).toString("hex");
  return { key: `${prefix}_${secret}`, prefix };
}

async function hashApiKey(key: string): Promise<string> {
  return await argon2.hash(key);
}

export const Route = createFileRoute("/api/users/me/api-keys")({
  server: {
    handlers: {
      // GET /api/users/me/api-keys - List API keys
      GET: async ({ request }) => {
        const session = await getSession(request);

        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const userId = session.user.id;

        // Get all API keys for user (don't expose hashes)
        const keys = await db
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
          .where(eq(apiKey.userId, userId))
          .orderBy(desc(apiKey.createdAt));

        return new Response(
          JSON.stringify({
            apiKeys: keys.map((k) => ({
              ...k,
              maskedKey: `${k.keyPrefix}_${"*".repeat(32)}`,
            })),
            count: keys.length,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      },

      // POST /api/users/me/api-keys - Create API key
      POST: async ({ request }) => {
        const session = await getSession(request);

        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const userId = session.user.id;

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const validation = createApiKeySchema.safeParse(body);
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

        const { name, permissions, scopes, expiresIn } = validation.data;

        // Check existing keys count (limit to 10)
        const existingKeys = await db
          .select()
          .from(apiKey)
          .where(and(eq(apiKey.userId, userId), eq(apiKey.enabled, true)));

        if (existingKeys.length >= 10) {
          return new Response(
            JSON.stringify({
              error: "API key limit reached (10 maximum)",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // Generate key
        const { key, prefix } = generateApiKey();
        const keyHash = await hashApiKey(key);

        // Calculate expiration
        const expiresAt = expiresIn
          ? new Date(Date.now() + expiresIn * 1000)
          : null;

        // Store key
        const keyId = randomUUID();
        await db.insert(apiKey).values({
          id: keyId,
          userId,
          name,
          keyHash,
          keyPrefix: prefix,
          permissions,
          scopes,
          expiresAt,
          enabled: true,
        });

        await createAuditLogEntry(
          userId,
          "api_key.create",
          "api_key",
          keyId,
          { name },
          request,
        );

        // Return key only once - it cannot be retrieved again
        return new Response(
          JSON.stringify({
            id: keyId,
            name,
            key, // Only time the full key is shown
            prefix,
            permissions,
            scopes,
            expiresAt,
            warning: "Save this key securely. It will not be shown again.",
          }),
          {
            status: 201,
            headers: { "Content-Type": "application/json" },
          },
        );
      },
    },
  },
});
