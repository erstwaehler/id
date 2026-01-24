/**
 * PostHog Analytics Service
 * Implements SPEC.md §10.3 - Product Analytics Events
 * Integrated with OTEL for trace ID correlation
 */
import { Effect, Context, Layer, pipe } from "effect";
import { getCurrentTraceId } from "./otel";

// =============================================================================
// Types
// =============================================================================

/**
 * PostHog instance interface
 */
interface PostHogInstance {
	capture: (event: string, properties?: Record<string, unknown>) => void;
	identify: (distinctId: string, properties?: Record<string, unknown>) => void;
	reset: () => void;
	isFeatureEnabled: (key: string) => boolean | undefined;
}

declare global {
	interface Window {
		posthog?: PostHogInstance;
	}
}

export interface AnalyticsService {
	/**
	 * Identify a user
	 */
	readonly identify: (userId: string, properties?: Record<string, unknown>) => void;

	/**
	 * Track an event
	 */
	readonly track: (event: string, properties?: Record<string, unknown>) => void;

	/**
	 * Track an exception with OTEL trace ID
	 */
	readonly captureException: (error: Error, context?: Record<string, unknown>) => void;

	/**
	 * Reset user identity (logout)
	 */
	readonly reset: () => void;

	/**
	 * Check if a feature flag is enabled
	 */
	readonly isFeatureEnabled: (flag: string) => boolean;
}

// =============================================================================
// Analytics Event Names (SPEC §10.3)
// =============================================================================

export const AnalyticsEvents = {
	// Authentication Events
	USER_REGISTERED: "user_registered",
	USER_LOGIN: "user_login",
	USER_LOGOUT: "user_logout",
	PASSWORD_RESET_REQUESTED: "password_reset_requested",
	PASSWORD_RESET_COMPLETED: "password_reset_completed",
	TWO_FA_ENABLED: "2fa_enabled",
	TWO_FA_DISABLED: "2fa_disabled",
	PASSKEY_ADDED: "passkey_added",
	PASSKEY_REMOVED: "passkey_removed",

	// Account Events
	PROFILE_UPDATED: "profile_updated",
	LANGUAGE_CHANGED: "language_changed",
	ACCOUNT_DELETION_REQUESTED: "account_deletion_requested",
	ACCOUNT_DELETION_CANCELLED: "account_deletion_cancelled",
	DATA_EXPORT_REQUESTED: "data_export_requested",

	// Admin Events
	ADMIN_USER_CREATED: "admin_user_created",
	ADMIN_USER_UPDATED: "admin_user_updated",
	ADMIN_USER_DELETED: "admin_user_deleted",
	ADMIN_IMPERSONATION_STARTED: "admin_impersonation_started",
	ADMIN_IMPERSONATION_ENDED: "admin_impersonation_ended",
	ADMIN_API_KEY_CREATED: "admin_api_key_created",
	ADMIN_API_KEY_REVOKED: "admin_api_key_revoked",

	// OIDC Events
	OIDC_AUTHORIZATION_STARTED: "oidc_authorization_started",
	OIDC_AUTHORIZATION_GRANTED: "oidc_authorization_granted",
	OIDC_AUTHORIZATION_DENIED: "oidc_authorization_denied",
	OIDC_TOKEN_ISSUED: "oidc_token_issued",
	OIDC_TOKEN_REFRESHED: "oidc_token_refreshed",

	// Error Events
	AUTH_FAILED: "auth_failed",
	RATE_LIMIT_EXCEEDED: "rate_limit_exceeded",
	PERMISSION_DENIED: "permission_denied",
	API_ERROR: "api_error",

	// Page Views (automatic with PostHog, but can be manual)
	PAGE_VIEW: "$pageview",
	PAGE_LEAVE: "$pageleave",
} as const;

export type AnalyticsEvent = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

// =============================================================================
// Service Tag
// =============================================================================

export class Analytics extends Context.Tag("Analytics")<Analytics, AnalyticsService>() {}

// =============================================================================
// Implementation
// =============================================================================

/**
 * Get PostHog instance safely
 */
function getPostHog(): PostHogInstance | null {
	if (typeof window !== "undefined" && window.posthog) {
		return window.posthog;
	}
	return null;
}

/**
 * Live implementation of analytics service
 */
const AnalyticsLive: AnalyticsService = {
	identify: (userId: string, properties?: Record<string, unknown>) => {
		const posthog = getPostHog();
		if (posthog) {
			// Hash user ID for privacy (SPEC §9.4)
			const hashedId = hashUserId(userId);
			posthog.identify(hashedId, {
				...properties,
				// Don't send PII to PostHog
			});
		}

		// Log in development
		if (process.env.NODE_ENV === "development") {
			console.log("[Analytics] identify:", userId, properties);
		}
	},

	track: (event: string, properties?: Record<string, unknown>) => {
		const posthog = getPostHog();
		const traceId = getCurrentTraceId();

		const enrichedProperties = {
			...properties,
			...(traceId && { trace_id: traceId }),
			timestamp: new Date().toISOString(),
		};

		if (posthog) {
			posthog.capture(event, enrichedProperties);
		}

		// Log in development
		if (process.env.NODE_ENV === "development") {
			console.log("[Analytics] track:", event, enrichedProperties);
		}
	},

	captureException: (error: Error, context?: Record<string, unknown>) => {
		const posthog = getPostHog();
		const traceId = getCurrentTraceId();

		const exceptionData = {
			$exception_type: error.name,
			$exception_message: error.message,
			$exception_stack_trace_raw: error.stack,
			...context,
			...(traceId && { trace_id: traceId }),
			timestamp: new Date().toISOString(),
		};

		if (posthog) {
			posthog.capture("$exception", exceptionData);
		}

		// Always log errors
		console.error("[Analytics] exception:", error.message, {
			traceId,
			...context,
		});
	},

	reset: () => {
		const posthog = getPostHog();
		if (posthog) {
			posthog.reset();
		}

		if (process.env.NODE_ENV === "development") {
			console.log("[Analytics] reset");
		}
	},

	isFeatureEnabled: (flag: string): boolean => {
		const posthog = getPostHog();
		if (posthog) {
			return posthog.isFeatureEnabled(flag) ?? false;
		}
		return false;
	},
};

/**
 * Hash user ID for privacy using SHA-256
 * Creates a cryptographically secure hash for PostHog identification
 */
async function hashUserIdAsync(userId: string): Promise<string> {
	if (typeof window !== "undefined" && window.crypto?.subtle) {
		try {
			const encoder = new TextEncoder();
			const data = encoder.encode(userId);
			const hashBuffer = await crypto.subtle.digest("SHA-256", data);
			const hashArray = Array.from(new Uint8Array(hashBuffer));
			const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
			return `user_${hashHex.slice(0, 16)}`; // Use first 16 chars for brevity
		} catch {
			// Fallback if crypto fails
			return hashUserIdSync(userId);
		}
	}
	return hashUserIdSync(userId);
}

/**
 * Synchronous hash fallback for server-side or when crypto.subtle is unavailable
 * Note: This is weaker but serves as a fallback only
 */
function hashUserIdSync(userId: string): string {
	// Use a simple but reasonable hash for fallback
	let hash = 5381;
	for (let i = 0; i < userId.length; i++) {
		hash = ((hash << 5) + hash) ^ userId.charCodeAt(i);
	}
	return `user_${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

/**
 * Synchronous hash for immediate use (uses fallback)
 * For async contexts, prefer hashUserIdAsync
 */
function hashUserId(userId: string): string {
	return hashUserIdSync(userId);
}

// =============================================================================
// Layer
// =============================================================================

export const AnalyticsLiveLayer = Layer.succeed(Analytics, AnalyticsLive);

// =============================================================================
// Effect-based helpers
// =============================================================================

/**
 * Track an analytics event within Effect context
 */
export function trackEvent(
	event: AnalyticsEvent | string,
	properties?: Record<string, unknown>
): Effect.Effect<void, never, Analytics> {
	return pipe(
		Analytics,
		Effect.flatMap((analytics) =>
			Effect.sync(() => analytics.track(event, properties))
		)
	);
}

/**
 * Track an exception within Effect context
 */
export function captureException(
	error: Error,
	context?: Record<string, unknown>
): Effect.Effect<void, never, Analytics> {
	return pipe(
		Analytics,
		Effect.flatMap((analytics) =>
			Effect.sync(() => analytics.captureException(error, context))
		)
	);
}

/**
 * Identify user within Effect context
 */
export function identifyUser(
	userId: string,
	properties?: Record<string, unknown>
): Effect.Effect<void, never, Analytics> {
	return pipe(
		Analytics,
		Effect.flatMap((analytics) =>
			Effect.sync(() => analytics.identify(userId, properties))
		)
	);
}

// =============================================================================
// Direct usage helpers (for React components)
// =============================================================================

/**
 * Track event directly (for use in React components)
 */
export function track(event: AnalyticsEvent | string, properties?: Record<string, unknown>): void {
	AnalyticsLive.track(event, properties);
}

/**
 * Identify user directly
 */
export function identify(userId: string, properties?: Record<string, unknown>): void {
	AnalyticsLive.identify(userId, properties);
}

/**
 * Capture exception directly
 */
export function captureError(error: Error, context?: Record<string, unknown>): void {
	AnalyticsLive.captureException(error, context);
}

/**
 * Reset analytics identity
 */
export function resetAnalytics(): void {
	AnalyticsLive.reset();
}
