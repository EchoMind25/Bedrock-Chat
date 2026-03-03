"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useServerStore } from "@/store/server.store";
import { useServerManagementStore } from "@/store/server-management.store";
import { buildInviteUrl, formatTimeRemaining, isInviteValid } from "@/lib/types/invites";
import type { ServerInvite, InviteStats } from "@/lib/types/invites";
import type { BulkInviteMapping } from "@/lib/services/invite-service";
import {
  MIGRATION_TEMPLATES,
  interpolateTemplate,
} from "@/lib/data/migration-messages";
import QRCode from "qrcode";

const spring = { type: "spring" as const, stiffness: 260, damping: 25, mass: 1 };

// ---------------------------------------------------------------------------
// Clipboard helper
// ---------------------------------------------------------------------------
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Copy Button
// ---------------------------------------------------------------------------
function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <motion.button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80 border border-white/10 transition-colors min-h-[32px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
      whileTap={{ scale: 0.95 }}
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          {label || "Copy"}
        </>
      )}
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Role Badge (inline)
// ---------------------------------------------------------------------------
function RoleBadge({ name, color }: { name: string; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: color
          ? `color-mix(in oklch, ${color} 20%, transparent)`
          : "oklch(0.5 0.15 265 / 0.2)",
        color: color || "oklch(0.8 0.15 265)",
      }}
    >
      {name}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Invite Row
// ---------------------------------------------------------------------------
function InviteRow({ invite }: { invite: ServerInvite }) {
  const url = buildInviteUrl(invite.code);
  const valid = isInviteValid(invite);

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
      valid ? "bg-white/[0.03] border-white/10" : "bg-white/[0.02] border-white/5 opacity-60"
    }`}>
      {/* Code */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <code className="text-sm font-mono text-white/80">{invite.code}</code>
          {!invite.isActive && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">
              Deactivated
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-white/40">
          {invite.mappedRoleName && (
            <RoleBadge name={invite.mappedRoleName} color={invite.mappedRoleColor} />
          )}
          {invite.label && <span>{invite.label}</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="text-right text-xs text-white/40 shrink-0">
        <div>
          {invite.uses}{invite.maxUses > 0 ? `/${invite.maxUses}` : ""} joins
        </div>
        <div>{formatTimeRemaining(invite.expiresAt)}</div>
      </div>

      {/* Copy */}
      {valid && <CopyButton text={url} label="Link" />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Daily Join Chart (simple bar visualization)
// ---------------------------------------------------------------------------
function DailyJoinChart({ dailyJoins }: { dailyJoins: InviteStats["dailyJoins"] }) {
  const max = Math.max(...dailyJoins.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-1.5 h-24">
      {dailyJoins.map((day) => {
        const height = Math.max((day.count / max) * 100, 4);
        const dateLabel = new Date(day.date).toLocaleDateString(undefined, {
          weekday: "short",
        });
        return (
          <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-white/50">{day.count}</span>
            <div
              className="w-full rounded-t transition-all"
              style={{
                height: `${height}%`,
                backgroundColor:
                  day.count > 0 ? "oklch(0.65 0.25 265)" : "oklch(0.3 0.05 265)",
              }}
            />
            <span className="text-[10px] text-white/30">{dateLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// QR Code component
// ---------------------------------------------------------------------------
function QRCodeDisplay({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 200,
        margin: 2,
        color: { dark: "#ffffff", light: "#00000000" },
      });
    }
    QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: { dark: "#ffffff", light: "#00000000" },
    }).then(setDataUrl);
  }, [url]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="rounded-lg" />
      {dataUrl && (
        <a
          href={dataUrl}
          download="bedrock-invite-qr.png"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80 border border-white/10 transition-colors min-h-[32px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download QR
        </a>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message Template Card
// ---------------------------------------------------------------------------
function MessageTemplateCard({
  template,
  inviteLink,
  roleName,
  serverName,
  joinedCount,
}: {
  template: (typeof MIGRATION_TEMPLATES)[number];
  inviteLink: string;
  roleName: string;
  serverName: string;
  joinedCount: number;
}) {
  const daysRemaining = 14; // Default: 2 weeks from now
  const date = new Date();
  date.setDate(date.getDate() + daysRemaining);
  const dateStr = date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const message = interpolateTemplate(template.template, {
    INVITE_LINK: inviteLink,
    ROLE_NAME: roleName,
    SERVER_NAME: serverName,
    JOINED_COUNT: joinedCount,
    DAYS_REMAINING: daysRemaining,
    DATE: dateStr,
  });

  return (
    <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-white/80">{template.title}</h4>
          <p className="text-xs text-white/40">{template.description}</p>
        </div>
        <CopyButton text={message} label="Copy" />
      </div>
      <pre className="text-xs text-white/50 whitespace-pre-wrap bg-white/[0.03] rounded-lg p-3 max-h-40 overflow-y-auto scrollbar-thin">
        {message}
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------
export function MigrationDashboard() {
  const getCurrentServer = useServerStore((s) => s.getCurrentServer);
  const currentServer = getCurrentServer();
  const loadInvites = useServerManagementStore((s) => s.loadInvites);
  const getInvitesByServer = useServerManagementStore((s) => s.getInvitesByServer);

  const [stats, setStats] = useState<InviteStats | null>(null);
  const [isCreatingBulk, setIsCreatingBulk] = useState(false);
  const [activeSection, setActiveSection] = useState<"invites" | "qr" | "progress" | "messages" | "roles">("invites");

  const serverId = currentServer?.id;
  const invites = serverId ? getInvitesByServer(serverId) : [];
  const activeInvites = invites.filter(isInviteValid);

  // Load invites and stats on mount
  useEffect(() => {
    if (!serverId) return;
    loadInvites(serverId, []);

    fetch(`/api/invites/stats/${serverId}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setStats(data); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId]);

  // Bulk create invites for all roles
  const handleBulkCreate = useCallback(async () => {
    if (!serverId || !currentServer?.roles) return;
    setIsCreatingBulk(true);

    const nonDefaultRoles = currentServer.roles.filter((r) => !r.isDefault);
    const mappings: BulkInviteMapping[] = nonDefaultRoles.map((role) => ({
      roleId: role.id,
      roleName: role.name,
    }));

    try {
      await fetch("/api/invites/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId, roleMappings: mappings }),
      });
      // Reload invites
      loadInvites(serverId, []);
    } catch {
      // Error handled by store
    } finally {
      setIsCreatingBulk(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId, currentServer?.roles]);

  if (!currentServer) {
    return (
      <div className="p-6 text-center text-white/40">
        No server selected
      </div>
    );
  }

  const primaryInvite = activeInvites[0];
  const primaryInviteUrl = primaryInvite ? buildInviteUrl(primaryInvite.code) : "";

  const sections = [
    { id: "invites" as const, label: "Invite Links" },
    { id: "qr" as const, label: "QR Code" },
    { id: "progress" as const, label: "Progress" },
    { id: "messages" as const, label: "Discord Messages" },
    { id: "roles" as const, label: "Role Mapping" },
  ];

  return (
    <div className="space-y-6">
      {/* Section tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/10">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id)}
            className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors min-h-[36px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary ${
              activeSection === section.id
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60 hover:bg-white/5"
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Section: Invite Links */}
        {activeSection === "invites" && (
          <motion.div
            key="invites"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={spring}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white/70">
                Active Invites ({activeInvites.length})
              </h3>
              <motion.button
                type="button"
                onClick={handleBulkCreate}
                disabled={isCreatingBulk || !currentServer.roles?.length}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-40 min-h-[32px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
                whileTap={{ scale: 0.95 }}
              >
                {isCreatingBulk ? "Creating..." : "Generate All Role Invites"}
              </motion.button>
            </div>

            {invites.length === 0 ? (
              <div className="p-8 text-center text-white/30 text-sm">
                No invites yet. Create invites in the Invites tab or generate bulk invites above.
              </div>
            ) : (
              <div className="space-y-2">
                {invites.map((invite) => (
                  <InviteRow key={invite.id} invite={invite} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Section: QR Code */}
        {activeSection === "qr" && (
          <motion.div
            key="qr"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={spring}
            className="space-y-4"
          >
            <h3 className="text-sm font-medium text-white/70">QR Code</h3>
            {primaryInviteUrl ? (
              <div className="p-6 rounded-lg bg-white/[0.03] border border-white/10 flex flex-col items-center gap-4">
                <QRCodeDisplay url={primaryInviteUrl} />
                <div className="text-center">
                  <p className="text-xs text-white/40">
                    Scan to join {currentServer.name}
                  </p>
                  <CopyButton text={primaryInviteUrl} label="Copy Link" />
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-white/30 text-sm">
                Create an invite first to generate a QR code.
              </div>
            )}
          </motion.div>
        )}

        {/* Section: Migration Progress */}
        {activeSection === "progress" && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={spring}
            className="space-y-4"
          >
            <h3 className="text-sm font-medium text-white/70">Migration Progress</h3>

            {stats ? (
              <>
                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 text-center">
                    <div className="text-2xl font-bold text-white">{stats.totalJoins}</div>
                    <div className="text-xs text-white/40">Joined</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 text-center">
                    <div className="text-2xl font-bold text-white">{stats.totalClicks}</div>
                    <div className="text-xs text-white/40">Clicks</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 text-center">
                    <div className="text-2xl font-bold text-white">{stats.joinRate}%</div>
                    <div className="text-xs text-white/40">Join Rate</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 text-center">
                    <div className="text-2xl font-bold text-white">{stats.activeInvites}</div>
                    <div className="text-xs text-white/40">Active Links</div>
                  </div>
                </div>

                {/* Members by role */}
                {stats.membersByRole.length > 0 && (
                  <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
                    <h4 className="text-xs font-medium text-white/50 mb-3">Members by Role</h4>
                    <div className="space-y-2">
                      {stats.membersByRole.map((role) => {
                        const maxCount = Math.max(...stats.membersByRole.map((r) => r.count), 1);
                        const width = Math.max((role.count / maxCount) * 100, 8);
                        return (
                          <div key={role.roleName} className="flex items-center gap-3">
                            <span className="text-xs text-white/60 w-20 shrink-0 truncate">{role.roleName}</span>
                            <div className="flex-1 h-5 rounded bg-white/5 overflow-hidden">
                              <div
                                className="h-full rounded transition-all"
                                style={{
                                  width: `${width}%`,
                                  backgroundColor: role.roleColor || "oklch(0.65 0.25 265)",
                                  opacity: 0.7,
                                }}
                              />
                            </div>
                            <span className="text-xs text-white/40 w-8 text-right shrink-0">{role.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Daily join chart */}
                <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
                  <h4 className="text-xs font-medium text-white/50 mb-3">Daily Joins (Last 7 Days)</h4>
                  <DailyJoinChart dailyJoins={stats.dailyJoins} />
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-white/30 text-sm">
                Loading stats...
              </div>
            )}
          </motion.div>
        )}

        {/* Section: Discord Messages */}
        {activeSection === "messages" && (
          <motion.div
            key="messages"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={spring}
            className="space-y-4"
          >
            <h3 className="text-sm font-medium text-white/70">
              Pre-formatted Messages for Discord
            </h3>
            <p className="text-xs text-white/40">
              Copy these messages and paste them into your Discord server to announce the migration.
            </p>

            <div className="space-y-3">
              {MIGRATION_TEMPLATES.map((template) => (
                <MessageTemplateCard
                  key={template.id}
                  template={template}
                  inviteLink={primaryInviteUrl || "https://bedrock.chat/join/YOUR_CODE"}
                  roleName={primaryInvite?.mappedRoleName || "Member"}
                  serverName={currentServer.name}
                  joinedCount={stats?.totalJoins || 0}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Section: Role Mapping */}
        {activeSection === "roles" && (
          <motion.div
            key="roles"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={spring}
            className="space-y-4"
          >
            <h3 className="text-sm font-medium text-white/70">Role Mapping</h3>
            <p className="text-xs text-white/40">
              Shows which Bedrock roles have invite links configured.
            </p>

            <div className="rounded-lg border border-white/10 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="text-left p-3 text-white/50 font-medium">Role</th>
                    <th className="text-left p-3 text-white/50 font-medium">Invite Code</th>
                    <th className="text-left p-3 text-white/50 font-medium">Uses</th>
                    <th className="text-left p-3 text-white/50 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentServer.roles || [])
                    .filter((r) => !r.isDefault)
                    .map((role) => {
                      const matchingInvite = invites.find(
                        (inv) => inv.mappedRoleId === role.id && inv.isActive,
                      );
                      return (
                        <tr key={role.id} className="border-b border-white/5">
                          <td className="p-3">
                            <RoleBadge name={role.name} color={role.color} />
                          </td>
                          <td className="p-3 font-mono text-white/60">
                            {matchingInvite?.code || (
                              <span className="text-white/20">No invite</span>
                            )}
                          </td>
                          <td className="p-3 text-white/40">
                            {matchingInvite ? matchingInvite.uses : "-"}
                          </td>
                          <td className="p-3">
                            {matchingInvite ? (
                              <span className="text-green-400">Active</span>
                            ) : (
                              <span className="text-amber-400">Missing</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
