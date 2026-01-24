/**
 * Loading and Skeleton Components
 * WCAG 2.1 AA compliant loading states
 */
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Simple spinner component
 */
export function Spinner({ className, size = "default" }: { className?: string; size?: "sm" | "default" | "lg" }) {
	const sizeClasses = {
		sm: "w-4 h-4",
		default: "w-6 h-6",
		lg: "w-8 h-8",
	};

	return (
		<Loader2
			className={cn("animate-spin text-cyan-500", sizeClasses[size], className)}
			aria-hidden="true"
		/>
	);
}

/**
 * Full page loading spinner
 */
export function PageLoader({ message }: { message?: string }) {
	return (
		<div
			className="min-h-screen flex flex-col items-center justify-center bg-slate-950"
			role="status"
			aria-live="polite"
		>
			<Spinner size="lg" />
			{message && (
				<p className="mt-4 text-slate-400">{message}</p>
			)}
			<span className="sr-only">Loading...</span>
		</div>
	);
}

/**
 * Skeleton line for text placeholders
 */
export function SkeletonLine({ className, width = "full" }: { className?: string; width?: "sm" | "md" | "lg" | "full" }) {
	const widthClasses = {
		sm: "w-1/4",
		md: "w-1/2",
		lg: "w-3/4",
		full: "w-full",
	};

	return (
		<div
			className={cn(
				"h-4 bg-slate-800 rounded animate-pulse",
				widthClasses[width],
				className
			)}
			aria-hidden="true"
		/>
	);
}

/**
 * Skeleton circle for avatars
 */
export function SkeletonCircle({ className, size = "default" }: { className?: string; size?: "sm" | "default" | "lg" }) {
	const sizeClasses = {
		sm: "w-8 h-8",
		default: "w-12 h-12",
		lg: "w-16 h-16",
	};

	return (
		<div
			className={cn(
				"rounded-full bg-slate-800 animate-pulse",
				sizeClasses[size],
				className
			)}
			aria-hidden="true"
		/>
	);
}

/**
 * Card skeleton for loading cards
 */
export function SkeletonCard({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"p-6 rounded-xl bg-slate-800/50 border border-slate-700 animate-pulse",
				className
			)}
			aria-hidden="true"
		>
			<div className="flex items-center gap-4 mb-4">
				<SkeletonCircle size="default" />
				<div className="flex-1 space-y-2">
					<SkeletonLine width="md" />
					<SkeletonLine width="sm" />
				</div>
			</div>
			<div className="space-y-2">
				<SkeletonLine width="full" />
				<SkeletonLine width="lg" />
				<SkeletonLine width="md" />
			</div>
		</div>
	);
}

/**
 * Table row skeleton
 */
export function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
	return (
		<tr className="animate-pulse" aria-hidden="true">
			{Array.from({ length: columns }).map((_, i) => (
				<td key={i} className="px-4 py-3">
					<SkeletonLine width={i === 0 ? "lg" : "md"} />
				</td>
			))}
		</tr>
	);
}

/**
 * User list skeleton
 */
export function SkeletonUserList({ count = 5 }: { count?: number }) {
	return (
		<div className="space-y-4" role="status" aria-label="Loading users">
			{Array.from({ length: count }).map((_, i) => (
				<div
					key={i}
					className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/50 animate-pulse"
				>
					<SkeletonCircle />
					<div className="flex-1 space-y-2">
						<SkeletonLine width="md" />
						<SkeletonLine width="sm" />
					</div>
					<SkeletonLine width="sm" className="w-20" />
				</div>
			))}
			<span className="sr-only">Loading users...</span>
		</div>
	);
}

/**
 * Dashboard stats skeleton
 */
export function SkeletonStats({ count = 4 }: { count?: number }) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" role="status" aria-label="Loading statistics">
			{Array.from({ length: count }).map((_, i) => (
				<div
					key={i}
					className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 animate-pulse"
				>
					<SkeletonLine width="sm" className="mb-2" />
					<div className="h-8 bg-slate-700 rounded w-1/2 mb-2" />
					<SkeletonLine width="md" />
				</div>
			))}
			<span className="sr-only">Loading statistics...</span>
		</div>
	);
}

/**
 * Inline loading indicator
 */
export function InlineLoader({ message }: { message?: string }) {
	return (
		<span className="inline-flex items-center gap-2 text-slate-400" role="status">
			<Spinner size="sm" />
			{message && <span>{message}</span>}
			<span className="sr-only">{message || "Loading..."}</span>
		</span>
	);
}

/**
 * Button loading state
 */
export function ButtonLoader() {
	return (
		<Spinner size="sm" className="text-current" />
	);
}
