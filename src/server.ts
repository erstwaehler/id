import { otelProcessor, otelResource } from "'defective/o11y";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { NodeSDK } from "@opentelemetry/sdk-node";
import handler from "@tanstack/react-start/server-entry";
import { PostHog } from "posthog-node";
import env from "#env";
import { paraglideMiddleware } from "../paraglide/server";
process.setMaxListeners(100);

// Initialize PostHog in server context
if (typeof window === "undefined" && env.POSTHOG_KEY) {
  const posthog = new PostHog(env.POSTHOG_KEY, {
    host: env.POSTHOG_HOST,
  });

  process.on("SIGTERM", () => {
    posthog.shutdown();
  });
}

if (typeof window === "undefined" && env.AXIOM_TOKEN) {
  const sdk = new NodeSDK({
    spanProcessor: otelProcessor,
    resource: otelResource,
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
