/**
 * EWF-ID OAuth UserInfo Endpoint
 * SPEC.md Phase 5 - Task 5.1
 *
 * GET/POST /oauth/userinfo - Get user claims
 */
import { createFileRoute } from "@tanstack/react-router";
import { db } from "~/lib/auth-db";
import { user as userTable } from "~/lib/auth/schema/betterauth";
import {
  userSchool,
  school,
  oidcToken,
  auditLog,
} from "~/lib/auth/schema/audit";
import { verifyToken } from "~/lib/jwt";
import { eq, and } from "drizzle-orm";
import { randomUUID, createHash } from "node:crypto";
import env from "#env";

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

function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

async function hashToken(token: string): Promise<string> {
  return createHash("sha256").update(token).digest("hex");
}

async function getUserInfo(request: Request) {
  const token = extractBearerToken(request);

  if (!token) {
    return new Response(
      JSON.stringify({
        error: "invalid_token",
        error_description: "Missing access token",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "WWW-Authenticate": 'Bearer error="invalid_token"',
        },
      },
    );
  }

  // Verify token
  let payload: { sub: string; scope?: string; client_id?: string };
  try {
    payload = (await verifyToken(token)) as typeof payload;
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "invalid_token",
        error_description: "Invalid or expired access token",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "WWW-Authenticate": 'Bearer error="invalid_token"',
        },
      },
    );
  }

  // Check if token is revoked
  const tokenHash = await hashToken(token);
  const [storedToken] = await db
    .select()
    .from(oidcToken)
    .where(
      and(
        eq(oidcToken.tokenHash, tokenHash),
        eq(oidcToken.type, "access_token"),
      ),
    )
    .limit(1);

  if (storedToken?.revokedAt) {
    return new Response(
      JSON.stringify({
        error: "invalid_token",
        error_description: "Token has been revoked",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "WWW-Authenticate": 'Bearer error="invalid_token"',
        },
      },
    );
  }

  // Get user data
  const [userData] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, payload.sub))
    .limit(1);

  if (!userData) {
    return new Response(
      JSON.stringify({
        error: "invalid_token",
        error_description: "User not found",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "WWW-Authenticate": 'Bearer error="invalid_token"',
        },
      },
    );
  }

  if (userData.banned) {
    return new Response(
      JSON.stringify({
        error: "invalid_token",
        error_description: "User account is suspended",
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  // Build claims based on scope
  const scopes = (payload.scope || "openid").split(" ");
  const claims: Record<string, unknown> = {
    sub: userData.id,
  };

  // Standard profile claims
  if (scopes.includes("profile")) {
    claims.name = userData.name;
    claims.given_name = userData.firstName;
    claims.family_name = userData.lastName;
    claims.preferred_username = userData.displayName || userData.name;
    claims.picture = userData.image;
    claims.locale = userData.locale;
    claims.updated_at = Math.floor(userData.updatedAt.getTime() / 1000);
  }

  // Email claims
  if (scopes.includes("email")) {
    claims.email = userData.email;
    claims.email_verified = userData.emailVerified;
  }

  // EWF Custom claims (always included)
  claims.roles = userData.role ? [userData.role] : ["user"];
  claims.account_created = userData.createdAt.toISOString();

  // School info
  if (userData.school) {
    const [userSchoolData] = await db
      .select({
        schoolId: userSchool.schoolId,
        studentId: userSchool.studentId,
        schoolName: school.name,
      })
      .from(userSchool)
      .leftJoin(school, eq(userSchool.schoolId, school.id))
      .where(
        and(eq(userSchool.userId, userData.id), eq(userSchool.isPrimary, true)),
      )
      .limit(1);

    if (userSchoolData) {
      claims.school = {
        id: userSchoolData.schoolId,
        name: userSchoolData.schoolName,
        student_id: userSchoolData.studentId,
      };
    }
  }

  // Team member status
  if (scopes.includes("ewf:team")) {
    claims.team_member = userData.role === "team" || userData.role === "admin";
  }

  // Permissions
  if (scopes.includes("permissions")) {
    const { getPermissionsForRole } = await import("@/lib/permissions");
    claims.permissions = getPermissionsForRole(userData.role || "user");
  }

  await createAuditLogEntry(
    userData.id,
    "oidc.userinfo",
    "oidc_userinfo",
    null,
    { clientId: payload.client_id },
    request,
  );

  return new Response(JSON.stringify(claims), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export const Route = createFileRoute("/oauth/userinfo")({
  server: {
    handlers: {
      GET: getUserInfo,
      POST: getUserInfo,
    },
  },
});
