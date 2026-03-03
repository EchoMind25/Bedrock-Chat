"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useImportStore } from "@/store/import.store";

const spring = { type: "spring" as const, stiffness: 260, damping: 20, mass: 1 };

export function StepCategories() {
  const categories = useImportStore((s) => s.categories);
  const addCategory = useImportStore((s) => s.addCategory);
  const removeCategory = useImportStore((s) => s.removeCategory);
  const renameCategory = useImportStore((s) => s.renameCategory);
  const reorderCategories = useImportStore((s) => s.reorderCategories);
  const nextGuidedStep = useImportStore((s) => s.nextGuidedStep);
  const prevGuidedStep = useImportStore((s) => s.prevGuidedStep);

  const [newCatName, setNewCatName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = useCallback(() => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError("A category with that name already exists");
      return;
    }
    addCategory(trimmed);
    setNewCatName("");
    setError(null);
  }, [newCatName, categories, addCategory]);

  const handleRename = useCallback(
    (refId: string) => {
      const trimmed = editValue.trim();
      if (!trimmed) return;
      renameCategory(refId, trimmed);
      setEditingId(null);
    },
    [editValue, renameCategory],
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index > 0) reorderCategories(index, index - 1);
    },
    [reorderCategories],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index < categories.length - 1) reorderCategories(index, index + 1);
    },
    [categories.length, reorderCategories],
  );

  const handleNext = useCallback(() => {
    if (categories.length === 0) {
      setError("Add at least one category");
      return;
    }
    setError(null);
    nextGuidedStep();
  }, [categories.length, nextGuidedStep]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Set up your categories
        </h2>
        <p className="text-sm text-white/50 mt-1">
          Categories group your channels (like &quot;Text Channels&quot; or
          &quot;Voice Channels&quot; in Discord).
        </p>
      </div>

      {/* Category list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.ref_id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={spring}
              className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10"
            >
              {/* Reorder arrows */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleMoveUp(i)}
                  disabled={i === 0}
                  className="p-0.5 text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                  aria-label={`Move ${cat.name} up`}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveDown(i)}
                  disabled={i === categories.length - 1}
                  className="p-0.5 text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                  aria-label={`Move ${cat.name} down`}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Name (inline edit) */}
              <div className="flex-1 min-w-0">
                {editingId === cat.ref_id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleRename(cat.ref_id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(cat.ref_id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="w-full px-2 py-1 text-sm bg-white/10 rounded border border-white/20 text-white outline-hidden focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(cat.ref_id);
                      setEditValue(cat.name);
                    }}
                    className="text-sm text-white/80 hover:text-white truncate block text-left w-full focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    {cat.name}
                  </button>
                )}
              </div>

              {/* Delete */}
              <button
                type="button"
                onClick={() => removeCategory(cat.ref_id)}
                className="p-1.5 text-white/30 hover:text-red-400 transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-primary"
                aria-label={`Remove ${cat.name}`}
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {categories.length === 0 && (
          <p className="text-sm text-white/30 text-center py-4">
            No categories yet. Add your first one below.
          </p>
        )}
      </div>

      {/* Add category */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newCatName}
          onChange={(e) => {
            setNewCatName(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="New category name"
          maxLength={100}
          className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 outline-hidden focus:ring-2 focus:ring-blue-500/50 min-h-[44px]"
          aria-label="New category name"
        />
        <motion.button
          type="button"
          onClick={handleAdd}
          disabled={!newCatName.trim()}
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
