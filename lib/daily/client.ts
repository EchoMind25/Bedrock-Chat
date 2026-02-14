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
  try {
    console.log('🔵 [createDailyCall] Importing Daily.co SDK...');
    const DailyModule = await import("@daily-co/daily-js");
    console.log('✅ [createDailyCall] Daily.co SDK imported:', {
      hasDefault: !!DailyModule.default,
      moduleKeys: Object.keys(DailyModule),
    });

    const Daily = DailyModule.default;

    if (!Daily) {
      throw new Error('Daily.co SDK default export is undefined');
    }

    if (typeof Daily.createCallObject !== 'function') {
      throw new Error('Daily.createCallObject is not a function');
    }

    console.log('🔵 [createDailyCall] Creating call object...');
    const callObject = Daily.createCallObject();
    console.log('✅ [createDailyCall] Call object created:', {
      hasJoin: typeof callObject.join === 'function',
      hasLeave: typeof callObject.leave === 'function',
      hasOn: typeof callObject.on === 'function',
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
