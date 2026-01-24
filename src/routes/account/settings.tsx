/**
 * Account Settings Page - GDPR and general settings
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	AlertTriangle,
	ArrowLeft,
	Bell,
	Check,
	Download,
	Languages,
	Settings,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import * as m from "@/paraglide/messages";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { authClient } from "~/lib/auth-client";

export const Route = createFileRoute("/account/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	const { data: session, isPending } = authClient.useSession();
	const navigate = useNavigate();
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deletePassword, setDeletePassword] = useState("");
	const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);
	const [exportStatus, setExportStatus] = useState<
		"idle" | "pending" | "ready"
	>("idle");
	const [selectedLanguage, setSelectedLanguage] = useState("de");

	if (isPending) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
				<div className="animate-pulse text-slate-400">{m.common_loading()}</div>
			</div>
		);
	}

	if (!session?.user) {
		navigate({ to: "/login" });
		return null;
	}

	const handleExportData = async () => {
		setExportStatus("pending");
		// Simulate export
		setTimeout(() => {
			setExportStatus("ready");
		}, 3000);
	};

	const handleDeleteAccount = async () => {
		try {
			await authClient.deleteUser({
				password: deletePassword,
			});
			navigate({ to: "/" });
		} catch (error) {
			console.error("Delete account error:", error);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
			{/* Header */}
			<header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
				<div className="max-w-3xl mx-auto px-6 py-4">
					<Link
						to="/dashboard"
						className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						{m.common_back()}
					</Link>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
				<div className="flex items-center gap-4 mb-8">
					<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
						<Settings className="w-6 h-6 text-white" />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-white">
							{m.nav_settings()}
						</h1>
						<p className="text-slate-400">Verwalte deine Einstellungen</p>
					</div>
				</div>

				{/* Language Settings */}
				<Card>
					<CardHeader>
						<div className="flex items-center gap-3">
							<Languages className="w-5 h-5 text-slate-400" />
							<CardTitle className="text-lg">Sprache</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => setSelectedLanguage("de")}
								className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
									selectedLanguage === "de"
										? "border-cyan-500 bg-cyan-500/10"
										: "border-slate-700 hover:border-slate-600"
								}`}
							>
								<span className="text-2xl">🇩🇪</span>
								<span className="font-medium text-slate-200">Deutsch</span>
								{selectedLanguage === "de" && (
									<Check className="w-4 h-4 text-cyan-400" />
								)}
							</button>
							<button
								type="button"
								onClick={() => setSelectedLanguage("en")}
								className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
									selectedLanguage === "en"
										? "border-cyan-500 bg-cyan-500/10"
										: "border-slate-700 hover:border-slate-600"
								}`}
							>
								<span className="text-2xl">🇬🇧</span>
								<span className="font-medium text-slate-200">English</span>
								{selectedLanguage === "en" && (
									<Check className="w-4 h-4 text-cyan-400" />
								)}
							</button>
						</div>
					</CardContent>
				</Card>

				{/* Notification Settings */}
				<Card>
					<CardHeader>
						<div className="flex items-center gap-3">
							<Bell className="w-5 h-5 text-slate-400" />
							<CardTitle className="text-lg">Benachrichtigungen</CardTitle>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<label className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 cursor-pointer">
							<div>
								<p className="font-medium text-slate-200">
									E-Mail-Benachrichtigungen
								</p>
								<p className="text-sm text-slate-400">
									Erhalte Benachrichtigungen per E-Mail
								</p>
							</div>
							<input
								type="checkbox"
								defaultChecked
								className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
							/>
						</label>
						<label className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 cursor-pointer">
							<div>
								<p className="font-medium text-slate-200">
									Sicherheitswarnungen
								</p>
								<p className="text-sm text-slate-400">
									Benachrichtigung bei verdächtigen Aktivitäten
								</p>
							</div>
							<input
								type="checkbox"
								defaultChecked
								className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
							/>
						</label>
					</CardContent>
				</Card>

				{/* GDPR Section */}
				<div className="pt-8 border-t border-slate-800">
					<h2 className="text-xl font-bold text-white mb-6">
						{m.gdpr_title()}
					</h2>

					{/* Data Export */}
					<Card className="mb-6">
						<CardHeader>
							<div className="flex items-center gap-3">
								<Download className="w-5 h-5 text-blue-400" />
								<div>
									<CardTitle className="text-lg">
										{m.gdpr_export_title()}
									</CardTitle>
									<CardDescription>
										{m.gdpr_export_description()}
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							{exportStatus === "idle" && (
								<Button onClick={handleExportData} variant="outline">
									<Download className="w-4 h-4 mr-2" />
									{m.gdpr_export_button()}
								</Button>
							)}
							{exportStatus === "pending" && (
								<div className="flex items-center gap-3 text-slate-400">
									<div className="animate-spin w-5 h-5 border-2 border-slate-500 border-t-cyan-400 rounded-full" />
									{m.gdpr_export_pending()}
								</div>
							)}
							{exportStatus === "ready" && (
								<div className="space-y-3">
									<p className="text-green-400 flex items-center gap-2">
										<Check className="w-5 h-5" />
										{m.gdpr_export_ready()}
									</p>
									<Button variant="outline">
										<Download className="w-4 h-4 mr-2" />
										{m.gdpr_export_download()}
									</Button>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Account Deletion */}
					<Card className="border-red-500/20">
						<CardHeader>
							<div className="flex items-center gap-3">
								<Trash2 className="w-5 h-5 text-red-400" />
								<div>
									<CardTitle className="text-lg text-red-400">
										{m.gdpr_delete_title()}
									</CardTitle>
									<CardDescription>
										{m.gdpr_delete_description()}
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							{!showDeleteConfirm ? (
								<Button
									variant="destructive"
									onClick={() => setShowDeleteConfirm(true)}
								>
									<Trash2 className="w-4 h-4 mr-2" />
									{m.gdpr_delete_button()}
								</Button>
							) : (
								<div className="space-y-6 p-6 rounded-lg bg-red-500/5 border border-red-500/20">
									<div className="flex items-start gap-3">
										<AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
										<div>
											<h3 className="font-semibold text-white">
												{m.gdpr_delete_confirm_title()}
											</h3>
											<p className="text-sm text-slate-400 mt-1">
												{m.gdpr_delete_confirm_description()}
											</p>
										</div>
									</div>

									<div className="space-y-4">
										<div className="space-y-2">
											<Label>{m.gdpr_delete_confirm_password()}</Label>
											<Input
												type="password"
												value={deletePassword}
												onChange={(e) => setDeletePassword(e.target.value)}
												className="border-red-500/30 focus:border-red-500"
											/>
										</div>

										<label className="flex items-center gap-3 cursor-pointer">
											<input
												type="checkbox"
												checked={deleteConfirmChecked}
												onChange={(e) =>
													setDeleteConfirmChecked(e.target.checked)
												}
												className="w-5 h-5 rounded border-red-500/50 bg-slate-800 text-red-500 focus:ring-red-500"
											/>
											<span className="text-sm text-slate-300">
												{m.gdpr_delete_confirm_checkbox()}
											</span>
										</label>
									</div>

									<div className="flex gap-3">
										<Button
											variant="destructive"
											onClick={handleDeleteAccount}
											disabled={!deletePassword || !deleteConfirmChecked}
										>
											{m.gdpr_delete_confirm_button()}
										</Button>
										<Button
											variant="outline"
											onClick={() => {
												setShowDeleteConfirm(false);
												setDeletePassword("");
												setDeleteConfirmChecked(false);
											}}
										>
											{m.common_cancel()}
										</Button>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}
