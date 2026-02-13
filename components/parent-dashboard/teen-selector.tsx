"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/avatar/avatar";
import { MONITORING_LEVELS } from "@/lib/types/family";
import type { TeenAccount } from "@/lib/types/family";

interface TeenSelectorProps {
  teenAccounts: TeenAccount[];
  selectedTeenId: string | null;
  onSelect: (id: string) => void;
}

export function TeenSelector({
  teenAccounts,
  selectedTeenId,
  onSelect,
}: TeenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedTeen = teenAccounts.find((t) => t.id === selectedTeenId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (teenAccounts.length === 0) {
    return (
      <div
        className="rounded-lg px-4 py-3 text-sm"
        style={{
          background: "var(--pd-bg-secondary)",
          color: "var(--pd-text-muted)",
        }}
      >
        No teen accounts linked
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors"
        style={{
          border: "1px solid var(--pd-border)",
          background: "var(--pd-surface)",
          color: "var(--pd-text)",
        }}
      >
        {selectedTeen ? (
          <>
            <Avatar
              src={selectedTeen.user.avatar}
              fallback={selectedTeen.user.displayName}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">
                {selectedTeen.user.displayName}
              </p>
              <p className="text-xs" style={{ color: "var(--pd-text-muted)" }}>
                Level {selectedTeen.monitoringLevel} -{" "}
                {MONITORING_LEVELS[selectedTeen.monitoringLevel].name}
              </p>
            </div>
          </>
        ) : (
          <span
            className="flex-1 text-sm"
            style={{ color: "var(--pd-text-muted)" }}
          >
            Select a teen account
          </span>
        )}
        <ChevronDown
          className="h-4 w-4 shrink-0 transition-transform"
          style={{
            color: "var(--pd-text-muted)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg shadow-lg"
          style={{
            border: "1px solid var(--pd-border)",
            background: "var(--pd-surface)",
          }}
        >
          {teenAccounts.map((teen) => {
            const isSelected = teen.id === selectedTeenId;
            return (
              <button
                key={teen.id}
                type="button"
                onClick={() => {
                  onSelect(teen.id);
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                style={{
                  background: isSelected
                    ? "var(--pd-primary-light)"
                    : "transparent",
                  color: "var(--pd-text)",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background =
                      "var(--pd-bg-secondary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <Avatar
                  src={teen.user.avatar}
                  fallback={teen.user.displayName}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">
                    {teen.user.displayName}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--pd-text-muted)" }}
                  >
                    Level {teen.monitoringLevel} -{" "}
                    {MONITORING_LEVELS[teen.monitoringLevel].name}
                  </p>
                </div>
                {isSelected && (
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--pd-primary)" }}
                  >
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export type { TeenSelectorProps };
