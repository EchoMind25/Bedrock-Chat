"use client";

import { Info } from "lucide-react";
import { Tooltip } from "../../ui/tooltip/tooltip";
import { cn } from "../../../lib/utils/cn";

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
          : "hover:bg-slate-800/30",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        disabled={disabled}
        className="w-4 h-4 rounded-sm border-slate-600 bg-slate-800/50 checked:bg-blue-500 checked:border-blue-500 focus:ring-2 focus:ring-blue-500/50 cursor-pointer disabled:cursor-not-allowed"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-200 truncate">{name}</span>
          <Tooltip content={description} position="top">
            <Info className="w-4 h-4 text-slate-400 hover:text-slate-300 transition-colors shrink-0" />
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
          <span className="text-sm font-medium text-slate-200 truncate">{name}</span>
          <Tooltip content={description} position="top">
            <Info className="w-4 h-4 text-slate-400 hover:text-slate-300 transition-colors shrink-0" />
          </Tooltip>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange("allow")}
          disabled={disabled}
          className={cn(
            "px-3 py-1.5 rounded-sm text-xs font-medium transition-colors",
            value === "allow"
              ? "bg-green-500 text-white"
              : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-slate-100",
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
            "px-3 py-1.5 rounded-sm text-xs font-medium transition-colors",
            value === "neutral"
              ? "bg-slate-500 text-white"
              : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-slate-100",
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
            "px-3 py-1.5 rounded-sm text-xs font-medium transition-colors",
            value === "deny"
              ? "bg-red-500 text-white"
              : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-slate-100",
            disabled && "cursor-not-allowed",
          )}
        >
          Deny
        </button>
      </div>
    </div>
  );
}
