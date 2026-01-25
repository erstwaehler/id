// removed server only, some bundle prerender keep spilling to client
import { randomUUID } from "node:crypto";
import { passkey } from "@better-auth/passkey";
import argon2 from "argon2";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
	admin as adminPlugin,
	bearer,
	haveIBeenPwned,
	multiSession,
	oAuthProxy,
	openAPI,
	twoFactor,
} from "better-auth/plugins";
import { genericOAuth } from "better-auth/plugins/generic-oauth";
import { tanstackStartCookies } from "better-auth/tanstack-start/solid";
import ms from "ms";
import env from "#env";
import { twoFactor as twoFactorTable } from "./auth/schema/audit";
import * as schema from "./auth/schema/betterauth";
import { db } from "./auth-db";
import { ac, admin, student, teacher, team, user } from "./permissions";

/**
 * EWF-ID Better Auth Configuration
 * Implements SPEC.md §6 - Plugin Implementation
 */
export const auth = betterAuth({
	appName: "Erstwähler Foundation ID",
	baseURL: env.HOST_URL,
	basePath: "/api/auth",
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: schema.user,
			session: schema.session,
			account: schema.account,
			verification: schema.verification,
			twoFactor: twoFactorTable,
			passkey: schema.passkey,
		},
	}),
	experimental: {
		joins: true,
	},
	trustedOrigins: [
		env.HOST_URL,
		"https://schedule.ewf-stade.de",
		"https://vote.ewf-stade.de",
		"https://live.ewf-stade.de",
		"https://screens.ewf-stade.de",
		"https://admin.ewf-stade.de",
	],
	secret: env.BETTER_AUTH_SECRET,

	// Email verification configuration
	emailVerification: {
		sendVerificationEmail: async (data) => {
			const verificationUrl = `${env.HOST_URL}/verify-email?token=${data.token}`;
			// await sendVerificationEmail(
			//   data.user.email,
			//   data.user.name || "Benutzer",
			//   verificationUrl,
			// );
		},
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		expiresIn: ms("1d") / 1000, // 24 hours
	},

	// Email/Password authentication (SPEC §4.1.1)
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		minPasswordLength: 12, // SPEC requirement
		maxPasswordLength: 128,
		autoSignIn: false, // Require email verification first
		sendResetPassword: async (data) => {
			const resetUrl = `${env.HOST_URL}/reset-password?token=${data.token}`;
			// await sendPasswordResetEmail(
			//   data.user.email,
			//   data.user.name || "Benutzer",
			//   resetUrl,
			// );
		},
		resetPasswordTokenExpiresIn: ms("1h") / 1000, // 1 hour
		password: {
			hash(password) {
				return argon2.hash(password);
			},
			verify(data) {
				return argon2.verify(data.hash, data.password);
			},
		},
	},

	// Plugins (SPEC §6)
	plugins: [
		// §6.1.1 - Two-Factor Authentication
		twoFactor({
			issuer: "EWF-ID",
			totpOptions: {
				digits: 6,
				period: 30,
			},
			backupCodeOptions: {
				length: 10,
				characterSet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
			},
		}),

		// §6.1.2 - Admin Plugin with RBAC
		adminPlugin({
			ac,
			roles: {
				admin,
				user,
				team,
				teacher,
				student,
			},
			impersonationSessionDuration: ms("1d") / 1000,
			defaultBanReason: "Verstoß gegen die Nutzungsbedingungen",
			defaultBanExpiresIn: ms("30d") / 1000,
			bannedUserMessage:
				"Dein Konto wurde gesperrt. Bei Fragen wende dich an support@ewf-stade.de.",
		}),

		// §6.1.3 - Passkey Support (WebAuthn)
		passkey({
			rpID: env.NODE_ENV === "production" ? "id.ewf-stade.de" : "localhost",
			rpName: "EWF-ID",
			origin: env.HOST_URL,
			authenticatorSelection: {
				authenticatorAttachment: "platform",
				residentKey: "preferred",
				userVerification: "preferred",
			},
		}),

		// §6.1.4 - Bearer Token Support
		bearer(),

		// §6.2.2 - Have I Been Pwned check
		haveIBeenPwned(),

		// §6.3.2 - Multi-Session Management
		multiSession({
			maximumSessions: 5,
		}),

		// School OIDC Providers (SPEC §4.1.2)
		genericOAuth({
			config: [
				{
					providerId: "athenaeum",
					clientId: env.OIDC_ATHENAEUM_CLIENT_ID,
					clientSecret: env.OIDC_ATHENAEUM_CLIENT_SECRET,
					discoveryUrl: `${env.OIDC_ATHENAEUM_ISSUER}/.well-known/openid-configuration`,
					scopes: ["openid", "email", "profile"],
				},
				{
					providerId: "vlg",
					clientId: env.OIDC_VLG_CLIENT_ID,
					clientSecret: env.OIDC_VLG_CLIENT_SECRET,
					discoveryUrl: `${env.OIDC_VLG_ISSUER}/.well-known/openid-configuration`,
					scopes: ["openid", "email", "profile"],
				},
				{
					providerId: "igs",
					clientId: env.OIDC_IGS_CLIENT_ID,
					clientSecret: env.OIDC_IGS_CLIENT_SECRET,
					discoveryUrl: `${env.OIDC_IGS_ISSUER}/.well-known/openid-configuration`,
					scopes: ["openid", "email", "profile"],
				},
			],
		}),

		// OAuth proxy for OIDC provider functionality
		oAuthProxy(),

		// OpenAPI documentation
		openAPI({
			path: "/api/auth/reference",
		}),

		// TanStack Start cookie handling
		tanstackStartCookies(),
	],

	// User configuration
	user: {
		changeEmail: {
			enabled: false, // GDPR: Email is immutable identifier
		},
		deleteUser: {
			enabled: true, // GDPR: Right to erasure
			sendDeleteAccountVerification: async (data) => {
				const deletionDate = new Date();
				deletionDate.setDate(deletionDate.getDate() + 14);
				const cancelUrl = `${env.HOST_URL}/cancel-deletion?token=${data.token}`;
				// await sendDeletionConfirmationEmail(
				//   data.user.email,
				//   data.user.name || "Benutzer",
				//   deletionDate,
				//   cancelUrl,
				// );
			},
		},
		additionalFields: {
			firstName: {
				type: "string",
				required: false,
			},
			lastName: {
				type: "string",
				required: false,
			},
			displayName: {
				type: "string",
				required: false,
			},
			bio: {
				type: "string",
				required: false,
			},
			school: {
				type: "string",
				required: false,
			},
			locale: {
				type: "string",
				required: false,
				defaultValue: "de",
			},
			lastLoginMethod: {
				type: "string",
				required: false,
			},
		},
	},

	// Session configuration (SPEC §4.3)
	session: {
		expiresIn: ms("2d") / 1000, // 48 hours standard
		updateAge: ms("1d") / 1000, // Refresh after 24 hours
		storeSessionInDatabase: true,
		cookieCache: {
			enabled: true,
			maxAge: ms("5min") / 1000,
		},
	},

	// Account linking configuration
	account: {
		updateAccountOnSignIn: true,
		accountLinking: {
			enabled: true,
			trustedProviders: ["athenaeum", "vlg", "igs"],
			allowDifferentEmails: false,
			allowUnlinkingAll: false,
		},
	},

	// Verification token cleanup
	verification: {
		disableCleanup: false,
	},

	// Rate limiting (SPEC §6.2.3)
	rateLimit: {
		enabled: true,
		window: ms("15min") / 1000,
		max: 100,
	},

	// Advanced configuration
	advanced: {
		crossSubDomainCookies: {
			enabled: env.NODE_ENV === "production",
			domain: ".ewf-stade.de",
		},
		cookiePrefix: "ewf_id_",
		database: {
			generateId() {
				return randomUUID();
			},
		},
	},

	// Callbacks for custom behavior
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					// Validate email domain
					// if (!isAllowedEmailDomain(user.email)) {
					//   throw new Error(
					//     "Nur E-Mail-Adressen von Partnerschulen sind erlaubt.",
					//   );
					// }

					// Auto-assign school based on email domain
					// const school = getSchoolFromEmail(user.email);
					// if (school) {
					//   return {
					//     data: {
					//       ...user,
					//       school: school.id,
					//       role: school.defaultRole,
					//     },
					//   };
					// }

					return { data: user };
				},
			},
		},
		session: {
			create: {
				after: async (session) => {
					// Track session creation for analytics
					// posthog.capture("session_created", {
					//   distinct_id: session.userId,
					//   session_id: session.id,
					// });
				},
			},
		},
	},

	// Error handling
	onAPIError: {
		throw: true,
		onError(error, _ctx) {
			// posthog.captureException(error, {
			//   tags: { module: "better-auth" },
			// });
		},
	},
});

export default auth;

// Type exports for client
export type AuthType = typeof auth;
