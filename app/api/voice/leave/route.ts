import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
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

    // Log leave event (best-effort, don't fail the response)
    const { error } = await supabase.from("voice_participant_log").insert({
      channel_id: channelId,
      user_id: user.id,
      event: "leave",
      livekit_room_name: roomName,
      participant_identity: user.id,
      had_video: hadVideo ?? false,
      had_screen_share: hadScreenShare ?? false,
    });

    if (error) {
      console.error("[voice/leave] Failed to log leave event:", error.code);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[voice/leave] Unhandled error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
