/**
 * School Selector Component
 * Used in registration flow to select school for OIDC login
 */

import { Building2, GraduationCap, School } from "lucide-react";
import { cn } from "~/lib/utils";

interface SchoolOption {
	id: string;
	name: string;
	shortName: string;
	icon: React.ReactNode;
}

const schoolOptions: SchoolOption[] = [
	{
		id: "athenaeum",
		name: "Gymnasium Athenaeum Stade",
		shortName: "Athenaeum",
		icon: <School className="w-6 h-6" />,
	},
	{
		id: "vlg",
		name: "Vincent Lübeck Gymnasium",
		shortName: "VLG",
		icon: <GraduationCap className="w-6 h-6" />,
	},
	{
		id: "igs",
		name: "Integrierte Gesamtschule Stade",
		shortName: "IGS",
		icon: <Building2 className="w-6 h-6" />,
	},
];

interface SchoolSelectorProps {
	value?: string;
	onChange: (schoolId: string) => void;
	disabled?: boolean;
}

export function SchoolSelector({
	value,
	onChange,
	disabled,
}: SchoolSelectorProps) {
	return (
		<div className="grid gap-3">
			{schoolOptions.map((school) => (
				<button
					key={school.id}
					type="button"
					disabled={disabled}
					onClick={() => onChange(school.id)}
					className={cn(
						"flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200",
						"hover:bg-slate-800/50 hover:border-cyan-500/50",
						"focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-900",
						"disabled:opacity-50 disabled:cursor-not-allowed",
						value === school.id
							? "border-cyan-500 bg-cyan-500/10 text-white"
							: "border-slate-700 bg-slate-900/50 text-slate-300",
					)}
				>
					<div
						className={cn(
							"flex items-center justify-center w-12 h-12 rounded-lg transition-colors",
							value === school.id
								? "bg-cyan-500/20 text-cyan-400"
								: "bg-slate-800 text-slate-400",
						)}
					>
						{school.icon}
					</div>
					<div className="flex-1 text-left">
						<p className="font-semibold">{school.shortName}</p>
						<p className="text-sm text-slate-400">{school.name}</p>
					</div>
					<div
						className={cn(
							"w-5 h-5 rounded-full border-2 transition-all",
							value === school.id
								? "border-cyan-500 bg-cyan-500"
								: "border-slate-600",
						)}
					>
						{value === school.id && (
							<svg
								className="w-full h-full text-white"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fillRule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clipRule="evenodd"
								/>
							</svg>
						)}
					</div>
				</button>
			))}
		</div>
	);
}
