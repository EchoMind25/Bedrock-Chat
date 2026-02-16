import { create } from "zustand";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "./auth.store";

// ── Types ──────────────────────────────────────────────────

export interface MemberWithProfile {
	id: string;
	userId: string;
	serverId: string;
	role: "owner" | "admin" | "moderator" | "member";
	nickname: string | null;
	joinedAt: Date;
	username: string;
	displayName: string;
	avatar: string;
	status: string;
}

const ROLE_ORDER: Record<string, number> = {
	owner: 0,
	admin: 1,
	moderator: 2,
	member: 3,
};

interface MemberState {
	membersByServer: Record<string, MemberWithProfile[]>;
	loadingServers: Record<string, boolean>;

	loadMembers: (serverId: string) => Promise<void>;
	getMemberCount: (serverId: string) => number;
	clearServerMembers: (serverId: string) => void;
	updateMemberRole: (serverId: string, memberId: string, newRole: MemberWithProfile["role"]) => Promise<void>;
	updateMemberRoleIds: (serverId: string, memberUserId: string, roleIds: string[]) => Promise<void>;
	kickMember: (serverId: string, memberId: string) => Promise<void>;
	banMember: (serverId: string, memberId: string) => Promise<void>;
}

// Track in-flight requests per server to deduplicate
const loadingPromises = new Map<string, Promise<void>>();

// ── Store ──────────────────────────────────────────────────

export const useMemberStore = create<MemberState>()(
	conditionalDevtools(
		(set, get) => ({
			membersByServer: {},
			loadingServers: {},

			loadMembers: async (serverId: string) => {
				if (get().loadingServers[serverId]) {
					const existing = loadingPromises.get(serverId);
					if (existing) return existing;
					return;
				}

				const doLoad = async () => {
					set((s) => ({
						loadingServers: { ...s.loadingServers, [serverId]: true },
					}));

					try {
						const supabase = createClient();
						const { data, error } = await supabase
							.from("server_members")
							.select(`
								id,
								server_id,
								user_id,
								role,
								nickname,
								joined_at,
								profile:profiles(
									id,
									username,
									display_name,
									avatar_url,
									status
								)
							`)
							.eq("server_id", serverId);

						if (error) throw error;

						const members: MemberWithProfile[] = (data || [])
							.map((row) => {
								const p = row.profile as unknown as Record<string, unknown>;
								if (!p) return null;
								return {
									id: row.id,
									userId: row.user_id,
									serverId: row.server_id,
									role: row.role as MemberWithProfile["role"],
									nickname: row.nickname || null,
									joinedAt: new Date(row.joined_at),
									username: (p.username as string) || "unknown",
									displayName: (p.display_name as string) || (p.username as string) || "Unknown",
									avatar: (p.avatar_url as string) || "",
									status: (p.status as string) || "offline",
								};
							})
							.filter((m): m is MemberWithProfile => m !== null)
							.sort((a, b) => (ROLE_ORDER[a.role] ?? 3) - (ROLE_ORDER[b.role] ?? 3));

						set((s) => ({
							membersByServer: { ...s.membersByServer, [serverId]: members },
							loadingServers: { ...s.loadingServers, [serverId]: false },
						}));
					} catch (err) {
						console.error("Error loading members:", err);
						set((s) => ({
							loadingServers: { ...s.loadingServers, [serverId]: false },
						}));
					} finally {
						loadingPromises.delete(serverId);
					}
				};

				const promise = doLoad();
				loadingPromises.set(serverId, promise);
				return promise;
			},

			getMemberCount: (serverId: string) => {
				return get().membersByServer[serverId]?.length ?? 0;
			},

			clearServerMembers: (serverId: string) => {
				set((s) => {
					const { [serverId]: _, ...rest } = s.membersByServer;
					return { membersByServer: rest };
				});
			},

			updateMemberRole: async (serverId: string, memberId: string, newRole: MemberWithProfile["role"]) => {
				const supabase = createClient();
				const { error } = await supabase
					.from("server_members")
					.update({ role: newRole })
					.eq("id", memberId);

				if (error) throw error;

				set((s) => ({
					membersByServer: {
						...s.membersByServer,
						[serverId]: (s.membersByServer[serverId] || []).map((m) =>
							m.id === memberId ? { ...m, role: newRole } : m,
						),
					},
				}));
			},

			updateMemberRoleIds: async (serverId: string, memberUserId: string, roleIds: string[]) => {
				const supabase = createClient();
				const { error } = await supabase
					.from("server_members")
					.update({ role_ids: roleIds })
					.eq("server_id", serverId)
					.eq("user_id", memberUserId);

				if (error) throw error;
			},

			kickMember: async (serverId: string, memberId: string) => {
				const supabase = createClient();
				const { error } = await supabase
					.from("server_members")
					.delete()
					.eq("id", memberId);

				if (error) throw error;

				set((s) => ({
					membersByServer: {
						...s.membersByServer,
						[serverId]: (s.membersByServer[serverId] || []).filter((m) => m.id !== memberId),
					},
				}));
			},

			banMember: async (serverId: string, memberId: string) => {
				await get().kickMember(serverId, memberId);
			},
		}),
		{ name: "MemberStore" },
	),
);
