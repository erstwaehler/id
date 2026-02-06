import { trace } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import {
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import posthog from "posthog-js";
import { type ReactNode, useEffect, useRef } from "react";
import env from "#env";

interface TelemetryProviderProps {
  children: ReactNode;
  /**
   * Service name for traces
   * @default "ewf-id-frontend"
   */
  serviceName?: string;
  /**
   * Service version
   * @default "1.0.0"
   */
  serviceVersion?: string;
  /**
   * Whether to enable automatic fetch instrumentation
   * @default true
   */
  autoInstrumentFetch?: boolean;
  /**
   * Sample rate (0.0 to 1.0)
   * 1.0 = 100% of traces sent
   * 0.1 = 10% of traces sent
   * @default 1.0 (send all traces - sampling happens server-side)
   */
  sampleRate?: number;
}

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Get the current environment
 */
function getEnvironment(): string {
  if (!isBrowser()) return "server";

  // Check if we're in development
  if (import.meta.env.DEV) return "development";
  if (import.meta.env.PROD) return "production";

  return "unknown";
}

/**
 * Initialize OpenTelemetry for the browser
 */
function initializeTelemetry(options: Required<TelemetryProviderProps>): void {
  if (!isBrowser()) {
    console.warn("Telemetry can only be initialized in browser");
    return;
  }

  // Create resource with service information
  const resource = resourceFromAttributes({
    [SEMRESATTRS_SERVICE_NAME]: options.serviceName,
    [SEMRESATTRS_SERVICE_VERSION]: options.serviceVersion,
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: getEnvironment(),
    // Additional frontend-specific attributes
    "telemetry.sdk.name": "opentelemetry",
    "telemetry.sdk.language": "javascript",
    "browser.user_agent": navigator.userAgent,
    "browser.language": navigator.language,
    "screen.width": window.screen.width,
    "screen.height": window.screen.height,
  });

  // Create exporter that sends to our proxy
  const exporter = new OTLPTraceExporter({
    url: "/api/telemetry", // Our proxy endpoint
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Create span processor with batching for performance
  const spanProcessor = new BatchSpanProcessor(exporter, {
    // Maximum queue size before forcing a batch
    maxQueueSize: 100,
    // Maximum time to wait before sending a batch (ms)
    scheduledDelayMillis: 5000,
    // Maximum batch size
    maxExportBatchSize: 50,
  });

  // Create tracer provider
  const provider = new WebTracerProvider({
    resource,
    // sampler: createSampler(options.sampleRate), // Uncomment for client-side sampling
  });

  // Add the batch processor
  // @ts-expect-error
  provider.addSpanProcessor(spanProcessor);

  // Register the provider globally
  provider.register({
    // Context manager for propagating context through async calls
    // Uses Zone.js if available, falls back to StackContextManager
  });

  // Auto-instrument fetch calls if enabled
  if (options.autoInstrumentFetch) {
    registerInstrumentations({
      instrumentations: [
        new FetchInstrumentation({
          // Propagate trace context in fetch calls
          propagateTraceHeaderCorsUrls: [
            // Same origin
            new RegExp(`${window.location.origin}/.*`),
            // Add other origins you want to trace
          ],
          // Ignore telemetry endpoint to avoid infinite loop
          ignoreUrls: [/\/api\/telemetry/],
          // Clear timing resources to avoid memory leaks
          clearTimingResources: true,
        }),
      ],
    });
  }

  console.info(
    `[Telemetry] Initialized for ${options.serviceName} v${options.serviceVersion}`,
  );
}

/**
 * Initialize PostHog for the browser
 */
function initializePostHog(): void {
  if (!isBrowser()) return;

  if (env.POSTHOG_KEY) {
    posthog.init(env.POSTHOG_KEY, {
      api_host: env.POSTHOG_HOST || "https://eu.posthog.com",
      person_profiles: "identified_only", // or 'always' to create profiles for anonymous users as well
      loaded: (ph) => {
        if (import.meta.env.DEV) ph.opt_out_capturing();
      },
    });
  }
}

/**
 * Provider component that initializes OpenTelemetry and PostHog
 */
export function TelemetryProvider({
  children,
  serviceName = "ewf-id-frontend",
  serviceVersion = "1.0.0",
  autoInstrumentFetch = true,
  sampleRate = 1.0,
}: TelemetryProviderProps) {
  const initialized = useRef(false);

  useEffect(() => {
    // Only initialize once
    if (initialized.current) {
      return;
    }

    // Only initialize in browser
    if (!isBrowser()) {
      return;
    }

    initialized.current = true;

    try {
      // Initialize OpenTelemetry
      initializeTelemetry({
        children,
        serviceName,
        serviceVersion,
        autoInstrumentFetch,
        sampleRate,
      });

      // Initialize PostHog
      initializePostHog();
    } catch (error) {
      console.error("[Telemetry] Failed to initialize:", error);
    }

    // Cleanup on unmount
    return () => {
      try {
        // Flush any pending spans before unmounting
        const tracerProvider = trace.getTracerProvider();
        if (
          tracerProvider &&
          "forceFlush" in tracerProvider &&
          typeof tracerProvider.forceFlush === "function"
        ) {
          tracerProvider.forceFlush();
        }
      } catch (error) {
        console.error("[Telemetry] Failed to flush:", error);
      }
    };
  }, [
    serviceName,
    serviceVersion,
    autoInstrumentFetch,
    sampleRate,
    children, // Added to dependencies to satisfy linter, though effectively handled by initialized ref
  ]);

  // Provider doesn't render anything, just initializes
  return <>{children}</>;
}

/**
 * Helper to check if telemetry is initialized
 */
export function isTelemetryInitialized(): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    const tracerProvider = trace.getTracerProvider();
    const tracer = tracerProvider.getTracer("test");
    const span = tracer.startSpan("test");
    const hasTraceId = !!span.spanContext().traceId;
    span.end();
    return hasTraceId;
  } catch {
    return false;
  }
}

/**
 * Helper to manually flush pending spans
 * Useful before navigation or app shutdown
 */
export async function flushTelemetry(): Promise<void> {
  if (!isBrowser()) {
    return;
  }

  try {
    const tracerProvider = trace.getTracerProvider();
    if (
      tracerProvider &&
      "forceFlush" in tracerProvider &&
      typeof tracerProvider.forceFlush === "function"
    ) {
      await tracerProvider.forceFlush();
      console.info("[Telemetry] Flushed pending spans");
    }
  } catch (error) {
    console.error("[Telemetry] Failed to flush:", error);
  }
}
