/**
 * Shared LiveKit RoomOptions tuned for low-latency voice.
 *
 * Privacy Audit: No external network requests. All settings are local
 * WebRTC configuration parameters applied during room construction.
 */

import type { RoomOptions, RoomConnectOptions, AudioCaptureOptions } from "livekit-client";
import { AudioPresets } from "livekit-client";

export const voiceRoomOptions: RoomOptions = {
  // Disable adaptive stream — voice-only rooms have no video tracks to manage
  adaptiveStream: false,
  // Disable dynacast — no video simulcast layers to dynamically pause
  dynacast: false,

  audioCaptureDefaults: {
    // Keep echo cancellation — essential for multi-device voice calls
    echoCancellation: true,
    // Disable browser noise suppression (adds 40-80ms latency);
    // RNNoise WASM processor handles this separately with lower latency
    noiseSuppression: false,
    // Disable auto gain control — removes AGC processing pipeline (~5-10ms)
    autoGainControl: false,
    // Native Opus sample rate — avoids resampling overhead
    sampleRate: 48000,
    // Mono capture for voice — halves buffer processing vs stereo
    channelCount: 1,
  },

  publishDefaults: {
    // 24kbps voice-optimized bitrate (SDK default is AudioPresets.music at 32kbps)
    audioPreset: AudioPresets.speech,
    // Discontinuous transmission — silence produces no packets, reduces jitter buffer pressure
    dtx: true,
    // Redundant audio encoding — protects against packet loss without retransmission latency
    red: true,
  },

  // NOTE: Opus frame size (10ms vs default 20ms) is not configurable in
  // livekit-client 2.17.2. Setting frame size to 10ms would halve codec-level
  // latency at the cost of ~20% more packets. Future optimization pending SDK update.
};

export const voiceConnectOptions: RoomConnectOptions = {
  rtcConfig: {
    // Try direct UDP (STUN) first, fall back to TURN — finds fastest path
    iceTransportPolicy: "all",
    // Pre-allocate ICE candidates during room construction, before connect() is called
    iceCandidatePoolSize: 10,
  },
};

/**
 * Returns audioCaptureDefaults merged with a preferred input device.
 * Used when the user has selected a specific microphone in settings.
 */
export function getAudioCaptureWithDevice(
  deviceId: string,
): AudioCaptureOptions {
  return {
    ...voiceRoomOptions.audioCaptureDefaults,
    deviceId,
  };
}
