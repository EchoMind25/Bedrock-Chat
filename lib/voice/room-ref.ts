/**
 * Module-level reference to the active LiveKit Room instance.
 *
 * Used by components outside the LiveKitRoom React context tree
 * (e.g., VoiceSettings modal rendered as a portal) to call
 * room.switchActiveDevice() for mid-call device switching.
 *
 * Privacy Audit: This module only stores an object reference.
 * No audio/video data is captured, recorded, or transmitted through it.
 */

import type { Room } from "livekit-client";

let _roomRef: Room | null = null;

export function setLiveKitRoomRef(room: Room | null): void {
  _roomRef = room;
}

export function getLiveKitRoomRef(): Room | null {
  return _roomRef;
}
