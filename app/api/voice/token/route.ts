import { AccessToken, TrackSource } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(
    `voice-token:${ip}`,
    10,
    60_000,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
      },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { channelId } = await req.json();
  if (!channelId) {
    return NextResponse.json(
      { error: "channelId required" },
      { status: 400 },
    );
  }

  // Verify channel exists and is type 'voice'
  const { data: channel, error: channelError } = await supabase
    .from("channels")
    .select("id, type, server_id, name")
    .eq("id", channelId)
    .eq("type", "voice")
    .single();

  if (channelError || !channel) {
    return NextResponse.json(
      { error: "Voice channel not found" },
      { status: 404 },
    );
  }

  // Verify user is member of this server
  const { data: membership } = await supabase
    .from("server_members")
    .select("user_id")
    .eq("server_id", channel.server_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json(
      { error: "Not a member of this server" },
      { status: 403 },
    );
  }

  // Get display name
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", user.id)
    .single();

  // Check family monitoring level — default to full permissions if no family account
  const { data: familySettings } = await supabase
    .from("family_account_settings")
    .select("monitoring_level, allow_video, allow_screen_share")
    .eq("user_id", user.id)
    .maybeSingle();

  const isRestricted = familySettings?.monitoring_level === "restricted";
  const allowVideo = !isRestricted && (familySettings?.allow_video ?? true);
  const allowScreenShare =
    !isRestricted && (familySettings?.allow_screen_share ?? true);

  // CRITICAL: Room name is deterministic — vc-{channelId} ONLY
  const roomName = `vc-${channelId}`;

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    {
      identity: user.id,
      name: profile?.display_name || profile?.username || "Unknown",
      ttl: "4h",
    },
  );

  const allowedSources: TrackSource[] = [TrackSource.MICROPHONE];
  if (allowVideo) allowedSources.push(TrackSource.CAMERA);
  if (allowScreenShare) {
    allowedSources.push(TrackSource.SCREEN_SHARE);
    allowedSources.push(TrackSource.SCREEN_SHARE_AUDIO);
  }

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    canPublishSources: allowedSources,
    // NEVER grant: roomRecord, roomAdmin, ingressAdmin
  });

  const capabilities = {
    audio: true,
    video: allowVideo,
    screen_share: allowScreenShare,
  };

  // Log session start — metadata only
  await supabase.from("voice_participant_log").insert({
    channel_id: channelId,
    user_id: user.id,
    event: "join",
    livekit_room_name: roomName,
    participant_identity: user.id,
    had_video: false,
    had_screen_share: false,
  });

  return NextResponse.json({
    token: await at.toJwt(),
    wsUrl: process.env.LIVEKIT_URL!,
    roomName,
    capabilities,
  });
}
