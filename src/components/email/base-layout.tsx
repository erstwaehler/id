/**
 * Base Email Layout Component using React-Email
 * Implements SPEC.md email styling requirements
 */
import {
	Body,
	Container,
	Head,
	Html,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import type * as React from "react";

interface BaseLayoutProps {
	children: React.ReactNode;
	preview: string;
	headerColor?: string;
}

export function BaseLayout({
	children,
	preview,
	headerColor = "linear-gradient(135deg, #0891b2 0%, #2563eb 100%)",
}: BaseLayoutProps) {
	return (
		<Html>
			<Head />
			<Preview>{preview}</Preview>
			<Body style={styles.body}>
				<Container style={styles.container}>
					<Section
						style={{
							...styles.header,
							background: headerColor,
						}}
					>
						<Text style={styles.headerText}>EWF-ID</Text>
					</Section>
					{children}
					<Section style={styles.footer}>
						<Text style={styles.footerText}>
							© {new Date().getFullYear()} Erstwähler Forum Stade
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}

const styles = {
	body: {
		fontFamily:
			"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
		backgroundColor: "#0f172a",
		margin: 0,
		padding: "40px 20px",
	},
	container: {
		maxWidth: "600px",
		margin: "0 auto",
		backgroundColor: "#1e293b",
		borderRadius: "16px",
		overflow: "hidden",
		border: "1px solid #334155",
	},
	header: {
		padding: "32px",
		textAlign: "center" as const,
	},
	headerText: {
		color: "white",
		margin: 0,
		fontSize: "28px",
		fontWeight: 700,
	},
	footer: {
		backgroundColor: "#0f172a",
		padding: "24px 32px",
		textAlign: "center" as const,
		borderTop: "1px solid #334155",
	},
	footerText: {
		color: "#64748b",
		margin: 0,
		fontSize: "12px",
	},
};
