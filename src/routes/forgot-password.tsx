/**
 * Forgot Password Page
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle, Mail } from "lucide-react";
import { useState } from "react";
import * as m from "@/paraglide/messages";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { authClient } from "~/lib/auth-client";

export const Route = createFileRoute("/forgot-password")({
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			await authClient.forgetPassword({
				email,
				redirectTo: "/reset-password",
			});
			setIsSuccess(true);
		} catch (_err) {
			setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
		} finally {
			setIsLoading(false);
		}
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
						<CardTitle>{m.auth_forgot_password_title()}</CardTitle>
						<CardDescription>
							{m.auth_forgot_password_subtitle()}
						</CardDescription>
					</CardHeader>
					<CardContent>
						{isSuccess ? (
							<div className="text-center space-y-6">
								<div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
									<CheckCircle className="w-8 h-8 text-green-400" />
								</div>
								<div>
									<h3 className="text-lg font-semibold text-white mb-2">
										E-Mail gesendet!
									</h3>
									<p className="text-slate-400">
										{m.auth_forgot_password_success()}
									</p>
								</div>
								<Link
									to="/login"
									className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
								>
									<ArrowLeft className="w-4 h-4" />
									{m.auth_forgot_password_back()}
								</Link>
							</div>
						) : (
							<form onSubmit={handleSubmit} className="space-y-6">
								{error && (
									<div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
										{error}
									</div>
								)}

								<div className="space-y-2">
									<Label htmlFor="email">{m.auth_login_email()}</Label>
									<div className="relative">
										<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
										<Input
											id="email"
											type="email"
											placeholder="max.mustermann@athenetz.de"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											className="pl-10"
											disabled={isLoading}
											required
										/>
									</div>
								</div>

								<Button
									type="submit"
									className="w-full"
									isLoading={isLoading}
									disabled={!email}
								>
									{m.auth_forgot_password_submit()}
								</Button>

								<Link
									to="/login"
									className="block text-center text-sm text-slate-400 hover:text-cyan-400 transition-colors"
								>
									<ArrowLeft className="w-4 h-4 inline mr-2" />
									{m.auth_forgot_password_back()}
								</Link>
							</form>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
