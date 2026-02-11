"use client";

import { Info } from "lucide-react";
import { Tooltip } from "../../ui/tooltip/tooltip";

interface PermissionRowProps {
  name: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function PermissionRow({
  name,
  description,
  checked,
  onToggle,
  disabled,
}: PermissionRowProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-white/5",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        disabled={disabled}
        className="w-4 h-4 rounded border-white/20 bg-white/5 checked:bg-blue-500 checked:border-blue-500 focus:ring-2 focus:ring-blue-500/50 cursor-pointer disabled:cursor-not-allowed"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{name}</span>
          <Tooltip content={description} position="top">
            <Info className="w-4 h-4 text-white/40 hover:text-white/60 transition-colors flex-shrink-0" />
          </Tooltip>
        </div>
      </div>
    </label>
  );
}

// Three-state permission row for overrides
interface ThreeStatePermissionRowProps {
  name: string;
  description: string;
  value: "allow" | "neutral" | "deny";
  onChange: (value: "allow" | "neutral" | "deny") => void;
  disabled?: boolean;
}

export function ThreeStatePermissionRow({
  name,
  description,
  value,
  onChange,
  disabled,
}: ThreeStatePermissionRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg",
        disabled && "opacity-50",
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{name}</span>
          <Tooltip content={description} position="top">
            <Info className="w-4 h-4 text-white/40 hover:text-white/60 transition-colors flex-shrink-0" />
          </Tooltip>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange("allow")}
          disabled={disabled}
          className={cn(
            "px-3 py-1.5 rounded text-xs font-medium transition-colors",
            value === "allow"
              ? "bg-green-500 text-white"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80",
            disabled && "cursor-not-allowed",
          )}
        >
          Allow
        </button>
        <button
          type="button"
          onClick={() => onChange("neutral")}
          disabled={disabled}
          className={cn(
            "px-3 py-1.5 rounded text-xs font-medium transition-colors",
            value === "neutral"
              ? "bg-gray-500 text-white"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80",
            disabled && "cursor-not-allowed",
          )}
        >
          Neutral
        </button>
        <button
          type="button"
          onClick={() => onChange("deny")}
          disabled={disabled}
          className={cn(
            "px-3 py-1.5 rounded text-xs font-medium transition-colors",
            value === "deny"
              ? "bg-red-500 text-white"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80",
            disabled && "cursor-not-allowed",
          )}
        >
          Deny
        </button>
      </div>
    </div>
  );
}

// Helper import
import { cn } from "../../../lib/utils/cn";
