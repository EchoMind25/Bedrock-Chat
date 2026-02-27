"use client";

import { useState, useEffect } from "react";
import { Search, Shield, UserPlus, UserMinus, Loader2, Bot, Check, X, ExternalLink, AlertTriangle, Rocket, BarChart2 } from "lucide-react";
import { usePlatformRoleStore } from "@/store/platform-role.store";
import { Badge } from "@/components/ui/badge/badge";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { SettingsSection } from "../settings-section";
import { toast } from "@/lib/stores/toast-store";
import type { PlatformRole, PlatformAuditEntry } from "@/lib/types/platform-role";

const GRANTABLE_ROLES: { value: PlatformRole; label: string; description: string }[] = [
	{ value: "developer", label: "Developer", description: "Bot registration and developer portal access" },
	{ value: "moderator", label: "Moderator", description: "Content moderation and report review" },
	{ value: "admin", label: "Admin", description: "Full platform management (except other admins)" },
];

interface AuditEntryWithProfiles extends PlatformAuditEntry {
	actor?: { username: string; display_name: string };
	target?: { username: string; display_name: string };
}

export function AdminTab() {
	const isSuperAdmin = usePlatformRoleStore((s) => s.isSuperAdmin());
	const isAdmin = usePlatformRoleStore((s) => s.isAdmin());

	return (
		<div className="space-y-8">
			<div className="flex items-center gap-3">
				<h1 className="text-2xl font-bold text-white">Admin Panel</h1>
				<Badge variant="primary">Staff</Badge>
			</div>
			<p className="text-slate-400 text-sm">
				Platform management, role assignment, and audit monitoring.
			</p>

			{isSuperAdmin && <AnalyticsLink />}
			{isSuperAdmin && <RoleManagement />}
			{isAdmin && <BotReviewQueue />}
			{isSuperAdmin && <DeveloperApplicationQueue />}
			{isAdmin && <RecentAuditLog />}
		</div>
	);
}

function RoleManagement() {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<Array<{
		id: string; username: string; display_name: string; platform_role: PlatformRole;
	}> | null>(null);
	const [isSearching, setIsSearching] = useState(false);
	const [isGranting, setIsGranting] = useState<string | null>(null);
	const [selectedRole, setSelectedRole] = useState<PlatformRole>("developer");

	const handleSearch = async () => {
		if (!searchQuery.trim() || searchQuery.trim().length < 2) {
			toast.error("Search Query", "Enter at least 2 characters to search.");
			return;
		}
		setIsSearching(true);
		try {
			const res = await fetch(`/api/platform/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				toast.error("Search Failed", err.error || "Could not search users.");
				setSearchResults([]);
				return;
			}
			const { users } = await res.json();
			setSearchResults(users);
		} catch {
			toast.error("Search Failed", "Could not search users. Check your connection.");
			setSearchResults([]);
		} finally {
			setIsSearching(false);
		}
	};

	const handleGrantRole = async (userId: string) => {
		setIsGranting(userId);
		try {
			const res = await fetch("/api/platform/roles/grant", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ targetUserId: userId, role: selectedRole }),
			});

			if (!res.ok) {
				const err = await res.json();
				toast.error(err.error ?? "Failed to grant role");
				return;
			}

			toast.success(`Role ${selectedRole} granted successfully`);
			// Refresh search results
			if (searchResults) {
				setSearchResults(searchResults.map((u) =>
					u.id === userId ? { ...u, platform_role: selectedRole } : u
				));
			}
		} catch {
			toast.error("Failed to grant role");
		} finally {
			setIsGranting(null);
		}
	};

	const handleRevokeRole = async (userId: string) => {
		setIsGranting(userId);
		try {
			const res = await fetch("/api/platform/roles/revoke", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ targetUserId: userId }),
			});

			if (!res.ok) {
				const err = await res.json();
				toast.error(err.error ?? "Failed to revoke role");
				return;
			}

			toast.success("Role revoked — user reset to standard");
			if (searchResults) {
				setSearchResults(searchResults.map((u) =>
					u.id === userId ? { ...u, platform_role: "user" as PlatformRole } : u
				));
			}
		} catch {
			toast.error("Failed to revoke role");
		} finally {
			setIsGranting(null);
		}
	};

	return (
		<SettingsSection title="Role Management" description="Search for users and manage their platform roles">
			<div className="space-y-4">
				<div className="flex gap-2">
					<div className="flex-1">
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by username..."
							onKeyDown={(e) => e.key === "Enter" && handleSearch()}
						/>
					</div>
					<Button onClick={handleSearch} disabled={isSearching}>
						{isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
					</Button>
				</div>

				{/* Role selector */}
				<div className="flex gap-2">
					{GRANTABLE_ROLES.map((role) => (
						<button
							key={role.value}
							type="button"
							onClick={() => setSelectedRole(role.value)}
							className={`flex-1 p-2 rounded-lg border text-left transition-all ${
								selectedRole === role.value
									? "border-blue-500 bg-blue-500/10"
									: "border-white/10 hover:border-white/20"
							}`}
						>
							<p className="text-xs font-semibold text-white">{role.label}</p>
							<p className="text-[10px] text-slate-400 mt-0.5">{role.description}</p>
						</button>
					))}
				</div>

				{/* Search results */}
				{searchResults !== null && searchResults.length === 0 && (
					<p className="text-sm text-slate-400 text-center py-4">
						No users found. Try a different username.
					</p>
				)}

				{searchResults && searchResults.map((user) => (
					<div key={user.id} className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5">
						<div>
							<p className="text-sm font-medium text-white">{user.display_name}</p>
							<p className="text-xs text-slate-400">@{user.username}</p>
						</div>
						<div className="flex items-center gap-2">
							<Badge variant={user.platform_role === "user" ? "default" : "primary"}>
								{user.platform_role}
							</Badge>
							{user.platform_role === "user" ? (
								<Button
									size="sm"
									variant="secondary"
									onClick={() => handleGrantRole(user.id)}
									disabled={isGranting === user.id}
								>
									{isGranting === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
								</Button>
							) : (
								<Button
									size="sm"
									variant="danger"
									onClick={() => handleRevokeRole(user.id)}
									disabled={isGranting === user.id}
								>
									{isGranting === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserMinus className="w-3 h-3" />}
								</Button>
							)}
						</div>
					</div>
				))}
			</div>
		</SettingsSection>
	);
}

function BotReviewQueue() {
	const [pendingBots, setPendingBots] = useState<Array<{
		id: string; name: string; description: string | null; bot_type: string;
		webhook_url: string | null; is_teen_safe: boolean; scopes: string[];
		created_at: string;
		owner: { id: string; username: string; display_name: string; account_type: string } | null;
	}>>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [reviewingId, setReviewingId] = useState<string | null>(null);

	const fetchPending = async () => {
		try {
			const res = await fetch("/api/platform/bots/pending");
			if (!res.ok) return;
			const data = await res.json();
			setPendingBots(data.bots ?? []);
		} catch {
			// Silently fail
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchPending();
	}, []);

	const handleReview = async (botId: string, action: "approve" | "reject") => {
		setReviewingId(botId);
		try {
			const res = await fetch(`/api/platform/bots/${botId}/review`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action }),
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				toast.error(err.error || `Failed to ${action} bot`);
				return;
			}
			toast.success(`Bot ${action === "approve" ? "approved" : "rejected"} successfully`);
			setPendingBots((prev) => prev.filter((b) => b.id !== botId));
		} catch {
			toast.error(`Failed to ${action} bot`);
		} finally {
			setReviewingId(null);
		}
	};

	return (
		<SettingsSection title="Bot Review Queue" description="Pending bot applications awaiting approval">
			{isLoading ? (
				<div className="flex justify-center py-4">
					<Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
				</div>
			) : pendingBots.length === 0 ? (
				<div className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-white/5">
					<Bot className="w-5 h-5 text-slate-500" />
					<p className="text-sm text-slate-400">No pending bot applications</p>
				</div>
			) : (
				<div className="space-y-2">
					{pendingBots.map((bot) => (
						<div key={bot.id} className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5">
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<p className="text-sm font-medium text-white">{bot.name}</p>
									<Badge variant="default">{bot.bot_type}</Badge>
									{bot.owner?.account_type === "teen" && (
										<span title="Teen-owned bot"><AlertTriangle className="w-3.5 h-3.5 text-yellow-400" /></span>
									)}
								</div>
								<p className="text-xs text-slate-400 truncate">
									by @{bot.owner?.username ?? "unknown"} &middot; {new Date(bot.created_at).toLocaleDateString()}
								</p>
								{bot.description && (
									<p className="text-xs text-slate-500 mt-1 truncate">{bot.description}</p>
								)}
							</div>
							<div className="flex items-center gap-2 ml-3 shrink-0">
								<Button
									size="sm"
									variant="secondary"
									onClick={() => handleReview(bot.id, "approve")}
									disabled={reviewingId === bot.id}
								>
									{reviewingId === bot.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
									Approve
								</Button>
								<Button
									size="sm"
									variant="danger"
									onClick={() => handleReview(bot.id, "reject")}
									disabled={reviewingId === bot.id}
								>
									{reviewingId === bot.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3 mr-1" />}
									Reject
								</Button>
							</div>
						</div>
					))}
				</div>
			)}
		</SettingsSection>
	);
}

function DeveloperApplicationQueue() {
	const [applications, setApplications] = useState<Array<{
		id: string; actor_id: string; metadata: { email?: string; intended_use?: string }; created_at: string;
		actor: { id: string; username: string; display_name: string; avatar_url: string | null } | null;
	}>>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [reviewingId, setReviewingId] = useState<string | null>(null);

	const fetchApplications = async () => {
		try {
			const res = await fetch("/api/platform/developer-application");
			if (!res.ok) return;
			const data = await res.json();
			setApplications(data.applications ?? []);
		} catch {
			// Silently fail
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchApplications();
	}, []);

	const handleReview = async (userId: string, action: "approve" | "reject") => {
		setReviewingId(userId);
		try {
			const res = await fetch(`/api/platform/developer-application/${userId}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action }),
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				toast.error(err.error || `Failed to ${action} application`);
				return;
			}
			toast.success(`Developer application ${action === "approve" ? "approved" : "rejected"}`);
			setApplications((prev) => prev.filter((a) => a.actor_id !== userId));
		} catch {
			toast.error(`Failed to ${action} application`);
		} finally {
			setReviewingId(null);
		}
	};

	return (
		<SettingsSection title="Developer Applications" description="Users requesting developer access">
			{isLoading ? (
				<div className="flex justify-center py-4">
					<Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
				</div>
			) : applications.length === 0 ? (
				<div className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-white/5">
					<Rocket className="w-5 h-5 text-slate-500" />
					<p className="text-sm text-slate-400">No pending developer applications</p>
				</div>
			) : (
				<div className="space-y-2">
					{applications.map((app) => (
						<div key={app.id} className="p-3 rounded-lg border border-white/10 bg-white/5">
							<div className="flex items-center justify-between">
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium text-white">
										{app.actor?.display_name ?? "Unknown"}
										<span className="text-slate-400 font-normal ml-1.5">@{app.actor?.username ?? "unknown"}</span>
									</p>
									<p className="text-xs text-slate-500 mt-0.5">
										{app.metadata?.email} &middot; {new Date(app.created_at).toLocaleDateString()}
									</p>
								</div>
								<div className="flex items-center gap-2 ml-3 shrink-0">
									<Button
										size="sm"
										variant="secondary"
										onClick={() => handleReview(app.actor_id, "approve")}
										disabled={reviewingId === app.actor_id}
									>
										{reviewingId === app.actor_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
										Approve
									</Button>
									<Button
										size="sm"
										variant="danger"
										onClick={() => handleReview(app.actor_id, "reject")}
										disabled={reviewingId === app.actor_id}
									>
										{reviewingId === app.actor_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3 mr-1" />}
										Reject
									</Button>
								</div>
							</div>
							{app.metadata?.intended_use && (
								<p className="text-xs text-slate-400 mt-2 bg-white/5 p-2 rounded">
									{app.metadata.intended_use}
								</p>
							)}
						</div>
					))}
				</div>
			)}
		</SettingsSection>
	);
}

function RecentAuditLog() {
	const [entries, setEntries] = useState<AuditEntryWithProfiles[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		async function fetchRecentEntries() {
			try {
				const res = await fetch("/api/platform/audit-log?limit=10");
				if (!res.ok) {
					setIsLoading(false);
					return;
				}
				const data = await res.json();
				setEntries(data.entries ?? []);
			} catch {
				// Silently fail
			} finally {
				setIsLoading(false);
			}
		}
		fetchRecentEntries();
	}, []);

	return (
		<SettingsSection title="Recent Audit Log" description="Latest platform actions">
			{isLoading ? (
				<div className="flex justify-center py-4">
					<Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
				</div>
			) : entries.length === 0 ? (
				<div className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-white/5">
					<Shield className="w-5 h-5 text-slate-500" />
					<p className="text-sm text-slate-400">No audit log entries yet</p>
				</div>
			) : (
				<div className="space-y-1.5">
					{entries.map((entry) => (
						<div
							key={entry.id}
							className={`flex items-center justify-between p-2.5 rounded-lg text-sm ${
								entry.target_is_minor ? "bg-yellow-500/5 border border-yellow-500/20" : "bg-white/5"
							}`}
						>
							<div className="flex items-center gap-2 min-w-0">
								{entry.target_is_minor && (
									<AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
								)}
								<span className="text-white truncate">
									{entry.actor?.username ?? "Unknown"}
								</span>
								<Badge variant="default">{entry.action.replace(/_/g, " ")}</Badge>
								{entry.target?.username && (
									<span className="text-slate-400 truncate">{entry.target.username}</span>
								)}
							</div>
							<span className="text-xs text-slate-500 shrink-0 ml-2">
								{new Date(entry.created_at).toLocaleString()}
							</span>
						</div>
					))}

					<button
						type="button"
						onClick={() => {
							// Navigate to full audit log in developer portal
							window.location.href = "/developers";
						}}
						className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors mt-2"
					>
						View full audit log
						<ExternalLink className="w-3 h-3" />
					</button>
				</div>
			)}
		</SettingsSection>
	);
}

function AnalyticsLink() {
	return (
		<SettingsSection title="Platform Analytics" description="View traffic, feature usage, performance, and bug reports.">
			<div className="flex items-center gap-3 p-4 bg-slate-900/50 border border-slate-800/50 rounded-xl">
				<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
					<BarChart2 className="w-5 h-5 text-primary" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-sm font-medium text-white">Analytics Dashboard</p>
					<p className="text-xs text-slate-400 mt-0.5">Sessions, navigation funnels, Web Vitals, and bug reports</p>
				</div>
				<button
					type="button"
					onClick={() => { window.location.href = "/admin/analytics"; }}
					className="shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-lg transition-colors"
				>
					Open
					<ExternalLink className="w-3.5 h-3.5" />
				</button>
			</div>
		</SettingsSection>
	);
}
