/**
 * Landing Page - EWF-ID Home
 * Follows FRONTEND_SKILL.md for bold, distinctive aesthetics
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Calendar,
  Fingerprint,
  Globe,
  Lock,
  Shield,
  Tv,
  Users,
  Vote,
} from "lucide-react";
import * as m from "@/paraglide/messages";
import { Button } from "~/components/ui/button";

export const Route = createFileRoute("/")({ component: LandingPage });

function LandingPage() {
  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Sicher",
      description:
        "Zwei-Faktor-Authentifizierung und Passkeys für maximale Sicherheit",
    },
    {
      icon: <Fingerprint className="w-8 h-8" />,
      title: "Einfach",
      description:
        "Anmeldung mit deinem Schul-Account – keine zusätzlichen Passwörter",
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: "Privat",
      description: "DSGVO-konform mit vollem Datenschutz und Transparenz",
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Überall",
      description: "Ein Account für alle EWF-Anwendungen",
    },
  ];

  const apps = [
    {
      icon: <Calendar className="w-6 h-6" />,
      name: "Termine",
      description: "Veranstaltungsplanung",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Vote className="w-6 h-6" />,
      name: "Abstimmung",
      description: "Demokratische Wahlen",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: <Users className="w-6 h-6" />,
      name: "Live",
      description: "Interaktive Q&A",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: <Tv className="w-6 h-6" />,
      name: "Screens",
      description: "Bildschirm-Steuerung",
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-3xl" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-6xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-8 inline-flex items-center justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <span className="text-3xl font-black text-white">ID</span>
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 opacity-30 blur-lg" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              EWF-ID
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 mb-4 max-w-2xl mx-auto">
            {m.app_tagline()}
          </p>

          <p className="text-slate-400 mb-10 max-w-xl mx-auto">
            {m.app_description()}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="gap-2 min-w-[180px]">
                {m.nav_login()}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="lg" className="min-w-[180px]">
                {m.nav_register()}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Warum EWF-ID?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 hover:bg-slate-800/50"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Apps Section */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Ein Account, alle Apps
          </h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Mit deinem EWF-ID hast du Zugang zu allen Anwendungen des Erstwähler
            Forums
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {apps.map((app, index) => (
              <div
                key={index}
                className="relative p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 overflow-hidden group hover:border-slate-600 transition-all"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-0 group-hover:opacity-5 transition-opacity`}
                />
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center text-white mb-4 shadow-lg`}
                >
                  {app.icon}
                </div>
                <h3 className="font-semibold text-white mb-1">{app.name}</h3>
                <p className="text-sm text-slate-400">{app.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <span className="text-sm font-bold text-white">ID</span>
              </div>
              <span className="text-slate-400 text-sm">
                {m.footer_copyright({
                  year: new Date().getFullYear().toString(),
                })}
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <Link
                to="/privacy"
                className="text-slate-400 hover:text-cyan-400 transition-colors"
              >
                {m.legal_privacy()}
              </Link>
              <Link
                to="/terms"
                className="text-slate-400 hover:text-cyan-400 transition-colors"
              >
                {m.legal_terms()}
              </Link>
              <Link
                to="/di.day"
                className="text-slate-400 hover:text-cyan-400 transition-colors"
              >
                {m.legal_diday()}
              </Link>
            </div>
          </div>

          <p className="text-center text-slate-500 text-sm mt-8">
            {m.footer_made_with()}
          </p>
        </div>
      </footer>
    </div>
  );
}
