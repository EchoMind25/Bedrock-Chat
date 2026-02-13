"use client";

import { useFamilyStore } from "@/store/family.store";
import { MONITORING_LEVELS } from "@/lib/types/family";
import {
	Shield,
	Eye,
	Clock,
	Search,
	ShieldOff,
	Server,
	ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface TeenSettingsPanelProps {
	teenAccountId: string;
}

export function TeenSettingsPanel({ teenAccountId }: TeenSettingsPanelProps) {
	const teenAccounts = useFamilyStore((s) => s.teenAccounts);
	const teenAccount = teenAccounts.find((ta) => ta.id === teenAccountId);

	if (!teenAccount) {
		return null;
	}

	const levelInfo = MONITORING_LEVELS[teenAccount.monitoringLevel];
	const keywordAlertCount = teenAccount.restrictions.keywordAlerts?.filter((a) => a.isActive).length ?? 0;
	const blockedCategoryCount = teenAccount.restrictions.blockedCategories?.filter((c) => c.isActive).length ?? 0;
	const timeLimitConfig = teenAccount.restrictions.timeLimitConfig;
	const restrictedServerCount = teenAccount.restrictions.restrictedServers?.length ?? 0;

	const features = levelInfo.features;

	return (
		<div className="space-y-4">
			{/* Current monitoring level */}
			<div className="p-4 rounded-xl bg-white/5 border border-white/10">
				<div className="flex items-center gap-3 mb-3">
					<div
						className="w-10 h-10 rounded-lg flex items-center justify-center"
						style={{ backgroundColor: `${levelInfo.color.replace(")", " / 0.15)")}` }}
					>
						<Shield size={20} style={{ color: levelInfo.color }} />
					</div>
					<div>
						<p className="text-sm font-semibold text-white">
							Level {teenAccount.monitoringLevel}: {levelInfo.name}
						</p>
						<p className="text-xs text-white/60">{levelInfo.description}</p>
					</div>
				</div>

				{/* What parent can see */}
				<div className="space-y-1.5">
					<p className="text-xs font-medium text-white/40 uppercase tracking-wider">
						What your parent can see
					</p>
					{features.map((feature) => (
						<div key={feature} className="flex items-center gap-2">
							<Eye size={12} className="text-white/40 shrink-0" />
							<span className="text-xs text-white/70">{feature}</span>
						</div>
					))}
				</div>
			</div>

			{/* Active safety settings */}
			<div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
				<p className="text-xs font-medium text-white/40 uppercase tracking-wider">
					Active safety settings
				</p>

				{/* Keyword alerts */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Search size={14} className="text-cyan-400" />
						<span className="text-sm text-white/80">Keyword Alerts</span>
					</div>
					<span className="text-xs text-white/50">
						{keywordAlertCount > 0 ? `${keywordAlertCount} active` : "None"}
					</span>
				</div>

				{/* Blocked categories */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<ShieldOff size={14} className="text-red-400" />
						<span className="text-sm text-white/80">Blocked Categories</span>
					</div>
					<span className="text-xs text-white/50">
						{blockedCategoryCount > 0 ? `${blockedCategoryCount} blocked` : "None"}
					</span>
				</div>

				{/* Time limits */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Clock size={14} className="text-amber-400" />
						<span className="text-sm text-white/80">Time Limits</span>
					</div>
					<span className="text-xs text-white/50">
						{timeLimitConfig?.isActive
							? `${Math.floor(timeLimitConfig.dailyLimitMinutes / 60)}h ${timeLimitConfig.dailyLimitMinutes % 60}m/day`
							: "Not set"}
					</span>
				</div>

				{/* Restricted servers */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Server size={14} className="text-purple-400" />
						<span className="text-sm text-white/80">Restricted Servers</span>
					</div>
					<span className="text-xs text-white/50">
						{restrictedServerCount > 0 ? `${restrictedServerCount} restricted` : "None"}
					</span>
				</div>
			</div>

			{/* Transparency log link */}
			<Link
				href="/family/dashboard"
				className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 transition-colors"
			>
				<div className="flex items-center gap-2">
					<Eye size={14} className="text-blue-400" />
					<span className="text-sm text-blue-300">
						View Transparency Log
					</span>
				</div>
				<ChevronRight size={14} className="text-blue-400" />
			</Link>

			<p className="text-xs text-white/40 text-center">
				All parent access to your account is logged and visible to you.
			</p>
		</div>
	);
}
