// import "server-only"; // disabled for CLI
import { betterAuth } from "better-auth";
import {
  username,
  admin as adminPlugin,
  haveIBeenPwned,
} from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import env from "#env";
import { ac, admin, user } from "./permissions";
import ms from "ms";
// import argon2 from "argon2";
import { randomUUID } from "crypto";
import posthog from "posthog-js";
import { db } from "./auth-db";
import { tanstackStartCookies } from "better-auth/tanstack-start/solid";

const auth = betterAuth({
  appName: "Erstwähler Foundation ID",
  baseURL: env.HOST_URL,
  basePath: "/api/auth",
  database: drizzleAdapter(db, { provider: "pg" }),
  trustedOrigins: [env.HOST_URL],
  secret: env.BETTER_AUTH_SECRET,
  // emailVerification: {
  //   sendVerificationEmail(data, request) {
  //     return Promise.resolve();
  //   },
  //   sendOnSignUp: true,
  //   autoSignInAfterVerification: true,
  //   expiresIn: ms("1d") / 1000, // in Seconds
  // },
  emailAndPassword: {
    enabled: false,
    // disableSignUp: false,
    // requireEmailVerification: true,
    // minPasswordLength: 8,
    // maxPasswordLength: 128,
    // autoSignIn: true,
    // sendResetPassword(data, request) {
    //   return Promise.resolve();
    // },
    // resetPasswordTokenExpiresIn: ms("1h") / 1000, // in Seconds
    // password: {
    //   hash(password) {
    //     return argon2.hash(password);
    //   },
    //   verify(data) {
    //     return argon2.verify(data.hash, data.password);
    //   },
    // },
  },
  plugins: [
    passkey({
      rpID: "ewf-id",
      rpName: "EWF ID",
      origin: env.HOST_URL,
      authenticatorSelection: {
        authenticatorAttachment: "cross-platform", // Use platform for platform authenticators
        residentKey: "preferred", // Encourage credential storage but not mandatory
        userVerification: "preferred", // Encourage user verification but not mandatory
      },
    }),
    adminPlugin({
      ac,
      roles: {
        admin,
        user,
      },
      impersonationSessionDuration: ms("1d") / 1000, // in Seconds
      defaultBanReason: "Spamming or abusive behavior",
      defaultBanExpiresIn: ms("30d") / 1000, // in Seconds
      bannedUserMessage:
        "You have been banned from this platform. If you believe this is a mistake, please contact support.",
    }),
    haveIBeenPwned(),
    tanstackStartCookies(),
  ],
  user: {
    changeEmail: {
      enabled: false,
    },
    deleteUser: {
      enabled: false, // # DSGVO: machen wir manuell im dash.
      // sendDeleteAccountVerification(data, request) {
      //   return Promise.resolve();
      // },
      // beforeDelete(user, request) {
      //   return Promise.resolve();
      // },
      // afterDelete(user, request) {
      //   return Promise.resolve();
      // },
    },
  },
  session: {
    expiresIn: ms("7d") / 1000, // in Seconds
    updateAge: ms("1d") / 1000, // in Seconds
    disableSessionRefresh: true,
    storeSessionInDatabase: true,
    cookieCache: {
      enabled: true,
      maxAge: ms("5min") / 1000, // in Seconds
    },
  },
  account: {
    updateAccountOnSignIn: true,
    accountLinking: {
      enabled: true,
      trustedProviders: ["email-password", "github", "google"],
      allowDifferentEmails: false,
      allowUnlinkingAll: false,
    },
  },
  verification: {
    disableCleanup: false,
  },
  // rateLimit: {
  //   enabled: true,
  //   window: ms("10s") / 1000, // in Seconds
  //   max: 100, // Maximum requests per window
  //   storage: "secondary-storage",
  // },
  advanced: {
    crossSubDomainCookies: { enabled: true, domain: "ewf-stade.de" },
    cookiePrefix: "ewf_ID$",
    database: {
      generateId(options) {
        return randomUUID();
      },
    },
  },
  onAPIError: {
    throw: true, // When Thrown Posthog should catch it
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
