"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  Check,
  X,
  Minus,
  Save,
  RotateCcw,
  Info,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  BEDROCK_PERMISSION_GROUPS,
  PERMISSION_DESCRIPTIONS,
  bitmaskToBedrockPermissions,
  type PermissionAuditEntry,
} from "@/lib/permissions/engine";
import type { BedrockPermission } from "@/lib/types/server-definition";
import {
  Permission,
  hasPermission,
  addPermission,
  removePermission,
  type Role,
} from "@/lib/types/permissions";
import { resolvePermissions } from "@/lib/templates/permission-map";
import { Tooltip } from "@/components/ui/tooltip/tooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CellState = "allowed" | "denied" | "inherited";

interface PermissionMatrixProps {
  /** All roles in the server, ordered by position (highest first) */
  roles: Role[];
  /** Called when roles are modified. Receives the full updated roles array. */
  onSave: (roles: Role[]) => void;
  /** Whether the current user can edit permissions */
  canEdit: boolean;
  /** Recent audit log entries for the "Recent changes" section */
  auditLog?: PermissionAuditEntry[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PermissionMatrix({
  roles,
  onSave,
  canEdit,
  auditLog,
}: PermissionMatrixProps) {
  // Local copy of roles for batched editing
  const [localRoles, setLocalRoles] = useState<Role[]>(() =>
    [...roles].sort((a, b) => b.position - a.position),
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(Object.keys(BEDROCK_PERMISSION_GROUPS)),
  );
  const [showPreview, setShowPreview] = useState(false);

  // Track if there are unsaved changes
  const hasChanges = useMemo(() => {
    return localRoles.some((local) => {
      const original = roles.find((r) => r.id === local.id);
      return original && original.permissions !== local.permissions;
    });
  }, [localRoles, roles]);

  // Reset to original
  const handleReset = useCallback(() => {
    setLocalRoles([...roles].sort((a, b) => b.position - a.position));
  }, [roles]);

  // Save changes
  const handleSave = useCallback(() => {
    onSave(localRoles);
  }, [localRoles, onSave]);

  // Toggle group expansion
  const toggleGroup = useCallback((group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  }, []);

  // Get cell state for a role + permission
  const getCellState = useCallback(
    (role: Role, perm: BedrockPermission): CellState => {
      // Administrator grants everything
      if (hasPermission(role.permissions, Permission.ADMINISTRATOR)) {
        return "allowed";
      }

      const bits = resolvePermissions([perm]);
      if (bits === 0) return "inherited"; // Reserved permissions (view_audit_log, etc.)

      const granted = (role.permissions & bits) === bits;
      return granted ? "allowed" : "denied";
    },
    [],
  );

  // Toggle a permission for a role
  const toggleCell = useCallback(
    (roleId: string, perm: BedrockPermission) => {
      if (!canEdit) return;

      const bits = resolvePermissions([perm]);
      if (bits === 0) return; // Can't toggle reserved permissions

      setLocalRoles((prev) =>
        prev.map((role) => {
          if (role.id !== roleId) return role;
          // Don't toggle if Administrator (it overrides everything)
          if (hasPermission(role.permissions, Permission.ADMINISTRATOR)) {
            return role;
          }
          const isGranted = (role.permissions & bits) === bits;
          const newPerms = isGranted
            ? role.permissions & ~bits
            : role.permissions | bits;
          return { ...role, permissions: newPerms };
        }),
      );
    },
    [canEdit],
  );

  // Filter out owner-only roles from display
  const displayRoles = useMemo(
    () => localRoles.filter((r) => r.name !== "@everyone" || r.isDefault),
    [localRoles],
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-slate-100">
            Permission Matrix
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview((p) => !p)}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-slate-100 transition-colors"
          >
            {showPreview ? "Hide Preview" : "Plain English"}
          </button>

          {canEdit && hasChanges && (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-sm bg-green-500/20 border border-green-500/40 flex items-center justify-center">
            <Check className="w-3 h-3 text-green-400" />
          </span>
          Allowed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-sm bg-red-500/20 border border-red-500/40 flex items-center justify-center">
            <X className="w-3 h-3 text-red-400" />
          </span>
          Denied
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-sm bg-slate-500/20 border border-slate-500/40 flex items-center justify-center">
            <Minus className="w-3 h-3 text-slate-400" />
          </span>
          Inherited
        </span>
      </div>

      {/* Plain English Preview */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 space-y-3">
              <h4 className="text-sm font-medium text-slate-200">
                What each role can do:
              </h4>
              {displayRoles.map((role) => {
                const perms = bitmaskToBedrockPermissions(role.permissions);
                return (
                  <div key={role.id} className="space-y-1">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: role.color }}
                    >
                      {role.name}
                    </span>
                    {perms.length === ALL_BEDROCK_PERMISSIONS_COUNT ? (
                      <p className="text-xs text-slate-400 ml-3">
                        Can do everything (Administrator)
                      </p>
                    ) : perms.length === 0 ? (
                      <p className="text-xs text-slate-400 ml-3">
                        No permissions granted
                      </p>
                    ) : (
                      <ul className="ml-3 space-y-0.5">
                        {perms.map((p) => (
                          <li
                            key={p}
                            className="text-xs text-slate-400 flex items-start gap-1.5"
                          >
                            <Check className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                            {PERMISSION_DESCRIPTIONS[p]}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Matrix Grid */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full border-collapse">
          {/* Role columns header */}
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-background-dark min-w-[200px] p-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Permission
              </th>
              {displayRoles.map((role) => (
                <th
                  key={role.id}
                  className="p-2 text-center min-w-[80px]"
                >
                  <span
                    className="text-xs font-semibold truncate block"
                    style={{ color: role.color }}
                    title={role.name}
                  >
                    {role.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Object.entries(BEDROCK_PERMISSION_GROUPS).map(
              ([group, perms]) => (
                <PermissionGroup
                  key={group}
                  groupName={group}
                  permissions={perms as BedrockPermission[]}
                  roles={displayRoles}
                  expanded={expandedGroups.has(group)}
                  onToggleGroup={() => toggleGroup(group)}
                  getCellState={getCellState}
                  onToggleCell={toggleCell}
                  canEdit={canEdit}
                />
              ),
            )}
          </tbody>
        </table>
      </div>

      {/* Recent Audit Log */}
      {auditLog && auditLog.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-slate-700/50">
          <h4 className="text-sm font-medium text-slate-300">
            Recent Permission Changes
          </h4>
          <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
            {auditLog.slice(0, 10).map((entry) => (
              <AuditLogRow key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const ALL_BEDROCK_PERMISSIONS_COUNT = 16;

// ---------------------------------------------------------------------------
// Permission Group (collapsible row group)
// ---------------------------------------------------------------------------

interface PermissionGroupProps {
  groupName: string;
  permissions: BedrockPermission[];
  roles: Role[];
  expanded: boolean;
  onToggleGroup: () => void;
  getCellState: (role: Role, perm: BedrockPermission) => CellState;
  onToggleCell: (roleId: string, perm: BedrockPermission) => void;
  canEdit: boolean;
}

function PermissionGroup({
  groupName,
  permissions,
  roles,
  expanded,
  onToggleGroup,
  getCellState,
  onToggleCell,
  canEdit,
}: PermissionGroupProps) {
  return (
    <>
      {/* Group header row */}
      <tr>
        <td
          colSpan={roles.length + 1}
          className="sticky left-0 z-10 bg-background-dark"
        >
          <button
            type="button"
            onClick={onToggleGroup}
            className="flex items-center gap-1.5 w-full p-2 text-xs font-semibold text-slate-300 uppercase tracking-wider hover:text-slate-100 transition-colors"
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            {groupName}
          </button>
        </td>
      </tr>

      {/* Permission rows */}
      {expanded &&
        permissions.map((perm) => (
          <tr
            key={perm}
            className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors"
          >
            {/* Permission name + tooltip */}
            <td className="sticky left-0 z-10 bg-background-dark p-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-200">
                  {formatPermissionName(perm)}
                </span>
                <Tooltip
                  content={PERMISSION_DESCRIPTIONS[perm]}
                  position="top"
                >
                  <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 transition-colors shrink-0" />
                </Tooltip>
              </div>
            </td>

            {/* Role cells */}
            {roles.map((role) => {
              const state = getCellState(role, perm);
              return (
                <td key={role.id} className="p-2 text-center">
                  <PermissionCell
                    state={state}
                    onClick={() => onToggleCell(role.id, perm)}
                    disabled={
                      !canEdit ||
                      hasPermission(role.permissions, Permission.ADMINISTRATOR)
                    }
                  />
                </td>
              );
            })}
          </tr>
        ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Permission Cell (clickable icon)
// ---------------------------------------------------------------------------

interface PermissionCellProps {
  state: CellState;
  onClick: () => void;
  disabled: boolean;
}

function PermissionCell({ state, onClick, disabled }: PermissionCellProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-7 h-7 rounded-sm flex items-center justify-center mx-auto transition-colors",
        disabled && "cursor-not-allowed opacity-60",
        state === "allowed" &&
          "bg-green-500/20 border border-green-500/40 hover:bg-green-500/30",
        state === "denied" &&
          "bg-red-500/20 border border-red-500/40 hover:bg-red-500/30",
        state === "inherited" &&
          "bg-slate-500/20 border border-slate-500/40 hover:bg-slate-500/30",
      )}
      aria-label={`Permission ${state}`}
    >
      {state === "allowed" && (
        <Check className="w-3.5 h-3.5 text-green-400" />
      )}
      {state === "denied" && <X className="w-3.5 h-3.5 text-red-400" />}
      {state === "inherited" && (
        <Minus className="w-3.5 h-3.5 text-slate-400" />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Audit Log Row
// ---------------------------------------------------------------------------

function AuditLogRow({ entry }: { entry: PermissionAuditEntry }) {
  const actionLabels: Record<string, string> = {
    role_created: "created role",
    role_updated: "updated role",
    role_deleted: "deleted role",
    role_assigned: "assigned role to member",
    role_removed: "removed role from member",
    override_set: "set channel override",
    override_removed: "removed channel override",
    member_permissions_changed: "changed member permissions",
  };

  const timeAgo = getTimeAgo(entry.createdAt);

  return (
    <div className="flex items-center gap-2 text-xs text-slate-400 p-1.5 rounded hover:bg-slate-800/20">
      <Shield className="w-3 h-3 shrink-0 text-slate-500" />
      <span className="truncate">
        {actionLabels[entry.action] ?? entry.action}
      </span>
      <span className="text-slate-600 ml-auto shrink-0">{timeAgo}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPermissionName(perm: BedrockPermission): string {
  return perm
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getTimeAgo(date: Date): string {
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
