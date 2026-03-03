import type { Metadata } from "next";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import { InviteLandingClient } from "./invite-landing-client";
import { trackMigrationEvent } from "@/lib/services/migration-analytics";
import type { InvitePreview } from "@/lib/types/invites";

interface Props {
  params: Promise<{ code: string }>;
}

/**
 * Invite Landing Page — Server Component (SSR)
 *
 * This is the first impression for Discord migrants. It must:
 * - Work WITHOUT authentication
 * - Load fast (<2s LCP)
 * - Show server name, member count, channel count (public info only)
 * - NOT show member names, channel names, or messages
 * - Be mobile responsive at 375px
 * - noindex (not crawlable)
 * - Generate Open Graph tags for Discord link previews
 *
 * PRIVACY:
 * - No cookies set, no tracking pixels, no device fingerprinting
 * - Click count uses server-side counter only
 */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;

  try {
    const service = createServiceClient();

    const { data: invite } = await service
      .from("server_invites")
      .select("server_id, is_active, expires_at, max_uses, uses")
      .eq("code", code)
      .eq("is_active", true)
      .single();

    if (!invite) {
      return {
        title: "Invalid Invite - Bedrock Chat",
        robots: { index: false, follow: false },
      };
    }

    const { data: server } = await service
      .from("servers")
      .select("name, description")
      .eq("id", invite.server_id)
      .single();

    const serverName = server?.name || "a server";

    return {
      title: `Join ${serverName} on Bedrock Chat`,
      description:
        server?.description ||
        "Join this community on Bedrock Chat — privacy-first communication that respects your rights.",
      robots: { index: false, follow: false },
      openGraph: {
        title: `Join ${serverName} on Bedrock Chat`,
        description:
          server?.description ||
          "Privacy-first communication that respects your rights.",
        type: "website",
        siteName: "Bedrock Chat",
      },
    };
  } catch {
    return {
      title: "Join Bedrock Chat",
      robots: { index: false, follow: false },
    };
  }
}

export default async function JoinPage({ params }: Props) {
  const { code } = await params;

  let preview: InvitePreview | null = null;

  try {
    const service = createServiceClient();

    const { data: invite } = await service
      .from("server_invites")
      .select(
        "code, server_id, mapped_role_id, label, expires_at, max_uses, uses, is_active, requires_family_account, click_count",
      )
      .eq("code", code)
      .single();

    if (invite) {
      const { data: server } = await service
        .from("servers")
        .select("name, icon_url, member_count")
        .eq("id", invite.server_id)
        .single();

      const { count: channelCount } = await service
        .from("channels")
        .select("id", { count: "exact", head: true })
        .eq("server_id", invite.server_id);

      let mappedRoleName: string | null = null;
      let mappedRoleColor: string | null = null;

      if (invite.mapped_role_id) {
        const { data: role } = await service
          .from("server_roles")
          .select("name, color")
          .eq("id", invite.mapped_role_id)
          .single();
        if (role) {
          mappedRoleName = role.name;
          mappedRoleColor = role.color;
        }
      }

      const isExpired =
        invite.expires_at && new Date(invite.expires_at) < new Date();
      const isMaxed =
        invite.max_uses > 0 && invite.uses >= invite.max_uses;

      preview = {
        code: invite.code,
        serverName: server?.name || "Unknown Server",
        serverIcon: server?.icon_url || null,
        memberCount: server?.member_count || 0,
        channelCount: channelCount || 0,
        mappedRoleName,
        mappedRoleColor,
        label: invite.label,
        expiresAt: invite.expires_at,
        isValid: invite.is_active && !isExpired && !isMaxed,
        requiresFamilyAccount: invite.requires_family_account,
      };

      // Increment click count (non-blocking)
      service
        .from("server_invites")
        .update({ click_count: (invite.click_count || 0) + 1 })
        .eq("code", code)
        .then(() => {});

      // Aggregate analytics — no PII, no cookies
      const headerList = await headers();
      trackMigrationEvent("invite_clicked", headerList.get("referer"));
    }
  } catch {
    // Preview fetch failure — show error state in client component
  }

  return <InviteLandingClient preview={preview} code={code} />;
}
