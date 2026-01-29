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

// Create simplified aliases for common access patterns
const createEnvWithAliases = () => {
  const baseEnv = createEnv({
    server: {
      // Database (Neon.tech)
      AUTHDB_DATABASE: z.string().min(1),
      AUTHDB_PASSWORD: z.string().min(1),
      AUTHDB_READ_1: z.string(),
      AUTHDB_READ_2: z.string(),
      AUTHDB_USER: z.string().min(1),
      AUTHDB_WRITE: z.string(),

      // Encryption (AES-256-GCM)
      // Generate with: openssl rand -hex 32
      ENCRYPTION_KEY: z.string().length(64),

      // Better Auth
      BETTER_AUTH_SECRET: z.string().min(32),
      BETTER_AUTH_URL: z.string().url(),
      HOST_URL: z.string().url(),

      // Email (Resend)
      RESEND_API_KEY: z.string().min(1),
      RESEND_FROM_EMAIL: z.string().default("EWF-ID <noreply@id.ewf-stade.de>"),

      // Analytics & Feature Flags (PostHog)
      POSTHOG_KEY: z.string(),
      POSTHOG_HOST: z.url().default("https://eu.posthog.com"),
      POSTHOG_PROJECT_ID: z.string(),

      // Logging (Axiom)
      AXIOM_TOKEN: z.string().optional(),
      AXIOM_DATASET: z.string().default("ewf-id"),

      // CAPTCHA (Cloudflare Turnstile)
      CLOUDFLARE_TURNSTILE_SECRET_KEY: z.string().min(1),

      // School OIDC Providers
      // Athenaeum (IServ)
      OIDC_ATHENAEUM_CLIENT_ID: z.string().min(1).default("placeholder"),
      OIDC_ATHENAEUM_CLIENT_SECRET: z.string().min(1).default("placeholder"),
      OIDC_ATHENAEUM_ISSUER: z.url().default("https://placeholder.com"),

      // VLG (Moodle)
      OIDC_VLG_CLIENT_ID: z.string().min(1).default("placeholder"),
      OIDC_VLG_CLIENT_SECRET: z.string().min(1).default("placeholder"),
      OIDC_VLG_ISSUER: z.url().default("https://placeholder.com"),

      // IGS (IServ)
      OIDC_IGS_CLIENT_ID: z.string().min(1).default("placeholder"),
      OIDC_IGS_CLIENT_SECRET: z.string().min(1).default("placeholder"),
      OIDC_IGS_ISSUER: z.url().default("https://placeholder.com"),

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
      VITE_HOST_URL: z.url(),

      // PostHog (client-side)
      VITE_POSTHOG_KEY: z.string(),
      VITE_POSTHOG_HOST: z.url().default("https://eu.posthog.com"),
      VITE_POSTHOG_PROJECT_ID: z.string(),

      // Cloudflare Turnstile (site key)
      VITE_CLOUDFLARE_TURNSTILE_SITE_KEY: z.string().min(1),
    },

    /**
     * What object holds the environment variables at runtime. This is usually
     * `process.env` or `import.meta.env`.
     */
    runtimeEnv: {
      // Server-side env vars from process.env
      ...process.env,
      // Client-side env vars from import.meta.env (with VITE_ prefix)
      ...import.meta.env,
    },

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

  // Add aliases for common patterns
  return {
    ...baseEnv,
    // PostHog aliases - these come from runtimeEnv now
    POSTHOG_KEY: baseEnv.VITE_POSTHOG_KEY,
    POSTHOG_HOST: baseEnv.VITE_POSTHOG_HOST,
  };
};

export const env = createEnvWithAliases();

export default env;
