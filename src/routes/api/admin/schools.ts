/**
 * EWF-ID Admin Schools API
 * SPEC.md Phase 4 - Task 4.3
 *
 * GET /api/admin/schools - List schools
 * POST /api/admin/schools - Create school (admin only)
 */
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "#auth";
import { db } from "~/lib/auth-db";
import { school, userSchool, auditLog } from "~/lib/auth/schema/audit";
import { eq, desc, count, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";

const createSchoolSchema = z.object({
  id: z.string().min(2).max(50),
  name: z.string().min(1).max(200),
  shortName: z.string().min(1).max(20),
  domain: z.string().optional(),
  oidcProviderId: z.string().optional(),
  oidcIssuer: z.string().url().optional(),
  oidcClientId: z.string().optional(),
  oidcClientSecret: z.string().optional(),
  oidcScopes: z.string().default("openid email profile"),
  logoUrl: z.string().url().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
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

export const Route = createFileRoute("/api/admin/schools")({
  server: {
    handlers: {
      // GET /api/admin/schools - List schools (team+ required)
      GET: async ({ request }) => {
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

        // Get schools with student counts
        const schools = await db
          .select({
            id: school.id,
            name: school.name,
            shortName: school.shortName,
            domain: school.domain,
            oidcProviderId: school.oidcProviderId,
            oidcIssuer: school.oidcIssuer,
            logoUrl: school.logoUrl,
            primaryColor: school.primaryColor,
            enabled: school.enabled,
            studentCount: school.studentCount,
            createdAt: school.createdAt,
            updatedAt: school.updatedAt,
          })
          .from(school)
          .orderBy(desc(school.createdAt));

        // Get verified student counts per school
        const schoolStats = await Promise.all(
          schools.map(async (s) => {
            const [verifiedCount] = await db
              .select({ count: count() })
              .from(userSchool)
              .where(
                and(
                  eq(userSchool.schoolId, s.id),
                  eq(userSchool.verified, true),
                ),
              );

            return {
              ...s,
              verifiedStudents: verifiedCount?.count || 0,
              hasOidc: !!s.oidcIssuer,
            };
          }),
        );

        return new Response(
          JSON.stringify({
            schools: schoolStats,
            count: schools.length,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      },

      // POST /api/admin/schools - Create school (admin only)
      POST: async ({ request }) => {
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

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const validation = createSchoolSchema.safeParse(body);
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

        // Check if school ID already exists
        const [existingSchool] = await db
          .select()
          .from(school)
          .where(eq(school.id, validation.data.id))
          .limit(1);

        if (existingSchool) {
          return new Response(
            JSON.stringify({
              error: "School with this ID already exists",
            }),
            {
              status: 409,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // Create school
        await db.insert(school).values(validation.data);

        await createAuditLogEntry(
          session.user.id,
          "admin.school.create",
          "school",
          validation.data.id,
          { name: validation.data.name },
          request,
        );

        return new Response(
          JSON.stringify({
            success: true,
            school: {
              id: validation.data.id,
              name: validation.data.name,
              shortName: validation.data.shortName,
            },
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
