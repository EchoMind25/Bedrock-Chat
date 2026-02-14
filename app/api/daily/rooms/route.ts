import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { channelId } = await request.json();

  if (!process.env.DAILY_API_KEY) {
    return NextResponse.json(
      { error: 'Daily.co API key not configured' },
      { status: 500 }
    );
  }

  const requestBody = {
    name: `channel-${channelId}-${Date.now()}`,
    privacy: 'private',
    properties: {
      enable_screenshare: true,
      enable_chat: false,
      max_participants: 50,
    },
  };

  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    console.error('❌ Daily.co API Error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
      requestBody,
      apiKeyPresent: !!process.env.DAILY_API_KEY,
      apiKeyPrefix: process.env.DAILY_API_KEY?.substring(0, 10) + '...',
    });

    return NextResponse.json(
      {
        error: errorData.error || errorData.info || 'Failed to create Daily.co room',
        details: errorData,
        status: response.status,
      },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json({ url: data.url });
}
