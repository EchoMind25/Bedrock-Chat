"use client";

import { useState, useEffect } from "react";
import { Search, Shield, UserPlus, UserMinus, Loader2, Bot, Check, X, ExternalLink, AlertTriangle } from "lucide-react";
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

			{isSuperAdmin && <RoleManagement />}
			{isAdmin && <BotReviewQueue />}
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
		if (!searchQuery.trim()) return;
		setIsSearching(true);
		try {
			// Use the permissions endpoint to check — for now search by username
			// In production, add a dedicated user search endpoint
			setSearchResults([]);
			toast.info("User search requires a dedicated API endpoint (coming soon)");
		} catch {
			toast.error("Search failed");
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
		id: string; name: string; owner_id: string; bot_type: string; description: string | null; created_at: string;
	}>>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Placeholder: would fetch pending bots via admin API
		setIsLoading(false);
		setPendingBots([]);
	}, []);

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
							<div>
								<p className="text-sm font-medium text-white">{bot.name}</p>
								<p className="text-xs text-slate-400">{bot.bot_type} &middot; {new Date(bot.created_at).toLocaleDateString()}</p>
							</div>
							<div className="flex items-center gap-2">
								<Button size="sm" variant="secondary">
									<Check className="w-3 h-3 mr-1" />
									Approve
								</Button>
								<Button size="sm" variant="danger">
									<X className="w-3 h-3 mr-1" />
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
