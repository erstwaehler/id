import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const getBetterAuthUrl = () => {
  // Handle client-side
  if (typeof window !== "undefined" && window.location.host) {
    const protocol = window.location.protocol;
    return `${protocol}//${window.location.host}`;
  }

  // Handle server-side with Vercel environment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Handle server-side with explicit HOST/PORT
  if (process.env.HOST || process.env.PORT) {
    const host = process.env.HOST || "localhost";
    const port = process.env.PORT || "3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    return `${protocol}://${host}${port !== "80" && port !== "443" ? `:${port}` : ""}`;
  }

  // Development fallback
  return "http://localhost:3000";
};
const hostUrl = getBetterAuthUrl();

process.env.BETTER_AUTH_URL = hostUrl;
process.env.HOST_URL = hostUrl;

// test
process.env.VITE_HOST_URL = hostUrl;

export const env = createEnv({
  server: {
    // Database (Neon.tech)
    AUTHDB_DATABASE: z.string().min(1),
    AUTHDB_PASSWORD: z.string().min(1),
    AUTHDB_READ_1: z.string(),
    AUTHDB_READ_2: z.string(),
    AUTHDB_USER: z.string().min(1),
    AUTHDB_WRITE: z.string(),

    // Better Auth
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
    HOST_URL: z.string().url(),

    // Email (Resend)
    RESEND_API_KEY: z.string().min(1),
    RESEND_FROM_EMAIL: z
      .string()
      .email()
      .default("EWF-ID <noreply@id.ewf-stade.de>"),

    // Analytics & Feature Flags (PostHog)
    POSTHOG_API_KEY: z.string().optional(),
    POSTHOG_PROJECT_ID: z.string().optional(),

    // Logging (Axiom)
    AXIOM_TOKEN: z.string().optional(),
    AXIOM_DATASET: z.string().default("ewf-id"),

    // CAPTCHA (Cloudflare Turnstile)
    CLOUDFLARE_TURNSTILE_SECRET_KEY: z.string().min(1),

    // School OIDC Providers
    // Athenaeum (IServ)
    OIDC_ATHENAEUM_CLIENT_ID: z.string().min(1),
    OIDC_ATHENAEUM_CLIENT_SECRET: z.string().min(1),
    OIDC_ATHENAEUM_ISSUER: z.string().url(),

    // VLG (Moodle)
    OIDC_VLG_CLIENT_ID: z.string().min(1),
    OIDC_VLG_CLIENT_SECRET: z.string().min(1),
    OIDC_VLG_ISSUER: z.string().url(),

    // IGS (IServ)
    OIDC_IGS_CLIENT_ID: z.string().min(1),
    OIDC_IGS_CLIENT_SECRET: z.string().min(1),
    OIDC_IGS_ISSUER: z.string().url(),

    // OpenTelemetry (optional for development)
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
    OTEL_EXPORTER_OTLP_HEADERS: z.string().optional(),

    // Node Environment
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: "VITE_",

  client: {
    VITE_HOST_URL: z.string().url(),

    // PostHog (client-side)
    VITE_POSTHOG_KEY: z.string().optional(),
    VITE_POSTHOG_HOST: z.string().url().default("https://eu.posthog.com"),

    // Cloudflare Turnstile (site key)
    VITE_CLOUDFLARE_TURNSTILE_SITE_KEY: z.string().min(1),

    // Feature Flags
    VITE_ENABLE_MULTI_SESSION: z.string().optional(),
    VITE_ENABLE_BULK_OPERATIONS: z.string().optional(),
    VITE_ENABLE_CREATE_ADMIN: z.string().optional(),
    VITE_ENABLE_DEVICE_AUTH: z.string().optional(),
  },

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   */
  runtimeEnv: import.meta.env,

  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
   * it as a type mismatch violation. Additionally, if you have an empty string
   * for a value that is supposed to be a string with a default value (e.g.
   * `DOMAIN=` in an ".env" file), the default value will never be applied.
   *
   * In order to solve these issues, we recommend that all new projects
   * explicitly specify this option as true.
   */
  emptyStringAsUndefined: true,
});

export default env;
