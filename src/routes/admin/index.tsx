/**
 * Admin Dashboard Index Page
 * Implements SPEC.md §5.3 - Admin Dashboard Statistics
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Activity,
	AlertTriangle,
	Key,
	Settings,
	Shield,
	Users,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
	component: AdminDashboard,
});

function AdminDashboard() {
	// In a real implementation, these would be fetched from the API
	const stats = {
		totalUsers: 1247,
		activeUsers: 892,
		usersByRole: {
			student: 1089,
			teacher: 112,
			team: 34,
			admin: 12,
		},
		usersBySchool: {
			athenaeum: 523,
			vlg: 412,
			igs: 289,
			ewf: 23,
		},
		activeSessions: 156,
		failedLogins24h: 23,
		twoFactorAdoption: 34,
		apiKeys: 8,
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
			<main className="max-w-7xl mx-auto px-6 py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-white mb-2">
						Admin Dashboard
					</h1>
					<p className="text-slate-400">
						Übersicht über das EWF-ID System
					</p>
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					<StatCard
						title="Benutzer gesamt"
						value={stats.totalUsers}
						icon={<Users className="w-6 h-6" />}
						color="cyan"
					/>
					<StatCard
						title="Aktive Sessions"
						value={stats.activeSessions}
						icon={<Activity className="w-6 h-6" />}
						color="green"
					/>
					<StatCard
						title="Fehlgeschlagene Logins (24h)"
						value={stats.failedLogins24h}
						icon={<AlertTriangle className="w-6 h-6" />}
						color="red"
					/>
					<StatCard
						title="2FA Adoption"
						value={`${stats.twoFactorAdoption}%`}
						icon={<Shield className="w-6 h-6" />}
						color="blue"
					/>
				</div>

				{/* Details Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Users by Role */}
					<div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
						<h2 className="text-lg font-semibold text-white mb-4">
							Benutzer nach Rolle
						</h2>
						<div className="space-y-4">
							{Object.entries(stats.usersByRole).map(([role, count]) => (
								<div
									key={role}
									className="flex items-center justify-between"
								>
									<span className="text-slate-400 capitalize">{role}</span>
									<div className="flex items-center gap-3">
										<div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
											<div
												className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
												style={{
													width: `${(count / stats.totalUsers) * 100}%`,
												}}
											/>
										</div>
										<span className="text-white font-medium w-16 text-right">
											{count}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Users by School */}
					<div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
						<h2 className="text-lg font-semibold text-white mb-4">
							Benutzer nach Schule
						</h2>
						<div className="space-y-4">
							{Object.entries(stats.usersBySchool).map(([school, count]) => (
								<div
									key={school}
									className="flex items-center justify-between"
								>
									<span className="text-slate-400 capitalize">
										{school === "athenaeum"
											? "Gymnasium Athenaeum"
											: school === "vlg"
												? "Vincent-Lübeck-Gymnasium"
												: school === "igs"
													? "IGS Stade"
													: "EWF Admin"}
									</span>
									<div className="flex items-center gap-3">
										<div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
											<div
												className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
												style={{
													width: `${(count / stats.totalUsers) * 100}%`,
												}}
											/>
										</div>
										<span className="text-white font-medium w-16 text-right">
											{count}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Quick Actions */}
				<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
					<Link
						to="/admin/users"
						className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-cyan-500/50 transition-colors group"
					>
						<Users className="w-8 h-8 text-cyan-500 mb-3" />
						<h3 className="text-white font-semibold group-hover:text-cyan-400 transition-colors">
							Benutzer verwalten
						</h3>
						<p className="text-slate-400 text-sm mt-1">
							Benutzer anzeigen, bearbeiten und löschen
						</p>
					</Link>
					<Link
						to="/admin/audit"
						className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-cyan-500/50 transition-colors group"
					>
						<Activity className="w-8 h-8 text-cyan-500 mb-3" />
						<h3 className="text-white font-semibold group-hover:text-cyan-400 transition-colors">
							Audit Log
						</h3>
						<p className="text-slate-400 text-sm mt-1">
							Systemaktivitäten und Sicherheitsereignisse
						</p>
					</Link>
					<Link
						to="/admin/api-keys"
						className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-cyan-500/50 transition-colors group"
					>
						<Key className="w-8 h-8 text-cyan-500 mb-3" />
						<h3 className="text-white font-semibold group-hover:text-cyan-400 transition-colors">
							API Keys
						</h3>
						<p className="text-slate-400 text-sm mt-1">
							API-Schlüssel für Anwendungen verwalten
						</p>
					</Link>
				</div>
			</main>
		</div>
	);
}

interface StatCardProps {
	title: string;
	value: string | number;
	icon: React.ReactNode;
	color: "cyan" | "green" | "red" | "blue";
}

function StatCard({ title, value, icon, color }: StatCardProps) {
	const colorClasses = {
		cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400",
		green:
			"from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400",
		red: "from-red-500/20 to-red-500/5 border-red-500/30 text-red-400",
		blue: "from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400",
	};

	return (
		<div
			className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6`}
		>
			<div className="flex items-center justify-between mb-4">
				<span className={colorClasses[color].split(" ").pop()}>{icon}</span>
			</div>
			<div className="text-3xl font-bold text-white mb-1">{value}</div>
			<div className="text-slate-400 text-sm">{title}</div>
		</div>
	);
}
