"use client";

import { type HTMLAttributes } from "react";
import {
  PERMISSION_CATEGORIES,
  Permission,
  hasPermission,
  togglePermission,
  type PermissionValue,
} from "../../../lib/types/permissions";
import { PermissionRow, ThreeStatePermissionRow } from "./permission-row";
import { cn } from "../../../lib/utils/cn";

interface PermissionGridProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  permissions: number;
  onChange: (permissions: number) => void;
  mode?: "checkbox"; // Only checkbox mode for now
}

export function PermissionGrid({
  permissions,
  onChange,
  mode = "checkbox",
  className,
  ...props
}: PermissionGridProps) {
  const handleToggle = (permission: Permission) => {
    const newPermissions = togglePermission(permissions, permission);
    onChange(newPermissions);
  };

  // Check if Administrator permission is set
  const isAdmin = hasPermission(permissions, Permission.ADMINISTRATOR);

  return (
    <div className={cn("space-y-6", className)} {...props}>
      {Object.entries(PERMISSION_CATEGORIES).map(([category, perms]) => (
        <div key={category} className="space-y-2">
          <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
            {category.replace("_", " ")}
          </h4>
          <div className="space-y-1">
            {perms.map(({ permission, name, description }) => (
              <PermissionRow
                key={permission}
                name={name}
                description={description}
                checked={hasPermission(permissions, permission)}
                onToggle={() => handleToggle(permission)}
                disabled={isAdmin && permission !== Permission.ADMINISTRATOR}
              />
            ))}
          </div>
        </div>
      ))}

      {isAdmin && (
        <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-500/30">
          <p className="text-sm text-blue-200">
            <strong>Administrator</strong> permission grants all permissions automatically.
          </p>
        </div>
      )}
    </div>
  );
}

// Three-state permission grid for overrides
interface PermissionOverrideGridProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  allow: number;
  deny: number;
  onChange: (allow: number, deny: number) => void;
}

export function PermissionOverrideGrid({
  allow,
  deny,
  onChange,
  className,
  ...props
}: PermissionOverrideGridProps) {
  const handleChange = (permission: Permission, value: PermissionValue) => {
    let newAllow = allow;
    let newDeny = deny;

    if (value === "allow") {
      newAllow = newAllow | permission; // Add to allow
      newDeny = newDeny & ~permission; // Remove from deny
    } else if (value === "deny") {
      newDeny = newDeny | permission; // Add to deny
      newAllow = newAllow & ~permission; // Remove from allow
    } else {
      // Neutral - remove from both
      newAllow = newAllow & ~permission;
      newDeny = newDeny & ~permission;
    }

    onChange(newAllow, newDeny);
  };

  const getValue = (permission: Permission): PermissionValue => {
    if ((allow & permission) === permission) return "allow";
    if ((deny & permission) === permission) return "deny";
    return "neutral";
  };

  return (
    <div className={cn("space-y-6", className)} {...props}>
      {Object.entries(PERMISSION_CATEGORIES).map(([category, perms]) => (
        <div key={category} className="space-y-2">
          <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
            {category.replace("_", " ")}
          </h4>
          <div className="space-y-1">
            {perms.map(({ permission, name, description }) => (
              <ThreeStatePermissionRow
                key={permission}
                name={name}
                description={description}
                value={getValue(permission)}
                onChange={(value) => handleChange(permission, value)}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
        <p className="text-sm text-yellow-200">
          <strong>Allow</strong> grants the permission, <strong>Deny</strong> removes it, and{" "}
          <strong>Neutral</strong> inherits from role permissions.
        </p>
      </div>
    </div>
  );
}
