/**
 * Admin API Keys Page
 * Implements SPEC.md §5.3 & §6.1.3 - API Key Management
 */
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
	Activity,
	AlertCircle,
	Check,
	Copy,
	Eye,
	EyeOff,
	Key,
	Loader2,
	Plus,
	Settings,
	Trash2,
	Users,
} from "lucide-react";
import { useState } from "react";
import { authClient } from "~/lib/auth-client";

export const Route = createFileRoute("/admin/api-keys")({
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data?.user) {
			throw redirect({ to: "/login", search: { redirect: "/admin/api-keys" } });
		}
		// Check if user has admin role
		const role = session.data.user.role;
		if (role !== "admin") {
			throw redirect({ to: "/dashboard" });
		}
	},
	component: AdminApiKeysPage,
});

interface ApiKey {
	id: string;
	name: string;
	keyPrefix: string;
	scopes: string[];
	createdAt: string;
	lastUsedAt: string | null;
	expiresAt: string | null;
	requestCount: number;
	status: "active" | "expired" | "revoked";
}

const mockApiKeys: ApiKey[] = [
	{
		id: "1",
		name: "Schedule App Production",
		keyPrefix: "ewf_live_sche",
		scopes: ["schedule:*", "user:read"],
		createdAt: "2025-01-01T00:00:00Z",
		lastUsedAt: "2025-01-23T18:00:00Z",
		expiresAt: null,
		requestCount: 15420,
		status: "active",
	},
	{
		id: "2",
		name: "Vote App Production",
		keyPrefix: "ewf_live_vote",
		scopes: ["vote:*", "user:read"],
		createdAt: "2025-01-01T00:00:00Z",
		lastUsedAt: "2025-01-23T17:45:00Z",
		expiresAt: null,
		requestCount: 8234,
		status: "active",
	},
	{
		id: "3",
		name: "Live App Production",
		keyPrefix: "ewf_live_live",
		scopes: ["live:*", "user:read"],
		createdAt: "2025-01-05T10:00:00Z",
		lastUsedAt: "2025-01-20T14:30:00Z",
		expiresAt: null,
		requestCount: 3521,
		status: "active",
	},
	{
		id: "4",
		name: "Development Testing",
		keyPrefix: "ewf_test_dev1",
		scopes: ["*"],
		createdAt: "2025-01-10T08:00:00Z",
		lastUsedAt: "2025-01-15T12:00:00Z",
		expiresAt: "2025-02-10T08:00:00Z",
		requestCount: 450,
		status: "active",
	},
	{
		id: "5",
		name: "Old Integration",
		keyPrefix: "ewf_live_old1",
		scopes: ["user:read"],
		createdAt: "2024-12-01T00:00:00Z",
		lastUsedAt: "2024-12-20T10:00:00Z",
		expiresAt: "2025-01-01T00:00:00Z",
		requestCount: 120,
		status: "expired",
	},
];

function AdminApiKeysPage() {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newKeyResult, setNewKeyResult] = useState<string | null>(null);
	const [showKey, setShowKey] = useState(false);

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
								className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
							>
								<Activity className="w-4 h-4" />
								Audit
							</Link>
							<Link
								to="/admin/api-keys"
								className="text-white flex items-center gap-2"
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
							API Key Management
						</h1>
						<p className="text-slate-400">
							API-Schlüssel für Anwendungsintegrationen verwalten
						</p>
					</div>
					<button
						type="button"
						onClick={() => setShowCreateModal(true)}
						className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-medium hover:from-cyan-400 hover:to-blue-400 transition-colors"
					>
						<Plus className="w-5 h-5" />
						API Key erstellen
					</button>
				</div>

				{/* Newly Created Key Alert */}
				{newKeyResult && (
					<div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
						<div className="flex items-start gap-4">
							<div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
								<Check className="w-5 h-5 text-emerald-400" />
							</div>
							<div className="flex-1">
								<h3 className="text-emerald-400 font-semibold mb-2">
									API Key erstellt!
								</h3>
								<p className="text-slate-400 text-sm mb-4">
									Kopiere den Schlüssel jetzt - er wird nicht mehr angezeigt.
								</p>
								<div className="flex items-center gap-2">
									<code className="flex-1 px-4 py-2 bg-slate-900 rounded-lg text-emerald-300 font-mono text-sm">
										{showKey
											? newKeyResult
											: "•".repeat(newKeyResult.length - 8) +
												newKeyResult.slice(-8)}
									</code>
									<button
										type="button"
										onClick={() => setShowKey(!showKey)}
										className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
									>
										{showKey ? (
											<EyeOff className="w-5 h-5" />
										) : (
											<Eye className="w-5 h-5" />
										)}
									</button>
									<button
										type="button"
										onClick={() => navigator.clipboard.writeText(newKeyResult)}
										className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
									>
										<Copy className="w-5 h-5" />
									</button>
								</div>
							</div>
							<button
								type="button"
								onClick={() => setNewKeyResult(null)}
								className="text-slate-400 hover:text-white"
							>
								×
							</button>
						</div>
					</div>
				)}

				{/* API Keys List */}
				<div className="space-y-4">
					{mockApiKeys.map((apiKey) => (
						<div
							key={apiKey.id}
							className={`bg-slate-900/50 border rounded-xl p-6 ${
								apiKey.status === "active"
									? "border-slate-800"
									: "border-slate-800/50 opacity-60"
							}`}
						>
							<div className="flex items-start justify-between">
								<div className="flex items-start gap-4">
									<div
										className={`w-12 h-12 rounded-xl flex items-center justify-center ${
											apiKey.status === "active"
												? "bg-gradient-to-br from-cyan-500/20 to-blue-500/20"
												: "bg-slate-800"
										}`}
									>
										<Key
											className={`w-6 h-6 ${
												apiKey.status === "active"
													? "text-cyan-400"
													: "text-slate-500"
											}`}
										/>
									</div>
									<div>
										<div className="flex items-center gap-3 mb-1">
											<h3 className="text-white font-semibold">
												{apiKey.name}
											</h3>
											<StatusBadge status={apiKey.status} />
										</div>
										<p className="text-slate-500 font-mono text-sm mb-3">
											{apiKey.keyPrefix}...
										</p>
										<div className="flex flex-wrap gap-2">
											{apiKey.scopes.map((scope) => (
												<span
													key={scope}
													className="px-2 py-1 bg-slate-800 rounded text-slate-400 text-xs"
												>
													{scope}
												</span>
											))}
										</div>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<button
										type="button"
										className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
										title="Widerrufen"
									>
										<Trash2 className="w-5 h-5" />
									</button>
								</div>
							</div>
							<div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-6 text-sm">
								<div>
									<span className="text-slate-500">Erstellt:</span>{" "}
									<span className="text-slate-300">
										{new Date(apiKey.createdAt).toLocaleDateString("de-DE")}
									</span>
								</div>
								<div>
									<span className="text-slate-500">Zuletzt verwendet:</span>{" "}
									<span className="text-slate-300">
										{apiKey.lastUsedAt
											? new Date(apiKey.lastUsedAt).toLocaleDateString("de-DE")
											: "Nie"}
									</span>
								</div>
								<div>
									<span className="text-slate-500">Anfragen:</span>{" "}
									<span className="text-slate-300">
										{apiKey.requestCount.toLocaleString("de-DE")}
									</span>
								</div>
								{apiKey.expiresAt && (
									<div>
										<span className="text-slate-500">Läuft ab:</span>{" "}
										<span
											className={
												new Date(apiKey.expiresAt) < new Date()
													? "text-red-400"
													: "text-slate-300"
											}
										>
											{new Date(apiKey.expiresAt).toLocaleDateString("de-DE")}
										</span>
									</div>
								)}
							</div>
						</div>
					))}
				</div>

				{/* Create Modal */}
				{showCreateModal && (
					<CreateApiKeyModal
						onClose={() => setShowCreateModal(false)}
						onCreated={(key) => {
							setNewKeyResult(key);
							setShowCreateModal(false);
						}}
					/>
				)}
			</main>
		</div>
	);
}

function StatusBadge({ status }: { status: "active" | "expired" | "revoked" }) {
	const colors = {
		active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
		expired: "bg-amber-500/20 text-amber-400 border-amber-500/30",
		revoked: "bg-red-500/20 text-red-400 border-red-500/30",
	};

	const labels = {
		active: "Aktiv",
		expired: "Abgelaufen",
		revoked: "Widerrufen",
	};

	return (
		<span
			className={`px-2 py-0.5 rounded-md text-xs font-medium border ${colors[status]}`}
		>
			{labels[status]}
		</span>
	);
}

interface CreateApiKeyModalProps {
	onClose: () => void;
	onCreated: (key: string) => void;
}

function CreateApiKeyModal({ onClose, onCreated }: CreateApiKeyModalProps) {
	const [name, setName] = useState("");
	const [scopes, setScopes] = useState<string[]>([]);
	const [expiresIn, setExpiresIn] = useState<string>("never");

	const availableScopes = [
		{ id: "schedule:*", label: "Schedule (vollständig)" },
		{ id: "vote:*", label: "Vote (vollständig)" },
		{ id: "live:*", label: "Live (vollständig)" },
		{ id: "screens:*", label: "Screens (vollständig)" },
		{ id: "user:read", label: "Benutzer lesen" },
		{ id: "user:write", label: "Benutzer schreiben" },
		{ id: "*", label: "Alle Berechtigungen" },
	];

	const handleCreate = () => {
		// In a real implementation, this would call the API
		const newKey = `ewf_live_${Math.random().toString(36).substring(2, 26)}`;
		onCreated(newKey);
	};

	const toggleScope = (scope: string) => {
		if (scopes.includes(scope)) {
			setScopes(scopes.filter((s) => s !== scope));
		} else {
			setScopes([...scopes, scope]);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
			<div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg mx-4 overflow-hidden">
				<div className="p-6 border-b border-slate-800">
					<h2 className="text-xl font-semibold text-white">
						Neuen API Key erstellen
					</h2>
					<p className="text-slate-400 text-sm mt-1">
						Erstelle einen neuen API-Schlüssel für eine Anwendung
					</p>
				</div>
				<div className="p-6 space-y-6">
					<div>
						<label className="block text-slate-300 text-sm font-medium mb-2">
							Name
						</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="z.B. Schedule App Production"
							className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
						/>
					</div>
					<div>
						<label className="block text-slate-300 text-sm font-medium mb-2">
							Berechtigungen (Scopes)
						</label>
						<div className="space-y-2">
							{availableScopes.map((scope) => (
								<label
									key={scope.id}
									className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors"
								>
									<input
										type="checkbox"
										checked={scopes.includes(scope.id)}
										onChange={() => toggleScope(scope.id)}
										className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
									/>
									<span className="text-slate-300">{scope.label}</span>
									<code className="ml-auto text-slate-500 text-xs">
										{scope.id}
									</code>
								</label>
							))}
						</div>
					</div>
					<div>
						<label className="block text-slate-300 text-sm font-medium mb-2">
							Ablaufdatum
						</label>
						<select
							value={expiresIn}
							onChange={(e) => setExpiresIn(e.target.value)}
							className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
						>
							<option value="never">Nie ablaufen</option>
							<option value="30d">30 Tage</option>
							<option value="90d">90 Tage</option>
							<option value="1y">1 Jahr</option>
						</select>
					</div>
					<div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
						<AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
						<p className="text-amber-200 text-sm">
							Der API-Schlüssel wird nur einmal angezeigt. Stelle sicher, dass
							du ihn sicher speicherst.
						</p>
					</div>
				</div>
				<div className="p-6 border-t border-slate-800 flex items-center justify-end gap-3">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
					>
						Abbrechen
					</button>
					<button
						type="button"
						onClick={handleCreate}
						disabled={!name || scopes.length === 0}
						className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-medium hover:from-cyan-400 hover:to-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						API Key erstellen
					</button>
				</div>
			</div>
		</div>
	);
}
