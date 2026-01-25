/**
 * EWF-ID OAuth Token Revocation Endpoint
 * SPEC.md Phase 5 - Task 5.1
 *
 * POST /oauth/revoke - Revoke tokens
 */
import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/auth-db";
import { oidcClient, oidcToken, auditLog } from "@/lib/auth/schema/audit";
import { eq, and } from "drizzle-orm";
import { randomUUID, createHash } from "node:crypto";
import argon2 from "argon2";
import { z } from "zod";

const revokeRequestSchema = z.object({
  token: z.string().min(1),
  token_type_hint: z.enum(["access_token", "refresh_token"]).optional(),
  client_id: z.string().min(1),
  client_secret: z.string().optional(),
});

async function createAuditLogEntry(
  userId: string | null,
  action: string,
  resource: string,
  resourceId: string | null,
  metadata: Record<string, unknown>,
  request: Request,
  result: "success" | "failure" = "success"
) {
  try {
    await db.insert(auditLog).values({
      id: randomUUID(),
      userId,
      action,
      resource,
      resourceId,
      metadata,
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      result,
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

async function verifyClientSecret(clientSecretHash: string, providedSecret: string): Promise<boolean> {
  try {
    return await argon2.verify(clientSecretHash, providedSecret);
  } catch {
    return false;
  }
}

function parseBasicAuth(authHeader: string | null): { clientId: string; clientSecret: string } | null {
  if (!authHeader?.startsWith("Basic ")) {
    return null;
  }
  try {
    const decoded = atob(authHeader.slice(6));
    const [clientId, clientSecret] = decoded.split(":");
    if (clientId && clientSecret) {
      return { clientId, clientSecret };
    }
  } catch {}
  return null;
}

async function hashToken(token: string): Promise<string> {
  return createHash("sha256").update(token).digest("hex");
}

export const Route = createFileRoute("/oauth/revoke")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Parse request body
        let body: Record<string, string>;
        const contentType = request.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          body = await request.json();
        } else if (contentType.includes("application/x-www-form-urlencoded")) {
          const formData = await request.formData();
          body = Object.fromEntries(formData.entries()) as Record<string, string>;
        } else {
          // Per RFC 7009, always return 200
          return new Response(null, { status: 200 });
        }

        // Check for Basic auth header
        const basicAuth = parseBasicAuth(request.headers.get("authorization"));
        if (basicAuth) {
          body.client_id = basicAuth.clientId;
          body.client_secret = basicAuth.clientSecret;
        }

        const validation = revokeRequestSchema.safeParse(body);
        if (!validation.success) {
          // Per RFC 7009, return 200 even for invalid requests
          return new Response(null, { status: 200 });
        }

        const { token, token_type_hint, client_id, client_secret } = validation.data;

        // Validate client
        const [client] = await db.select().from(oidcClient).where(eq(oidcClient.clientId, client_id)).limit(1);

        if (!client || !client.enabled) {
          return new Response(null, { status: 200 });
        }

        // Verify client secret if required
        if (client.tokenEndpointAuthMethod !== "none" && client_secret) {
          const validSecret = await verifyClientSecret(client.clientSecretHash, client_secret);
          if (!validSecret) {
            return new Response(
              JSON.stringify({
                error: "invalid_client",
              }),
              {
                status: 401,
                headers: { "Content-Type": "application/json" },
              }
            );
          }
        }

        // Find and revoke token
        const tokenHash = await hashToken(token);
        const tokenTypes = token_type_hint ? [token_type_hint] : ["access_token", "refresh_token"];

        for (const tokenType of tokenTypes) {
          const [storedToken] = await db
            .select()
            .from(oidcToken)
            .where(and(eq(oidcToken.tokenHash, tokenHash), eq(oidcToken.type, tokenType), eq(oidcToken.clientId, client_id)))
            .limit(1);

          if (storedToken && !storedToken.revokedAt) {
            await db.update(oidcToken).set({ revokedAt: new Date() }).where(eq(oidcToken.id, storedToken.id));

            await createAuditLogEntry(
              storedToken.userId,
              "oidc.token.revoke",
              "oidc_token",
              storedToken.id,
              { clientId: client_id, tokenType },
              request
            );

            // If revoking refresh token, also revoke associated access tokens
            if (tokenType === "refresh_token") {
              await db
                .update(oidcToken)
                .set({ revokedAt: new Date() })
                .where(and(eq(oidcToken.userId, storedToken.userId), eq(oidcToken.clientId, client_id), eq(oidcToken.type, "access_token")));
            }

            break;
          }
        }

        // Per RFC 7009, always return 200
        return new Response(null, { status: 200 });
      },
    },
  },
});
