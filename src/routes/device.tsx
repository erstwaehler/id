/**
 * Device Authorization Page
 * Implements SPEC.md §6.1.5 - Device Authorization (RFC 8628)
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Tv, AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/device")({
	component: DeviceAuthPage,
});

type AuthState = "input" | "loading" | "success" | "error" | "expired";

// Device auth configuration - would be fetched from API in production
const DEVICE_AUTH_TIMEOUT_MS = 1500;

function DeviceAuthPage() {
	const [code, setCode] = useState("");
	const [state, setState] = useState<AuthState>("input");
	const [appName, setAppName] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (code.length !== 8) return;

		setState("loading");

		// In production, this would call the API to verify the device code
		// For now, simulate the API call
		try {
			// TODO: Replace with actual API call
			// const response = await fetch('/api/auth/device/verify', { ... });
			await new Promise((resolve) => setTimeout(resolve, DEVICE_AUTH_TIMEOUT_MS));
			
			// Simulate API response - in production this would be server-validated
			// This is placeholder logic that should be replaced with actual device code verification
			setAppName("Pending App Authorization");
			setState("success");
		} catch {
			setError("device_error");
			setState("error");
		}
	};

	const handleAuthorize = () => {
		// In reality, this would complete the device authorization
		setState("loading");
		setTimeout(() => {
			setState("success");
		}, 1000);
	};

	const handleDeny = () => {
		setState("error");
		setError("device_denied");
	};

	const handleReset = () => {
		setCode("");
		setState("input");
		setError("");
		setAppName("");
	};

	return (
		<div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				{/* Logo */}
				<div className="text-center mb-8">
					<Link
						to="/"
						className="inline-block text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
					>
						EWF-ID
					</Link>
				</div>

				{/* Card */}
				<div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
					{state === "input" && (
						<>
							<div className="text-center mb-6">
								<div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
									<Tv className="w-8 h-8 text-cyan-400" />
								</div>
								<h1 className="text-2xl font-bold text-white mb-2">
									Gerät autorisieren
								</h1>
								<p className="text-slate-400">
									Gib den Code ein, der auf deinem Gerät angezeigt wird
								</p>
							</div>

							<form onSubmit={handleSubmit}>
								<div className="mb-6">
									<input
										type="text"
										value={code}
										onChange={(e) =>
											setCode(e.target.value.toUpperCase().slice(0, 8))
										}
										placeholder="XXXXXXXX"
										className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white text-center text-2xl font-mono tracking-widest placeholder-slate-600 focus:outline-none focus:border-cyan-500 uppercase"
										autoComplete="off"
										maxLength={8}
									/>
								</div>

								<button
									type="submit"
									disabled={code.length !== 8}
									className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white font-semibold hover:from-cyan-400 hover:to-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Weiter
								</button>
							</form>

							<div className="mt-6 p-4 bg-slate-800/50 rounded-xl">
								<h3 className="text-slate-300 font-medium mb-2">So geht's:</h3>
								<ol className="text-slate-400 text-sm space-y-1">
									<li>1. Öffne die App auf deinem Gerät</li>
									<li>2. Wähle "Mit EWF-ID anmelden"</li>
									<li>3. Gib den angezeigten Code hier ein</li>
									<li>4. Autorisiere den Zugriff</li>
								</ol>
							</div>
						</>
					)}

					{state === "loading" && (
						<div className="text-center py-8">
							<Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
							<p className="text-slate-400">Bitte warten...</p>
						</div>
					)}

					{state === "success" && appName && (
						<>
							<div className="text-center mb-6">
								<div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
									<Tv className="w-8 h-8 text-cyan-400" />
								</div>
								<h1 className="text-2xl font-bold text-white mb-2">
									Zugriff gewähren?
								</h1>
								<p className="text-slate-400">
									<span className="text-white font-medium">{appName}</span>
									<br />
									möchte auf dein EWF-ID Konto zugreifen
								</p>
							</div>

							<div className="mb-6 p-4 bg-slate-800/50 rounded-xl">
								<h3 className="text-slate-300 font-medium mb-2">
									Diese App erhält Zugriff auf:
								</h3>
								<ul className="text-slate-400 text-sm space-y-1">
									<li>• Deinen Namen und E-Mail-Adresse</li>
									<li>• Deine Schulzugehörigkeit</li>
									<li>• Schedule App Berechtigungen</li>
								</ul>
							</div>

							<div className="flex gap-3">
								<button
									type="button"
									onClick={handleDeny}
									className="flex-1 py-3 bg-slate-800 rounded-xl text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
								>
									Ablehnen
								</button>
								<button
									type="button"
									onClick={handleAuthorize}
									className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white font-semibold hover:from-cyan-400 hover:to-blue-400 transition-colors"
								>
									Autorisieren
								</button>
							</div>
						</>
					)}

					{state === "success" && !appName && (
						<div className="text-center py-8">
							<div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
								<CheckCircle className="w-8 h-8 text-emerald-400" />
							</div>
							<h1 className="text-2xl font-bold text-white mb-2">
								Gerät autorisiert!
							</h1>
							<p className="text-slate-400 mb-6">
								Du kannst dieses Fenster jetzt schließen und zur App zurückkehren.
							</p>
							<Link
								to="/dashboard"
								className="inline-block px-6 py-3 bg-slate-800 rounded-xl text-slate-300 font-medium hover:bg-slate-700 transition-colors"
							>
								Zum Dashboard
							</Link>
						</div>
					)}

					{(state === "error" || state === "expired") && (
						<div className="text-center py-8">
							<div
								className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
									state === "expired"
										? "bg-amber-500/10"
										: "bg-red-500/10"
								}`}
							>
								{state === "expired" ? (
									<AlertCircle className="w-8 h-8 text-amber-400" />
								) : (
									<XCircle className="w-8 h-8 text-red-400" />
								)}
							</div>
							<h1
								className={`text-2xl font-bold mb-2 ${
									state === "expired" ? "text-amber-400" : "text-red-400"
								}`}
							>
								{state === "expired" ? "Code abgelaufen" : "Fehler"}
							</h1>
							<p className="text-slate-400 mb-6">{error}</p>
							<button
								type="button"
								onClick={handleReset}
								className="px-6 py-3 bg-slate-800 rounded-xl text-slate-300 font-medium hover:bg-slate-700 transition-colors"
							>
								Erneut versuchen
							</button>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="text-center mt-6">
					<Link to="/privacy" className="text-slate-500 text-sm hover:text-slate-400">
						Datenschutz
					</Link>
					<span className="text-slate-700 mx-2">•</span>
					<Link to="/terms" className="text-slate-500 text-sm hover:text-slate-400">
						Nutzungsbedingungen
					</Link>
				</div>
			</div>
		</div>
	);
}
