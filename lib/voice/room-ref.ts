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

// Pre-warmed Room for ICE pre-warming via prepareConnection().
// Set before LiveKitRoom mounts, consumed once during first render.
let _prewarmedRoom: Room | null = null;

export function setPrewarmedRoom(room: Room | null): void {
  _prewarmedRoom = room;
}

export function consumePrewarmedRoom(): Room | null {
  const room = _prewarmedRoom;
  _prewarmedRoom = null;
  return room;
}
