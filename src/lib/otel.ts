/**
 * OpenTelemetry (OTEL) Tracing
 * Implements SPEC.md §10.2 - Distributed tracing and observability
 * 
 * Uses @effect/opentelemetry for proper OpenTelemetry integration.
 * Traces are exported to Axiom via OTLP HTTP.
 * 
 * @see https://effect.website/docs/observability/tracing
 */
import { Effect, Layer } from "effect";
import { NodeSdk } from "@effect/opentelemetry";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

// =============================================================================
// Types
// =============================================================================

export interface SpanContext {
	readonly traceId: string;
	readonly spanId: string;
}

// =============================================================================
// Trace ID for External Integrations
// =============================================================================

/**
 * Current trace ID for correlation with external systems (PostHog)
 * Updated by the tracer when spans are created
 */
let currentTraceId: string | undefined;

/**
 * Get current trace ID for external integrations (PostHog, error tracking)
 */
export function getCurrentTraceId(): string | undefined {
	return currentTraceId;
}

/**
 * Generate a random trace ID (W3C Trace Context format - 32 hex chars)
 */
function generateTraceId(): string {
	const chars = "0123456789abcdef";
	let id = "";
	for (let i = 0; i < 32; i++) {
		id += chars[Math.floor(Math.random() * chars.length)];
	}
	return id;
}

/**
 * Start a new trace (call at request boundary)
 */
export function startTrace(): string {
	currentTraceId = generateTraceId();
	return currentTraceId;
}

/**
 * Clear trace context
 */
export function clearTrace(): void {
	currentTraceId = undefined;
}

// =============================================================================
// OpenTelemetry SDK Configuration
// =============================================================================

/**
 * Create the NodeSdk layer for OpenTelemetry
 * Exports traces to Axiom via OTLP HTTP
 */
export function createTracingLayer(serviceName: string = "ewf-id") {
	// Get Axiom configuration from environment
	const axiomToken = typeof process !== "undefined" ? process.env?.AXIOM_TOKEN : undefined;
	const axiomDataset = typeof process !== "undefined" ? process.env?.AXIOM_DATASET : "traces";

	// Create OTLP exporter for Axiom
	const exporter = new OTLPTraceExporter({
		url: "https://api.axiom.co/v1/traces",
		headers: axiomToken ? {
			"Authorization": `Bearer ${axiomToken}`,
			"X-Axiom-Dataset": axiomDataset,
		} : {},
	});

	return NodeSdk.layer(() => ({
		resource: { serviceName },
		spanProcessor: new BatchSpanProcessor(exporter),
	}));
}

/**
 * Default tracing layer for EWF-ID
 */
export const TracingLive = createTracingLayer("ewf-id");

// =============================================================================
// Effect Tracing Helpers
// =============================================================================

/**
 * Wrap an effect with tracing and automatic error annotation
 * 
 * @example
 * ```ts
 * const login = pipe(
 *   authenticateUser(email, password),
 *   withTrace("auth.login", { 
 *     "user.email": email,
 *     "auth.method": "password" 
 *   })
 * );
 * ```
 */
export function withTrace<A, E, R>(
	operation: string,
	context?: Record<string, string | number | boolean>
) {
	return (effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> => {
		// Start with the effect wrapped in a span
		let traced = Effect.withSpan(effect, operation);

		// Add context annotations if provided
		if (context) {
			traced = Effect.tap(traced, () =>
				Effect.forEach(
					Object.entries(context),
					([key, value]) => Effect.annotateCurrentSpan(key, value),
					{ discard: true }
				)
			);
		}

		return traced;
	};
}

/**
 * Add diagnostic context to the current span
 * Use this to add information that helps debug failures
 * 
 * @example
 * ```ts
 * pipe(
 *   fetchUser(userId),
 *   Effect.tap((user) => annotate({
 *     "user.id": user.id,
 *     "user.role": user.role,
 *     "user.school": user.school,
 *   }))
 * )
 * ```
 */
export function annotate(
	context: Record<string, string | number | boolean>
): Effect.Effect<void> {
	return Effect.forEach(
		Object.entries(context),
		([key, value]) => Effect.annotateCurrentSpan(key, value),
		{ discard: true }
	);
}

/**
 * Record an error in the current span with full context
 * 
 * @example
 * ```ts
 * pipe(
 *   someOperation,
 *   Effect.catchAll((error) => 
 *     pipe(
 *       recordError(error, { "operation": "someOperation" }),
 *       Effect.flatMap(() => Effect.fail(error))
 *     )
 *   )
 * )
 * ```
 */
export function recordError(
	error: Error | string,
	context?: Record<string, string | number | boolean>
): Effect.Effect<void> {
	const errorObj = typeof error === "string" ? new Error(error) : error;

	const annotations: [string, string | number | boolean][] = [
		["error.occurred", true],
		["error.type", errorObj.name],
		["error.message", errorObj.message],
	];

	if (errorObj.stack) {
		annotations.push(["error.stack", errorObj.stack.slice(0, 1000)]);
	}

	if (context) {
		annotations.push(...Object.entries(context));
	}

	return Effect.forEach(
		annotations,
		([key, value]) => Effect.annotateCurrentSpan(key, value),
		{ discard: true }
	);
}

/**
 * Log a message as a span event
 * These appear in the span's events array in tracing backends
 */
export function logEvent(message: string): Effect.Effect<void> {
	return Effect.log(message);
}

// =============================================================================
// Traced Operations for Common Patterns
// =============================================================================

/**
 * Trace an authentication operation
 */
export function traceAuth<A, E, R>(
	method: "password" | "oidc" | "passkey" | "2fa",
	email: string,
	effect: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R> {
	return withTrace(`auth.${method}`, {
		"auth.method": method,
		"user.email_domain": email.split("@")[1] ?? "unknown",
	})(effect);
}

/**
 * Trace an admin operation
 */
export function traceAdmin<A, E, R>(
	action: string,
	targetUserId: string | undefined,
	effect: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R> {
	const context: Record<string, string | number | boolean> = {
		"admin.action": action,
	};
	if (targetUserId) {
		context["admin.target_user"] = targetUserId;
	}
	return withTrace(`admin.${action}`, context)(effect);
}

/**
 * Trace an OIDC operation
 */
export function traceOIDC<A, E, R>(
	flow: "authorize" | "token" | "userinfo" | "consent",
	clientId: string,
	effect: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R> {
	return withTrace(`oidc.${flow}`, {
		"oidc.flow": flow,
		"oidc.client_id": clientId,
	})(effect);
}

/**
 * Trace a database operation
 */
export function traceDB<A, E, R>(
	operation: string,
	table: string,
	effect: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R> {
	return withTrace(`db.${operation}`, {
		"db.operation": operation,
		"db.table": table,
	})(effect);
}

// =============================================================================
// Legacy Support (for non-Effect code)
// =============================================================================

/**
 * Trace an async function (for non-Effect code)
 * Logs errors to console and updates trace ID
 */
export async function tracedAsync<T>(
	operation: string,
	fn: () => T | Promise<T>,
	context?: Record<string, string | number | boolean>
): Promise<T> {
	const traceId = currentTraceId ?? generateTraceId();
	currentTraceId = traceId;
	const startTime = Date.now();

	try {
		const result = await fn();
		return result;
	} catch (error) {
		const errorObj = error instanceof Error ? error : new Error(String(error));

		// Log error with trace context
		console.error(`[TRACE ERROR] ${operation}`, {
			traceId,
			error: {
				type: errorObj.name,
				message: errorObj.message,
				stack: errorObj.stack,
			},
			context,
			durationMs: Date.now() - startTime,
		});

		throw error;
	}
}

// =============================================================================
// Re-exports
// =============================================================================

export { Effect, Layer };
