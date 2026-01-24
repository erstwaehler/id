/**
 * Error Boundary and Error Display Components
 * Provides user-friendly error handling
 */
import { Component, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Home, RefreshCw, Bug } from "lucide-react";
import * as m from "@/paraglide/messages";
import { captureError } from "@/lib/analytics";
import { getCurrentTraceId } from "@/lib/otel";

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	traceId: string | null;
}

/**
 * React Error Boundary
 * Catches errors in child components and displays a fallback UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null, traceId: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return {
			hasError: true,
			error,
			traceId: getCurrentTraceId() ?? null,
		};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		// Track the error with PostHog and OTEL
		captureError(error, {
			componentStack: errorInfo.componentStack,
			traceId: this.state.traceId,
		});

		// Log error
		console.error("Error Boundary caught error:", error, errorInfo);
	}

	handleRetry = () => {
		this.setState({ hasError: false, error: null, traceId: null });
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<ErrorDisplay
					error={this.state.error}
					traceId={this.state.traceId}
					onRetry={this.handleRetry}
				/>
			);
		}

		return this.props.children;
	}
}

/**
 * Error Display Component
 * User-friendly error message with actions
 */
export function ErrorDisplay({
	error,
	traceId,
	onRetry,
	fullPage = true,
}: {
	error?: Error | null;
	traceId?: string | null;
	onRetry?: () => void;
	fullPage?: boolean;
}) {
	const containerClass = fullPage
		? "min-h-screen flex items-center justify-center bg-slate-950 px-4"
		: "flex items-center justify-center p-8";

	return (
		<div className={containerClass}>
			<div className="max-w-md w-full text-center">
				<div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
					<AlertTriangle className="w-8 h-8 text-red-400" />
				</div>

				<h1 className="text-2xl font-bold text-white mb-2">
					{m.error_page_title?.() ?? "Something went wrong"}
				</h1>

				<p className="text-slate-400 mb-6">
					{m.error_page_description?.() ??
						"An unexpected error occurred. Please try again."}
				</p>

				{/* Error details (only in development) */}
				{process.env.NODE_ENV === "development" && error && (
					<div className="mb-6 p-4 bg-slate-800/50 rounded-lg text-left">
						<p className="text-sm font-mono text-red-400 mb-2">
							{error.name}: {error.message}
						</p>
						{error.stack && (
							<pre className="text-xs text-slate-500 overflow-auto max-h-32">
								{error.stack}
							</pre>
						)}
					</div>
				)}

				{/* Trace ID for support */}
				{traceId && (
					<div className="mb-6 p-3 bg-slate-800/50 rounded-lg">
						<p className="text-xs text-slate-500 mb-1">
							Error Reference (for support):
						</p>
						<code className="text-sm text-slate-300 font-mono">{traceId}</code>
					</div>
				)}

				<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
					{onRetry && (
						<button
							type="button"
							onClick={onRetry}
							className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
						>
							<RefreshCw className="w-4 h-4" />
							{m.error_try_again?.() ?? "Try again"}
						</button>
					)}

					<Link
						to="/"
						className="flex items-center gap-2 px-4 py-2 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors"
					>
						<Home className="w-4 h-4" />
						{m.error_go_home?.() ?? "Go home"}
					</Link>
				</div>

				{/* Report bug link */}
				<a
					href={`mailto:support@ewf-stade.de?subject=Bug Report&body=Error Reference: ${traceId ?? "N/A"}%0A%0APlease describe what you were doing when this error occurred:`}
					className="inline-flex items-center gap-2 mt-6 text-sm text-slate-500 hover:text-slate-400 transition-colors"
				>
					<Bug className="w-4 h-4" />
					Report this issue
				</a>
			</div>
		</div>
	);
}

/**
 * 404 Not Found Component
 */
export function NotFoundError() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
			<div className="max-w-md w-full text-center">
				<div className="text-8xl font-bold text-slate-800 mb-4">404</div>

				<h1 className="text-2xl font-bold text-white mb-2">
					{m.error_not_found_title?.() ?? "Page not found"}
				</h1>

				<p className="text-slate-400 mb-6">
					{m.error_not_found_description?.() ??
						"The page you're looking for doesn't exist."}
				</p>

				<Link
					to="/"
					className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
				>
					<Home className="w-4 h-4" />
					{m.error_go_home?.() ?? "Go home"}
				</Link>
			</div>
		</div>
	);
}

/**
 * Permission Denied Component
 */
export function PermissionDenied({ requiredPermission }: { requiredPermission?: string }) {
	return (
		<div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
			<div className="max-w-md w-full text-center">
				<div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
					<AlertTriangle className="w-8 h-8 text-amber-400" />
				</div>

				<h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>

				<p className="text-slate-400 mb-6">
					You don't have permission to access this page.
					{requiredPermission && (
						<span className="block mt-2 text-sm text-slate-500">
							Required: {requiredPermission}
						</span>
					)}
				</p>

				<Link
					to="/dashboard"
					className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
				>
					<Home className="w-4 h-4" />
					Go to Dashboard
				</Link>
			</div>
		</div>
	);
}
