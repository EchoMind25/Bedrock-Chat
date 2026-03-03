"use client";

import { useMemo } from "react";
import {
  Shield,
  Check,
  X,
  Eye,
  Clock,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  BEDROCK_PERMISSION_GROUPS,
  PERMISSION_DESCRIPTIONS,
  checkAllPermissions,
  getHighestRole,
  type PermissionCheckResult,
  type PermissionContext,
  type PermissionAuditEntry,
} from "@/lib/permissions/engine";
import type { BedrockPermission } from "@/lib/types/server-definition";
import type { Role } from "@/lib/types/permissions";
import type { MonitoringLevel } from "@/lib/types/family";
import { getMonitoringPermissions } from "@/lib/family/monitoring";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MyPermissionsProps {
  /** Permission context for the current user in this server */
  context: PermissionContext;
  /** All roles the user holds (for display) */
  userRoles: Role[];
  /** Default @everyone role */
  defaultRole: Role | null;
  /** Whether the user is in a family-safe server with monitoring */
  isFamilySafe: boolean;
  /** Teen's monitoring level (null if not a teen or no monitoring) */
  monitoringLevel: MonitoringLevel | null;
  /** Recent audit log entries that affect this user's roles */
  recentChanges?: PermissionAuditEntry[];
  /** Optional className */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MyPermissions({
  context,
  userRoles,
  defaultRole,
  isFamilySafe,
  monitoringLevel,
  recentChanges,
  className,
}: MyPermissionsProps) {
  // Calculate all permissions once
  const permissionResults = useMemo(
    () => checkAllPermissions(context),
    [context],
  );

  // Get highest role for display
  const highestRole = useMemo(() => getHighestRole(userRoles), [userRoles]);

  // Split into allowed / denied
  const { allowed, denied } = useMemo(() => {
    const allowedPerms: Array<{
      perm: BedrockPermission;
      result: PermissionCheckResult;
    }> = [];
    const deniedPerms: Array<{
      perm: BedrockPermission;
      result: PermissionCheckResult;
    }> = [];

    for (const [perm, result] of permissionResults) {
      if (result.allowed) {
        allowedPerms.push({ perm, result });
      } else {
        deniedPerms.push({ perm, result });
      }
    }
    return { allowed: allowedPerms, denied: deniedPerms };
  }, [permissionResults]);

  // Monitoring permissions (for family-safe transparency)
  const monitoringPerms = useMemo(() => {
    if (!monitoringLevel) return null;
    return getMonitoringPermissions(monitoringLevel);
  }, [monitoringLevel]);

  const monitoringLevelLabels: Record<number, string> = {
    1: "Minimal",
    2: "Moderate",
    3: "Transparent",
    4: "Restricted",
  };

  return (
    <div className={cn("space-y-5", className)}>
      {/* Your Role */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-slate-200">Your Role</h3>
        </div>

        <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
          {highestRole ? (
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: highestRole.color }}
              />
              <span className="text-sm font-medium text-slate-100">
                {highestRole.name}
              </span>
              {userRoles.length > 1 && (
                <span className="text-xs text-slate-500">
                  +{userRoles.length - 1} more
                </span>
              )}
            </div>
          ) : defaultRole ? (
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: defaultRole.color }}
              />
              <span className="text-sm font-medium text-slate-100">
                {defaultRole.name}
              </span>
            </div>
          ) : (
            <span className="text-sm text-slate-400">No role assigned</span>
          )}

          {/* Show all roles if multiple */}
          {userRoles.length > 1 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {userRoles.map((role) => (
                <span
                  key={role.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                  style={{
                    backgroundColor: `color-mix(in oklch, ${role.color} 15%, transparent)`,
                    color: role.color,
                    borderWidth: 1,
                    borderColor: `color-mix(in oklch, ${role.color} 30%, transparent)`,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: role.color }}
                  />
                  {role.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* What you can do */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            What you can do
          </h3>
          <span className="text-xs text-slate-500">
            ({allowed.length})
          </span>
        </div>

        <div className="space-y-1">
          {Object.entries(BEDROCK_PERMISSION_GROUPS).map(
            ([group, perms]) => {
              const groupAllowed = allowed.filter((a) =>
                (perms as readonly BedrockPermission[]).includes(a.perm),
              );
              if (groupAllowed.length === 0) return null;

              return (
                <div key={group} className="space-y-0.5">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {group}
                  </span>
                  {groupAllowed.map(({ perm }) => (
                    <PermissionLine
                      key={perm}
                      perm={perm}
                      allowed
                    />
                  ))}
                </div>
              );
            },
          )}
        </div>
      </section>

      {/* What you cannot do */}
      {denied.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              What you cannot do
            </h3>
            <span className="text-xs text-slate-500">
              ({denied.length})
            </span>
          </div>

          <div className="space-y-0.5">
            {denied.map(({ perm }) => (
              <PermissionLine key={perm} perm={perm} allowed={false} />
            ))}
          </div>
        </section>
      )}

      {/* What parents can see (family transparency) */}
      {isFamilySafe && monitoringLevel && monitoringPerms && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              What parents can see
            </h3>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Level {monitoringLevel}: {monitoringLevelLabels[monitoringLevel]}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-1.5">
            <MonitoringLine
              label="Which servers you've joined"
              active={monitoringPerms.canSeeServers}
            />
            <MonitoringLine
              label="Your friends list"
              active={monitoringPerms.canSeeFriends}
            />
            <MonitoringLine
              label="How many messages you've sent"
              active={monitoringPerms.canSeeMessageCounts}
            />
            <MonitoringLine
              label="How long you've been online"
              active={monitoringPerms.canSeeOnlineTime}
            />
            <MonitoringLine
              label="Read your messages"
              active={monitoringPerms.canReadMessages}
            />
            <MonitoringLine
              label="See when you're online"
              active={monitoringPerms.canViewPresence}
            />
            <MonitoringLine
              label="Must approve new servers you join"
              active={monitoringPerms.requiresServerApproval}
            />
            <MonitoringLine
              label="Must approve new friends"
              active={monitoringPerms.requiresFriendApproval}
            />
            <MonitoringLine
              label="Keyword alerts on your messages"
              active={monitoringPerms.hasKeywordAlerts}
            />
            <MonitoringLine
              label="Daily time limits"
              active={monitoringPerms.hasTimeLimits}
            />

            <div className="pt-1.5 mt-1.5 border-t border-amber-500/15">
              <p className="text-xs text-amber-300/70">
                NSFW content is always blocked for teen accounts.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Recent changes affecting your permissions */}
      {recentChanges && recentChanges.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Recent changes to your permissions
            </h3>
          </div>

          <div className="space-y-1">
            {recentChanges.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2 p-2 rounded-md bg-slate-800/20 text-xs"
              >
                <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="text-slate-300 truncate">
                  {formatAuditAction(entry)}
                </span>
                <span className="text-slate-600 ml-auto shrink-0">
                  {formatTimeAgo(entry.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PermissionLine({
  perm,
  allowed,
}: {
  perm: BedrockPermission;
  allowed: boolean;
}) {
  return (
    <div className="flex items-start gap-2 py-1 px-2 rounded-md hover:bg-slate-800/20 transition-colors">
      {allowed ? (
        <Check className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
      ) : (
        <X className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
      )}
      <span
        className={cn(
          "text-sm",
          allowed ? "text-slate-300" : "text-slate-500",
        )}
      >
        {PERMISSION_DESCRIPTIONS[perm]}
      </span>
    </div>
  );
}

function MonitoringLine({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {active ? (
        <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      ) : (
        <span className="w-3.5 h-3.5 shrink-0" />
      )}
      <span
        className={cn(
          active ? "text-amber-200" : "text-slate-500 line-through",
        )}
      >
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAuditAction(entry: PermissionAuditEntry): string {
  const actionMap: Record<string, string> = {
    role_created: "A new role was created",
    role_updated: "Your role permissions were updated",
    role_deleted: "A role was deleted",
    role_assigned: "You were assigned a new role",
    role_removed: "A role was removed from you",
    override_set: "Channel permissions were changed",
    override_removed: "Channel permission override was removed",
    member_permissions_changed: "Your permissions were changed",
  };

  let text = actionMap[entry.action] ?? entry.action;

  // Add role name from changes if available
  const changes = entry.changes;
  const roleName =
    (changes.after as Record<string, unknown> | undefined)?.name ??
    (changes.before as Record<string, unknown> | undefined)?.name;
  if (roleName && typeof roleName === "string") {
    text += ` (${roleName})`;
  }

  return text;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
