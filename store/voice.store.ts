import { create } from "zustand";
import { persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";

// ── Types ──────────────────────────────────────────────────

export interface VoiceParticipant {
  sessionId: string;
  userId: string;
  username: string;
  avatar: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isLocal: boolean;
}

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error"
  | "left";

// ── State Interface ────────────────────────────────────────

interface VoiceState {
  // Connection
  channelId: string | null;
  roomUrl: string | null;
  meetingToken: string | null;
  connectionStatus: ConnectionStatus;
  reconnectAttempts: number;
  error: string | null;

  // Participants (Record for O(1) lookup + devtools compatibility)
  participants: Record<string, VoiceParticipant>;

  // Local controls
  isMuted: boolean;
  isDeafened: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;

  // Permission flow
  permissionStep: "none" | "mic" | "camera";

  // Screen sharing
  activeScreenShare: {
    sessionId: string;
    username: string;
    isLocal: boolean;
  } | null;

  // Audio enhancement (persisted)
  noiseCancellationEnabled: boolean;

  // Connection actions
  setConnectionStatus: (status: ConnectionStatus) => void;
  setChannelId: (channelId: string | null) => void;
  setRoomUrl: (url: string | null) => void;
  setMeetingToken: (token: string | null) => void;
  setError: (error: string | null) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;

  // Participant actions
  addParticipant: (participant: VoiceParticipant) => void;
  updateParticipant: (
    sessionId: string,
    updates: Partial<VoiceParticipant>
  ) => void;
  removeParticipant: (sessionId: string) => void;
  clearParticipants: () => void;

  // Local control actions
  setMuted: (muted: boolean) => void;
  setDeafened: (deafened: boolean) => void;
  setVideoOn: (on: boolean) => void;
  setScreenSharing: (sharing: boolean) => void;

  // Permission modal
  setPermissionStep: (step: "none" | "mic" | "camera") => void;

  // Screen sharing actions
  setActiveScreenShare: (
    data: { sessionId: string; username: string; isLocal: boolean } | null
  ) => void;

  // Audio enhancement actions
  setNoiseCancellation: (enabled: boolean) => void;

  // Full reset
  reset: () => void;
}

// ── Initial State ──────────────────────────────────────────

const initialState = {
  channelId: null,
  roomUrl: null,
  meetingToken: null,
  connectionStatus: "idle" as ConnectionStatus,
  reconnectAttempts: 0,
  error: null,
  participants: {} as Record<string, VoiceParticipant>,
  isMuted: false,
  isDeafened: false,
  isVideoOn: false,
  isScreenSharing: false,
  permissionStep: "none" as const,
  activeScreenShare: null,
  noiseCancellationEnabled: false,
};

// ── Store ──────────────────────────────────────────────────

export const useVoiceStore = create<VoiceState>()(
  conditionalDevtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Connection actions
        setConnectionStatus: (status) => set({ connectionStatus: status }),
        setChannelId: (channelId) => set({ channelId }),
        setRoomUrl: (url) => set({ roomUrl: url }),
        setMeetingToken: (token) => set({ meetingToken: token }),
        setError: (error) => set({ error }),
        incrementReconnectAttempts: () =>
          set((s) => ({ reconnectAttempts: s.reconnectAttempts + 1 })),
        resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),

        // Participant actions with privacy audit logging
        addParticipant: (participant) => {
          console.info(
            `[Privacy Audit] User ${participant.username} (${participant.userId}) joined voice channel at ${new Date().toISOString()}`
          );
          set((s) => ({
            participants: { ...s.participants, [participant.sessionId]: participant },
          }));
        },

        updateParticipant: (sessionId, updates) =>
          set((s) => {
            const existing = s.participants[sessionId];
            if (!existing) return s;
            return {
              participants: {
                ...s.participants,
                [sessionId]: { ...existing, ...updates },
              },
            };
          }),

        removeParticipant: (sessionId) => {
          const participant = get().participants[sessionId];
          if (participant) {
            console.info(
              `[Privacy Audit] User ${participant.username} (${participant.userId}) left voice channel at ${new Date().toISOString()}`
            );
          }
          set((s) => {
            const { [sessionId]: _, ...rest } = s.participants;
            return { participants: rest };
          });
        },

        clearParticipants: () => set({ participants: {} }),

        // Local control actions with privacy audit logging
        setMuted: (muted) => {
          const localParticipant = (
            Object.values(get().participants) as VoiceParticipant[]
          ).find((p) => p.isLocal);
          if (localParticipant) {
            console.info(
              `[Privacy Audit] User ${localParticipant.username} ${muted ? "muted" : "unmuted"} microphone at ${new Date().toISOString()}`
            );
          }
          set({ isMuted: muted });
        },

        setDeafened: (deafened) => set({ isDeafened: deafened }),
        setVideoOn: (on) => set({ isVideoOn: on }),
        setScreenSharing: (sharing) => set({ isScreenSharing: sharing }),

        // Permission modal
        setPermissionStep: (step) => set({ permissionStep: step }),

        // Screen sharing actions
        setActiveScreenShare: (data) => {
          if (data) {
            console.info(
              `[Privacy Audit] Screen share ${data.isLocal ? "started" : "received from"} ${data.username} at ${new Date().toISOString()}`
            );
          } else {
            console.info(
              `[Privacy Audit] Screen share ended at ${new Date().toISOString()}`
            );
          }
          set({ activeScreenShare: data });
        },

        // Audio enhancement actions
        setNoiseCancellation: (enabled) => {
          console.info(
            `[Privacy Audit] Noise cancellation ${enabled ? "enabled" : "disabled"} at ${new Date().toISOString()}`
          );
          set({ noiseCancellationEnabled: enabled });
        },

        // Full reset on leave/disconnect
        reset: () => set(initialState),
      }),
      {
        name: "bedrock-voice-settings",
        partialize: (state) => ({
          noiseCancellationEnabled: state.noiseCancellationEnabled,
        }),
      }
    ),
    { name: "bedrock-voice" }
  )
);
