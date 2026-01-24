/**
 * EWF-ID Header Component
 * Clean navigation header without boilerplate
 */
import { Link, useRouter } from "@tanstack/react-router";
import {
	Globe,
	Home,
	LogIn,
	LogOut,
	Menu,
	Settings,
	Shield,
	User,
	Users,
	X,
} from "lucide-react";
import { useState } from "react";
import * as m from "@/paraglide/messages";
import ParaglideLocaleSwitcher from "./LocaleSwitcher";
import { authClient } from "@/lib/auth-client";

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();

	const handleLogout = async () => {
		await authClient.signOut();
		setIsOpen(false);
		router.navigate({ to: "/" });
	};

	const isAdmin = session?.user?.role === "admin";

	return (
		<>
			<header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6">
					<div className="flex items-center justify-between h-16">
						{/* Logo */}
						<Link
							to="/"
							className="flex items-center gap-2 text-white font-semibold"
						>
							<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
								<Globe className="w-5 h-5 text-white" />
							</div>
							<span className="hidden sm:block">{m.app_name()}</span>
						</Link>

						{/* Desktop Navigation */}
						<nav className="hidden md:flex items-center gap-6">
							{session ? (
								<>
									<Link
										to="/dashboard"
										className="text-slate-300 hover:text-white transition-colors"
									>
										{m.nav_dashboard()}
									</Link>
									<Link
										to="/account/profile"
										className="text-slate-300 hover:text-white transition-colors"
									>
										{m.nav_profile()}
									</Link>
									{isAdmin && (
										<Link
											to="/admin"
											className="text-slate-300 hover:text-white transition-colors"
										>
											{m.nav_admin()}
										</Link>
									)}
								</>
							) : (
								<>
									<Link
										to="/login"
										className="text-slate-300 hover:text-white transition-colors"
									>
										{m.nav_login()}
									</Link>
									<Link
										to="/register"
										className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition-colors"
									>
										{m.nav_register()}
									</Link>
								</>
							)}
							<ParaglideLocaleSwitcher />
						</nav>

						{/* Mobile Menu Button */}
						<button
							type="button"
							onClick={() => setIsOpen(true)}
							className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
							aria-label="Open menu"
						>
							<Menu className="w-6 h-6" />
						</button>
					</div>
				</div>
			</header>

			{/* Mobile Sidebar */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black/50 z-50 md:hidden"
					onClick={() => setIsOpen(false)}
				/>
			)}

			<aside
				className={`fixed top-0 left-0 h-full w-80 bg-slate-900 border-r border-slate-800 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between p-4 border-b border-slate-800">
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
							<Globe className="w-5 h-5 text-white" />
						</div>
						<span className="font-semibold text-white">{m.app_name()}</span>
					</div>
					<button
						type="button"
						onClick={() => setIsOpen(false)}
						className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
						aria-label="Close menu"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<nav className="p-4 space-y-2">
					<Link
						to="/"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
					>
						<Home className="w-5 h-5" />
						<span>{m.nav_home()}</span>
					</Link>

					{session ? (
						<>
							<Link
								to="/dashboard"
								onClick={() => setIsOpen(false)}
								className="flex items-center gap-3 p-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
							>
								<User className="w-5 h-5" />
								<span>{m.nav_dashboard()}</span>
							</Link>

							<Link
								to="/account/profile"
								onClick={() => setIsOpen(false)}
								className="flex items-center gap-3 p-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
							>
								<Settings className="w-5 h-5" />
								<span>{m.nav_profile()}</span>
							</Link>

							<Link
								to="/account/security"
								onClick={() => setIsOpen(false)}
								className="flex items-center gap-3 p-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
							>
								<Shield className="w-5 h-5" />
								<span>{m.nav_security()}</span>
							</Link>

							{isAdmin && (
								<Link
									to="/admin"
									onClick={() => setIsOpen(false)}
									className="flex items-center gap-3 p-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
								>
									<Users className="w-5 h-5" />
									<span>{m.nav_admin()}</span>
								</Link>
							)}

							<button
								type="button"
								onClick={handleLogout}
								className="flex items-center gap-3 p-3 w-full text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-lg transition-colors"
							>
								<LogOut className="w-5 h-5" />
								<span>{m.nav_logout()}</span>
							</button>
						</>
					) : (
						<>
							<Link
								to="/login"
								onClick={() => setIsOpen(false)}
								className="flex items-center gap-3 p-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
							>
								<LogIn className="w-5 h-5" />
								<span>{m.nav_login()}</span>
							</Link>

							<Link
								to="/register"
								onClick={() => setIsOpen(false)}
								className="flex items-center gap-3 p-3 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors"
							>
								<User className="w-5 h-5" />
								<span>{m.nav_register()}</span>
							</Link>
						</>
					)}
				</nav>

				<div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
					<ParaglideLocaleSwitcher />
				</div>
			</aside>
		</>
	);
}
