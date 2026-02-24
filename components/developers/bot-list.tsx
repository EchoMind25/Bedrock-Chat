"use client";

import { useEffect } from "react";
import { Bot, Plus, ExternalLink, MoreVertical } from "lucide-react";
import { usePlatformRoleStore } from "@/store/platform-role.store";
import { Badge } from "@/components/ui/badge/badge";
import { Button } from "@/components/ui/button/button";
import type { BotApplication } from "@/lib/types/platform-role";

interface BotListProps {
	onRegisterNew: () => void;
	onManage: (bot: BotApplication) => void;
}

const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "danger"> = {
	pending: "warning",
	approved: "success",
	rejected: "danger",
	suspended: "danger",
};

export function BotList({ onRegisterNew, onManage }: BotListProps) {
	const botApplications = usePlatformRoleStore((s) => s.botApplications);
	const isLoadingBots = usePlatformRoleStore((s) => s.isLoadingBots);
	const loadBotApplications = usePlatformRoleStore((s) => s.loadBotApplications);

	useEffect(() => {
		loadBotApplications();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	if (isLoadingBots) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
			</div>
		);
	}

	if (botApplications.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
					<Bot className="w-8 h-8 text-slate-500" />
				</div>
				<h3 className="text-lg font-semibold text-white mb-1">No Bots Yet</h3>
				<p className="text-slate-400 text-sm mb-6 max-w-sm">
					Register your first bot to get started with the Bedrock developer platform.
				</p>
				<Button onClick={onRegisterNew}>
					<Plus className="w-4 h-4 mr-2" />
					Register New Bot
				</Button>
			</div>
		);
	}

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<p className="text-sm text-slate-400">{botApplications.length} bot{botApplications.length !== 1 ? "s" : ""}</p>
				<Button variant="secondary" size="sm" onClick={onRegisterNew}>
					<Plus className="w-4 h-4 mr-1" />
					Register New Bot
				</Button>
			</div>

			<div className="space-y-2">
				{botApplications.map((bot) => (
					<button
						key={bot.id}
						type="button"
						onClick={() => onManage(bot)}
						className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors text-left group"
					>
						{/* Bot avatar */}
						<div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
							{bot.avatar_url ? (
								<img src={bot.avatar_url} alt={bot.name} className="w-10 h-10 rounded-lg object-cover" />
							) : (
								<Bot className="w-5 h-5 text-slate-400" />
							)}
						</div>

						{/* Bot info */}
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2">
								<p className="text-sm font-semibold text-white truncate">{bot.name}</p>
								<Badge variant={STATUS_VARIANTS[bot.status] ?? "default"}>
									{bot.status}
								</Badge>
							</div>
							<div className="flex items-center gap-3 mt-0.5">
								<span className="text-xs text-slate-400">
									{bot.bot_type}
								</span>
								<span className="text-xs text-slate-500">
									{bot.install_count} install{bot.install_count !== 1 ? "s" : ""}
								</span>
								{bot.webhook_verified && (
									<span className="text-xs text-green-400 flex items-center gap-1">
										<ExternalLink className="w-3 h-3" />
										Webhook verified
									</span>
								)}
							</div>
						</div>

						{/* Actions */}
						<div className="opacity-0 group-hover:opacity-100 transition-opacity">
							<MoreVertical className="w-4 h-4 text-slate-400" />
						</div>
					</button>
				))}
			</div>
		</div>
	);
}
