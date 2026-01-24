/**
 * OpenTelemetry (OTEL) Configuration
 * Implements SPEC.md §10.2 - Distributed tracing and observability
 */
import { Effect, Context, Layer, pipe } from "effect";

// =============================================================================
// Types
// =============================================================================

export interface Span {
	readonly traceId: string;
	readonly spanId: string;
	readonly name: string;
	readonly startTime: number;
	setAttribute(key: string, value: string | number | boolean): void;
	recordException(error: Error): void;
	end(): void;
}

export interface OtelService {
	/**
	 * Get the current trace ID for correlation
	 */
	readonly getCurrentTraceId: () => string | undefined;

	/**
	 * Start a new span for tracing
	 */
	readonly startSpan: (name: string, attributes?: Record<string, string | number | boolean>) => Span;

	/**
	 * Execute an effect within a traced span
	 */
	readonly withSpan: <A, E, R>(
		name: string,
		effect: Effect.Effect<A, E, R>,
		attributes?: Record<string, string | number | boolean>
	) => Effect.Effect<A, E, R>;

	/**
	 * Send trace data to Axiom
	 */
	readonly flush: () => Promise<void>;
}

// =============================================================================
// Service Tag
// =============================================================================

export class Otel extends Context.Tag("Otel")<Otel, OtelService>() {}

// =============================================================================
// Implementation
// =============================================================================

// Simple trace ID storage (would use AsyncLocalStorage in Node.js)
let currentTraceId: string | undefined;

/**
 * Generate a random trace ID (simplified W3C Trace Context format)
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
 * Generate a random span ID
 */
function generateSpanId(): string {
	const chars = "0123456789abcdef";
	let id = "";
	for (let i = 0; i < 16; i++) {
		id += chars[Math.floor(Math.random() * chars.length)];
	}
	return id;
}

/**
 * Create a span object
 */
function createSpan(name: string, traceId: string): Span {
	const spanId = generateSpanId();
	const startTime = Date.now();
	const attributes: Record<string, string | number | boolean> = {};
	let exception: Error | undefined;

	return {
		traceId,
		spanId,
		name,
		startTime,
		setAttribute(key: string, value: string | number | boolean) {
			attributes[key] = value;
		},
		recordException(error: Error) {
			exception = error;
			attributes["exception.type"] = error.name;
			attributes["exception.message"] = error.message;
		},
		end() {
			const endTime = Date.now();
			const duration = endTime - startTime;

			// Log span data (in production, this would be sent to Axiom)
			if (typeof window === "undefined") {
				// Server-side: log to console for development, send to Axiom in production
				const spanData = {
					traceId,
					spanId,
					name,
					startTime: new Date(startTime).toISOString(),
					endTime: new Date(endTime).toISOString(),
					durationMs: duration,
					attributes,
					status: exception ? "ERROR" : "OK",
				};

				// In development, log to console
				if (process.env.NODE_ENV === "development") {
					console.log("[OTEL Span]", JSON.stringify(spanData, null, 2));
				}

				// TODO: In production, send to Axiom via OTLP
				// await sendToAxiom(spanData);
			}
		},
	};
}

/**
 * Live implementation of the OTEL service
 */
const OtelLive: OtelService = {
	getCurrentTraceId: () => currentTraceId,

	startSpan: (name: string, attributes?: Record<string, string | number | boolean>) => {
		const traceId = currentTraceId ?? generateTraceId();
		if (!currentTraceId) {
			currentTraceId = traceId;
		}

		const span = createSpan(name, traceId);

		if (attributes) {
			for (const [key, value] of Object.entries(attributes)) {
				span.setAttribute(key, value);
			}
		}

		return span;
	},

	withSpan: <A, E, R>(
		name: string,
		effect: Effect.Effect<A, E, R>,
		attributes?: Record<string, string | number | boolean>
	): Effect.Effect<A, E, R> => {
		return pipe(
			Effect.sync(() => {
				const traceId = currentTraceId ?? generateTraceId();
				if (!currentTraceId) {
					currentTraceId = traceId;
				}
				return createSpan(name, traceId);
			}),
			Effect.flatMap((span) => {
				if (attributes) {
					for (const [key, value] of Object.entries(attributes)) {
						span.setAttribute(key, value);
					}
				}

				return pipe(
					effect,
					Effect.tap(() => Effect.sync(() => span.end())),
					Effect.tapError((error) =>
						Effect.sync(() => {
							if (error instanceof Error) {
								span.recordException(error);
							}
							span.end();
						})
					)
				);
			})
		);
	},

	flush: async () => {
		// Clear current trace context
		currentTraceId = undefined;
		// In production, this would flush any pending spans to Axiom
	},
};

// =============================================================================
// Layer
// =============================================================================

export const OtelLiveLayer = Layer.succeed(Otel, OtelLive);

// =============================================================================
// Helper Functions (for use outside Effect context)
// =============================================================================

/**
 * Get current trace ID for PostHog exception tracking
 */
export function getCurrentTraceId(): string | undefined {
	return currentTraceId;
}

/**
 * Start a new trace context
 */
export function startTrace(): string {
	currentTraceId = generateTraceId();
	return currentTraceId;
}

/**
 * Clear the current trace context
 */
export function clearTrace(): void {
	currentTraceId = undefined;
}

/**
 * Simple traced function wrapper for non-Effect code
 */
export function traced<T>(
	name: string,
	fn: () => T | Promise<T>,
	attributes?: Record<string, string | number | boolean>
): Promise<T> {
	const span = OtelLive.startSpan(name, attributes);

	try {
		const result = fn();

		if (result instanceof Promise) {
			return result
				.then((value) => {
					span.end();
					return value;
				})
				.catch((error) => {
					span.recordException(error instanceof Error ? error : new Error(String(error)));
					span.end();
					throw error;
				});
		}

		span.end();
		return Promise.resolve(result);
	} catch (error) {
		span.recordException(error instanceof Error ? error : new Error(String(error)));
		span.end();
		throw error;
	}
}
