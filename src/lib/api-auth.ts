/**
 * EWF-ID API Authentication Middleware
 * SPEC.md Phase 5 - Task 5.4: API Key Authentication
 *
 * Provides authentication for API routes via session or API key
 */
import { auth } from "#auth";
import { db } from "~/lib/auth-db";
import { apiKey, auditLog } from "~/lib/auth/schema/audit";
import { user as userTable } from "~/lib/auth/schema/betterauth";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import argon2 from "argon2";
import logger from "#logger";

export interface AuthResult {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string | null;
  };
  method: "session" | "api_key" | "bearer" | "none";
  apiKeyId?: string;
  error?: string;
}

/**
 * Authenticate a request using session or API key
 */
export async function authenticateRequest(request: Request): Promise<AuthResult> {
  // Check for Authorization header
  const authHeader = request.headers.get("authorization");

  if (authHeader) {
    // Bearer token (API key or access token)
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);

      // Check if it looks like an EWF API key
      if (token.startsWith("ewf_")) {
        return authenticateApiKey(token, request);
      }

      // Try Better Auth bearer token
      try {
        const session = await auth.api.getSession({
          headers: request.headers,
        });

        if (session?.user) {
          return {
            authenticated: true,
            user: {
              id: session.user.id,
              email: session.user.email,
              name: session.user.name,
              role: session.user.role || null,
            },
            method: "bearer",
          };
        }
      } catch (error) {
        logger.debug("Bearer token authentication failed", { error: String(error) });
      }
    }
  }

  // Try session-based authentication
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (session?.user) {
      return {
        authenticated: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role || null,
        },
        method: "session",
      };
    }
  } catch (error) {
    logger.debug("Session authentication failed", { error: String(error) });
  }

  return {
    authenticated: false,
    method: "none",
    error: "No valid authentication provided",
  };
}

/**
 * Authenticate using API key
 */
async function authenticateApiKey(token: string, request: Request): Promise<AuthResult> {
  // Extract prefix (ewf_xxxxxxxx)
  const parts = token.split("_");
  if (parts.length < 3) {
    return {
      authenticated: false,
      method: "api_key",
      error: "Invalid API key format",
    };
  }

  const prefix = `${parts[0]}_${parts[1]}`;

  // Find API key by prefix
  const [apiKeyRecord] = await db
    .select()
    .from(apiKey)
    .where(and(eq(apiKey.keyPrefix, prefix), eq(apiKey.enabled, true)))
    .limit(1);

  if (!apiKeyRecord) {
    logger.warn("API key not found", { prefix });
    return {
      authenticated: false,
      method: "api_key",
      error: "Invalid API key",
    };
  }

  // Check expiration
  if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
    logger.warn("API key expired", { apiKeyId: apiKeyRecord.id });
    return {
      authenticated: false,
      method: "api_key",
      error: "API key expired",
    };
  }

  // Verify key hash
  const isValid = await argon2.verify(apiKeyRecord.keyHash, token);
  if (!isValid) {
    logger.warn("API key hash mismatch", { apiKeyId: apiKeyRecord.id });
    return {
      authenticated: false,
      method: "api_key",
      error: "Invalid API key",
    };
  }

  // Get user
  const [userData] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, apiKeyRecord.userId))
    .limit(1);

  if (!userData) {
    logger.error("API key user not found", { apiKeyId: apiKeyRecord.id, userId: apiKeyRecord.userId });
    return {
      authenticated: false,
      method: "api_key",
      error: "User not found",
    };
  }

  if (userData.banned) {
    logger.warn("API key user is banned", { apiKeyId: apiKeyRecord.id, userId: userData.id });
    return {
      authenticated: false,
      method: "api_key",
      error: "User is suspended",
    };
  }

  // Update last used
  const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  await db
    .update(apiKey)
    .set({
      lastUsedAt: new Date(),
      lastUsedIp: ipAddress,
    })
    .where(eq(apiKey.id, apiKeyRecord.id));

  // Log API key usage
  await db.insert(auditLog).values({
    id: randomUUID(),
    userId: userData.id,
    action: "api_key.use",
    resource: "api_key",
    resourceId: apiKeyRecord.id,
    metadata: { keyName: apiKeyRecord.name },
    ipAddress,
    userAgent: request.headers.get("user-agent") || "unknown",
    result: "success",
  });

  logger.info("API key authenticated", {
    userId: userData.id,
    apiKeyId: apiKeyRecord.id,
    keyName: apiKeyRecord.name,
  });

  return {
    authenticated: true,
    user: {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
    },
    method: "api_key",
    apiKeyId: apiKeyRecord.id,
  };
}

/**
 * Helper to check if user has required role
 */
export function hasRole(userRole: string | null, requiredRole: string): boolean {
  if (!userRole) return false;

  const roleHierarchy: Record<string, number> = {
    user: 1,
    student: 2,
    teacher: 3,
    team: 4,
    admin: 5,
  };

  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userLevel >= requiredLevel;
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(message = "Unauthorized"): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Create forbidden response
 */
export function forbiddenResponse(message = "Forbidden"): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}
