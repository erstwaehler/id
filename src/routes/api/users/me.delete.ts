/**
 * EWF-ID Account Deletion API
 * SPEC.md Phase 5 - Task 5.2 & Phase 3 - Task 3.3 (GDPR)
 *
 * POST /api/users/me/delete - Request account deletion
 * DELETE /api/users/me/delete - Cancel deletion request
 */
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "#auth";
import { db } from "~/lib/auth-db";
import { user as userTable } from "~/lib/auth/schema/betterauth";
import { auditLog, accountDeletionRequest } from "~/lib/auth/schema/audit";
import { eq, and, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";

const deleteRequestSchema = z.object({
  reason: z.string().max(500).optional(),
  confirmEmail: z.string().email(),
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

export const Route = createFileRoute("/api/users/me/delete")({
  server: {
    handlers: {
      // GET /api/users/me/delete - Check deletion status
      GET: async ({ request }) => {
        const session = await getSession(request);

        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const userId = session.user.id;

        // Check for existing deletion request
        const [existingRequest] = await db
          .select()
          .from(accountDeletionRequest)
          .where(
            and(
              eq(accountDeletionRequest.userId, userId),
              eq(accountDeletionRequest.status, "pending"),
            ),
          )
          .limit(1);

        if (!existingRequest) {
          return new Response(
            JSON.stringify({
              hasPendingRequest: false,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        return new Response(
          JSON.stringify({
            hasPendingRequest: true,
            requestId: existingRequest.id,
            scheduledAt: existingRequest.scheduledAt,
            reason: existingRequest.reason,
            createdAt: existingRequest.createdAt,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      },

      // POST /api/users/me/delete - Request account deletion
      POST: async ({ request }) => {
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

        const validation = deleteRequestSchema.safeParse(body);
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

        // Verify email matches
        const [userData] = await db
          .select()
          .from(userTable)
          .where(eq(userTable.id, userId))
          .limit(1);

        if (
          userData.email.toLowerCase() !==
          validation.data.confirmEmail.toLowerCase()
        ) {
          return new Response(
            JSON.stringify({
              error: "Email confirmation does not match",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // Check for existing pending request
        const [existingRequest] = await db
          .select()
          .from(accountDeletionRequest)
          .where(
            and(
              eq(accountDeletionRequest.userId, userId),
              eq(accountDeletionRequest.status, "pending"),
            ),
          )
          .limit(1);

        if (existingRequest) {
          return new Response(
            JSON.stringify({
              error: "Deletion request already pending",
              requestId: existingRequest.id,
              scheduledAt: existingRequest.scheduledAt,
            }),
            {
              status: 409,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // Schedule deletion 30 days from now (GDPR grace period)
        const scheduledAt = new Date();
        scheduledAt.setDate(scheduledAt.getDate() + 30);

        // Generate cancellation token
        const cancellationToken = randomUUID();

        // Create deletion request
        const requestId = randomUUID();
        await db.insert(accountDeletionRequest).values({
          id: requestId,
          userId,
          status: "pending",
          reason: validation.data.reason,
          cancellationToken,
          scheduledAt,
        });

        // Update user record
        await db
          .update(userTable)
          .set({
            deletionRequestedAt: new Date(),
            deletionScheduledAt: scheduledAt,
          })
          .where(eq(userTable.id, userId));

        await createAuditLogEntry(
          userId,
          "account_deletion.request",
          "user",
          userId,
          {
            reason: validation.data.reason,
            scheduledAt: scheduledAt.toISOString(),
          },
          request,
        );

        // TODO: Send confirmation email with cancellation link

        return new Response(
          JSON.stringify({
            success: true,
            message: "Account deletion scheduled",
            requestId,
            scheduledAt,
            cancellationToken,
            gracePeriodDays: 30,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      },

      // DELETE /api/users/me/delete - Cancel deletion request
      DELETE: async ({ request }) => {
        const session = await getSession(request);

        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const userId = session.user.id;

        // Find pending deletion request
        const [existingRequest] = await db
          .select()
          .from(accountDeletionRequest)
          .where(
            and(
              eq(accountDeletionRequest.userId, userId),
              eq(accountDeletionRequest.status, "pending"),
            ),
          )
          .limit(1);

        if (!existingRequest) {
          return new Response(
            JSON.stringify({
              error: "No pending deletion request found",
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // Update request status
        await db
          .update(accountDeletionRequest)
          .set({
            status: "cancelled",
            cancelledAt: new Date(),
          })
          .where(eq(accountDeletionRequest.id, existingRequest.id));

        // Clear user deletion fields
        await db
          .update(userTable)
          .set({
            deletionRequestedAt: null,
            deletionScheduledAt: null,
          })
          .where(eq(userTable.id, userId));

        await createAuditLogEntry(
          userId,
          "account_deletion.cancel",
          "user",
          userId,
          {},
          request,
        );

        return new Response(
          JSON.stringify({
            success: true,
            message: "Account deletion cancelled",
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
