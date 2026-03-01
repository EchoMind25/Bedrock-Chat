"use client";

import { useState, useMemo, useEffect } from "react";
import { useFamilyStore } from "@/store/family.store";
import {
	Server,
	Users,
	Ban,
	Unlock,
	Shield,
	ShieldCheck,
	Loader2,
} from "lucide-react";
import { ApprovalQueue } from "@/components/family/dashboard/ApprovalQueue";

type Tab = "active" | "restricted" | "pending";

interface TeenServer {
	id: string;
	name: string;
	description: string | null;
	icon: string | null;
	memberCount: number;
	isFamilyFriendly: boolean;
}

function ServerIcon({ icon, size = 20, fallback }: { icon: string | null; size?: number; fallback?: React.ReactNode }) {
	if (icon?.startsWith("http")) {
		return <img src={icon} alt="" className="w-full h-full rounded-xl object-cover" />;
	}
	if (icon) {
		return <span className="text-2xl leading-none">{icon}</span>;
	}
	return <>{fallback ?? <Server size={size} style={{ color: "var(--pd-text-muted)" }} />}</>;
}

export default function ServersPage() {
	const getSelectedTeenAccount = useFamilyStore((s) => s.getSelectedTeenAccount);
	const restrictServer = useFamilyStore((s) => s.restrictServer);
	const unrestrictServer = useFamilyStore((s) => s.unrestrictServer);
	const teenAccount = getSelectedTeenAccount();
	const [activeTab, setActiveTab] = useState<Tab>("active");
	const [pendingCount, setPendingCount] = useState(0);
	const [teenServers, setTeenServers] = useState<TeenServer[]>([]);
	const [loading, setLoading] = useState(false);

	// Fetch the teen's actual server memberships when the selected teen changes
	useEffect(() => {
		if (!teenAccount) return;
		const teenUserId = teenAccount.user.id;
		setLoading(true);
		fetch(`/api/family/teen-servers?teenId=${teenUserId}`)
			.then((res) => res.json())
			.then((data: { servers?: TeenServer[] }) => {
				setTeenServers(data.servers ?? []);
			})
			.catch(() => {
				setTeenServers([]);
			})
			.finally(() => {
				setLoading(false);
			});
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [teenAccount?.user.id]);

	const restrictedServerIds = useMemo(
		() => new Set(teenAccount?.restrictions.restrictedServers || []),
		[teenAccount],
	);

	const activeServers = useMemo(
		() => teenServers.filter((s) => !restrictedServerIds.has(s.id)),
		[teenServers, restrictedServerIds],
	);

	const restrictedServers = useMemo(
		() => teenServers.filter((s) => restrictedServerIds.has(s.id)),
		[teenServers, restrictedServerIds],
	);

	if (!teenAccount) {
		return (
			<div className="flex items-center justify-center h-full">
				<p style={{ color: "var(--pd-text-muted)" }}>No teen account selected</p>
			</div>
		);
	}

	const tabs: { id: Tab; label: string; count: number }[] = [
		{ id: "active", label: "Active", count: activeServers.length },
		{ id: "restricted", label: "Restricted", count: restrictedServers.length },
		{ id: "pending", label: "Pending", count: pendingCount },
	];

	return (
		<div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-semibold" style={{ color: "var(--pd-text)" }}>
					Server Management
				</h1>
				<p className="text-sm mt-1" style={{ color: "var(--pd-text-muted)" }}>
					View and manage servers for {teenAccount.user.displayName}
				</p>
			</div>

			{/* Tabs */}
			<div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--pd-bg-secondary)" }}>
				{tabs.map((tab) => (
					<button
						key={tab.id}
						type="button"
						onClick={() => setActiveTab(tab.id)}
						className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
						style={{
							background: activeTab === tab.id ? "var(--pd-surface)" : "transparent",
							color: activeTab === tab.id ? "var(--pd-text)" : "var(--pd-text-muted)",
							boxShadow: activeTab === tab.id ? "0 1px 3px oklch(0 0 0 / 0.06)" : "none",
						}}
					>
						{tab.label}
						{tab.count > 0 && (
							<span
								className="min-w-[20px] h-5 flex items-center justify-center rounded-full text-xs px-1.5"
								style={{
									background: tab.id === "pending" ? "var(--pd-danger)" : "var(--pd-bg-secondary)",
									color: tab.id === "pending" ? "white" : "var(--pd-text-muted)",
								}}
							>
								{tab.count}
							</span>
						)}
					</button>
				))}
			</div>

			{/* Active servers */}
			{activeTab === "active" && (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{loading ? (
						<div className="pd-card p-8 text-center col-span-2 flex items-center justify-center gap-2">
							<Loader2 size={20} className="animate-spin" style={{ color: "var(--pd-text-muted)" }} />
							<p style={{ color: "var(--pd-text-muted)" }}>Loading servers…</p>
						</div>
					) : activeServers.length > 0 ? (
						activeServers.map((server) => (
							<div key={server.id} className="pd-card p-4">
								<div className="flex items-start gap-3">
									<div
										className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
										style={{ background: "var(--pd-bg-secondary)" }}
									>
										<ServerIcon icon={server.icon} size={20} />
									</div>
									<div className="flex-1 min-w-0">
										<h3 className="font-semibold truncate" style={{ color: "var(--pd-text)" }}>
											{server.name}
										</h3>
										{server.isFamilyFriendly && (
											<span
												className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium mt-1"
												style={{ background: "var(--pd-success-light)", color: "var(--pd-success)" }}
											>
												<ShieldCheck size={10} />
												Family Friendly
											</span>
										)}
										{server.description && (
											<p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--pd-text-muted)" }}>
												{server.description}
											</p>
										)}
										<div className="flex items-center gap-3 mt-2">
											<span className="text-xs flex items-center gap-1" style={{ color: "var(--pd-text-muted)" }}>
												<Users size={12} /> {server.memberCount} members
											</span>
										</div>
									</div>
								</div>
								<div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--pd-border)" }}>
									<button
										type="button"
										onClick={() => restrictServer(teenAccount.id, server.id, server.name)}
										className="text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
										style={{ color: "var(--pd-danger)", background: "var(--pd-danger-light)" }}
									>
										<Ban size={12} />
										Restrict
									</button>
								</div>
							</div>
						))
					) : (
						<div className="pd-card p-8 text-center col-span-2">
							<Server size={32} className="mx-auto mb-3" style={{ color: "var(--pd-text-muted)" }} />
							<p style={{ color: "var(--pd-text-muted)" }}>No active servers</p>
						</div>
					)}
				</div>
			)}

			{/* Restricted servers */}
			{activeTab === "restricted" && (
				<div className="space-y-3">
					{loading ? (
						<div className="pd-card p-8 text-center flex items-center justify-center gap-2">
							<Loader2 size={20} className="animate-spin" style={{ color: "var(--pd-text-muted)" }} />
							<p style={{ color: "var(--pd-text-muted)" }}>Loading servers…</p>
						</div>
					) : restrictedServers.length > 0 ? (
						restrictedServers.map((server) => (
							<div
								key={server.id}
								className="pd-card p-4 flex items-center justify-between"
								style={{ borderColor: "var(--pd-danger)", borderLeftWidth: "3px" }}
							>
								<div className="flex items-center gap-3">
									<div
										className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden"
										style={{ background: "var(--pd-danger-light)" }}
									>
										<ServerIcon
											icon={server.icon}
											size={18}
											fallback={<Ban size={18} style={{ color: "var(--pd-danger)" }} />}
										/>
									</div>
									<div>
										<h3 className="font-medium text-sm" style={{ color: "var(--pd-text)" }}>
											{server.name}
										</h3>
										<p className="text-xs" style={{ color: "var(--pd-text-muted)" }}>
											{server.memberCount} members
										</p>
									</div>
								</div>
								<button
									type="button"
									onClick={() => unrestrictServer(teenAccount.id, server.id, server.name)}
									className="text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
									style={{ color: "var(--pd-success)", background: "var(--pd-success-light)" }}
								>
									<Unlock size={12} />
									Unrestrict
								</button>
							</div>
						))
					) : (
						<div className="pd-card p-8 text-center">
							<Shield size={32} className="mx-auto mb-3" style={{ color: "var(--pd-text-muted)" }} />
							<p style={{ color: "var(--pd-text-muted)" }}>No restricted servers</p>
						</div>
					)}
				</div>
			)}

			{/* Pending approvals — realtime via ApprovalQueue */}
			{activeTab === "pending" && (
				<ApprovalQueue onCountChange={setPendingCount} />
			)}

			{/* Privacy notice */}
			<div
				className="text-center text-sm p-4 rounded-lg"
				style={{ background: "var(--pd-primary-light)", color: "var(--pd-primary)" }}
			>
				<p className="flex items-center justify-center gap-2">
					<Shield size={16} />
					All server management actions are logged and visible to your teen.
				</p>
			</div>
		</div>
	);
}
