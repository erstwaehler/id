// frontend telemery hooks/func(void)'s and pass in/out to server or effect.ts

import {
  type Attributes,
  context,
  type Span,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { useCallback, useRef } from "react";

/**
 * Control object for a pyramid trace span
 * Allows the client to start a span, add events/attributes during execution,
 * and close it after server operations complete
 */
export interface TraceControl {
  /**
   * Get trace context headers to send to server
   * These headers (traceparent, tracestate) allow the server to create child spans
   */
  getHeaders: () => Record<string, string>;

  /**
   * Add a point-in-time event to the span
   * Useful for marking when specific actions occur (e.g., "user_clicked_button")
   */
  addEvent: (name: string, attributes?: Attributes) => void;

  /**
   * Set or update attributes on the span
   * Attributes are key-value metadata attached to the span
   */
  setAttribute: (key: string, value: string | number | boolean) => void;

  /**
   * Set multiple attributes at once
   */
  setAttributes: (attributes: Attributes) => void;

  /**
   * Successfully end the span with optional final attributes
   */
  end: (attributes?: Attributes) => void;

  /**
   * End the span with an error
   * Records the exception and marks the span as failed
   */
  error: (error: Error | unknown, attributes?: Attributes) => void;

  /**
   * Get the trace ID for this span
   * Useful for correlation or debugging
   */
  getTraceId: () => string | undefined;

  /**
   * Get the span ID for this span
   */
  getSpanId: () => string | undefined;
}

/**
 * Hook for creating pyramid trace spans on the client
 *
 * Pyramid tracing means the client span wraps server operations:
 *
 * ```
 * Client Span Start
 *   ├─ User interaction
 *   ├─ Server Function (child span)
 *   │   └─ Effect operations (child spans)
 *   ├─ Response received
 *   └─ UI updated
 * Client Span End
 * ```
 *
 * This gives you end-to-end visibility of user actions through the entire stack.
 *
 * @example
 * ```tsx
 * function CheckoutButton() {
 *   const { startTrace } = useTrace();
 *
 *   const handleCheckout = async () => {
 *     const trace = startTrace('user.checkout.flow');
 *
 *     try {
 *       trace.addEvent('button_clicked', {
 *         cart_items: 3
 *       });
 *
 *       // Server call with trace headers
 *       const result = await fetch('/api/checkout', {
 *         headers: {
 *           ...trace.getHeaders(),
 *           'Content-Type': 'application/json'
 *         },
 *         body: JSON.stringify(data)
 *       });
 *
 *       trace.addEvent('response_received', {
 *         order_id: result.orderId
 *       });
 *
 *       // End successfully
 *       trace.end({
 *         outcome: 'success',
 *         order_total: result.total
 *       });
 *
 *     } catch (error) {
 *       trace.error(error);
 *     }
 *   };
 * }
 * ```
 */
export function useTrace() {
  const tracer = trace.getTracer("frontend");
  const propagator = new W3CTraceContextPropagator();

  // Keep track of active spans to prevent memory leaks
  const activeSpansRef = useRef<Set<Span>>(new Set());

  /**
   * Start a new pyramid trace span
   *
   * @param name - Human-readable name for the span (e.g., "user.checkout.flow")
   * @param initialAttributes - Optional attributes to set immediately
   * @returns TraceControl object for managing the span lifecycle
   */
  const startTrace = useCallback(
    (name: string, initialAttributes?: Attributes): TraceControl => {
      const span = tracer.startSpan(name, {
        attributes: {
          "span.kind": "client",
          component: "frontend",
          ...initialAttributes,
        },
      });

      // Create context with this span
      const spanContext = trace.setSpan(context.active(), span);

      // Track active span
      activeSpansRef.current.add(span);

      const control: TraceControl = {
        getHeaders: () => {
          const headers: Record<string, string> = {};
          propagator.inject(spanContext, headers, {
            set: (carrier, key, value) => {
              carrier[key] = value;
            },
          });
          return headers;
        },

        addEvent: (name: string, attributes?: Attributes) => {
          span.addEvent(name, attributes);
        },

        setAttribute: (key: string, value: string | number | boolean) => {
          span.setAttribute(key, value);
        },

        setAttributes: (attributes: Attributes) => {
          span.setAttributes(attributes);
        },

        end: (attributes?: Attributes) => {
          if (attributes) {
            span.setAttributes(attributes);
          }
          span.setStatus({ code: SpanStatusCode.OK });
          span.end();
          activeSpansRef.current.delete(span);
        },

        error: (error: Error | unknown, attributes?: Attributes) => {
          if (attributes) {
            span.setAttributes(attributes);
          }

          // Record the exception
          if (error instanceof Error) {
            span.recordException(error);
            span.setAttribute("error.message", error.message);
            span.setAttribute("error.name", error.name);
            if (error.stack) {
              span.setAttribute("error.stack", error.stack);
            }
          } else {
            span.recordException(new Error(String(error)));
            span.setAttribute("error.message", String(error));
          }

          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : String(error),
          });
          span.end();
          activeSpansRef.current.delete(span);
        },

        getTraceId: () => {
          const spanContext = span.spanContext();
          return spanContext.traceId;
        },

        getSpanId: () => {
          const spanContext = span.spanContext();
          return spanContext.spanId;
        },
      };

      return control;
    },
    [tracer, propagator],
  );

  /**
   * Convenience wrapper for tracing async operations
   * Automatically handles errors and span lifecycle
   *
   * @example
   * ```tsx
   * const { traceAsync } = useTrace();
   *
   * await traceAsync('data.fetch', async (trace) => {
   *   trace.addEvent('fetch_started');
   *   const data = await fetchData();
   *   trace.setAttribute('records_count', data.length);
   *   return data;
   * });
   * ```
   */
  const traceAsync = useCallback(
    async <T>(
      name: string,
      fn: (trace: TraceControl) => Promise<T>,
      initialAttributes?: Attributes,
    ): Promise<T> => {
      const trace = startTrace(name, initialAttributes);

      try {
        const result = await fn(trace);
        trace.end();
        return result;
      } catch (error) {
        trace.error(error);
        throw error;
      }
    },
    [startTrace],
  );

  /**
   * Convenience wrapper for tracing sync operations
   *
   * @example
   * ```tsx
   * const { traceSync } = useTrace();
   *
   * const result = traceSync('calculation', (trace) => {
   *   trace.addEvent('calculation_started');
   *   const result = expensiveCalculation();
   *   trace.setAttribute('result', result);
   *   return result;
   * });
   * ```
   */
  const traceSync = useCallback(
    <T>(
      name: string,
      fn: (trace: TraceControl) => T,
      initialAttributes?: Attributes,
    ): T => {
      const trace = startTrace(name, initialAttributes);

      try {
        const result = fn(trace);
        trace.end();
        return result;
      } catch (error) {
        trace.error(error);
        throw error;
      }
    },
    [startTrace],
  );

  return {
    startTrace,
    traceAsync,
    traceSync,
  };
}

/**
 * Helper to extract trace headers from a TraceControl and merge with other headers
 * Useful for fetch calls
 *
 * @example
 * ```tsx
 * const trace = startTrace('api.call');
 *
 * await fetch('/api/data', {
 *   headers: withTraceHeaders(trace, {
 *     'Content-Type': 'application/json'
 *   })
 * });
 * ```
 */
export function withTraceHeaders(
  trace: TraceControl,
  headers?: HeadersInit,
): Record<string, string> {
  const traceHeaders = trace.getHeaders();

  if (!headers) {
    return traceHeaders;
  }

  // Convert HeadersInit to Record<string, string>
  let headerRecord: Record<string, string> = {};

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      headerRecord[key] = value;
    });
  } else if (Array.isArray(headers)) {
    headers.forEach(([key, value]) => {
      headerRecord[key] = value;
    });
  } else {
    headerRecord = { ...headers };
  }

  return {
    ...headerRecord,
    ...traceHeaders,
  };
}
