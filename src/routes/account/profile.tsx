/**
 * Account Profile Page
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Save, User } from "lucide-react";
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

export const Route = createFileRoute("/account/profile")({
	component: ProfilePage,
});

function ProfilePage() {
	const { data: session, isPending } = authClient.useSession();
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);
	const [saved, setSaved] = useState(false);

	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		displayName: "",
		bio: "",
	});

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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			// Update user profile via auth client
			await authClient.updateUser({
				name: `${formData.firstName} ${formData.lastName}`.trim() || user.name,
			});

			setSaved(true);
			setTimeout(() => setSaved(false), 3000);
		} catch (error) {
			console.error("Profile update error:", error);
		} finally {
			setIsLoading(false);
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
			<main className="max-w-3xl mx-auto px-6 py-12">
				<div className="flex items-center gap-4 mb-8">
					<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
						{user.image ? (
							<img
								src={user.image}
								alt={user.name || ""}
								className="w-full h-full rounded-2xl object-cover"
							/>
						) : (
							<User className="w-8 h-8 text-white" />
						)}
					</div>
					<div>
						<h1 className="text-2xl font-bold text-white">
							{m.profile_title()}
						</h1>
						<p className="text-slate-400">{user.email}</p>
					</div>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>{m.profile_edit()}</CardTitle>
						<CardDescription>
							Aktualisiere deine Profilinformationen
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="firstName">{m.profile_first_name()}</Label>
									<Input
										id="firstName"
										value={formData.firstName}
										onChange={(e) =>
											setFormData({ ...formData, firstName: e.target.value })
										}
										placeholder="Max"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="lastName">{m.profile_last_name()}</Label>
									<Input
										id="lastName"
										value={formData.lastName}
										onChange={(e) =>
											setFormData({ ...formData, lastName: e.target.value })
										}
										placeholder="Mustermann"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="displayName">{m.profile_display_name()}</Label>
								<Input
									id="displayName"
									value={formData.displayName}
									onChange={(e) =>
										setFormData({ ...formData, displayName: e.target.value })
									}
									placeholder="maxm"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="email">{m.profile_email()}</Label>
								<Input
									id="email"
									value={user.email}
									disabled
									className="bg-slate-800/50 text-slate-400"
								/>
								<p className="text-xs text-slate-500">
									{m.profile_email_hint()}
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="bio">{m.profile_bio()}</Label>
								<textarea
									id="bio"
									value={formData.bio}
									onChange={(e) =>
										setFormData({ ...formData, bio: e.target.value })
									}
									placeholder={m.profile_bio_placeholder()}
									className="flex min-h-[120px] w-full rounded-lg border-2 border-slate-700 bg-slate-900/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:border-cyan-500 focus:ring-cyan-500/50 hover:border-slate-600 resize-none"
									maxLength={500}
								/>
								<p className="text-xs text-slate-500 text-right">
									{formData.bio.length}/500
								</p>
							</div>

							<div className="flex items-center justify-between pt-4">
								{saved && (
									<p className="text-sm text-green-400">{m.profile_saved()}</p>
								)}
								<Button
									type="submit"
									isLoading={isLoading}
									className="ml-auto gap-2"
								>
									<Save className="w-4 h-4" />
									{m.profile_save()}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
