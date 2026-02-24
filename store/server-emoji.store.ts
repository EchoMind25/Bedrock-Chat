import { create } from "zustand";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import type { ServerEmoji } from "@/lib/types/server-emoji";
import { mapDbServerEmoji, EMOJI_LIMITS } from "@/lib/types/server-emoji";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/stores/toast-store";

const EMPTY_ARRAY: ServerEmoji[] = [];

interface ServerEmojiState {
  emojisByServer: Map<string, ServerEmoji[]>;
  isLoading: boolean;

  loadEmojis: (serverId: string) => Promise<void>;
  uploadEmoji: (serverId: string, name: string, file: File, uploadedBy: string) => Promise<ServerEmoji>;
  renameEmoji: (serverId: string, emojiId: string, newName: string) => Promise<void>;
  deleteEmoji: (serverId: string, emojiId: string) => Promise<void>;
  getServerEmojis: (serverId: string) => ServerEmoji[];
  searchEmojis: (serverId: string, query: string) => ServerEmoji[];
}

export const useServerEmojiStore = create<ServerEmojiState>()(
  conditionalDevtools(
    (set, get) => ({
      emojisByServer: new Map(),
      isLoading: false,

      loadEmojis: async (serverId) => {
        try {
          set({ isLoading: true });
          const supabase = createClient();
          const { data, error } = await supabase
            .from("server_emojis")
            .select("*")
            .eq("server_id", serverId)
            .order("created_at", { ascending: true });

          if (error) throw error;

          const emojis = (data || []).map((row) =>
            mapDbServerEmoji(row as Record<string, unknown>)
          );

          set((s) => {
            const map = new Map(s.emojisByServer);
            map.set(serverId, emojis);
            return { emojisByServer: map, isLoading: false };
          });
        } catch (err) {
          console.error("Error loading emojis:", err);
          set({ isLoading: false });
        }
      },

      uploadEmoji: async (serverId, name, file, uploadedBy) => {
        const existing = get().getServerEmojis(serverId);
        const isAnimated = file.type === "image/gif";
        const staticCount = existing.filter((e) => !e.isAnimated).length;
        const animatedCount = existing.filter((e) => e.isAnimated).length;

        if (isAnimated && animatedCount >= EMOJI_LIMITS.animated) {
          toast.error("Limit Reached", `Maximum ${EMOJI_LIMITS.animated} animated emojis per server`);
          throw new Error("Animated emoji limit reached");
        }
        if (!isAnimated && staticCount >= EMOJI_LIMITS.static) {
          toast.error("Limit Reached", `Maximum ${EMOJI_LIMITS.static} static emojis per server`);
          throw new Error("Static emoji limit reached");
        }
        if (file.size > EMOJI_LIMITS.maxFileSize) {
          toast.error("File Too Large", "Emoji must be under 256KB");
          throw new Error("File too large");
        }

        const supabase = createClient();

        // Upload to storage
        const ext = file.name.split(".").pop() || "png";
        const path = `${serverId}/${name}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("server-emojis")
          .upload(path, file, { upsert: true });

        if (uploadError) {
          toast.error("Upload Failed", "Could not upload emoji image");
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from("server-emojis")
          .getPublicUrl(path);

        // Insert record
        const { data, error } = await supabase
          .from("server_emojis")
          .insert({
            server_id: serverId,
            name,
            image_url: urlData.publicUrl,
            uploaded_by: uploadedBy,
            is_animated: isAnimated,
          })
          .select()
          .single();

        if (error) {
          toast.error("Error", "Could not save emoji");
          throw error;
        }

        const emoji = mapDbServerEmoji(data as Record<string, unknown>);

        set((s) => {
          const map = new Map(s.emojisByServer);
          const emojis = map.get(serverId) || [];
          map.set(serverId, [...emojis, emoji]);
          return { emojisByServer: map };
        });

        toast.success("Emoji Created", `":${name}:" is ready to use`);
        return emoji;
      },

      renameEmoji: async (serverId, emojiId, newName) => {
        const supabase = createClient();
        const { error } = await supabase
          .from("server_emojis")
          .update({ name: newName })
          .eq("id", emojiId);

        if (error) {
          toast.error("Error", "Could not rename emoji");
          throw error;
        }

        set((s) => {
          const map = new Map(s.emojisByServer);
          const emojis = (map.get(serverId) || []).map((e) =>
            e.id === emojiId ? { ...e, name: newName } : e
          );
          map.set(serverId, emojis);
          return { emojisByServer: map };
        });

        toast.success("Emoji Renamed", `Now ":${newName}:"`);
      },

      deleteEmoji: async (serverId, emojiId) => {
        const supabase = createClient();
        const { error } = await supabase
          .from("server_emojis")
          .delete()
          .eq("id", emojiId);

        if (error) {
          toast.error("Error", "Could not delete emoji");
          throw error;
        }

        set((s) => {
          const map = new Map(s.emojisByServer);
          const emojis = (map.get(serverId) || []).filter((e) => e.id !== emojiId);
          map.set(serverId, emojis);
          return { emojisByServer: map };
        });

        toast.success("Emoji Deleted", "The emoji has been removed");
      },

      getServerEmojis: (serverId) => {
        return get().emojisByServer.get(serverId) || EMPTY_ARRAY;
      },

      searchEmojis: (serverId, query) => {
        const emojis = get().getServerEmojis(serverId);
        if (!query.trim()) return emojis;
        const lower = query.toLowerCase();
        return emojis.filter((e) => e.name.toLowerCase().includes(lower));
      },
    }),
    { name: "ServerEmojiStore" },
  ),
);
