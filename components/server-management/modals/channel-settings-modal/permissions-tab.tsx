"use client";

import { useState, useEffect, useMemo } from "react";
import { Shield, X, User, Users, Search, Lock, EyeOff, MessageSquareOff } from "lucide-react";
import { Button } from "../../../ui/button/button";
import { PermissionOverrideGrid } from "../../permission-grid/permission-grid";
import { Avatar } from "../../../ui/avatar/avatar";
import { motion, AnimatePresence } from "motion/react";
import type { Channel } from "../../../../lib/types/server";
import type { ChannelPermissionOverride } from "../../../../lib/types/permissions";
import { Permission } from "../../../../lib/types/permissions";
import { cn } from "../../../../lib/utils/cn";
import { useServerStore } from "../../../../store/server.store";
import { useMemberStore } from "../../../../store/member.store";
import type { MemberWithProfile } from "../../../../store/member.store";
import type { Role } from "../../../../lib/types/permissions";

// Stable empty array to prevent new [] reference each render
const EMPTY_MEMBERS: MemberWithProfile[] = [];

// Permission presets for common configurations
const PERMISSION_PRESETS = [
  {
    name: "Private Channel",
    description: "Hide from @everyone, grant access to specific roles",
    icon: Lock,
    targetName: "@everyone",
    findTarget: (roles: Role[]) => roles.find(r => r.isDefault),
    deny: Permission.VIEW_CHANNELS,
    allow: 0,
  },
  {
    name: "Read Only",
    description: "Allow viewing but deny sending messages",
    icon: EyeOff,
    targetName: "@everyone",
    findTarget: (roles: Role[]) => roles.find(r => r.isDefault),
    deny: Permission.SEND_MESSAGES | Permission.ADD_REACTIONS,
    allow: Permission.VIEW_CHANNELS | Permission.READ_MESSAGE_HISTORY,
  },
  {
    name: "Verified Only",
    description: "Deny messaging for @everyone, require role for posting",
    icon: MessageSquareOff,
    targetName: "@everyone",
    findTarget: (roles: Role[]) => roles.find(r => r.isDefault),
    deny: Permission.SEND_MESSAGES | Permission.ATTACH_FILES | Permission.EMBED_LINKS,
    allow: Permission.VIEW_CHANNELS | Permission.READ_MESSAGE_HISTORY,
  },
] as const;

interface PermissionsTabProps {
  channel: Channel;
  onSave?: (overrides: ChannelPermissionOverride[]) => Promise<void>;
  onDelete?: (channelId: string, overrideId: string) => Promise<void>;
}

export function PermissionsTab({ channel, onSave, onDelete }: PermissionsTabProps) {
  const [selectedTarget, setSelectedTarget] = useState<{
    type: "role" | "user";
    id: string;
    name: string;
  } | null>(null);
  const [allow, setAllow] = useState(0);
  const [deny, setDeny] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOverrides, setActiveOverrides] = useState<ChannelPermissionOverride[]>([]);

  // Load roles and members from stores
  const servers = useServerStore((s) => s.servers);
  const server = useMemo(() => servers.find(s => s.id === channel.serverId), [servers, channel.serverId]);
  const roles = server?.roles || [];
  const members = useMemberStore((s) => s.membersByServer[channel.serverId] ?? EMPTY_MEMBERS);

  // Load members if not already loaded
  useEffect(() => {
    if (channel.serverId) {
      useMemberStore.getState().loadMembers(channel.serverId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.serverId]);

  // Load existing overrides from DB
  useEffect(() => {
    async function loadOverrides() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/permissions/channel/${channel.id}`);
        if (res.ok) {
          const data = await res.json();
          setActiveOverrides(data.overrides || []);
        }
      } catch (err) {
        console.error("Failed to load channel overrides:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOverrides();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.id]);

  // Resolve names for overrides
  const resolveTargetName = (targetType: string, targetId: string): string => {
    if (targetType === "role") {
      return roles.find(r => r.id === targetId)?.name || "Unknown Role";
    }
    return members.find(m => m.userId === targetId)?.displayName || "Unknown User";
  };

  const handleSaveOverride = async () => {
    if (!selectedTarget) return;

    setIsSaving(true);
    try {
      const newOverride: ChannelPermissionOverride = {
        id: crypto.randomUUID(),
        channelId: channel.id,
        targetType: selectedTarget.type,
        targetId: selectedTarget.id,
        allow,
        deny,
      };

      const updatedOverrides = [
        ...activeOverrides.filter(
          (o) => !(o.targetType === selectedTarget.type && o.targetId === selectedTarget.id)
        ),
        newOverride,
      ];

      setActiveOverrides(updatedOverrides);
      if (onSave) {
        await onSave(updatedOverrides);
      }

      // Reset selection
      setSelectedTarget(null);
      setAllow(0);
      setDeny(0);
    } catch (err) {
      console.error("Error saving permission override:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOverride = async (overrideId: string) => {
    setIsSaving(true);
    try {
      const updatedOverrides = activeOverrides.filter((o) => o.id !== overrideId);
      setActiveOverrides(updatedOverrides);
      if (onDelete) {
        await onDelete(channel.id, overrideId);
      }
    } catch (err) {
      console.error("Error deleting permission override:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditOverride = (override: ChannelPermissionOverride) => {
    setSelectedTarget({
      type: override.targetType,
      id: override.targetId,
      name: resolveTargetName(override.targetType, override.targetId),
    });
    setAllow(override.allow);
    setDeny(override.deny);
  };

  const handleApplyPreset = (preset: typeof PERMISSION_PRESETS[number]) => {
    const target = preset.findTarget(roles);
    if (!target) return;

    setSelectedTarget({
      type: "role",
      id: target.id,
      name: preset.targetName,
    });
    setAllow(preset.allow);
    setDeny(preset.deny);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-purple-400" />
          <h4 className="text-sm font-semibold">Channel Permissions</h4>
        </div>
        <p className="text-sm text-white/60">
          Configure role-specific and user-specific permissions for this channel. These override
          server-level and category-level permissions.
        </p>
      </div>

      {/* Quick Presets */}
      {!selectedTarget && roles.length > 0 && (
        <div>
          <h5 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Quick Presets</h5>
          <div className="grid grid-cols-3 gap-2">
            {PERMISSION_PRESETS.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all text-left group"
                >
                  <Icon className="w-4 h-4 text-purple-400 mb-1.5" />
                  <div className="text-xs font-medium text-white/80 group-hover:text-purple-300">{preset.name}</div>
                  <div className="text-[10px] text-white/40 mt-0.5">{preset.description}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Role/User Selector */}
      {!selectedTarget && (
        <div className="p-4 rounded-lg border border-white/10 bg-white/5">
          <h5 className="text-sm font-medium mb-3">Add Permission Override</h5>
          <p className="text-xs text-white/60 mb-4">
            Select a role or user to configure their permissions for this channel.
          </p>

          <RoleUserSelector
            channelId={channel.id}
            serverId={channel.serverId}
            roles={roles}
            members={members}
            existingOverrides={activeOverrides}
            onSelect={(type, id, name) => {
              setSelectedTarget({ type, id, name });
              // Pre-fill with existing override values if editing
              const existing = activeOverrides.find(
                o => o.targetType === type && o.targetId === id
              );
              setAllow(existing?.allow || 0);
              setDeny(existing?.deny || 0);
            }}
          />
        </div>
      )}

      {/* Permission Override Editor */}
      {selectedTarget && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {selectedTarget.type === "role" ? (
                  <Users className="w-4 h-4 text-purple-400" />
                ) : (
                  <User className="w-4 h-4 text-purple-400" />
                )}
                <h5 className="text-sm font-medium">
                  {selectedTarget.name}
                  <span className="text-xs text-white/60 ml-2">
                    ({selectedTarget.type})
                  </span>
                </h5>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTarget(null);
                  setAllow(0);
                  setDeny(0);
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <PermissionOverrideGrid
              allow={allow}
              deny={deny}
              onChange={(newAllow, newDeny) => {
                setAllow(newAllow);
                setDeny(newDeny);
              }}
            />

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
              <Button
                onClick={handleSaveOverride}
                loading={isSaving}
                disabled={allow === 0 && deny === 0}
                className="gap-1.5"
              >
                <Shield className="w-4 h-4" />
                Save Override
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedTarget(null);
                  setAllow(0);
                  setDeny(0);
                }}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Active Overrides List */}
      {isLoading ? (
        <div className="text-sm text-white/40 py-4 text-center">Loading overrides...</div>
      ) : activeOverrides.length > 0 ? (
        <div className="space-y-2">
          <h5 className="text-sm font-medium">Active Permission Overrides</h5>
          <div className="space-y-2">
            {activeOverrides.map((override) => (
              <ActiveOverrideItem
                key={override.id}
                override={override}
                displayName={resolveTargetName(override.targetType, override.targetId)}
                onEdit={() => handleEditOverride(override)}
                onDelete={() => handleDeleteOverride(override.id)}
                isDeleting={isSaving}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Help Text */}
      <div className="p-3 rounded-lg bg-blue-500/15 border border-blue-500/30">
        <p className="text-sm text-blue-300">
          <strong className="text-blue-200">Permission Hierarchy:</strong> User-specific overrides (highest) → Channel overrides → Category overrides → Server permissions (lowest)
        </p>
      </div>
    </div>
  );
}

// Real RoleUserSelector with search and actual data
interface RoleUserSelectorProps {
  channelId: string;
  serverId: string;
  roles: Role[];
  members: MemberWithProfile[];
  existingOverrides: ChannelPermissionOverride[];
  onSelect: (type: "role" | "user", id: string, name: string) => void;
}

function RoleUserSelector({ roles, members, existingOverrides, onSelect }: RoleUserSelectorProps) {
  const [mode, setMode] = useState<"role" | "user">("role");
  const [search, setSearch] = useState("");

  const existingTargets = useMemo(() => {
    const set = new Set<string>();
    for (const o of existingOverrides) {
      set.add(`${o.targetType}:${o.targetId}`);
    }
    return set;
  }, [existingOverrides]);

  const filteredRoles = useMemo(() => {
    if (!search) return roles;
    const q = search.toLowerCase();
    return roles.filter(r => r.name.toLowerCase().includes(q));
  }, [roles, search]);

  const filteredMembers = useMemo(() => {
    if (!search) return members;
    const q = search.toLowerCase();
    return members.filter(m =>
      m.displayName.toLowerCase().includes(q) ||
      m.username.toLowerCase().includes(q)
    );
  }, [members, search]);

  return (
    <div className="space-y-3">
      {/* Mode Selector */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => { setMode("role"); setSearch(""); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            mode === "role"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
              : "bg-white/5 text-white/60 hover:bg-white/10"
          )}
        >
          <Users className="w-4 h-4" />
          Roles ({roles.length})
        </button>
        <button
          type="button"
          onClick={() => { setMode("user"); setSearch(""); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            mode === "user"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
              : "bg-white/5 text-white/60 hover:bg-white/10"
          )}
        >
          <User className="w-4 h-4" />
          Users ({members.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={mode === "role" ? "Search roles..." : "Search users..."}
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/80 placeholder:text-white/30 focus:outline-hidden focus:border-purple-500/40"
        />
      </div>

      {/* List */}
      {mode === "role" ? (
        <div className="max-h-[200px] overflow-y-auto settings-scrollbar space-y-1">
          {filteredRoles.length === 0 ? (
            <p className="text-xs text-white/40 py-3 text-center">No roles found</p>
          ) : (
            filteredRoles.map(role => {
              const hasOverride = existingTargets.has(`role:${role.id}`);
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => onSelect("role", role.id, role.name)}
                  className={cn(
                    "w-full flex items-center gap-2.5 p-2.5 rounded-lg transition-all text-left",
                    hasOverride
                      ? "bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/15"
                      : "hover:bg-white/10 border border-transparent"
                  )}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0 ring-1 ring-white/20"
                    style={{ backgroundColor: role.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-white/80 truncate block">{role.name}</span>
                  </div>
                  {hasOverride && (
                    <span className="text-[10px] text-purple-400 shrink-0">has override</span>
                  )}
                  {role.isDefault && (
                    <span className="text-[10px] text-white/30 shrink-0">default</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      ) : (
        <div className="max-h-[200px] overflow-y-auto settings-scrollbar space-y-1">
          {filteredMembers.length === 0 ? (
            <p className="text-xs text-white/40 py-3 text-center">No users found</p>
          ) : (
            filteredMembers.map(member => {
              const hasOverride = existingTargets.has(`user:${member.userId}`);
              return (
                <button
                  key={member.userId}
                  type="button"
                  onClick={() => onSelect("user", member.userId, member.displayName)}
                  className={cn(
                    "w-full flex items-center gap-2.5 p-2.5 rounded-lg transition-all text-left",
                    hasOverride
                      ? "bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/15"
                      : "hover:bg-white/10 border border-transparent"
                  )}
                >
                  <Avatar
                    src={member.avatar || undefined}
                    fallback={member.displayName?.[0]?.toUpperCase() || "?"}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-white/80 truncate block">{member.displayName}</span>
                    <span className="text-[10px] text-white/40">@{member.username}</span>
                  </div>
                  {hasOverride && (
                    <span className="text-[10px] text-purple-400 shrink-0">has override</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// Active Override Item Component
interface ActiveOverrideItemProps {
  override: ChannelPermissionOverride;
  displayName: string;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function ActiveOverrideItem({ override, displayName, onEdit, onDelete, isDeleting }: ActiveOverrideItemProps) {
  const allowCount = countBits(override.allow);
  const denyCount = countBits(override.deny);

  return (
    <div className="p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {override.targetType === "role" ? (
            <Users className="w-4 h-4 text-white/60" />
          ) : (
            <User className="w-4 h-4 text-white/60" />
          )}
          <div>
            <div className="font-medium text-sm">{displayName}</div>
            <div className="text-xs text-white/60 mt-0.5">
              {allowCount > 0 && <span className="text-green-400">+{allowCount} allowed</span>}
              {allowCount > 0 && denyCount > 0 && <span className="text-white/40"> • </span>}
              {denyCount > 0 && <span className="text-red-400">-{denyCount} denied</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={onEdit} className="gap-1">
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={onDelete}
            loading={isDeleting}
            className="gap-1"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper function to count set bits in a number
function countBits(n: number): number {
  let count = 0;
  while (n) {
    count += n & 1;
    n >>= 1;
  }
  return count;
}
