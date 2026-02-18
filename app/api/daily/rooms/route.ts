import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { checkRateLimit } from '@/lib/utils/rate-limiter';

const DAILY_API_BASE = 'https://api.daily.co/v1';
const ROOM_EXPIRY_SECONDS = 24 * 60 * 60; // 24 hours

/**
 * Derive a deterministic Daily.co room name from server + channel IDs.
 * Daily.co room names: lowercase alphanumeric + hyphens, max 200 chars.
 */
function deriveRoomName(serverId: string, channelId: string): string {
  // Sanitize IDs: lowercase, replace non-alphanumeric (except hyphens) with hyphens
  const safeServer = serverId.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const safeChannel = channelId.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return `bedrock-${safeServer}-${safeChannel}`.slice(0, 200);
}

/**
 * Check if a Daily.co room already exists by name.
 * Returns the room data if it exists and hasn't expired, null otherwise.
 */
async function getExistingRoom(
  roomName: string,
  apiKey: string
): Promise<{ url: string; name: string } | null> {
  const response = await fetch(`${DAILY_API_BASE}/rooms/${roomName}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    // Unexpected error — treat as no room (will attempt creation)
    console.warn('[Daily.co] Unexpected status checking room:', response.status);
    return null;
  }

  return response.json();
}

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

  const apiKey = process.env.DAILY_API_KEY;
  const roomName = deriveRoomName(serverId, channelId);

  // ── Get-or-create: check if room already exists ──────────────
  const existingRoom = await getExistingRoom(roomName, apiKey);

  let roomData: { url: string; name: string };

  if (existingRoom) {
    // Room exists — all users join the SAME room
    roomData = existingRoom;
  } else {
    // Room doesn't exist — create it once, all subsequent users will find it via getExistingRoom
    const isDevelopment = process.env.NODE_ENV === 'development';
    const privacy = isDevelopment ? 'public' : 'private';

    const createBody = {
      name: roomName,
      privacy,
      properties: {
        enable_screenshare: true,
        enable_chat: false,
        enable_knocking: false,
        enable_recording: false,
        enable_transcription: false,
        max_participants: 50,
        // Auto-cleanup: room expires after 24 hours of inactivity
        exp: Math.floor(Date.now() / 1000) + ROOM_EXPIRY_SECONDS,
      },
    };

    const createResponse = await fetch(`${DAILY_API_BASE}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(createBody),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));

      // Handle race condition: another request created the room between our GET and POST
      if (createResponse.status === 400 && errorData?.info?.includes('already exists')) {
        const raceRoom = await getExistingRoom(roomName, apiKey);
        if (raceRoom) {
          roomData = raceRoom;
        } else {
          return NextResponse.json(
            { error: 'Voice room in transient state, please retry' },
            { status: 503 }
          );
        }
      } else {
        console.error('[Daily.co] Room creation failed:', {
          status: createResponse.status,
          error: errorData,
          roomName,
        });

        return NextResponse.json(
          {
            error: errorData.error || errorData.info || 'Failed to create Daily.co room',
            details: errorData,
            status: createResponse.status,
          },
          { status: createResponse.status }
        );
      }
    } else {
      roomData = await createResponse.json();
    }
  }

  // ── Generate meeting token for private rooms ─────────────────
  let meetingToken: string | undefined;

  const isDevelopment = process.env.NODE_ENV === 'development';
  if (!isDevelopment) {
    const tokenResponse = await fetch(`${DAILY_API_BASE}/meeting-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: roomData.name,
          user_name: user.user_metadata?.display_name || user.email || 'User',
          is_owner: false,
          enable_screenshare: true,
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        },
      }),
    });

    if (!tokenResponse.ok) {
      console.error('[Daily.co] Meeting token creation failed:', await tokenResponse.text());
      return NextResponse.json(
        { error: 'Failed to create meeting token' },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();
    meetingToken = tokenData.token;
  }

  return NextResponse.json({
    url: roomData.url,
    token: meetingToken,
  });
}
