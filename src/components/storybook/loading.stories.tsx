/**
 * Loading Components Storybook Stories
 */
import type { Meta, StoryObj } from "@storybook/react";
import {
	Spinner,
	PageLoader,
	SkeletonLine,
	SkeletonCircle,
	SkeletonCard,
	SkeletonUserList,
	SkeletonStats,
	InlineLoader,
	ButtonLoader,
} from "../Loading";

const meta: Meta = {
	title: "Components/Loading",
	parameters: {
		backgrounds: {
			default: "dark",
			values: [{ name: "dark", value: "#020617" }],
		},
	},
};

export default meta;

// Spinner Stories
export const SpinnerSmall: StoryObj = {
	render: () => <Spinner size="sm" />,
};

export const SpinnerDefault: StoryObj = {
	render: () => <Spinner size="default" />,
};

export const SpinnerLarge: StoryObj = {
	render: () => <Spinner size="lg" />,
};

// PageLoader Story
export const FullPageLoader: StoryObj = {
	render: () => (
		<div className="h-[400px]">
			<PageLoader message="Lade Daten..." />
		</div>
	),
};

// Skeleton Stories
export const SkeletonLines: StoryObj = {
	render: () => (
		<div className="space-y-4 p-4">
			<SkeletonLine width="full" />
			<SkeletonLine width="lg" />
			<SkeletonLine width="md" />
			<SkeletonLine width="sm" />
		</div>
	),
};

export const SkeletonCircles: StoryObj = {
	render: () => (
		<div className="flex gap-4 p-4">
			<SkeletonCircle size="sm" />
			<SkeletonCircle size="default" />
			<SkeletonCircle size="lg" />
		</div>
	),
};

export const CardSkeleton: StoryObj = {
	render: () => (
		<div className="max-w-md">
			<SkeletonCard />
		</div>
	),
};

export const UserListSkeleton: StoryObj = {
	render: () => (
		<div className="max-w-lg">
			<SkeletonUserList count={3} />
		</div>
	),
};

export const StatsSkeleton: StoryObj = {
	render: () => <SkeletonStats count={4} />,
};

// Inline Loaders
export const InlineLoaderStory: StoryObj = {
	render: () => <InlineLoader message="Wird geladen..." />,
};

export const ButtonLoaderStory: StoryObj = {
	render: () => (
		<button
			type="button"
			className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg"
			disabled
		>
			<ButtonLoader />
			Speichern...
		</button>
	),
};
