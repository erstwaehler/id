/**
 * EWF-ID Health Check Endpoint
 * SPEC.md Phase 5 - Task 5.5
 *
 * GET /api/health - Returns system health status
 */
import { createFileRoute, json } from "@tanstack/react-router";
import { db } from "@/lib/auth-db";
import { sql } from "drizzle-orm";
import env from "#env";

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database: HealthStatus;
    email: HealthStatus;
    posthog: HealthStatus;
  };
  environment: string;
}

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  latency?: number;
  message?: string;
}

async function checkDatabase(): Promise<HealthStatus> {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return {
      status: "healthy",
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : "Database connection failed",
    };
  }
}

async function checkEmail(): Promise<HealthStatus> {
  // Check if Resend API key is configured
  if (!env.RESEND_API_KEY) {
    return {
      status: "unhealthy",
      message: "Resend API key not configured",
    };
  }
  return {
    status: "healthy",
  };
}

async function checkPosthog(): Promise<HealthStatus> {
  // Check if PostHog is configured
  if (!env.POSTHOG_API_KEY) {
    return {
      status: "degraded",
      message: "PostHog not configured (optional)",
    };
  }
  return {
    status: "healthy",
  };
}

function getOverallStatus(checks: HealthCheck["checks"]): HealthCheck["status"] {
  const statuses = Object.values(checks).map((c) => c.status);

  if (statuses.some((s) => s === "unhealthy")) {
    return "unhealthy";
  }
  if (statuses.some((s) => s === "degraded")) {
    return "degraded";
  }
  return "healthy";
}

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const checks = {
          database: await checkDatabase(),
          email: await checkEmail(),
          posthog: await checkPosthog(),
        };

        const health: HealthCheck = {
          status: getOverallStatus(checks),
          timestamp: new Date().toISOString(),
          version: "2.0.0",
          checks,
          environment: env.NODE_ENV,
        };

        const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;

        return new Response(JSON.stringify(health), {
          status: statusCode,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
