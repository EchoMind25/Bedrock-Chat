"use client";

import { Badge } from "@/components/ui/badge/badge";
import { SettingsSection } from "../settings-section";

export function AdminTab() {
	return (
		<div className="space-y-8">
			<div className="flex items-center gap-3">
				<h1 className="text-2xl font-bold text-white">Admin Panel</h1>
				<Badge variant="primary">Coming Soon</Badge>
			</div>
			<p className="text-slate-400 text-sm">
				Platform management and moderation tools will be available here in a future update.
			</p>

			<SettingsSection title="Planned Features">
				<ul className="space-y-2 text-sm text-slate-300">
					<li className="flex items-center gap-2">
						<span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
						User management and role assignment
					</li>
					<li className="flex items-center gap-2">
						<span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
						Server oversight and moderation queue
					</li>
					<li className="flex items-center gap-2">
						<span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
						Content moderation and auto-mod configuration
					</li>
					<li className="flex items-center gap-2">
						<span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
						Platform analytics and usage metrics
					</li>
					<li className="flex items-center gap-2">
						<span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
						Audit logs and security monitoring
					</li>
				</ul>
			</SettingsSection>
		</div>
	);
}
