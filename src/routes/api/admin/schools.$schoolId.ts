/**
 * EWF-ID Admin School Detail API
 * SPEC.md Phase 4 - Task 4.3
 *
 * GET /api/admin/schools/$schoolId - Get school details
 * PUT /api/admin/schools/$schoolId - Update school (admin only)
 * DELETE /api/admin/schools/$schoolId - Delete school (admin only)
 */

import { randomUUID } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "#auth";
import { auditLog, school, userSchool } from "~/lib/auth/schema/audit";
import { db } from "~/lib/auth-db";

const updateSchoolSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  shortName: z.string().min(1).max(20).optional(),
  domain: z.string().optional().nullable(),
  oidcProviderId: z.string().optional().nullable(),
  oidcIssuer: z.string().url().optional().nullable(),
  oidcClientId: z.string().optional().nullable(),
  oidcClientSecret: z.string().optional().nullable(),
  oidcScopes: z.string().optional(),
  logoUrl: z.string().url().optional().nullable(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .nullable(),
  enabled: z.boolean().optional(),
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

export const Route = createFileRoute("/api/admin/schools/$schoolId")({
  server: {
    handlers: {
      // GET /api/admin/schools/$schoolId - Get school details (team+ required)
      GET: async ({ request, params }) => {
        const session = await getSession(request);

        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (!isTeamOrAdmin(session.user.role)) {
          return new Response(
            JSON.stringify({ error: "Forbidden - team role required" }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const { schoolId } = params;

        const [schoolData] = await db
          .select()
          .from(school)
          .where(eq(school.id, schoolId))
          .limit(1);

        if (!schoolData) {
          return new Response(JSON.stringify({ error: "School not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Get student stats
        const [totalStudents] = await db
          .select({ count: count() })
          .from(userSchool)
          .where(eq(userSchool.schoolId, schoolId));

        const [verifiedStudents] = await db
          .select({ count: count() })
          .from(userSchool)
          .where(
            and(
              eq(userSchool.schoolId, schoolId),
              eq(userSchool.verified, true),
            ),
          );

        // Don't expose OIDC secrets to non-admins
        const isAdminUser = isAdmin(session.user.role);

        return new Response(
          JSON.stringify({
            school: {
              id: schoolData.id,
              name: schoolData.name,
              shortName: schoolData.shortName,
              domain: schoolData.domain,
              oidcProviderId: schoolData.oidcProviderId,
              oidcIssuer: schoolData.oidcIssuer,
              oidcClientId: isAdminUser ? schoolData.oidcClientId : undefined,
              oidcScopes: schoolData.oidcScopes,
              logoUrl: schoolData.logoUrl,
              primaryColor: schoolData.primaryColor,
              enabled: schoolData.enabled,
              createdAt: schoolData.createdAt,
              updatedAt: schoolData.updatedAt,
              hasOidcConfigured:
                !!schoolData.oidcIssuer && !!schoolData.oidcClientId,
            },
            stats: {
              totalStudents: totalStudents?.count || 0,
              verifiedStudents: verifiedStudents?.count || 0,
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      },

      // PUT /api/admin/schools/$schoolId - Update school (admin only)
      PUT: async ({ request, params }) => {
        const session = await getSession(request);

        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (!isAdmin(session.user.role)) {
          return new Response(
            JSON.stringify({ error: "Forbidden - admin role required" }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const { schoolId } = params;

        // Check school exists
        const [existingSchool] = await db
          .select()
          .from(school)
          .where(eq(school.id, schoolId))
          .limit(1);

        if (!existingSchool) {
          return new Response(JSON.stringify({ error: "School not found" }), {
            status: 404,
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

        const validation = updateSchoolSchema.safeParse(body);
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

        const updates: Record<string, unknown> = {};
        const changedFields: string[] = [];

        for (const [key, value] of Object.entries(validation.data)) {
          if (value !== undefined) {
            updates[key] = value;
            changedFields.push(key);
          }
        }

        if (changedFields.length === 0) {
          return new Response(
            JSON.stringify({ error: "No fields to update" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        await db.update(school).set(updates).where(eq(school.id, schoolId));

        await createAuditLogEntry(
          session.user.id,
          "admin.school.update",
          "school",
          schoolId,
          { fields: changedFields },
          request,
        );

        return new Response(
          JSON.stringify({
            success: true,
            message: "School updated",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      },

      // DELETE /api/admin/schools/$schoolId - Delete school (admin only)
      DELETE: async ({ request, params }) => {
        const session = await getSession(request);

        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (!isAdmin(session.user.role)) {
          return new Response(
            JSON.stringify({ error: "Forbidden - admin role required" }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const { schoolId } = params;

        // Check school exists
        const [existingSchool] = await db
          .select()
          .from(school)
          .where(eq(school.id, schoolId))
          .limit(1);

        if (!existingSchool) {
          return new Response(JSON.stringify({ error: "School not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Check if school has students
        const [studentCount] = await db
          .select({ count: count() })
          .from(userSchool)
          .where(eq(userSchool.schoolId, schoolId));

        if (studentCount && studentCount.count > 0) {
          return new Response(
            JSON.stringify({
              error: "Cannot delete school with active students",
              studentCount: studentCount.count,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // Delete school
        await db.delete(school).where(eq(school.id, schoolId));

        await createAuditLogEntry(
          session.user.id,
          "admin.school.delete",
          "school",
          schoolId,
          { name: existingSchool.name },
          request,
        );

        return new Response(
          JSON.stringify({
            success: true,
            message: "School deleted",
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
