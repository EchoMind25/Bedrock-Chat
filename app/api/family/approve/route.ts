/**
 * POST /api/family/approve
 *
 * Approve or deny a server or friend approval request.
 * Creates a notification for the teen when resolved.
 * Logs the decision to the transparency log.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type ApprovalType = "server" | "friend";
type ApprovalAction = "approve" | "deny";

interface ApproveBody {
  approval_id: string;
  approval_type: ApprovalType;
  action: ApprovalAction;
}

function parseBody(raw: unknown): ApproveBody | null {
  if (typeof raw !== "object" || raw === null) return null;
  const b = raw as Record<string, unknown>;
  if (typeof b.approval_id !== "string") return null;
  if (b.approval_type !== "server" && b.approval_type !== "friend") return null;
  if (b.action !== "approve" && b.action !== "deny") return null;
  return {
    approval_id: b.approval_id,
    approval_type: b.approval_type as ApprovalType,
    action: b.action as ApprovalAction,
  };
}

export async function POST(request: NextRequest) {
  // ── 1. Auth check ─────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Verify parent ──────────────────────────────────────────────────────
  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single();

  if (!callerProfile || callerProfile.account_type !== "parent") {
    return NextResponse.json({ error: "Only parent accounts can approve requests" }, { status: 403 });
  }

  // ── 3. Parse body ─────────────────────────────────────────────────────────
  const rawBody = await request.json().catch(() => null);
  const body = rawBody ? parseBody(rawBody) : null;

  if (!body) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // ── 4. Config guards ──────────────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey);

  // ── 5. Find parent's family ───────────────────────────────────────────────
  const { data: parentMembership } = await adminClient
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .eq("role", "parent")
    .maybeSingle();

  if (!parentMembership?.family_id) {
    return NextResponse.json({ error: "No family found" }, { status: 404 });
  }

  const tableName =
    body.approval_type === "server" ? "family_server_approvals" : "family_friend_approvals";
  const newStatus = body.action === "approve" ? "approved" : "denied";

  // ── 6. Fetch approval row and verify ownership ────────────────────────────
  const { data: approvalRow } = await adminClient
    .from(tableName)
    .select("*")
    .eq("id", body.approval_id)
    .eq("family_id", parentMembership.family_id)
    .maybeSingle();

  if (!approvalRow) {
    return NextResponse.json({ error: "Approval not found or access denied" }, { status: 404 });
  }

  if (approvalRow.status !== "pending") {
    return NextResponse.json({ error: "This request has already been resolved" }, { status: 409 });
  }

  // ── 7. Update the approval row ────────────────────────────────────────────
  await adminClient
    .from(tableName)
    .update({
      status: newStatus,
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq("id", body.approval_id);

  // ── 8. Notify the teen ────────────────────────────────────────────────────
  const teenUserId: string = approvalRow.teen_user_id;
  const notificationType =
    body.approval_type === "server"
      ? "server_approval_resolved"
      : "friend_approval_resolved";

  const notificationBody =
    body.approval_type === "server"
      ? body.action === "approve"
        ? `Your request to join "${approvalRow.server_name}" was approved`
        : `Your request to join "${approvalRow.server_name}" was denied`
      : body.action === "approve"
        ? `Your friend request for ${approvalRow.friend_username} was approved`
        : `Your friend request for ${approvalRow.friend_username} was denied`;

  await adminClient.from("notifications").insert({
    user_id: teenUserId,
    type: notificationType,
    title: body.action === "approve" ? "Request Approved" : "Request Denied",
    body: notificationBody,
    data: {
      approval_id: body.approval_id,
      approval_type: body.approval_type,
      action: body.action,
    },
  }).catch(() => {});

  // ── 9. Log to transparency log ────────────────────────────────────────────
  const activityType =
    body.approval_type === "server"
      ? body.action === "approve" ? "approved_server" : "denied_server"
      : body.action === "approve" ? "approved_friend" : "denied_friend";

  const logDetails =
    body.approval_type === "server"
      ? { server_id: approvalRow.server_id, server_name: approvalRow.server_name }
      : { friend_user_id: approvalRow.friend_user_id, friend_username: approvalRow.friend_username };

  await adminClient.from("family_activity_log").insert({
    family_id: parentMembership.family_id,
    user_id: user.id,
    activity_type: activityType,
    details: logDetails,
    visible_to_child: true,
  }).catch(() => {});

  return NextResponse.json({ success: true, status: newStatus });
}
