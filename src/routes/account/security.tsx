/**
 * Account Security Page - 2FA, Passkeys, Sessions
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
	ArrowLeft,
	Shield,
	Key,
	Smartphone,
	Laptop,
	LogOut,
	Plus,
	Trash2,
	CheckCircle,
	XCircle,
	QrCode,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { authClient } from "~/lib/auth-client";
import * as m from "@/paraglide/messages";

export const Route = createFileRoute("/account/security")({
	component: SecurityPage,
});

function SecurityPage() {
	const { data: session, isPending } = authClient.useSession();
	const navigate = useNavigate();
	const [showPasswordForm, setShowPasswordForm] = useState(false);
	const [show2FASetup, setShow2FASetup] = useState(false);

	// Mock data - replace with actual API calls
	const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
	const [passkeys, setPasskeys] = useState([
		{
			id: "1",
			name: "MacBook Touch ID",
			createdAt: "2024-01-15",
			lastUsed: "2024-01-20",
		},
	]);
	const [sessions, setSessions] = useState([
		{
			id: "current",
			device: "Chrome • macOS",
			location: "Stade, Germany",
			lastActive: "Gerade eben",
			current: true,
		},
		{
			id: "2",
			device: "Safari • iPhone",
			location: "Hamburg, Germany",
			lastActive: "Vor 2 Stunden",
			current: false,
		},
	]);

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

	const handleRevokeSession = (sessionId: string) => {
		setSessions(sessions.filter((s) => s.id !== sessionId));
	};

	const handleRevokeAllSessions = () => {
		setSessions(sessions.filter((s) => s.current));
	};

	const handleRemovePasskey = (passkeyId: string) => {
		setPasskeys(passkeys.filter((p) => p.id !== passkeyId));
	};

	const handleAddPasskey = async () => {
		try {
			await authClient.passkey.addPasskey({
				name: "New Passkey",
			});
			// Refresh passkey list
		} catch (error) {
			console.error("Failed to add passkey:", error);
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
					<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
						<Shield className="w-6 h-6 text-white" />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-white">{m.security_title()}</h1>
						<p className="text-slate-400">
							Verwalte deine Sicherheitseinstellungen
						</p>
					</div>
				</div>

				{/* Password Section */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">{m.security_password_section()}</CardTitle>
					</CardHeader>
					<CardContent>
						{showPasswordForm ? (
							<form className="space-y-4">
								<div className="space-y-2">
									<Label>{m.security_password_current()}</Label>
									<Input type="password" />
								</div>
								<div className="space-y-2">
									<Label>{m.security_password_new()}</Label>
									<Input type="password" />
									<p className="text-xs text-slate-500">
										{m.security_password_requirements()}
									</p>
								</div>
								<div className="space-y-2">
									<Label>{m.security_password_confirm()}</Label>
									<Input type="password" />
								</div>
								<div className="flex gap-3">
									<Button type="submit">{m.common_save()}</Button>
									<Button
										type="button"
										variant="outline"
										onClick={() => setShowPasswordForm(false)}
									>
										{m.common_cancel()}
									</Button>
								</div>
							</form>
						) : (
							<Button variant="outline" onClick={() => setShowPasswordForm(true)}>
								{m.security_password_change()}
							</Button>
						)}
					</CardContent>
				</Card>

				{/* 2FA Section */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-lg">{m.security_2fa_section()}</CardTitle>
							<div className="flex items-center gap-2">
								{twoFactorEnabled ? (
									<>
										<CheckCircle className="w-5 h-5 text-green-500" />
										<span className="text-sm text-green-400">
											{m.security_2fa_enabled()}
										</span>
									</>
								) : (
									<>
										<XCircle className="w-5 h-5 text-slate-500" />
										<span className="text-sm text-slate-400">
											{m.security_2fa_disabled()}
										</span>
									</>
								)}
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{show2FASetup ? (
							<div className="space-y-6">
								<div className="flex justify-center">
									<div className="w-48 h-48 bg-white rounded-xl p-4 flex items-center justify-center">
										<QrCode className="w-32 h-32 text-slate-900" />
									</div>
								</div>
								<p className="text-center text-sm text-slate-400">
									{m.security_2fa_setup_scan()}
								</p>
								<div className="space-y-2">
									<Label>{m.security_2fa_setup_verify()}</Label>
									<Input placeholder="000000" maxLength={6} className="text-center text-2xl tracking-widest" />
								</div>
								<div className="flex gap-3">
									<Button className="flex-1">{m.common_confirm()}</Button>
									<Button
										variant="outline"
										className="flex-1"
										onClick={() => setShow2FASetup(false)}
									>
										{m.common_cancel()}
									</Button>
								</div>
							</div>
						) : twoFactorEnabled ? (
							<div className="space-y-4">
								<Button variant="outline" className="w-full">
									{m.security_2fa_backup_codes_regenerate()}
								</Button>
								<Button
									variant="destructive"
									className="w-full"
									onClick={() => setTwoFactorEnabled(false)}
								>
									{m.security_2fa_disable()}
								</Button>
							</div>
						) : (
							<Button onClick={() => setShow2FASetup(true)}>
								{m.security_2fa_enable()}
							</Button>
						)}
					</CardContent>
				</Card>

				{/* Passkeys Section */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-lg">{m.security_passkeys_section()}</CardTitle>
							<Button size="sm" variant="outline" onClick={handleAddPasskey}>
								<Plus className="w-4 h-4 mr-2" />
								{m.security_passkeys_add()}
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{passkeys.length === 0 ? (
							<p className="text-slate-400 text-center py-8">
								{m.security_passkeys_empty()}
							</p>
						) : (
							<div className="space-y-3">
								{passkeys.map((passkey) => (
									<div
										key={passkey.id}
										className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50"
									>
										<div className="flex items-center gap-4">
											<div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
												<Key className="w-5 h-5 text-slate-300" />
											</div>
											<div>
												<p className="font-medium text-slate-200">
													{passkey.name}
												</p>
												<p className="text-xs text-slate-500">
													{m.security_passkeys_last_used({ date: passkey.lastUsed })}
												</p>
											</div>
										</div>
										<Button
											variant="ghost"
											size="sm"
											className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
											onClick={() => handleRemovePasskey(passkey.id)}
										>
											<Trash2 className="w-4 h-4" />
										</Button>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Sessions Section */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-lg">{m.security_sessions_section()}</CardTitle>
							{sessions.filter((s) => !s.current).length > 0 && (
								<Button
									size="sm"
									variant="outline"
									onClick={handleRevokeAllSessions}
								>
									{m.security_sessions_revoke_all()}
								</Button>
							)}
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{sessions.map((sess) => (
								<div
									key={sess.id}
									className={`flex items-center justify-between p-4 rounded-lg border ${
										sess.current
											? "bg-cyan-500/10 border-cyan-500/30"
											: "bg-slate-800/50 border-slate-700/50"
									}`}
								>
									<div className="flex items-center gap-4">
										<div
											className={`w-10 h-10 rounded-lg flex items-center justify-center ${
												sess.current ? "bg-cyan-500/20" : "bg-slate-700"
											}`}
										>
											{sess.device.includes("iPhone") ||
											sess.device.includes("Android") ? (
												<Smartphone
													className={`w-5 h-5 ${
														sess.current ? "text-cyan-400" : "text-slate-300"
													}`}
												/>
											) : (
												<Laptop
													className={`w-5 h-5 ${
														sess.current ? "text-cyan-400" : "text-slate-300"
													}`}
												/>
											)}
										</div>
										<div>
											<p className="font-medium text-slate-200 flex items-center gap-2">
												{sess.device}
												{sess.current && (
													<span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
														{m.security_sessions_current()}
													</span>
												)}
											</p>
											<p className="text-xs text-slate-500">
												{sess.location} • {sess.lastActive}
											</p>
										</div>
									</div>
									{!sess.current && (
										<Button
											variant="ghost"
											size="sm"
											className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
											onClick={() => handleRevokeSession(sess.id)}
										>
											<LogOut className="w-4 h-4 mr-2" />
											{m.security_sessions_revoke()}
										</Button>
									)}
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
