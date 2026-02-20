import { create } from "zustand";
import { persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";

// ── Types ──────────────────────────────────────────────────

export interface VoiceParticipant {
  identity: string; // LiveKit participant identity (userId)
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

export type CallState =
  | "idle"
  | "outgoing_ringing"
  | "incoming_ringing"
  | "active"
  | "ended";

export interface DirectCallData {
  id: string;
  callerId: string;
  calleeId: string;
  callerName: string;
  callerAvatar?: string;
  calleeName?: string;
  calleeAvatar?: string;
  roomName: string;
  callType: "voice" | "video";
  status: string;
}

export interface VoiceCapabilities {
  audio: boolean;
  video: boolean;
  screen_share: boolean;
}

// ── State Interface ────────────────────────────────────────

interface VoiceState {
  // Server voice channel connection
  channelId: string | null;
  channelName: string | null;
  serverId: string | null;
  voiceToken: string | null;
  voiceWsUrl: string | null;
  voiceRoomName: string | null;
  connectionStatus: ConnectionStatus;
  error: string | null;
  capabilities: VoiceCapabilities;

  // Participants (Record for O(1) lookup)
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
    identity: string;
    username: string;
    isLocal: boolean;
  } | null;

  // Audio enhancement (persisted)
  noiseCancellationEnabled: boolean;

  // Direct calls
  callState: CallState;
  activeDirectCall: DirectCallData | null;
  incomingCall: DirectCallData | null;
  directCallToken: string | null;
  directCallWsUrl: string | null;

  // Connection actions
  setConnectionStatus: (status: ConnectionStatus) => void;
  setVoiceConnection: (data: {
    channelId: string;
    channelName: string;
    serverId: string;
    token: string;
    wsUrl: string;
    roomName: string;
    capabilities: VoiceCapabilities;
  }) => void;
  setError: (error: string | null) => void;

  // Participant actions
  addParticipant: (participant: VoiceParticipant) => void;
  updateParticipant: (
    identity: string,
    updates: Partial<VoiceParticipant>,
  ) => void;
  removeParticipant: (identity: string) => void;
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
    data: { identity: string; username: string; isLocal: boolean } | null,
  ) => void;

  // Audio enhancement actions
  setNoiseCancellation: (enabled: boolean) => void;

  // Direct call actions
  setIncomingCall: (call: DirectCallData | null) => void;
  setActiveDirectCall: (call: DirectCallData | null) => void;
  setCallState: (state: CallState) => void;
  setDirectCallConnection: (token: string, wsUrl: string) => void;
  clearCall: () => void;

  // Full reset
  reset: () => void;
}

// ── Initial State ──────────────────────────────────────────

const initialState = {
  channelId: null as string | null,
  channelName: null as string | null,
  serverId: null as string | null,
  voiceToken: null as string | null,
  voiceWsUrl: null as string | null,
  voiceRoomName: null as string | null,
  connectionStatus: "idle" as ConnectionStatus,
  error: null as string | null,
  capabilities: {
    audio: true,
    video: false,
    screen_share: false,
  } as VoiceCapabilities,
  participants: {} as Record<string, VoiceParticipant>,
  isMuted: false,
  isDeafened: false,
  isVideoOn: false,
  isScreenSharing: false,
  permissionStep: "none" as const,
  activeScreenShare: null as VoiceState["activeScreenShare"],
  noiseCancellationEnabled: false,
  callState: "idle" as CallState,
  activeDirectCall: null as DirectCallData | null,
  incomingCall: null as DirectCallData | null,
  directCallToken: null as string | null,
  directCallWsUrl: null as string | null,
};

// ── Store ──────────────────────────────────────────────────

export const useVoiceStore = create<VoiceState>()(
  conditionalDevtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Connection actions
        setConnectionStatus: (status) => set({ connectionStatus: status }),

        setVoiceConnection: (data) =>
          set({
            connectionStatus: "connected",
            channelId: data.channelId,
            channelName: data.channelName,
            serverId: data.serverId,
            voiceToken: data.token,
            voiceWsUrl: data.wsUrl,
            voiceRoomName: data.roomName,
            capabilities: data.capabilities,
          }),

        setError: (error) => set({ error }),

        // Participant actions with privacy audit logging
        addParticipant: (participant) => {
          console.info(
            `[Privacy Audit] User ${participant.username} (${participant.userId}) joined voice channel at ${new Date().toISOString()}`,
          );
          set((s) => ({
            participants: {
              ...s.participants,
              [participant.identity]: participant,
            },
          }));
        },

        updateParticipant: (identity, updates) =>
          set((s) => {
            const existing = s.participants[identity];
            if (!existing) return s;
            return {
              participants: {
                ...s.participants,
                [identity]: { ...existing, ...updates },
              },
            };
          }),

        removeParticipant: (identity) => {
          const participant = get().participants[identity];
          if (participant) {
            console.info(
              `[Privacy Audit] User ${participant.username} (${participant.userId}) left voice channel at ${new Date().toISOString()}`,
            );
          }
          set((s) => {
            const { [identity]: _, ...rest } = s.participants;
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
              `[Privacy Audit] User ${localParticipant.username} ${muted ? "muted" : "unmuted"} microphone at ${new Date().toISOString()}`,
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
              `[Privacy Audit] Screen share ${data.isLocal ? "started" : "received from"} ${data.username} at ${new Date().toISOString()}`,
            );
          } else {
            console.info(
              `[Privacy Audit] Screen share ended at ${new Date().toISOString()}`,
            );
          }
          set({ activeScreenShare: data });
        },

        // Audio enhancement actions
        setNoiseCancellation: (enabled) => {
          console.info(
            `[Privacy Audit] Noise cancellation ${enabled ? "enabled" : "disabled"} at ${new Date().toISOString()}`,
          );
          set({ noiseCancellationEnabled: enabled });
        },

        // Direct call actions
        setIncomingCall: (call) => set({ incomingCall: call }),
        setActiveDirectCall: (call) => set({ activeDirectCall: call }),
        setCallState: (state) => set({ callState: state }),
        setDirectCallConnection: (token, wsUrl) =>
          set({ directCallToken: token, directCallWsUrl: wsUrl }),
        clearCall: () =>
          set({
            callState: "idle",
            activeDirectCall: null,
            incomingCall: null,
            directCallToken: null,
            directCallWsUrl: null,
          }),

        // Full reset on leave/disconnect
        reset: () => set(initialState),
      }),
      {
        name: "bedrock-voice-settings",
        partialize: (state) => ({
          noiseCancellationEnabled: state.noiseCancellationEnabled,
        }),
      },
    ),
    { name: "bedrock-voice" },
  ),
);
