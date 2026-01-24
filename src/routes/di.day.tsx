/**
 * Digital Independence Day Page
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield, Server, Lock, Eye, Heart, Globe } from "lucide-react";
import * as m from "@/paraglide/messages";

export const Route = createFileRoute("/di.day")({ component: DiDayPage });

function DiDayPage() {
	const principles = [
		{
			icon: <Shield className="w-6 h-6" />,
			title: "Transparenz",
			description:
				"Wir zeigen dir genau, welche Daten wir sammeln und warum.",
		},
		{
			icon: <Lock className="w-6 h-6" />,
			title: "Datensparsamkeit",
			description:
				"Wir sammeln nur die Daten, die wir wirklich brauchen.",
		},
		{
			icon: <Eye className="w-6 h-6" />,
			title: "Kontrolle",
			description:
				"Du hast jederzeit die volle Kontrolle über deine Daten.",
		},
		{
			icon: <Heart className="w-6 h-6" />,
			title: "Keine Werbung",
			description:
				"Wir verkaufen keine Daten und zeigen keine personalisierte Werbung.",
		},
	];

	const subprocessors = [
		{
			name: "Vercel Inc.",
			purpose: "Hosting & CDN",
			location: "USA (mit EU-Optionen)",
			data: "Server-Logs, Performance-Metriken",
		},
		{
			name: "Neon.tech",
			purpose: "PostgreSQL Datenbank",
			location: "EU (Frankfurt)",
			data: "Alle Benutzerdaten",
		},
		{
			name: "Resend",
			purpose: "E-Mail-Versand",
			location: "USA",
			data: "E-Mail-Adressen, E-Mail-Inhalte",
		},
		{
			name: "PostHog",
			purpose: "Anonymisierte Analysen",
			location: "EU",
			data: "Anonymisierte Nutzungsdaten",
		},
		{
			name: "Axiom",
			purpose: "Log-Management",
			location: "USA/EU",
			data: "Systemlogs (ohne PII)",
		},
		{
			name: "Cloudflare",
			purpose: "CAPTCHA-Schutz",
			location: "Global",
			data: "Challenge-Antworten",
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
			{/* Header */}
			<header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
				<div className="max-w-4xl mx-auto px-6 py-4">
					<Link
						to="/"
						className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						{m.common_back()}
					</Link>
				</div>
			</header>

			{/* Hero */}
			<section className="py-20 px-6 text-center">
				<div className="max-w-4xl mx-auto">
					<div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-8">
						<Globe className="w-10 h-10 text-white" />
					</div>
					<h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
						Digital Independence Day
					</h1>
					<p className="text-xl text-slate-300 mb-4">
						Unser Bekenntnis zu digitaler Souveränität und Datenschutz
					</p>
					<p className="text-slate-400 max-w-2xl mx-auto">
						Der Digital Independence Day erinnert uns daran, dass unsere digitale
						Freiheit von bewussten Entscheidungen abhängt. Bei EWF-ID setzen wir
						uns für transparente, datenschutzfreundliche Technologie ein.
					</p>
				</div>
			</section>

			{/* Principles */}
			<section className="py-16 px-6 bg-slate-900/50">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-2xl font-bold text-white text-center mb-12">
						Unsere Prinzipien
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{principles.map((principle, index) => (
							<div
								key={index}
								className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50"
							>
								<div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-cyan-400 mb-4">
									{principle.icon}
								</div>
								<h3 className="text-lg font-semibold text-white mb-2">
									{principle.title}
								</h3>
								<p className="text-slate-400">{principle.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Subprocessors */}
			<section className="py-16 px-6">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-2xl font-bold text-white text-center mb-4">
						Unsere Auftragsverarbeiter
					</h2>
					<p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
						Diese Dienste nutzen wir, um EWF-ID bereitzustellen. Alle haben
						Datenschutzvereinbarungen (DPA) mit uns abgeschlossen.
					</p>

					<div className="space-y-4">
						{subprocessors.map((processor, index) => (
							<div
								key={index}
								className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/50"
							>
								<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
									<div>
										<h3 className="font-semibold text-white">{processor.name}</h3>
										<p className="text-sm text-cyan-400">{processor.purpose}</p>
									</div>
									<div className="text-right">
										<p className="text-sm text-slate-400">
											<Server className="w-4 h-4 inline mr-1" />
											{processor.location}
										</p>
									</div>
								</div>
								<p className="text-sm text-slate-500 mt-2">
									Verarbeitete Daten: {processor.data}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* What We Don't Do */}
			<section className="py-16 px-6 bg-slate-900/50">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-2xl font-bold text-white text-center mb-12">
						Was wir <span className="text-red-400">NICHT</span> tun
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="p-6 rounded-xl border-2 border-red-500/20 bg-red-500/5">
							<p className="text-slate-200">
								❌ Wir verkaufen niemals deine Daten
							</p>
						</div>
						<div className="p-6 rounded-xl border-2 border-red-500/20 bg-red-500/5">
							<p className="text-slate-200">
								❌ Wir tracken dich nicht im Internet
							</p>
						</div>
						<div className="p-6 rounded-xl border-2 border-red-500/20 bg-red-500/5">
							<p className="text-slate-200">
								❌ Wir sammeln keine unnötigen Daten
							</p>
						</div>
						<div className="p-6 rounded-xl border-2 border-red-500/20 bg-red-500/5">
							<p className="text-slate-200">
								❌ Wir verwenden keine Dark Patterns
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Encryption */}
			<section className="py-16 px-6">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-2xl font-bold text-white text-center mb-12">
						Technische Sicherheit
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
							<Lock className="w-8 h-8 text-green-400 mx-auto mb-4" />
							<h3 className="font-semibold text-white mb-2">TLS 1.3</h3>
							<p className="text-sm text-slate-400">
								Alle Verbindungen sind verschlüsselt
							</p>
						</div>
						<div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
							<Shield className="w-8 h-8 text-green-400 mx-auto mb-4" />
							<h3 className="font-semibold text-white mb-2">Argon2</h3>
							<p className="text-sm text-slate-400">
								Modernste Passwort-Verschlüsselung
							</p>
						</div>
						<div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
							<Server className="w-8 h-8 text-green-400 mx-auto mb-4" />
							<h3 className="font-semibold text-white mb-2">EU-Server</h3>
							<p className="text-sm text-slate-400">
								Datenbank in Frankfurt, Deutschland
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-slate-800 py-8 px-6">
				<div className="max-w-4xl mx-auto flex items-center justify-between text-sm text-slate-500">
					<span>© {new Date().getFullYear()} Erstwähler Forum Stade</span>
					<div className="flex gap-6">
						<Link to="/privacy" className="hover:text-slate-300 transition-colors">
							{m.legal_privacy()}
						</Link>
						<Link to="/terms" className="hover:text-slate-300 transition-colors">
							{m.legal_terms()}
						</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}
