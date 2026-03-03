"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import type { ServerDefinition, ChannelDefinition } from "@/lib/types/server-definition";

const spring = { type: "spring" as const, stiffness: 260, damping: 20, mass: 1 };

function ChannelIcon({ type, className }: { type: ChannelDefinition["type"]; className?: string }) {
  if (type === "voice") {
    return (
      <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H3.167a.75.75 0 00-.7.48A6.985 6.985 0 002 10c0 .887.165 1.737.468 2.52.111.29.39.48.7.48h1.535l4.033 3.796A.75.75 0 0010 16.25V3.75z" />
      </svg>
    );
  }
  if (type === "announcement") {
    return (
      <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M13.92 3.845a19.361 19.361 0 01-6.3 1.98C6.765 5.942 5.89 6 5 6a4 4 0 00-.504.032l-.21.055A4 4 0 001 10c0 1.193.525 2.265 1.356 2.993a18.82 18.82 0 00-.521 2.828.75.75 0 001.09.756l2.243-1.339c.234.078.472.147.715.206a19.39 19.39 0 018.037 1.401.75.75 0 001.08-.67V4.515a.75.75 0 00-1.08-.67zm2.33-.67a.75.75 0 011.5 0v13.65a.75.75 0 01-1.5 0V3.175z" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M9.493 2.852a.75.75 0 00-1.486-.204L6.956 6H3.25a.75.75 0 000 1.5h3.45l-.857 5H2.25a.75.75 0 000 1.5H5.59l-.874 5.148a.75.75 0 001.486.204L7.26 14h4.58l-.874 5.148a.75.75 0 001.486.204L13.51 14h3.74a.75.75 0 000-1.5h-3.484l.857-5h3.627a.75.75 0 000-1.5h-3.37l.873-5.148a.75.75 0 00-1.486-.204L12.74 6H8.16l.874-5.148zM8.417 7.5l-.857 5h4.58l.857-5H8.417z" clipRule="evenodd" />
    </svg>
  );
}

interface ServerPreviewProps {
  definition: ServerDefinition;
}

export function ServerPreview({ definition }: ServerPreviewProps) {
  const channelsByCategory = useMemo(() => {
    const map = new Map<string, ChannelDefinition[]>();
    for (const cat of definition.categories) {
      map.set(cat.ref_id, []);
    }
    for (const ch of definition.channels) {
      if (ch.category_ref && map.has(ch.category_ref)) {
        map.get(ch.category_ref)!.push(ch);
      }
    }
    // Sort channels within each category
    for (const channels of map.values()) {
      channels.sort((a, b) => a.position - b.position);
    }
    return map;
  }, [definition.categories, definition.channels]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="rounded-xl border border-white/10 overflow-hidden"
    >
      {/* Server header */}
      <div className="px-4 py-3 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <span className="text-lg font-bold text-blue-400">
              {definition.server.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">
              {definition.server.name}
            </h3>
            {definition.server.description && (
              <p className="text-xs text-white/40 truncate">
                {definition.server.description}
              </p>
            )}
          </div>
          {definition.server.family_safe && (
            <span className="ml-auto text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full shrink-0">
              Family Safe
            </span>
          )}
        </div>
      </div>

      {/* Channel structure */}
      <div className="p-3 space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
        {definition.categories
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((cat) => {
            const channels = channelsByCategory.get(cat.ref_id) || [];
            return (
              <div key={cat.ref_id}>
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">
                  {cat.name}
                </p>
                <div className="space-y-0.5 ml-1">
                  {channels.map((ch) => (
                    <div
                      key={ch.ref_id}
                      className="flex items-center gap-1.5 text-sm text-white/50 py-0.5"
                    >
                      <ChannelIcon
                        type={ch.type}
                        className="w-3.5 h-3.5 shrink-0"
                      />
                      <span className="truncate">{ch.name}</span>
                      {ch.nsfw && (
                        <span className="text-[9px] text-red-400 bg-red-500/10 px-1 rounded">
                          NSFW
                        </span>
                      )}
                    </div>
                  ))}
                  {channels.length === 0 && (
                    <p className="text-xs text-white/20 italic">
                      No channels
                    </p>
                  )}
                </div>
              </div>
            );
          })}

        {/* Roles section */}
        {definition.roles.length > 0 && (
          <div className="pt-2 border-t border-white/5">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">
              Roles
            </p>
            <div className="space-y-0.5 ml-1">
              {definition.roles
                .slice()
                .sort((a, b) => a.position - b.position)
                .map((role) => (
                  <div
                    key={role.ref_id}
                    className="flex items-center gap-1.5 text-sm text-white/50"
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{
                        backgroundColor: role.color || "oklch(0.5 0 0)",
                      }}
                      aria-hidden="true"
                    />
                    <span className="truncate">{role.name}</span>
                    {role.is_default && (
                      <span className="text-[9px] text-white/25">
                        (default)
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
