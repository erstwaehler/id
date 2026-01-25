/**
 * EWF-ID User Profile API
 * SPEC.md Phase 5 - Task 5.2
 *
 * GET /api/users/me - Get current user profile
 * PUT /api/users/me - Update current user profile
 */
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth";
import { db } from "@/lib/auth-db";
import { user as userTable, session as sessionTable } from "@/lib/auth/schema/betterauth";
import { userSchool, school, apiKey, auditLog } from "@/lib/auth/schema/audit";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "node:crypto";

// Profile update schema
const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  locale: z.enum(["de", "en", "uk"]).optional(),
  image: z.string().url().optional(),
});

type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

async function getSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  return session;
}

async function createAuditLog(
  userId: string | null,
  action: string,
  resource: string,
  resourceId: string | null,
  metadata: Record<string, unknown>,
  request: Request,
  result: "success" | "failure" = "success",
  errorMessage?: string
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
      errorMessage,
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

export const Route = createFileRoute("/api/users/me")({
  server: {
    handlers: {
      // GET /api/users/me - Get current user profile
      GET: async ({ request }) => {
        const session = await getSession(request);

        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const userId = session.user.id;

        // Get user with schools
        const [userData] = await db
          .select()
          .from(userTable)
          .where(eq(userTable.id, userId))
          .limit(1);

        if (!userData) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Get user's school affiliations
        const userSchools = await db
          .select({
            schoolId: userSchool.schoolId,
            studentId: userSchool.studentId,
            department: userSchool.department,
            graduationYear: userSchool.graduationYear,
            verified: userSchool.verified,
            verifiedAt: userSchool.verifiedAt,
            isPrimary: userSchool.isPrimary,
            schoolName: school.name,
            schoolShortName: school.shortName,
            schoolLogoUrl: school.logoUrl,
          })
          .from(userSchool)
          .leftJoin(school, eq(userSchool.schoolId, school.id))
          .where(eq(userSchool.userId, userId));

        // Get session count
        const sessions = await db
          .select()
          .from(sessionTable)
          .where(eq(sessionTable.userId, userId));

        // Get API key count
        const apiKeys = await db
          .select()
          .from(apiKey)
          .where(and(eq(apiKey.userId, userId), eq(apiKey.enabled, true)));

        const profile = {
          id: userData.id,
          email: userData.email,
          emailVerified: userData.emailVerified,
          name: userData.name,
          firstName: userData.firstName,
          lastName: userData.lastName,
          displayName: userData.displayName,
          bio: userData.bio,
          image: userData.image,
          locale: userData.locale,
          role: userData.role,
          schoolVerified: userData.schoolVerified,
          lastLoginMethod: userData.lastLoginMethod,
          lastLoginAt: userData.lastLoginAt,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
          schools: userSchools,
          stats: {
            activeSessions: sessions.length,
            activeApiKeys: apiKeys.length,
          },
        };

        await createAuditLog(userId, "profile.view", "user", userId, {}, request);

        return new Response(JSON.stringify(profile), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },

      // PUT /api/users/me - Update current user profile
      PUT: async ({ request }) => {
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

        const validation = updateProfileSchema.safeParse(body);
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

        const updates: Partial<UpdateProfileInput> = {};

        if (validation.data.name !== undefined) updates.name = validation.data.name;
        if (validation.data.firstName !== undefined) updates.firstName = validation.data.firstName;
        if (validation.data.lastName !== undefined) updates.lastName = validation.data.lastName;
        if (validation.data.displayName !== undefined) updates.displayName = validation.data.displayName;
        if (validation.data.bio !== undefined) updates.bio = validation.data.bio;
        if (validation.data.locale !== undefined) updates.locale = validation.data.locale;
        if (validation.data.image !== undefined) updates.image = validation.data.image;

        if (Object.keys(updates).length === 0) {
          return new Response(JSON.stringify({ error: "No fields to update" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        await db.update(userTable).set(updates).where(eq(userTable.id, userId));

        const [updatedUser] = await db.select().from(userTable).where(eq(userTable.id, userId)).limit(1);

        await createAuditLog(userId, "profile.update", "user", userId, { fields: Object.keys(updates) }, request);

        return new Response(
          JSON.stringify({
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            displayName: updatedUser.displayName,
            bio: updatedUser.bio,
            image: updatedUser.image,
            locale: updatedUser.locale,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      },
    },
  },
});
