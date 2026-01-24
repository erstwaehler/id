/**
 * Login Form Component
 * Handles email/password login with validation
 */
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Key, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { authClient } from "~/lib/auth-client";

interface LoginFormProps {
	onSuccess?: () => void;
	onError?: (error: string) => void;
}

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

	const validateForm = () => {
		const newErrors: { email?: string; password?: string } = {};

		if (!email) {
			newErrors.email = "E-Mail ist erforderlich";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			newErrors.email = "Ungültige E-Mail-Adresse";
		}

		if (!password) {
			newErrors.password = "Passwort ist erforderlich";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) return;

		setIsLoading(true);
		try {
			const result = await authClient.signIn.email({
				email,
				password,
			});

			if (result.error) {
				onError?.(result.error.message || "Anmeldung fehlgeschlagen");
			} else {
				onSuccess?.();
			}
		} catch (error) {
			onError?.("Ein unerwarteter Fehler ist aufgetreten");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSchoolLogin = (school: string) => {
		authClient.signIn.social({
			provider: school,
			callbackURL: "/dashboard",
		});
	};

	const handlePasskeyLogin = async () => {
		setIsLoading(true);
		try {
			const result = await authClient.signIn.passkey();
			if (result.error) {
				onError?.(result.error.message || "Passkey-Anmeldung fehlgeschlagen");
			} else {
				onSuccess?.();
			}
		} catch (error) {
			onError?.("Passkey-Authentifizierung fehlgeschlagen");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* School OIDC Buttons */}
			<div className="space-y-3">
				<Button
					type="button"
					variant="outline"
					className="w-full justify-start gap-3"
					onClick={() => handleSchoolLogin("athenaeum")}
					disabled={isLoading}
				>
					<span className="w-8 h-8 flex items-center justify-center rounded bg-blue-600 text-white text-xs font-bold">
						A
					</span>
					<span className="flex-1 text-left">Gymnasium Athenaeum</span>
					<ArrowRight className="w-4 h-4 text-slate-400" />
				</Button>

				<Button
					type="button"
					variant="outline"
					className="w-full justify-start gap-3"
					onClick={() => handleSchoolLogin("vlg")}
					disabled={isLoading}
				>
					<span className="w-8 h-8 flex items-center justify-center rounded bg-green-600 text-white text-xs font-bold">
						V
					</span>
					<span className="flex-1 text-left">Vincent Lübeck Gymnasium</span>
					<ArrowRight className="w-4 h-4 text-slate-400" />
				</Button>

				<Button
					type="button"
					variant="outline"
					className="w-full justify-start gap-3"
					onClick={() => handleSchoolLogin("igs")}
					disabled={isLoading}
				>
					<span className="w-8 h-8 flex items-center justify-center rounded bg-purple-600 text-white text-xs font-bold">
						I
					</span>
					<span className="flex-1 text-left">IGS Stade</span>
					<ArrowRight className="w-4 h-4 text-slate-400" />
				</Button>
			</div>

			{/* Passkey Login */}
			<Button
				type="button"
				variant="secondary"
				className="w-full gap-2"
				onClick={handlePasskeyLogin}
				disabled={isLoading}
			>
				<Key className="w-4 h-4" />
				Mit Passkey anmelden
			</Button>

			<div className="relative">
				<Separator />
				<span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 px-3 text-xs text-slate-500">
					oder mit E-Mail
				</span>
			</div>

			{/* Email/Password Form */}
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="email">E-Mail-Adresse</Label>
					<div className="relative">
						<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
						<Input
							id="email"
							type="email"
							placeholder="max.mustermann@athenetz.de"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							error={errors.email}
							className="pl-10"
							disabled={isLoading}
						/>
					</div>
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="password">Passwort</Label>
						<Link
							to="/forgot-password"
							className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
						>
							Passwort vergessen?
						</Link>
					</div>
					<div className="relative">
						<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
						<Input
							id="password"
							type={showPassword ? "text" : "password"}
							placeholder="••••••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							error={errors.password}
							className="pl-10 pr-10"
							disabled={isLoading}
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
						>
							{showPassword ? (
								<EyeOff className="w-5 h-5" />
							) : (
								<Eye className="w-5 h-5" />
							)}
						</button>
					</div>
				</div>

				<Button type="submit" className="w-full" isLoading={isLoading}>
					Anmelden
				</Button>
			</form>
		</div>
	);
}
