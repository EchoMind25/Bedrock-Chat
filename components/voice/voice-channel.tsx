"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useCallback, useRef } from "react";
import { Users, RefreshCw, PhoneOff } from "lucide-react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { Track, RoomEvent, ConnectionState } from "livekit-client";
import { OrbitalAvatar } from "./orbital-avatar";
import { ControlsBar } from "./controls-bar";
import { VoiceSettings } from "./voice-settings";
import { ScreenShare } from "./screen-share";
import { PermissionModal } from "./permission-modal";
import { ScreenShareConsentModal } from "./screen-share-consent-modal";
import { Button } from "../ui/button";
import { useLiveKitCall } from "@/lib/hooks/use-livekit-call";
import { useVoiceStore } from "@/store/voice.store";
import { useVoicePresenceStore } from "@/store/voice-presence.store";
import {
  getOrbitalPosition,
  getOrbitRadius,
} from "@/lib/utils/orbital-layout";
import { useState } from "react";
import type { VoiceParticipant } from "@/store/voice.store";

interface VoiceChannelProps {
  channelId: string;
  channelName: string;
  serverId: string;
  onLeave?: () => void;
}

const springConfig = {
  type: "spring" as const,
  stiffness: 260,
  damping: 20,
  mass: 1,
};

export function VoiceChannel({
  channelId,
  channelName,
  serverId,
  onLeave,
}: VoiceChannelProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const leavingRef = useRef(false);

  // Voice store selectors
  const connectionStatus = useVoiceStore((s) => s.connectionStatus);
  const permissionStep = useVoiceStore((s) => s.permissionStep);
  const error = useVoiceStore((s) => s.error);
  const participants = useVoiceStore((s) => s.participants);
  const voiceToken = useVoiceStore((s) => s.voiceToken);
  const voiceWsUrl = useVoiceStore((s) => s.voiceWsUrl);

  // LiveKit hook for join/leave
  const { joinVoiceChannel, leaveVoiceChannel } = useLiveKitCall();

  // Compute derived values with useMemo
  const localParticipant = useMemo(
    () => Object.values(participants).find((p) => p.isLocal),
    [participants],
  );

  const remoteParticipantIds = useMemo(
    () =>
      Object.entries(participants)
        .filter(([_, p]) => !p.isLocal)
        .map(([id]) => id),
    [participants],
  );

  const remoteParticipants = useMemo(
    () => remoteParticipantIds.map((id) => participants[id]!),
    [remoteParticipantIds, participants],
  );

  const participantsArray = useMemo(
    () => Object.values(participants),
    [participants],
  );

  // Set channel state on mount/change
  useEffect(() => {
    leavingRef.current = false;
    useVoiceStore.getState().setPermissionStep("mic");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  // Track voice presence in Supabase when connected (for sidebar display)
  useEffect(() => {
    if (connectionStatus === "connected") {
      useVoicePresenceStore.getState().trackVoice(channelId);
    } else if (
      connectionStatus === "idle" ||
      connectionStatus === "left" ||
      connectionStatus === "error"
    ) {
      useVoicePresenceStore.getState().untrackVoice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionStatus, channelId]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      useVoicePresenceStore.getState().untrackVoice();
    };
  }, []);

  // Orbital layout calculations
  const radius = useMemo(
    () => getOrbitRadius(remoteParticipantIds.length),
    [remoteParticipantIds.length],
  );

  const orbitalPositions = useMemo(
    () =>
      Array.from({ length: remoteParticipantIds.length }, (_, i) =>
        getOrbitalPosition(i, remoteParticipantIds.length, radius),
      ),
    [remoteParticipantIds.length, radius],
  );

  const handlePermissionAllow = useCallback(async () => {
    const currentStep = useVoiceStore.getState().permissionStep;

    try {
      if (currentStep === "mic") {
        try {
          const permStatus = await navigator.permissions.query({
            name: "microphone" as PermissionName,
          });
          if (permStatus.state !== "granted") {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            stream.getTracks().forEach((t) => t.stop());
          }
        } catch {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            stream.getTracks().forEach((t) => t.stop());
          } catch {
            // No mic available - still allow joining (they'll be muted)
          }
        }

        console.info(
          `[Privacy Audit] Microphone permission granted at ${new Date().toISOString()}`,
        );

        useVoiceStore.getState().setPermissionStep("none");
        joinVoiceChannel(channelId, channelName, serverId);
      } else if (currentStep === "camera") {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          stream.getTracks().forEach((t) => t.stop());
          useVoiceStore.getState().setVideoOn(true);
        } catch {
          // Camera denied - just close modal
        }

        console.info(
          `[Privacy Audit] Camera permission granted at ${new Date().toISOString()}`,
        );
        useVoiceStore.getState().setPermissionStep("none");
      }
    } catch {
      useVoiceStore.getState().setPermissionStep("none");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, channelName, serverId]);

  const handlePermissionDeny = useCallback(() => {
    const currentStep = useVoiceStore.getState().permissionStep;
    useVoiceStore.getState().setPermissionStep("none");

    if (currentStep === "mic") {
      leavingRef.current = true;
      onLeave?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLeave = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;

    const store = useVoiceStore.getState();
    leaveVoiceChannel(
      channelId,
      store.isVideoOn,
      store.isScreenSharing,
    );
    onLeave?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, onLeave]);

  const handleRetry = useCallback(() => {
    useVoiceStore.getState().setError(null);
    joinVoiceChannel(channelId, channelName, serverId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, channelName, serverId]);

  const handleDisconnected = useCallback(() => {
    if (!leavingRef.current) {
      const store = useVoiceStore.getState();
      leaveVoiceChannel(
        channelId,
        store.isVideoOn,
        store.isScreenSharing,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  const isConnected = connectionStatus === "connected";
  const isConnecting =
    (connectionStatus === "connecting" || connectionStatus === "idle") &&
    permissionStep === "none";
  const isReconnecting = connectionStatus === "reconnecting";
  const isError = connectionStatus === "error";

  return (
    <>
      <div className="flex flex-col h-full bg-[oklch(0.12_0.03_260)]">
        {/* Header */}
        <motion.div
          className="shrink-0 px-6 py-4 border-b border-white/10 liquid-glass"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={springConfig}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[oklch(0.7_0.2_145/0.1)]">
                <Users className="w-5 h-5 text-[oklch(0.7_0.2_145)]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">
                  {channelName}
                </h1>
                <p className="text-sm text-slate-400">
                  {isConnected
                    ? `${participantsArray.length} ${participantsArray.length === 1 ? "participant" : "participants"}`
                    : isConnecting || isReconnecting
                      ? "Connecting..."
                      : isError
                        ? "Connection failed"
                        : "Voice Channel"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isConnected && (
                <motion.div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-interactive border border-[oklch(0.7_0.2_145/0.2)]"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={springConfig}
                >
                  <motion.div
                    className="w-2 h-2 rounded-full bg-[oklch(0.7_0.2_145)]"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [1, 0.7, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <span className="text-sm font-medium text-[oklch(0.7_0.2_145)]">
                    Connected
                  </span>
                </motion.div>
              )}

              {isReconnecting && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-interactive border border-[oklch(0.8_0.15_80/0.2)]">
                  <RefreshCw className="w-3 h-3 text-[oklch(0.8_0.15_80)] animate-spin" />
                  <span className="text-sm font-medium text-[oklch(0.8_0.15_80)]">
                    Reconnecting...
                  </span>
                </div>
              )}

              <motion.button
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/90 hover:bg-red-600/90 text-white transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLeave}
                aria-label="Leave voice channel"
              >
                <PhoneOff className="w-4 h-4" />
                <span className="text-sm font-medium">Leave</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Main content area — LiveKitRoom wraps when connected */}
        {voiceToken && voiceWsUrl && isConnected ? (
          <LiveKitRoom
            serverUrl={voiceWsUrl}
            token={voiceToken}
            connect={true}
            audio={true}
            video={false}
            onDisconnected={handleDisconnected}
            onConnected={() => {
              useVoiceStore.getState().setConnectionStatus("connected");
            }}
          >
            <RoomAudioRenderer />
            <LiveKitParticipantSync />
            <VoiceChannelContent
              isConnected={isConnected}
              isConnecting={false}
              isReconnecting={false}
              isError={false}
              error={null}
              localParticipant={localParticipant}
              remoteParticipantIds={remoteParticipantIds}
              remoteParticipants={remoteParticipants}
              participants={participants}
              participantsArray={participantsArray}
              orbitalPositions={orbitalPositions}
              handleRetry={handleRetry}
              handleLeave={handleLeave}
              onSettingsOpen={() => setIsSettingsOpen(true)}
            />
          </LiveKitRoom>
        ) : (
          <VoiceChannelContent
            isConnected={false}
            isConnecting={isConnecting}
            isReconnecting={isReconnecting}
            isError={isError}
            error={error}
            localParticipant={localParticipant}
            remoteParticipantIds={remoteParticipantIds}
            remoteParticipants={remoteParticipants}
            participants={participants}
            participantsArray={participantsArray}
            orbitalPositions={orbitalPositions}
            handleRetry={handleRetry}
            handleLeave={handleLeave}
            onSettingsOpen={() => setIsSettingsOpen(true)}
          />
        )}
      </div>

      {/* Permission Modal */}
      {permissionStep !== "none" && (
        <PermissionModal
          type={permissionStep}
          onAllow={handlePermissionAllow}
          onDeny={handlePermissionDeny}
        />
      )}

      {/* Voice Settings Modal */}
      <VoiceSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Screen Share Overlay */}
      <ScreenShare />
    </>
  );
}

/**
 * Syncs LiveKit participant state to Zustand store.
 * Must be rendered inside LiveKitRoom.
 */
function LiveKitParticipantSync() {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  useEffect(() => {
    const store = useVoiceStore.getState();

    // Sync all participants to store
    const currentIdentities = new Set<string>();

    for (const p of participants) {
      const identity = p.identity;
      currentIdentities.add(identity);

      const isLocal = p === localParticipant;
      const isSpeaking = p.isSpeaking;
      const isMicEnabled = p.isMicrophoneEnabled;
      const isCameraEnabled = p.isCameraEnabled;
      const isScreenShareEnabled = p.isScreenShareEnabled;

      const existing = store.participants[identity];
      if (existing) {
        // Update existing participant
        store.updateParticipant(identity, {
          isMuted: !isMicEnabled,
          isSpeaking,
          isVideoOn: isCameraEnabled,
          isScreenSharing: isScreenShareEnabled,
        });
      } else {
        // Add new participant
        store.addParticipant({
          identity,
          userId: identity,
          username: p.name || "Unknown",
          avatar: "",
          isMuted: !isMicEnabled,
          isDeafened: false,
          isSpeaking,
          isVideoOn: isCameraEnabled,
          isScreenSharing: isScreenShareEnabled,
          isLocal,
        });
      }

      // Track screen sharing
      if (isScreenShareEnabled) {
        store.setActiveScreenShare({
          identity,
          username: p.name || "Unknown",
          isLocal,
        });
      } else if (store.activeScreenShare?.identity === identity) {
        store.setActiveScreenShare(null);
      }
    }

    // Remove participants that are no longer in the room
    for (const identity of Object.keys(store.participants)) {
      if (!currentIdentities.has(identity)) {
        store.removeParticipant(identity);
      }
    }
  }, [participants, localParticipant, room]);

  // Listen for connection state changes
  useEffect(() => {
    if (!room) return;

    const handleConnectionStateChange = (state: ConnectionState) => {
      const store = useVoiceStore.getState();
      if (state === ConnectionState.Reconnecting) {
        store.setConnectionStatus("reconnecting");
      } else if (state === ConnectionState.Connected) {
        store.setConnectionStatus("connected");
      } else if (state === ConnectionState.Disconnected) {
        store.setConnectionStatus("left");
      }
    };

    room.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChange);
    return () => {
      room.off(RoomEvent.ConnectionStateChanged, handleConnectionStateChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

interface VoiceChannelContentProps {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  isError: boolean;
  error: string | null;
  localParticipant: VoiceParticipant | undefined;
  remoteParticipantIds: string[];
  remoteParticipants: VoiceParticipant[];
  participants: Record<string, VoiceParticipant>;
  participantsArray: VoiceParticipant[];
  orbitalPositions: { x: number; y: number }[];
  handleRetry: () => void;
  handleLeave: () => void;
  onSettingsOpen: () => void;
}

function VoiceChannelContent({
  isConnected,
  isConnecting,
  isReconnecting,
  isError,
  error,
  localParticipant,
  remoteParticipantIds,
  remoteParticipants,
  participants,
  orbitalPositions,
  handleRetry,
  handleLeave,
  onSettingsOpen,
}: VoiceChannelContentProps) {
  return (
    <>
      {/* Orbital Layout Area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-[oklch(0.12_0.03_260)] via-[oklch(0.10_0.02_280)] to-[oklch(0.08_0.01_300)]" />

        {isConnecting && (
          <motion.div
            className="relative z-10 flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-12 h-12 border-4 border-[oklch(0.55_0.2_265)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">
              Connecting to voice channel...
            </p>
          </motion.div>
        )}

        {isReconnecting && (
          <motion.div
            className="relative z-10 flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <RefreshCw className="w-10 h-10 text-[oklch(0.8_0.15_80)] animate-spin" />
            <p className="text-sm text-slate-400">Reconnecting...</p>
          </motion.div>
        )}

        {isError && (
          <motion.div
            className="relative z-10 glass-card px-8 py-6 rounded-xl text-center max-w-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springConfig}
          >
            <p className="text-sm text-red-400 mb-1">
              Failed to connect to voice channel
            </p>
            <p className="text-xs text-slate-400 mb-4">
              {error || "Please try again."}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="primary" size="sm" onClick={handleRetry}>
                Retry
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLeave}>
                Leave
              </Button>
            </div>
          </motion.div>
        )}

        {isConnected && localParticipant && (
          <motion.div
            className="absolute z-10"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={springConfig}
          >
            <OrbitalAvatar participant={localParticipant} isCenter={true} />
          </motion.div>
        )}

        {isConnected && (
          <AnimatePresence>
            {remoteParticipantIds.map((id, index) => {
              const participant = participants[id];
              if (!participant) return null;

              const pos = orbitalPositions[index];
              if (!pos) return null;

              return (
                <motion.div
                  key={id}
                  className="absolute z-5"
                  style={{
                    left: "50%",
                    top: "50%",
                  }}
                  initial={{ scale: 0, opacity: 0, x: -40, y: -50 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    x: pos.x - 40,
                    y: pos.y - 50,
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 25,
                  }}
                >
                  <OrbitalAvatar
                    participant={participant}
                    isCenter={false}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {isConnected && remoteParticipants.length === 0 && (
          <motion.div
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 glass-card px-6 py-4 rounded-xl text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springConfig, delay: 0.3 }}
          >
            <p className="text-sm text-slate-300">No one else is here</p>
            <p className="text-xs text-slate-400 mt-1">
              Invite friends to join the voice channel
            </p>
          </motion.div>
        )}
      </div>

      {/* Controls Bar */}
      {isConnected && (
        <ControlsBar
          onLeave={handleLeave}
          onSettingsOpen={onSettingsOpen}
        />
      )}
    </>
  );
}
