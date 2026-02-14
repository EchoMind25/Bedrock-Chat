"use client";

import { useState } from "react";
import { Shield, Plus, X, User, Users } from "lucide-react";
import { Button } from "../../../ui/button/button";
import { PermissionOverrideGrid } from "../../permission-grid/permission-grid";
import { motion, AnimatePresence } from "motion/react";
import type { Channel } from "../../../../lib/types/server";
import type { ChannelPermissionOverride } from "../../../../lib/types/permissions";
import { cn } from "../../../../lib/utils/cn";

interface PermissionsTabProps {
  channel: Channel;
  onSave?: (overrides: ChannelPermissionOverride[]) => Promise<void>;
}

export function PermissionsTab({ channel, onSave }: PermissionsTabProps) {
  const [selectedTarget, setSelectedTarget] = useState<{
    type: "role" | "user";
    id: string;
    name: string;
  } | null>(null);
  const [allow, setAllow] = useState(0);
  const [deny, setDeny] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [activeOverrides, setActiveOverrides] = useState<ChannelPermissionOverride[]>(
    channel.permissionOverrides || []
  );

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
      if (onSave) {
        await onSave(updatedOverrides);
      }
    } catch (err) {
      console.error("Error deleting permission override:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditOverride = (override: ChannelPermissionOverride) => {
    // Find the target name (role or user)
    // For now, use placeholder name - will be enhanced when integrated with real data
    setSelectedTarget({
      type: override.targetType,
      id: override.targetId,
      name: override.targetType === "role" ? "Role" : "User",
    });
    setAllow(override.allow);
    setDeny(override.deny);
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
            onSelect={(type, id, name) => {
              setSelectedTarget({ type, id, name });
              setAllow(0);
              setDeny(0);
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
      {activeOverrides.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium">Active Permission Overrides</h5>
          <div className="space-y-2">
            {activeOverrides.map((override) => (
              <ActiveOverrideItem
                key={override.id}
                override={override}
                onEdit={() => handleEditOverride(override)}
                onDelete={() => handleDeleteOverride(override.id)}
                isDeleting={isSaving}
              />
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="p-3 rounded-lg bg-blue-500/15 border border-blue-500/30">
        <p className="text-sm text-blue-300">
          <strong className="text-blue-200">Permission Hierarchy:</strong> User-specific overrides (highest) → Channel overrides → Category overrides → Server permissions (lowest)
        </p>
      </div>
    </div>
  );
}

// Simplified RoleUserSelector (will be enhanced when integrated with real data)
interface RoleUserSelectorProps {
  channelId: string;
  serverId: string;
  onSelect: (type: "role" | "user", id: string, name: string) => void;
}

function RoleUserSelector({ channelId, serverId, onSelect }: RoleUserSelectorProps) {
  const [mode, setMode] = useState<"role" | "user">("role");

  return (
    <div className="space-y-3">
      {/* Mode Selector */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("role")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            mode === "role"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
              : "bg-white/5 text-white/60 hover:bg-white/10"
          )}
        >
          <Users className="w-4 h-4" />
          Role
        </button>
        <button
          type="button"
          onClick={() => setMode("user")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            mode === "user"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
              : "bg-white/5 text-white/60 hover:bg-white/10"
          )}
        >
          <User className="w-4 h-4" />
          User
        </button>
      </div>

      {/* Placeholder: Will be replaced with actual role/user selection */}
      <div className="p-3 rounded-lg bg-yellow-500/15 border border-yellow-500/30">
        <p className="text-xs text-yellow-300">
          <strong className="text-yellow-200">Coming Soon:</strong> Full role/user selector with search and filtering. For now, use the server settings to manage base permissions.
        </p>
      </div>

      {/* Quick test button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onSelect(mode, "test-id", mode === "role" ? "@everyone" : "Test User")}
        className="w-full gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Test {mode === "role" ? "Role" : "User"} Override
      </Button>
    </div>
  );
}

// Active Override Item Component
interface ActiveOverrideItemProps {
  override: ChannelPermissionOverride;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function ActiveOverrideItem({ override, onEdit, onDelete, isDeleting }: ActiveOverrideItemProps) {
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
            <div className="font-medium text-sm">
              {override.targetType === "role" ? "Role" : "User"}
            </div>
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
