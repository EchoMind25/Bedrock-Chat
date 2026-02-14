"use client";

import { useEffect, useRef, useCallback } from "react";
import { createDailyCall, createDailyRoom } from "@/lib/daily/client";
import { useVoiceStore } from "@/store/voice.store";
import { useAuthStore } from "@/store/auth.store";
import type {
  DailyCall,
  DailyParticipant,
  DailyEventObjectParticipant,
  DailyEventObjectParticipantLeft,
  DailyEventObjectActiveSpeakerChange,
  DailyEventObjectFatalError,
} from "@daily-co/daily-js";
import type { VoiceParticipant } from "@/store/voice.store";

const MAX_RECONNECT_ATTEMPTS = 2;
const BASE_BACKOFF_MS = 1000;
const JOIN_TIMEOUT_MS = 10000;
const MAX_TOTAL_RETRIES = 5; // Global limit across all reconnect cycles

// Module initialization log
console.log('✅ [use-daily-call] Module loaded successfully', {
  timestamp: new Date().toISOString(),
  maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
  maxTotalRetries: MAX_TOTAL_RETRIES,
  joinTimeout: JOIN_TIMEOUT_MS,
});

function mapDailyParticipant(p: DailyParticipant): VoiceParticipant {
  return {
    sessionId: p.session_id,
    userId: p.user_id || p.session_id,
    username: p.user_name || "Unknown",
    avatar: "",
    isMuted: !p.audio,
    isDeafened: false,
    isSpeaking: false,
    isVideoOn: p.video,
    isScreenSharing: p.screen,
    isLocal: p.local,
  };
}

export function useDailyCall(channelId: string | null, serverId: string | null) {
  const callRef = useRef<DailyCall | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const activeSpeakerRef = useRef<string | null>(null);
  const destroyedRef = useRef(false);

  // Refs to prevent callback recreation (React Error #185 fix)
  const channelIdRef = useRef<string | null>(channelId);
  const serverIdRef = useRef<string | null>(serverId);
  const shouldReconnectRef = useRef(true);
  const totalRetriesRef = useRef(0); // Track total retries to prevent infinite loops

  // Store selectors for syncing local controls to call object
  const isMuted = useVoiceStore((s) => s.isMuted);
  const isVideoOn = useVoiceStore((s) => s.isVideoOn);
  const isScreenSharing = useVoiceStore((s) => s.isScreenSharing);

  // Auth info for participant mapping
  const user = useAuthStore ((s) => s.user);

  // Sync channelId and serverId to refs without recreating callbacks
  useEffect(() => {
    channelIdRef.current = channelId;
    serverIdRef.current = serverId;
  }, [channelId, serverId]);

  // Reset reconnect guard and retry counter when channel changes
  useEffect(() => {
    shouldReconnectRef.current = true;
    totalRetriesRef.current = 0;
    console.log('🔄 [use-daily-call] Channel changed, reset retry counter');
  }, [channelId]);

  // Safely destroy the call object - idempotent, never throws
  const destroyCall = useCallback(() => {
    if (destroyedRef.current) return;
    const call = callRef.current;
    if (!call) return;

    destroyedRef.current = true;
    callRef.current = null;

    try {
      call.leave();
    } catch {
      // Already left or destroyed - ignore
    }
    try {
      call.destroy();
    } catch {
      // Already destroyed - ignore
    }
  }, []);

  const join = useCallback(async () => {
    const currentChannelId = channelIdRef.current;
    const currentServerId = serverIdRef.current;
    console.log('🟢 [use-daily-call] Starting join process for channel:', currentChannelId, {
      serverId: currentServerId,
      totalRetries: totalRetriesRef.current,
      maxRetries: MAX_TOTAL_RETRIES,
    });

    if (!currentChannelId) {
      console.warn("[use-daily-call] Cannot join - no channel ID");
      return;
    }

    if (!currentServerId) {
      console.warn("[use-daily-call] Cannot join - no server ID");
      return;
    }

    // Global retry limit to prevent infinite loops
    if (totalRetriesRef.current >= MAX_TOTAL_RETRIES) {
      console.error('❌ [use-daily-call] Maximum total retries exceeded:', {
        totalRetries: totalRetriesRef.current,
        maxRetries: MAX_TOTAL_RETRIES,
        channelId: currentChannelId,
      });
      failWithError(`Connection failed after ${MAX_TOTAL_RETRIES} attempts. Please try again later.`);
      return;
    }

    totalRetriesRef.current++;

    // Abort any previous join/reconnect
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    // Tear down any existing call (voice-to-voice channel transition safety net)
    destroyCall();

    const store = useVoiceStore.getState();
    store.clearParticipants();
    store.setConnectionStatus("connecting");
    store.setError(null);
    destroyedRef.current = false;
    console.log('🟢 [use-daily-call] Store reset, status set to connecting');

    try {
      // Race room creation against timeout and abort
      const roomResponse = await Promise.race([
        createDailyRoom(currentChannelId, currentServerId),
        new Promise<never>((_, reject) => {
          const timer = setTimeout(
            () => reject(new Error("Connection timed out")),
            JOIN_TIMEOUT_MS
          );
          signal.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new Error("Cancelled"));
          });
        }),
      ]);

      if (signal.aborted) return;

      const { url: roomUrl, token: meetingToken } = roomResponse;

      console.log('✅ Room response received:', {
        url: roomUrl,
        hasToken: !!meetingToken,
        isString: typeof roomUrl === 'string',
        length: roomUrl?.length,
        startsWithHttp: roomUrl?.startsWith('http'),
      });

      if (!roomUrl || typeof roomUrl !== 'string') {
        throw new Error('Invalid room URL received from server');
      }

      if (!roomUrl.includes('daily.co')) {
        throw new Error(`Invalid Daily.co room URL format: ${roomUrl}`);
      }

      store.setRoomUrl(roomUrl);
      store.setMeetingToken(meetingToken || null);

      // Lazy-load and create call object
      console.log('🔵 Creating Daily.co call object...');
      const call = await createDailyCall();
      console.log('✅ Daily.co call object created:', {
        callObjectType: typeof call,
        hasMethods: {
          join: typeof call.join === 'function',
          leave: typeof call.leave === 'function',
          on: typeof call.on === 'function',
          destroy: typeof call.destroy === 'function',
        }
      });

      if (signal.aborted) {
        try { call.destroy(); } catch { /* ignore */ }
        return;
      }

      callRef.current = call;
      console.log('🔵 Setting up event handlers...');

      // Set up event handlers before joining
      call.on("joined-meeting", (event) => {
        console.log('🎉 Joined Daily.co meeting!', event);

        if (!event) return;
        const store = useVoiceStore.getState();
        store.setConnectionStatus("connected");
        store.resetReconnectAttempts();
        totalRetriesRef.current = 0; // Reset global retry counter on success

        const participants = event.participants;
        for (const [, p] of Object.entries(participants)) {
          store.addParticipant(mapDailyParticipant(p));
        }
      });

      call.on(
        "participant-joined",
        (event: DailyEventObjectParticipant | undefined) => {
          if (!event) return;
          useVoiceStore
            .getState()
            .addParticipant(mapDailyParticipant(event.participant));
        }
      );

      call.on(
        "participant-updated",
        (event: DailyEventObjectParticipant | undefined) => {
          if (!event) return;
          const p = event.participant;
          useVoiceStore.getState().updateParticipant(p.session_id, {
            isMuted: !p.audio,
            isVideoOn: p.video,
            isScreenSharing: p.screen,
          });
        }
      );

      call.on(
        "participant-left",
        (event: DailyEventObjectParticipantLeft | undefined) => {
          if (!event) return;
          useVoiceStore
            .getState()
            .removeParticipant(event.participant.session_id);
        }
      );

      call.on(
        "active-speaker-change",
        (event: DailyEventObjectActiveSpeakerChange | undefined) => {
          if (!event) return;
          const newSpeakerId = event.activeSpeaker.peerId;
          const store = useVoiceStore.getState();

          if (
            activeSpeakerRef.current &&
            activeSpeakerRef.current !== newSpeakerId
          ) {
            store.updateParticipant(activeSpeakerRef.current, {
              isSpeaking: false,
            });
          }

          store.updateParticipant(newSpeakerId, { isSpeaking: true });
          activeSpeakerRef.current = newSpeakerId;
        }
      );

      call.on("error", (event: DailyEventObjectFatalError | undefined) => {
        if (!event) return;
        console.error('❌ Daily.co error event:', event);
        attemptReconnect(event.errorMsg);
      });

      // Don't reset on left-meeting - let leave() own the full cleanup
      call.on("left-meeting", () => {
        // Only reset if this wasn't triggered by our own leave()
        if (!destroyedRef.current) {
          useVoiceStore.getState().reset();
        }
      });

      const userName = user?.displayName || user?.username || "User";
      console.log('🔵 Attempting to join Daily.co room...', {
        url: roomUrl,
        userName,
        hasToken: !!meetingToken,
        timeout: JOIN_TIMEOUT_MS,
        callState: call.meetingState?.(),
      });

      // Race join against timeout
      try {
        // Build join options with optional token for private rooms
        const joinOptions: { url: string; userName: string; token?: string } = {
          url: roomUrl,
          userName,
        };
        if (meetingToken) {
          joinOptions.token = meetingToken;
        }

        const joinResult = await Promise.race([
          call.join(joinOptions),
          new Promise<never>((_, reject) => {
            const timer = setTimeout(
              () => reject(new Error("Connection timed out")),
              JOIN_TIMEOUT_MS
            );
            signal.addEventListener("abort", () => {
              clearTimeout(timer);
              reject(new Error("Cancelled"));
            });
          }),
        ]);

        console.log('✅ Successfully joined Daily.co room!', {
          joinResult,
          callState: call.meetingState?.(),
          participants: call.participants?.(),
        });
      } catch (joinError) {
        console.error('❌ Daily.co join() call failed:', {
          error: joinError,
          errorMessage: joinError instanceof Error ? joinError.message : 'Unknown',
          errorStack: joinError instanceof Error ? joinError.stack : undefined,
          callState: call.meetingState?.(),
          roomUrl,
          userName,
        });
        throw joinError;
      }
    } catch (err) {
      if (signal.aborted) {
        console.log('🟡 [use-daily-call] Join cancelled by user');
        return; // User cancelled - don't show error
      }

      const message =
        err instanceof Error ? err.message : "Failed to join voice channel";
      console.error('❌ [use-daily-call] Join failed:', {
        error: err,
        message,
        channelId: currentChannelId
      });
      failWithError(message);
    }
  // Exclude channelId - read from ref to prevent callback recreation
  // This fixes React Error #185 infinite loop in voice channels
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const failWithError = useCallback((message: string) => {
    destroyCall();
    const store = useVoiceStore.getState();
    store.setConnectionStatus("error");
    store.setError(message || "Connection failed");
  }, [destroyCall]);

  const attemptReconnect = useCallback(
    async (errorMsg: string) => {
      // Guard against reconnect attempts during leave
      if (!shouldReconnectRef.current) return;

      const store = useVoiceStore.getState();
      const attempts = store.reconnectAttempts;

      if (attempts < MAX_RECONNECT_ATTEMPTS && callRef.current && !destroyedRef.current) {
        store.setConnectionStatus("reconnecting");
        store.incrementReconnectAttempts();

        const delay = BASE_BACKOFF_MS * Math.pow(2, attempts);
        const controller = new AbortController();
        abortRef.current = controller;

        try {
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(resolve, delay);
            controller.signal.addEventListener("abort", () => {
              clearTimeout(timeout);
              reject(new Error("Cancelled"));
            });
          });

          if (controller.signal.aborted || !shouldReconnectRef.current) return;

          // Call stable join function to rejoin with current channel
          await join();
        } catch {
          // Aborted by user leave - do nothing
        }
      } else {
        failWithError(errorMsg);
      }
    },
    [join, failWithError] // join is now stable (from Step 1 fix)
  );

  const leave = useCallback(() => {
    // Prevent reconnect attempts during leave
    shouldReconnectRef.current = false;

    // Cancel any in-progress join/reconnect
    abortRef.current?.abort();
    abortRef.current = null;

    // Destroy the call object safely
    destroyCall();

    // Always reset store - this is the authoritative cleanup
    useVoiceStore.getState().reset();
  }, [destroyCall]);

  // Sync local mute state to Daily.co call object
  useEffect(() => {
    if (!callRef.current || destroyedRef.current) return;
    try { callRef.current.setLocalAudio(!isMuted); } catch { /* ignore */ }
  }, [isMuted]);

  // Sync local video state to Daily.co call object
  useEffect(() => {
    if (!callRef.current || destroyedRef.current) return;
    try { callRef.current.setLocalVideo(isVideoOn); } catch { /* ignore */ }
  }, [isVideoOn]);

  // Sync screen sharing state
  useEffect(() => {
    if (!callRef.current || destroyedRef.current) return;
    try {
      if (isScreenSharing) {
        callRef.current.startScreenShare();
      } else {
        callRef.current.stopScreenShare();
      }
    } catch { /* ignore */ }
  }, [isScreenSharing]);

  // Cleanup on unmount - idempotent since leave() guards with destroyedRef
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      destroyCall();
      useVoiceStore.getState().reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { join, leave };
}
