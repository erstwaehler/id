/**
 * Register Page
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { SchoolSelector } from "~/components/auth/SchoolSelector";
import { authClient } from "~/lib/auth-client";
import * as m from "@/paraglide/messages";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
	const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleContinue = async () => {
		if (!selectedSchool) return;

		setIsLoading(true);
		try {
			await authClient.signIn.social({
				provider: selectedSchool,
				callbackURL: "/dashboard",
			});
		} catch (error) {
			console.error("Registration error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
			{/* Background effects */}
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent" />

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
						<CardTitle>{m.auth_register_title()}</CardTitle>
						<CardDescription>{m.auth_register_subtitle()}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* School Selection */}
						<div>
							<p className="text-sm text-slate-400 mb-4">
								{m.auth_register_school_select()}
							</p>
							<SchoolSelector
								value={selectedSchool ?? undefined}
								onChange={setSelectedSchool}
								disabled={isLoading}
							/>
						</div>

						{/* Info box */}
						<div className="flex gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
							<Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
							<p className="text-sm text-blue-300">
								{m.auth_register_info()}
							</p>
						</div>

						{/* Continue button */}
						<Button
							onClick={handleContinue}
							disabled={!selectedSchool || isLoading}
							isLoading={isLoading}
							className="w-full gap-2"
						>
							{m.auth_register_continue()}
							<ArrowRight className="w-4 h-4" />
						</Button>

						{/* Terms */}
						<p className="text-center text-xs text-slate-500">
							{m.auth_register_terms()}{" "}
							<Link to="/terms" className="text-cyan-400 hover:underline">
								{m.auth_register_terms_link()}
							</Link>{" "}
							{m.auth_register_and()}{" "}
							<Link to="/privacy" className="text-cyan-400 hover:underline">
								{m.auth_register_privacy_link()}
							</Link>
						</p>

						{/* Sign in link */}
						<p className="text-center text-sm text-slate-400">
							{m.auth_register_have_account()}{" "}
							<Link
								to="/login"
								className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
							>
								{m.auth_register_sign_in()}
							</Link>
						</p>
					</CardContent>
				</Card>

				{/* Footer links */}
				<div className="mt-8 flex justify-center gap-6 text-sm text-slate-500">
					<Link to="/privacy" className="hover:text-slate-300 transition-colors">
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
