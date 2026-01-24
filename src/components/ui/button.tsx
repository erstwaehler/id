/**
 * Button component with variants
 * Follows FRONTEND_SKILL.md for distinctive aesthetics
 */

import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "~/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default:
					"bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98]",
				destructive:
					"bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:from-red-500 hover:to-rose-500 active:scale-[0.98]",
				outline:
					"border-2 border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800 hover:border-cyan-500/50 hover:text-white",
				secondary:
					"bg-slate-800 text-slate-200 shadow-md hover:bg-slate-700 hover:text-white",
				ghost: "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
				link: "text-cyan-400 underline-offset-4 hover:underline hover:text-cyan-300",
			},
			size: {
				default: "h-11 px-6 py-2 text-sm rounded-lg",
				sm: "h-9 px-4 text-xs rounded-md",
				lg: "h-12 px-8 text-base rounded-xl",
				icon: "h-10 w-10 rounded-lg",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface ButtonProps
	extends ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{ className, variant, size, isLoading, children, disabled, ...props },
		ref,
	) => {
		return (
			<button
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				disabled={disabled || isLoading}
				{...props}
			>
				{isLoading ? (
					<>
						<svg
							className="animate-spin -ml-1 mr-2 h-4 w-4"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							/>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
						Loading...
					</>
				) : (
					children
				)}
			</button>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
