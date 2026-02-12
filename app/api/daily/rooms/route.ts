import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { channelId } = await request.json();

  if (!process.env.DAILY_API_KEY) {
    return NextResponse.json(
      { error: 'Daily.co API key not configured' },
      { status: 500 }
    );
  }

  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: `channel-${channelId}`,
      privacy: 'private',
      properties: {
        enable_screenshare: true,
        enable_chat: false,
        max_participants: 50,
      },
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Failed to create Daily.co room' },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json({ url: data.url });
}
