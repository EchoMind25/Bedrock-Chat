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

  const { callId } = await req.json();
  if (!callId) {
    return NextResponse.json({ error: "callId required" }, { status: 400 });
  }

  const { data: call, error } = await supabase
    .from("direct_calls")
    .select("*")
    .eq("id", callId)
    .eq("callee_id", user.id)
    .eq("status", "ringing")
    .single();

  if (error || !call) {
    return NextResponse.json(
      { error: "Call not found or already ended" },
      { status: 404 },
    );
  }

  await supabase
    .from("direct_calls")
    .update({
      status: "active",
      answered_at: new Date().toISOString(),
    })
    .eq("id", callId);

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
  if (call.call_type === "video") sources.push(TrackSource.CAMERA);

  at.addGrant({
    roomJoin: true,
    room: call.livekit_room_name,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    canPublishSources: sources,
  });

  return NextResponse.json({
    token: await at.toJwt(),
    wsUrl: process.env.LIVEKIT_URL!,
    roomName: call.livekit_room_name,
    callType: call.call_type,
  });
}
