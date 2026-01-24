/**
 * EWF-ID Auth Client
 * Client-side authentication utilities for React components
 */
import { createAuthClient } from "better-auth/react";
import {
	twoFactorClient,
	adminClient,
	passkeyClient,
	multiSessionClient,
} from "better-auth/client/plugins";

/**
 * Auth client with all required plugins
 */
export const authClient = createAuthClient({
	baseURL: typeof window !== "undefined" ? window.location.origin : "",
	plugins: [
		twoFactorClient(),
		adminClient(),
		passkeyClient(),
		multiSessionClient(),
	],
});

// Export typed hooks for React components
export const {
	useSession,
	signIn,
	signOut,
	signUp,
	useListSessions,
} = authClient;

// Type exports
export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
