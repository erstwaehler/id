/**
 * EWF-ID Auth Client
 * Client-side authentication utilities for React components
 */

import { passkeyClient } from "@better-auth/passkey/client";
import {
  adminClient,
  apiKeyClient,
  genericOAuthClient,
  multiSessionClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import env from "#env";

/**
 * Get base URL for auth client
 * Uses window.location.origin on client, env.VITE_HOST_URL on server
 */
function getBaseURL(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return env.VITE_HOST_URL;
}

/**
 * Auth client with all required plugins
 */
export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [
    twoFactorClient(),
    adminClient(),
    passkeyClient(),
    multiSessionClient(),
    genericOAuthClient(),
    apiKeyClient(),
  ],
});

// Export typed hooks for React components
export const { useSession, signIn, signOut, signUp } = authClient;

// Type exports
export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
