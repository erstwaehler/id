/**
 * Admin User Management Page
 * Implements SPEC.md §5.3 - User Management
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Activity,
	ChevronLeft,
	ChevronRight,
	Edit,
	Eye,
	Key,
	MoreVertical,
	Plus,
	Search,
	Settings,
	Shield,
	Trash2,
	UserCog,
	Users,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/admin/users")({
	component: AdminUsersPage,
});

interface User {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	displayName: string | null;
	school: string;
	role: string;
	createdAt: string;
	lastLoginAt: string | null;
	twoFactorEnabled: boolean;
	emailVerified: boolean;
}

// Mock data - would be fetched from API
const mockUsers: User[] = [
	{
		id: "1",
		email: "max.mustermann@athenetz.de",
		firstName: "Max",
		lastName: "Mustermann",
		displayName: null,
		school: "athenaeum",
		role: "student",
		createdAt: "2025-01-15T10:30:00Z",
		lastLoginAt: "2025-01-23T14:22:00Z",
		twoFactorEnabled: true,
		emailVerified: true,
	},
	{
		id: "2",
		email: "anna.schmidt@vlg-stade.de",
		firstName: "Anna",
		lastName: "Schmidt",
		displayName: "Anna S.",
		school: "vlg",
		role: "teacher",
		createdAt: "2025-01-10T08:15:00Z",
		lastLoginAt: "2025-01-22T09:45:00Z",
		twoFactorEnabled: false,
		emailVerified: true,
	},
	{
		id: "3",
		email: "team@ewf-stade.de",
		firstName: "Team",
		lastName: "EWF",
		displayName: "EWF Team",
		school: "ewf",
		role: "team",
		createdAt: "2025-01-01T00:00:00Z",
		lastLoginAt: "2025-01-23T16:00:00Z",
		twoFactorEnabled: true,
		emailVerified: true,
	},
	{
		id: "4",
		email: "admin@ewf-stade.de",
		firstName: "Admin",
		lastName: "EWF",
		displayName: null,
		school: "ewf",
		role: "admin",
		createdAt: "2025-01-01T00:00:00Z",
		lastLoginAt: "2025-01-23T18:30:00Z",
		twoFactorEnabled: true,
		emailVerified: true,
	},
];

function AdminUsersPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [roleFilter, setRoleFilter] = useState<string>("all");
	const [schoolFilter, setSchoolFilter] = useState<string>("all");
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	const filteredUsers = mockUsers.filter((user) => {
		const matchesSearch =
			searchQuery === "" ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.lastName.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesRole = roleFilter === "all" || user.role === roleFilter;
		const matchesSchool =
			schoolFilter === "all" || user.school === schoolFilter;
		return matchesSearch && matchesRole && matchesSchool;
	});

	const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
	const paginatedUsers = filteredUsers.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

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
			<main className="max-w-7xl mx-auto px-6 py-8">
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-3xl font-bold text-white mb-2">
							Benutzerverwaltung
						</h1>
						<p className="text-slate-400">
							{filteredUsers.length} Benutzer gefunden
						</p>
					</div>
					<Link
						to="/admin/users/create"
						className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-medium hover:from-cyan-400 hover:to-blue-400 transition-colors"
					>
						<Plus className="w-5 h-5" />
						Benutzer erstellen
					</Link>
				</div>

				{/* Filters */}
				<div className="flex flex-wrap gap-4 mb-6">
					<div className="flex-1 min-w-[200px]">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
							<input
								type="text"
								placeholder="Suchen nach Name oder E-Mail..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
							/>
						</div>
					</div>
					<select
						value={roleFilter}
						onChange={(e) => setRoleFilter(e.target.value)}
						className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
					>
						<option value="all">Alle Rollen</option>
						<option value="student">Schüler</option>
						<option value="teacher">Lehrer</option>
						<option value="team">Team</option>
						<option value="admin">Admin</option>
					</select>
					<select
						value={schoolFilter}
						onChange={(e) => setSchoolFilter(e.target.value)}
						className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
					>
						<option value="all">Alle Schulen</option>
						<option value="athenaeum">Gymnasium Athenaeum</option>
						<option value="vlg">Vincent-Lübeck-Gymnasium</option>
						<option value="igs">IGS Stade</option>
						<option value="ewf">EWF Admin</option>
					</select>
				</div>

				{/* Users Table */}
				<div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
					<table className="w-full">
						<thead>
							<tr className="border-b border-slate-800">
								<th className="text-left px-6 py-4 text-slate-400 font-medium">
									Benutzer
								</th>
								<th className="text-left px-6 py-4 text-slate-400 font-medium">
									Schule
								</th>
								<th className="text-left px-6 py-4 text-slate-400 font-medium">
									Rolle
								</th>
								<th className="text-left px-6 py-4 text-slate-400 font-medium">
									Status
								</th>
								<th className="text-left px-6 py-4 text-slate-400 font-medium">
									Letzter Login
								</th>
								<th className="text-right px-6 py-4 text-slate-400 font-medium">
									Aktionen
								</th>
							</tr>
						</thead>
						<tbody>
							{paginatedUsers.map((user) => (
								<tr
									key={user.id}
									className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
								>
									<td className="px-6 py-4">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold">
												{user.firstName[0]}
												{user.lastName[0]}
											</div>
											<div>
												<div className="text-white font-medium">
													{user.displayName ||
														`${user.firstName} ${user.lastName}`}
												</div>
												<div className="text-slate-400 text-sm">
													{user.email}
												</div>
											</div>
										</div>
									</td>
									<td className="px-6 py-4">
										<span className="text-slate-300 capitalize">
											{user.school === "athenaeum"
												? "Athenaeum"
												: user.school === "vlg"
													? "VLG"
													: user.school === "igs"
														? "IGS"
														: "EWF"}
										</span>
									</td>
									<td className="px-6 py-4">
										<RoleBadge role={user.role} />
									</td>
									<td className="px-6 py-4">
										<div className="flex items-center gap-2">
											{user.emailVerified && (
												<span className="w-2 h-2 rounded-full bg-emerald-500" />
											)}
											{user.twoFactorEnabled && (
												<Shield className="w-4 h-4 text-cyan-400" />
											)}
										</div>
									</td>
									<td className="px-6 py-4 text-slate-400 text-sm">
										{user.lastLoginAt
											? new Date(user.lastLoginAt).toLocaleDateString("de-DE")
											: "Nie"}
									</td>
									<td className="px-6 py-4 text-right">
										<div className="flex items-center justify-end gap-2">
											<Link
												to={`/admin/users/${user.id}`}
												className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
											>
												<Eye className="w-4 h-4" />
											</Link>
											<Link
												to={`/admin/users/${user.id}/edit`}
												className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
											>
												<Edit className="w-4 h-4" />
											</Link>
											<button
												type="button"
												className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
												title="Impersonieren"
											>
												<UserCog className="w-4 h-4" />
											</button>
											<button
												type="button"
												className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="flex items-center justify-between mt-6">
						<div className="text-slate-400 text-sm">
							Seite {currentPage} von {totalPages}
						</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
								disabled={currentPage === 1}
								className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<ChevronLeft className="w-5 h-5" />
							</button>
							<button
								type="button"
								onClick={() =>
									setCurrentPage((p) => Math.min(totalPages, p + 1))
								}
								disabled={currentPage === totalPages}
								className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<ChevronRight className="w-5 h-5" />
							</button>
						</div>
					</div>
				)}
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
