// backend telemery hooks/func(void)'s and pass in/out to frontend or effect.ts

import {
  trace,
  context,
  type Span,
  type Context,
  SpanStatusCode,
  type Attributes,
  propagation,
} from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { Effect } from "effect";

/**
 * Control object for server-side tracing
 * Similar to frontend TraceControl but with server-specific features
 */
export interface ServerTraceControl {
  /**
   * Extract parent trace context from incoming request headers
   * This links the server span to the client span that initiated the request
   */
  extractFromHeaders: (headers: Headers | Record<string, string>) => void;

  /**
   * Get the OpenTelemetry context for this span
   * Useful for passing to Effect.ts or other instrumented code
   */
  getContext: () => Context;

  /**
   * Run a function with this span's context active
   * The function will be executed in the context of this span,
   * allowing child spans to be automatically linked
   */
  withContext: <T>(fn: () => T) => T;

  /**
   * Run an async function with this span's context active
   */
  withContextAsync: <T>(fn: () => Promise<T>) => Promise<T>;

  /**
   * Run an Effect with this span's context
   * Automatically propagates trace context to Effect operations
   */
  withEffect: <A, E, R>(
    effect: Effect.Effect<A, E, R>,
  ) => Effect.Effect<A, E, R>;

  /**
   * Add a point-in-time event to the span
   */
  addEvent: (name: string, attributes?: Attributes) => void;

  /**
   * Set a single attribute on the span
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
   */
  error: (error: Error | unknown, attributes?: Attributes) => void;

  /**
   * Get the trace ID for correlation
   */
  getTraceId: () => string | undefined;

  /**
   * Get the span ID
   */
  getSpanId: () => string | undefined;

  /**
   * Get headers to propagate trace context to downstream services
   */
  getHeaders: () => Record<string, string>;
}

/**
 * Hook for server-side tracing
 *
 * Provides pyramid tracing on the server with automatic context extraction
 * and propagation to Effect.ts
 *
 * @example
 * ```ts
 * export async function authHandler(request: Request) {
 *   const { startTrace } = useServerTrace()
 *   const trace = startTrace('auth.login')
 *
 *   // Link to client span
 *   trace.extractFromHeaders(request.headers)
 *
 *   try {
 *     trace.setAttribute('user.email', email)
 *
 *     const user = await validateUser(email, password)
 *
 *     // Run Effect with trace context
 *     await trace.withContextAsync(() =>
 *       Effect.runPromise(
 *         createSession(user).pipe(
 *           Effect.withSpan('create.session')
 *         )
 *       )
 *     )
 *
 *     trace.end({ outcome: 'success' })
 *     return user
 *   } catch (error) {
 *     trace.error(error)
 *     throw error
 *   }
 * }
 * ```
 */
export function useServerTrace() {
  const tracer = trace.getTracer("backend");
  const propagator = new W3CTraceContextPropagator();

  /**
   * Start a new server trace span
   */
  const startTrace = (
    name: string,
    initialAttributes?: Attributes,
  ): ServerTraceControl => {
    let span: Span;
    let spanContext: Context = context.active();

    // We'll start the span lazily after extractFromHeaders is called
    // or immediately if not using headers
    let isStarted = false;

    const ensureStarted = () => {
      if (!isStarted) {
        span = tracer.startSpan(
          name,
          {
            attributes: {
              "span.kind": "server",
              component: "backend",
              ...initialAttributes,
            },
          },
          spanContext,
        );
        spanContext = trace.setSpan(spanContext, span);
        isStarted = true;
      }
    };

    // Start immediately if no headers will be extracted
    ensureStarted();

    const control: ServerTraceControl = {
      extractFromHeaders: (headers: Headers | Record<string, string>) => {
        // Extract parent context from headers
        const carrier =
          headers instanceof Headers
            ? {
                get: (key: string) => headers.get(key) ?? undefined,
                keys: () => Array.from(headers.keys()),
              }
            : {
                get: (key: string) => headers[key],
                keys: () => Object.keys(headers),
              };

        const parentContext = propagation.extract(context.active(), carrier, {
          get: (c, key) => c.get(key),
          keys: (c) => c.keys(),
        });

        spanContext = parentContext;

        // Now start the span with the extracted parent context
        if (!isStarted) {
          span = tracer.startSpan(
            name,
            {
              attributes: {
                "span.kind": "server",
                component: "backend",
                ...initialAttributes,
              },
            },
            parentContext,
          );
          spanContext = trace.setSpan(parentContext, span);
          isStarted = true;
        }
      },

      getContext: () => {
        ensureStarted();
        return spanContext;
      },

      withContext: <T>(fn: () => T): T => {
        ensureStarted();
        return context.with(spanContext, fn);
      },

      withContextAsync: async <T>(fn: () => Promise<T>): Promise<T> => {
        ensureStarted();
        return context.with(spanContext, fn);
      },

      withEffect: <A, E, R>(
        effect: Effect.Effect<A, E, R>,
      ): Effect.Effect<A, E, R> => {
        ensureStarted();
        // Effect.ts will automatically use the active OpenTelemetry context
        // We just need to ensure our context is active when the Effect runs
        return Effect.sync(() => spanContext).pipe(
          Effect.flatMap(() => effect),
        );
      },

      addEvent: (name: string, attributes?: Attributes) => {
        ensureStarted();
        span.addEvent(name, attributes);
      },

      setAttribute: (key: string, value: string | number | boolean) => {
        ensureStarted();
        span.setAttribute(key, value);
      },

      setAttributes: (attributes: Attributes) => {
        ensureStarted();
        span.setAttributes(attributes);
      },

      end: (attributes?: Attributes) => {
        ensureStarted();
        if (attributes) {
          span.setAttributes(attributes);
        }
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
      },

      error: (error: Error | unknown, attributes?: Attributes) => {
        ensureStarted();
        if (attributes) {
          span.setAttributes(attributes);
        }

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
      },

      getTraceId: () => {
        ensureStarted();
        return span.spanContext().traceId;
      },

      getSpanId: () => {
        ensureStarted();
        return span.spanContext().spanId;
      },

      getHeaders: () => {
        ensureStarted();
        const headers: Record<string, string> = {};
        propagator.inject(spanContext, headers, {
          set: (carrier, key, value) => {
            carrier[key] = value;
          },
        });
        return headers;
      },
    };

    return control;
  };

  /**
   * Convenience wrapper for tracing async server operations
   * Automatically handles span lifecycle
   */
  const traceServerAsync = async <T>(
    name: string,
    fn: (trace: ServerTraceControl) => Promise<T>,
    options?: {
      headers?: Headers | Record<string, string>;
      initialAttributes?: Attributes;
    },
  ): Promise<T> => {
    const trace = startTrace(name, options?.initialAttributes);

    if (options?.headers) {
      trace.extractFromHeaders(options.headers);
    }

    try {
      const result = await fn(trace);
      trace.end();
      return result;
    } catch (error) {
      trace.error(error);
      throw error;
    }
  };

  /**
   * Convenience wrapper for tracing sync server operations
   */
  const traceServerSync = <T>(
    name: string,
    fn: (trace: ServerTraceControl) => T,
    options?: {
      headers?: Headers | Record<string, string>;
      initialAttributes?: Attributes;
    },
  ): T => {
    const trace = startTrace(name, options?.initialAttributes);

    if (options?.headers) {
      trace.extractFromHeaders(options.headers);
    }

    try {
      const result = fn(trace);
      trace.end();
      return result;
    } catch (error) {
      trace.error(error);
      throw error;
    }
  };

  return {
    startTrace,
    traceServerAsync,
    traceServerSync,
  };
}

/**
 * Create a traced TanStack Server Function
 * Automatically extracts trace context from request headers and manages span lifecycle
 *
 * @example
 * ```ts
 * export const checkoutFn = createTracedServerFn({
 *   method: 'POST',
 *   name: 'server.checkout',
 *   handler: async (data, trace) => {
 *     trace.setAttribute('cart.id', data.cartId)
 *
 *     const result = await processPayment(data)
 *
 *     trace.setAttribute('order.id', result.orderId)
 *     return result
 *   }
 * })
 * ```
 */
export function createTracedServerFn<TArgs = void, TResult = unknown>(options: {
  /**
   * HTTP method(s) for the server function
   */
  method:
    | "GET"
    | "POST"
    | "PUT"
    | "DELETE"
    | "PATCH"
    | Array<"GET" | "POST" | "PUT" | "DELETE" | "PATCH">;
  /**
   * Name for the trace span
   */
  name: string;
  /**
   * Handler function that receives args and trace control
   */
  handler: (args: TArgs, trace: ServerTraceControl) => Promise<TResult>;
  /**
   * Optional initial attributes
   */
  initialAttributes?: Attributes;
}) {
  // TanStack Start's createServerFn needs to be imported at runtime
  // This is a factory that returns the traced server function
  return async (createServerFn: any) => {
    return createServerFn(options.method, async (args: TArgs) => {
      // Get request from Vinxi
      let request: Request | undefined;
      try {
        // Dynamic import to avoid issues if not in server context
        const { getWebRequest } = await import("vinxi/http");
        request = getWebRequest();
      } catch {
        // Not in a request context, proceed without headers
      }

      const { startTrace } = useServerTrace();
      const trace = startTrace(options.name, options.initialAttributes);

      // Extract headers if we have a request
      if (request) {
        trace.extractFromHeaders(request.headers);
        trace.setAttributes({
          "http.method": request.method,
          "http.url": request.url,
          "http.user_agent": request.headers.get("user-agent") || "unknown",
        });
      }

      try {
        const result = await options.handler(args, trace);
        trace.end();
        return result;
      } catch (error) {
        trace.error(error);
        throw error;
      }
    });
  };
}

/**
 * Helper to wrap any async function with server tracing
 * Useful for non-TanStack code like BetterAuth handlers
 *
 * @example
 * ```ts
 * export const loginHandler = withServerTrace(
 *   'auth.login',
 *   async (request: Request, trace) => {
 *     trace.setAttribute('login.method', 'password')
 *
 *     const user = await validateUser(...)
 *
 *     trace.setAttribute('user.id', user.id)
 *     return { success: true }
 *   }
 * )
 * ```
 */
export function withServerTrace<TArgs extends any[], TResult>(
  name: string,
  handler: (...args: [...TArgs, ServerTraceControl]) => Promise<TResult>,
  options?: {
    extractHeaders?: (
      args: TArgs,
    ) => Headers | Record<string, string> | undefined;
    initialAttributes?: Attributes;
  },
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    const { startTrace } = useServerTrace();
    const trace = startTrace(name, options?.initialAttributes);

    // Try to extract headers if extractor provided
    if (options?.extractHeaders) {
      const headers = options.extractHeaders(args);
      if (headers) {
        trace.extractFromHeaders(headers);
      }
    }

    try {
      const result = await handler(...args, trace);
      trace.end();
      return result;
    } catch (error) {
      trace.error(error);
      throw error;
    }
  };
}

/**
 * Helper to extract trace headers from ServerTraceControl and merge with other headers
 */
export function withTraceHeaders(
  trace: ServerTraceControl,
  headers?: HeadersInit,
): Record<string, string> {
  const traceHeaders = trace.getHeaders();

  if (!headers) {
    return traceHeaders;
  }

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
