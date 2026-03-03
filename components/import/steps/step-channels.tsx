"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useImportStore } from "@/store/import.store";
import type { ChannelDefinition } from "@/lib/types/server-definition";

const spring = { type: "spring" as const, stiffness: 260, damping: 20, mass: 1 };

const CHANNEL_TYPE_OPTIONS = [
  { value: "text" as const, label: "Text", icon: "#" },
  { value: "voice" as const, label: "Voice", icon: "V" },
  { value: "announcement" as const, label: "Announcement", icon: "A" },
];

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

export function StepChannels() {
  const categories = useImportStore((s) => s.categories);
  const channels = useImportStore((s) => s.channels);
  const addChannel = useImportStore((s) => s.addChannel);
  const removeChannel = useImportStore((s) => s.removeChannel);
  const updateChannel = useImportStore((s) => s.updateChannel);
  const nextGuidedStep = useImportStore((s) => s.nextGuidedStep);
  const prevGuidedStep = useImportStore((s) => s.prevGuidedStep);

  const [activeCatRef, setActiveCatRef] = useState<string>(
    categories[0]?.ref_id ?? "",
  );
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelType, setNewChannelType] = useState<ChannelDefinition["type"]>("text");
  const [error, setError] = useState<string | null>(null);

  const channelsByCategory = useMemo(() => {
    const map = new Map<string, ChannelDefinition[]>();
    for (const cat of categories) {
      map.set(
        cat.ref_id,
        channels
          .filter((ch) => ch.category_ref === cat.ref_id)
          .sort((a, b) => a.position - b.position),
      );
    }
    return map;
  }, [categories, channels]);

  const activeChannels = channelsByCategory.get(activeCatRef) ?? [];

  const handleAdd = useCallback(() => {
    const name = newChannelName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-_]/g, "");
    if (!name) return;
    if (activeChannels.some((ch) => ch.name === name)) {
      setError("A channel with that name already exists in this category");
      return;
    }
    addChannel({
      name,
      type: newChannelType,
      category_ref: activeCatRef,
    });
    setNewChannelName("");
    setError(null);
  }, [newChannelName, newChannelType, activeCatRef, activeChannels, addChannel]);

  const handleNext = useCallback(() => {
    const totalChannels = channels.length;
    if (totalChannels === 0) {
      setError("Add at least one channel");
      return;
    }
    if (!channels.some((ch) => ch.type === "text")) {
      setError("You need at least one text channel");
      return;
    }
    setError(null);
    nextGuidedStep();
  }, [channels, nextGuidedStep]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Set up your channels
        </h2>
        <p className="text-sm text-white/50 mt-1">
          Add channels to each category. Text channels are for messaging, voice
          channels for calls.
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
        {categories.map((cat) => {
          const count = channelsByCategory.get(cat.ref_id)?.length ?? 0;
          return (
            <button
              key={cat.ref_id}
              type="button"
              onClick={() => setActiveCatRef(cat.ref_id)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors shrink-0 min-h-[36px] focus-visible:outline-2 focus-visible:outline-primary ${
                activeCatRef === cat.ref_id
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : "text-white/50 hover:text-white/70 hover:bg-white/5 border border-transparent"
              }`}
            >
              {cat.name}
              {count > 0 && (
                <span className="ml-1.5 text-xs opacity-60">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Channels in active category */}
      <div className="space-y-2 min-h-[120px]">
        <AnimatePresence mode="popLayout">
          {activeChannels.map((ch) => (
            <motion.div
              key={ch.ref_id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={spring}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
            >
              <ChannelIcon type={ch.type} className="w-4 h-4 text-white/40 shrink-0" />
              <span className="text-sm text-white/80 flex-1 min-w-0 truncate">
                {ch.name}
              </span>

              {/* Type selector */}
              <select
                value={ch.type}
                onChange={(e) =>
                  updateChannel(ch.ref_id, {
                    type: e.target.value as ChannelDefinition["type"],
                  })
                }
                className="text-xs bg-white/10 border border-white/10 rounded px-2 py-1 text-white/60 outline-hidden focus:ring-1 focus:ring-blue-500"
                aria-label={`Channel type for ${ch.name}`}
              >
                <option value="text">Text</option>
                <option value="voice">Voice</option>
                <option value="announcement">Announcement</option>
              </select>

              <button
                type="button"
                onClick={() => removeChannel(ch.ref_id)}
                className="p-1.5 text-white/30 hover:text-red-400 transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-primary"
                aria-label={`Remove ${ch.name}`}
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {activeChannels.length === 0 && (
          <p className="text-sm text-white/30 text-center py-4">
            No channels in this category yet.
          </p>
        )}
      </div>

      {/* Add channel */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newChannelName}
          onChange={(e) => {
            setNewChannelName(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="channel-name"
          maxLength={100}
          className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 outline-hidden focus:ring-2 focus:ring-blue-500/50 min-h-[44px]"
          aria-label="New channel name"
        />

        {/* Type selector */}
        <div className="flex border border-white/10 rounded-lg overflow-hidden shrink-0">
          {CHANNEL_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setNewChannelType(opt.value)}
              className={`px-3 py-2.5 text-xs font-medium transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-primary ${
                newChannelType === opt.value
                  ? "bg-blue-500/20 text-blue-300"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}
              aria-label={`${opt.label} channel type`}
              aria-pressed={newChannelType === opt.value}
            >
              {opt.icon}
            </button>
          ))}
        </div>

        <motion.button
          type="button"
          onClick={handleAdd}
          disabled={!newChannelName.trim()}
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

      {/* Total channel count */}
      <p className="text-xs text-white/30">
        {channels.length} channel{channels.length !== 1 ? "s" : ""} total across{" "}
        {categories.length} categories
      </p>

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
