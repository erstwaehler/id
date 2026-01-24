/**
 * 404 Not Found Page
 * Catches all unmatched routes
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, ArrowLeft, Search } from "lucide-react";

export const Route = createFileRoute("/$catchall")({
	component: NotFoundPage,
});

function NotFoundPage() {
	return (
		<div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
			<div className="max-w-md w-full text-center">
				{/* 404 Graphic */}
				<div className="mb-8">
					<div className="text-9xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
						404
					</div>
					<div className="text-2xl font-semibold text-white mt-4">
						Seite nicht gefunden
					</div>
					<p className="text-slate-400 mt-2">
						Die angeforderte Seite existiert nicht oder wurde verschoben.
					</p>
				</div>

				{/* Actions */}
				<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
					<Link
						to="/"
						className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-medium hover:from-cyan-400 hover:to-blue-400 transition-colors w-full sm:w-auto justify-center"
					>
						<Home className="w-5 h-5" />
						Zur Startseite
					</Link>
					<button
						type="button"
						onClick={() => window.history.back()}
						className="flex items-center gap-2 px-6 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white font-medium hover:bg-slate-700 transition-colors w-full sm:w-auto justify-center"
					>
						<ArrowLeft className="w-5 h-5" />
						Zurück
					</button>
				</div>

				{/* Help Links */}
				<div className="mt-12 pt-8 border-t border-slate-800">
					<p className="text-slate-500 text-sm mb-4">
						Hilfreiche Links:
					</p>
					<div className="flex flex-wrap justify-center gap-4 text-sm">
						<Link
							to="/login"
							className="text-cyan-400 hover:text-cyan-300 transition-colors"
						>
							Anmelden
						</Link>
						<Link
							to="/register"
							className="text-cyan-400 hover:text-cyan-300 transition-colors"
						>
							Registrieren
						</Link>
						<Link
							to="/dashboard"
							className="text-cyan-400 hover:text-cyan-300 transition-colors"
						>
							Dashboard
						</Link>
						<Link
							to="/privacy"
							className="text-cyan-400 hover:text-cyan-300 transition-colors"
						>
							Datenschutz
						</Link>
					</div>
				</div>

				{/* EWF-ID Branding */}
				<div className="mt-8">
					<Link
						to="/"
						className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
					>
						EWF-ID
					</Link>
				</div>
			</div>
		</div>
	);
}
