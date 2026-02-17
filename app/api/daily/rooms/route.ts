import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { checkRateLimit } from '@/lib/utils/rate-limiter';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { allowed, retryAfterMs } = checkRateLimit(`daily-rooms:${ip}`, 10, 60_000);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const { channelId, serverId } = await request.json();

  if (!process.env.DAILY_API_KEY) {
    return NextResponse.json(
      { error: 'Daily.co API key not configured' },
      { status: 500 }
    );
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: 'Supabase configuration missing' },
      { status: 500 }
    );
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // No need to set cookies in this route
      },
    },
  });

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized - please log in' },
      { status: 401 }
    );
  }

  // Validate required inputs
  if (!channelId || !serverId) {
    return NextResponse.json(
      { error: 'channelId and serverId are required' },
      { status: 400 }
    );
  }

  // Verify user is a member of this server
  const { data: membership } = await supabase
    .from('server_members')
    .select('id')
    .eq('server_id', serverId)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return NextResponse.json(
      { error: 'You are not a member of this server' },
      { status: 403 }
    );
  }

  // Determine privacy based on environment or server settings
  // For development: use 'public' for easy testing
  // For production: use 'private' with tokens
  const isDevelopment = process.env.NODE_ENV === 'development';
  const privacy = isDevelopment ? 'public' : 'private';

  const requestBody = {
    name: `channel-${channelId}-${Date.now()}`,
    privacy,
    properties: {
      enable_screenshare: true,
      enable_chat: false,
      // enable_recording intentionally omitted — Daily.co default is no recording.
      // Privacy requirement: no audio/video recording under any circumstances.
      // max_participants removed - let Daily.co use plan default
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

  // Generate meeting token for private rooms
  let meetingToken: string | undefined;

  if (privacy === 'private') {
    const tokenResponse = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: data.name,
          user_name: user.user_metadata?.display_name || user.email || 'User',
          is_owner: false,
          enable_screenshare: true,
          // Token expires in 1 hour
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
      }),
    });

    if (!tokenResponse.ok) {
      console.error('❌ Failed to create meeting token:', await tokenResponse.text());
      return NextResponse.json(
        { error: 'Failed to create meeting token' },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();
    meetingToken = tokenData.token;
  }

  return NextResponse.json({
    url: data.url,
    token: meetingToken,
  });
}
