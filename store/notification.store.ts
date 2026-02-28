import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

export interface AppNotification {
	id: string;
	type:
		| "server_approval_request"
		| "server_approval_resolved"
		| "friend_approval_request"
		| "friend_approval_resolved"
		| "monitoring_level_changed"
		| "family_alert"
		| "friend_request"
		| "server_invite"
		| "mention"
		| "system";
	title: string;
	body: string;
	data: Record<string, unknown>;
	readAt: string | null;
	createdAt: string;
}

interface NotificationState {
	notifications: AppNotification[];
	unreadCount: number;
	isLoading: boolean;
	isInitialized: boolean;
	_cleanup: (() => void) | null;

	init: (userId: string) => Promise<void>;
	markRead: (id: string) => Promise<void>;
	markAllRead: () => Promise<void>;
	addNotification: (n: AppNotification) => void;
	reset: () => void;
}

const initialState = {
	notifications: [] as AppNotification[],
	unreadCount: 0,
	isLoading: false,
	isInitialized: false,
	_cleanup: null as (() => void) | null,
};

export const useNotificationStore = create<NotificationState>()((set, get) => ({
	...initialState,

	init: async (userId) => {
		if (get().isInitialized) return;
		set({ isLoading: true });
		try {
			const supabase = createClient();

			// Fetch 50 most recent notifications
			const { data } = await supabase
				.from("notifications")
				.select("*")
				.eq("user_id", userId)
				.order("created_at", { ascending: false })
				.limit(50);

			const notifications: AppNotification[] = (data || []).map((row) => ({
				id: row.id as string,
				type: row.type as AppNotification["type"],
				title: row.title as string,
				body: row.body as string,
				data: (row.data as Record<string, unknown>) ?? {},
				readAt: (row.read_at as string | null) ?? null,
				createdAt: row.created_at as string,
			}));

			const unreadCount = notifications.filter((n) => !n.readAt).length;

			// Subscribe to new notifications for this user
			const channel = supabase
				.channel(`notifications-${userId}`)
				.on(
					"postgres_changes",
					{ event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
					(payload) => {
						const row = payload.new as Record<string, unknown>;
						const notification: AppNotification = {
							id: row.id as string,
							type: row.type as AppNotification["type"],
							title: row.title as string,
							body: row.body as string,
							data: (row.data as Record<string, unknown>) ?? {},
							readAt: null,
							createdAt: row.created_at as string,
						};
						get().addNotification(notification);
					},
				)
				.subscribe();

			const cleanup = () => { supabase.removeChannel(channel); };

			set({ notifications, unreadCount, isLoading: false, isInitialized: true, _cleanup: cleanup });
		} catch {
			set({ isLoading: false, isInitialized: true });
		}
	},

	markRead: async (id) => {
		// Optimistic update
		set((state) => {
			const notifications = state.notifications.map((n) =>
				n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
			);
			return { notifications, unreadCount: notifications.filter((n) => !n.readAt).length };
		});

		// Persist to DB (RLS allows user to update own notifications)
		const supabase = createClient();
		await supabase
			.from("notifications")
			.update({ read_at: new Date().toISOString() })
			.eq("id", id);
	},

	markAllRead: async () => {
		const now = new Date().toISOString();
		// Collect unread IDs before optimistic update
		const unreadIds = get().notifications.filter((n) => !n.readAt).map((n) => n.id);
		// Optimistic update
		set((state) => ({
			notifications: state.notifications.map((n) => ({ ...n, readAt: n.readAt ?? now })),
			unreadCount: 0,
		}));

		if (unreadIds.length === 0) return;
		const supabase = createClient();
		await supabase
			.from("notifications")
			.update({ read_at: now })
			.in("id", unreadIds);
	},

	addNotification: (n) => {
		set((state) => ({
			notifications: [n, ...state.notifications].slice(0, 50),
			unreadCount: state.unreadCount + 1,
		}));
	},

	reset: () => {
		const cleanup = get()._cleanup;
		if (cleanup) cleanup();
		set(initialState);
	},
}));
