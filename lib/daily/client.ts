import type { DailyCall } from "@daily-co/daily-js";

export interface DailyRoomResponse {
  url: string;
  token?: string;
}

// Module-level singleton to store the current Daily.co call instance
// This allows components to access the call object without prop drilling
let currentCallInstance: DailyCall | null = null;

export function setCurrentDailyCall(call: DailyCall | null) {
  currentCallInstance = call;
}

export function getCurrentDailyCall(): DailyCall | null {
  return currentCallInstance;
}

export async function createDailyRoom(
  channelId: string,
  serverId: string
): Promise<DailyRoomResponse> {
  const response = await fetch("/api/daily/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channelId, serverId }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    console.error('❌ Daily.co room creation failed:', {
      status: response.status,
      statusText: response.statusText,
      error: data.error,
      details: data.details,
      fullResponse: data
    });
    throw new Error(data.error || "Failed to create voice room");
  }

  const { url, token } = await response.json();
  return { url, token };
}

export async function createDailyCall(): Promise<DailyCall> {
  try {
    const DailyModule = await import("@daily-co/daily-js");

    const Daily = DailyModule.default;

    if (!Daily) {
      throw new Error('Daily.co SDK default export is undefined');
    }

    if (typeof Daily.createCallObject !== 'function') {
      throw new Error('Daily.createCallObject is not a function');
    }

    const callObject = Daily.createCallObject({
      startVideoOff: true, // Camera blocked by Permissions-Policy: camera=()
    });
    return callObject;
  } catch (error) {
    console.error('❌ [createDailyCall] Failed to create Daily.co call object:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}
