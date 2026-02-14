import type { DailyCall } from "@daily-co/daily-js";

export async function createDailyRoom(channelId: string): Promise<string> {
  console.log('🔵 Creating Daily.co room for channel:', channelId);

  const response = await fetch("/api/daily/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channelId }),
  });

  console.log('🔵 Daily.co API response status:', response.status, response.statusText);

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

  const { url } = await response.json();
  console.log('✅ Daily.co room created successfully:', url);
  return url;
}

export async function createDailyCall(): Promise<DailyCall> {
  const Daily = (await import("@daily-co/daily-js")).default;
  return Daily.createCallObject();
}
