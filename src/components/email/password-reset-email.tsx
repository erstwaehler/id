/**
 * Password Reset Email Template using React-Email
 */
import {
	Button,
	Link,
	Section,
	Text,
} from "@react-email/components";
import { BaseLayout } from "./base-layout";

interface PasswordResetEmailProps {
	name: string;
	resetUrl: string;
	locale?: "de" | "en";
}

const translations = {
	de: {
		preview: "Passwort zurücksetzen",
		greeting: (name: string) => `Hallo ${name}!`,
		message:
			"Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt. Klicke auf den Button unten, um ein neues Passwort festzulegen.",
		button: "Passwort zurücksetzen",
		fallback:
			"Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:",
		expiry:
			"Dieser Link ist 1 Stunde gültig. Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.",
	},
	en: {
		preview: "Reset your password",
		greeting: (name: string) => `Hello ${name}!`,
		message:
			"You have requested to reset your password. Click the button below to set a new password.",
		button: "Reset Password",
		fallback:
			"If the button doesn't work, copy this link into your browser:",
		expiry:
			"This link is valid for 1 hour. If you did not request this, you can ignore this email.",
	},
};

export function PasswordResetEmail({
	name,
	resetUrl,
	locale = "de",
}: PasswordResetEmailProps) {
	const t = translations[locale];

	return (
		<BaseLayout preview={t.preview}>
			<Section style={styles.content}>
				<Text style={styles.heading}>{t.greeting(name)}</Text>
				<Text style={styles.message}>{t.message}</Text>
				<Button href={resetUrl} style={styles.button}>
					{t.button}
				</Button>
				<Text style={styles.fallbackText}>
					{t.fallback}
					<br />
					<Link href={resetUrl} style={styles.link}>
						{resetUrl}
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

export default PasswordResetEmail;
