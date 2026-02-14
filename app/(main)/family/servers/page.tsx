"use client";

import { useFamilyStore } from "@/store/family.store";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from "@/components/ui/card/card";
import { Button } from "@/components/ui/button/button";
import { Badge } from "@/components/ui/badge/badge";
import { motion } from "motion/react";

export default function FamilyServersPage() {
	const { getSelectedTeenAccount, approveServer, denyServer } =
		useFamilyStore();

	const teenAccount = getSelectedTeenAccount();

	if (!teenAccount) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-white/60">No teen account selected</p>
			</div>
		);
	}

	const { pendingServers } = teenAccount;
	const pending = pendingServers.filter((s) => s.status === "pending");
	const approved = pendingServers.filter((s) => s.status === "approved");
	const denied = pendingServers.filter((s) => s.status === "denied");

	return (
		<div className="h-full overflow-y-auto bg-[oklch(0.12_0.02_250)]">
			<div className="max-w-5xl mx-auto p-6 space-y-6">
				{/* Header */}
				<div>
					<h1 className="text-2xl font-bold text-white">Server Management</h1>
					<p className="text-sm text-white/60 mt-1">
						Review and approve server join requests from{" "}
						{teenAccount.user.displayName}
					</p>
				</div>

				{/* Pending Approvals */}
				<Card tilt={false}>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Pending Approvals</CardTitle>
							{pending.length > 0 && (
								<Badge variant="primary">{pending.length} pending</Badge>
							)}
						</div>
					</CardHeader>
					<CardContent>
						{pending.length > 0 ? (
							<div className="space-y-4">
								{pending.map((approval) => (
									<motion.div
										key={approval.id}
										className="p-4 bg-white/5 border border-white/10 rounded-lg"
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										whileHover={{ scale: 1.01 }}
									>
										<div className="flex items-start justify-between gap-4">
											<div className="flex items-start gap-4 flex-1">
												{/* Server Icon */}
												<div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center text-3xl shrink-0">
													{approval.server.icon || "🏰"}
												</div>

												{/* Server Info */}
												<div className="flex-1">
													<h3 className="text-lg font-bold text-white">
														{approval.server.name}
													</h3>
													{approval.server.description && (
														<p className="text-sm text-white/60 mt-1">
															{approval.server.description}
														</p>
													)}
													<div className="flex items-center gap-3 mt-2">
														<div className="text-xs text-white/50">
															👥 {approval.server.memberCount.toLocaleString()}{" "}
															members
														</div>
														<div className="text-xs text-white/50">
															📅{" "}
															{new Date(approval.requestedAt).toLocaleDateString()}
														</div>
													</div>
												</div>
											</div>

											{/* Actions */}
											<div className="flex gap-2 shrink-0">
												<Button
													variant="primary"
													size="sm"
													onClick={() =>
														approveServer(teenAccount.id, approval.id)
													}
												>
													✓ Approve
												</Button>
												<Button
													variant="danger"
													size="sm"
													onClick={() => denyServer(teenAccount.id, approval.id)}
												>
													✗ Deny
												</Button>
											</div>
										</div>
									</motion.div>
								))}
							</div>
						) : (
							<div className="text-center py-8 text-white/60">
								<div className="text-4xl mb-2">✓</div>
								<p>No pending server approvals</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Approved Servers */}
				{approved.length > 0 && (
					<Card tilt={false}>
						<CardHeader>
							<CardTitle>Approved Servers</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{approved.map((approval) => (
									<div
										key={approval.id}
										className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-2xl">
													{approval.server.icon || "🏰"}
												</div>
												<div>
													<h4 className="font-medium text-white">
														{approval.server.name}
													</h4>
													<p className="text-xs text-white/50">
														Approved on{" "}
														{approval.resolvedAt &&
															new Date(approval.resolvedAt).toLocaleDateString()}
													</p>
												</div>
											</div>
											<Badge variant="primary" className="text-xs">
												Approved
											</Badge>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Denied Servers */}
				{denied.length > 0 && (
					<Card tilt={false}>
						<CardHeader>
							<CardTitle>Denied Servers</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{denied.map((approval) => (
									<div
										key={approval.id}
										className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-2xl">
													{approval.server.icon || "🏰"}
												</div>
												<div>
													<h4 className="font-medium text-white">
														{approval.server.name}
													</h4>
													<p className="text-xs text-white/50">
														Denied on{" "}
														{approval.resolvedAt &&
															new Date(approval.resolvedAt).toLocaleDateString()}
													</p>
												</div>
											</div>
											<Badge variant="danger" className="text-xs">
												Denied
											</Badge>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Info */}
				<div className="text-center text-sm text-white/40 space-y-1">
					<p>🔒 All approval decisions are logged in the transparency log</p>
					<p>Your teen will be notified of your decision</p>
				</div>
			</div>
		</div>
	);
}
