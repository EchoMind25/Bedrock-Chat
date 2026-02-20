"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useVoiceStore } from "@/store/voice.store";

/**
 * Global hook for incoming direct call notifications.
 * Mount at the app layout level — incoming calls ring regardless of current page.
 */
export function useDirectCallListener(currentUserId: string | null) {
  useEffect(() => {
    if (!currentUserId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`incoming-calls-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_calls",
          filter: `callee_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const call = payload.new as Record<string, unknown>;
          if (call.status !== "ringing") return;

          // Fetch caller profile
          const { data: caller } = await supabase
            .from("profiles")
            .select("display_name, username, avatar_url")
            .eq("id", call.caller_id as string)
            .single();

          const store = useVoiceStore.getState();
          store.setIncomingCall({
            id: call.id as string,
            callerId: call.caller_id as string,
            calleeId: call.callee_id as string,
            callerName:
              caller?.display_name || caller?.username || "Unknown",
            callerAvatar: caller?.avatar_url,
            roomName: call.livekit_room_name as string,
            callType: call.call_type as "voice" | "video",
            status: call.status as string,
          });
          store.setCallState("incoming_ringing");
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);
}
