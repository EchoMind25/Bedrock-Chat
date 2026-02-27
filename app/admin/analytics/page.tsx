"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DateRangeSelector } from "./components/DateRangeSelector";
import { NavigationTab } from "./components/NavigationTab";
import { FeatureUsageTab } from "./components/FeatureUsageTab";
import { PerformanceTab } from "./components/PerformanceTab";
import { SessionsTab } from "./components/SessionsTab";
import { BugReportsTab } from "./components/BugReportsTab";

type Tab = "navigation" | "features" | "performance" | "sessions" | "bugs";

const TAB_LABELS: Record<Tab, string> = {
	navigation: "Navigation & Funnels",
	features: "Feature Usage",
	performance: "Performance",
	sessions: "Sessions & Engagement",
	bugs: "Bug Reports",
};

function AnalyticsDashboard() {
	const searchParams = useSearchParams();
	const activeTab = (searchParams.get("tab") as Tab) ?? "navigation";

	return (
		<div className="flex flex-col h-full">
			{/* Top bar */}
			<div className="border-b border-slate-800/50 px-6 py-4 flex items-center justify-between shrink-0">
				<h1 className="text-sm font-medium text-slate-300">
					{TAB_LABELS[activeTab] ?? "Analytics"}
				</h1>
				<DateRangeSelector />
			</div>

			{/* Tab content */}
			<div className="flex-1 overflow-y-auto">
				{activeTab === "navigation" && <NavigationTab />}
				{activeTab === "features" && <FeatureUsageTab />}
				{activeTab === "performance" && <PerformanceTab />}
				{activeTab === "sessions" && <SessionsTab />}
				{activeTab === "bugs" && <BugReportsTab />}
				{!["navigation", "features", "performance", "sessions", "bugs"].includes(activeTab) && (
					<NavigationTab />
				)}
			</div>
		</div>
	);
}

export default function AdminAnalyticsPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center h-full">
					<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			}
		>
			<AnalyticsDashboard />
		</Suspense>
	);
}
