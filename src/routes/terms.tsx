/**
 * Terms of Service Page
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import * as m from "@/paraglide/messages";

export const Route = createFileRoute("/terms")({ component: TermsPage });

function TermsPage() {
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

			{/* Content */}
			<main className="max-w-4xl mx-auto px-6 py-12">
				<h1 className="text-4xl font-bold text-white mb-2">
					Nutzungsbedingungen
				</h1>
				<p className="text-slate-400 mb-8">Zuletzt aktualisiert: Januar 2025</p>

				<div className="prose prose-invert prose-slate max-w-none">
					<section className="mb-12">
						<h2 className="text-2xl font-semibold text-white mb-4">
							1. Geltungsbereich
						</h2>
						<p className="text-slate-300">
							Diese Nutzungsbedingungen gelten für die Nutzung von EWF-ID, dem
							zentralen Authentifizierungssystem des Erstwähler Forums Stade.
							Mit der Registrierung und Nutzung akzeptierst du diese
							Bedingungen.
						</p>
					</section>

					<section className="mb-12">
						<h2 className="text-2xl font-semibold text-white mb-4">
							2. Berechtigung zur Nutzung
						</h2>
						<p className="text-slate-300 mb-4">
							EWF-ID steht folgenden Personen zur Verfügung:
						</p>
						<ul className="list-disc list-inside text-slate-300 space-y-2">
							<li>
								Schülerinnen und Schüler der Partnerschulen (Athenaeum, VLG,
								IGS)
							</li>
							<li>Lehrkräfte und Personal der Partnerschulen</li>
							<li>Teammitglieder des Erstwähler Forums</li>
							<li>Administratoren</li>
						</ul>
					</section>

					<section className="mb-12">
						<h2 className="text-2xl font-semibold text-white mb-4">
							3. Kontoregistrierung
						</h2>
						<p className="text-slate-300 mb-4">
							Die Registrierung erfolgt über den OIDC-Login deiner Schule. Du
							bist für die Sicherheit deines Kontos verantwortlich:
						</p>
						<ul className="list-disc list-inside text-slate-300 space-y-2">
							<li>Teile deine Zugangsdaten nicht mit anderen</li>
							<li>Verwende ein sicheres Passwort (falls zutreffend)</li>
							<li>
								Aktiviere Zwei-Faktor-Authentifizierung für zusätzliche
								Sicherheit
							</li>
							<li>Melde verdächtige Aktivitäten sofort</li>
						</ul>
					</section>

					<section className="mb-12">
						<h2 className="text-2xl font-semibold text-white mb-4">
							4. Akzeptables Verhalten
						</h2>
						<p className="text-slate-300 mb-4">
							Bei der Nutzung von EWF-ID und verbundenen Anwendungen ist
							folgendes
							<strong className="text-red-400"> nicht erlaubt</strong>:
						</p>
						<ul className="list-disc list-inside text-slate-300 space-y-2">
							<li>Versuche, das System zu hacken oder zu manipulieren</li>
							<li>Nutzung fremder Konten ohne Erlaubnis</li>
							<li>Verbreitung von Schadsoftware</li>
							<li>Spam oder Missbrauch der Kommunikationsfunktionen</li>
							<li>Verstöße gegen geltendes Recht</li>
							<li>Belästigung anderer Nutzer</li>
						</ul>
					</section>

					<section className="mb-12">
						<h2 className="text-2xl font-semibold text-white mb-4">
							5. Kontosperrung
						</h2>
						<p className="text-slate-300">
							Wir behalten uns das Recht vor, Konten zu sperren oder zu löschen
							bei:
						</p>
						<ul className="list-disc list-inside text-slate-300 space-y-2 mt-4">
							<li>Verstößen gegen diese Nutzungsbedingungen</li>
							<li>Verdacht auf Missbrauch</li>
							<li>Beendigung der Schulzugehörigkeit</li>
							<li>Anfrage des Nutzers</li>
						</ul>
					</section>

					<section className="mb-12">
						<h2 className="text-2xl font-semibold text-white mb-4">
							6. Dienstverfügbarkeit
						</h2>
						<p className="text-slate-300">
							Wir bemühen uns, EWF-ID mit einer Verfügbarkeit von 99,9%
							bereitzustellen. Geplante Wartungsarbeiten werden rechtzeitig
							angekündigt. Für Ausfälle oder Datenverlust übernehmen wir keine
							Haftung, sofern diese nicht durch grobe Fahrlässigkeit verursacht
							wurden.
						</p>
					</section>

					<section className="mb-12">
						<h2 className="text-2xl font-semibold text-white mb-4">
							7. Datenschutz
						</h2>
						<p className="text-slate-300">
							Die Verarbeitung deiner Daten erfolgt gemäß unserer{" "}
							<Link to="/privacy" className="text-cyan-400 hover:text-cyan-300">
								Datenschutzrichtlinie
							</Link>
							. Mit der Nutzung von EWF-ID stimmst du der dort beschriebenen
							Datenverarbeitung zu.
						</p>
					</section>

					<section className="mb-12">
						<h2 className="text-2xl font-semibold text-white mb-4">
							8. Änderungen
						</h2>
						<p className="text-slate-300">
							Wir können diese Nutzungsbedingungen jederzeit ändern. Wesentliche
							Änderungen werden per E-Mail oder über die Plattform angekündigt.
							Die fortgesetzte Nutzung nach Änderungen gilt als Zustimmung zu
							den neuen Bedingungen.
						</p>
					</section>

					<section className="mb-12">
						<h2 className="text-2xl font-semibold text-white mb-4">
							9. Anwendbares Recht
						</h2>
						<p className="text-slate-300">
							Es gilt deutsches Recht. Gerichtsstand ist Stade, Deutschland.
						</p>
					</section>

					<section className="mb-12">
						<h2 className="text-2xl font-semibold text-white mb-4">
							10. Kontakt
						</h2>
						<p className="text-slate-300">
							Bei Fragen zu diesen Nutzungsbedingungen wende dich an:{" "}
							<a
								href="mailto:support@ewf-stade.de"
								className="text-cyan-400 hover:text-cyan-300"
							>
								support@ewf-stade.de
							</a>
						</p>
					</section>
				</div>
			</main>

			{/* Footer */}
			<footer className="border-t border-slate-800 py-8 px-6">
				<div className="max-w-4xl mx-auto flex items-center justify-between text-sm text-slate-500">
					<span>© {new Date().getFullYear()} Erstwähler Forum Stade</span>
					<div className="flex gap-6">
						<Link
							to="/privacy"
							className="hover:text-slate-300 transition-colors"
						>
							{m.legal_privacy()}
						</Link>
						<Link
							to="/di.day"
							className="hover:text-slate-300 transition-colors"
						>
							{m.legal_diday()}
						</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}
