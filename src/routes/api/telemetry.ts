/**
 * Telemetry Proxy API Route
 *
 * Proxies frontend telemetry data to Axiom while:
 * - Protecting the backend API token
 * - Adding server-side validation
 * - Implementing rate limiting
 * - Enriching with server context
 *
 * POST /api/telemetry - Accept OTLP trace data from frontend
 */
import { createFileRoute } from "@tanstack/react-router";
import env from "#env";

interface TelemetryPayload {
  resourceSpans?: Array<{
    resource?: {
      attributes?: Array<{ key: string; value: unknown }>;
    };
    scopeSpans?: Array<{
      spans?: Array<{
        traceId?: string;
        spanId?: string;
        name?: string;
        kind?: number;
        startTimeUnixNano?: string;
        endTimeUnixNano?: string;
        attributes?: Array<{ key: string; value: unknown }>;
        events?: Array<unknown>;
        status?: { code?: number; message?: string };
      }>;
    }>;
  }>;
}

// Simple in-memory rate limiter
// In production, use Redis or similar
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const existing = rateLimiter.get(ip);

  if (!existing || now > existing.resetAt) {
    // Reset or create new entry
    rateLimiter.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  existing.count++;
  return false;
}

function getClientIp(request: Request): string {
  // Try various headers for client IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback (Vercel/Netlify)
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return "unknown";
}

function isValidTelemetryPayload(payload: unknown): payload is TelemetryPayload {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const p = payload as Partial<TelemetryPayload>;

  // Basic structure validation
  if (!Array.isArray(p.resourceSpans)) {
    return false;
  }

  // Validate at least one span exists
  for (const resourceSpan of p.resourceSpans) {
    if (!resourceSpan.scopeSpans || !Array.isArray(resourceSpan.scopeSpans)) {
      continue;
    }

    for (const scopeSpan of resourceSpan.scopeSpans) {
      if (scopeSpan.spans && Array.isArray(scopeSpan.spans) && scopeSpan.spans.length > 0) {
        return true;
      }
    }
  }

  return false;
}

function enrichPayloadWithServerContext(
  payload: TelemetryPayload,
  clientIp: string,
  userAgent: string | null,
): TelemetryPayload {
  // Add server-side attributes that client can't be trusted with
  const serverAttributes = [
    {
      key: "server.received_at",
      value: { stringValue: new Date().toISOString() },
    },
    {
      key: "server.client_ip",
      value: { stringValue: clientIp },
    },
    {
      key: "server.validated",
      value: { boolValue: true },
    },
    {
      key: "telemetry.sdk.name",
      value: { stringValue: "ewf-id-frontend" },
    },
  ];

  if (userAgent) {
    serverAttributes.push({
      key: "http.user_agent",
      value: { stringValue: userAgent },
    });
  }

  // Add to resource attributes
  if (!payload.resourceSpans) {
    payload.resourceSpans = [];
  }

  for (const resourceSpan of payload.resourceSpans) {
    if (!resourceSpan.resource) {
      resourceSpan.resource = { attributes: [] };
    }
    if (!resourceSpan.resource.attributes) {
      resourceSpan.resource.attributes = [];
    }

    resourceSpan.resource.attributes.push(...serverAttributes);
  }

  return payload;
}

export const Route = createFileRoute("/api/telemetry")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Check if Axiom is configured
        if (!env.AXIOM_TOKEN) {
          console.warn("AXIOM_TOKEN not configured, telemetry dropped");
          return new Response("Telemetry not configured", { status: 501 });
        }

        // Get client info
        const clientIp = getClientIp(request);
        const userAgent = request.headers.get("user-agent");

        // Rate limiting
        if (isRateLimited(clientIp)) {
          return new Response("Rate limit exceeded", {
            status: 429,
            headers: {
              "Retry-After": "60",
            },
          });
        }

        // Parse payload
        let payload: unknown;
        try {
          payload = await request.json();
        } catch (error) {
          return new Response("Invalid JSON", { status: 400 });
        }

        // Validate payload structure
        if (!isValidTelemetryPayload(payload)) {
          return new Response("Invalid telemetry payload", { status: 400 });
        }

        // Enrich with server context
        const enrichedPayload = enrichPayloadWithServerContext(
          payload,
          clientIp,
          userAgent,
        );

        // Forward to Axiom
        try {
          const axiomResponse = await fetch(
            "https://api.axiom.co/v1/traces",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${env.AXIOM_TOKEN}`,
                "X-Axiom-Dataset": env.AXIOM_DATASET,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(enrichedPayload),
            },
          );

          if (!axiomResponse.ok) {
            const errorText = await axiomResponse.text();
            console.error("Axiom API error:", {
              status: axiomResponse.status,
              body: errorText,
            });

            // Don't expose internal details to client
            return new Response("Failed to send telemetry", {
              status: 500,
            });
          }

          // Success
          return new Response("OK", {
            status: 202, // Accepted
            headers: {
              "Content-Type": "text/plain",
            },
          });
        } catch (error) {
          console.error("Error forwarding telemetry to Axiom:", error);
          return new Response("Internal server error", {
            status: 500,
          });
        }
      },

      // Health check for the proxy
      GET: async () => {
        const isConfigured = !!env.AXIOM_TOKEN;

        return new Response(
          JSON.stringify({
            status: isConfigured ? "ready" : "not_configured",
            message: isConfigured
              ? "Telemetry proxy is ready"
              : "AXIOM_TOKEN not configured",
          }),
          {
            status: isConfigured ? 200 : 503,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      },
    },
  },
});
