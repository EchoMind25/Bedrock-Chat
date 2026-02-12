import Daily, { type DailyCall } from '@daily-co/daily-js';

export async function createDailyRoom(channelId: string): Promise<string> {
  const response = await fetch('/api/daily/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channelId }),
  });

  const { url } = await response.json();
  return url;
}

export function createDailyCall(): DailyCall {
  return Daily.createCallObject();
}
