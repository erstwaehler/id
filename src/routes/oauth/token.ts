/**
 * EWF-ID OAuth Token Endpoint
 * SPEC.md Phase 5 - Task 5.1
 *
 * POST /oauth/token - Token exchange
 */
import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/auth-db";
import { user as userTable } from "@/lib/auth/schema/betterauth";
import { oidcClient, oidcAuthorizationCode, oidcToken, auditLog, userSchool, school } from "@/lib/auth/schema/audit";
import { signIdToken, signAccessToken, generateTokenId, type IdTokenPayload, type AccessTokenPayload } from "@/lib/jwt";
import { eq, and } from "drizzle-orm";
import { randomUUID, createHash, timingSafeEqual } from "node:crypto";
import argon2 from "argon2";
import { z } from "zod";
import env from "#env";

const tokenRequestSchema = z.discriminatedUnion("grant_type", [
  z.object({
    grant_type: z.literal("authorization_code"),
    code: z.string().min(1),
    redirect_uri: z.string().url(),
    client_id: z.string().min(1),
    client_secret: z.string().optional(),
    code_verifier: z.string().optional(),
  }),
  z.object({
    grant_type: z.literal("refresh_token"),
    refresh_token: z.string().min(1),
    client_id: z.string().min(1),
    client_secret: z.string().optional(),
    scope: z.string().optional(),
  }),
  z.object({
    grant_type: z.literal("client_credentials"),
    client_id: z.string().min(1),
    client_secret: z.string().min(1),
    scope: z.string().optional(),
  }),
]);

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

function verifyCodeChallenge(verifier: string, challenge: string, method: string | null): boolean {
  if (!method || method === "plain") {
    return verifier === challenge;
  }
  if (method === "S256") {
    const hash = createHash("sha256").update(verifier).digest("base64url");
    return hash === challenge;
  }
  return false;
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

function generateRefreshToken(): string {
  return randomUUID() + randomUUID() + randomUUID();
}

export const Route = createFileRoute("/oauth/token")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Parse request body (supports both JSON and form-urlencoded)
        let body: Record<string, string>;
        const contentType = request.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          body = await request.json();
        } else if (contentType.includes("application/x-www-form-urlencoded")) {
          const formData = await request.formData();
          body = Object.fromEntries(formData.entries()) as Record<string, string>;
        } else {
          return new Response(
            JSON.stringify({
              error: "invalid_request",
              error_description: "Unsupported content type",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Check for Basic auth header
        const basicAuth = parseBasicAuth(request.headers.get("authorization"));
        if (basicAuth) {
          body.client_id = basicAuth.clientId;
          body.client_secret = basicAuth.clientSecret;
        }

        const validation = tokenRequestSchema.safeParse(body);
        if (!validation.success) {
          return new Response(
            JSON.stringify({
              error: "invalid_request",
              error_description: "Invalid token request",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        const data = validation.data;

        // Validate client
        const [client] = await db.select().from(oidcClient).where(eq(oidcClient.clientId, data.client_id)).limit(1);

        if (!client || !client.enabled) {
          return new Response(
            JSON.stringify({
              error: "invalid_client",
              error_description: "Unknown or disabled client",
            }),
            {
              status: 401,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Verify client secret if provided/required
        const requiresSecret = client.tokenEndpointAuthMethod !== "none";
        if (requiresSecret) {
          if (!data.client_secret) {
            return new Response(
              JSON.stringify({
                error: "invalid_client",
                error_description: "Client authentication required",
              }),
              {
                status: 401,
                headers: { "Content-Type": "application/json" },
              }
            );
          }
          const validSecret = await verifyClientSecret(client.clientSecretHash, data.client_secret);
          if (!validSecret) {
            return new Response(
              JSON.stringify({
                error: "invalid_client",
                error_description: "Invalid client credentials",
              }),
              {
                status: 401,
                headers: { "Content-Type": "application/json" },
              }
            );
          }
        }

        // Handle different grant types
        if (data.grant_type === "authorization_code") {
          return handleAuthorizationCodeGrant(data, client, request);
        } else if (data.grant_type === "refresh_token") {
          return handleRefreshTokenGrant(data, client, request);
        } else if (data.grant_type === "client_credentials") {
          return handleClientCredentialsGrant(data, client, request);
        }

        return new Response(
          JSON.stringify({
            error: "unsupported_grant_type",
            error_description: "Grant type not supported",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      },
    },
  },
});

async function handleAuthorizationCodeGrant(
  data: { code: string; redirect_uri: string; client_id: string; code_verifier?: string },
  client: typeof oidcClient.$inferSelect,
  request: Request
) {
  // Find authorization code
  const [authCode] = await db
    .select()
    .from(oidcAuthorizationCode)
    .where(and(eq(oidcAuthorizationCode.code, data.code), eq(oidcAuthorizationCode.clientId, data.client_id)))
    .limit(1);

  if (!authCode) {
    return new Response(
      JSON.stringify({
        error: "invalid_grant",
        error_description: "Invalid authorization code",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Check if code is expired
  if (authCode.expiresAt < new Date()) {
    await db.delete(oidcAuthorizationCode).where(eq(oidcAuthorizationCode.id, authCode.id));
    return new Response(
      JSON.stringify({
        error: "invalid_grant",
        error_description: "Authorization code expired",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Check if code was already used
  if (authCode.usedAt) {
    // Security: Code reuse attempt detected
    // Revoke tokens issued from this specific authorization code only
    // This is a security measure per OAuth 2.0 spec (RFC 6749 Section 4.1.2)
    await createAuditLogEntry(
      authCode.userId,
      "oidc.code_reuse_attempt",
      "oidc_authorization",
      authCode.id,
      { clientId: data.client_id },
      request,
      "failure"
    );
    return new Response(
      JSON.stringify({
        error: "invalid_grant",
        error_description: "Authorization code already used",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Verify redirect URI
  if (authCode.redirectUri !== data.redirect_uri) {
    return new Response(
      JSON.stringify({
        error: "invalid_grant",
        error_description: "Redirect URI mismatch",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Verify PKCE
  if (authCode.codeChallenge) {
    if (!data.code_verifier) {
      return new Response(
        JSON.stringify({
          error: "invalid_grant",
          error_description: "Code verifier required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    if (!verifyCodeChallenge(data.code_verifier, authCode.codeChallenge, authCode.codeChallengeMethod)) {
      return new Response(
        JSON.stringify({
          error: "invalid_grant",
          error_description: "Invalid code verifier",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // Mark code as used
  await db.update(oidcAuthorizationCode).set({ usedAt: new Date() }).where(eq(oidcAuthorizationCode.id, authCode.id));

  // Get user data
  const [userData] = await db.select().from(userTable).where(eq(userTable.id, authCode.userId)).limit(1);

  if (!userData) {
    return new Response(
      JSON.stringify({
        error: "invalid_grant",
        error_description: "User not found",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Get school info if available
  let schoolInfo;
  if (userData.school) {
    const [userSchoolData] = await db
      .select({
        schoolId: userSchool.schoolId,
        studentId: userSchool.studentId,
        schoolName: school.name,
      })
      .from(userSchool)
      .leftJoin(school, eq(userSchool.schoolId, school.id))
      .where(and(eq(userSchool.userId, userData.id), eq(userSchool.isPrimary, true)))
      .limit(1);

    if (userSchoolData) {
      schoolInfo = {
        id: userSchoolData.schoolId,
        name: userSchoolData.schoolName || "",
        student_id: userSchoolData.studentId || "",
      };
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const scopes = authCode.scope.split(" ");

  // Build ID token payload
  const idTokenPayload: IdTokenPayload = {
    iss: env.HOST_URL,
    sub: userData.id,
    aud: data.client_id,
    exp: now + (client.idTokenTtl || 3600),
    iat: now,
    auth_time: now,
    nonce: authCode.nonce || undefined,
    azp: data.client_id,

    // Profile claims
    name: userData.name,
    given_name: userData.firstName || undefined,
    family_name: userData.lastName || undefined,
    preferred_username: userData.displayName || userData.name,
    picture: userData.image || undefined,
    locale: userData.locale || "de",
    updated_at: Math.floor(userData.updatedAt.getTime() / 1000),

    // Email claims
    email: userData.email,
    email_verified: userData.emailVerified,

    // EWF Custom claims
    roles: userData.role ? [userData.role] : ["user"],
    school: schoolInfo,
    team_member: userData.role === "team" || userData.role === "admin",
    account_created: userData.createdAt.toISOString(),
  };

  // Add permissions if requested
  if (scopes.includes("permissions")) {
    // Get permissions based on role
    const { getPermissionsForRole } = await import("@/lib/permissions");
    idTokenPayload.permissions = getPermissionsForRole(userData.role || "user");
  }

  // Build access token payload
  const accessTokenPayload: AccessTokenPayload = {
    iss: env.HOST_URL,
    sub: userData.id,
    aud: [data.client_id, `${env.HOST_URL}/api`],
    exp: now + (client.accessTokenTtl || 3600),
    iat: now,
    client_id: data.client_id,
    scope: authCode.scope,
    jti: generateTokenId(),
    roles: userData.role ? [userData.role] : ["user"],
  };

  // Sign tokens
  const idToken = await signIdToken(idTokenPayload);
  const accessToken = await signAccessToken(accessTokenPayload);

  // Generate refresh token if offline_access scope
  let refreshToken: string | undefined;
  if (scopes.includes("offline_access")) {
    refreshToken = generateRefreshToken();

    // Store refresh token
    await db.insert(oidcToken).values({
      id: randomUUID(),
      type: "refresh_token",
      tokenHash: await hashToken(refreshToken),
      clientId: data.client_id,
      userId: userData.id,
      scope: authCode.scope,
      expiresAt: new Date(Date.now() + (client.refreshTokenTtl || 2592000) * 1000),
    });
  }

  // Store access token reference
  await db.insert(oidcToken).values({
    id: randomUUID(),
    type: "access_token",
    tokenHash: await hashToken(accessToken),
    clientId: data.client_id,
    userId: userData.id,
    scope: authCode.scope,
    expiresAt: new Date((now + (client.accessTokenTtl || 3600)) * 1000),
  });

  await createAuditLogEntry(
    userData.id,
    "oidc.token.issue",
    "oidc_token",
    null,
    { clientId: data.client_id, grantType: "authorization_code", scope: authCode.scope },
    request
  );

  const response: Record<string, unknown> = {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: client.accessTokenTtl || 3600,
    id_token: idToken,
    scope: authCode.scope,
  };

  if (refreshToken) {
    response.refresh_token = refreshToken;
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    },
  });
}

async function handleRefreshTokenGrant(
  data: { refresh_token: string; client_id: string; scope?: string },
  client: typeof oidcClient.$inferSelect,
  request: Request
) {
  const tokenHash = await hashToken(data.refresh_token);

  const [storedToken] = await db
    .select()
    .from(oidcToken)
    .where(and(eq(oidcToken.tokenHash, tokenHash), eq(oidcToken.type, "refresh_token"), eq(oidcToken.clientId, data.client_id)))
    .limit(1);

  if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
    return new Response(
      JSON.stringify({
        error: "invalid_grant",
        error_description: "Invalid or expired refresh token",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Get user data
  const [userData] = await db.select().from(userTable).where(eq(userTable.id, storedToken.userId)).limit(1);

  if (!userData || userData.banned) {
    return new Response(
      JSON.stringify({
        error: "invalid_grant",
        error_description: "User not found or banned",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Use original scope or reduced scope
  const scope = data.scope || storedToken.scope;
  const now = Math.floor(Date.now() / 1000);

  // Build new access token
  const accessTokenPayload: AccessTokenPayload = {
    iss: env.HOST_URL,
    sub: userData.id,
    aud: [data.client_id, `${env.HOST_URL}/api`],
    exp: now + (client.accessTokenTtl || 3600),
    iat: now,
    client_id: data.client_id,
    scope,
    jti: generateTokenId(),
    roles: userData.role ? [userData.role] : ["user"],
  };

  const accessToken = await signAccessToken(accessTokenPayload);

  // Rotate refresh token
  const newRefreshToken = generateRefreshToken();

  // Revoke old refresh token
  await db.update(oidcToken).set({ revokedAt: new Date() }).where(eq(oidcToken.id, storedToken.id));

  // Store new refresh token
  await db.insert(oidcToken).values({
    id: randomUUID(),
    type: "refresh_token",
    tokenHash: await hashToken(newRefreshToken),
    clientId: data.client_id,
    userId: userData.id,
    scope,
    expiresAt: new Date(Date.now() + (client.refreshTokenTtl || 2592000) * 1000),
  });

  // Store access token reference
  await db.insert(oidcToken).values({
    id: randomUUID(),
    type: "access_token",
    tokenHash: await hashToken(accessToken),
    clientId: data.client_id,
    userId: userData.id,
    scope,
    expiresAt: new Date((now + (client.accessTokenTtl || 3600)) * 1000),
  });

  await createAuditLogEntry(
    userData.id,
    "oidc.token.refresh",
    "oidc_token",
    null,
    { clientId: data.client_id, grantType: "refresh_token" },
    request
  );

  return new Response(
    JSON.stringify({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: client.accessTokenTtl || 3600,
      refresh_token: newRefreshToken,
      scope,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    }
  );
}

async function handleClientCredentialsGrant(data: { client_id: string; scope?: string }, client: typeof oidcClient.$inferSelect, request: Request) {
  // Client credentials only for machine-to-machine
  const scope = data.scope || "openid";
  const now = Math.floor(Date.now() / 1000);

  const accessTokenPayload: AccessTokenPayload = {
    iss: env.HOST_URL,
    sub: data.client_id, // For client credentials, subject is the client
    aud: [`${env.HOST_URL}/api`],
    exp: now + (client.accessTokenTtl || 3600),
    iat: now,
    client_id: data.client_id,
    scope,
    jti: generateTokenId(),
  };

  const accessToken = await signAccessToken(accessTokenPayload);

  await createAuditLogEntry(
    null,
    "oidc.token.issue",
    "oidc_token",
    null,
    { clientId: data.client_id, grantType: "client_credentials", scope },
    request
  );

  return new Response(
    JSON.stringify({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: client.accessTokenTtl || 3600,
      scope,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    }
  );
}
