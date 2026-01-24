/**
 * OAuth/OIDC Consent Screen
 * Implements SPEC.md §6.3 - Consent Screen
 */
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { CheckCircle, Shield, XCircle } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/consent")({
	component: ConsentPage,
	validateSearch: (search: Record<string, unknown>) => ({
		client_id: search.client_id as string | undefined,
		redirect_uri: search.redirect_uri as string | undefined,
		scope: search.scope as string | undefined,
		state: search.state as string | undefined,
		response_type: search.response_type as string | undefined,
	}),
});

// Mock client data - in reality this would be fetched from the database
const mockClients: Record<string, { name: string; logo?: string; description: string }> = {
	schedule: {
		name: "EWF Schedule",
		description: "Terminplanung und Eventmanagement",
	},
	vote: {
		name: "EWF Vote",
		description: "Digitales Abstimmungssystem",
	},
	live: {
		name: "EWF Live",
		description: "Live-Interaktion bei Events",
	},
	screens: {
		name: "EWF Screens",
		description: "Display-Management für Events",
	},
};

function ConsentPage() {
	const search = useSearch({ from: "/consent" });
	const [isLoading, setIsLoading] = useState(false);

	const clientId = search.client_id || "unknown";
	const client = mockClients[clientId] || { name: clientId, description: "Externe Anwendung" };
	const requestedScopes = (search.scope || "openid profile email").split(" ");

	// Map scopes to human-readable descriptions
	const scopeDescriptions: Record<string, { name: string; description: string }> = {
		openid: { name: "OpenID", description: "Deine eindeutige Benutzer-ID" },
		profile: { name: "Profil", description: "Name und Profilbild" },
		email: { name: "E-Mail", description: "Deine E-Mail-Adresse" },
		offline_access: { name: "Offline-Zugriff", description: "Dauerhafter Zugriff auch wenn du nicht eingeloggt bist" },
		"schedule:*": { name: "Schedule", description: "Vollständiger Zugriff auf Schedule-Funktionen" },
		"vote:*": { name: "Vote", description: "Vollständiger Zugriff auf Vote-Funktionen" },
		"live:*": { name: "Live", description: "Vollständiger Zugriff auf Live-Funktionen" },
		permissions: { name: "Berechtigungen", description: "Deine Rollen und Berechtigungen" },
	};

	const handleAuthorize = () => {
		setIsLoading(true);
		// In reality, this would submit the consent and redirect back with an auth code
		// For now, simulate the redirect
		setTimeout(() => {
			const redirectUri = search.redirect_uri || "/dashboard";
			const state = search.state || "";
			window.location.href = `${redirectUri}?code=mock_auth_code&state=${state}`;
		}, 1000);
	};

	const handleDeny = () => {
		setIsLoading(true);
		const redirectUri = search.redirect_uri || "/dashboard";
		const state = search.state || "";
		window.location.href = `${redirectUri}?error=access_denied&error_description=User%20denied%20access&state=${state}`;
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
				<div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
					{/* Header */}
					<div className="p-6 border-b border-slate-800 text-center">
						<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4">
							{client.logo ? (
								<img
									src={client.logo}
									alt={client.name}
									className="w-10 h-10"
								/>
							) : (
								<span className="text-2xl font-bold text-cyan-400">
									{client.name[0]}
								</span>
							)}
						</div>
						<h1 className="text-xl font-bold text-white mb-1">{client.name}</h1>
						<p className="text-slate-400 text-sm">{client.description}</p>
					</div>

					{/* Content */}
					<div className="p-6">
						<p className="text-slate-300 mb-4">
							<span className="font-medium text-white">{client.name}</span> möchte
							auf dein EWF-ID Konto zugreifen
						</p>

						{/* Requested Permissions */}
						<div className="space-y-3 mb-6">
							<p className="text-slate-400 text-sm">Diese App erhält Zugriff auf:</p>
							{requestedScopes.map((scope) => {
								const scopeInfo = scopeDescriptions[scope] || {
									name: scope,
									description: `Zugriff auf ${scope}`,
								};
								return (
									<div
										key={scope}
										className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg"
									>
										<CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
										<div>
											<div className="text-slate-200 font-medium text-sm">
												{scopeInfo.name}
											</div>
											<div className="text-slate-500 text-xs">
												{scopeInfo.description}
											</div>
										</div>
									</div>
								);
							})}
						</div>

						{/* Trust Notice */}
						<div className="flex items-start gap-3 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg mb-6">
							<Shield className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
							<p className="text-slate-400 text-xs">
								Diese Anwendung wurde von EWF verifiziert. Du kannst den Zugriff
								jederzeit unter{" "}
								<Link to="/account/apps" className="text-cyan-400 hover:underline">
									Konto-Einstellungen
								</Link>{" "}
								widerrufen.
							</p>
						</div>

						{/* Actions */}
						<div className="flex gap-3">
							<button
								type="button"
								onClick={handleDeny}
								disabled={isLoading}
								className="flex-1 py-3 bg-slate-800 rounded-xl text-slate-300 font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
							>
								<XCircle className="w-5 h-5" />
								Ablehnen
							</button>
							<button
								type="button"
								onClick={handleAuthorize}
								disabled={isLoading}
								className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white font-semibold hover:from-cyan-400 hover:to-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
							>
								<CheckCircle className="w-5 h-5" />
								Autorisieren
							</button>
						</div>
					</div>

					{/* Footer */}
					<div className="px-6 py-4 bg-slate-900/50 border-t border-slate-800 text-center">
						<p className="text-slate-500 text-xs">
							Angemeldet als{" "}
							<span className="text-slate-400">user@athenetz.de</span>
							<span className="mx-2">•</span>
							<Link to="/logout" className="text-cyan-400 hover:underline">
								Nicht du?
							</Link>
						</p>
					</div>
				</div>

				{/* Footer Links */}
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
