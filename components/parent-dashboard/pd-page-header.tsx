"use client";

import type { ReactNode } from "react";

interface PdPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PdPageHeader({ title, description, actions }: PdPageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--pd-text)" }}
        >
          {title}
        </h1>
        {description && (
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--pd-text-muted)" }}
          >
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export type { PdPageHeaderProps };
