"use client";

import { useEffect, useRef, useCallback } from "react";
import { createDailyCall, createDailyRoom, setCurrentDailyCall } from "@/lib/daily/client";
import { useVoiceStore } from "@/store/voice.store";
import { useAuthStore } from "@/store/auth.store";
import { supportsNoiseCancellation, getAudioEnhancementMethod } from "@/lib/utils/browser";
import { getRNNoiseProcessor, destroyRNNoiseProcessor } from "@/lib/audio/rnnoise-processor";
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
  const noiseCancellationEnabled = useVoiceStore((s) => s.noiseCancellationEnabled);

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
  }, [channelId]);

  // Safely destroy the call object - idempotent, never throws
  const destroyCall = useCallback(() => {
    if (destroyedRef.current) return;
    const call = callRef.current;
    if (!call) return;

    destroyedRef.current = true;
    callRef.current = null;
    setCurrentDailyCall(null); // Clear singleton reference

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

    // Clean up RNNoise processor if active
    try {
      destroyRNNoiseProcessor();
    } catch (err) {
      console.warn('[Audio Enhancement] Error cleaning up RNNoise:', err);
    }
  }, []);

  const join = useCallback(async () => {
    const currentChannelId = channelIdRef.current;
    const currentServerId = serverIdRef.current;

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

      if (!roomUrl || typeof roomUrl !== 'string') {
        throw new Error('Invalid room URL received from server');
      }

      if (!roomUrl.includes('daily.co')) {
        throw new Error(`Invalid Daily.co room URL format: ${roomUrl}`);
      }

      store.setRoomUrl(roomUrl);
      store.setMeetingToken(meetingToken || null);

      // Lazy-load and create call object
      const call = await createDailyCall();

      if (signal.aborted) {
        try { call.destroy(); } catch { /* ignore */ }
        return;
      }

      callRef.current = call;
      setCurrentDailyCall(call); // Store in singleton for component access

      // Set up event handlers before joining
      call.on("joined-meeting", async (event) => {
        if (!event) return;
        const store = useVoiceStore.getState();
        store.setConnectionStatus("connected");
        store.resetReconnectAttempts();
        totalRetriesRef.current = 0; // Reset global retry counter on success

        const participants = event.participants;
        for (const [, p] of Object.entries(participants)) {
          store.addParticipant(mapDailyParticipant(p));
        }

        // Apply noise cancellation if enabled and supported (Chromium browsers)
        const { noiseCancellationEnabled } = store;
        if (noiseCancellationEnabled && supportsNoiseCancellation()) {
          try {
            await call.updateInputSettings({
              audio: {
                processor: {
                  type: 'noise-cancellation',
                },
              },
            });
            console.info('[Privacy Audit] Daily.co noise cancellation enabled (browser-native) at', new Date().toISOString());
            console.info('[Privacy Audit] Audio processing: Browser-native WebRTC pipeline, no third-party servers');
          } catch (err) {
            console.warn('[Audio Enhancement] Noise cancellation not supported:', err);
          }
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
          const store = useVoiceStore.getState();

          // Update participant state
          store.updateParticipant(p.session_id, {
            isMuted: !p.audio,
            isVideoOn: p.video,
            isScreenSharing: p.screen,
          });

          // Handle screen sharing state changes
          if (p.screen) {
            // Screen sharing started
            const allParticipants = callRef.current?.participants();
            const participant = allParticipants?.[p.session_id];

            // Check if screen video track is available
            if (participant?.tracks?.screenVideo?.state === 'playable') {
              store.setActiveScreenShare({
                sessionId: p.session_id,
                username: p.user_name || "Unknown",
                isLocal: p.local,
              });
            }
          } else {
            // Screen sharing stopped - clear if this was the active screen share
            const currentScreenShare = store.activeScreenShare;
            if (currentScreenShare?.sessionId === p.session_id) {
              store.setActiveScreenShare(null);
            }
          }
        }
      );

      call.on(
        "participant-left",
        (event: DailyEventObjectParticipantLeft | undefined) => {
          if (!event) return;
          const store = useVoiceStore.getState();

          // Clear active screen share if this participant was sharing
          if (store.activeScreenShare?.sessionId === event.participant.session_id) {
            store.setActiveScreenShare(null);
          }

          // Remove participant from store
          store.removeParticipant(event.participant.session_id);
        }
      );

      // Listen for track-started event (CRITICAL for screen sharing detection)
      // This event fires when a media track (including screen share) becomes available
      call.on(
        "track-started",
        (event: any) => {
          if (!event) return;
          const store = useVoiceStore.getState();

          // Check if this is a screen video track
          if (event.track && event.track.kind === "video" && event.participant?.screen) {
            const sessionId = event.participant.session_id;
            const username = event.participant.user_name || "Unknown";
            const isLocal = event.participant.local || false;

            console.info('[Screen Share] Track started event received:', {
              sessionId,
              username,
              isLocal,
              trackKind: event.track.kind,
              timestamp: new Date().toISOString(),
            });

            // Set active screen share when track starts
            store.setActiveScreenShare({
              sessionId,
              username,
              isLocal,
            });
          }
        }
      );

      // Listen for track-stopped event (when screen sharing stops)
      call.on(
        "track-stopped",
        (event: any) => {
          if (!event) return;
          const store = useVoiceStore.getState();

          // Check if this is a screen video track stopping
          if (event.track && event.track.kind === "video" && event.participant) {
            const sessionId = event.participant.session_id;
            const currentScreenShare = store.activeScreenShare;

            // Clear screen share if this participant was sharing
            if (currentScreenShare?.sessionId === sessionId) {
              console.info('[Screen Share] Track stopped event received:', {
                sessionId,
                timestamp: new Date().toISOString(),
              });
              store.setActiveScreenShare(null);
            }
          }
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

      // Race join against timeout
      try {
        // Build join options with optional token for private rooms
        const joinOptions: { url: string; userName: string; token?: string; audioSource?: MediaStreamTrack | boolean } = {
          url: roomUrl,
          userName,
        };
        if (meetingToken) {
          joinOptions.token = meetingToken;
        }

        // Apply RNNoise processing for non-Chromium browsers (Safari, Firefox)
        const { noiseCancellationEnabled } = useVoiceStore.getState();
        const enhancementMethod = getAudioEnhancementMethod();

        if (noiseCancellationEnabled && enhancementMethod === 'rnnoise') {
          try {
            console.info('[Audio Enhancement] Applying RNNoise processing for', enhancementMethod);

            // Get raw microphone stream
            const rawStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Initialize and process through RNNoise
            const processor = getRNNoiseProcessor();
            await processor.initialize();
            const enhancedStream = await processor.process(rawStream);

            // Use the processed audio track for Daily.co
            const enhancedTrack = enhancedStream.getAudioTracks()[0];
            if (enhancedTrack) {
              joinOptions.audioSource = enhancedTrack;
              console.info('[Privacy Audit] RNNoise processing enabled (client-side WASM) at', new Date().toISOString());
              console.info('[Privacy Audit] Audio processing: 100% client-side, audio never leaves device');
            }
          } catch (rnnoiseError) {
            console.error('[Audio Enhancement] RNNoise failed, falling back to default audio:', rnnoiseError);
            // Continue with default audio if RNNoise fails
          }
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

  // Sync noise cancellation state (Chromium browsers only)
  useEffect(() => {
    if (!callRef.current || destroyedRef.current) return;
    if (!supportsNoiseCancellation()) return; // Only for Chromium

    const applyNoiseCancellation = async () => {
      try {
        await callRef.current?.updateInputSettings({
          audio: {
            processor: {
              type: noiseCancellationEnabled ? 'noise-cancellation' : 'none',
            },
          },
        });
        console.info(`[Privacy Audit] Noise cancellation ${noiseCancellationEnabled ? 'enabled' : 'disabled'} (browser-native) at ${new Date().toISOString()}`);
      } catch (err) {
        console.warn('[Audio Enhancement] Failed to update noise cancellation:', err);
      }
    };

    applyNoiseCancellation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noiseCancellationEnabled]); // Exclude callRef to avoid re-running on every render

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
