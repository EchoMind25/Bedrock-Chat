import { create } from "zustand";
import { persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import type { Friend, FriendRequest } from "@/lib/types/friend";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth.store";
import { isAbortError } from "@/lib/utils/is-abort-error";
import { toast } from "@/lib/stores/toast-store";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type FriendTab = "all" | "online" | "pending" | "blocked";

interface FriendsState {
  friends: Friend[];
  friendRequests: {
    incoming: FriendRequest[];
    outgoing: FriendRequest[];
  };
  blockedUsers: Friend[];
  currentTab: FriendTab;
  searchQuery: string;
  isAddFriendModalOpen: boolean;
  isInitialized: boolean;

  // Actions
  init: () => void;
  setCurrentTab: (tab: FriendTab) => void;
  setSearchQuery: (query: string) => void;
  sendFriendRequest: (username: string, message?: string) => Promise<boolean>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  cancelFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  openAddFriendModal: () => void;
  closeAddFriendModal: () => void;
  getOnlineFriends: () => Friend[];
  getPendingCount: () => number;
  subscribeToFriendRequests: () => void;
  unsubscribeFromFriendRequests: () => void;
}

let realtimeChannel: RealtimeChannel | null = null;

export const useFriendsStore = create<FriendsState>()(
  conditionalDevtools(
    persist(
      (set, get) => ({
        friends: [],
        friendRequests: { incoming: [], outgoing: [] },
        blockedUsers: [],
        currentTab: "all",
        searchQuery: "",
        isAddFriendModalOpen: false,
        isInitialized: false,

        init: () => {
          if (get().isInitialized) return;

          const loadFriends = async () => {
            try {
              // Use cached auth state instead of making a network round-trip
              const userId = useAuthStore.getState().user?.id;
              if (!userId) {
                set({ isInitialized: true });
                return;
              }

              const supabase = createClient();

              const { data: f1 } = await supabase
                .from("friendships")
                .select(`id, created_at, friend:profiles!friendships_user2_id_fkey(id, username, display_name, avatar_url, status)`)
                .eq("user1_id", userId);

              const { data: f2 } = await supabase
                .from("friendships")
                .select(`id, created_at, friend:profiles!friendships_user1_id_fkey(id, username, display_name, avatar_url, status)`)
                .eq("user2_id", userId);

              const friends: Friend[] = [...(f1 || []), ...(f2 || [])].map((row) => {
                const f = row.friend as unknown as Record<string, unknown>;
                return {
                  id: row.id,
                  userId: f.id as string,
                  username: f.username as string,
                  displayName: (f.display_name as string) || (f.username as string),
                  avatar: (f.avatar_url as string) || "",
                  status: (f.status as Friend["status"]) || "offline",
                  friendshipStatus: "accepted" as const,
                  createdAt: new Date(row.created_at),
                };
              });

              const { data: incoming } = await supabase
                .from("friend_requests")
                .select(`id, message, created_at, sender:profiles!friend_requests_sender_id_fkey(id, username, display_name, avatar_url)`)
                .eq("receiver_id", userId)
                .eq("status", "pending");

              const { data: outgoing } = await supabase
                .from("friend_requests")
                .select(`id, message, created_at, receiver:profiles!friend_requests_receiver_id_fkey(id, username, display_name, avatar_url)`)
                .eq("sender_id", userId)
                .eq("status", "pending");

              const { data: blocked } = await supabase
                .from("blocked_users")
                .select(`id, blocked_at, blocked:profiles!blocked_users_blocked_id_fkey(id, username, display_name, avatar_url)`)
                .eq("blocker_id", userId);

              set({
                friends,
                friendRequests: {
                  incoming: (incoming || []).map((r) => {
                    const s = r.sender as unknown as Record<string, unknown>;
                    return {
                      id: r.id, fromUserId: s.id as string, fromUsername: s.username as string,
                      fromDisplayName: (s.display_name as string) || (s.username as string),
                      fromAvatar: (s.avatar_url as string) || "", toUserId: userId,
                      message: r.message || undefined, createdAt: new Date(r.created_at), direction: "incoming" as const,
                    };
                  }),
                  outgoing: (outgoing || []).map((r) => {
                    const recv = r.receiver as unknown as Record<string, unknown>;
                    return {
                      id: r.id, fromUserId: userId, fromUsername: "You",
                      fromDisplayName: "You", fromAvatar: "", toUserId: recv.id as string,
                      message: r.message || undefined, createdAt: new Date(r.created_at), direction: "outgoing" as const,
                    };
                  }),
                },
                blockedUsers: (blocked || []).map((b) => {
                  const bl = b.blocked as unknown as Record<string, unknown>;
                  return {
                    id: b.id, userId: bl.id as string, username: bl.username as string,
                    displayName: (bl.display_name as string) || (bl.username as string),
                    avatar: (bl.avatar_url as string) || "", status: "offline" as const,
                    friendshipStatus: "blocked" as const, createdAt: new Date(b.blocked_at),
                  };
                }),
                isInitialized: true,
              });
            } catch (err) {
              if (!isAbortError(err)) {
                console.error("Error loading friends:", err);
              }
              set({ isInitialized: true });
            }
          };

          loadFriends();
        },

        setCurrentTab: (tab) => set({ currentTab: tab }),
        setSearchQuery: (query) => set({ searchQuery: query }),

        sendFriendRequest: async (username, message) => {
          const makeTimeout = () => new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), 10000)
          );

          try {
            const supabase = createClient();
            const { data: { user } } = await Promise.race([supabase.auth.getUser(), makeTimeout()]);
            if (!user) return false;

            // Look up target user by username (case-insensitive)
            const { data: targetUser } = await Promise.race([
              supabase.from("profiles").select("id, username, display_name, avatar_url").ilike("username", username).single(),
              makeTimeout(),
            ]);

            if (!targetUser) return false;

            // Prevent self-request
            if (targetUser.id === user.id) return false;

            // Check if blocked
            const blockedUserIds = get().blockedUsers.map((b) => b.userId);
            if (blockedUserIds.includes(targetUser.id)) return false;

            // Check if already friends
            if (get().friends.some((f) => f.userId === targetUser.id)) return false;

            // Check if request already pending (either direction)
            const { outgoing, incoming } = get().friendRequests;
            if (outgoing.some((r) => r.toUserId === targetUser.id)) return false;
            if (incoming.some((r) => r.fromUserId === targetUser.id)) return false;

            const { data: inserted, error } = await Promise.race([
              supabase.from("friend_requests").insert({
                sender_id: user.id, receiver_id: targetUser.id, message: message || null,
              }).select("id").single(),
              makeTimeout(),
            ]);

            if (error) {
              console.error("Friend request insert failed:", error);
              return false;
            }

            // Update local state with the new outgoing request
            set((state) => ({
              friendRequests: {
                ...state.friendRequests,
                outgoing: [...state.friendRequests.outgoing, {
                  id: inserted.id,
                  fromUserId: user.id,
                  fromUsername: "You",
                  fromDisplayName: "You",
                  fromAvatar: "",
                  toUserId: targetUser.id,
                  message: message || undefined,
                  createdAt: new Date(),
                  direction: "outgoing" as const,
                }],
              },
            }));

            return true;
          } catch (err) {
            console.error("sendFriendRequest error:", err);
            return false;
          }
        },

        acceptFriendRequest: async (requestId) => {
          const request = get().friendRequests.incoming.find((r) => r.id === requestId);
          if (!request) return;

          try {
            const supabase = createClient();

            // Use atomic RPC function (SECURITY DEFINER bypasses RLS for friendship insert)
            const { error } = await supabase.rpc("accept_friend_request", {
              request_id: requestId,
            });

            if (error) {
              console.error("Error accepting friend request:", error);
              toast.error("Failed", "Could not accept friend request");
              return;
            }

            // Move from requests to friends list
            set((state) => ({
              friends: [...state.friends, {
                id: `friendship-${Date.now()}`,
                userId: request.fromUserId,
                username: request.fromUsername,
                displayName: request.fromDisplayName,
                avatar: request.fromAvatar,
                status: "offline" as const,
                friendshipStatus: "accepted" as const,
                createdAt: new Date(),
              }],
              friendRequests: {
                ...state.friendRequests,
                incoming: state.friendRequests.incoming.filter((r) => r.id !== requestId),
              },
            }));

            toast.success("Friend Added", `You are now friends with ${request.fromDisplayName}`);
          } catch (err) {
            console.error("Error accepting friend request:", err);
            toast.error("Failed", "Could not accept friend request");
          }
        },

        declineFriendRequest: async (requestId) => {
          try {
            const supabase = createClient();

            // DELETE the record (GDPR minimization — no permanent rejection history)
            const { error } = await supabase.from("friend_requests")
              .delete()
              .eq("id", requestId);

            if (error) {
              console.error("Error declining friend request:", error);
              toast.error("Failed", "Could not decline friend request");
              return;
            }

            set((state) => ({
              friendRequests: {
                ...state.friendRequests,
                incoming: state.friendRequests.incoming.filter((r) => r.id !== requestId),
              },
            }));

            toast.success("Declined", "Friend request declined");
          } catch (err) {
            console.error("Error declining friend request:", err);
            toast.error("Failed", "Could not decline friend request");
          }
        },

        cancelFriendRequest: async (requestId) => {
          try {
            const supabase = createClient();
            const { error } = await supabase.from("friend_requests").delete().eq("id", requestId);

            if (error) {
              console.error("Error cancelling friend request:", error);
              return;
            }

            set((state) => ({
              friendRequests: {
                ...state.friendRequests,
                outgoing: state.friendRequests.outgoing.filter((r) => r.id !== requestId),
              },
            }));
          } catch (err) {
            console.error("Error cancelling friend request:", err);
          }
        },

        removeFriend: async (friendId) => {
          try {
            const supabase = createClient();
            const { error } = await supabase.from("friendships").delete().eq("id", friendId);

            if (error) {
              console.error("Error removing friend:", error);
              toast.error("Failed", "Could not remove friend");
              return;
            }
          } catch (err) {
            console.error("Error removing friend:", err);
            toast.error("Failed", "Could not remove friend");
            return;
          }

          set((state) => ({
            friends: state.friends.filter((f) => f.id !== friendId),
          }));

          toast.success("Removed", "Friend removed");
        },

        blockUser: async (userId) => {
          const friend = get().friends.find((f) => f.userId === userId);

          try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Insert block record
            await supabase.from("blocked_users").insert({
              blocker_id: user.id, blocked_id: userId,
            });

            // Remove friendship if exists
            if (friend) {
              await supabase.from("friendships").delete().eq("id", friend.id);
            }
          } catch (err) {
            console.error("Error blocking user:", err);
          }

          if (friend) {
            set((state) => ({
              friends: state.friends.filter((f) => f.userId !== userId),
              blockedUsers: [...state.blockedUsers, { ...friend, friendshipStatus: "blocked", status: "offline" }],
            }));
          }
        },

        unblockUser: async (userId) => {
          const blocked = get().blockedUsers.find((u) => u.userId === userId);

          try {
            const supabase = createClient();
            if (blocked) {
              await supabase.from("blocked_users").delete().eq("id", blocked.id);
            }
          } catch (err) {
            console.error("Error unblocking user:", err);
          }

          set((state) => ({
            blockedUsers: state.blockedUsers.filter((u) => u.userId !== userId),
          }));
        },

        openAddFriendModal: () => set({ isAddFriendModalOpen: true }),
        closeAddFriendModal: () => set({ isAddFriendModalOpen: false }),

        getOnlineFriends: () => get().friends.filter((f) => f.status === "online"),
        getPendingCount: () => {
          const { incoming } = get().friendRequests;
          return incoming.length;
        },

        subscribeToFriendRequests: () => {
          // Avoid duplicate subscriptions
          if (realtimeChannel) return;

          const userId = useAuthStore.getState().user?.id;
          if (!userId) return;

          const supabase = createClient();

          realtimeChannel = supabase
            .channel("friend_requests_realtime")
            .on("postgres_changes", {
              event: "INSERT",
              schema: "public",
              table: "friend_requests",
              filter: `receiver_id=eq.${userId}`,
            }, async (payload) => {
              const row = payload.new as Record<string, unknown>;

              // Already have this request?
              if (get().friendRequests.incoming.some((r) => r.id === row.id)) return;

              // Fetch sender profile
              const { data: sender } = await supabase
                .from("profiles")
                .select("id, username, display_name, avatar_url")
                .eq("id", row.sender_id as string)
                .single();

              if (!sender) return;

              const newRequest: FriendRequest = {
                id: row.id as string,
                fromUserId: sender.id,
                fromUsername: sender.username,
                fromDisplayName: sender.display_name || sender.username,
                fromAvatar: sender.avatar_url || "",
                toUserId: userId,
                message: (row.message as string) || undefined,
                createdAt: new Date(row.created_at as string),
                direction: "incoming",
              };

              set((state) => ({
                friendRequests: {
                  ...state.friendRequests,
                  incoming: [...state.friendRequests.incoming, newRequest],
                },
              }));

              toast.info("Friend Request", `${sender.display_name || sender.username} sent you a friend request`);
            })
            .on("postgres_changes", {
              event: "DELETE",
              schema: "public",
              table: "friend_requests",
              filter: `receiver_id=eq.${userId}`,
            }, (payload) => {
              const oldRow = payload.old as Record<string, unknown>;
              set((state) => ({
                friendRequests: {
                  ...state.friendRequests,
                  incoming: state.friendRequests.incoming.filter((r) => r.id !== oldRow.id),
                },
              }));
            })
            .on("postgres_changes", {
              event: "DELETE",
              schema: "public",
              table: "friend_requests",
              filter: `sender_id=eq.${userId}`,
            }, (payload) => {
              const oldRow = payload.old as Record<string, unknown>;
              set((state) => ({
                friendRequests: {
                  ...state.friendRequests,
                  outgoing: state.friendRequests.outgoing.filter((r) => r.id !== oldRow.id),
                },
              }));
            })
            .subscribe();
        },

        unsubscribeFromFriendRequests: () => {
          if (realtimeChannel) {
            const supabase = createClient();
            supabase.removeChannel(realtimeChannel);
            realtimeChannel = null;
          }
        },
      }),
      {
        name: "bedrock-friends",
        partialize: (state) => ({ currentTab: state.currentTab }),
      }
    ),
    { name: "FriendsStore" }
  )
);
