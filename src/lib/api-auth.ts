/**
 * EWF-ID API Authentication Middleware
 * SPEC.md Phase 5 - Task 5.4: API Key Authentication
 *
 * Provides authentication for API routes via session or API key
 * Uses Better Auth's built-in API key plugin
 */
import { auth } from "#auth";
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

      // Try Better Auth's API key verification
      try {
        const result = await auth.api.verifyApiKey({
          headers: request.headers,
        });

        if (result?.valid && result.key) {
          return {
            authenticated: true,
            user: {
              id: result.key.userId,
              email: result.key.userId, // API key doesn't have email directly
              name: result.key.name || "API User",
              role: null, // Would need to fetch user for role
            },
            method: "api_key",
            apiKeyId: result.key.id,
          };
        }
      } catch (error) {
        logger.debug("API key verification failed", { error: String(error) });
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
