"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFamilyStore } from "@/store/family.store";
import { useParentDashboardStore } from "@/store/parent-dashboard.store";
import { MONITORING_LEVELS } from "@/lib/types/family";
import type { MonitoringLevel } from "@/lib/types/family";
import { Avatar } from "@/components/ui/avatar/avatar";
import {
	Shield,
	Eye,
	Search,
	Clock,
	Check,
	ArrowRight,
	ArrowLeft,
} from "lucide-react";

const STEPS = [
	{ title: "Welcome", icon: Shield },
	{ title: "Monitoring Level", icon: Eye },
	{ title: "Keyword Alerts", icon: Search },
	{ title: "Time Limits", icon: Clock },
	{ title: "Review", icon: Check },
];

export default function OnboardingPage() {
	const router = useRouter();
	// ✅ Use selectors to subscribe only to specific values, not entire stores
	const teenAccounts = useFamilyStore((state) => state.teenAccounts);
	const setMonitoringLevel = useFamilyStore((state) => state.setMonitoringLevel);
	const addKeywordAlert = useFamilyStore((state) => state.addKeywordAlert);
	const setTimeLimit = useFamilyStore((state) => state.setTimeLimit);
	const setOnboardingComplete = useParentDashboardStore((state) => state.setOnboardingComplete);

	const [step, setStep] = useState(0);
	const [selectedLevels, setSelectedLevels] = useState<Record<string, MonitoringLevel>>(() => {
		const initial: Record<string, MonitoringLevel> = {};
		for (const ta of teenAccounts) {
			initial[ta.id] = ta.monitoringLevel;
		}
		return initial;
	});
	const [keywords, setKeywords] = useState<string[]>([]);
	const [newKeyword, setNewKeyword] = useState("");
	const [enableTimeLimit, setEnableTimeLimit] = useState(false);
	const [dailyMinutes, setDailyMinutes] = useState(480);

	const handleComplete = () => {
		// Apply monitoring levels
		for (const ta of teenAccounts) {
			if (selectedLevels[ta.id] !== ta.monitoringLevel) {
				setMonitoringLevel(ta.id, selectedLevels[ta.id]);
			}
		}

		// Apply keyword alerts
		for (const keyword of keywords) {
			for (const ta of teenAccounts) {
				addKeywordAlert(ta.id, keyword, "medium");
			}
		}

		// Apply time limits
		if (enableTimeLimit) {
			for (const ta of teenAccounts) {
				setTimeLimit(ta.id, {
					dailyLimitMinutes: dailyMinutes,
					weekdaySchedule: null,
					weekendSchedule: null,
					isActive: true,
				});
			}
		}

		setOnboardingComplete();
		router.push("/parent-dashboard/overview");
	};

	const canGoNext = step < STEPS.length - 1;
	const canGoBack = step > 0;

	return (
		<div className="min-h-full flex flex-col items-center justify-center p-4 lg:p-8">
			<div className="w-full max-w-2xl">
				{/* Progress bar */}
				<div className="flex items-center gap-2 mb-8">
					{STEPS.map((s, i) => (
						<div key={i} className="flex-1 flex items-center gap-2">
							<div
								className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors"
								style={{
									background: i <= step ? "var(--pd-primary)" : "var(--pd-bg-secondary)",
									color: i <= step ? "white" : "var(--pd-text-muted)",
								}}
							>
								{i < step ? <Check size={14} /> : i + 1}
							</div>
							{i < STEPS.length - 1 && (
								<div
									className="flex-1 h-0.5 rounded-full"
									style={{ background: i < step ? "var(--pd-primary)" : "var(--pd-border)" }}
								/>
							)}
						</div>
					))}
				</div>

				{/* Step content */}
				<div className="pd-card p-6 lg:p-8">
					{/* Step 1: Welcome */}
					{step === 0 && (
						<div className="text-center space-y-4">
							<div
								className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
								style={{ background: "var(--pd-primary-light)" }}
							>
								<Shield size={32} style={{ color: "var(--pd-primary)" }} />
							</div>
							<h2 className="text-2xl font-semibold" style={{ color: "var(--pd-text)" }}>
								Welcome to the Parent Dashboard
							</h2>
							<p className="text-sm max-w-md mx-auto" style={{ color: "var(--pd-text-muted)" }}>
								This dashboard helps you monitor and manage your teen&apos;s Bedrock Chat activity.
								All your actions here are transparent -- your teen can see what you access through
								their transparency log.
							</p>
							<div className="pt-4 space-y-2">
								{teenAccounts.map((ta) => (
									<div
										key={ta.id}
										className="flex items-center gap-3 p-3 rounded-lg mx-auto max-w-xs"
										style={{ background: "var(--pd-bg-secondary)" }}
									>
										<Avatar src={ta.user.avatar} alt={ta.user.displayName} size="sm" />
										<span className="text-sm font-medium" style={{ color: "var(--pd-text)" }}>
											{ta.user.displayName}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Step 2: Monitoring Level */}
					{step === 1 && (
						<div className="space-y-5">
							<div className="text-center">
								<h2 className="text-xl font-semibold" style={{ color: "var(--pd-text)" }}>
									Choose Monitoring Level
								</h2>
								<p className="text-sm mt-1" style={{ color: "var(--pd-text-muted)" }}>
									Select how closely you want to monitor activity
								</p>
							</div>

							{teenAccounts.map((ta) => (
								<div key={ta.id}>
									{teenAccounts.length > 1 && (
										<p className="text-sm font-medium mb-2" style={{ color: "var(--pd-text-secondary)" }}>
											For {ta.user.displayName}:
										</p>
									)}
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										{([1, 2, 3, 4] as MonitoringLevel[]).map((level) => {
											const info = MONITORING_LEVELS[level];
											const isSelected = selectedLevels[ta.id] === level;
											return (
												<button
													key={level}
													type="button"
													onClick={() =>
														setSelectedLevels((prev) => ({ ...prev, [ta.id]: level }))
													}
													className="pd-card p-4 text-left transition-all"
													style={{
														borderColor: isSelected ? info.color : "var(--pd-border)",
														borderWidth: isSelected ? "2px" : "1px",
													}}
												>
													<div className="flex items-center gap-2 mb-1">
														<div
															className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
															style={{
																background: `${info.color.replace(")", " / 0.15)")}`,
																color: info.color,
															}}
														>
															{level}
														</div>
														<span className="font-semibold text-sm" style={{ color: "var(--pd-text)" }}>
															{info.name}
														</span>
														{isSelected && <Check size={14} style={{ color: info.color }} />}
													</div>
													<p className="text-xs" style={{ color: "var(--pd-text-muted)" }}>
														{info.description}
													</p>
												</button>
											);
										})}
									</div>
								</div>
							))}
						</div>
					)}

					{/* Step 3: Keywords */}
					{step === 2 && (
						<div className="space-y-5">
							<div className="text-center">
								<h2 className="text-xl font-semibold" style={{ color: "var(--pd-text)" }}>
									Keyword Alerts (Optional)
								</h2>
								<p className="text-sm mt-1" style={{ color: "var(--pd-text-muted)" }}>
									Get notified when specific words or phrases appear. You can add more later.
								</p>
							</div>

							<div className="flex gap-2">
								<input
									type="text"
									value={newKeyword}
									onChange={(e) => setNewKeyword(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter" && newKeyword.trim()) {
											setKeywords([...keywords, newKeyword.trim()]);
											setNewKeyword("");
										}
									}}
									placeholder="Enter a keyword..."
									className="flex-1 px-3 py-2 rounded-lg text-sm"
									style={{
										background: "var(--pd-bg-secondary)",
										color: "var(--pd-text)",
										border: "1px solid var(--pd-border)",
									}}
								/>
								<button
									type="button"
									onClick={() => {
										if (newKeyword.trim()) {
											setKeywords([...keywords, newKeyword.trim()]);
											setNewKeyword("");
										}
									}}
									className="px-4 py-2 rounded-lg text-sm font-medium text-white"
									style={{ background: "var(--pd-primary)" }}
								>
									Add
								</button>
							</div>

							{keywords.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{keywords.map((kw, i) => (
										<span
											key={i}
											className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
											style={{ background: "var(--pd-primary-light)", color: "var(--pd-primary)" }}
										>
											{kw}
											<button
												type="button"
												onClick={() => setKeywords(keywords.filter((_, j) => j !== i))}
												className="ml-1"
											>
												&times;
											</button>
										</span>
									))}
								</div>
							)}
						</div>
					)}

					{/* Step 4: Time Limits */}
					{step === 3 && (
						<div className="space-y-5">
							<div className="text-center">
								<h2 className="text-xl font-semibold" style={{ color: "var(--pd-text)" }}>
									Time Limits (Optional)
								</h2>
								<p className="text-sm mt-1" style={{ color: "var(--pd-text-muted)" }}>
									Set daily usage limits. You can configure schedules later.
								</p>
							</div>

							<div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "var(--pd-bg-secondary)" }}>
								<div>
									<p className="text-sm font-medium" style={{ color: "var(--pd-text)" }}>
										Enable Daily Limit
									</p>
								</div>
								<button
									type="button"
									onClick={() => setEnableTimeLimit(!enableTimeLimit)}
									className="w-10 h-6 rounded-full transition-colors relative"
									style={{ background: enableTimeLimit ? "var(--pd-primary)" : "var(--pd-border)" }}
								>
									<span
										className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
										style={{ left: enableTimeLimit ? "18px" : "2px" }}
									/>
								</button>
							</div>

							{enableTimeLimit && (
								<div>
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm" style={{ color: "var(--pd-text)" }}>Daily Limit</span>
										<span className="text-sm font-semibold" style={{ color: "var(--pd-primary)" }}>
											{Math.floor(dailyMinutes / 60)}h {dailyMinutes % 60}m
										</span>
									</div>
									<input
										type="range"
										min={30}
										max={1440}
										step={30}
										value={dailyMinutes}
										onChange={(e) => setDailyMinutes(Number(e.target.value))}
										className="w-full accent-[oklch(0.55_0.15_240)]"
									/>
								</div>
							)}
						</div>
					)}

					{/* Step 5: Review */}
					{step === 4 && (
						<div className="space-y-5">
							<div className="text-center">
								<h2 className="text-xl font-semibold" style={{ color: "var(--pd-text)" }}>
									Review & Confirm
								</h2>
								<p className="text-sm mt-1" style={{ color: "var(--pd-text-muted)" }}>
									Review your settings before applying them
								</p>
							</div>

							<div className="space-y-3">
								{/* Monitoring levels */}
								<div className="p-4 rounded-lg" style={{ background: "var(--pd-bg-secondary)" }}>
									<p className="text-xs font-medium mb-2" style={{ color: "var(--pd-text-muted)" }}>
										MONITORING LEVELS
									</p>
									{teenAccounts.map((ta) => (
										<div key={ta.id} className="flex items-center justify-between py-1">
											<span className="text-sm" style={{ color: "var(--pd-text)" }}>
												{ta.user.displayName}
											</span>
											<span
												className="text-sm font-medium"
												style={{ color: MONITORING_LEVELS[selectedLevels[ta.id]].color }}
											>
												{MONITORING_LEVELS[selectedLevels[ta.id]].name}
											</span>
										</div>
									))}
								</div>

								{/* Keywords */}
								<div className="p-4 rounded-lg" style={{ background: "var(--pd-bg-secondary)" }}>
									<p className="text-xs font-medium mb-2" style={{ color: "var(--pd-text-muted)" }}>
										KEYWORD ALERTS
									</p>
									<p className="text-sm" style={{ color: "var(--pd-text)" }}>
										{keywords.length > 0 ? keywords.join(", ") : "None configured"}
									</p>
								</div>

								{/* Time limits */}
								<div className="p-4 rounded-lg" style={{ background: "var(--pd-bg-secondary)" }}>
									<p className="text-xs font-medium mb-2" style={{ color: "var(--pd-text-muted)" }}>
										TIME LIMITS
									</p>
									<p className="text-sm" style={{ color: "var(--pd-text)" }}>
										{enableTimeLimit
											? `${Math.floor(dailyMinutes / 60)}h ${dailyMinutes % 60}m per day`
											: "Not enabled"}
									</p>
								</div>
							</div>

							<div
								className="p-3 rounded-lg text-xs text-center"
								style={{ background: "var(--pd-primary-light)", color: "var(--pd-primary)" }}
							>
								Your teen will be notified of these settings through their transparency log.
							</div>
						</div>
					)}
				</div>

				{/* Navigation buttons */}
				<div className="flex items-center justify-between mt-6">
					<div>
						{canGoBack && (
							<button
								type="button"
								onClick={() => setStep(step - 1)}
								className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5"
								style={{ color: "var(--pd-text-secondary)" }}
							>
								<ArrowLeft size={16} />
								Back
							</button>
						)}
					</div>
					<div className="flex gap-2">
						{step >= 2 && step < 4 && (
							<button
								type="button"
								onClick={() => setStep(step + 1)}
								className="px-4 py-2 rounded-lg text-sm font-medium"
								style={{ color: "var(--pd-text-muted)" }}
							>
								Skip
							</button>
						)}
						{canGoNext ? (
							<button
								type="button"
								onClick={() => setStep(step + 1)}
								className="px-5 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-1.5"
								style={{ background: "var(--pd-primary)" }}
							>
								Next
								<ArrowRight size={16} />
							</button>
						) : (
							<button
								type="button"
								onClick={handleComplete}
								className="px-5 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-1.5"
								style={{ background: "var(--pd-success)" }}
							>
								<Check size={16} />
								Complete Setup
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
