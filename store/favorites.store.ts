import { create } from "zustand";
import { persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "@/lib/stores/toast-store";
import { isAbortError } from "@/lib/utils/is-abort-error";

interface FavoritesState {
	favoriteChannelIds: Set<string>;
	isLoading: boolean;

	// Load user's favorites from database
	loadFavorites: () => Promise<void>;

	// Toggle favorite status for a channel
	toggleFavorite: (channelId: string, serverId: string) => Promise<void>;

	// Check if channel is favorited
	isFavorite: (channelId: string) => boolean;

	// Clear all favorites (for logout)
	clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
	conditionalDevtools(
		persist(
			(set, get) => ({
				favoriteChannelIds: new Set<string>(),
				isLoading: false,

				loadFavorites: async () => {
					set({ isLoading: true });
					try {
						// Use cached auth state instead of making a network round-trip
						const userId = useAuthStore.getState().user?.id;

						if (!userId) {
							set({ favoriteChannelIds: new Set(), isLoading: false });
							return;
						}

						const supabase = createClient();
						const { data, error } = await supabase
							.from("channel_favorites")
							.select("channel_id")
							.eq("user_id", userId);

						if (error) throw error;

						const favoriteIds = new Set(data.map((f) => f.channel_id));
						set({ favoriteChannelIds: favoriteIds, isLoading: false });
					} catch (err) {
						if (!isAbortError(err)) {
							console.error("Error loading favorites:", err);
						}
						set({ isLoading: false });
					}
				},

				toggleFavorite: async (channelId, serverId) => {
					const { favoriteChannelIds } = get();
					const isFavorited = favoriteChannelIds.has(channelId);

					// Optimistic update
					const newFavorites = new Set(favoriteChannelIds);
					if (isFavorited) {
						newFavorites.delete(channelId);
					} else {
						newFavorites.add(channelId);
					}
					set({ favoriteChannelIds: newFavorites });

					try {
						const supabase = createClient();
						const {
							data: { user },
						} = await supabase.auth.getUser();
						if (!user) throw new Error("Not authenticated");

						if (isFavorited) {
							// Remove favorite
							const { error } = await supabase
								.from("channel_favorites")
								.delete()
								.eq("user_id", user.id)
								.eq("channel_id", channelId);

							if (error) throw error;
							toast.success("Removed from favorites");
						} else {
							// Add favorite
							const { error } = await supabase.from("channel_favorites").insert({
								user_id: user.id,
								channel_id: channelId,
								server_id: serverId,
							});

							if (error) throw error;
							toast.success("Added to favorites");
						}
					} catch (err) {
						console.error("Error toggling favorite:", err);
						// Rollback optimistic update
						set({ favoriteChannelIds });
						toast.error("Failed to update favorite", "Please try again");
					}
				},

				isFavorite: (channelId) => {
					return get().favoriteChannelIds.has(channelId);
				},

				clearFavorites: () => {
					set({ favoriteChannelIds: new Set(), isLoading: false });
				},
			}),
			{
				name: "bedrock-favorites",
				partialize: (state) => ({
					// Store as array for JSON serialization
					favoriteChannelIds: Array.from(state.favoriteChannelIds),
				}),
				// Custom merge function to convert array back to Set
				merge: (persistedState, currentState) => {
					const persisted = persistedState as { favoriteChannelIds?: string[] };
					return {
						...currentState,
						favoriteChannelIds: new Set(persisted.favoriteChannelIds || []),
					};
				},
			}
		),
		{ name: "FavoritesStore" }
	)
);
