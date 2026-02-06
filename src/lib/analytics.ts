/**
 * EWF-ID PostHog Analytics Integration
 * SPEC.md Phase 7 - Task 7.2: PostHog Integration
 *
 * Provides product analytics with GDPR-compliant cookie consent
 */
import posthog from "posthog-js";
import env from "#env";
import { getCookieConsent } from "~/components/CookieConsent";

let isInitialized = false;

/**
 * Initialize PostHog analytics
 * Only initializes if analytics consent is given
 */
export function initPostHog(): void {
  if (typeof window === "undefined") return;
  if (isInitialized) return;

  const consent = getCookieConsent();
  if (!consent?.analytics) {
    return;
  }

  const posthogKey = env.POSTHOG_KEY;
  if (!posthogKey) {
    console.debug("[PostHog] No API key configured, skipping initialization");
    return;
  }

  try {
    posthog.init(posthogKey, {
      api_host: env.POSTHOG_HOST || "https://eu.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      disable_session_recording: false,
      persistence: "localStorage",
      loaded: (posthog) => {
        if (env.NODE_ENV === "development") {
          posthog.debug();
        }
      },
      opt_out_capturing_by_default: !consent.analytics,
    });
    isInitialized = true;
    console.debug("[PostHog] Initialized successfully");
  } catch (error) {
    console.error("[PostHog] Failed to initialize:", error);
  }
}

/**
 * Identify a user after authentication
 */
export function identifyUser(user: {
  id: string;
  email: string;
  name?: string;
  role?: string;
  school?: string;
}): void {
  if (!isInitialized) return;

  try {
    posthog.identify(user.id, {
      email: user.email,
      name: user.name,
      role: user.role,
      school: user.school,
    });
  } catch (error) {
    console.error("[PostHog] Failed to identify user:", error);
  }
}

/**
 * Reset user identity on logout
 */
export function resetUser(): void {
  if (!isInitialized) return;

  try {
    posthog.reset();
  } catch (error) {
    console.error("[PostHog] Failed to reset user:", error);
  }
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>,
): void {
  if (!isInitialized) return;

  try {
    posthog.capture(eventName, properties);
  } catch (error) {
    console.error("[PostHog] Failed to track event:", error);
  }
}

/**
 * Track an exception with optional context
 */
export function trackException(
  error: Error,
  context?: Record<string, unknown>,
  traceId?: string,
): void {
  if (!isInitialized) return;

  try {
    posthog.captureException(error, {
      traceId,
      ...context,
    });
  } catch (err) {
    console.error("[PostHog] Failed to track exception:", err);
  }
}

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flagKey: string): boolean {
  if (!isInitialized) return false;

  try {
    return posthog.isFeatureEnabled(flagKey) ?? false;
  } catch {
    return false;
  }
}

/**
 * Get feature flag payload
 */
export function getFeatureFlagPayload(flagKey: string): unknown {
  if (!isInitialized) return null;

  try {
    return posthog.getFeatureFlagPayload(flagKey);
  } catch {
    return null;
  }
}

/**
 * Opt user out of analytics
 */
export function optOut(): void {
  if (!isInitialized) return;

  try {
    posthog.opt_out_capturing();
  } catch (error) {
    console.error("[PostHog] Failed to opt out:", error);
  }
}

/**
 * Opt user into analytics
 */
export function optIn(): void {
  if (!isInitialized) {
    initPostHog();
  }

  try {
    posthog.opt_in_capturing();
  } catch (error) {
    console.error("[PostHog] Failed to opt in:", error);
  }
}

// Pre-defined event names for consistency
export const AnalyticsEvents = {
  // Authentication
  USER_REGISTERED: "user_registered",
  USER_SIGNED_IN: "user_signed_in",
  USER_SIGNED_OUT: "user_signed_out",
  EMAIL_VERIFIED: "email_verified",
  PASSWORD_RESET_REQUESTED: "password_reset_requested",
  PASSWORD_RESET_COMPLETED: "password_reset_completed",

  // 2FA
  TWO_FA_ENABLED: "2fa_enabled",
  TWO_FA_DISABLED: "2fa_disabled",

  // Passkeys
  PASSKEY_REGISTERED: "passkey_registered",
  PASSKEY_REMOVED: "passkey_removed",

  // School SSO
  SCHOOL_SSO_INITIATED: "school_sso_initiated",
  SCHOOL_SSO_COMPLETED: "school_sso_completed",

  // Sessions
  SESSION_REVOKED: "session_revoked",

  // API Keys
  API_KEY_CREATED: "api_key_created",
  API_KEY_REVOKED: "api_key_revoked",

  // Profile
  PROFILE_UPDATED: "profile_updated",
  AVATAR_UPLOADED: "avatar_uploaded",
  LOCALE_CHANGED: "locale_changed",

  // GDPR
  DATA_EXPORT_REQUESTED: "data_export_requested",
  DATA_EXPORT_DOWNLOADED: "data_export_downloaded",
  ACCOUNT_DELETION_REQUESTED: "account_deletion_requested",
  ACCOUNT_DELETION_COMPLETED: "account_deletion_completed",
  ACCOUNT_DELETION_CANCELLED: "account_deletion_cancelled",

  // OIDC
  OIDC_AUTHORIZATION_REQUEST: "oidc_authorization_request",
  OIDC_TOKEN_ISSUED: "oidc_token_issued",

  // Admin
  ADMIN_USER_CREATED: "admin_user_created",
  ADMIN_USER_UPDATED: "admin_user_updated",
  ADMIN_USER_DELETED: "admin_user_deleted",
  ADMIN_ROLE_ASSIGNED: "admin_role_assigned",
  ADMIN_ROLE_REVOKED: "admin_role_revoked",
  ADMIN_USER_SUSPENDED: "admin_user_suspended",
  ADMIN_USER_UNSUSPENDED: "admin_user_unsuspended",

  // Cookie Consent
  COOKIE_CONSENT_GIVEN: "cookie_consent_given",
  COOKIE_CONSENT_CHANGED: "cookie_consent_changed",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];
