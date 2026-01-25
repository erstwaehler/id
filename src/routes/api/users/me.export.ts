/**
 * EWF-ID Data Export API
 * SPEC.md Phase 5 - Task 5.2 & Phase 3 - Task 3.3 (GDPR)
 *
 * POST /api/users/me/export - Request data export
 */
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth";
import { db } from "@/lib/auth-db";
import { user as userTable, session as sessionTable, account as accountTable, passkey as passkeyTable } from "@/lib/auth/schema/betterauth";
import { auditLog, dataExportRequest, userSchool, apiKey } from "@/lib/auth/schema/audit";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";

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

export const Route = createFileRoute("/api/users/me/export")({
  server: {
    handlers: {
      // POST /api/users/me/export - Request data export
      POST: async ({ request }) => {
        const session = await getSession(request);

        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const userId = session.user.id;

        // Check for existing pending export request
        const [existingRequest] = await db
          .select()
          .from(dataExportRequest)
          .where(eq(dataExportRequest.userId, userId))
          .orderBy(desc(dataExportRequest.createdAt))
          .limit(1);

        if (existingRequest && existingRequest.status === "pending") {
          return new Response(
            JSON.stringify({
              error: "Export already in progress",
              requestId: existingRequest.id,
              createdAt: existingRequest.createdAt,
            }),
            {
              status: 409,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Collect all user data
        const [userData] = await db.select().from(userTable).where(eq(userTable.id, userId)).limit(1);

        const sessions = await db.select().from(sessionTable).where(eq(sessionTable.userId, userId));

        const accounts = await db.select().from(accountTable).where(eq(accountTable.userId, userId));

        const passkeys = await db.select().from(passkeyTable).where(eq(passkeyTable.userId, userId));

        const schools = await db.select().from(userSchool).where(eq(userSchool.userId, userId));

        const apiKeys = await db.select().from(apiKey).where(eq(apiKey.userId, userId));

        const logs = await db
          .select()
          .from(auditLog)
          .where(eq(auditLog.userId, userId))
          .orderBy(desc(auditLog.timestamp))
          .limit(1000); // Last 1000 audit entries

        // Compile export data
        const exportData = {
          exportedAt: new Date().toISOString(),
          exportVersion: "1.0.0",
          user: {
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
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt,
          },
          sessions: sessions.map((s) => ({
            id: s.id,
            createdAt: s.createdAt,
            expiresAt: s.expiresAt,
            ipAddress: s.ipAddress,
            userAgent: s.userAgent,
            deviceName: s.deviceName,
            deviceType: s.deviceType,
          })),
          accounts: accounts.map((a) => ({
            id: a.id,
            providerId: a.providerId,
            createdAt: a.createdAt,
          })),
          passkeys: passkeys.map((p) => ({
            id: p.id,
            name: p.name,
            deviceType: p.deviceType,
            createdAt: p.createdAt,
          })),
          schoolAffiliations: schools.map((s) => ({
            schoolId: s.schoolId,
            studentId: s.studentId,
            department: s.department,
            graduationYear: s.graduationYear,
            verified: s.verified,
            verifiedAt: s.verifiedAt,
            createdAt: s.createdAt,
          })),
          apiKeys: apiKeys.map((k) => ({
            id: k.id,
            name: k.name,
            createdAt: k.createdAt,
            lastUsedAt: k.lastUsedAt,
            expiresAt: k.expiresAt,
          })),
          auditLog: logs.map((l) => ({
            id: l.id,
            timestamp: l.timestamp,
            action: l.action,
            resource: l.resource,
            resourceId: l.resourceId,
            ipAddress: l.ipAddress,
            result: l.result,
          })),
        };

        // Generate download token
        const downloadToken = randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        // Create export request record
        const exportRequestId = randomUUID();
        await db.insert(dataExportRequest).values({
          id: exportRequestId,
          userId,
          status: "completed",
          downloadToken,
          expiresAt,
          completedAt: new Date(),
        });

        await createAuditLogEntry(userId, "data_export.request", "user", userId, {}, request);

        // Return the data directly (in production, this would be a download link)
        return new Response(JSON.stringify(exportData), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="ewf-id-export-${userId}-${Date.now()}.json"`,
          },
        });
      },
    },
  },
});
