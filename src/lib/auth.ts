// import "server-only"; // disabled for CLI
import { betterAuth } from "better-auth";
import {
  admin as adminPlugin,
  twoFactor,
  multiSession,
  bearer,
  jwt,
  haveIBeenPwned,
} from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import env from "#env";
import { ac, admin, user } from "./permissions";
import ms from "ms";
import argon2 from "argon2";
import { randomUUID } from "crypto";
import posthog from "posthog-js";
import { db } from "./auth-db";
import { tanstackStartCookies } from "better-auth/tanstack-start/solid";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email";

const auth = betterAuth({
  appName: "Erstwähler Foundation ID",
  baseURL: env.HOST_URL,
  basePath: "/api/auth",
  database: drizzleAdapter(db, { provider: "pg" }),
  trustedOrigins: [env.HOST_URL],
  secret: env.BETTER_AUTH_SECRET,
  
  // Email verification
  emailVerification: {
    sendVerificationEmail: async (data, request) => {
      await sendVerificationEmail({
        to: data.user.email,
        token: data.token,
        userName: data.user.name,
      });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: ms("1d") / 1000, // in Seconds
  },
  
  // Email/Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    autoSignIn: false, // Require email verification first
    sendResetPassword: async (data, request) => {
      await sendPasswordResetEmail({
        to: data.user.email,
        token: data.token,
        userName: data.user.name,
      });
    },
    resetPasswordTokenExpiresIn: ms("1h") / 1000, // in Seconds
    password: {
      hash(password) {
        return argon2.hash(password);
      },
      verify(data) {
        return argon2.verify(data.hash, data.password);
      },
    },
  },
  
  plugins: [
    // Passkey support (WebAuthn)
    passkey({
      rpID: "ewf-stade.de",
      rpName: "EWF ID",
      origin: env.HOST_URL,
      authenticatorSelection: {
        authenticatorAttachment: "platform", // Prefer platform authenticators
        residentKey: "preferred",
        userVerification: "preferred",
      },
    }),
    
    // Admin plugin with impersonation
    adminPlugin({
      ac,
      roles: {
        admin,
        user,
      },
      impersonationSessionDuration: ms("1d") / 1000,
      defaultBanReason: "Spamming or abusive behavior",
      defaultBanExpiresIn: ms("30d") / 1000,
      bannedUserMessage:
        "You have been banned from this platform. If you believe this is a mistake, please contact support.",
    }),
    
    // Two-Factor Authentication (TOTP)
    twoFactor({
      issuer: "EWF-ID",
      backupCodeLength: 10,
      backupCodeCount: 10,
    }),
    
    // Multi-Session Management
    multiSession({
      maximumSessions: 10,
    }),
    
    // Bearer token support for API access
    bearer(),
    
    // JWT tokens for OIDC
    jwt({
      expiresIn: ms("1h") / 1000,
    }),
    
    // Have I Been Pwned password checking
    haveIBeenPwned(),
    
    // TanStack Start cookies integration
    tanstackStartCookies(),
  ],
  
  user: {
    changeEmail: {
      enabled: false, // Email is immutable for GDPR tracking
    },
    deleteUser: {
      enabled: false, // GDPR: manual deletion through dashboard
    },
  },
  
  session: {
    expiresIn: ms("7d") / 1000, // 7 days
    updateAge: ms("1d") / 1000, // Update session every day
    storeSessionInDatabase: true,
    cookieCache: {
      enabled: true,
      maxAge: ms("5min") / 1000,
    },
  },
  
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["email"],
    },
  },
  
  verification: {
    disableCleanup: false,
  },
  
  advanced: {
    crossSubDomainCookies: { 
      enabled: true, 
      domain: "ewf-stade.de" 
    },
    cookiePrefix: "ewf_ID$",
    generateId(prefix) {
      return `${prefix}_${randomUUID()}`;
    },
  },
  
  onAPIError: {
    throw: true,
    onError(error, _ctx) {
      posthog.captureException(error, {
        properties: {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      });
    },
  },
});

export default auth;
// export { auth };
