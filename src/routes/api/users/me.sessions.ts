/**
 * EWF-ID User Sessions API
 * SPEC.md Phase 5 - Task 5.2
 *
 * GET /api/users/me/sessions - List current user's sessions
 */
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth";
import { db } from "@/lib/auth-db";
import { session as sessionTable } from "@/lib/auth/schema/betterauth";
import { auditLog } from "@/lib/auth/schema/audit";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";

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

// Parse user agent to extract device/browser info
function parseUserAgent(userAgent: string | null) {
  if (!userAgent) {
    return { browser: "Unknown", os: "Unknown", deviceType: "unknown" };
  }

  let browser = "Unknown";
  let os = "Unknown";
  let deviceType = "desktop";

  // Browser detection
  if (userAgent.includes("Firefox")) {
    browser = "Firefox";
  } else if (userAgent.includes("Edg")) {
    browser = "Edge";
  } else if (userAgent.includes("Chrome")) {
    browser = "Chrome";
  } else if (userAgent.includes("Safari")) {
    browser = "Safari";
  } else if (userAgent.includes("Opera") || userAgent.includes("OPR")) {
    browser = "Opera";
  }

  // OS detection
  if (userAgent.includes("Windows")) {
    os = "Windows";
  } else if (userAgent.includes("Mac OS")) {
    os = "macOS";
  } else if (userAgent.includes("Linux")) {
    os = "Linux";
  } else if (userAgent.includes("Android")) {
    os = "Android";
    deviceType = "mobile";
  } else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
    os = "iOS";
    deviceType = userAgent.includes("iPad") ? "tablet" : "mobile";
  }

  return { browser, os, deviceType };
}

export const Route = createFileRoute("/api/users/me/sessions")({
  server: {
    handlers: {
      // GET /api/users/me/sessions - List user sessions
      GET: async ({ request }) => {
        const currentSession = await getSession(request);

        if (!currentSession?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const userId = currentSession.user.id;

        // Get all sessions for user
        const sessions = await db
          .select()
          .from(sessionTable)
          .where(eq(sessionTable.userId, userId))
          .orderBy(desc(sessionTable.createdAt));

        const formattedSessions = sessions.map((s) => {
          const parsed = parseUserAgent(s.userAgent);
          return {
            id: s.id,
            token: s.token.substring(0, 8) + "...", // Only show prefix
            createdAt: s.createdAt,
            expiresAt: s.expiresAt,
            lastActivityAt: s.lastActivityAt || s.updatedAt,
            ipAddress: s.ipAddress,
            userAgent: s.userAgent,
            deviceName: s.deviceName || `${parsed.browser} on ${parsed.os}`,
            deviceType: s.deviceType || parsed.deviceType,
            browser: s.browser || parsed.browser,
            os: s.os || parsed.os,
            country: s.country,
            city: s.city,
            isCurrent: s.id === currentSession.session.id,
            impersonatedBy: s.impersonatedBy,
          };
        });

        await createAuditLog(userId, "sessions.list", "session", null, { count: sessions.length }, request);

        return new Response(
          JSON.stringify({
            sessions: formattedSessions,
            count: formattedSessions.length,
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
