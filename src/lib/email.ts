/**
 * Email Service using Resend and React-Email
 * Implements SPEC.md email sending requirements
 */
import { render } from "@react-email/components";
import { Resend } from "resend";
import {
	DeletionConfirmationEmail,
	PasswordResetEmail,
	VerificationEmail,
	WelcomeEmail,
} from "~/components/email";
import env from "#env";

// Initialize Resend client
const resend = new Resend(env.RESEND_API_KEY);

interface SendEmailOptions {
	to: string;
	subject: string;
	react: React.ReactElement;
}

/**
 * Send an email using Resend with React-Email templates
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
	const { to, subject, react } = options;

	try {
		const html = await render(react);
		await resend.emails.send({
			from: env.RESEND_FROM_EMAIL,
			to,
			subject,
			html,
		});
		console.log(`[Email] Sent email to ${to}: ${subject}`);
	} catch (error) {
		console.error(`[Email] Failed to send email to ${to}:`, error);
		throw error;
	}
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
	email: string,
	name: string,
	verificationUrl: string,
	locale: "de" | "en" = "de",
): Promise<void> {
	const subject =
		locale === "de"
			? "Bestätige deine E-Mail-Adresse | EWF-ID"
			: "Confirm your email address | EWF-ID";

	await sendEmail({
		to: email,
		subject,
		react: VerificationEmail({ name, verificationUrl, locale }),
	});
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
	email: string,
	name: string,
	resetUrl: string,
	locale: "de" | "en" = "de",
): Promise<void> {
	const subject =
		locale === "de"
			? "Passwort zurücksetzen | EWF-ID"
			: "Reset your password | EWF-ID";

	await sendEmail({
		to: email,
		subject,
		react: PasswordResetEmail({ name, resetUrl, locale }),
	});
}

/**
 * Send account deletion confirmation email
 */
export async function sendDeletionConfirmationEmail(
	email: string,
	name: string,
	deletionDate: Date,
	cancelUrl: string,
	locale: "de" | "en" = "de",
): Promise<void> {
	const subject =
		locale === "de"
			? "Kontolöschung bestätigt | EWF-ID"
			: "Account deletion confirmed | EWF-ID";

	await sendEmail({
		to: email,
		subject,
		react: DeletionConfirmationEmail({ name, deletionDate, cancelUrl, locale }),
	});
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
	email: string,
	name: string,
	loginUrl: string,
	locale: "de" | "en" = "de",
): Promise<void> {
	const subject =
		locale === "de" ? "Willkommen bei EWF-ID!" : "Welcome to EWF-ID!";

	await sendEmail({
		to: email,
		subject,
		react: WelcomeEmail({ name, loginUrl, locale }),
	});
}
