import { create } from "zustand";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import type { ServerSound } from "@/lib/types/server-sound";
import { mapDbServerSound, SOUND_LIMITS } from "@/lib/types/server-sound";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/stores/toast-store";

const EMPTY_ARRAY: ServerSound[] = [];

interface ServerSoundsState {
  soundsByServer: Map<string, ServerSound[]>;
  isLoading: boolean;
  // Currently playing sound (for UI feedback)
  playingSoundId: string | null;

  loadSounds: (serverId: string) => Promise<void>;
  uploadSound: (serverId: string, name: string, file: File, durationMs: number, uploadedBy: string, emoji?: string) => Promise<ServerSound>;
  deleteSound: (serverId: string, soundId: string) => Promise<void>;
  playSound: (sound: ServerSound) => void;
  stopSound: () => void;
  getServerSounds: (serverId: string) => ServerSound[];
}

// Audio element for playback (singleton)
let audioElement: HTMLAudioElement | null = null;

export const useServerSoundsStore = create<ServerSoundsState>()(
  conditionalDevtools(
    (set, get) => ({
      soundsByServer: new Map(),
      isLoading: false,
      playingSoundId: null,

      loadSounds: async (serverId) => {
        try {
          set({ isLoading: true });
          const supabase = createClient();
          const { data, error } = await supabase
            .from("server_sounds")
            .select("*")
            .eq("server_id", serverId)
            .order("created_at", { ascending: true });

          if (error) throw error;

          const sounds = (data || []).map((row) =>
            mapDbServerSound(row as Record<string, unknown>)
          );

          set((s) => {
            const map = new Map(s.soundsByServer);
            map.set(serverId, sounds);
            return { soundsByServer: map, isLoading: false };
          });
        } catch (err) {
          console.error("Error loading sounds:", err);
          set({ isLoading: false });
        }
      },

      uploadSound: async (serverId, name, file, durationMs, uploadedBy, emoji) => {
        const existing = get().getServerSounds(serverId);
        if (existing.length >= SOUND_LIMITS.maxPerServer) {
          toast.error("Limit Reached", `Maximum ${SOUND_LIMITS.maxPerServer} sounds per server`);
          throw new Error("Sound limit reached");
        }
        if (file.size > SOUND_LIMITS.maxFileSize) {
          toast.error("File Too Large", "Sound must be under 1MB");
          throw new Error("File too large");
        }
        if (durationMs > SOUND_LIMITS.maxDuration) {
          toast.error("Too Long", "Sound must be 10 seconds or less");
          throw new Error("Sound too long");
        }

        const supabase = createClient();

        // Upload to storage
        const ext = file.name.split(".").pop() || "mp3";
        const path = `${serverId}/${name}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("server-sounds")
          .upload(path, file, { upsert: true });

        if (uploadError) {
          toast.error("Upload Failed", "Could not upload sound file");
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from("server-sounds")
          .getPublicUrl(path);

        const { data, error } = await supabase
          .from("server_sounds")
          .insert({
            server_id: serverId,
            name,
            audio_url: urlData.publicUrl,
            duration_ms: durationMs,
            uploaded_by: uploadedBy,
            emoji: emoji || null,
          })
          .select()
          .single();

        if (error) {
          toast.error("Error", "Could not save sound");
          throw error;
        }

        const sound = mapDbServerSound(data as Record<string, unknown>);

        set((s) => {
          const map = new Map(s.soundsByServer);
          const sounds = map.get(serverId) || [];
          map.set(serverId, [...sounds, sound]);
          return { soundsByServer: map };
        });

        toast.success("Sound Added", `"${name}" is ready to play`);
        return sound;
      },

      deleteSound: async (serverId, soundId) => {
        const supabase = createClient();
        const { error } = await supabase
          .from("server_sounds")
          .delete()
          .eq("id", soundId);

        if (error) {
          toast.error("Error", "Could not delete sound");
          throw error;
        }

        set((s) => {
          const map = new Map(s.soundsByServer);
          const sounds = (map.get(serverId) || []).filter((snd) => snd.id !== soundId);
          map.set(serverId, sounds);
          return { soundsByServer: map };
        });

        toast.success("Sound Deleted", "The sound has been removed");
      },

      playSound: (sound) => {
        // Stop any currently playing sound
        get().stopSound();

        if (typeof window === "undefined") return;

        audioElement = new Audio(sound.audioUrl);
        audioElement.volume = sound.volume;
        audioElement.play().catch(() => {
          // Playback failed (e.g., user interaction required)
        });

        set({ playingSoundId: sound.id });

        audioElement.onended = () => {
          set({ playingSoundId: null });
          audioElement = null;
        };
      },

      stopSound: () => {
        if (audioElement) {
          audioElement.pause();
          audioElement.currentTime = 0;
          audioElement = null;
        }
        set({ playingSoundId: null });
      },

      getServerSounds: (serverId) => {
        return get().soundsByServer.get(serverId) || EMPTY_ARRAY;
      },
    }),
    { name: "ServerSoundsStore" },
  ),
);
