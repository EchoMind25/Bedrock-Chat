import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> },
) {
  const { messageId } = await params;

  // Rate limit: 20 deletions per hour per IP
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(
    `msg-delete:${ip}`,
    20,
    60 * 60 * 1000,
  );

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many deletions. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
      },
    );
  }

  try {
    // Authenticate via anon client (respects RLS for auth)
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use service client to fetch message details (bypasses RLS)
    const service = createServiceClient();
    const { data: message, error: msgError } = await service
      .from("messages")
      .select("id, user_id, content, is_deleted, channel_id, channels(server_id)")
      .eq("id", messageId)
      .single();

    if (msgError || !message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (message.is_deleted) {
      return NextResponse.json({ error: "Message already deleted" }, { status: 410 });
    }

    const serverId = (message.channels as unknown as Record<string, unknown>)?.server_id as string;
    if (!serverId) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const isAuthor = user.id === message.user_id;

    // Check permission if not the author
    if (!isAuthor) {
      // Check server membership role
      const { data: membership } = await service
        .from("server_members")
        .select("role")
        .eq("server_id", serverId)
        .eq("user_id", user.id)
        .single();

      const serverRole = membership?.role as string | undefined;
      const isServerPrivileged =
        serverRole === "owner" ||
        serverRole === "admin" ||
        serverRole === "moderator";

      // Check platform role
      const { data: profile } = await service
        .from("profiles")
        .select("platform_role")
        .eq("id", user.id)
        .single();

      const isPlatformSuperAdmin = profile?.platform_role === "super_admin";

      if (!isServerPrivileged && !isPlatformSuperAdmin) {
        return NextResponse.json(
          { error: "You do not have permission to delete this message" },
          { status: 403 },
        );
      }
    }

    // Soft-delete the message
    const { error: deleteError } = await service
      .from("messages")
      .update({ is_deleted: true })
      .eq("id", messageId);

    if (deleteError) {
      console.error("[API] Message delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete message" },
        { status: 500 },
      );
    }

    // Audit log for non-author deletions
    if (!isAuthor) {
      await service.from("audit_log").insert({
        server_id: serverId,
        actor_id: user.id,
        action: "message_delete",
        target_id: messageId,
        target_type: "message",
        changes: { content: message.content },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Message deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
