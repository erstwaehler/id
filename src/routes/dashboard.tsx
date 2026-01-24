/**
 * Dashboard Page - User home after login
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	Calendar,
	ChevronRight,
	Clock,
	Key,
	LogOut,
	Settings,
	Shield,
	Smartphone,
	Tv,
	User,
	Users,
	Vote,
} from "lucide-react";
import * as m from "@/paraglide/messages";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { authClient } from "~/lib/auth-client";

export const Route = createFileRoute("/dashboard")({
	component: DashboardPage,
});

function DashboardPage() {
	const { data: session, isPending } = authClient.useSession();
	const navigate = useNavigate();

	const handleLogout = async () => {
		await authClient.signOut();
		navigate({ to: "/login" });
	};

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

	const user = session.user;

	const quickActions = [
		{
			icon: <User className="w-5 h-5" />,
			label: m.nav_profile(),
			href: "/account/profile",
			color: "from-blue-500 to-cyan-500",
		},
		{
			icon: <Shield className="w-5 h-5" />,
			label: m.nav_security(),
			href: "/account/security",
			color: "from-green-500 to-emerald-500",
		},
		{
			icon: <Settings className="w-5 h-5" />,
			label: m.nav_settings(),
			href: "/account/settings",
			color: "from-purple-500 to-pink-500",
		},
	];

	const connectedApps = [
		{
			icon: <Calendar className="w-5 h-5" />,
			name: "Termine",
			status: "Verbunden",
			color: "from-blue-500 to-cyan-500",
		},
		{
			icon: <Vote className="w-5 h-5" />,
			name: "Abstimmung",
			status: "Verbunden",
			color: "from-purple-500 to-pink-500",
		},
		{
			icon: <Users className="w-5 h-5" />,
			name: "Live",
			status: "Verbunden",
			color: "from-orange-500 to-red-500",
		},
		{
			icon: <Tv className="w-5 h-5" />,
			name: "Screens",
			status: "Nicht autorisiert",
			color: "from-slate-500 to-slate-600",
		},
	];

	const recentActivity = [
		{
			icon: <Key className="w-4 h-4" />,
			action: "Anmeldung erfolgreich",
			time: "Gerade eben",
		},
		{
			icon: <Smartphone className="w-4 h-4" />,
			action: "Neue Sitzung gestartet",
			time: "Vor 2 Minuten",
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
			{/* Header */}
			<header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
				<div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
					<Link to="/" className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
							<span className="text-sm font-bold text-white">ID</span>
						</div>
						<span className="text-xl font-bold text-white">EWF-ID</span>
					</Link>

					<div className="flex items-center gap-4">
						<span className="text-sm text-slate-400">{user.email}</span>
						<Button variant="ghost" size="sm" onClick={handleLogout}>
							<LogOut className="w-4 h-4 mr-2" />
							{m.nav_logout()}
						</Button>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-6xl mx-auto px-6 py-12">
				{/* Welcome Section */}
				<div className="mb-12">
					<h1 className="text-4xl font-bold text-white mb-2">
						{m.dashboard_welcome({ name: user.name || "User" })}
					</h1>
					<p className="text-slate-400 flex items-center gap-2">
						<Clock className="w-4 h-4" />
						{m.dashboard_last_login({
							date: new Date().toLocaleDateString("de-DE"),
						})}
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Quick Actions */}
					<Card className="lg:col-span-2">
						<CardHeader>
							<CardTitle className="text-lg">
								{m.dashboard_quick_actions()}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								{quickActions.map((action, index) => (
									<Link
										key={index}
										to={action.href}
										className="group flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all"
									>
										<div
											className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center text-white`}
										>
											{action.icon}
										</div>
										<span className="font-medium text-slate-200 group-hover:text-white transition-colors">
											{action.label}
										</span>
										<ChevronRight className="w-4 h-4 text-slate-500 ml-auto group-hover:text-slate-300 transition-colors" />
									</Link>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Recent Activity */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								{m.dashboard_recent_activity()}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{recentActivity.map((activity, index) => (
									<div key={index} className="flex items-center gap-3">
										<div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
											{activity.icon}
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm text-slate-200 truncate">
												{activity.action}
											</p>
											<p className="text-xs text-slate-500">{activity.time}</p>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Connected Apps */}
					<Card className="lg:col-span-3">
						<CardHeader>
							<CardTitle className="text-lg">
								{m.dashboard_connected_apps()}
							</CardTitle>
							<CardDescription>
								Anwendungen, die auf dein EWF-ID zugreifen können
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
								{connectedApps.map((app, index) => (
									<div
										key={index}
										className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50"
									>
										<div
											className={`w-10 h-10 rounded-lg bg-gradient-to-br ${app.color} flex items-center justify-center text-white`}
										>
											{app.icon}
										</div>
										<div className="flex-1 min-w-0">
											<p className="font-medium text-slate-200">{app.name}</p>
											<p className="text-xs text-slate-500">{app.status}</p>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}
