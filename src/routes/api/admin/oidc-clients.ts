/**
 * EWF-ID Admin OIDC Clients API
 * SPEC.md Phase 5 - Task 5.1 (OIDC Provider)
 *
 * GET /api/admin/oidc-clients - List OIDC clients
 * POST /api/admin/oidc-clients - Create OIDC client (admin only)
 */
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth";
import { db } from "@/lib/auth-db";
import { oidcClient, auditLog } from "@/lib/auth/schema/audit";
import { eq, desc } from "drizzle-orm";
import { randomUUID, randomBytes } from "node:crypto";
import argon2 from "argon2";
import { z } from "zod";

const createOidcClientSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  homepageUrl: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  termsUrl: z.string().url().optional(),
  privacyUrl: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  redirectUris: z.array(z.string().url()).min(1),
  postLogoutRedirectUris: z.array(z.string().url()).default([]),
  allowedScopes: z.array(z.string()).default(["openid", "profile", "email"]),
  grantTypes: z.array(z.string()).default(["authorization_code", "refresh_token"]),
  responseTypes: z.array(z.string()).default(["code"]),
  tokenEndpointAuthMethod: z.enum(["client_secret_basic", "client_secret_post", "none"]).default("client_secret_basic"),
  accessTokenTtl: z.number().min(300).max(86400).default(3600),
  refreshTokenTtl: z.number().min(86400).max(31536000).default(2592000),
  idTokenTtl: z.number().min(300).max(86400).default(3600),
  requirePkce: z.boolean().default(true),
  requireConsent: z.boolean().default(true),
  firstParty: z.boolean().default(false),
  enabled: z.boolean().default(true),
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

function generateClientId(): string {
  return `ewf_${randomBytes(16).toString("hex")}`;
}

function generateClientSecret(): string {
  return randomBytes(32).toString("base64url");
}

export const Route = createFileRoute("/api/admin/oidc-clients")({
  server: {
    handlers: {
      // GET /api/admin/oidc-clients - List OIDC clients (team+ required)
      GET: async ({ request }) => {
        const session = await getSession(request);

        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (!isTeamOrAdmin(session.user.role)) {
          return new Response(JSON.stringify({ error: "Forbidden - team role required" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }

        const clients = await db
          .select({
            id: oidcClient.id,
            clientId: oidcClient.clientId,
            name: oidcClient.name,
            description: oidcClient.description,
            logoUrl: oidcClient.logoUrl,
            homepageUrl: oidcClient.homepageUrl,
            redirectUris: oidcClient.redirectUris,
            allowedScopes: oidcClient.allowedScopes,
            grantTypes: oidcClient.grantTypes,
            requirePkce: oidcClient.requirePkce,
            requireConsent: oidcClient.requireConsent,
            firstParty: oidcClient.firstParty,
            enabled: oidcClient.enabled,
            createdAt: oidcClient.createdAt,
            updatedAt: oidcClient.updatedAt,
          })
          .from(oidcClient)
          .orderBy(desc(oidcClient.createdAt));

        return new Response(
          JSON.stringify({
            clients,
            count: clients.length,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      },

      // POST /api/admin/oidc-clients - Create OIDC client (admin only)
      POST: async ({ request }) => {
        const session = await getSession(request);

        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (!isAdmin(session.user.role)) {
          return new Response(JSON.stringify({ error: "Forbidden - admin role required" }), {
            status: 403,
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

        const validation = createOidcClientSchema.safeParse(body);
        if (!validation.success) {
          return new Response(
            JSON.stringify({
              error: "Validation failed",
              details: validation.error.flatten().fieldErrors,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Generate client credentials
        const clientId = generateClientId();
        const clientSecret = generateClientSecret();
        const clientSecretHash = await argon2.hash(clientSecret);

        // Create client
        const id = randomUUID();
        await db.insert(oidcClient).values({
          id,
          clientId,
          clientSecretHash,
          name: validation.data.name,
          description: validation.data.description,
          logoUrl: validation.data.logoUrl,
          homepageUrl: validation.data.homepageUrl,
          termsUrl: validation.data.termsUrl,
          privacyUrl: validation.data.privacyUrl,
          contactEmail: validation.data.contactEmail,
          redirectUris: validation.data.redirectUris,
          postLogoutRedirectUris: validation.data.postLogoutRedirectUris,
          allowedScopes: validation.data.allowedScopes,
          grantTypes: validation.data.grantTypes,
          responseTypes: validation.data.responseTypes,
          tokenEndpointAuthMethod: validation.data.tokenEndpointAuthMethod,
          accessTokenTtl: validation.data.accessTokenTtl,
          refreshTokenTtl: validation.data.refreshTokenTtl,
          idTokenTtl: validation.data.idTokenTtl,
          requirePkce: validation.data.requirePkce,
          requireConsent: validation.data.requireConsent,
          firstParty: validation.data.firstParty,
          enabled: validation.data.enabled,
        });

        await createAuditLogEntry(
          session.user.id,
          "admin.oidc_client.create",
          "oidc_client",
          id,
          { name: validation.data.name, clientId },
          request
        );

        // Return credentials only once
        return new Response(
          JSON.stringify({
            id,
            clientId,
            clientSecret, // Only shown once
            name: validation.data.name,
            redirectUris: validation.data.redirectUris,
            allowedScopes: validation.data.allowedScopes,
            warning: "Save the client_secret securely. It will not be shown again.",
          }),
          {
            status: 201,
            headers: { "Content-Type": "application/json" },
          }
        );
      },
    },
  },
});
