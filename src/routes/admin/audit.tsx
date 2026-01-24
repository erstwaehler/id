/**
 * Admin Audit Log Page
 * Implements SPEC.md §5.3 - Audit Log Viewer
 */
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
	Activity,
	AlertTriangle,
	ChevronLeft,
	ChevronRight,
	Download,
	Key,
	Loader2,
	LogIn,
	LogOut,
	RefreshCw,
	Search,
	Settings,
	Shield,
	User,
	UserCog,
	Users,
} from "lucide-react";
import { useState } from "react";
import { authClient } from "~/lib/auth-client";

export const Route = createFileRoute("/admin/audit")({
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data?.user) {
			throw redirect({ to: "/login", search: { redirect: "/admin/audit" } });
		}
		// Check if user has admin or team role
		const role = session.data.user.role;
		if (role !== "admin" && role !== "team") {
			throw redirect({ to: "/dashboard" });
		}
	},
	component: AdminAuditPage,
});

interface AuditEntry {
	id: string;
	userId: string;
	userEmail: string;
	action: string;
	resource: string;
	details: string;
	ipAddress: string;
	userAgent: string;
	timestamp: string;
	severity: "info" | "warning" | "error";
}

function AdminAuditPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [actionFilter, setActionFilter] = useState<string>("all");
	const [severityFilter, setSeverityFilter] = useState<string>("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [autoRefresh, setAutoRefresh] = useState(false);
	const itemsPerPage = 20;

	// TODO: Fetch from audit log database once schema is implemented
	// For now, use session data for basic audit info
	const { data: sessionsData, isLoading } = useQuery({
		queryKey: ["admin", "sessions", "audit"],
		queryFn: async () => {
			const response = await authClient.admin.listSessions({
				query: { limit: 100 },
			});
			return response.data?.sessions ?? [];
		},
		refetchInterval: autoRefresh ? 5000 : false,
	});

	// Convert sessions to audit-like entries for display
	const auditEntries: AuditEntry[] = (sessionsData ?? []).map((session) => ({
		id: session.id,
		userId: session.userId,
		userEmail: session.userId, // Would need user lookup
		action: "auth.session.active",
		resource: `session:${session.id}`,
		details: `Session active from ${session.userAgent ?? "Unknown device"}`,
		ipAddress: session.ipAddress ?? "Unknown",
		userAgent: session.userAgent ?? "Unknown",
		timestamp: session.createdAt?.toString() ?? new Date().toISOString(),
		severity: "info" as const,
	}));

	const filteredEntries = auditEntries.filter((entry) => {
		const matchesSearch =
			searchQuery === "" ||
			entry.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
			entry.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
			entry.details.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesAction =
			actionFilter === "all" || entry.action.startsWith(actionFilter);
		const matchesSeverity =
			severityFilter === "all" || entry.severity === severityFilter;
		return matchesSearch && matchesAction && matchesSeverity;
	});

	const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
	const paginatedEntries = filteredEntries.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	const handleExport = () => {
		const csv = [
			["ID", "User", "Action", "Resource", "Details", "IP", "Timestamp"].join(
				",",
			),
			...filteredEntries.map((entry) =>
				[
					entry.id,
					entry.userEmail,
					entry.action,
					entry.resource,
					`"${entry.details}"`,
					entry.ipAddress,
					entry.timestamp,
				].join(","),
			),
		].join("\n");

		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
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
								className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
							>
								<Users className="w-4 h-4" />
								Benutzer
							</Link>
							<Link
								to="/admin/audit"
								className="text-white flex items-center gap-2"
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
						<h1 className="text-3xl font-bold text-white mb-2">Audit Log</h1>
						<p className="text-slate-400">
							Systemaktivitäten und Sicherheitsereignisse
						</p>
					</div>
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => setAutoRefresh(!autoRefresh)}
							className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
								autoRefresh
									? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
									: "bg-slate-800 text-slate-400 hover:text-white"
							}`}
						>
							<RefreshCw
								className={`w-4 h-4 ${autoRefresh ? "animate-spin" : ""}`}
							/>
							Auto-Refresh
						</button>
						<button
							type="button"
							onClick={handleExport}
							className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
						>
							<Download className="w-4 h-4" />
							Export CSV
						</button>
					</div>
				</div>

				{/* Filters */}
				<div className="flex flex-wrap gap-4 mb-6">
					<div className="flex-1 min-w-[200px]">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
							<input
								type="text"
								placeholder="Suchen..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
							/>
						</div>
					</div>
					<select
						value={actionFilter}
						onChange={(e) => setActionFilter(e.target.value)}
						className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
					>
						<option value="all">Alle Aktionen</option>
						<option value="auth">Authentifizierung</option>
						<option value="user">Benutzer</option>
						<option value="system">System</option>
						<option value="api">API</option>
					</select>
					<select
						value={severityFilter}
						onChange={(e) => setSeverityFilter(e.target.value)}
						className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
					>
						<option value="all">Alle Schweregrade</option>
						<option value="info">Info</option>
						<option value="warning">Warnung</option>
						<option value="error">Fehler</option>
					</select>
				</div>

				{/* Audit Log Table */}
				{isLoading ? (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
					</div>
				) : (
				<div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-slate-800">
									<th className="text-left px-6 py-4 text-slate-400 font-medium">
										Zeitstempel
									</th>
									<th className="text-left px-6 py-4 text-slate-400 font-medium">
										Benutzer
									</th>
									<th className="text-left px-6 py-4 text-slate-400 font-medium">
										Aktion
									</th>
									<th className="text-left px-6 py-4 text-slate-400 font-medium">
										Details
									</th>
									<th className="text-left px-6 py-4 text-slate-400 font-medium">
										IP
									</th>
								</tr>
							</thead>
							<tbody>
								{paginatedEntries.map((entry) => (
									<tr
										key={entry.id}
										className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
									>
										<td className="px-6 py-4">
											<div className="text-slate-300 text-sm">
												{new Date(entry.timestamp).toLocaleDateString("de-DE")}
											</div>
											<div className="text-slate-500 text-xs">
												{new Date(entry.timestamp).toLocaleTimeString("de-DE")}
											</div>
										</td>
										<td className="px-6 py-4">
											<div className="flex items-center gap-2">
												{entry.userId === "system" ? (
													<div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
														<Settings className="w-4 h-4 text-slate-400" />
													</div>
												) : (
													<div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
														{entry.userEmail[0].toUpperCase()}
													</div>
												)}
												<span className="text-slate-300 text-sm truncate max-w-[200px]">
													{entry.userEmail}
												</span>
											</div>
										</td>
										<td className="px-6 py-4">
											<div className="flex items-center gap-2">
												<ActionIcon action={entry.action} />
												<span
													className={`text-sm ${
														entry.severity === "error"
															? "text-red-400"
															: entry.severity === "warning"
																? "text-amber-400"
																: "text-slate-300"
													}`}
												>
													{entry.action}
												</span>
											</div>
										</td>
										<td className="px-6 py-4">
											<span className="text-slate-400 text-sm">
												{entry.details}
											</span>
										</td>
										<td className="px-6 py-4">
											<span className="text-slate-500 text-sm font-mono">
												{entry.ipAddress}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
				)}

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

function ActionIcon({ action }: { action: string }) {
	if (action.startsWith("auth.login")) {
		return action.includes("failed") ? (
			<AlertTriangle className="w-4 h-4 text-amber-500" />
		) : (
			<LogIn className="w-4 h-4 text-emerald-500" />
		);
	}
	if (action.startsWith("auth.logout")) {
		return <LogOut className="w-4 h-4 text-slate-400" />;
	}
	if (action.includes("2fa")) {
		return <Shield className="w-4 h-4 text-cyan-500" />;
	}
	if (action.includes("impersonate")) {
		return <UserCog className="w-4 h-4 text-purple-500" />;
	}
	if (action.startsWith("user")) {
		return <User className="w-4 h-4 text-blue-500" />;
	}
	if (action.startsWith("system")) {
		return <Settings className="w-4 h-4 text-slate-400" />;
	}
	return <Activity className="w-4 h-4 text-slate-400" />;
}
