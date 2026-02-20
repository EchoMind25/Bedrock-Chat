import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { channelId, hadVideo, hadScreenShare } = await req.json();
  if (!channelId) {
    return NextResponse.json(
      { error: "channelId required" },
      { status: 400 },
    );
  }

  const roomName = `vc-${channelId}`;

  // Log leave event
  await supabase.from("voice_participant_log").insert({
    channel_id: channelId,
    user_id: user.id,
    event: "leave",
    livekit_room_name: roomName,
    participant_identity: user.id,
    had_video: hadVideo ?? false,
    had_screen_share: hadScreenShare ?? false,
  });

  return NextResponse.json({ success: true });
}
