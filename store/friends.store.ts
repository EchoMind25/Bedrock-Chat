import { create } from "zustand";
import { persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import type { Friend, FriendRequest } from "@/lib/types/friend";
import { createClient } from "@/lib/supabase/client";

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
  acceptFriendRequest: (requestId: string) => void;
  declineFriendRequest: (requestId: string) => void;
  cancelFriendRequest: (requestId: string) => void;
  removeFriend: (friendId: string) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  openAddFriendModal: () => void;
  closeAddFriendModal: () => void;
  getOnlineFriends: () => Friend[];
  getPendingCount: () => number;
}

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
              const supabase = createClient();
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                set({ isInitialized: true });
                return;
              }

              const { data: f1 } = await supabase
                .from("friendships")
                .select(`id, created_at, friend:profiles!friendships_user2_id_fkey(id, username, display_name, avatar_url, status)`)
                .eq("user1_id", user.id);

              const { data: f2 } = await supabase
                .from("friendships")
                .select(`id, created_at, friend:profiles!friendships_user1_id_fkey(id, username, display_name, avatar_url, status)`)
                .eq("user2_id", user.id);

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
                .eq("receiver_id", user.id)
                .eq("status", "pending");

              const { data: outgoing } = await supabase
                .from("friend_requests")
                .select(`id, message, created_at, receiver:profiles!friend_requests_receiver_id_fkey(id, username, display_name, avatar_url)`)
                .eq("sender_id", user.id)
                .eq("status", "pending");

              const { data: blocked } = await supabase
                .from("blocked_users")
                .select(`id, blocked_at, blocked:profiles!blocked_users_blocked_id_fkey(id, username, display_name, avatar_url)`)
                .eq("blocker_id", user.id);

              set({
                friends,
                friendRequests: {
                  incoming: (incoming || []).map((r) => {
                    const s = r.sender as unknown as Record<string, unknown>;
                    return {
                      id: r.id, fromUserId: s.id as string, fromUsername: s.username as string,
                      fromDisplayName: (s.display_name as string) || (s.username as string),
                      fromAvatar: (s.avatar_url as string) || "", toUserId: user.id,
                      message: r.message || undefined, createdAt: new Date(r.created_at), direction: "incoming" as const,
                    };
                  }),
                  outgoing: (outgoing || []).map((r) => {
                    const recv = r.receiver as unknown as Record<string, unknown>;
                    return {
                      id: r.id, fromUserId: user.id, fromUsername: "You",
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
              console.error("Error loading friends:", err);
              set({ isInitialized: true });
            }
          };

          loadFriends();
        },

        setCurrentTab: (tab) => set({ currentTab: tab }),
        setSearchQuery: (query) => set({ searchQuery: query }),

        sendFriendRequest: async (username, message) => {
          const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), 10000)
          );

          try {
            const supabase = createClient();
            const { data: { user } } = await Promise.race([supabase.auth.getUser(), timeout]);
            if (!user) return false;

            const { data: targetUser } = await Promise.race([
              supabase.from("profiles").select("id").eq("username", username.toLowerCase()).single(),
              timeout,
            ]);

            if (!targetUser) return false;

            const { error } = await Promise.race([
              supabase.from("friend_requests").insert({
                sender_id: user.id, receiver_id: targetUser.id, message: message || null,
              }),
              timeout,
            ]);

            if (error) return false;
            return true;
          } catch {
            return false;
          }
        },

        acceptFriendRequest: async (requestId) => {
          try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const request = get().friendRequests.incoming.find((r) => r.id === requestId);
            if (!request) return;

            // Update request status
            await supabase.from("friend_requests")
              .update({ status: "accepted", resolved_at: new Date().toISOString() })
              .eq("id", requestId);

            // Create the friendship (user1_id must be < user2_id per constraint)
            const [user1, user2] = user.id < request.fromUserId
              ? [user.id, request.fromUserId]
              : [request.fromUserId, user.id];

            await supabase.from("friendships").insert({ user1_id: user1, user2_id: user2 });

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
          } catch (err) {
            console.error("Error accepting friend request:", err);
          }
        },

        declineFriendRequest: async (requestId) => {
          try {
            const supabase = createClient();
            await supabase.from("friend_requests")
              .update({ status: "declined", resolved_at: new Date().toISOString() })
              .eq("id", requestId);

            set((state) => ({
              friendRequests: {
                ...state.friendRequests,
                incoming: state.friendRequests.incoming.filter((r) => r.id !== requestId),
              },
            }));
          } catch (err) {
            console.error("Error declining friend request:", err);
          }
        },

        cancelFriendRequest: async (requestId) => {
          try {
            const supabase = createClient();
            await supabase.from("friend_requests").delete().eq("id", requestId);

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
            await supabase.from("friendships").delete().eq("id", friendId);
          } catch (err) {
            console.error("Error removing friend:", err);
          }

          set((state) => ({
            friends: state.friends.filter((f) => f.id !== friendId),
          }));
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
          const { incoming, outgoing } = get().friendRequests;
          return incoming.length + outgoing.length;
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
