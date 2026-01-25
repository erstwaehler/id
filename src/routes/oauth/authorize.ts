/**
 * EWF-ID OAuth Authorization Endpoint
 * SPEC.md Phase 5 - Task 5.1
 *
 * GET /oauth/authorize - Authorization request
 * POST /oauth/authorize - Process authorization decision
 */
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "#auth";
import { db } from "~/lib/auth-db";
import {
  oidcClient,
  oidcAuthorizationCode,
  oidcConsent,
  auditLog,
} from "~/lib/auth/schema/audit";
import { eq, and } from "drizzle-orm";
import { randomUUID, createHash } from "node:crypto";
import { z } from "zod";
import env from "#env";

const authorizeQuerySchema = z.object({
  client_id: z.string().min(1),
  redirect_uri: z.url(),
  response_type: z.string().default("code"),
  scope: z.string().default("openid"),
  state: z.string().optional(),
  nonce: z.string().optional(),
  code_challenge: z.string().optional(),
  code_challenge_method: z.enum(["S256", "plain"]).optional(),
  prompt: z.enum(["none", "login", "consent", "select_account"]).optional(),
  login_hint: z.string().optional(),
  ui_locales: z.string().optional(),
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

function generateAuthorizationCode(): string {
  return randomUUID() + randomUUID().replace(/-/g, "");
}

function verifyCodeChallenge(
  verifier: string,
  challenge: string,
  method: string,
): boolean {
  if (method === "plain") {
    return verifier === challenge;
  }
  if (method === "S256") {
    const hash = createHash("sha256").update(verifier).digest("base64url");
    return hash === challenge;
  }
  return false;
}

export const Route = createFileRoute("/oauth/authorize")({
  server: {
    handlers: {
      // GET /oauth/authorize - Initiate authorization
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const queryParams = Object.fromEntries(url.searchParams.entries());

        const validation = authorizeQuerySchema.safeParse(queryParams);
        if (!validation.success) {
          return new Response(
            JSON.stringify({
              error: "invalid_request",
              error_description: "Invalid authorization request parameters",
              details: validation.error.flatten().fieldErrors,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const {
          client_id,
          redirect_uri,
          response_type,
          scope,
          state,
          nonce,
          code_challenge,
          code_challenge_method,
          prompt,
        } = validation.data;

        // Validate client
        const [client] = await db
          .select()
          .from(oidcClient)
          .where(eq(oidcClient.clientId, client_id))
          .limit(1);

        if (!client || !client.enabled) {
          return new Response(
            JSON.stringify({
              error: "unauthorized_client",
              error_description: "Unknown or disabled client",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // Validate redirect URI
        const allowedRedirects = client.redirectUris as string[];
        if (!allowedRedirects.includes(redirect_uri)) {
          return new Response(
            JSON.stringify({
              error: "invalid_request",
              error_description: "Invalid redirect_uri",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // Validate response type
        const allowedResponseTypes = client.responseTypes as string[];
        if (!allowedResponseTypes.includes(response_type)) {
          const errorUrl = new URL(redirect_uri);
          errorUrl.searchParams.set("error", "unsupported_response_type");
          if (state) errorUrl.searchParams.set("state", state);
          return Response.redirect(errorUrl.toString(), 302);
        }

        // Check PKCE requirement
        if (client.requirePkce && !code_challenge) {
          const errorUrl = new URL(redirect_uri);
          errorUrl.searchParams.set("error", "invalid_request");
          errorUrl.searchParams.set(
            "error_description",
            "PKCE code_challenge required",
          );
          if (state) errorUrl.searchParams.set("state", state);
          return Response.redirect(errorUrl.toString(), 302);
        }

        // Check if user is authenticated
        const session = await getSession(request);

        if (!session?.user) {
          // User needs to login
          if (prompt === "none") {
            // Cannot show login, return error
            const errorUrl = new URL(redirect_uri);
            errorUrl.searchParams.set("error", "login_required");
            if (state) errorUrl.searchParams.set("state", state);
            return Response.redirect(errorUrl.toString(), 302);
          }

          // Redirect to login with return URL
          const loginUrl = new URL(`${env.HOST_URL}/login`);
          loginUrl.searchParams.set("redirect", request.url);
          return Response.redirect(loginUrl.toString(), 302);
        }

        // Check for existing consent
        const requestedScopes = scope.split(" ").filter((s) => s.length > 0);
        const [existingConsent] = await db
          .select()
          .from(oidcConsent)
          .where(
            and(
              eq(oidcConsent.userId, session.user.id),
              eq(oidcConsent.clientId, client_id),
            ),
          )
          .limit(1);

        const grantedScopes =
          (existingConsent?.grantedScopes as string[]) || [];
        const needsNewConsent =
          !client.firstParty &&
          (prompt === "consent" ||
            requestedScopes.some((s) => !grantedScopes.includes(s)));

        if (needsNewConsent) {
          // Redirect to consent screen
          const consentUrl = new URL(`${env.HOST_URL}/oauth/consent`);
          consentUrl.searchParams.set("client_id", client_id);
          consentUrl.searchParams.set("redirect_uri", redirect_uri);
          consentUrl.searchParams.set("response_type", response_type);
          consentUrl.searchParams.set("scope", scope);
          if (state) consentUrl.searchParams.set("state", state);
          if (nonce) consentUrl.searchParams.set("nonce", nonce);
          if (code_challenge)
            consentUrl.searchParams.set("code_challenge", code_challenge);
          if (code_challenge_method)
            consentUrl.searchParams.set(
              "code_challenge_method",
              code_challenge_method,
            );
          return Response.redirect(consentUrl.toString(), 302);
        }

        // Generate authorization code
        const code = generateAuthorizationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await db.insert(oidcAuthorizationCode).values({
          id: randomUUID(),
          code,
          clientId: client_id,
          userId: session.user.id,
          redirectUri: redirect_uri,
          scope,
          state,
          nonce,
          codeChallenge: code_challenge || null,
          codeChallengeMethod: code_challenge_method || null,
          expiresAt,
        });

        await createAuditLogEntry(
          session.user.id,
          "oidc.authorize",
          "oidc_authorization",
          null,
          { clientId: client_id, scope, responseType: response_type },
          request,
        );

        // Redirect back with code
        const callbackUrl = new URL(redirect_uri);
        callbackUrl.searchParams.set("code", code);
        if (state) callbackUrl.searchParams.set("state", state);

        return Response.redirect(callbackUrl.toString(), 302);
      },
    },
  },
});
