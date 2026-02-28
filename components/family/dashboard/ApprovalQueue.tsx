"use client";

import { useEffect, useMemo, useState } from "react";
import { Server, Users, Check, X, Calendar, UserCheck } from "lucide-react";
import { useFamilyStore } from "@/store/family.store";
import { createClient } from "@/lib/supabase/client";

function ServerIcon({ icon, size = 24 }: { icon: string | null; size?: number }) {
	if (icon?.startsWith("http")) {
		return <img src={icon} alt="" className="w-full h-full rounded-xl object-cover" />;
	}
	if (icon) {
		return <span className="text-2xl leading-none">{icon}</span>;
	}
	return <Server size={size} style={{ color: "var(--pd-text-muted)" }} />;
}

interface ApprovalQueueProps {
	onCountChange?: (count: number) => void;
}

export function ApprovalQueue({ onCountChange }: ApprovalQueueProps) {
	const familyId = useFamilyStore((s) => s._familyId);
	const loadApprovals = useFamilyStore((s) => s.loadApprovals);
	const getSelectedTeenAccount = useFamilyStore((s) => s.getSelectedTeenAccount);
	const teenAccount = getSelectedTeenAccount();

	const [actingOn, setActingOn] = useState<string | null>(null);

	const pendingServers = useMemo(
		() => teenAccount?.pendingServers.filter((s) => s.status === "pending") ?? [],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[teenAccount?.pendingServers],
	);
	const pendingFriends = useMemo(
		() => teenAccount?.pendingFriends.filter((f) => f.status === "pending") ?? [],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[teenAccount?.pendingFriends],
	);
	const resolvedServers = useMemo(
		() => teenAccount?.pendingServers.filter((s) => s.status !== "pending") ?? [],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[teenAccount?.pendingServers],
	);

	// Report total pending count to parent
	useEffect(() => {
		onCountChange?.(pendingServers.length + pendingFriends.length);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pendingServers.length, pendingFriends.length]);

	// Realtime: refresh on new approval rows for this family
	useEffect(() => {
		if (!familyId) return;
		const supabase = createClient();
		const channel = supabase
			.channel(`approvals-queue-${familyId}`)
			.on(
				"postgres_changes",
				{ event: "INSERT", schema: "public", table: "family_server_approvals", filter: `family_id=eq.${familyId}` },
				() => { loadApprovals(); },
			)
			.on(
				"postgres_changes",
				{ event: "INSERT", schema: "public", table: "family_friend_approvals", filter: `family_id=eq.${familyId}` },
				() => { loadApprovals(); },
			)
			.subscribe();
		return () => { supabase.removeChannel(channel); };
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // familyId and loadApprovals captured in closure, effect only runs on mount

	const handleAction = async (
		approvalId: string,
		approvalType: "server" | "friend",
		action: "approve" | "deny",
	) => {
		setActingOn(approvalId);
		try {
			const res = await fetch("/api/family/approve", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ approval_id: approvalId, approval_type: approvalType, action }),
			});
			if (res.ok) {
				await loadApprovals();
			}
		} finally {
			setActingOn(null);
		}
	};

	const totalPending = pendingServers.length + pendingFriends.length;

	if (totalPending === 0 && resolvedServers.length === 0) {
		return (
			<div className="pd-card p-8 text-center">
				<Check size={32} className="mx-auto mb-3" style={{ color: "var(--pd-success)" }} />
				<p className="font-medium" style={{ color: "var(--pd-text)" }}>No pending approvals</p>
				<p className="text-sm mt-1" style={{ color: "var(--pd-text-muted)" }}>
					All server and friend requests are up to date
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Pending server approvals */}
			{pendingServers.map((approval) => (
				<div key={approval.id} className="pd-card p-5">
					<div className="flex flex-col sm:flex-row sm:items-center gap-4">
						<div className="flex items-start gap-3 flex-1">
							<div
								className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
								style={{ background: "var(--pd-bg-secondary)" }}
							>
								<ServerIcon icon={approval.server.icon} size={24} />
							</div>
							<div>
								<h3 className="font-semibold" style={{ color: "var(--pd-text)" }}>
									{approval.server.name}
								</h3>
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
								disabled={actingOn === approval.id}
								onClick={() => handleAction(approval.id, "server", "approve")}
								className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 text-white disabled:opacity-60 transition-opacity"
								style={{ background: "var(--pd-success)" }}
							>
								<Check size={16} />
								{actingOn === approval.id ? "Saving…" : "Approve"}
							</button>
							<button
								type="button"
								disabled={actingOn === approval.id}
								onClick={() => handleAction(approval.id, "server", "deny")}
								className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 disabled:opacity-60 transition-opacity"
								style={{ background: "var(--pd-danger-light)", color: "var(--pd-danger)" }}
							>
								<X size={16} />
								Deny
							</button>
						</div>
					</div>
				</div>
			))}

			{/* Pending friend approvals */}
			{pendingFriends.map((approval) => (
				<div key={approval.id} className="pd-card p-5">
					<div className="flex flex-col sm:flex-row sm:items-center gap-4">
						<div className="flex items-start gap-3 flex-1">
							<div
								className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
								style={{ background: "var(--pd-bg-secondary)" }}
							>
								{approval.friend.avatar ? (
									<img src={approval.friend.avatar} alt={approval.friend.displayName} className="w-full h-full rounded-xl object-cover" />
								) : (
									<UserCheck size={24} style={{ color: "var(--pd-text-muted)" }} />
								)}
							</div>
							<div>
								<h3 className="font-semibold" style={{ color: "var(--pd-text)" }}>
									{approval.friend.displayName}
								</h3>
								<p className="text-sm" style={{ color: "var(--pd-text-muted)" }}>
									@{approval.friend.username}
								</p>
								<span className="text-xs flex items-center gap-1 mt-1.5" style={{ color: "var(--pd-text-muted)" }}>
									<Calendar size={12} /> {new Date(approval.requestedAt).toLocaleDateString()}
								</span>
							</div>
						</div>
						<div className="flex gap-2 shrink-0">
							<button
								type="button"
								disabled={actingOn === approval.id}
								onClick={() => handleAction(approval.id, "friend", "approve")}
								className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 text-white disabled:opacity-60 transition-opacity"
								style={{ background: "var(--pd-success)" }}
							>
								<Check size={16} />
								{actingOn === approval.id ? "Saving…" : "Approve"}
							</button>
							<button
								type="button"
								disabled={actingOn === approval.id}
								onClick={() => handleAction(approval.id, "friend", "deny")}
								className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 disabled:opacity-60 transition-opacity"
								style={{ background: "var(--pd-danger-light)", color: "var(--pd-danger)" }}
							>
								<X size={16} />
								Deny
							</button>
						</div>
					</div>
				</div>
			))}

			{/* Resolved server approvals */}
			{resolvedServers.length > 0 && (
				<div>
					<h3 className="text-sm font-semibold mb-3" style={{ color: "var(--pd-text-secondary)" }}>
						Resolved
					</h3>
					<div className="space-y-2">
						{resolvedServers.map((approval) => (
							<div key={approval.id} className="pd-card p-3 flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div
										className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
										style={{ background: "var(--pd-bg-secondary)" }}
									>
										<ServerIcon icon={approval.server.icon} size={14} />
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
	);
}
