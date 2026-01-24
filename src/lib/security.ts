/**
 * Security Headers Configuration
 * Implements SPEC.md §11 - Security Hardening
 */

/**
 * Security headers for the application
 * These should be set on all responses
 */
export const securityHeaders: Record<string, string> = {
	// HSTS - Force HTTPS for 1 year, include subdomains
	"Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",

	// Prevent clickjacking - only allow same-origin framing
	"X-Frame-Options": "SAMEORIGIN",

	// Prevent MIME type sniffing
	"X-Content-Type-Options": "nosniff",

	// XSS protection (legacy, but still useful for older browsers)
	"X-XSS-Protection": "1; mode=block",

	// Referrer policy - only send origin for cross-origin requests
	"Referrer-Policy": "strict-origin-when-cross-origin",

	// Permissions policy - disable unnecessary features
	"Permissions-Policy":
		"camera=(), microphone=(), geolocation=(), interest-cohort=()",

	// CSP - Content Security Policy
	// Note: 'unsafe-inline' and 'unsafe-eval' are required for TanStack Start/Vite
	// This is a known limitation of bundlers that use dynamic code evaluation.
	// For improved security in production:
	// 1. Implement nonce-based CSP with generateNonce() function below
	// 2. Use the getCSPWithNonce() function to create per-request CSP headers
	// 3. Pass the nonce to all inline scripts via data attributes
	"Content-Security-Policy": [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://eu.posthog.com https://challenges.cloudflare.com",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"font-src 'self' https://fonts.gstatic.com",
		"img-src 'self' data: blob: https:",
		"connect-src 'self' https://eu.posthog.com https://api.axiom.co https://*.better-auth.com wss:",
		"frame-src 'self' https://challenges.cloudflare.com",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'self'",
		"upgrade-insecure-requests",
	].join("; "),
};

/**
 * Generate a cryptographically secure nonce for CSP
 * Use this for nonce-based CSP when unsafe-inline is not acceptable
 */
export function generateNonce(): string {
	if (typeof crypto !== "undefined" && crypto.getRandomValues) {
		const array = new Uint8Array(16);
		crypto.getRandomValues(array);
		return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
	}
	// Fallback for environments without crypto
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let nonce = "";
	for (let i = 0; i < 32; i++) {
		nonce += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return nonce;
}

/**
 * Get CSP header with nonce for improved security
 * Use this when you can inject the nonce into all inline scripts
 */
export function getCSPWithNonce(nonce: string): string {
	return [
		"default-src 'self'",
		`script-src 'self' 'nonce-${nonce}' https://eu.posthog.com https://challenges.cloudflare.com`,
		`style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
		"font-src 'self' https://fonts.gstatic.com",
		"img-src 'self' data: blob: https:",
		"connect-src 'self' https://eu.posthog.com https://api.axiom.co https://*.better-auth.com wss:",
		"frame-src 'self' https://challenges.cloudflare.com",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'self'",
		"upgrade-insecure-requests",
	].join("; ");
}

/**
 * Rate limiting configuration per endpoint type
 * Based on SPEC.md §11.2
 */
export const rateLimitConfig = {
	// Authentication endpoints - strict limits
	auth: {
		login: {
			windowMs: 60 * 60 * 1000, // 1 hour
			maxRequests: 5,
			message: "Too many login attempts. Please try again later.",
		},
		register: {
			windowMs: 60 * 60 * 1000, // 1 hour
			maxRequests: 3,
			message: "Too many registration attempts. Please try again later.",
		},
		passwordReset: {
			windowMs: 60 * 60 * 1000, // 1 hour
			maxRequests: 3,
			message: "Too many password reset requests. Please try again later.",
		},
		twoFactor: {
			windowMs: 15 * 60 * 1000, // 15 minutes
			maxRequests: 10,
			message: "Too many 2FA attempts. Please try again later.",
		},
	},

	// API endpoints - moderate limits
	api: {
		read: {
			windowMs: 60 * 1000, // 1 minute
			maxRequests: 100,
			message: "Rate limit exceeded. Please slow down.",
		},
		write: {
			windowMs: 60 * 1000, // 1 minute
			maxRequests: 30,
			message: "Rate limit exceeded. Please slow down.",
		},
	},

	// Admin endpoints - higher limits but still protected
	admin: {
		default: {
			windowMs: 60 * 1000, // 1 minute
			maxRequests: 200,
			message: "Admin rate limit exceeded.",
		},
	},

	// OIDC endpoints
	oidc: {
		authorize: {
			windowMs: 60 * 1000, // 1 minute
			maxRequests: 20,
			message: "Too many authorization requests.",
		},
		token: {
			windowMs: 60 * 1000, // 1 minute
			maxRequests: 50,
			message: "Too many token requests.",
		},
	},
} as const;

/**
 * Input validation patterns
 * Common validation patterns for user input
 */
export const validationPatterns = {
	// Email validation (simple, works with most email addresses)
	email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

	// Password requirements: 12+ chars, upper, lower, number, special
	password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,

	// Display name: 2-50 chars, letters, spaces, hyphens, apostrophes
	displayName: /^[\p{L}\s'-]{2,50}$/u,

	// Bio: max 500 chars, no control characters
	bio: /^[^\x00-\x1F]{0,500}$/,

	// UUID v4 format
	uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,

	// API key format
	apiKey: /^ewf_[a-zA-Z0-9]{32}$/,

	// School domain validation
	schoolDomains: [
		/@athenetz\.de$/i,
		/@vlg-stade\.de$/i,
		/@igs-stade\.de$/i,
		/@ewf-stade\.de$/i,
	],
};

/**
 * Validate email against allowed school domains
 */
export function isAllowedSchoolEmail(email: string): boolean {
	return validationPatterns.schoolDomains.some((pattern) => pattern.test(email));
}

/**
 * Sanitize user input to prevent XSS
 * Note: React already escapes output, but this provides an extra layer
 */
export function sanitizeInput(input: string): string {
	return input
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#x27;")
		.replace(/\//g, "&#x2F;");
}
