/**
 * Error Boundary Components Storybook Stories
 */
import type { Meta, StoryObj } from "@storybook/react";
import {
	ErrorDisplay,
	NotFoundError,
	PermissionDenied,
} from "../ErrorBoundary";

const meta: Meta = {
	title: "Components/Error",
	parameters: {
		backgrounds: {
			default: "dark",
			values: [{ name: "dark", value: "#020617" }],
		},
	},
};

export default meta;

export const GenericError: StoryObj = {
	render: () => (
		<ErrorDisplay
			title="Etwas ist schiefgelaufen"
			message="Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut."
			traceId="abc123-def456-ghi789"
		/>
	),
};

export const NotFound: StoryObj = {
	render: () => <NotFoundError resource="Benutzer" />,
};

export const AccessDenied: StoryObj = {
	render: () => <PermissionDenied requiredRole="admin" />,
};

export const ErrorWithRetry: StoryObj = {
	render: () => (
		<ErrorDisplay
			title="Verbindungsfehler"
			message="Die Verbindung zum Server ist fehlgeschlagen."
			onRetry={() => alert("Retry clicked!")}
		/>
	),
};
