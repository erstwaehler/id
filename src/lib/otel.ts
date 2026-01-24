/**
 * OpenTelemetry (OTEL) Tracing
 * Implements SPEC.md §10.2 - Distributed tracing and observability
 * 
 * Uses Effect's built-in tracing capabilities for diagnostic data collection.
 * Focus on capturing actionable information about failures and operations.
 * 
 * @see https://effect.website/docs/observability/tracing
 */
import { Effect, Tracer, Layer, Cause, pipe } from "effect";

// =============================================================================
// Types
// =============================================================================

export interface SpanContext {
	readonly traceId: string;
	readonly spanId: string;
}

export interface DiagnosticData {
	traceId: string;
	spanId: string;
	operation: string;
	status: "ok" | "error";
	durationMs: number;
	timestamp: string;
	error?: {
		type: string;
		message: string;
		stack?: string;
		cause?: string;
	};
	context: Record<string, unknown>;
}

// =============================================================================
// Trace ID Management
// =============================================================================

let currentTraceId: string | undefined;

function generateTraceId(): string {
	const chars = "0123456789abcdef";
	let id = "";
	for (let i = 0; i < 32; i++) {
		id += chars[Math.floor(Math.random() * chars.length)];
	}
	return id;
}

function generateSpanId(): string {
	const chars = "0123456789abcdef";
	let id = "";
	for (let i = 0; i < 16; i++) {
		id += chars[Math.floor(Math.random() * chars.length)];
	}
	return id;
}

// =============================================================================
// Diagnostic Data Collection
// =============================================================================

/** Store for failed spans - used for error reporting */
const failedSpans: DiagnosticData[] = [];
const MAX_FAILED_SPANS = 100;

/**
 * Record a failed span for diagnostic purposes
 */
function recordFailedSpan(data: DiagnosticData): void {
	failedSpans.push(data);
	if (failedSpans.length > MAX_FAILED_SPANS) {
		failedSpans.shift();
	}
	
	// Always log errors for visibility
	console.error(`[TRACE ERROR] ${data.operation}`, {
		traceId: data.traceId,
		error: data.error,
		context: data.context,
		durationMs: data.durationMs,
	});
}

/**
 * Get recent failed spans for debugging
 */
export function getRecentFailures(): DiagnosticData[] {
	return [...failedSpans];
}

/**
 * Clear failure history
 */
export function clearFailures(): void {
	failedSpans.length = 0;
}

// =============================================================================
// Custom Tracer for Axiom/Error Tracking
// =============================================================================

/**
 * Production tracer that captures diagnostic data
 * - Logs errors with full context
 * - Stores failed spans for debugging
 * - Sends to Axiom in production
 */
const DiagnosticTracer = Tracer.make({
	span: (name, parent, context, links, startTime, kind) => {
		const traceId = parent._tag === "Some" 
			? parent.value.traceId 
			: generateTraceId();
		const spanId = generateSpanId();

		currentTraceId = traceId;

		const attributes = new Map<string, unknown>();

		return {
			_tag: "Span",
			name,
			spanId,
			traceId,
			parent,
			context,
			links,
			kind,
			status: { _tag: "Started", startTime },
			
			attribute: (key: string, value: unknown) => {
				attributes.set(key, value);
			},
			
			event: (eventName: string, _time: bigint, attrs?: Record<string, unknown>) => {
				// Record significant events (not just debug)
				if (eventName === "error" || eventName === "exception") {
					console.error(`[TRACE EVENT] ${name}/${eventName}`, attrs);
				}
			},
			
			end: (endTime: bigint, exit) => {
				const durationMs = Number(endTime - startTime) / 1_000_000;
				const isError = exit._tag === "Failure";

				const diagnosticData: DiagnosticData = {
					traceId,
					spanId,
					operation: name,
					status: isError ? "error" : "ok",
					durationMs,
					timestamp: new Date().toISOString(),
					context: Object.fromEntries(attributes),
				};

				// Extract error information from the Cause
				if (isError) {
					const cause = exit.cause;
					const defects = Cause.defects(cause);
					const failures = Cause.failures(cause);
					
					if (defects.length > 0) {
						const defect = defects[0];
						diagnosticData.error = {
							type: defect instanceof Error ? defect.name : "Defect",
							message: defect instanceof Error ? defect.message : String(defect),
							stack: defect instanceof Error ? defect.stack : undefined,
						};
					} else if (failures.length > 0) {
						const failure = failures[0];
						diagnosticData.error = {
							type: failure instanceof Error ? failure.name : typeof failure,
							message: failure instanceof Error ? failure.message : String(failure),
							stack: failure instanceof Error ? failure.stack : undefined,
						};
					} else {
						diagnosticData.error = {
							type: "UnknownError",
							message: Cause.pretty(cause),
						};
					}
					
					recordFailedSpan(diagnosticData);
				}

				// In production, send to Axiom
				// Only send errors or slow operations (>1s) to reduce noise
				if (isError || durationMs > 1000) {
					sendToAxiom(diagnosticData);
				}
			},
		};
	},
	context: (f, _fiber) => f(),
});

/**
 * Send diagnostic data to Axiom
 */
async function sendToAxiom(data: DiagnosticData): Promise<void> {
	const axiomToken = typeof process !== "undefined" ? process.env?.AXIOM_TOKEN : undefined;
	const axiomDataset = typeof process !== "undefined" ? process.env?.AXIOM_DATASET : undefined;
	
	if (!axiomToken || !axiomDataset) {
		return; // Axiom not configured
	}

	try {
		await fetch("https://api.axiom.co/v1/datasets/" + axiomDataset + "/ingest", {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${axiomToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify([{
				_time: data.timestamp,
				traceId: data.traceId,
				spanId: data.spanId,
				operation: data.operation,
				status: data.status,
				durationMs: data.durationMs,
				error: data.error,
				context: data.context,
			}]),
		});
	} catch {
		// Silently fail - don't break the app for telemetry
	}
}

export const DiagnosticTracerLayer = Layer.succeed(Tracer.Tracer, DiagnosticTracer);

// =============================================================================
// Effect Tracing Helpers with Diagnostic Focus
// =============================================================================

/**
 * Wrap an effect with tracing and automatic error annotation
 * 
 * @example
 * ```ts
 * const login = pipe(
 *   authenticateUser(email, password),
 *   withTrace("auth.login", { 
 *     email,
 *     method: "password" 
 *   })
 * );
 * ```
 */
export function withTrace<A, E, R>(
	operation: string,
	context?: Record<string, string | number | boolean>
) {
	return (effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> => {
		return pipe(
			effect,
			// Add context annotations before the operation
			Effect.tap(() => {
				if (context) {
					return Effect.forEach(
						Object.entries(context),
						([key, value]) => Effect.annotateCurrentSpan(key, value),
						{ discard: true }
					);
				}
				return Effect.void;
			}),
			// Wrap with span
			Effect.withSpan(operation),
			// On error, add error details to span
			Effect.tapErrorCause((cause) => 
				Effect.forEach(
					[
						["error.type", Cause.isFailType(cause) ? "Failure" : "Defect"],
						["error.message", Cause.pretty(cause).slice(0, 500)],
					] as const,
					([key, value]) => Effect.annotateCurrentSpan(key, value),
					{ discard: true }
				)
			)
		);
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
 */
export function recordError(
	error: Error | string,
	context?: Record<string, string | number | boolean>
): Effect.Effect<void> {
	const errorObj = typeof error === "string" ? new Error(error) : error;
	
	return Effect.forEach(
		[
			["error.occurred", true],
			["error.type", errorObj.name],
			["error.message", errorObj.message],
			...(errorObj.stack ? [["error.stack", errorObj.stack.slice(0, 1000)] as const] : []),
			...Object.entries(context ?? {}),
		] as const,
		([key, value]) => Effect.annotateCurrentSpan(key, value),
		{ discard: true }
	);
}

// =============================================================================
// External Integration
// =============================================================================

/**
 * Get current trace ID for external systems (PostHog, Sentry)
 */
export function getCurrentTraceId(): string | undefined {
	return currentTraceId;
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

/**
 * Get diagnostic info for error reporting
 */
export function getDiagnosticInfo(): { traceId: string | undefined; recentFailures: number } {
	return {
		traceId: currentTraceId,
		recentFailures: failedSpans.length,
	};
}

// =============================================================================
// Legacy Support
// =============================================================================

/**
 * Trace an async function (for non-Effect code)
 */
export async function tracedAsync<T>(
	operation: string,
	fn: () => T | Promise<T>,
	context?: Record<string, string | number | boolean>
): Promise<T> {
	const traceId = currentTraceId ?? generateTraceId();
	currentTraceId = traceId;
	const spanId = generateSpanId();
	const startTime = Date.now();

	try {
		const result = await fn();
		return result;
	} catch (error) {
		const errorObj = error instanceof Error ? error : new Error(String(error));
		
		recordFailedSpan({
			traceId,
			spanId,
			operation,
			status: "error",
			durationMs: Date.now() - startTime,
			timestamp: new Date().toISOString(),
			error: {
				type: errorObj.name,
				message: errorObj.message,
				stack: errorObj.stack,
			},
			context: context ?? {},
		});

		throw error;
	}
}

// Re-export Effect utilities
export { Effect, Tracer };
