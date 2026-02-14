"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useCallback, useRef } from "react";
import { Users, RefreshCw, PhoneOff } from "lucide-react";
import { OrbitalAvatar } from "./orbital-avatar";
import { ControlsBar } from "./controls-bar";
import { VoiceSettings } from "./voice-settings";
import { ScreenShare } from "./screen-share";
import { PermissionModal } from "./permission-modal";
import { Button } from "../ui/button";
import { useDailyCall } from "@/lib/hooks/use-daily-call";
import { useVoiceStore } from "@/store/voice.store";
import {
  getOrbitalPosition,
  getOrbitRadius,
} from "@/lib/utils/orbital-layout";
import { useState } from "react";

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

  // Voice store - subscribe only to primitives and objects (not derived arrays)
  const connectionStatus = useVoiceStore((s) => s.connectionStatus);
  const permissionStep = useVoiceStore((s) => s.permissionStep);
  const error = useVoiceStore((s) => s.error);
  const participants = useVoiceStore((s) => s.participants);
  const setPermissionStep = useVoiceStore((s) => s.setPermissionStep);
  const setChannelId = useVoiceStore((s) => s.setChannelId);

  // Compute derived values with useMemo (stable references)
  const localParticipant = useMemo(
    () => Object.values(participants).find((p) => p.isLocal),
    [participants]
  );

  const remoteParticipantIds = useMemo(
    () =>
      Object.entries(participants)
        .filter(([_, p]) => !p.isLocal)
        .map(([id]) => id),
    [participants]
  );

  const remoteParticipants = useMemo(
    () => remoteParticipantIds.map((id) => participants[id]!),
    [remoteParticipantIds, participants]
  );

  const participantsArray = useMemo(
    () => Object.values(participants),
    [participants]
  );

  // Daily.co hook
  const { join, leave } = useDailyCall(channelId);

  // Set channel state on mount/change - cleanup handled by unmount effect
  useEffect(() => {
    leavingRef.current = false;
    setChannelId(channelId);
    setPermissionStep("mic");
  // Exclude Zustand actions - stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      leave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Orbital layout calculations - use primitive dependencies only
  const radius = useMemo(
    () => getOrbitRadius(remoteParticipantIds.length),
    [remoteParticipantIds.length]
  );

  const orbitalPositions = useMemo(
    () =>
      Array.from({ length: remoteParticipantIds.length }, (_, i) =>
        getOrbitalPosition(i, remoteParticipantIds.length, radius)
      ),
    [remoteParticipantIds.length, radius]
  );

  const handlePermissionAllow = useCallback(async () => {
    const currentStep = useVoiceStore.getState().permissionStep;

    try {
      if (currentStep === "mic") {
        // Check if already granted
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
          // permissions.query not supported or getUserMedia failed
          // Try getUserMedia directly as fallback
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
          `[Privacy Audit] Microphone permission granted at ${new Date().toISOString()}`
        );

        useVoiceStore.getState().setPermissionStep("none");
        join();
      } else if (currentStep === "camera") {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          stream.getTracks().forEach((t) => t.stop());
          useVoiceStore.getState().setVideoOn(true);
        } catch {
          // Camera denied - just close modal, don't crash
        }

        console.info(
          `[Privacy Audit] Camera permission granted at ${new Date().toISOString()}`
        );
        useVoiceStore.getState().setPermissionStep("none");
      }
    } catch {
      // Catch-all safety net
      useVoiceStore.getState().setPermissionStep("none");
    }
  // Exclude join - stable callback from use-daily-call.ts
  // This fixes React Error #185 infinite loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePermissionDeny = useCallback(() => {
    const currentStep = useVoiceStore.getState().permissionStep;
    useVoiceStore.getState().setPermissionStep("none");

    if (currentStep === "mic") {
      // Can't join without mic - navigate back
      leavingRef.current = true;
      leave();
      onLeave?.();
    }
  // Exclude leave and onLeave - stable callbacks (leave from hook, onLeave is parent's responsibility)
  // This fixes React Error #185 infinite loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Instant, synchronous leave - never blocks navigation
  const handleLeave = useCallback(() => {
    if (leavingRef.current) return; // Prevent double-leave
    leavingRef.current = true;

    // leave() is synchronous and idempotent - cancels all pending work
    leave();

    // Navigate immediately - don't wait for anything
    onLeave?.();
  }, [leave, onLeave]);

  const handleRetry = useCallback(() => {
    useVoiceStore.getState().resetReconnectAttempts();
    useVoiceStore.getState().setError(null);
    join();
  // Exclude join - stable callback from use-daily-call.ts
  // This fixes React Error #185 infinite loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isConnected = connectionStatus === "connected";
  const isConnecting =
    (connectionStatus === "connecting" || connectionStatus === "idle") &&
    permissionStep === "none";
  const isReconnecting = connectionStatus === "reconnecting";
  const isError = connectionStatus === "error";

  return (
    <>
      <div className="flex flex-col h-full bg-[oklch(0.12_0.03_260)]">
        {/* Header - always visible with leave button */}
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
              {/* Connection indicator */}
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

              {/* Always-visible leave button in header */}
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

        {/* Orbital Layout Area */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-linear-to-br from-[oklch(0.12_0.03_260)] via-[oklch(0.10_0.02_280)] to-[oklch(0.08_0.01_300)]" />

          {/* Connecting state */}
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

          {/* Reconnecting state */}
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

          {/* Error state */}
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

          {/* Center avatar (local user) */}
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

          {/* Orbiting remote participants */}
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

          {/* Empty state */}
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

        {/* Controls Bar - always visible when connected */}
        {isConnected && (
          <ControlsBar
            onLeave={handleLeave}
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
