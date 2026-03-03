"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useImportStore } from "@/store/import.store";
import { ALL_BEDROCK_PERMISSIONS } from "@/lib/services/discord-permission-mapper";
import type { BedrockPermission } from "@/lib/types/server-definition";

const spring = { type: "spring" as const, stiffness: 260, damping: 20, mass: 1 };

const PRESET_COLORS = [
  "oklch(0.65 0.25 265)", // blue (primary)
  "oklch(0.72 0.20 145)", // green
  "oklch(0.65 0.25 25)",  // red
  "oklch(0.80 0.18 85)",  // yellow
  "oklch(0.65 0.20 310)", // purple
  "oklch(0.70 0.18 200)", // teal
  "oklch(0.65 0.20 50)",  // orange
  "oklch(0.60 0.20 340)", // pink
];

function PermissionGrid({
  permissions,
  onToggle,
}: {
  permissions: BedrockPermission[];
  onToggle: (perm: BedrockPermission) => void;
}) {
  const grouped = {
    text: ALL_BEDROCK_PERMISSIONS.filter((p) => p.category === "text"),
    voice: ALL_BEDROCK_PERMISSIONS.filter((p) => p.category === "voice"),
    moderation: ALL_BEDROCK_PERMISSIONS.filter((p) => p.category === "moderation"),
    general: ALL_BEDROCK_PERMISSIONS.filter((p) => p.category === "general"),
  };

  return (
    <div className="space-y-3">
      {(
        Object.entries(grouped) as [string, typeof ALL_BEDROCK_PERMISSIONS][]
      ).map(([category, perms]) => (
        <div key={category}>
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1.5">
            {category}
          </p>
          <div className="grid grid-cols-2 gap-1">
            {perms.map((p) => {
              const active = permissions.includes(p.value);
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => onToggle(p.value)}
                  className={`px-2 py-1.5 rounded text-xs text-left transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
                    active
                      ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                      : "text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent"
                  }`}
                  aria-pressed={active}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StepRoles() {
  const roles = useImportStore((s) => s.roles);
  const addRole = useImportStore((s) => s.addRole);
  const removeRole = useImportStore((s) => s.removeRole);
  const updateRole = useImportStore((s) => s.updateRole);
  const toggleRolePermission = useImportStore((s) => s.toggleRolePermission);
  const nextGuidedStep = useImportStore((s) => s.nextGuidedStep);
  const prevGuidedStep = useImportStore((s) => s.prevGuidedStep);

  const [newRoleName, setNewRoleName] = useState("");
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = useCallback(() => {
    const trimmed = newRoleName.trim();
    if (!trimmed) return;
    if (roles.some((r) => r.name.toLowerCase() === trimmed.toLowerCase())) {
      setError("A role with that name already exists");
      return;
    }
    const colorIndex = roles.length % PRESET_COLORS.length;
    addRole(trimmed, PRESET_COLORS[colorIndex]);
    setNewRoleName("");
    setError(null);
  }, [newRoleName, roles, addRole]);

  const handleNext = useCallback(() => {
    if (roles.length === 0) {
      setError("Add at least one role (a default Member role will be created if you skip)");
    }
    setError(null);
    nextGuidedStep();
  }, [roles.length, nextGuidedStep]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Set up your roles
        </h2>
        <p className="text-sm text-white/50 mt-1">
          Roles control what members can do. Click a role to expand its
          permissions.
        </p>
      </div>

      {/* Role list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {roles.map((role) => (
            <motion.div
              key={role.ref_id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={spring}
              className="rounded-lg border border-white/10 overflow-hidden"
            >
              {/* Role header */}
              <div className="flex items-center gap-3 p-3 bg-white/5">
                {/* Color dot */}
                <span
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: role.color ?? "oklch(0.5 0 0)" }}
                  aria-hidden="true"
                />

                {/* Name */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedRole(
                      expandedRole === role.ref_id ? null : role.ref_id,
                    )
                  }
                  className="text-sm text-white/80 flex-1 text-left min-w-0 truncate focus-visible:outline-2 focus-visible:outline-primary"
                  aria-expanded={expandedRole === role.ref_id}
                >
                  {role.name}
                  {role.is_default && (
                    <span className="ml-2 text-xs text-white/30">(default)</span>
                  )}
                </button>

                {/* Permission count */}
                <span className="text-xs text-white/30 shrink-0">
                  {role.permissions.length} perms
                </span>

                {/* Default toggle */}
                {!role.is_default && (
                  <button
                    type="button"
                    onClick={() => {
                      // Unset all defaults, then set this one
                      for (const r of roles) {
                        if (r.is_default) updateRole(r.ref_id, { is_default: false });
                      }
                      updateRole(role.ref_id, { is_default: true });
                    }}
                    className="text-[10px] text-white/30 hover:text-blue-400 transition-colors px-2 py-0.5 border border-white/10 rounded focus-visible:outline-2 focus-visible:outline-primary"
                    title="Set as default role for new members"
                  >
                    Set default
                  </button>
                )}

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => removeRole(role.ref_id)}
                  className="p-1.5 text-white/30 hover:text-red-400 transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-primary"
                  aria-label={`Remove ${role.name}`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>

              {/* Expanded permissions */}
              <AnimatePresence>
                {expandedRole === role.ref_id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={spring}
                    className="overflow-hidden"
                  >
                    <div className="p-3 border-t border-white/5 space-y-3">
                      {/* Color picker */}
                      <div>
                        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1.5">
                          Color
                        </p>
                        <div className="flex gap-1.5 flex-wrap">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => updateRole(role.ref_id, { color })}
                              className={`w-6 h-6 rounded-full transition-transform focus-visible:outline-2 focus-visible:outline-primary ${
                                role.color === color ? "scale-125 ring-2 ring-white/30" : "hover:scale-110"
                              }`}
                              style={{ backgroundColor: color }}
                              aria-label={`Select color`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Permissions */}
                      <PermissionGrid
                        permissions={role.permissions}
                        onToggle={(perm) => toggleRolePermission(role.ref_id, perm)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {roles.length === 0 && (
          <p className="text-sm text-white/30 text-center py-4">
            No roles yet. A default &quot;Member&quot; role will be created
            automatically if you skip this step.
          </p>
        )}
      </div>

      {/* Add role */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newRoleName}
          onChange={(e) => {
            setNewRoleName(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="New role name (e.g. Moderator)"
          maxLength={100}
          className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 outline-hidden focus:ring-2 focus:ring-blue-500/50 min-h-[44px]"
          aria-label="New role name"
        />
        <motion.button
          type="button"
          onClick={handleAdd}
          disabled={!newRoleName.trim()}
          className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm text-white/70 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={spring}
        >
          Add
        </motion.button>
      </div>

      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <motion.button
          type="button"
          onClick={prevGuidedStep}
          className="px-5 py-2.5 text-sm font-medium rounded-lg border border-white/10 text-white/70 hover:bg-white/5 transition-colors min-h-[44px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={spring}
        >
          Back
        </motion.button>
        <motion.button
          type="button"
          onClick={handleNext}
          className="px-5 py-2.5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors min-h-[44px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={spring}
        >
          Next
        </motion.button>
      </div>
    </div>
  );
}
