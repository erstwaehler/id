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
			error={new Error("Something went wrong")}
			traceId="abc123-def456-ghi789"
		/>
	),
};

export const NotFound: StoryObj = {
	render: () => <NotFoundError />,
};

export const AccessDenied: StoryObj = {
	render: () => <PermissionDenied requiredPermission="admin" />,
};

export const ErrorWithRetry: StoryObj = {
	render: () => (
		<ErrorDisplay
			error={new Error("Connection failed")}
			onRetry={() => alert("Retry clicked!")}
		/>
	),
};

export const ErrorNotFullPage: StoryObj = {
	render: () => (
		<ErrorDisplay
			error={new Error("Partial error")}
			fullPage={false}
		/>
	),
};
