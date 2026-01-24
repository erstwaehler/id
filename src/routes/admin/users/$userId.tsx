/**
 * Admin User Detail/Edit Page
 * Implements SPEC.md §5.3 - User Detail Management
 */
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
	Activity,
	ArrowLeft,
	Ban,
	Check,
	Key,
	Mail,
	Save,
	Settings,
	Shield,
	Trash2,
	UserCog,
	Users,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/admin/users/$userId")({
	component: AdminUserDetailPage,
});

function AdminUserDetailPage() {
	const { userId } = useParams({ from: "/admin/users/$userId" });
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	// Mock user data - would be fetched from API
	const [user, setUser] = useState({
		id: userId,
		email: "max.mustermann@athenetz.de",
		firstName: "Max",
		lastName: "Mustermann",
		displayName: null as string | null,
		bio: "",
		school: "athenaeum",
		role: "student",
		createdAt: "2025-01-15T10:30:00Z",
		lastLoginAt: "2025-01-23T14:22:00Z",
		twoFactorEnabled: true,
		emailVerified: true,
		banned: false,
		banReason: null as string | null,
		banExpiresAt: null as string | null,
	});

	const handleSave = async () => {
		setIsSaving(true);
		// In reality, this would call the API
		await new Promise((resolve) => setTimeout(resolve, 1000));
		setIsSaving(false);
		setIsEditing(false);
	};

	const handleBan = () => {
		// In reality, this would call the API
		setUser({ ...user, banned: true, banReason: "Admin action" });
	};

	const handleUnban = () => {
		// In reality, this would call the API
		setUser({ ...user, banned: false, banReason: null });
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
			<main className="max-w-4xl mx-auto px-6 py-8">
				{/* Back Button */}
				<Link
					to="/admin/users"
					className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
				>
					<ArrowLeft className="w-4 h-4" />
					Zurück zur Übersicht
				</Link>

				{/* User Header */}
				<div className="flex items-start justify-between mb-8">
					<div className="flex items-center gap-6">
						<div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold">
							{user.firstName[0]}
							{user.lastName[0]}
						</div>
						<div>
							<div className="flex items-center gap-3 mb-1">
								<h1 className="text-2xl font-bold text-white">
									{user.displayName || `${user.firstName} ${user.lastName}`}
								</h1>
								<RoleBadge role={user.role} />
								{user.banned && (
									<span className="px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
										Gesperrt
									</span>
								)}
							</div>
							<p className="text-slate-400">{user.email}</p>
							<p className="text-slate-500 text-sm mt-1">
								Mitglied seit{" "}
								{new Date(user.createdAt).toLocaleDateString("de-DE")}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{isEditing ? (
							<>
								<button
									type="button"
									onClick={() => setIsEditing(false)}
									className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
								>
									Abbrechen
								</button>
								<button
									type="button"
									onClick={handleSave}
									disabled={isSaving}
									className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-medium hover:from-cyan-400 hover:to-blue-400 transition-colors disabled:opacity-50"
								>
									{isSaving ? (
										"Speichern..."
									) : (
										<>
											<Save className="w-4 h-4" />
											Speichern
										</>
									)}
								</button>
							</>
						) : (
							<button
								type="button"
								onClick={() => setIsEditing(true)}
								className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg text-white font-medium hover:bg-slate-700 transition-colors"
							>
								Bearbeiten
							</button>
						)}
					</div>
				</div>

				{/* User Details */}
				<div className="space-y-6">
					{/* Basic Info */}
					<section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
						<h2 className="text-lg font-semibold text-white mb-4">
							Grundinformationen
						</h2>
						<div className="grid grid-cols-2 gap-6">
							<div>
								<label className="block text-slate-400 text-sm mb-2">
									Vorname
								</label>
								{isEditing ? (
									<input
										type="text"
										value={user.firstName}
										onChange={(e) =>
											setUser({ ...user, firstName: e.target.value })
										}
										className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
									/>
								) : (
									<p className="text-white">{user.firstName}</p>
								)}
							</div>
							<div>
								<label className="block text-slate-400 text-sm mb-2">
									Nachname
								</label>
								{isEditing ? (
									<input
										type="text"
										value={user.lastName}
										onChange={(e) =>
											setUser({ ...user, lastName: e.target.value })
										}
										className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
									/>
								) : (
									<p className="text-white">{user.lastName}</p>
								)}
							</div>
							<div>
								<label className="block text-slate-400 text-sm mb-2">
									Anzeigename
								</label>
								{isEditing ? (
									<input
										type="text"
										value={user.displayName || ""}
										onChange={(e) =>
											setUser({ ...user, displayName: e.target.value || null })
										}
										placeholder="Optional"
										className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
									/>
								) : (
									<p className="text-white">
										{user.displayName || (
											<span className="text-slate-500">Nicht gesetzt</span>
										)}
									</p>
								)}
							</div>
							<div>
								<label className="block text-slate-400 text-sm mb-2">
									E-Mail
								</label>
								<p className="text-white">{user.email}</p>
							</div>
							<div>
								<label className="block text-slate-400 text-sm mb-2">
									Schule
								</label>
								{isEditing ? (
									<select
										value={user.school}
										onChange={(e) => setUser({ ...user, school: e.target.value })}
										className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
									>
										<option value="athenaeum">Gymnasium Athenaeum</option>
										<option value="vlg">Vincent-Lübeck-Gymnasium</option>
										<option value="igs">IGS Stade</option>
										<option value="ewf">EWF Admin</option>
									</select>
								) : (
									<p className="text-white">
										{user.school === "athenaeum"
											? "Gymnasium Athenaeum"
											: user.school === "vlg"
												? "Vincent-Lübeck-Gymnasium"
												: user.school === "igs"
													? "IGS Stade"
													: "EWF Admin"}
									</p>
								)}
							</div>
							<div>
								<label className="block text-slate-400 text-sm mb-2">Rolle</label>
								{isEditing ? (
									<select
										value={user.role}
										onChange={(e) => setUser({ ...user, role: e.target.value })}
										className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
									>
										<option value="student">Schüler</option>
										<option value="teacher">Lehrer</option>
										<option value="team">Team</option>
										<option value="admin">Admin</option>
									</select>
								) : (
									<RoleBadge role={user.role} />
								)}
							</div>
						</div>
					</section>

					{/* Security Status */}
					<section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
						<h2 className="text-lg font-semibold text-white mb-4">
							Sicherheitsstatus
						</h2>
						<div className="grid grid-cols-2 gap-4">
							<div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg">
								<div
									className={`w-10 h-10 rounded-lg flex items-center justify-center ${
										user.emailVerified
											? "bg-emerald-500/20"
											: "bg-amber-500/20"
									}`}
								>
									<Mail
										className={`w-5 h-5 ${
											user.emailVerified
												? "text-emerald-400"
												: "text-amber-400"
										}`}
									/>
								</div>
								<div>
									<p className="text-white font-medium">E-Mail</p>
									<p
										className={`text-sm ${
											user.emailVerified
												? "text-emerald-400"
												: "text-amber-400"
										}`}
									>
										{user.emailVerified ? "Verifiziert" : "Nicht verifiziert"}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg">
								<div
									className={`w-10 h-10 rounded-lg flex items-center justify-center ${
										user.twoFactorEnabled
											? "bg-emerald-500/20"
											: "bg-slate-700"
									}`}
								>
									<Shield
										className={`w-5 h-5 ${
											user.twoFactorEnabled
												? "text-emerald-400"
												: "text-slate-500"
										}`}
									/>
								</div>
								<div>
									<p className="text-white font-medium">2FA</p>
									<p
										className={`text-sm ${
											user.twoFactorEnabled
												? "text-emerald-400"
												: "text-slate-500"
										}`}
									>
										{user.twoFactorEnabled ? "Aktiviert" : "Deaktiviert"}
									</p>
								</div>
							</div>
						</div>
					</section>

					{/* Admin Actions */}
					<section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
						<h2 className="text-lg font-semibold text-white mb-4">
							Admin-Aktionen
						</h2>
						<div className="flex flex-wrap gap-3">
							<button
								type="button"
								className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors"
							>
								<UserCog className="w-4 h-4" />
								Impersonieren
							</button>
							{user.banned ? (
								<button
									type="button"
									onClick={handleUnban}
									className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/30 transition-colors"
								>
									<Check className="w-4 h-4" />
									Entsperren
								</button>
							) : (
								<button
									type="button"
									onClick={handleBan}
									className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 hover:bg-amber-500/30 transition-colors"
								>
									<Ban className="w-4 h-4" />
									Sperren
								</button>
							)}
							<button
								type="button"
								className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
							>
								<Trash2 className="w-4 h-4" />
								Löschen
							</button>
						</div>
						{user.banned && user.banReason && (
							<div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
								<p className="text-red-400 text-sm">
									<strong>Sperrgrund:</strong> {user.banReason}
								</p>
								{user.banExpiresAt && (
									<p className="text-red-400 text-sm mt-1">
										<strong>Läuft ab:</strong>{" "}
										{new Date(user.banExpiresAt).toLocaleDateString("de-DE")}
									</p>
								)}
							</div>
						)}
					</section>

					{/* Activity */}
					<section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
						<h2 className="text-lg font-semibold text-white mb-4">Aktivität</h2>
						<div className="space-y-3">
							<div className="flex items-center justify-between text-sm">
								<span className="text-slate-400">Registriert</span>
								<span className="text-white">
									{new Date(user.createdAt).toLocaleDateString("de-DE", {
										day: "2-digit",
										month: "long",
										year: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</span>
							</div>
							<div className="flex items-center justify-between text-sm">
								<span className="text-slate-400">Letzter Login</span>
								<span className="text-white">
									{user.lastLoginAt
										? new Date(user.lastLoginAt).toLocaleDateString("de-DE", {
												day: "2-digit",
												month: "long",
												year: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											})
										: "Nie"}
								</span>
							</div>
						</div>
					</section>
				</div>
			</main>
		</div>
	);
}

function RoleBadge({ role }: { role: string }) {
	const colors = {
		student: "bg-slate-500/20 text-slate-300 border-slate-500/30",
		teacher: "bg-blue-500/20 text-blue-300 border-blue-500/30",
		team: "bg-purple-500/20 text-purple-300 border-purple-500/30",
		admin: "bg-red-500/20 text-red-300 border-red-500/30",
	};

	const labels = {
		student: "Schüler",
		teacher: "Lehrer",
		team: "Team",
		admin: "Admin",
	};

	return (
		<span
			className={`px-2 py-1 rounded-md text-xs font-medium border ${colors[role as keyof typeof colors] || colors.student}`}
		>
			{labels[role as keyof typeof labels] || role}
		</span>
	);
}
