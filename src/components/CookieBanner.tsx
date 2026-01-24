/**
 * Cookie Consent Banner
 * GDPR-compliant cookie consent with preferences
 */
import { useState, useEffect } from "react";
import { Cookie, X, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";
import * as m from "@/paraglide/messages";

// Cookie consent categories
export type CookieCategory = "essential" | "analytics" | "marketing";

export interface CookieConsent {
	essential: boolean; // Always true, required for functionality
	analytics: boolean;
	marketing: boolean;
	timestamp: string;
}

const COOKIE_CONSENT_KEY = "ewf-cookie-consent";

/**
 * Get stored cookie consent
 */
export function getStoredConsent(): CookieConsent | null {
	if (typeof window === "undefined") return null;

	try {
		const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch {
		// Invalid stored consent
	}
	return null;
}

/**
 * Store cookie consent
 */
export function storeConsent(consent: CookieConsent): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
}

/**
 * Check if analytics cookies are allowed
 */
export function analyticsAllowed(): boolean {
	const consent = getStoredConsent();
	return consent?.analytics ?? false;
}

/**
 * Cookie Banner Component
 */
export function CookieBanner() {
	const [showBanner, setShowBanner] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [consent, setConsent] = useState<CookieConsent>({
		essential: true,
		analytics: false,
		marketing: false,
		timestamp: new Date().toISOString(),
	});

	useEffect(() => {
		// Check if user has already made a choice
		const stored = getStoredConsent();
		if (!stored) {
			setShowBanner(true);
		} else {
			setConsent(stored);
		}
	}, []);

	const handleAcceptAll = () => {
		const newConsent: CookieConsent = {
			essential: true,
			analytics: true,
			marketing: true,
			timestamp: new Date().toISOString(),
		};
		setConsent(newConsent);
		storeConsent(newConsent);
		setShowBanner(false);

		// Enable PostHog if analytics accepted
		if (typeof window !== "undefined" && window.posthog) {
			// PostHog will be initialized
		}
	};

	const handleAcceptEssential = () => {
		const newConsent: CookieConsent = {
			essential: true,
			analytics: false,
			marketing: false,
			timestamp: new Date().toISOString(),
		};
		setConsent(newConsent);
		storeConsent(newConsent);
		setShowBanner(false);
	};

	const handleSavePreferences = () => {
		const newConsent = {
			...consent,
			timestamp: new Date().toISOString(),
		};
		storeConsent(newConsent);
		setShowBanner(false);
		setShowSettings(false);
	};

	if (!showBanner) return null;

	return (
		<div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800">
			<div className="max-w-4xl mx-auto">
				{!showSettings ? (
					// Main banner
					<div className="flex flex-col md:flex-row items-start md:items-center gap-4">
						<div className="flex items-start gap-3 flex-1">
							<Cookie className="w-6 h-6 text-amber-400 mt-1 flex-shrink-0" />
							<div>
								<p className="text-white font-medium mb-1">
									{m.cookie_title?.() ?? "Cookie-Einstellungen"}
								</p>
								<p className="text-sm text-slate-400">
									{m.cookie_description?.() ??
										"Wir verwenden Cookies, um deine Erfahrung zu verbessern. Einige sind notwendig, andere helfen uns die Plattform zu verbessern."}
									{" "}
									<Link
										to="/privacy"
										className="text-cyan-400 hover:text-cyan-300 underline"
									>
										{m.legal_privacy()}
									</Link>
								</p>
							</div>
						</div>

						<div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
							<button
								type="button"
								onClick={() => setShowSettings(true)}
								className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition-colors"
							>
								<Settings className="w-4 h-4" />
								{m.cookie_settings?.() ?? "Einstellungen"}
							</button>
							<button
								type="button"
								onClick={handleAcceptEssential}
								className="px-4 py-2 text-sm text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition-colors"
							>
								{m.cookie_essential_only?.() ?? "Nur notwendige"}
							</button>
							<button
								type="button"
								onClick={handleAcceptAll}
								className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
							>
								{m.cookie_accept_all?.() ?? "Alle akzeptieren"}
							</button>
						</div>
					</div>
				) : (
					// Settings panel
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold text-white">
								{m.cookie_settings_title?.() ?? "Cookie-Einstellungen"}
							</h3>
							<button
								type="button"
								onClick={() => setShowSettings(false)}
								className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="space-y-3">
							{/* Essential cookies */}
							<div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
								<div>
									<p className="font-medium text-white">
										{m.cookie_essential?.() ?? "Notwendige Cookies"}
									</p>
									<p className="text-sm text-slate-400">
										{m.cookie_essential_desc?.() ??
											"Diese Cookies sind für die Funktion der Website erforderlich und können nicht deaktiviert werden."}
									</p>
								</div>
								<div className="ml-4">
									<input
										type="checkbox"
										checked
										disabled
										className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-cyan-600"
									/>
								</div>
							</div>

							{/* Analytics cookies */}
							<div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
								<div>
									<p className="font-medium text-white">
										{m.cookie_analytics?.() ?? "Analyse-Cookies"}
									</p>
									<p className="text-sm text-slate-400">
										{m.cookie_analytics_desc?.() ??
											"Helfen uns zu verstehen, wie die Website genutzt wird (PostHog, anonymisiert)."}
									</p>
								</div>
								<div className="ml-4">
									<input
										type="checkbox"
										checked={consent.analytics}
										onChange={(e) =>
											setConsent({ ...consent, analytics: e.target.checked })
										}
										className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-cyan-600 cursor-pointer"
									/>
								</div>
							</div>

							{/* Marketing cookies (currently not used) */}
							<div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg opacity-50">
								<div>
									<p className="font-medium text-white">
										{m.cookie_marketing?.() ?? "Marketing-Cookies"}
									</p>
									<p className="text-sm text-slate-400">
										{m.cookie_marketing_desc?.() ??
											"Werden derzeit nicht verwendet."}
									</p>
								</div>
								<div className="ml-4">
									<input
										type="checkbox"
										checked={consent.marketing}
										onChange={(e) =>
											setConsent({ ...consent, marketing: e.target.checked })
										}
										disabled
										className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-cyan-600"
									/>
								</div>
							</div>
						</div>

						<div className="flex justify-end gap-2 pt-2">
							<button
								type="button"
								onClick={() => setShowSettings(false)}
								className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition-colors"
							>
								{m.common_cancel()}
							</button>
							<button
								type="button"
								onClick={handleSavePreferences}
								className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
							>
								{m.common_save()}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
