/**
 * Admin System Settings Page
 * Implements SPEC.md §5.3 - System Configuration
 */
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
	Activity,
	AlertCircle,
	Bell,
	Check,
	Database,
	Globe,
	Key,
	Mail,
	Save,
	Server,
	Settings,
	Shield,
	Users,
} from "lucide-react";
import { useState } from "react";
import { authClient } from "~/lib/auth-client";

export const Route = createFileRoute("/admin/system")({
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data?.user) {
			throw redirect({ to: "/login", search: { redirect: "/admin/system" } });
		}
		// Check if user has admin role
		const role = session.data.user.role;
		if (role !== "admin") {
			throw redirect({ to: "/dashboard" });
		}
	},
	component: AdminSystemPage,
});

function AdminSystemPage() {
	const [saved, setSaved] = useState(false);

	// System configuration state
	const [config, setConfig] = useState({
		// Rate Limiting
		loginRateLimit: 5,
		loginRateLimitWindow: 15,
		registrationRateLimit: 3,
		registrationRateLimitWindow: 60,
		apiRateLimit: 100,
		apiRateLimitWindow: 1,

		// Session
		sessionDuration: 48,
		rememberMeDuration: 14,
		idleTimeout: 24,

		// Security
		minPasswordLength: 12,
		requireUppercase: true,
		requireLowercase: true,
		requireNumbers: true,
		requireSpecialChars: true,
		checkHIBP: true,
		require2FAForAdmin: true,
		require2FAForTeam: true,

		// OIDC
		accessTokenExpiry: 60,
		refreshTokenExpiry: 30,
		allowDeviceFlow: true,

		// Maintenance
		maintenanceMode: false,
		maintenanceMessage: "",
	});

	const handleSave = () => {
		setSaved(true);
		setTimeout(() => setSaved(false), 3000);
	};

	return (
		<div className="min-h-screen bg-slate-950">
			{/* Header */}
			<header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
				<div className="max-w-7xl mx-auto px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<Link
								to="/"
								className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
							>
								EWF-ID
							</Link>
							<span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-medium">
								Admin
							</span>
						</div>
						<nav className="flex items-center gap-6">
							<Link
								to="/admin/"
								className="text-slate-400 hover:text-white transition-colors"
							>
								Dashboard
							</Link>
							<Link
								to="/admin/users"
								className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
							>
								<Users className="w-4 h-4" />
								Benutzer
							</Link>
							<Link
								to="/admin/audit"
								className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
							>
								<Activity className="w-4 h-4" />
								Audit
							</Link>
							<Link
								to="/admin/api-keys"
								className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
							>
								<Key className="w-4 h-4" />
								API Keys
							</Link>
							<Link
								to="/admin/system"
								className="text-white flex items-center gap-2"
							>
								<Settings className="w-4 h-4" />
								System
							</Link>
						</nav>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-4xl mx-auto px-6 py-8">
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-3xl font-bold text-white mb-2">
							Systemeinstellungen
						</h1>
						<p className="text-slate-400">
							Konfiguriere globale Systemparameter
						</p>
					</div>
					<button
						type="button"
						onClick={handleSave}
						className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-medium hover:from-cyan-400 hover:to-blue-400 transition-colors"
					>
						{saved ? (
							<>
								<Check className="w-5 h-5" />
								Gespeichert
							</>
						) : (
							<>
								<Save className="w-5 h-5" />
								Speichern
							</>
						)}
					</button>
				</div>

				<div className="space-y-8">
					{/* Rate Limiting */}
					<section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
						<div className="flex items-center gap-3 mb-6">
							<Server className="w-6 h-6 text-cyan-400" />
							<h2 className="text-xl font-semibold text-white">Rate Limiting</h2>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label className="block text-slate-300 text-sm font-medium mb-2">
									Login Versuche
								</label>
								<div className="flex items-center gap-2">
									<input
										type="number"
										value={config.loginRateLimit}
										onChange={(e) =>
											setConfig({
												...config,
												loginRateLimit: Number.parseInt(e.target.value),
											})
										}
										className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-center focus:outline-none focus:border-cyan-500"
									/>
									<span className="text-slate-400">pro</span>
									<input
										type="number"
										value={config.loginRateLimitWindow}
										onChange={(e) =>
											setConfig({
												...config,
												loginRateLimitWindow: Number.parseInt(e.target.value),
											})
										}
										className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-center focus:outline-none focus:border-cyan-500"
									/>
									<span className="text-slate-400">Minuten</span>
								</div>
							</div>
							<div>
								<label className="block text-slate-300 text-sm font-medium mb-2">
									Registrierungen
								</label>
								<div className="flex items-center gap-2">
									<input
										type="number"
										value={config.registrationRateLimit}
										onChange={(e) =>
											setConfig({
												...config,
												registrationRateLimit: Number.parseInt(e.target.value),
											})
										}
										className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-center focus:outline-none focus:border-cyan-500"
									/>
									<span className="text-slate-400">pro</span>
									<input
										type="number"
										value={config.registrationRateLimitWindow}
										onChange={(e) =>
											setConfig({
												...config,
												registrationRateLimitWindow: Number.parseInt(
													e.target.value,
												),
											})
										}
										className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-center focus:outline-none focus:border-cyan-500"
									/>
									<span className="text-slate-400">Minuten</span>
								</div>
							</div>
							<div>
								<label className="block text-slate-300 text-sm font-medium mb-2">
									API Anfragen (pro Key)
								</label>
								<div className="flex items-center gap-2">
									<input
										type="number"
										value={config.apiRateLimit}
										onChange={(e) =>
											setConfig({
												...config,
												apiRateLimit: Number.parseInt(e.target.value),
											})
										}
										className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-center focus:outline-none focus:border-cyan-500"
									/>
									<span className="text-slate-400">pro</span>
									<input
										type="number"
										value={config.apiRateLimitWindow}
										onChange={(e) =>
											setConfig({
												...config,
												apiRateLimitWindow: Number.parseInt(e.target.value),
											})
										}
										className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-center focus:outline-none focus:border-cyan-500"
									/>
									<span className="text-slate-400">Minute(n)</span>
								</div>
							</div>
						</div>
					</section>

					{/* Session Configuration */}
					<section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
						<div className="flex items-center gap-3 mb-6">
							<Globe className="w-6 h-6 text-cyan-400" />
							<h2 className="text-xl font-semibold text-white">Sessions</h2>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div>
								<label className="block text-slate-300 text-sm font-medium mb-2">
									Standard Session
								</label>
								<div className="flex items-center gap-2">
									<input
										type="number"
										value={config.sessionDuration}
										onChange={(e) =>
											setConfig({
												...config,
												sessionDuration: Number.parseInt(e.target.value),
											})
										}
										className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-center focus:outline-none focus:border-cyan-500"
									/>
									<span className="text-slate-400">Stunden</span>
								</div>
							</div>
							<div>
								<label className="block text-slate-300 text-sm font-medium mb-2">
									"Angemeldet bleiben"
								</label>
								<div className="flex items-center gap-2">
									<input
										type="number"
										value={config.rememberMeDuration}
										onChange={(e) =>
											setConfig({
												...config,
												rememberMeDuration: Number.parseInt(e.target.value),
											})
										}
										className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-center focus:outline-none focus:border-cyan-500"
									/>
									<span className="text-slate-400">Tage</span>
								</div>
							</div>
							<div>
								<label className="block text-slate-300 text-sm font-medium mb-2">
									Idle Timeout
								</label>
								<div className="flex items-center gap-2">
									<input
										type="number"
										value={config.idleTimeout}
										onChange={(e) =>
											setConfig({
												...config,
												idleTimeout: Number.parseInt(e.target.value),
											})
										}
										className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-center focus:outline-none focus:border-cyan-500"
									/>
									<span className="text-slate-400">Stunden</span>
								</div>
							</div>
						</div>
					</section>

					{/* Security */}
					<section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
						<div className="flex items-center gap-3 mb-6">
							<Shield className="w-6 h-6 text-cyan-400" />
							<h2 className="text-xl font-semibold text-white">Sicherheit</h2>
						</div>
						<div className="space-y-6">
							<div>
								<label className="block text-slate-300 text-sm font-medium mb-2">
									Minimale Passwortlänge
								</label>
								<div className="flex items-center gap-2">
									<input
										type="number"
										value={config.minPasswordLength}
										onChange={(e) =>
											setConfig({
												...config,
												minPasswordLength: Number.parseInt(e.target.value),
											})
										}
										className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-center focus:outline-none focus:border-cyan-500"
									/>
									<span className="text-slate-400">Zeichen</span>
								</div>
							</div>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<ToggleOption
									label="Großbuchstaben"
									checked={config.requireUppercase}
									onChange={(v) =>
										setConfig({ ...config, requireUppercase: v })
									}
								/>
								<ToggleOption
									label="Kleinbuchstaben"
									checked={config.requireLowercase}
									onChange={(v) =>
										setConfig({ ...config, requireLowercase: v })
									}
								/>
								<ToggleOption
									label="Zahlen"
									checked={config.requireNumbers}
									onChange={(v) => setConfig({ ...config, requireNumbers: v })}
								/>
								<ToggleOption
									label="Sonderzeichen"
									checked={config.requireSpecialChars}
									onChange={(v) =>
										setConfig({ ...config, requireSpecialChars: v })
									}
								/>
							</div>
							<div className="pt-4 border-t border-slate-800 space-y-4">
								<ToggleOption
									label="Have I Been Pwned Check"
									description="Prüfe Passwörter gegen bekannte Datenlecks"
									checked={config.checkHIBP}
									onChange={(v) => setConfig({ ...config, checkHIBP: v })}
								/>
								<ToggleOption
									label="2FA für Admins erforderlich"
									checked={config.require2FAForAdmin}
									onChange={(v) =>
										setConfig({ ...config, require2FAForAdmin: v })
									}
								/>
								<ToggleOption
									label="2FA für Team erforderlich"
									checked={config.require2FAForTeam}
									onChange={(v) =>
										setConfig({ ...config, require2FAForTeam: v })
									}
								/>
							</div>
						</div>
					</section>

					{/* OIDC Provider */}
					<section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
						<div className="flex items-center gap-3 mb-6">
							<Key className="w-6 h-6 text-cyan-400" />
							<h2 className="text-xl font-semibold text-white">OIDC Provider</h2>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label className="block text-slate-300 text-sm font-medium mb-2">
									Access Token Gültigkeit
								</label>
								<div className="flex items-center gap-2">
									<input
										type="number"
										value={config.accessTokenExpiry}
										onChange={(e) =>
											setConfig({
												...config,
												accessTokenExpiry: Number.parseInt(e.target.value),
											})
										}
										className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-center focus:outline-none focus:border-cyan-500"
									/>
									<span className="text-slate-400">Minuten</span>
								</div>
							</div>
							<div>
								<label className="block text-slate-300 text-sm font-medium mb-2">
									Refresh Token Gültigkeit
								</label>
								<div className="flex items-center gap-2">
									<input
										type="number"
										value={config.refreshTokenExpiry}
										onChange={(e) =>
											setConfig({
												...config,
												refreshTokenExpiry: Number.parseInt(e.target.value),
											})
										}
										className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-center focus:outline-none focus:border-cyan-500"
									/>
									<span className="text-slate-400">Tage</span>
								</div>
							</div>
						</div>
						<div className="mt-4">
							<ToggleOption
								label="Device Authorization Flow erlauben"
								description="RFC 8628 für TV-Apps und IoT-Geräte"
								checked={config.allowDeviceFlow}
								onChange={(v) => setConfig({ ...config, allowDeviceFlow: v })}
							/>
						</div>
					</section>

					{/* Maintenance Mode */}
					<section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
						<div className="flex items-center gap-3 mb-6">
							<AlertCircle className="w-6 h-6 text-amber-400" />
							<h2 className="text-xl font-semibold text-white">
								Wartungsmodus
							</h2>
						</div>
						<div className="space-y-4">
							<ToggleOption
								label="Wartungsmodus aktivieren"
								description="Alle Benutzer außer Admins werden ausgesperrt"
								checked={config.maintenanceMode}
								onChange={(v) => setConfig({ ...config, maintenanceMode: v })}
							/>
							{config.maintenanceMode && (
								<div>
									<label className="block text-slate-300 text-sm font-medium mb-2">
										Wartungsnachricht
									</label>
									<textarea
										value={config.maintenanceMessage}
										onChange={(e) =>
											setConfig({ ...config, maintenanceMessage: e.target.value })
										}
										placeholder="EWF-ID wird aktuell gewartet. Bitte versuche es später erneut."
										className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none h-24"
									/>
								</div>
							)}
						</div>
					</section>

					{/* System Status */}
					<section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
						<div className="flex items-center gap-3 mb-6">
							<Database className="w-6 h-6 text-cyan-400" />
							<h2 className="text-xl font-semibold text-white">Systemstatus</h2>
						</div>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<StatusItem label="Datenbank" status="online" />
							<StatusItem label="Redis Cache" status="online" />
							<StatusItem label="Email (Resend)" status="online" />
							<StatusItem label="PostHog" status="online" />
						</div>
					</section>
				</div>
			</main>
		</div>
	);
}

interface ToggleOptionProps {
	label: string;
	description?: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}

function ToggleOption({
	label,
	description,
	checked,
	onChange,
}: ToggleOptionProps) {
	return (
		<label className="flex items-start gap-3 cursor-pointer">
			<div className="relative mt-0.5">
				<input
					type="checkbox"
					checked={checked}
					onChange={(e) => onChange(e.target.checked)}
					className="sr-only"
				/>
				<div
					className={`w-10 h-6 rounded-full transition-colors ${
						checked ? "bg-cyan-500" : "bg-slate-700"
					}`}
				>
					<div
						className={`w-4 h-4 rounded-full bg-white transform transition-transform translate-y-1 ${
							checked ? "translate-x-5" : "translate-x-1"
						}`}
					/>
				</div>
			</div>
			<div>
				<span className="text-slate-200 text-sm font-medium">{label}</span>
				{description && (
					<p className="text-slate-500 text-xs mt-0.5">{description}</p>
				)}
			</div>
		</label>
	);
}

function StatusItem({
	label,
	status,
}: { label: string; status: "online" | "offline" | "degraded" }) {
	const colors = {
		online: "bg-emerald-500",
		offline: "bg-red-500",
		degraded: "bg-amber-500",
	};

	return (
		<div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
			<div className={`w-2 h-2 rounded-full ${colors[status]}`} />
			<span className="text-slate-300 text-sm">{label}</span>
		</div>
	);
}
