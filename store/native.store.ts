import { create } from "zustand";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import type { ActivityChangedPayload, PerformanceStats } from "@/lib/types/tauri";

// ── Types ──────────────────────────────────────────────────

interface NativeState {
  /** Whether the Tauri runtime is available (desktop app). */
  nativeAvailable: boolean;
  /** Currently detected game name, or null. */
  currentGame: string | null;
  /** Whether the overlay window is visible. */
  overlayVisible: boolean;
  /** Latest performance stats snapshot. */
  perfStats: PerformanceStats | null;

  // Internal
  _pollInterval: ReturnType<typeof setInterval> | null;
  _unlisten: Array<() => void>;

  // Actions
  init: () => Promise<void>;
  destroy: () => void;
  toggleOverlay: () => Promise<void>;
  setActivityDetection: (enabled: boolean) => Promise<void>;
  /** Update Supabase presence with current game (respects COPPA). */
  syncActivityToPresence: () => Promise<void>;
}

// ── Helpers ────────────────────────────────────────────────

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

/** Dynamic import of Tauri API — only available in desktop context. */
async function getTauriCore() {
  return await import("@tauri-apps/api/core");
}

async function getTauriEvent() {
  return await import("@tauri-apps/api/event");
}

// ── Store ──────────────────────────────────────────────────

export const useNativeStore = create<NativeState>()(
  conditionalDevtools(
    (set, get) => ({
      nativeAvailable: false,
      currentGame: null,
      overlayVisible: false,
      perfStats: null,
      _pollInterval: null,
      _unlisten: [],

      init: async () => {
        if (!isTauri()) return;
        set({ nativeAvailable: true });

        try {
          const { invoke } = await getTauriCore();
          const { listen } = await getTauriEvent();

          // Initial activity check
          const game = await invoke<string | null>("get_activity");
          set({ currentGame: game });

          // Subscribe to activity-changed events from Rust
          const unlistenActivity = await listen<ActivityChangedPayload>(
            "activity-changed",
            (event) => {
              set({ currentGame: event.payload.game });
              // Sync to presence when activity changes
              get().syncActivityToPresence();
            },
          );

          // Subscribe to overlay visibility events
          const unlistenOverlay = await listen<boolean>(
            "overlay-visibility",
            (event) => {
              set({ overlayVisible: event.payload });
            },
          );

          // Poll activity every 10s as backup (Rust also polls, but this
          // catches cases where the event might be missed)
          const pollInterval = setInterval(async () => {
            try {
              const currentGame = await invoke<string | null>("get_activity");
              const prev = get().currentGame;
              if (currentGame !== prev) {
                set({ currentGame });
                get().syncActivityToPresence();
              }
            } catch {
              // Tauri invoke failed — silently ignore
            }
          }, 10_000);

          set({
            _pollInterval: pollInterval,
            _unlisten: [unlistenActivity, unlistenOverlay],
          });
        } catch {
          // Tauri APIs not available — graceful degradation
        }
      },

      destroy: () => {
        const { _pollInterval, _unlisten } = get();
        if (_pollInterval) clearInterval(_pollInterval);
        for (const unlisten of _unlisten) unlisten();
        set({
          _pollInterval: null,
          _unlisten: [],
          currentGame: null,
          overlayVisible: false,
          nativeAvailable: false,
        });
      },

      toggleOverlay: async () => {
        if (!get().nativeAvailable) return;
        try {
          const { invoke } = await getTauriCore();
          await invoke("toggle_overlay");
        } catch {
          // Overlay toggle failed — silently ignore
        }
      },

      setActivityDetection: async (enabled: boolean) => {
        if (!get().nativeAvailable) return;
        try {
          const { invoke } = await getTauriCore();
          await invoke("set_activity_detection_enabled", { enabled });
          if (!enabled) {
            set({ currentGame: null });
          }
        } catch {
          // Failed to toggle detection
        }
      },

      syncActivityToPresence: async () => {
        const { currentGame, nativeAvailable } = get();
        if (!nativeAvailable) return;

        // Import auth and family stores lazily to avoid circular deps
        const { useAuthStore } = await import("@/store/auth.store");
        const { useFamilyStore } = await import("@/store/family.store");
        const { useSettingsStore } = await import("@/store/settings.store");

        const user = useAuthStore.getState().user;
        if (!user) return;

        // Privacy kill switch: check if user has activity sharing disabled
        // (this is on the settings store, not yet added — check for it)
        const settings = useSettingsStore.getState().settings;
        if (!settings) return;

        // COPPA hard gate: if user is a teen account, check monitoring level.
        // Teen accounts (under 13) require parent opt-in (monitoring >= 2 "moderate")
        // for activity sharing. The accountType "teen" flag already encodes COPPA status.
        const isTeen = useFamilyStore.getState().isTeen;
        const monitoringLevel = useFamilyStore.getState().myMonitoringLevel;

        if (isTeen && user.accountType === "teen") {
          // COPPA: activity sharing requires parent to have set monitoring
          // level to "moderate" (2) or higher, which enables activity sharing
          if (monitoringLevel === null || monitoringLevel < 2) {
            // COPPA: do NOT update presence with activity
            return;
          }
        }

        // Update Supabase presence with current activity
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          await supabase
            .from("user_presence")
            .upsert(
              {
                user_id: user.id,
                current_activity: currentGame,
                activity_updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" },
            );
        } catch {
          // Supabase update failed — non-fatal
        }
      },
    }),
    { name: "native-store" },
  ),
);

