/**
 * EWF-ID OpenTelemetry Integration
 * SPEC.md Phase 7 - Task 7.1: OpenTelemetry Setup
 * 
 * Provides distributed tracing with Axiom export
 * This module sets up OTEL for server-side tracing
 */
import env from "#env";

// Types for OTEL (will be populated when @opentelemetry packages are installed)
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

// Placeholder for trace context - will be replaced by actual OTEL implementation
let activeSpan: Span | null = null;

/**
 * Get current trace context
 * When OTEL is configured, this extracts from the active span
 */
export function getTraceContext(): SpanContext | null {
  // TODO: When OTEL is implemented:
  // import { trace } from '@opentelemetry/api'
  // const span = trace.getActiveSpan()
  // if (!span) return null
  // const ctx = span.spanContext()
  // return { traceId: ctx.traceId, spanId: ctx.spanId }
  
  return null;
}

/**
 * Create a child span for tracing an operation
 */
export function createSpan(name: string, attributes?: Record<string, string | number | boolean>): Span {
  // TODO: When OTEL is implemented:
  // import { trace } from '@opentelemetry/api'
  // const tracer = trace.getTracer('ewf-id')
  // const span = tracer.startSpan(name)
  // if (attributes) {
  //   Object.entries(attributes).forEach(([k, v]) => span.setAttribute(k, v))
  // }
  // return span

  // Placeholder implementation
  return {
    setAttribute: () => {},
    setStatus: () => {},
    recordException: () => {},
    end: () => {},
  };
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
    span.setStatus({ code: 2, message: error instanceof Error ? error.message : "Unknown error" }); // ERROR
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
 * Call this at server startup
 */
export async function initOpenTelemetry(): Promise<void> {
  if (env.NODE_ENV !== "production") {
    console.debug("[OTEL] Skipping initialization in non-production environment");
    return;
  }

  if (!env.AXIOM_TOKEN || !env.AXIOM_DATASET) {
    console.debug("[OTEL] Missing Axiom configuration, skipping initialization");
    return;
  }

  // TODO: Full OTEL implementation when packages are installed:
  /*
  import { NodeSDK } from '@opentelemetry/sdk-node'
  import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
  import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
  import { Resource } from '@opentelemetry/resources'
  import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'

  const traceExporter = new OTLPTraceExporter({
    url: 'https://api.axiom.co/v1/traces',
    headers: {
      'Authorization': `Bearer ${env.AXIOM_TOKEN}`,
      'X-Axiom-Dataset': env.AXIOM_DATASET,
    },
  })

  const sdk = new NodeSDK({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: 'ewf-id',
      [SEMRESATTRS_SERVICE_VERSION]: '1.0.0',
    }),
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  })

  sdk.start()
  
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('[OTEL] SDK shut down successfully'))
      .catch((error) => console.error('[OTEL] Error shutting down SDK', error))
      .finally(() => process.exit(0))
  })
  */

  console.debug("[OTEL] Ready for configuration (packages not yet installed)");
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
