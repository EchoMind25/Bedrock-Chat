"use client";

import { useState, useCallback } from "react";
import { useVoiceStore } from "@/store/voice.store";

export function useLiveKitCall() {
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinVoiceChannel = useCallback(
    async (
      channelId: string,
      channelName: string,
      serverId: string,
    ) => {
      setIsJoining(true);
      setError(null);
      useVoiceStore.getState().setConnectionStatus("connecting");

      try {
        const res = await fetch("/api/voice/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channelId }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to get voice token");
        }

        const { token, wsUrl, roomName, capabilities } = await res.json();

        useVoiceStore.getState().setVoiceConnection({
          channelId,
          channelName,
          serverId,
          token,
          wsUrl,
          roomName,
          capabilities,
        });
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Connection failed";
        setError(message);
        useVoiceStore.getState().setConnectionStatus("error");
        useVoiceStore.getState().setError(message);
      } finally {
        setIsJoining(false);
      }
    },
    [],
  );

  const leaveVoiceChannel = useCallback(
    async (channelId: string, hadVideo = false, hadScreenShare = false) => {
      // Log leave event — non-blocking
      fetch("/api/voice/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, hadVideo, hadScreenShare }),
      }).catch(() => {});

      useVoiceStore.getState().reset();
    },
    [],
  );

  return { joinVoiceChannel, leaveVoiceChannel, isJoining, error };
}
