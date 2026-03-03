/**
 * Invite Service — Smart Invite System
 *
 * Pure logic layer for invite operations. Receives a Supabase client
 * and returns structured results. The caller (API route or store)
 * handles toasts, navigation, and error display.
 *
 * PRIVACY: This service NEVER imports user data from Discord.
 * It creates invite links that Discord users click voluntarily.
 * Each person creates their own Bedrock account.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { InvitePreview, InviteStats } from "../types/invites";
import { trackMigrationEvent } from "./migration-analytics";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateInviteOptions {
  serverId: string;
  inviterId: string;
  targetType?: "channel" | "server" | "voice";
  channelId?: string | null;
  maxUses?: number;
  expiresAt?: string | null; // ISO string
  isTemporary?: boolean;
  mappedRoleId?: string | null;
  label?: string | null;
  requiresFamilyAccount?: boolean;
}

export interface CreateInviteResult {
  id: string;
  code: string;
  serverId: string;
  channelId: string | null;
  targetType: string;
  mappedRoleId: string | null;
  label: string | null;
  maxUses: number;
  expiresAt: string | null;
  isTemporary: boolean;
  requiresFamilyAccount: boolean;
  createdAt: string;
}

export interface RedeemInviteResult {
  serverId: string;
  serverName: string;
  roleAssigned: boolean;
  roleName: string | null;
  alreadyMember: boolean;
}

export interface BulkInviteMapping {
  roleId: string;
  roleName: string;
  label?: string;
  maxUses?: number;
  expiresAt?: string | null;
}

// ---------------------------------------------------------------------------
// Create a single invite
// ---------------------------------------------------------------------------

export async function createInvite(
  supabase: SupabaseClient,
  options: CreateInviteOptions,
): Promise<CreateInviteResult> {
  const {
    serverId,
    inviterId,
    targetType = "server",
    channelId = null,
    maxUses = 0,
    expiresAt = null,
    isTemporary = false,
    mappedRoleId = null,
    label = null,
    requiresFamilyAccount = false,
  } = options;

  const { data, error } = await supabase
    .from("server_invites")
    .insert({
      server_id: serverId,
      inviter_id: inviterId,
      target_type: targetType,
      channel_id: channelId,
      max_uses: maxUses,
      expires_at: expiresAt,
      is_temporary: isTemporary,
      mapped_role_id: mappedRoleId,
      label: label?.trim() || null,
      requires_family_account: requiresFamilyAccount,
    })
    .select()
    .single();

  if (error) throw error;

  // Aggregate analytics (fire-and-forget)
  trackMigrationEvent("invite_generated");

  return {
    id: data.id,
    code: data.code,
    serverId: data.server_id,
    channelId: data.channel_id,
    targetType: data.target_type,
    mappedRoleId: data.mapped_role_id,
    label: data.label,
    maxUses: data.max_uses,
    expiresAt: data.expires_at,
    isTemporary: data.is_temporary,
    requiresFamilyAccount: data.requires_family_account,
    createdAt: data.created_at,
  };
}

// ---------------------------------------------------------------------------
// Create bulk invites (one per role mapping)
// ---------------------------------------------------------------------------

export async function createBulkInvites(
  supabase: SupabaseClient,
  serverId: string,
  inviterId: string,
  roleMappings: BulkInviteMapping[],
): Promise<CreateInviteResult[]> {
  const results: CreateInviteResult[] = [];

  for (const mapping of roleMappings) {
    const result = await createInvite(supabase, {
      serverId,
      inviterId,
      targetType: "server",
      mappedRoleId: mapping.roleId,
      label: mapping.label || `For ${mapping.roleName}`,
      maxUses: mapping.maxUses ?? 0,
      expiresAt: mapping.expiresAt ?? null,
    });
    results.push(result);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Redeem an invite code (join server + assign role)
// ---------------------------------------------------------------------------

export async function redeemInvite(
  supabase: SupabaseClient,
  code: string,
  userId: string,
): Promise<RedeemInviteResult> {
  // 1. Look up the invite
  const { data: invite, error: inviteError } = await supabase
    .from("server_invites")
    .select("*")
    .eq("code", code.trim())
    .eq("is_active", true)
    .single();

  if (inviteError || !invite) {
    throw new Error("Invalid or expired invite code");
  }

  // 2. Validate expiration
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    throw new Error("This invite has expired");
  }

  // 3. Validate max uses
  if (invite.max_uses > 0 && invite.uses >= invite.max_uses) {
    throw new Error("This invite has reached its maximum uses");
  }

  // 4. Check family account requirement
  if (invite.requires_family_account) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("id", userId)
      .single();

    if (!profile || (profile.account_type !== "parent" && profile.account_type !== "teen")) {
      throw new Error("This invite requires a family account");
    }
  }

  // 5. Get server info for the result
  const { data: server } = await supabase
    .from("servers")
    .select("name")
    .eq("id", invite.server_id)
    .single();

  // 6. Check if already a member
  const { data: existingMember } = await supabase
    .from("server_members")
    .select("id")
    .eq("server_id", invite.server_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingMember) {
    return {
      serverId: invite.server_id,
      serverName: server?.name || "Unknown",
      roleAssigned: false,
      roleName: null,
      alreadyMember: true,
    };
  }

  // 7. Join the server
  const { error: memberError } = await supabase
    .from("server_members")
    .insert({
      server_id: invite.server_id,
      user_id: userId,
      role: "member",
    });

  if (memberError) {
    if (memberError.code === "23505") {
      // Duplicate — race condition, already joined
      return {
        serverId: invite.server_id,
        serverName: server?.name || "Unknown",
        roleAssigned: false,
        roleName: null,
        alreadyMember: true,
      };
    }
    throw memberError;
  }

  // 8. Auto-assign mapped role
  let roleAssigned = false;
  let roleName: string | null = null;

  if (invite.mapped_role_id) {
    const { data: role } = await supabase
      .from("server_roles")
      .select("id, name")
      .eq("id", invite.mapped_role_id)
      .single();

    if (role) {
      const { error: roleError } = await supabase
        .from("role_members")
        .insert({
          role_id: role.id,
          user_id: userId,
          assigned_by: invite.inviter_id,
        });

      if (!roleError) {
        roleAssigned = true;
        roleName = role.name;
      }
    }
  }

  // 9. Log invite usage (non-critical)
  try {
    await supabase.from("invite_uses").insert({
      invite_id: invite.id,
      user_id: userId,
    });
  } catch {
    // Non-critical — don't block the join
  }

  // 10. Increment use count (non-critical)
  try {
    await supabase
      .from("server_invites")
      .update({ uses: invite.uses + 1 })
      .eq("id", invite.id);
  } catch {
    // Non-critical
  }

  // Aggregate analytics (fire-and-forget)
  trackMigrationEvent("invite_join");

  return {
    serverId: invite.server_id,
    serverName: server?.name || "Unknown",
    roleAssigned,
    roleName,
    alreadyMember: false,
  };
}

// ---------------------------------------------------------------------------
// Deactivate an invite (soft delete)
// ---------------------------------------------------------------------------

export async function deactivateInvite(
  supabase: SupabaseClient,
  inviteId: string,
): Promise<void> {
  const { error } = await supabase
    .from("server_invites")
    .update({ is_active: false })
    .eq("id", inviteId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Get public invite preview (for landing page — NO PII)
// ---------------------------------------------------------------------------

export async function getInvitePreview(
  supabase: SupabaseClient,
  code: string,
): Promise<InvitePreview | null> {
  // Use service client — this bypasses RLS to get server metadata
  const { data: invite, error } = await supabase
    .from("server_invites")
    .select(`
      code, server_id, mapped_role_id, label,
      expires_at, max_uses, uses, is_active, requires_family_account
    `)
    .eq("code", code.trim())
    .single();

  if (error || !invite) return null;

  // Get server public info
  const { data: server } = await supabase
    .from("servers")
    .select("name, icon_url, member_count")
    .eq("id", invite.server_id)
    .single();

  if (!server) return null;

  // Get channel count
  const { count: channelCount } = await supabase
    .from("channels")
    .select("id", { count: "exact", head: true })
    .eq("server_id", invite.server_id);

  // Get mapped role info
  let mappedRoleName: string | null = null;
  let mappedRoleColor: string | null = null;

  if (invite.mapped_role_id) {
    const { data: role } = await supabase
      .from("server_roles")
      .select("name, color")
      .eq("id", invite.mapped_role_id)
      .single();

    if (role) {
      mappedRoleName = role.name;
      mappedRoleColor = role.color;
    }
  }

  // Compute validity
  const isExpired = invite.expires_at && new Date(invite.expires_at) < new Date();
  const isMaxed = invite.max_uses > 0 && invite.uses >= invite.max_uses;
  const isValid = invite.is_active && !isExpired && !isMaxed;

  return {
    code: invite.code,
    serverName: server.name,
    serverIcon: server.icon_url,
    memberCount: server.member_count || 0,
    channelCount: channelCount || 0,
    mappedRoleName,
    mappedRoleColor,
    label: invite.label,
    expiresAt: invite.expires_at,
    isValid: !!isValid,
    requiresFamilyAccount: invite.requires_family_account,
  };
}

// ---------------------------------------------------------------------------
// Increment click count (for analytics, no PII)
// ---------------------------------------------------------------------------

export async function incrementClickCount(
  supabase: SupabaseClient,
  code: string,
): Promise<void> {
  try {
    // Use RPC or raw update — increment atomically
    const { data: invite } = await supabase
      .from("server_invites")
      .select("id, click_count")
      .eq("code", code.trim())
      .single();

    if (invite) {
      await supabase
        .from("server_invites")
        .update({ click_count: (invite.click_count || 0) + 1 })
        .eq("id", invite.id);
    }
  } catch {
    // Non-critical — click tracking should never block
  }
}

// ---------------------------------------------------------------------------
// Get invite stats for migration dashboard
// ---------------------------------------------------------------------------

export async function getInviteStats(
  supabase: SupabaseClient,
  serverId: string,
): Promise<InviteStats> {
  // Total invites
  const { count: totalInvites } = await supabase
    .from("server_invites")
    .select("id", { count: "exact", head: true })
    .eq("server_id", serverId);

  // Active invites
  const { count: activeInvites } = await supabase
    .from("server_invites")
    .select("id", { count: "exact", head: true })
    .eq("server_id", serverId)
    .eq("is_active", true);

  // Get all invites with click counts and role info
  const { data: inviteData } = await supabase
    .from("server_invites")
    .select("id, click_count, mapped_role_id")
    .eq("server_id", serverId);

  let totalJoins = 0;
  let totalClicks = 0;
  const dailyJoins: { date: string; count: number }[] = [];
  const membersByRole: InviteStats["membersByRole"] = [];

  if (inviteData && inviteData.length > 0) {
    const ids = inviteData.map((i) => i.id);

    // Sum click counts
    totalClicks = inviteData.reduce((sum, inv) => sum + (inv.click_count || 0), 0);

    const { count } = await supabase
      .from("invite_uses")
      .select("id", { count: "exact", head: true })
      .in("invite_id", ids);

    totalJoins = count || 0;

    // Members by role
    const roleIds = [...new Set(
      inviteData
        .map((inv) => inv.mapped_role_id)
        .filter((id): id is string => id !== null),
    )];

    if (roleIds.length > 0) {
      const { data: roles } = await supabase
        .from("server_roles")
        .select("id, name, color")
        .in("id", roleIds);

      if (roles) {
        for (const role of roles) {
          const roleInviteIds = inviteData
            .filter((inv) => inv.mapped_role_id === role.id)
            .map((inv) => inv.id);

          const { count: roleJoins } = await supabase
            .from("invite_uses")
            .select("id", { count: "exact", head: true })
            .in("invite_id", roleInviteIds);

          if (roleJoins && roleJoins > 0) {
            membersByRole.push({
              roleName: role.name,
              roleColor: role.color,
              count: roleJoins,
            });
          }
        }
      }
    }

    // Count joins without a mapped role
    const unmappedInviteIds = inviteData
      .filter((inv) => !inv.mapped_role_id)
      .map((inv) => inv.id);

    if (unmappedInviteIds.length > 0) {
      const { count: unmappedJoins } = await supabase
        .from("invite_uses")
        .select("id", { count: "exact", head: true })
        .in("invite_id", unmappedInviteIds);

      if (unmappedJoins && unmappedJoins > 0) {
        membersByRole.push({
          roleName: "No Role",
          roleColor: null,
          count: unmappedJoins,
        });
      }
    }

    // Daily joins for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentUses } = await supabase
      .from("invite_uses")
      .select("joined_at")
      .in("invite_id", ids)
      .gte("joined_at", sevenDaysAgo.toISOString())
      .order("joined_at", { ascending: true });

    // Group by date
    const dateMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dateMap.set(d.toISOString().split("T")[0], 0);
    }

    if (recentUses) {
      for (const use of recentUses) {
        const date = new Date(use.joined_at).toISOString().split("T")[0];
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
      }
    }

    for (const [date, count] of dateMap) {
      dailyJoins.push({ date, count });
    }
  } else {
    // Fill empty daily data
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailyJoins.push({ date: d.toISOString().split("T")[0], count: 0 });
    }
  }

  const joinRate = totalClicks > 0 ? Math.round((totalJoins / totalClicks) * 1000) / 10 : 0;

  return {
    totalInvites: totalInvites || 0,
    activeInvites: activeInvites || 0,
    totalJoins,
    totalClicks,
    joinRate,
    membersByRole,
    dailyJoins,
  };
}
