/**
 * Cookie Banner Storybook Stories
 */
import type { Meta, StoryObj } from "@storybook/react";
import { CookieBanner } from "../CookieBanner";

const meta: Meta<typeof CookieBanner> = {
	title: "Components/CookieBanner",
	component: CookieBanner,
	parameters: {
		backgrounds: {
			default: "dark",
			values: [{ name: "dark", value: "#020617" }],
		},
		layout: "fullscreen",
	},
};

export default meta;
type Story = StoryObj<typeof CookieBanner>;

export const Default: Story = {
	render: () => {
		// Clear localStorage to show banner
		if (typeof window !== "undefined") {
			localStorage.removeItem("ewf_cookie_consent");
		}
		return (
			<div className="min-h-[300px] relative">
				<CookieBanner />
			</div>
		);
	},
};
