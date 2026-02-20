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

  const { data: call } = await supabase
    .from("direct_calls")
    .select("caller_id, callee_id, status")
    .eq("id", callId)
    .single();

  if (!call) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  if (call.caller_id !== user.id && call.callee_id !== user.id) {
    return NextResponse.json(
      { error: "Not a participant" },
      { status: 403 },
    );
  }

  let newStatus: string;
  if (call.status === "ringing") {
    // Caller hanging up = missed, callee declining = declined
    newStatus = call.caller_id === user.id ? "missed" : "declined";
  } else {
    newStatus = "ended";
  }

  await supabase
    .from("direct_calls")
    .update({
      status: newStatus,
      ended_at: new Date().toISOString(),
    })
    .eq("id", callId);

  return NextResponse.json({ success: true, status: newStatus });
}
