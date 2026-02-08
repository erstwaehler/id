import { customSampler, otelProcessor, otelResource } from "'defective/o11y";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { NodeSDK } from "@opentelemetry/sdk-node";
import handler from "@tanstack/react-start/server-entry";
import { PostHog } from "posthog-node";
import env from "#env";
import { paraglideMiddleware } from "../paraglide/server";

process.setMaxListeners(100);

// Initialize PostHog in server context
let posthog: PostHog | null = null;
if (typeof window === "undefined" && env.POSTHOG_KEY) {
  posthog = new PostHog(env.POSTHOG_KEY, {
    host: env.POSTHOG_HOST,
  });

  process.on("SIGTERM", () => {
    posthog?.shutdown();
  });
}
export { posthog };

if (typeof window === "undefined" && env.AXIOM_TOKEN) {
  const sdk = new NodeSDK({
    spanProcessor: otelProcessor,
    resource: otelResource,
    sampler: customSampler,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();

  process.on("SIGTERM", () => {
    sdk.shutdown().then(() => console.log("Tracing terminated"));
  });
}

// Server-side URL localization/redirects for Paraglide
export default {
  fetch(req: Request): Promise<Response> {
    return paraglideMiddleware(req, () => handler.fetch(req));
  },
};
