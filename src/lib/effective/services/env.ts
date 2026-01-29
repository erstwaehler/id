import { Context } from "effect";

class CLIENT_ENV extends Context.Tag("Client ENV Provider")<
  CLIENT_ENV,
  {
    readonly HOST_URL: string;
    readonly POSTHOG_KEY: string;
    readonly POSTHOG_HOST: string;
    readonly POSTHOG_PROJECT_ID: string;
    readonly CLOUDFLARE_TURNSTILE_SITE_KEY: string;
  }
>() {}

class SERVER_ENV extends Context.Tag("Server ENV Provider")<
  SERVER_ENV,
  {
    // Database (Neon.tech)
    readonly AUTHDB_DATABASE: string;
    readonly AUTHDB_PASSWORD: string;
    readonly AUTHDB_READ_1: string;
    readonly AUTHDB_READ_2: string;
    readonly AUTHDB_USER: string;
    readonly AUTHDB_WRITE: string;

    // Encryption (AES-256-GCM)
    readonly ENCRYPTION_KEY: string;

    // Better Auth
    readonly BETTER_AUTH_SECRET: string;
    readonly BETTER_AUTH_URL: string;
    readonly HOST_URL: string;

    // Email (Resend)
    readonly RESEND_API_KEY: string;
    readonly RESEND_FROM_EMAIL: string;

    // Analytics & Feature Flags (PostHog)
    readonly POSTHOG_KEY: string;
    readonly POSTHOG_HOST: string;
    readonly POSTHOG_PROJECT_ID: string;

    // Logging (Axiom)
    readonly AXIOM_TOKEN: string | undefined;
    readonly AXIOM_DATASET: string;

    // CAPTCHA (Cloudflare Turnstile)
    readonly CLOUDFLARE_TURNSTILE_SECRET_KEY: string;

    // School OIDC Providers
    // Athenaeum (IServ)
    readonly OIDC_ATHENAEUM_CLIENT_ID: string;
    readonly OIDC_ATHENAEUM_CLIENT_SECRET: string;
    readonly OIDC_ATHENAEUM_ISSUER: string;

    // VLG (Moodle)
    readonly OIDC_VLG_CLIENT_ID: string;
    readonly OIDC_VLG_CLIENT_SECRET: string;
    readonly OIDC_VLG_ISSUER: string;

    // IGS (IServ)
    readonly OIDC_IGS_CLIENT_ID: string;
    readonly OIDC_IGS_CLIENT_SECRET: string;
    readonly OIDC_IGS_ISSUER: string;

    // OpenTelemetry (optional for development)
    readonly OTEL_EXPORTER_OTLP_ENDPOINT: string | undefined;
    readonly OTEL_EXPORTER_OTLP_HEADERS: string | undefined;

    // Node Environment
    readonly NODE_ENV: "development" | "production" | "test";
  }
>() {}

export { CLIENT_ENV, SERVER_ENV };
