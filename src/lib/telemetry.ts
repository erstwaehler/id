/**
 * EWF-ID OpenTelemetry Integration
 * SPEC.md Phase 7 - Task 7.1: OpenTelemetry Setup
 * 
 * Provides distributed tracing with Axiom export.
 * This module provides a stub implementation that can be enabled
 * when @opentelemetry packages are installed.
 * 
 * Installation (when ready to enable):
 * bun add @opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-http @opentelemetry/auto-instrumentations-node
 */
import env from "#env";

// Types for OTEL
export interface SpanContext {
  traceId: string;
  spanId: string;
}

export interface Span {
  setAttribute(key: string, value: string | number | boolean): void;
  setStatus(status: { code: number; message?: string }): void;
  recordException(error: Error): void;
  end(): void;
}

// No-op implementations for when OTEL is not configured
const noopSpan: Span = {
  setAttribute: () => {},
  setStatus: () => {},
  recordException: () => {},
  end: () => {},
};

/**
 * Get current trace context from OTEL (returns null when OTEL is not enabled)
 */
export function getTraceContext(): SpanContext | null {
  // OTEL implementation: 
  // const span = trace.getActiveSpan()
  // return span ? { traceId: span.spanContext().traceId, spanId: span.spanContext().spanId } : null
  return null;
}

/**
 * Create a span for tracing an operation (no-op when OTEL is not enabled)
 */
export function createSpan(_name: string, _attributes?: Record<string, string | number | boolean>): Span {
  // OTEL implementation:
  // const tracer = trace.getTracer('ewf-id')
  // const span = tracer.startSpan(name)
  // if (attributes) Object.entries(attributes).forEach(([k, v]) => span.setAttribute(k, v))
  // return span
  return noopSpan;
}

/**
 * Wrap an async function with tracing
 */
export async function withSpan<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const span = createSpan(name, attributes);
  
  try {
    const result = await fn();
    span.setStatus({ code: 0 }); // OK
    return result;
  } catch (error) {
    span.setStatus({ code: 2, message: error instanceof Error ? error.message : "Unknown error" });
    if (error instanceof Error) {
      span.recordException(error);
    }
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Initialize OpenTelemetry SDK
 * Call this at server startup when OTEL packages are installed
 */
export async function initOpenTelemetry(): Promise<void> {
  if (env.NODE_ENV !== "production") {
    console.debug("[OTEL] Skipping in non-production");
    return;
  }

  if (!env.AXIOM_TOKEN || !env.AXIOM_DATASET) {
    console.debug("[OTEL] Missing Axiom config");
    return;
  }

  // Full implementation when packages are installed:
  // 1. Import NodeSDK, OTLPTraceExporter, getNodeAutoInstrumentations, Resource
  // 2. Create exporter with Axiom endpoint and auth
  // 3. Create SDK with resource (service name: 'ewf-id')
  // 4. Call sdk.start() and register SIGTERM handler for graceful shutdown
  
  console.debug("[OTEL] Ready (packages not installed)");
}

/**
 * Common span attributes for EWF-ID operations
 */
export const SpanAttributes = {
  // User context
  USER_ID: "user.id",
  USER_EMAIL: "user.email",
  USER_ROLE: "user.role",
  
  // School context
  SCHOOL_ID: "school.id",
  SCHOOL_NAME: "school.name",
  
  // Operation context
  OPERATION_TYPE: "operation.type",
  OPERATION_NAME: "operation.name",
  
  // Request context
  HTTP_METHOD: "http.method",
  HTTP_ROUTE: "http.route",
  HTTP_STATUS_CODE: "http.status_code",
  HTTP_USER_AGENT: "http.user_agent",
  HTTP_CLIENT_IP: "http.client_ip",
  
  // Authentication context
  AUTH_METHOD: "auth.method",
  AUTH_SUCCESS: "auth.success",
  SESSION_ID: "session.id",
  
  // OIDC context
  OIDC_CLIENT_ID: "oidc.client_id",
  OIDC_SCOPE: "oidc.scope",
  OIDC_GRANT_TYPE: "oidc.grant_type",
} as const;

/**
 * Operation types for categorizing spans
 */
export const OperationType = {
  AUTHENTICATION: "authentication",
  AUTHORIZATION: "authorization",
  USER_MANAGEMENT: "user_management",
  SESSION_MANAGEMENT: "session_management",
  OIDC: "oidc",
  DATABASE: "database",
  EXTERNAL_API: "external_api",
  EMAIL: "email",
} as const;
