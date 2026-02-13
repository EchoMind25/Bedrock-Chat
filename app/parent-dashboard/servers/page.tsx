"use client";

import { useState, useMemo } from "react";
import { useFamilyStore } from "@/store/family.store";
import { useServerStore } from "@/store/server.store";
import {
	Server,
	Users,
	Check,
	X,
	Ban,
	Unlock,
	Shield,
	Calendar,
} from "lucide-react";

type Tab = "active" | "restricted" | "pending";

export default function ServersPage() {
	const getSelectedTeenAccount = useFamilyStore((s) => s.getSelectedTeenAccount);
	const restrictServer = useFamilyStore((s) => s.restrictServer);
	const unrestrictServer = useFamilyStore((s) => s.unrestrictServer);
	const approveServer = useFamilyStore((s) => s.approveServer);
	const denyServer = useFamilyStore((s) => s.denyServer);
	const servers = useServerStore((s) => s.servers);
	const teenAccount = getSelectedTeenAccount();
	const [activeTab, setActiveTab] = useState<Tab>("active");

	const restrictedServerIds = useMemo(
		() => new Set(teenAccount?.restrictions.restrictedServers || []),
		[teenAccount],
	);

	const activeServers = useMemo(
		() => servers.filter((s) => s.id !== "home" && !restrictedServerIds.has(s.id)),
		[servers, restrictedServerIds],
	);

	const restrictedServers = useMemo(
		() => servers.filter((s) => restrictedServerIds.has(s.id)),
		[servers, restrictedServerIds],
	);

	const pendingApprovals = teenAccount?.pendingServers.filter((s) => s.status === "pending") || [];
	const resolvedApprovals = teenAccount?.pendingServers.filter((s) => s.status !== "pending") || [];

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
		{ id: "pending", label: "Pending", count: pendingApprovals.length },
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
					{activeServers.length > 0 ? (
						activeServers.map((server) => (
							<div key={server.id} className="pd-card p-4">
								<div className="flex items-start gap-3">
									<div
										className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
										style={{ background: "var(--pd-bg-secondary)" }}
									>
										{server.icon || <Server size={20} style={{ color: "var(--pd-text-muted)" }} />}
									</div>
									<div className="flex-1 min-w-0">
										<h3 className="font-semibold truncate" style={{ color: "var(--pd-text)" }}>
											{server.name}
										</h3>
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
										className="text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors"
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
					{restrictedServers.length > 0 ? (
						restrictedServers.map((server) => (
							<div
								key={server.id}
								className="pd-card p-4 flex items-center justify-between"
								style={{ borderColor: "var(--pd-danger)", borderLeftWidth: "3px" }}
							>
								<div className="flex items-center gap-3">
									<div
										className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
										style={{ background: "var(--pd-danger-light)" }}
									>
										{server.icon || <Ban size={18} style={{ color: "var(--pd-danger)" }} />}
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
									className="text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors"
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

			{/* Pending approvals */}
			{activeTab === "pending" && (
				<div className="space-y-4">
					{pendingApprovals.length > 0 ? (
						pendingApprovals.map((approval) => (
							<div key={approval.id} className="pd-card p-5">
								<div className="flex flex-col sm:flex-row sm:items-center gap-4">
									<div className="flex items-start gap-3 flex-1">
										<div
											className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
											style={{ background: "var(--pd-bg-secondary)" }}
										>
											{approval.server.icon || <Server size={24} style={{ color: "var(--pd-text-muted)" }} />}
										</div>
										<div>
											<h3 className="font-semibold" style={{ color: "var(--pd-text)" }}>
												{approval.server.name}
											</h3>
											{approval.server.description && (
												<p className="text-sm mt-0.5" style={{ color: "var(--pd-text-muted)" }}>
													{approval.server.description}
												</p>
											)}
											<div className="flex items-center gap-3 mt-1.5">
												<span className="text-xs flex items-center gap-1" style={{ color: "var(--pd-text-muted)" }}>
													<Users size={12} /> {approval.server.memberCount} members
												</span>
												<span className="text-xs flex items-center gap-1" style={{ color: "var(--pd-text-muted)" }}>
													<Calendar size={12} /> {new Date(approval.requestedAt).toLocaleDateString()}
												</span>
											</div>
										</div>
									</div>
									<div className="flex gap-2 shrink-0">
										<button
											type="button"
											onClick={() => approveServer(teenAccount.id, approval.id)}
											className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 text-white"
											style={{ background: "var(--pd-success)" }}
										>
											<Check size={16} />
											Approve
										</button>
										<button
											type="button"
											onClick={() => denyServer(teenAccount.id, approval.id)}
											className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5"
											style={{ background: "var(--pd-danger-light)", color: "var(--pd-danger)" }}
										>
											<X size={16} />
											Deny
										</button>
									</div>
								</div>
							</div>
						))
					) : (
						<div className="pd-card p-8 text-center">
							<Check size={32} className="mx-auto mb-3" style={{ color: "var(--pd-success)" }} />
							<p style={{ color: "var(--pd-text-muted)" }}>No pending server approvals</p>
						</div>
					)}

					{/* Resolved approvals */}
					{resolvedApprovals.length > 0 && (
						<div className="mt-6">
							<h3 className="text-sm font-semibold mb-3" style={{ color: "var(--pd-text-secondary)" }}>
								Resolved
							</h3>
							<div className="space-y-2">
								{resolvedApprovals.map((approval) => (
									<div key={approval.id} className="pd-card p-3 flex items-center justify-between">
										<div className="flex items-center gap-3">
											<div
												className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
												style={{ background: "var(--pd-bg-secondary)" }}
											>
												{approval.server.icon || <Server size={14} />}
											</div>
											<span className="text-sm" style={{ color: "var(--pd-text)" }}>
												{approval.server.name}
											</span>
										</div>
										<span
											className="text-xs font-medium px-2 py-1 rounded-full"
											style={{
												background: approval.status === "approved" ? "var(--pd-success-light)" : "var(--pd-danger-light)",
												color: approval.status === "approved" ? "var(--pd-success)" : "var(--pd-danger)",
											}}
										>
											{approval.status === "approved" ? "Approved" : "Denied"}
										</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
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
