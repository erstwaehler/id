/**
 * EWF-ID Auth Client
 * Client-side authentication utilities for React components
 */

import { passkeyClient } from "@better-auth/passkey/client";
import {
  adminClient,
  genericOAuthClient,
  multiSessionClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

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
    genericOAuthClient(),
  ],
});

// Export typed hooks for React components
export const { useSession, signIn, signOut, signUp } = authClient;

// Type exports
export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
