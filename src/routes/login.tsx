/**
 * Login Page
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import * as m from "@/paraglide/messages";
import { LoginForm } from "~/components/auth/LoginForm";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);

	const handleSuccess = () => {
		navigate({ to: "/dashboard" });
	};

	const handleError = (error: string) => {
		setError(error);
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
			{/* Background effects */}
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent" />

			<div className="relative w-full max-w-md">
				{/* Logo */}
				<div className="flex justify-center mb-8">
					<Link to="/" className="flex items-center gap-3 group">
						<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
							<span className="text-lg font-bold text-white">ID</span>
						</div>
						<span className="text-2xl font-bold text-white">EWF-ID</span>
					</Link>
				</div>

				<Card>
					<CardHeader className="text-center">
						<CardTitle>{m.auth_login_title()}</CardTitle>
						<CardDescription>{m.auth_login_subtitle()}</CardDescription>
					</CardHeader>
					<CardContent>
						{error && (
							<div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
								{error}
							</div>
						)}
						<LoginForm onSuccess={handleSuccess} onError={handleError} />

						<p className="mt-6 text-center text-sm text-slate-400">
							{m.auth_login_no_account()}{" "}
							<Link
								to="/register"
								className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
							>
								{m.auth_login_create_account()}
							</Link>
						</p>
					</CardContent>
				</Card>

				{/* Footer links */}
				<div className="mt-8 flex justify-center gap-6 text-sm text-slate-500">
					<Link
						to="/privacy"
						className="hover:text-slate-300 transition-colors"
					>
						{m.legal_privacy()}
					</Link>
					<Link to="/terms" className="hover:text-slate-300 transition-colors">
						{m.legal_terms()}
					</Link>
				</div>
			</div>
		</div>
	);
}
