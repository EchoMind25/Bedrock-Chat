"use client";

import { useState, useCallback, useRef } from "react";
import { Room } from "livekit-client";
import { useVoiceStore } from "@/store/voice.store";
import { voiceRoomOptions } from "@/lib/voice/livekit-options";
import { setPrewarmedRoom } from "@/lib/voice/room-ref";

export function useLiveKitCall() {
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);

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
        // Create Room with optimized options before fetching token
        const room = new Room(voiceRoomOptions);
        roomRef.current = room;

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

        // Pre-warm ICE connection (DNS resolve + TLS handshake + ICE gathering)
        // This moves negotiation out of the critical connect-to-audio path
        await room.prepareConnection(wsUrl, token);

        // Store pre-warmed Room in module-level ref for voice-channel.tsx to consume
        setPrewarmedRoom(room);

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
        // Clean up pre-warmed room on error
        if (roomRef.current) {
          roomRef.current.disconnect().catch(() => {});
          roomRef.current = null;
          setPrewarmedRoom(null);
        }
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

      // Clear room ref
      roomRef.current = null;
      setPrewarmedRoom(null);

      // Full state reset
      useVoiceStore.getState().reset();

      // Remove any body style artifacts left by voice settings or call modals
      document.body.style.overflow = "";
      document.body.style.pointerEvents = "";
    },
    [],
  );

  return { joinVoiceChannel, leaveVoiceChannel, isJoining, error };
}
