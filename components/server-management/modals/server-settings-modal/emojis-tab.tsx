"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useServerEmojiStore } from "@/store/server-emoji.store";
import { EMOJI_LIMITS } from "@/lib/types/server-emoji";
import { useAuthStore } from "@/store/auth.store";

interface EmojisTabProps {
  serverId: string;
}

export function EmojisTab({ serverId }: EmojisTabProps) {
  const loadEmojis = useServerEmojiStore((s) => s.loadEmojis);
  const uploadEmoji = useServerEmojiStore((s) => s.uploadEmoji);
  const renameEmoji = useServerEmojiStore((s) => s.renameEmoji);
  const deleteEmoji = useServerEmojiStore((s) => s.deleteEmoji);
  const getServerEmojis = useServerEmojiStore((s) => s.getServerEmojis);
  const isLoading = useServerEmojiStore((s) => s.isLoading);
  const currentUser = useAuthStore((s) => s.user);

  const emojis = getServerEmojis(serverId);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const hasLoadedRef = useRef(false);

  // Load emojis on mount
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadEmojis(serverId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId]);

  // Focus rename input when editing
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // Counts
  const staticCount = useMemo(
    () => emojis.filter((e) => !e.isAnimated).length,
    [emojis],
  );
  const animatedCount = useMemo(
    () => emojis.filter((e) => e.isAnimated).length,
    [emojis],
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset input so the same file can be selected again
      e.target.value = "";

      setUploadError(null);

      // Validate mime type
      if (!EMOJI_LIMITS.allowedMimeTypes.includes(file.type as typeof EMOJI_LIMITS.allowedMimeTypes[number])) {
        setUploadError("Only PNG, GIF, and WebP files are allowed.");
        return;
      }

      // Validate file size
      if (file.size > EMOJI_LIMITS.maxFileSize) {
        setUploadError("File must be under 256KB.");
        return;
      }

      // Validate dimensions
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      try {
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            if (img.width > EMOJI_LIMITS.maxDimension || img.height > EMOJI_LIMITS.maxDimension) {
              reject(new Error(`Image must be ${EMOJI_LIMITS.maxDimension}x${EMOJI_LIMITS.maxDimension} or smaller.`));
            } else if (img.width < EMOJI_LIMITS.minDimension || img.height < EMOJI_LIMITS.minDimension) {
              reject(new Error(`Image must be at least ${EMOJI_LIMITS.minDimension}x${EMOJI_LIMITS.minDimension}.`));
            } else {
              resolve();
            }
          };
          img.onerror = () => reject(new Error("Could not read image file."));
          img.src = objectUrl;
        });
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Invalid image.");
        URL.revokeObjectURL(objectUrl);
        return;
      }
      URL.revokeObjectURL(objectUrl);

      // Derive name from filename (strip extension, sanitize)
      const rawName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_]/g, "_").slice(0, EMOJI_LIMITS.nameMaxLength);
      const name = rawName.length >= EMOJI_LIMITS.nameMinLength ? rawName : `emoji_${Date.now()}`;

      setIsUploading(true);
      try {
        await uploadEmoji(serverId, name, file, currentUser?.id || "unknown");
      } catch {
        // Store already toasts the error
      } finally {
        setIsUploading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serverId, currentUser?.id],
  );

  const handleRenameStart = useCallback((emojiId: string, currentName: string) => {
    setRenamingId(emojiId);
    setRenameValue(currentName);
  }, []);

  const handleRenameConfirm = useCallback(async () => {
    if (!renamingId) return;

    const trimmed = renameValue.trim().replace(/[^a-zA-Z0-9_]/g, "_");
    if (trimmed.length < EMOJI_LIMITS.nameMinLength) {
      return;
    }

    try {
      await renameEmoji(serverId, renamingId, trimmed);
    } catch {
      // Store already toasts the error
    }
    setRenamingId(null);
    setRenameValue("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renamingId, renameValue, serverId]);

  const handleRenameCancel = useCallback(() => {
    setRenamingId(null);
    setRenameValue("");
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingId) return;
    try {
      await deleteEmoji(serverId, deletingId);
    } catch {
      // Store already toasts the error
    }
    setDeletingId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletingId, serverId]);

  if (isLoading && emojis.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <motion.div
          className="h-8 w-8 rounded-full border-2 border-t-transparent"
          style={{ borderColor: "oklch(0.65 0.25 265)", borderTopColor: "transparent" }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-100 mb-1">Server Emojis</h3>
        <p className="text-sm" style={{ color: "oklch(0.65 0.02 285)" }}>
          Upload and manage custom emojis for your server members.
        </p>
      </div>

      {/* Emoji Counts */}
      <motion.div
        className="rounded-xl p-4 grid grid-cols-2 gap-4"
        style={{
          backgroundColor: "oklch(0.15 0.02 285 / 0.7)",
          border: "1px solid oklch(0.25 0.02 285 / 0.5)",
          backdropFilter: "blur(12px)",
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Static count */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-200">Static Emojis</span>
            <span className="text-xs" style={{ color: "oklch(0.60 0.02 285)" }}>
              {staticCount} / {EMOJI_LIMITS.static}
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: "oklch(0.20 0.02 285)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, oklch(0.55 0.25 265), oklch(0.65 0.20 265))",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${(staticCount / EMOJI_LIMITS.static) * 100}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            />
          </div>
        </div>

        {/* Animated count */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-200">Animated Emojis</span>
            <span className="text-xs" style={{ color: "oklch(0.60 0.02 285)" }}>
              {animatedCount} / {EMOJI_LIMITS.animated}
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: "oklch(0.20 0.02 285)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, oklch(0.55 0.22 150), oklch(0.65 0.18 150))",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${(animatedCount / EMOJI_LIMITS.animated) * 100}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Upload Section */}
      <motion.div
        className="rounded-xl p-6 space-y-4"
        style={{
          backgroundColor: "oklch(0.15 0.02 285 / 0.7)",
          border: "1px solid oklch(0.25 0.02 285 / 0.5)",
          backdropFilter: "blur(12px)",
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.05 }}
      >
        <h4 className="text-sm font-semibold text-slate-200">Upload Emoji</h4>
        <div className="flex items-center gap-4">
          <motion.button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, oklch(0.55 0.25 265), oklch(0.50 0.20 300))",
              boxShadow: "0 4px 12px oklch(0.40 0.20 265 / 0.25)",
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isUploading ? "Uploading..." : "Choose File"}
          </motion.button>
          <div className="text-xs" style={{ color: "oklch(0.55 0.02 285)" }}>
            <p>PNG, GIF, or WebP</p>
            <p>Max 256KB, 128x128px</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.gif,.webp,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />

        <AnimatePresence>
          {uploadError && (
            <motion.p
              className="text-xs px-3 py-2 rounded-lg"
              style={{
                color: "oklch(0.75 0.15 25)",
                backgroundColor: "oklch(0.25 0.08 25 / 0.3)",
                border: "1px solid oklch(0.40 0.12 25 / 0.3)",
              }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              {uploadError}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Emoji Grid */}
      <motion.div
        className="rounded-xl p-6 space-y-4"
        style={{
          backgroundColor: "oklch(0.15 0.02 285 / 0.7)",
          border: "1px solid oklch(0.25 0.02 285 / 0.5)",
          backdropFilter: "blur(12px)",
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
      >
        <h4 className="text-sm font-semibold text-slate-200">
          Emojis ({emojis.length})
        </h4>

        {emojis.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm" style={{ color: "oklch(0.50 0.02 285)" }}>
              No emojis yet. Upload one to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <AnimatePresence mode="popLayout">
              {emojis.map((emoji) => (
                <motion.div
                  key={emoji.id}
                  className="rounded-lg p-3 flex flex-col items-center gap-2 group relative"
                  style={{
                    backgroundColor: "oklch(0.12 0.02 285 / 0.6)",
                    border: "1px solid oklch(0.22 0.02 285 / 0.4)",
                  }}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {/* Emoji Image */}
                  <div className="h-10 w-10 shrink-0 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={emoji.imageUrl}
                      alt={`:${emoji.name}:`}
                      className="max-h-10 max-w-10 object-contain"
                      loading="lazy"
                    />
                  </div>

                  {/* Emoji Name */}
                  {renamingId === emoji.id ? (
                    <div className="flex items-center gap-1 w-full">
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameConfirm();
                          if (e.key === "Escape") handleRenameCancel();
                        }}
                        maxLength={EMOJI_LIMITS.nameMaxLength}
                        className="flex-1 text-xs px-1.5 py-1 rounded outline-hidden min-w-0"
                        style={{
                          backgroundColor: "oklch(0.10 0.02 285 / 0.8)",
                          color: "oklch(0.85 0.01 285)",
                          border: "1px solid oklch(0.40 0.15 265 / 0.5)",
                        }}
                        spellCheck={false}
                      />
                      <button
                        type="button"
                        onClick={handleRenameConfirm}
                        className="shrink-0 p-1 rounded transition-colors"
                        style={{ color: "oklch(0.70 0.20 150)" }}
                        aria-label="Confirm rename"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={handleRenameCancel}
                        className="shrink-0 p-1 rounded transition-colors"
                        style={{ color: "oklch(0.70 0.15 25)" }}
                        aria-label="Cancel rename"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <p
                      className="text-xs font-mono truncate max-w-full"
                      style={{ color: "oklch(0.70 0.02 285)" }}
                      title={`:${emoji.name}:`}
                    >
                      :{emoji.name}:
                    </p>
                  )}

                  {/* Animated badge */}
                  {emoji.isAnimated && (
                    <span
                      className="absolute top-1.5 right-1.5 text-[9px] font-bold px-1 py-0.5 rounded"
                      style={{
                        backgroundColor: "oklch(0.40 0.15 150 / 0.3)",
                        color: "oklch(0.75 0.18 150)",
                        border: "1px solid oklch(0.50 0.12 150 / 0.3)",
                      }}
                    >
                      GIF
                    </span>
                  )}

                  {/* Action buttons (visible on hover) */}
                  {renamingId !== emoji.id && (
                    <div
                      className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <button
                        type="button"
                        onClick={() => handleRenameStart(emoji.id, emoji.name)}
                        className="p-1.5 rounded-md text-xs transition-colors"
                        style={{
                          color: "oklch(0.70 0.02 285)",
                          backgroundColor: "oklch(0.20 0.02 285 / 0.5)",
                        }}
                        aria-label={`Rename ${emoji.name}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(emoji.id)}
                        className="p-1.5 rounded-md text-xs transition-colors"
                        style={{
                          color: "oklch(0.70 0.15 25)",
                          backgroundColor: "oklch(0.20 0.05 25 / 0.3)",
                        }}
                        aria-label={`Delete ${emoji.name}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 3H10M4.5 5V9M7.5 5V9M3 3L3.5 10.5H8.5L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation Overlay */}
      <AnimatePresence>
        {deletingId && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0"
              style={{ backgroundColor: "oklch(0.05 0.01 285 / 0.7)" }}
              onClick={() => setDeletingId(null)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setDeletingId(null);
                }
              }}
              aria-label="Cancel delete"
            />

            {/* Dialog */}
            <motion.div
              className="relative rounded-xl p-6 max-w-sm w-full space-y-4"
              style={{
                backgroundColor: "oklch(0.15 0.02 285 / 0.95)",
                border: "1px solid oklch(0.25 0.02 285 / 0.5)",
                backdropFilter: "blur(16px)",
                boxShadow: "0 16px 48px oklch(0.05 0.02 285 / 0.5)",
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <h4 className="text-base font-semibold text-slate-100">Delete Emoji</h4>
              <p className="text-sm" style={{ color: "oklch(0.65 0.02 285)" }}>
                Are you sure you want to delete this emoji? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingId(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    color: "oklch(0.80 0.02 285)",
                    backgroundColor: "oklch(0.20 0.02 285 / 0.6)",
                    border: "1px solid oklch(0.30 0.02 285 / 0.4)",
                  }}
                >
                  Cancel
                </button>
                <motion.button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.50 0.20 25), oklch(0.45 0.18 15))",
                    boxShadow: "0 4px 12px oklch(0.35 0.15 25 / 0.3)",
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
