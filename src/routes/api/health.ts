/**
 * EWF-ID Health Check Endpoint
 * SPEC.md Phase 5 - Task 5.5
 *
 * GET /api/health - Returns system health status
 *
 * Note: This is a simple health check without database checks
 * to avoid potential DOS vectors and high billing on serverless.
 * The app running on Vercel/Lambda will fail if unhealthy anyway.
 */
import { createFileRoute } from "@tanstack/react-router";
import env from "#env";

interface HealthCheck {
  status: "healthy" | "degraded";
  timestamp: string;
  version: string;
  environment: string;
}

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const health: HealthCheck = {
          status: "healthy",
          timestamp: new Date().toISOString(),
          version: "2.0.0",
          environment: env.NODE_ENV,
        };

        return new Response(JSON.stringify(health), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, max-age=0",
          },
        });
      },
    },
  },
});
