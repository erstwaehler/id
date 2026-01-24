/**
 * Feature Flags Configuration
 * Using Vercel Flags SDK with PostHog integration
 * Implements SPEC.md §6 feature flag requirements
 */
import { flag, dedupe } from "flags";

/**
 * PostHog interface for type safety
 */
interface PostHogInstance {
	isFeatureEnabled: (key: string) => boolean | undefined;
}

declare global {
	interface Window {
		posthog?: PostHogInstance;
	}
}

/**
 * Get PostHog feature flag value
 * This function checks PostHog for feature flag state
 */
async function getPostHogFlag(key: string): Promise<boolean> {
	// In development or when PostHog is not configured, return false
	if (typeof window === "undefined") {
		return false;
	}

	// Check if PostHog is available
	const posthog = window.posthog;
	if (!posthog) {
		return false;
	}

	try {
		return posthog.isFeatureEnabled(key) ?? false;
	} catch {
		return false;
	}
}

/**
 * Development Mode Flag
 * Enables development-only features
 */
export const devModeFlag = flag({
	key: "dev-mode",
	description: "Enables development mode features",
	defaultValue: false,
	decide: dedupe(async () => {
		return process.env.NODE_ENV === "development";
	}),
});

/**
 * Multi-Session Management Flag
 * Controls visibility of multi-session management UI
 * Hidden from normal users, visible in admin panel
 */
export const multiSessionFlag = flag({
	key: "multi-session",
	description: "Enables multi-session management UI for users",
	defaultValue: false,
	decide: dedupe(async () => {
		return getPostHogFlag("multi-session");
	}),
});

/**
 * Bulk Operations Flag
 * Enables bulk user operations in admin panel
 */
export const bulkOperationsFlag = flag({
	key: "bulk-operations",
	description: "Enables bulk operations in admin dashboard",
	defaultValue: false,
	decide: dedupe(async () => {
		return getPostHogFlag("bulk-operations");
	}),
});

/**
 * Create Admin Flag
 * Allows creation of admin users via UI
 */
export const createAdminFlag = flag({
	key: "create-admin",
	description: "Allows creation of admin users in the admin dashboard",
	defaultValue: false,
	decide: dedupe(async () => {
		return getPostHogFlag("create-admin");
	}),
});

/**
 * Device Authorization Flag
 * Enables device authorization flow (RFC 8628)
 */
export const deviceAuthFlag = flag({
	key: "device-auth",
	description: "Enables device authorization flow",
	defaultValue: false,
	decide: dedupe(async () => {
		return getPostHogFlag("device-auth");
	}),
});

/**
 * Admin Impersonation Flag
 * Controls admin user impersonation feature
 */
export const impersonationFlag = flag({
	key: "admin-impersonation",
	description: "Enables admin user impersonation",
	defaultValue: true,
	decide: dedupe(async () => {
		const posthogValue = await getPostHogFlag("admin-impersonation");
		return posthogValue !== false; // Default to true if not explicitly disabled
	}),
});

/**
 * API Key Management Flag
 * Enables API key management features
 */
export const apiKeyManagementFlag = flag({
	key: "api-key-management",
	description: "Enables API key management in dashboard",
	defaultValue: true,
	decide: dedupe(async () => {
		return getPostHogFlag("api-key-management");
	}),
});

/**
 * OIDC Provider Flag
 * Enables OIDC provider functionality
 */
export const oidcProviderFlag = flag({
	key: "oidc-provider",
	description: "Enables OIDC provider endpoints",
	defaultValue: true,
	decide: dedupe(async () => {
		return true; // Always enabled for now
	}),
});

/**
 * Audit Log Flag
 * Enables audit logging and viewer
 */
export const auditLogFlag = flag({
	key: "audit-log",
	description: "Enables audit logging functionality",
	defaultValue: true,
	decide: dedupe(async () => {
		return true; // Always enabled
	}),
});

/**
 * Helper to check all flags for a user context
 */
export async function getFeatureFlags() {
	const [
		devMode,
		multiSession,
		bulkOperations,
		createAdmin,
		deviceAuth,
		impersonation,
		apiKeyManagement,
		oidcProvider,
		auditLog,
	] = await Promise.all([
		devModeFlag(),
		multiSessionFlag(),
		bulkOperationsFlag(),
		createAdminFlag(),
		deviceAuthFlag(),
		impersonationFlag(),
		apiKeyManagementFlag(),
		oidcProviderFlag(),
		auditLogFlag(),
	]);

	return {
		devMode,
		multiSession,
		bulkOperations,
		createAdmin,
		deviceAuth,
		impersonation,
		apiKeyManagement,
		oidcProvider,
		auditLog,
	};
}

export type FeatureFlags = Awaited<ReturnType<typeof getFeatureFlags>>;
