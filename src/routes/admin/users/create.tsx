/**
 * Admin Create User Page
 * Implements SPEC.md §5.3 - User Creation
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	Activity,
	AlertCircle,
	ArrowLeft,
	Key,
	Plus,
	Settings,
	Users,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/admin/users/create")({
	component: AdminCreateUserPage,
});

function AdminCreateUserPage() {
	const navigate = useNavigate();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [formData, setFormData] = useState({
		email: "",
		firstName: "",
		lastName: "",
		displayName: "",
		school: "athenaeum",
		role: "student",
		sendInviteEmail: true,
		setTemporaryPassword: false,
		temporaryPassword: "",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			// Validate email domain
			const email = formData.email.toLowerCase();
			const validDomains = [
				"athenetz.de",
				"vlg-stade.de",
				"igs-stade.de",
				"ewf-stade.de",
			];
			const domain = email.split("@")[1];
			if (!validDomains.includes(domain)) {
				throw new Error(
					"Nur E-Mail-Adressen von Partnerschulen sind erlaubt",
				);
			}

			// In reality, this would call the API
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Navigate back to users list
			navigate({ to: "/admin/users" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
		} finally {
			setIsSubmitting(false);
		}
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
								className="text-white flex items-center gap-2"
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
								className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
							>
								<Settings className="w-4 h-4" />
								System
							</Link>
						</nav>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-2xl mx-auto px-6 py-8">
				{/* Back Button */}
				<Link
					to="/admin/users"
					className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
				>
					<ArrowLeft className="w-4 h-4" />
					Zurück zur Übersicht
				</Link>

				{/* Form */}
				<div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
					<div className="flex items-center gap-3 mb-6">
						<div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
							<Plus className="w-5 h-5 text-cyan-400" />
						</div>
						<div>
							<h1 className="text-xl font-bold text-white">
								Neuen Benutzer erstellen
							</h1>
							<p className="text-slate-400 text-sm">
								Erstelle ein neues Benutzerkonto
							</p>
						</div>
					</div>

					{error && (
						<div className="flex items-center gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/30 rounded-lg">
							<AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
							<p className="text-red-400 text-sm">{error}</p>
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Email */}
						<div>
							<label className="block text-slate-300 text-sm font-medium mb-2">
								E-Mail-Adresse *
							</label>
							<input
								type="email"
								required
								value={formData.email}
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
								placeholder="max.mustermann@athenetz.de"
								className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
							/>
							<p className="text-slate-500 text-xs mt-1">
								Nur E-Mail-Adressen von Partnerschulen (athenetz.de, vlg-stade.de,
								igs-stade.de, ewf-stade.de)
							</p>
						</div>

						{/* Name */}
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-slate-300 text-sm font-medium mb-2">
									Vorname *
								</label>
								<input
									type="text"
									required
									value={formData.firstName}
									onChange={(e) =>
										setFormData({ ...formData, firstName: e.target.value })
									}
									placeholder="Max"
									className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
								/>
							</div>
							<div>
								<label className="block text-slate-300 text-sm font-medium mb-2">
									Nachname *
								</label>
								<input
									type="text"
									required
									value={formData.lastName}
									onChange={(e) =>
										setFormData({ ...formData, lastName: e.target.value })
									}
									placeholder="Mustermann"
									className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
								/>
							</div>
						</div>

						{/* Display Name */}
						<div>
							<label className="block text-slate-300 text-sm font-medium mb-2">
								Anzeigename (optional)
							</label>
							<input
								type="text"
								value={formData.displayName}
								onChange={(e) =>
									setFormData({ ...formData, displayName: e.target.value })
								}
								placeholder="Max M."
								className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
							/>
						</div>

						{/* School & Role */}
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-slate-300 text-sm font-medium mb-2">
									Schule *
								</label>
								<select
									value={formData.school}
									onChange={(e) =>
										setFormData({ ...formData, school: e.target.value })
									}
									className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
								>
									<option value="athenaeum">Gymnasium Athenaeum</option>
									<option value="vlg">Vincent-Lübeck-Gymnasium</option>
									<option value="igs">IGS Stade</option>
									<option value="ewf">EWF Admin</option>
								</select>
							</div>
							<div>
								<label className="block text-slate-300 text-sm font-medium mb-2">
									Rolle *
								</label>
								<select
									value={formData.role}
									onChange={(e) =>
										setFormData({ ...formData, role: e.target.value })
									}
									className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
								>
									<option value="student">Schüler</option>
									<option value="teacher">Lehrer</option>
									<option value="team">Team</option>
									<option value="admin">Admin</option>
								</select>
							</div>
						</div>

						{/* Options */}
						<div className="space-y-3 pt-4 border-t border-slate-800">
							<label className="flex items-center gap-3 cursor-pointer">
								<input
									type="checkbox"
									checked={formData.sendInviteEmail}
									onChange={(e) =>
										setFormData({
											...formData,
											sendInviteEmail: e.target.checked,
										})
									}
									className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
								/>
								<div>
									<span className="text-slate-200 text-sm">
										Einladungs-E-Mail senden
									</span>
									<p className="text-slate-500 text-xs">
										Der Benutzer erhält eine E-Mail mit Login-Anweisungen
									</p>
								</div>
							</label>

							<label className="flex items-center gap-3 cursor-pointer">
								<input
									type="checkbox"
									checked={formData.setTemporaryPassword}
									onChange={(e) =>
										setFormData({
											...formData,
											setTemporaryPassword: e.target.checked,
										})
									}
									className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
								/>
								<div>
									<span className="text-slate-200 text-sm">
										Temporäres Passwort setzen
									</span>
									<p className="text-slate-500 text-xs">
										Statt eines Einladungslinks wird ein temporäres Passwort
										gesetzt
									</p>
								</div>
							</label>

							{formData.setTemporaryPassword && (
								<div className="ml-7 mt-2">
									<input
										type="text"
										required
										value={formData.temporaryPassword}
										onChange={(e) =>
											setFormData({
												...formData,
												temporaryPassword: e.target.value,
											})
										}
										placeholder="Temporäres Passwort"
										className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
									/>
									<p className="text-amber-400 text-xs mt-1">
										⚠️ Der Benutzer muss das Passwort bei der ersten Anmeldung
										ändern
									</p>
								</div>
							)}
						</div>

						{/* Submit */}
						<div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
							<Link
								to="/admin/users"
								className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
							>
								Abbrechen
							</Link>
							<button
								type="submit"
								disabled={isSubmitting}
								className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-medium hover:from-cyan-400 hover:to-blue-400 transition-colors disabled:opacity-50"
							>
								{isSubmitting ? (
									"Erstellen..."
								) : (
									<>
										<Plus className="w-4 h-4" />
										Benutzer erstellen
									</>
								)}
							</button>
						</div>
					</form>
				</div>
			</main>
		</div>
	);
}
