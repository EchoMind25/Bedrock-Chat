import type { ReactNode } from "react";

interface SettingsSectionProps {
	title: string;
	description?: string;
	children: ReactNode;
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
	return (
		<section className="border-b border-white/5 pb-6 mb-6 last:border-0 last:pb-0 last:mb-0">
			<h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
				{title}
			</h3>
			{description && (
				<p className="text-sm text-slate-400 mb-3">{description}</p>
			)}
			<div className="space-y-1">{children}</div>
		</section>
	);
}
