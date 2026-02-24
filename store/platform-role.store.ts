"use client";

import { create } from "zustand";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import type { PlatformRole, PlatformPermissions, BotApplication } from "@/lib/types/platform-role";
import { DEFAULT_PERMISSIONS } from "@/lib/types/platform-role";
import { toast } from "@/lib/stores/toast-store";

interface PlatformRoleState {
	role: PlatformRole;
	permissions: PlatformPermissions | null;
	isLoaded: boolean;

	botApplications: BotApplication[];
	isLoadingBots: boolean;

	// Selectors
	isDeveloper: () => boolean;
	isStaff: () => boolean;
	isAdmin: () => boolean;
	isSuperAdmin: () => boolean;
	can: (permission: keyof PlatformPermissions) => boolean;

	// Actions
	loadPermissions: () => Promise<void>;
	loadBotApplications: () => Promise<void>;
	createBotApplication: (data: {
		name: string;
		description?: string;
		botType: "custom" | "claude" | "webhook";
		webhookUrl?: string;
		scopes?: string[];
		privacyPolicyUrl?: string;
		dpaAccepted: boolean;
		isTeenSafe?: boolean;
	}) => Promise<BotApplication | null>;
	updateBotApplication: (botId: string, updates: Record<string, unknown>) => Promise<void>;
	deleteBotApplication: (botId: string) => Promise<void>;
	reset: () => void;
}

export const usePlatformRoleStore = create<PlatformRoleState>()(
	conditionalDevtools(
		(set, get) => ({
			role: "user",
			permissions: null,
			isLoaded: false,
			botApplications: [],
			isLoadingBots: false,

			isDeveloper: () => {
				const { role } = get();
				return ["developer", "moderator", "admin", "super_admin"].includes(role);
			},

			isStaff: () => {
				const { role } = get();
				return ["moderator", "admin", "super_admin"].includes(role);
			},

			isAdmin: () => {
				const { role } = get();
				return ["admin", "super_admin"].includes(role);
			},

			isSuperAdmin: () => get().role === "super_admin",

			can: (permission) => {
				const { permissions } = get();
				return permissions?.[permission] ?? false;
			},

			loadPermissions: async () => {
				try {
					const res = await fetch("/api/platform/me/permissions");
					if (!res.ok) return;
					const data = await res.json();
					set({
						role: data.role ?? "user",
						permissions: data.permissions ?? DEFAULT_PERMISSIONS,
						isLoaded: true,
					});
				} catch {
					set({ isLoaded: true });
				}
			},

			loadBotApplications: async () => {
				try {
					set({ isLoadingBots: true });
					const res = await fetch("/api/platform/bots");
					if (!res.ok) {
						set({ isLoadingBots: false });
						return;
					}
					const data = await res.json();
					set({ botApplications: data.bots ?? [], isLoadingBots: false });
				} catch {
					set({ isLoadingBots: false });
				}
			},

			createBotApplication: async (data) => {
				try {
					const res = await fetch("/api/platform/bots", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(data),
					});

					if (!res.ok) {
						const err = await res.json();
						toast.error(err.error ?? "Failed to create bot");
						return null;
					}

					const { bot } = await res.json();
					set((state) => ({
						botApplications: [bot, ...state.botApplications],
					}));
					toast.success("Bot application created");
					return bot;
				} catch {
					toast.error("Failed to create bot");
					return null;
				}
			},

			updateBotApplication: async (botId, updates) => {
				try {
					const res = await fetch(`/api/platform/bots/${botId}`, {
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(updates),
					});

					if (!res.ok) {
						const err = await res.json();
						toast.error(err.error ?? "Failed to update bot");
						return;
					}

					const { bot } = await res.json();
					set((state) => ({
						botApplications: state.botApplications.map((b) =>
							b.id === botId ? bot : b
						),
					}));
					toast.success("Bot updated");
				} catch {
					toast.error("Failed to update bot");
				}
			},

			deleteBotApplication: async (botId) => {
				try {
					const res = await fetch(`/api/platform/bots/${botId}`, {
						method: "DELETE",
					});

					if (!res.ok) {
						const err = await res.json();
						toast.error(err.error ?? "Failed to delete bot");
						return;
					}

					set((state) => ({
						botApplications: state.botApplications.filter((b) => b.id !== botId),
					}));
					toast.success("Bot deleted");
				} catch {
					toast.error("Failed to delete bot");
				}
			},

			reset: () => set({
				role: "user",
				permissions: null,
				isLoaded: false,
				botApplications: [],
				isLoadingBots: false,
			}),
		}),
		{ name: "platform-role" },
	),
);
