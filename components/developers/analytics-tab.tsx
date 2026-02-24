"use client";

import { useMemo } from "react";
import { BarChart3, TrendingUp, Users, MessageSquare } from "lucide-react";
import { usePlatformRoleStore } from "@/store/platform-role.store";

export function AnalyticsTab() {
	const botApplications = usePlatformRoleStore((s) => s.botApplications);

	const stats = useMemo(() => {
		const totalInstalls = botApplications.reduce((sum, b) => sum + b.install_count, 0);
		const approvedBots = botApplications.filter((b) => b.status === "approved").length;
		const pendingBots = botApplications.filter((b) => b.status === "pending").length;
		return { totalInstalls, approvedBots, pendingBots, totalBots: botApplications.length };
	}, [botApplications]);

	return (
		<div className="space-y-6">
			{/* Stats Grid */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<StatCard
					icon={<BarChart3 className="w-5 h-5 text-blue-400" />}
					label="Total Bots"
					value={stats.totalBots}
				/>
				<StatCard
					icon={<TrendingUp className="w-5 h-5 text-green-400" />}
					label="Approved"
					value={stats.approvedBots}
				/>
				<StatCard
					icon={<Users className="w-5 h-5 text-purple-400" />}
					label="Total Installs"
					value={stats.totalInstalls}
				/>
				<StatCard
					icon={<MessageSquare className="w-5 h-5 text-yellow-400" />}
					label="Pending Review"
					value={stats.pendingBots}
				/>
			</div>

			{/* Placeholder for charts */}
			<div className="p-6 rounded-xl border border-white/10 bg-white/5">
				<h3 className="text-sm font-semibold text-white mb-4">Activity Overview</h3>
				<div className="flex items-center justify-center h-48 text-slate-500 text-sm">
					{stats.totalBots === 0 ? (
						"Register a bot to start seeing analytics"
					) : (
						<div className="text-center">
							<BarChart3 className="w-8 h-8 mx-auto mb-2 text-slate-600" />
							<p>Detailed charts will appear here once your bots are active.</p>
							<p className="text-xs text-slate-600 mt-1">Aggregate data only — no user-level tracking</p>
						</div>
					)}
				</div>
			</div>

			{/* Per-bot breakdown */}
			{botApplications.length > 0 && (
				<div className="p-6 rounded-xl border border-white/10 bg-white/5">
					<h3 className="text-sm font-semibold text-white mb-4">Per-Bot Stats</h3>
					<div className="space-y-3">
						{botApplications.map((bot) => (
							<div key={bot.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
								<div>
									<p className="text-sm font-medium text-white">{bot.name}</p>
									<p className="text-xs text-slate-400">{bot.bot_type} &middot; {bot.status}</p>
								</div>
								<div className="text-right">
									<p className="text-sm text-white">{bot.install_count}</p>
									<p className="text-xs text-slate-400">installs</p>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
	return (
		<div className="p-4 rounded-xl border border-white/10 bg-white/5">
			<div className="flex items-center gap-2 mb-2">
				{icon}
				<span className="text-xs text-slate-400">{label}</span>
			</div>
			<p className="text-2xl font-bold text-white">{value}</p>
		</div>
	);
}
