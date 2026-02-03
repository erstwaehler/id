import { Resource, Tracer } from "@effect/opentelemetry";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  // BatchSpanProcessor,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { Effect, Layer } from "effect";
import env from "#env";
import { APP_VERSION, CURRENT_BRANCH, LATEST_COMMIT_HASH } from "~/lib/version";

/**
 * Annotates the current span with all enumerable properties of the error.
 * Prefixes attributes with "error.".
 *
 * Usage:
 * myEffect.pipe(annotateThis)
 */
export const annotateThis = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<A, E, R> => {
  return Effect.tapError(effect, (error) => {
    if (typeof error === "object" && error !== null) {
      const attributes: Record<string, string | number | boolean> = {};

      Object.entries(error).forEach(([key, value]) => {
        // Skip potential private keys or symbols if they show up in entries
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          attributes[`error.${key}`] = value;
        } else if (value === null) {
          attributes[`error.${key}`] = "null";
        } else {
          try {
            // Try to stringify objects/arrays
            attributes[`error.${key}`] = JSON.stringify(value);
          } catch {
            // Fallback to toString
            attributes[`error.${key}`] = String(value);
          }
        }
      });

      return Effect.annotateCurrentSpan(attributes);
    }

    // Fallback for primitive errors
    return Effect.annotateCurrentSpan("error.message", String(error));
  });
};

export const otelTraceExporter = new OTLPTraceExporter({
  url: `${env.AXIOM_API_URL}/v1/traces`,
  headers: {
    Authorization: `Bearer ${env.AXIOM_TOKEN}`,
    "X-Axiom-Dataset": env.AXIOM_DATASET,
  },
});

export const otelResource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: "ewf-id-backend",
  [ATTR_SERVICE_VERSION]: APP_VERSION,
  "git.commit": LATEST_COMMIT_HASH,
  "git.branch": CURRENT_BRANCH,
});

const effectResource = Resource.layer({
  serviceName: "ewf-id-backend",
  serviceVersion: APP_VERSION,
  attributes: {
    "git.commit": LATEST_COMMIT_HASH,
    "git.branch": CURRENT_BRANCH,
  },
});

// export const otelProcessor = new BatchSpanProcessor(otelTraceExporter);
export const otelProcessor = new SimpleSpanProcessor(otelTraceExporter);

export const otelLive = Tracer.layerGlobal.pipe(Layer.provide(effectResource));
