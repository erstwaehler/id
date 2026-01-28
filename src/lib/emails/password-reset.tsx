/**
 * Password Reset Email Template
 * Built with React-Email for EWF-ID
 */
import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Section,
	Text,
} from "@react-email/components";

interface PasswordResetEmailProps {
	name: string;
	resetUrl: string;
}

export function PasswordResetEmail({
	name,
	resetUrl,
}: PasswordResetEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>Passwort zurücksetzen für EWF-ID</Preview>
			<Body style={main}>
				<Container style={container}>
					<Heading style={heading}>EWF-ID</Heading>
					<Section style={section}>
						<Text style={text}>Hallo {name},</Text>
						<Text style={text}>
							Du hast eine Passwort-Zurücksetzung angefordert. Klicke auf den
							Button unten, um ein neues Passwort zu setzen.
						</Text>
						<Button style={button} href={resetUrl}>
							Passwort zurücksetzen
						</Button>
						<Text style={smallText}>
							Dieser Link ist 1 Stunde gültig. Wenn du keine Zurücksetzung
							angefordert hast, ignoriere diese E-Mail.
						</Text>
					</Section>
					<Hr style={hr} />
					<Text style={footer}>
						Erstwähler Foundation | <Link href="https://ewf-stade.de">ewf-stade.de</Link>
					</Text>
				</Container>
			</Body>
		</Html>
	);
}

// Styles
const main = {
	backgroundColor: "#f6f9fc",
	fontFamily:
		'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
	backgroundColor: "#ffffff",
	margin: "0 auto",
	padding: "20px 0 48px",
	marginBottom: "64px",
	maxWidth: "600px",
};

const heading = {
	color: "#0f172a",
	fontSize: "24px",
	fontWeight: "700",
	textAlign: "center" as const,
	margin: "30px 0",
};

const section = {
	padding: "24px",
};

const text = {
	color: "#334155",
	fontSize: "16px",
	lineHeight: "26px",
	margin: "16px 0",
};

const smallText = {
	color: "#64748b",
	fontSize: "14px",
	lineHeight: "22px",
	margin: "16px 0",
};

const button = {
	backgroundColor: "#0f172a",
	borderRadius: "6px",
	color: "#ffffff",
	display: "block",
	fontSize: "16px",
	fontWeight: "600",
	textAlign: "center" as const,
	textDecoration: "none",
	padding: "12px 24px",
	margin: "24px auto",
};

const hr = {
	borderColor: "#e2e8f0",
	margin: "20px 0",
};

const footer = {
	color: "#8898aa",
	fontSize: "12px",
	textAlign: "center" as const,
};

export default PasswordResetEmail;
