import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import type { Server, Channel } from "@/lib/types/server";
import { generateInitialServers } from "@/lib/mocks/servers";
import { generateDefaultRoles } from "@/lib/mocks/roles";
import { DEFAULT_SERVER_SETTINGS } from "@/lib/types/server-settings";

interface ServerState {
	// Current selections
	currentServerId: string | null;
	currentChannelId: string | null;

	// Data
	servers: Server[];
	isInitialized: boolean;

	// Actions
	init: () => void;
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
				// Initial state
				currentServerId: null,
				currentChannelId: null,
				servers: [],
				isInitialized: false,

				// Initialize servers
				init: () => {
					if (get().isInitialized) return;

					const servers = generateInitialServers();

					// Add roles and settings to each server (except home)
					const serversWithRoles = servers.map((server) => {
						if (server.id === "home") return server;

						return {
							...server,
							roles: generateDefaultRoles(server.id),
							settings: {
								...DEFAULT_SERVER_SETTINGS,
								icon: server.icon,
								banner: null,
							},
						};
					});

					const firstServer = serversWithRoles.find((s) => s.id !== "home");
					const firstChannel = firstServer?.channels[0];

					set({
						servers: serversWithRoles,
						currentServerId: firstServer?.id ?? null,
						currentChannelId: firstChannel?.id ?? null,
						isInitialized: true,
					});
				},

				// Actions
				setCurrentServer: (serverId) => {
					set({ currentServerId: serverId });
					// Auto-select first text channel when switching servers
					const server = get().servers.find((s) => s.id === serverId);
					if (server && server.channels.length > 0) {
						const firstTextChannel = server.channels.find(
							(c) => c.type === "text"
						);
						set({ currentChannelId: firstTextChannel?.id ?? server.channels[0].id });
					}
				},

				setCurrentChannel: (channelId) => {
					set({ currentChannelId: channelId });
					// Mark channel as read when selected
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
					set((state) => ({
						servers: state.servers.map((server) => {
							const updatedChannels = server.channels.map((ch) =>
								ch.id === channelId ? { ...ch, unreadCount: 0 } : ch
							);

							// Recalculate server unread count
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
					// Don't persist servers - regenerate on each session for fresh data
				}),
			}
		),
		{ name: "ServerStore" }
	)
);
