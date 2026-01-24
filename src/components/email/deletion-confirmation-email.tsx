/**
 * Account Deletion Confirmation Email Template using React-Email
 */
import {
	Button,
	Section,
	Text,
} from "@react-email/components";
import { BaseLayout } from "./base-layout";

interface DeletionConfirmationEmailProps {
	name: string;
	deletionDate: Date;
	cancelUrl: string;
	locale?: "de" | "en";
}

const translations = {
	de: {
		preview: "Kontolöschung bestätigt",
		greeting: (name: string) => `Hallo ${name},`,
		message: (date: string) =>
			`Du hast die Löschung deines EWF-ID Kontos beantragt. Dein Konto und alle zugehörigen Daten werden am ${date} unwiderruflich gelöscht.`,
		warning: (date: string) =>
			`⚠️ Diese Aktion kann nach dem ${date} nicht rückgängig gemacht werden.`,
		changeOfMind:
			"Falls du deine Meinung änderst, kannst du die Löschung bis zu diesem Datum abbrechen:",
		button: "Löschung abbrechen",
	},
	en: {
		preview: "Account deletion confirmed",
		greeting: (name: string) => `Hello ${name},`,
		message: (date: string) =>
			`You have requested the deletion of your EWF-ID account. Your account and all associated data will be permanently deleted on ${date}.`,
		warning: (date: string) =>
			`⚠️ This action cannot be undone after ${date}.`,
		changeOfMind:
			"If you change your mind, you can cancel the deletion until this date:",
		button: "Cancel Deletion",
	},
};

export function DeletionConfirmationEmail({
	name,
	deletionDate,
	cancelUrl,
	locale = "de",
}: DeletionConfirmationEmailProps) {
	const t = translations[locale];
	const formattedDate = deletionDate.toLocaleDateString(
		locale === "de" ? "de-DE" : "en-US",
		{
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		},
	);

	return (
		<BaseLayout
			preview={t.preview}
			headerColor="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
		>
			<Section style={styles.content}>
				<Text style={styles.heading}>{t.greeting(name)}</Text>
				<Text style={styles.message}>{t.message(formattedDate)}</Text>
				<Section style={styles.warningBox}>
					<Text style={styles.warningText}>{t.warning(formattedDate)}</Text>
				</Section>
				<Text style={styles.message}>{t.changeOfMind}</Text>
				<Button href={cancelUrl} style={styles.button}>
					{t.button}
				</Button>
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
	warningBox: {
		backgroundColor: "#fef2f2",
		border: "1px solid #fecaca",
		borderRadius: "8px",
		padding: "16px",
		marginBottom: "24px",
	},
	warningText: {
		color: "#991b1b",
		margin: 0,
		fontSize: "14px",
	},
	button: {
		display: "inline-block",
		backgroundColor: "#374151",
		color: "white",
		textDecoration: "none",
		padding: "16px 32px",
		borderRadius: "8px",
		fontWeight: 600,
		fontSize: "16px",
	},
};

export default DeletionConfirmationEmail;
