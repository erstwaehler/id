/**
 * Impersonation Banner Component
 * Displays when an admin is impersonating another user
 */
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

interface ImpersonationBannerProps {
	originalUserEmail: string;
	impersonatedUserEmail: string;
	onEndImpersonation: () => void;
}

export function ImpersonationBanner({
	originalUserEmail,
	impersonatedUserEmail,
	onEndImpersonation,
}: ImpersonationBannerProps) {
	const [isLoading, setIsLoading] = useState(false);

	const handleEnd = async () => {
		setIsLoading(true);
		await onEndImpersonation();
		setIsLoading(false);
	};

	return (
		<div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500/95 backdrop-blur-sm border-b border-amber-600">
			<div className="max-w-7xl mx-auto px-4 py-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<AlertTriangle className="w-5 h-5 text-amber-900" />
						<div className="text-amber-900">
							<span className="font-medium">Impersonation aktiv:</span>{" "}
							<span>
								Du bist angemeldet als{" "}
								<strong>{impersonatedUserEmail}</strong>
							</span>
							<span className="text-amber-800 ml-2">
								(ursprünglich: {originalUserEmail})
							</span>
						</div>
					</div>
					<button
						type="button"
						onClick={handleEnd}
						disabled={isLoading}
						className="flex items-center gap-2 px-3 py-1 bg-amber-900 text-amber-100 rounded-lg hover:bg-amber-800 transition-colors text-sm font-medium disabled:opacity-50"
					>
						{isLoading ? (
							"Beende..."
						) : (
							<>
								<X className="w-4 h-4" />
								Impersonation beenden
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}

export default ImpersonationBanner;
