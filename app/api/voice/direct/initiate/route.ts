import { AccessToken, TrackSource } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { calleeId, callType = "voice" } = await req.json();
  if (!calleeId) {
    return NextResponse.json(
      { error: "calleeId required" },
      { status: 400 },
    );
  }

  // Verify friendship
  const { data: friendship } = await supabase
    .from("friendships")
    .select("id")
    .or(
      `and(user_id.eq.${user.id},friend_id.eq.${calleeId}),and(user_id.eq.${calleeId},friend_id.eq.${user.id})`,
    )
    .eq("status", "accepted")
    .maybeSingle();

  if (!friendship) {
    return NextResponse.json({ error: "Not friends" }, { status: 403 });
  }

  // Check callee family settings — restrict video if needed
  const { data: calleeSettings } = await supabase
    .from("family_account_settings")
    .select("monitoring_level, allow_video")
    .eq("user_id", calleeId)
    .maybeSingle();

  const effectiveCallType =
    calleeSettings?.monitoring_level === "restricted" ||
    calleeSettings?.allow_video === false
      ? "voice"
      : callType;

  // CRITICAL: Deterministic room name — sort IDs so both sides generate the same name
  const sorted = [user.id, calleeId].sort();
  const roomName = `dm-${sorted[0]}-${sorted[1]}`;

  // Check for existing active/ringing call
  const { data: existingCall } = await supabase
    .from("direct_calls")
    .select("id, status")
    .eq("livekit_room_name", roomName)
    .in("status", ["ringing", "active"])
    .maybeSingle();

  if (existingCall) {
    return NextResponse.json(
      { error: "Call already in progress" },
      { status: 409 },
    );
  }

  // Create call record
  const { data: call, error: callError } = await supabase
    .from("direct_calls")
    .insert({
      caller_id: user.id,
      callee_id: calleeId,
      status: "ringing",
      livekit_room_name: roomName,
      call_type: effectiveCallType,
    })
    .select("id")
    .single();

  if (callError || !call) {
    return NextResponse.json(
      { error: "Failed to create call" },
      { status: 500 },
    );
  }

  // Generate token for CALLER
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", user.id)
    .single();

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    {
      identity: user.id,
      name: profile?.display_name || profile?.username || "Unknown",
      ttl: "1h",
    },
  );

  const sources: TrackSource[] = [TrackSource.MICROPHONE];
  if (effectiveCallType === "video") sources.push(TrackSource.CAMERA);

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    canPublishSources: sources,
  });

  return NextResponse.json({
    token: await at.toJwt(),
    wsUrl: process.env.LIVEKIT_URL!,
    roomName,
    callId: call.id,
    callType: effectiveCallType,
  });
}
