import type { ReactNode } from "react";

interface SettingsRowProps {
	label: string;
	description?: string;
	children: ReactNode;
	disabled?: boolean;
}

export function SettingsRow({ label, description, children, disabled }: SettingsRowProps) {
	return (
		<div className={`flex items-center justify-between gap-4 py-3 ${disabled ? "opacity-50" : ""}`}>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium text-slate-200">{label}</p>
				{description && (
					<p className="text-xs text-slate-400 mt-0.5">{description}</p>
				)}
			</div>
			<div className="shrink-0">{children}</div>
		</div>
	);
}
