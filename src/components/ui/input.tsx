/**
 * Input component with validation states
 */
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "~/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, type, error, ...props }, ref) => {
		return (
			<div className="w-full">
				<input
					type={type}
					className={cn(
						"flex h-11 w-full rounded-lg border-2 bg-slate-900/50 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition-all duration-200",
						"focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900",
						"disabled:cursor-not-allowed disabled:opacity-50",
						error
							? "border-red-500/50 focus:border-red-500 focus:ring-red-500/50"
							: "border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/50 hover:border-slate-600",
						className,
					)}
					ref={ref}
					{...props}
				/>
				{error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
			</div>
		);
	},
);
Input.displayName = "Input";

export { Input };
