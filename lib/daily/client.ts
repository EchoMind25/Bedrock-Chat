import type { DailyCall } from "@daily-co/daily-js";

export async function createDailyRoom(channelId: string): Promise<string> {
  const response = await fetch("/api/daily/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channelId }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to create voice room");
  }

  const { url } = await response.json();
  return url;
}

export async function createDailyCall(): Promise<DailyCall> {
  const Daily = (await import("@daily-co/daily-js")).default;
  return Daily.createCallObject();
}
