import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import type { Server, Channel, ChannelType } from "@/lib/types/server";
import { generateDefaultRoles } from "@/lib/constants/roles";
import { DEFAULT_SERVER_SETTINGS } from "@/lib/types/server-settings";
import { createClient } from "@/lib/supabase/client";
import { useUIStore } from "@/store/ui.store";

const DEFAULT_THEME_COLOR = "oklch(0.65 0.25 265)";

/**
 * Deterministic theme color from server name.
 * Simple hash -> hue rotation in OKLCH space.
 */
function deriveThemeColor(name: string): string {
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	const hue = Math.abs(hash) % 360;
	return `oklch(0.65 0.2 ${hue})`;
}

interface ServerState {
	// Current selections
	currentServerId: string | null;
	currentChannelId: string | null;

	// Data
	servers: Server[];
	isInitialized: boolean;
	isLoadingServers: boolean;

	// Actions
	init: () => void;
	loadServers: () => Promise<void>;
	setCurrentServer: (serverId: string) => void;
	setCurrentChannel: (channelId: string) => void;
	getCurrentServer: () => Server | undefined;
	getCurrentChannel: () => Channel | undefined;
	getServerChannels: (serverId: string) => Channel[];
	toggleCategory: (serverId: string, categoryId: string) => void;
	markChannelRead: (channelId: string) => void;
}

// Deduplication: track in-flight loadServers request so concurrent callers share one promise
let loadServersPromise: Promise<void> | null = null;

export const useServerStore = create<ServerState>()(
	conditionalDevtools(
		persist(
			(set, get) => ({
				currentServerId: null,
				currentChannelId: null,
				servers: [],
				isInitialized: false,
				isLoadingServers: false,

				init: () => {
					if (get().isInitialized || get().isLoadingServers) return;
					get().loadServers();
				},

				loadServers: async () => {
					// Deduplicate: if already loading, return the existing promise
					if (loadServersPromise) return loadServersPromise;

					const doLoad = async () => {
						set({ isLoadingServers: true });
						try {
							const supabase = createClient();
							const { data: { user }, error: authError } = await supabase.auth.getUser();

							if (authError || !user) {
								set({ servers: [], isInitialized: true, isLoadingServers: false });
								return;
							}

							const { data: memberships, error } = await supabase
								.from("server_members")
								.select(`
									role,
									server:servers(
										id, name, description, icon_url, banner_url,
										owner_id, member_count, is_public, created_at
									)
								`)
								.eq("user_id", user.id);

							if (error) throw error;

							const servers: Server[] = [{
								id: "home",
								name: "Home",
								icon: null,
								ownerId: user.id,
								memberCount: 1,
								isOwner: true,
								categories: [],
								channels: [],
								unreadCount: 0,
								createdAt: new Date(),
								themeColor: DEFAULT_THEME_COLOR,
							}];

							// Collect all server IDs for batch fetching (eliminates N+1 queries)
							const serverIds: string[] = [];
							const serverMap = new Map<string, Record<string, unknown>>();

							for (const membership of memberships || []) {
								const srv = membership.server as unknown as Record<string, unknown>;
								if (!srv || !srv.id) continue;
								const serverId = srv.id as string;
								serverIds.push(serverId);
								serverMap.set(serverId, srv);
							}

							// Batch fetch all categories and channels in parallel (2 queries total, not 2*N)
							let allCategories: Record<string, unknown>[] = [];
							let allChannels: Record<string, unknown>[] = [];

							if (serverIds.length > 0) {
								const [catResult, chResult] = await Promise.all([
									supabase
										.from("channel_categories")
										.select("*")
										.in("server_id", serverIds)
										.order("position", { ascending: true }),
									supabase
										.from("channels")
										.select("*")
										.in("server_id", serverIds)
										.order("position", { ascending: true }),
								]);

								if (catResult.error) {
									console.error("Error loading categories:", catResult.error);
								}
								if (chResult.error) {
									console.error("Error loading channels:", chResult.error);
								}

								allCategories = (catResult.data || []) as Record<string, unknown>[];
								allChannels = (chResult.data || []) as Record<string, unknown>[];
							}

							// Group by server_id for O(1) lookups
							const categoriesByServer = new Map<string, Record<string, unknown>[]>();
							for (const cat of allCategories) {
								const sid = cat.server_id as string;
								if (!categoriesByServer.has(sid)) categoriesByServer.set(sid, []);
								categoriesByServer.get(sid)!.push(cat);
							}

							const channelsByServer = new Map<string, Record<string, unknown>[]>();
							for (const ch of allChannels) {
								const sid = ch.server_id as string;
								if (!channelsByServer.has(sid)) channelsByServer.set(sid, []);
								channelsByServer.get(sid)!.push(ch);
							}

							for (const serverId of serverIds) {
								const srv = serverMap.get(serverId)!;
								const categories = categoriesByServer.get(serverId) || [];
								const channels = channelsByServer.get(serverId) || [];

								servers.push({
									id: serverId,
									name: srv.name as string,
									icon: (srv.icon_url as string) || null,
									ownerId: srv.owner_id as string,
									memberCount: (srv.member_count as number) || 0,
									isOwner: srv.owner_id === user.id,
									themeColor: deriveThemeColor(srv.name as string),
									categories: categories.map(cat => ({
										id: cat.id as string,
										name: cat.name as string,
										serverId: cat.server_id as string,
										position: cat.position as number,
										collapsed: false,
									})),
									channels: channels.map(ch => ({
										id: ch.id as string,
										name: ch.name as string,
										type: ch.type as ChannelType,
										serverId: ch.server_id as string,
										categoryId: ch.category_id as string,
										position: ch.position as number,
										description: ch.description as string,
										unreadCount: 0,
										isNsfw: ch.is_nsfw as boolean,
										topic: ch.topic as string,
										slowMode: ch.slow_mode_seconds as number,
									})),
									unreadCount: 0,
									createdAt: new Date(srv.created_at as string),
									roles: generateDefaultRoles(serverId),
									settings: {
										...DEFAULT_SERVER_SETTINGS,
										icon: (srv.icon_url as string) || null,
										banner: (srv.banner_url as string) || null,
									},
									banner: (srv.banner_url as string) || null,
									description: (srv.description as string) || "",
								});
							}

							const firstServer = servers.find((s) => s.id !== "home");
							const firstChannel = firstServer?.channels[0];

							set({
								servers,
								currentServerId: get().currentServerId || firstServer?.id || null,
								currentChannelId: get().currentChannelId || firstChannel?.id || null,
								isInitialized: true,
								isLoadingServers: false,
							});
						} catch (err) {
							console.error("Error loading servers:", err);
							set({
								servers: [{
									id: "home",
									name: "Home",
									icon: null,
									ownerId: "current-user",
									memberCount: 1,
									isOwner: true,
									categories: [],
									channels: [],
									unreadCount: 0,
									createdAt: new Date(),
								}],
								isInitialized: true,
								isLoadingServers: false,
							});
						} finally {
							loadServersPromise = null;
						}
					};

					loadServersPromise = doLoad();
					return loadServersPromise;
				},

				setCurrentServer: (serverId) => {
					// Skip if already on this server to avoid unnecessary state updates
					if (get().currentServerId === serverId) return;

					// Trigger portal transition (purely visual, non-blocking)
					const currentServer = get().getCurrentServer();
					const targetServer = get().servers.find((s) => s.id === serverId);
					const sourceColor =
						currentServer?.themeColor || DEFAULT_THEME_COLOR;
					const targetColor =
						targetServer?.themeColor ||
						deriveThemeColor(targetServer?.name || "Server");
					useUIStore
						.getState()
						.startPortalTransition(serverId, sourceColor, targetColor);

					set({ currentServerId: serverId });
					const server = get().servers.find((s) => s.id === serverId);
					if (server && server.channels.length > 0) {
						const firstTextChannel = server.channels.find(
							(c) => c.type === "text",
						);
						set({
							currentChannelId:
								firstTextChannel?.id ?? server.channels[0].id,
						});
					}
				},

				setCurrentChannel: (channelId) => {
					// Skip if already on this channel to avoid unnecessary state updates
					if (get().currentChannelId === channelId) return;
					set({ currentChannelId: channelId });
					get().markChannelRead(channelId);
				},

				getCurrentServer: () => {
					const { currentServerId, servers } = get();
					return servers.find((s) => s.id === currentServerId);
				},

				getCurrentChannel: () => {
					const { currentChannelId } = get();
					const server = get().getCurrentServer();
					return server?.channels.find((c) => c.id === currentChannelId);
				},

				getServerChannels: (serverId) => {
					const server = get().servers.find((s) => s.id === serverId);
					return server?.channels || [];
				},

				toggleCategory: (serverId, categoryId) => {
					set((state) => ({
						servers: state.servers.map((server) =>
							server.id === serverId
								? {
										...server,
										categories: server.categories.map((cat) =>
											cat.id === categoryId
												? { ...cat, collapsed: !cat.collapsed }
												: cat
										),
									}
								: server
						),
					}));
				},

				markChannelRead: (channelId) => {
					// Short-circuit: only update if a channel actually has unread messages
					const needsUpdate = get().servers.some(server =>
						server.channels.some(ch => ch.id === channelId && ch.unreadCount > 0)
					);
					if (!needsUpdate) return;

					set((state) => ({
						servers: state.servers.map((server) => {
							// Return same reference for servers that don't contain this channel
							if (!server.channels.some(ch => ch.id === channelId)) return server;

							const updatedChannels = server.channels.map((ch) =>
								ch.id === channelId ? { ...ch, unreadCount: 0 } : ch
							);

							const serverUnreadCount = updatedChannels.reduce(
								(sum, ch) => sum + ch.unreadCount,
								0
							);

							return {
								...server,
								channels: updatedChannels,
								unreadCount: serverUnreadCount,
							};
						}),
					}));
				},
			}),
			{
				name: "bedrock-server",
				partialize: (state) => ({
					currentServerId: state.currentServerId,
					currentChannelId: state.currentChannelId,
				}),
			}
		),
		{ name: "ServerStore" }
	)
);
