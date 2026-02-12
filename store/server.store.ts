import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import type { Server, Channel } from "@/lib/types/server";
import { generateDefaultRoles } from "@/lib/constants/roles";
import { DEFAULT_SERVER_SETTINGS } from "@/lib/types/server-settings";
import { createClient } from "@/lib/supabase/client";

interface ServerState {
	// Current selections
	currentServerId: string | null;
	currentChannelId: string | null;

	// Data
	servers: Server[];
	isInitialized: boolean;

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

export const useServerStore = create<ServerState>()(
	conditionalDevtools(
		persist(
			(set, get) => ({
				currentServerId: null,
				currentChannelId: null,
				servers: [],
				isInitialized: false,

				init: () => {
					if (get().isInitialized) return;
					get().loadServers();
				},

				loadServers: async () => {
					try {
						const supabase = createClient();
						const { data: { user } } = await supabase.auth.getUser();

						if (!user) {
							set({ servers: [], isInitialized: true });
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
						}];

						for (const membership of memberships || []) {
							const srv = membership.server as unknown as Record<string, unknown>;
							if (!srv) continue;

							const serverId = srv.id as string;

							const { data: categories } = await supabase
								.from("channel_categories")
								.select("*")
								.eq("server_id", serverId)
								.order("position", { ascending: true });

							const { data: channels } = await supabase
								.from("channels")
								.select("*")
								.eq("server_id", serverId)
								.order("position", { ascending: true });

							servers.push({
								id: serverId,
								name: srv.name as string,
								icon: (srv.icon_url as string) || null,
								ownerId: srv.owner_id as string,
								memberCount: srv.member_count as number,
								isOwner: srv.owner_id === user.id,
								categories: (categories || []).map(cat => ({
									id: cat.id,
									name: cat.name,
									serverId: cat.server_id,
									position: cat.position,
									collapsed: false,
								})),
								channels: (channels || []).map(ch => ({
									id: ch.id,
									name: ch.name,
									type: ch.type,
									serverId: ch.server_id,
									categoryId: ch.category_id,
									position: ch.position,
									description: ch.description,
									unreadCount: 0,
									isNsfw: ch.is_nsfw,
									topic: ch.topic,
									slowMode: ch.slow_mode_seconds,
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
						});
					}
				},

				setCurrentServer: (serverId) => {
					// Skip if already on this server to avoid unnecessary state updates
					if (get().currentServerId === serverId) return;
					set({ currentServerId: serverId });
					const server = get().servers.find((s) => s.id === serverId);
					if (server && server.channels.length > 0) {
						const firstTextChannel = server.channels.find(
							(c) => c.type === "text"
						);
						set({ currentChannelId: firstTextChannel?.id ?? server.channels[0].id });
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
