"use client";

import { useState, lazy, Suspense } from "react";
import { Code, Bot, BarChart3, ScrollText } from "lucide-react";
import { usePlatformRoleStore } from "@/store/platform-role.store";
import { DeveloperApply } from "@/components/developers/developer-apply";
import { BotList } from "@/components/developers/bot-list";
import { AnalyticsTab } from "@/components/developers/analytics-tab";
import { AuditLogTab } from "@/components/developers/audit-log-tab";
import type { BotApplication } from "@/lib/types/platform-role";

const BotForm = lazy(() =>
	import("@/components/developers/bot-form").then((m) => ({ default: m.BotForm }))
);

type TabId = "bots" | "analytics" | "audit-log";

export default function DeveloperPortalPage() {
	const role = usePlatformRoleStore((s) => s.role);
	const isLoaded = usePlatformRoleStore((s) => s.isLoaded);
	const isDeveloper = usePlatformRoleStore((s) => s.isDeveloper());
	const isAdmin = usePlatformRoleStore((s) => s.isAdmin());
	const canViewAnalytics = usePlatformRoleStore((s) => s.can("can_view_bot_analytics"));

	const [activeTab, setActiveTab] = useState<TabId>("bots");
	const [showBotForm, setShowBotForm] = useState(false);
	const [editingBot, setEditingBot] = useState<BotApplication | null>(null);

	// Loading state
	if (!isLoaded) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
			</div>
		);
	}

	// Non-developer: show application form
	if (!isDeveloper) {
		return (
			<div className="h-full overflow-y-auto scrollbar-thin">
				<DeveloperApply />
			</div>
		);
	}

	const tabs: { id: TabId; label: string; icon: typeof Bot; show: boolean }[] = [
		{ id: "bots", label: "My Bots", icon: Bot, show: true },
		{ id: "analytics", label: "Analytics", icon: BarChart3, show: canViewAnalytics || isAdmin },
		{ id: "audit-log", label: "Audit Log", icon: ScrollText, show: isAdmin },
	];

	const visibleTabs = tabs.filter((t) => t.show);

	const handleManageBot = (bot: BotApplication) => {
		setEditingBot(bot);
		setShowBotForm(true);
	};

	const handleRegisterNew = () => {
		setEditingBot(null);
		setShowBotForm(true);
	};

	const handleCloseBotForm = () => {
		setShowBotForm(false);
		setEditingBot(null);
	};

	return (
		<div className="h-full flex flex-col">
			{/* Header */}
			<div className="shrink-0 px-6 py-4 border-b border-white/10 bg-[oklch(0.14_0.02_250)]">
				<div className="flex items-center gap-3 mb-3">
					<Code className="w-5 h-5 text-blue-400" />
					<h1 className="text-lg font-bold text-white">Developer Portal</h1>
					<span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded">
						{role.replace("_", " ")}
					</span>
				</div>

				{/* Tabs */}
				<div className="flex items-center gap-1">
					{visibleTabs.map((tab) => {
						const Icon = tab.icon;
						const isActive = activeTab === tab.id;
						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => setActiveTab(tab.id)}
								className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
									isActive
										? "bg-white/10 text-white"
										: "text-slate-400 hover:text-slate-200 hover:bg-white/5"
								}`}
							>
								<Icon className="w-4 h-4" />
								{tab.label}
							</button>
						);
					})}
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto scrollbar-thin p-6">
				{activeTab === "bots" && (
					<BotList onRegisterNew={handleRegisterNew} onManage={handleManageBot} />
				)}
				{activeTab === "analytics" && <AnalyticsTab />}
				{activeTab === "audit-log" && <AuditLogTab />}
			</div>

			{/* Bot Form Slide-over */}
			{showBotForm && (
				<Suspense fallback={null}>
					<BotForm bot={editingBot} onClose={handleCloseBotForm} />
				</Suspense>
			)}
		</div>
	);
}
