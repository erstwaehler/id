/**
 * Verification Email Template using React-Email
 */
import {
	Button,
	Link,
	Section,
	Text,
} from "@react-email/components";
import { BaseLayout } from "./base-layout";

interface VerificationEmailProps {
	name: string;
	verificationUrl: string;
	locale?: "de" | "en";
}

const translations = {
	de: {
		preview: "Bestätige deine E-Mail-Adresse",
		greeting: (name: string) => `Hallo ${name}!`,
		message:
			"Vielen Dank für deine Registrierung bei EWF-ID. Bitte bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren.",
		button: "E-Mail bestätigen",
		fallback:
			"Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:",
		expiry: "Dieser Link ist 24 Stunden gültig.",
	},
	en: {
		preview: "Confirm your email address",
		greeting: (name: string) => `Hello ${name}!`,
		message:
			"Thank you for registering with EWF-ID. Please confirm your email address to activate your account.",
		button: "Confirm Email",
		fallback:
			"If the button doesn't work, copy this link into your browser:",
		expiry: "This link is valid for 24 hours.",
	},
};

export function VerificationEmail({
	name,
	verificationUrl,
	locale = "de",
}: VerificationEmailProps) {
	const t = translations[locale];

	return (
		<BaseLayout preview={t.preview}>
			<Section style={styles.content}>
				<Text style={styles.heading}>{t.greeting(name)}</Text>
				<Text style={styles.message}>{t.message}</Text>
				<Button href={verificationUrl} style={styles.button}>
					{t.button}
				</Button>
				<Text style={styles.fallbackText}>
					{t.fallback}
					<br />
					<Link href={verificationUrl} style={styles.link}>
						{verificationUrl}
					</Link>
				</Text>
				<Text style={styles.expiryText}>{t.expiry}</Text>
			</Section>
		</BaseLayout>
	);
}

const styles = {
	content: {
		padding: "40px 32px",
	},
	heading: {
		color: "#f1f5f9",
		margin: "0 0 16px 0",
		fontSize: "24px",
	},
	message: {
		color: "#94a3b8",
		margin: "0 0 24px 0",
		lineHeight: 1.6,
	},
	button: {
		display: "inline-block",
		background: "linear-gradient(135deg, #0891b2 0%, #2563eb 100%)",
		color: "white",
		textDecoration: "none",
		padding: "16px 32px",
		borderRadius: "8px",
		fontWeight: 600,
		fontSize: "16px",
	},
	fallbackText: {
		color: "#64748b",
		margin: "32px 0 0 0",
		fontSize: "14px",
		lineHeight: 1.6,
	},
	link: {
		color: "#06b6d4",
		wordBreak: "break-all" as const,
	},
	expiryText: {
		color: "#64748b",
		margin: "24px 0 0 0",
		fontSize: "14px",
	},
};

export default VerificationEmail;
