/**
 * Welcome Email Template using React-Email
 */
import {
	Button,
	Section,
	Text,
} from "@react-email/components";
import { BaseLayout } from "./base-layout";

interface WelcomeEmailProps {
	name: string;
	loginUrl: string;
	locale?: "de" | "en";
}

const translations = {
	de: {
		preview: "Willkommen bei EWF-ID!",
		greeting: (name: string) => `Willkommen, ${name}!`,
		message:
			"Dein EWF-ID Konto wurde erfolgreich erstellt. Du kannst dich jetzt bei allen EWF-Anwendungen anmelden.",
		features: [
			"🗳️ Wahlen und Abstimmungen mit EWF-Vote",
			"📅 Terminplanung mit EWF-Schedule",
			"🎤 Live-Events mit EWF-Live",
		],
		button: "Zum Dashboard",
		support:
			"Bei Fragen oder Problemen erreichst du uns unter support@ewf-stade.de",
	},
	en: {
		preview: "Welcome to EWF-ID!",
		greeting: (name: string) => `Welcome, ${name}!`,
		message:
			"Your EWF-ID account has been successfully created. You can now log in to all EWF applications.",
		features: [
			"🗳️ Voting and polls with EWF-Vote",
			"📅 Event scheduling with EWF-Schedule",
			"🎤 Live events with EWF-Live",
		],
		button: "Go to Dashboard",
		support:
			"If you have any questions, reach us at support@ewf-stade.de",
	},
};

export function WelcomeEmail({
	name,
	loginUrl,
	locale = "de",
}: WelcomeEmailProps) {
	const t = translations[locale];

	return (
		<BaseLayout preview={t.preview}>
			<Section style={styles.content}>
				<Text style={styles.heading}>{t.greeting(name)}</Text>
				<Text style={styles.message}>{t.message}</Text>
				<Section style={styles.featureList}>
					{t.features.map((feature, index) => (
						<Text key={index} style={styles.featureItem}>
							{feature}
						</Text>
					))}
				</Section>
				<Button href={loginUrl} style={styles.button}>
					{t.button}
				</Button>
				<Text style={styles.supportText}>{t.support}</Text>
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
	featureList: {
		backgroundColor: "#0f172a",
		borderRadius: "8px",
		padding: "16px 24px",
		marginBottom: "24px",
	},
	featureItem: {
		color: "#e2e8f0",
		margin: "8px 0",
		fontSize: "14px",
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
	supportText: {
		color: "#64748b",
		margin: "24px 0 0 0",
		fontSize: "14px",
	},
};

export default WelcomeEmail;
