/**
 * EWF-ID Admin Users API
 * SPEC.md Phase 5 - Task 5.3
 *
 * GET /api/admin/users - List all users (paginated, filtered)
 */
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "#auth";
import { db } from "~/lib/auth-db";
import { user as userTable } from "~/lib/auth/schema/betterauth";
import { auditLog } from "~/lib/auth/schema/audit";
import { eq, desc, asc, ilike, or, and, sql, count } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";

const listUsersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  role: z.enum(["user", "student", "teacher", "team", "admin"]).optional(),
  school: z.string().optional(),
  emailVerified: z.coerce.boolean().optional(),
  banned: z.coerce.boolean().optional(),
  sortBy: z
    .enum(["createdAt", "name", "email", "lastLoginAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
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

export const Route = createFileRoute("/api/admin/users")({
  server: {
    handlers: {
      // GET /api/admin/users - List users (team+ required)
      GET: async ({ request }) => {
        const session = await getSession(request);

        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Check team/admin permission
        if (!isTeamOrAdmin(session.user.role)) {
          return new Response(
            JSON.stringify({ error: "Forbidden - team role required" }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // Parse query params
        const url = new URL(request.url);
        const queryParams = Object.fromEntries(url.searchParams.entries());
        const validation = listUsersQuerySchema.safeParse(queryParams);

        if (!validation.success) {
          return new Response(
            JSON.stringify({
              error: "Invalid query parameters",
              details: validation.error.flatten().fieldErrors,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const {
          page,
          limit,
          search,
          role,
          school,
          emailVerified,
          banned,
          sortBy,
          sortOrder,
        } = validation.data;
        const offset = (page - 1) * limit;

        // Build where conditions
        const conditions = [];

        if (search) {
          conditions.push(
            or(
              ilike(userTable.email, `%${search}%`),
              ilike(userTable.name, `%${search}%`),
              ilike(userTable.firstName, `%${search}%`),
              ilike(userTable.lastName, `%${search}%`),
            ),
          );
        }

        if (role) {
          conditions.push(eq(userTable.role, role));
        }

        if (school) {
          conditions.push(eq(userTable.school, school));
        }

        if (emailVerified !== undefined) {
          conditions.push(eq(userTable.emailVerified, emailVerified));
        }

        if (banned !== undefined) {
          conditions.push(eq(userTable.banned, banned));
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        // Build sort
        const sortColumn = {
          createdAt: userTable.createdAt,
          name: userTable.name,
          email: userTable.email,
          lastLoginAt: userTable.lastLoginAt,
        }[sortBy];

        const orderBy =
          sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

        // Get total count
        const [countResult] = await db
          .select({ count: count() })
          .from(userTable)
          .where(whereClause);

        const totalCount = countResult?.count || 0;

        // Get users
        const users = await db
          .select({
            id: userTable.id,
            email: userTable.email,
            emailVerified: userTable.emailVerified,
            name: userTable.name,
            firstName: userTable.firstName,
            lastName: userTable.lastName,
            displayName: userTable.displayName,
            image: userTable.image,
            role: userTable.role,
            school: userTable.school,
            schoolVerified: userTable.schoolVerified,
            banned: userTable.banned,
            banReason: userTable.banReason,
            banExpires: userTable.banExpires,
            lastLoginAt: userTable.lastLoginAt,
            lastLoginMethod: userTable.lastLoginMethod,
            createdAt: userTable.createdAt,
            updatedAt: userTable.updatedAt,
          })
          .from(userTable)
          .where(whereClause)
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset);

        await createAuditLogEntry(
          session.user.id,
          "admin.users.list",
          "user",
          null,
          {
            filters: { search, role, school, emailVerified, banned },
            page,
            limit,
          },
          request,
        );

        return new Response(
          JSON.stringify({
            users,
            pagination: {
              page,
              limit,
              totalCount,
              totalPages: Math.ceil(totalCount / limit),
              hasMore: page * limit < totalCount,
            },
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
