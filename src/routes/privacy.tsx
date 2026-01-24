/**
 * Privacy Policy Page
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail } from "lucide-react";
import * as m from "@/paraglide/messages";

export const Route = createFileRoute("/privacy")({ component: PrivacyPage });

function PrivacyPage() {
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
          Datenschutzrichtlinie
        </h1>
        <p className="text-slate-400 mb-8">Zuletzt aktualisiert: Januar 2025</p>

        <div className="prose prose-invert prose-slate max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">
              1. Verantwortliche Stelle
            </h2>
            <p className="text-slate-300 mb-4">
              Verantwortlich für die Datenverarbeitung ist das Erstwähler Forum
              Stade.
            </p>
            <p className="text-slate-300">
              Kontakt für Datenschutzanfragen:{" "}
              <a
                href="mailto:compliance@ewf-stade.de"
                className="text-cyan-400 hover:text-cyan-300"
              >
                compliance@ewf-stade.de
              </a>
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">
              2. Welche Daten wir erheben
            </h2>
            <h3 className="text-lg font-medium text-slate-200 mb-2">
              Personenbezogene Daten
            </h3>
            <ul className="list-disc list-inside text-slate-300 mb-4 space-y-1">
              <li>E-Mail-Adresse (von deiner Schule)</li>
              <li>Vor- und Nachname</li>
              <li>Schulzugehörigkeit</li>
              <li>Profilbild (optional)</li>
            </ul>

            <h3 className="text-lg font-medium text-slate-200 mb-2">
              Technische Daten
            </h3>
            <ul className="list-disc list-inside text-slate-300 mb-4 space-y-1">
              <li>IP-Adresse (nur für Sicherheitszwecke)</li>
              <li>Browser- und Geräteinformationen</li>
              <li>Anmeldezeitpunkte</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">
              3. Zweck der Datenverarbeitung
            </h2>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>Bereitstellung der Authentifizierungsdienste</li>
              <li>Sicherheit und Betrugsprävention</li>
              <li>Verbesserung der Benutzererfahrung</li>
              <li>
                Kommunikation (Passwort-Rücksetzung, wichtige
                Benachrichtigungen)
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">
              4. Datenweitergabe
            </h2>
            <p className="text-slate-300 mb-4">Wir teilen deine Daten mit:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>
                EWF-Anwendungen (Termine, Abstimmung, Live, Screens) - über OIDC
              </li>
              <li>Unseren Auftragsverarbeitern (siehe unten)</li>
            </ul>
            <p className="text-slate-300 mt-4">
              <strong className="text-slate-200">
                Wir verkaufen niemals deine Daten an Dritte.
              </strong>
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">
              5. Auftragsverarbeiter
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="font-medium text-white">Vercel Inc.</p>
                <p className="text-sm text-slate-400">Hosting und CDN</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="font-medium text-white">Neon.tech</p>
                <p className="text-sm text-slate-400">
                  Datenbank (EU-Frankfurt)
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="font-medium text-white">Resend</p>
                <p className="text-sm text-slate-400">E-Mail-Versand</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="font-medium text-white">PostHog</p>
                <p className="text-sm text-slate-400">
                  Anonymisierte Analysen (EU)
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">
              6. Deine Rechte
            </h2>
            <p className="text-slate-300 mb-4">
              Du hast folgende Rechte bezüglich deiner Daten:
            </p>
            <div className="space-y-3">
              <a
                href="mailto:compliance@ewf-stade.de?subject=Recht auf Einsicht"
                className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 transition-colors"
              >
                <Mail className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="font-medium text-white">Recht auf Einsicht</p>
                  <p className="text-sm text-slate-400">
                    Erfahre, welche Daten wir über dich speichern
                  </p>
                </div>
              </a>
              <a
                href="mailto:compliance@ewf-stade.de?subject=Recht auf Löschung"
                className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 transition-colors"
              >
                <Mail className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="font-medium text-white">Recht auf Löschung</p>
                  <p className="text-sm text-slate-400">
                    Beantrage die Löschung deiner Daten
                  </p>
                </div>
              </a>
              <a
                href="mailto:compliance@ewf-stade.de?subject=Recht auf Berichtigung"
                className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 transition-colors"
              >
                <Mail className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="font-medium text-white">
                    Recht auf Berichtigung
                  </p>
                  <p className="text-sm text-slate-400">
                    Korrigiere fehlerhafte Daten
                  </p>
                </div>
              </a>
              <a
                href="mailto:compliance@ewf-stade.de?subject=Datenübertragbarkeit"
                className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 transition-colors"
              >
                <Mail className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="font-medium text-white">Datenübertragbarkeit</p>
                  <p className="text-sm text-slate-400">
                    Erhalte deine Daten in einem maschinenlesbaren Format
                  </p>
                </div>
              </a>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">
              7. Datenspeicherung
            </h2>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>
                <strong className="text-slate-200">Aktive Konten:</strong> Dauer
                des EWF-Projekts + 1 Jahr
              </li>
              <li>
                <strong className="text-slate-200">Gelöschte Konten:</strong>{" "}
                Sofortige Soft-Löschung, endgültige Löschung nach 14 Tagen
              </li>
              <li>
                <strong className="text-slate-200">Protokolle:</strong> 7-90
                Tage je nach Typ
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">
              8. Kontakt
            </h2>
            <p className="text-slate-300">
              Bei Fragen zum Datenschutz wende dich an:{" "}
              <a
                href="mailto:compliance@ewf-stade.de"
                className="text-cyan-400 hover:text-cyan-300"
              >
                compliance@ewf-stade.de
              </a>
            </p>
            <p className="text-slate-400 mt-2">
              Wir antworten innerhalb von 72 Stunden.
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
              to="/terms"
              className="hover:text-slate-300 transition-colors"
            >
              {m.legal_terms()}
            </Link>
            <Link
              to="/di-day"
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
