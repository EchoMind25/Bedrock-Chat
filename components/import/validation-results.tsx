"use client";

import { motion, AnimatePresence } from "motion/react";
import type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationSummary,
} from "@/lib/types/import-validation";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ValidationResultsProps {
  result: ValidationResult | null;
  isLoading?: boolean;
  onRetry?: () => void;
  onProceed?: () => void;
}

// ---------------------------------------------------------------------------
// Spring config
// ---------------------------------------------------------------------------

const spring = { type: "spring" as const, stiffness: 260, damping: 20, mass: 1 };

// ---------------------------------------------------------------------------
// Icons (inline SVGs — no external dependency)
// ---------------------------------------------------------------------------

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function HashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M9.493 2.852a.75.75 0 00-1.486-.204L6.956 6H3.25a.75.75 0 000 1.5h3.45l-.857 5H2.25a.75.75 0 000 1.5H5.59l-.874 5.148a.75.75 0 001.486.204L7.26 14h4.58l-.874 5.148a.75.75 0 001.486.204L13.51 14h3.74a.75.75 0 000-1.5h-3.484l.857-5h3.627a.75.75 0 000-1.5h-3.37l.873-5.148a.75.75 0 00-1.486-.204L12.74 6H8.16l.874-5.148zM8.417 7.5l-.857 5h4.58l.857-5H8.417z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function VolumeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H3.167a.75.75 0 00-.7.48A6.985 6.985 0 002 10c0 .887.165 1.737.468 2.52.111.29.39.48.7.48h1.535l4.033 3.796A.75.75 0 0010 16.25V3.75zM15.95 5.05a.75.75 0 00-1.06 1.061 5.5 5.5 0 010 7.778.75.75 0 001.06 1.06 7 7 0 000-9.899z" />
    </svg>
  );
}

function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M13.92 3.845a19.361 19.361 0 01-6.3 1.98C6.765 5.942 5.89 6 5 6a4 4 0 00-.504.032l-.21.055A4 4 0 001 10c0 1.193.525 2.265 1.356 2.993a18.82 18.82 0 00-.521 2.828.75.75 0 001.09.756l2.243-1.339c.234.078.472.147.715.206a19.39 19.39 0 018.037 1.401.75.75 0 001.08-.67V4.515a.75.75 0 00-1.08-.67zm2.33-.67a.75.75 0 011.5 0v13.65a.75.75 0 01-1.5 0V3.175z" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M9.661 2.237a.75.75 0 01.678 0 17.745 17.745 0 006.38 2.393.75.75 0 01.627.74v3.288c0 4.678-2.834 8.141-6.98 9.985a.75.75 0 01-.632 0C5.517 16.798 2.683 13.355 2.683 8.658V5.37a.75.75 0 01.627-.74 17.745 17.745 0 006.38-2.393zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <motion.div
          className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="text-sm text-slate-300">Validating import data...</p>
      </div>
      {/* Skeleton lines */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="h-3 bg-white/5 rounded"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
          style={{ width: `${70 + i * 10}%` }}
        />
      ))}
    </div>
  );
}

function ErrorList({ errors }: { errors: ValidationError[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <XIcon className="w-4 h-4 text-red-400 shrink-0" />
        <h4 className="text-sm font-semibold text-red-300">
          {errors.length} {errors.length === 1 ? "Error" : "Errors"}
        </h4>
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
        {errors.map((error, i) => (
          <motion.div
            key={`${error.field}-${i}`}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: i * 0.03 }}
            className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20"
            role="alert"
          >
            <p className="text-xs text-red-200">{error.message}</p>
            {error.field !== "_root" && (
              <p className="text-[10px] text-red-400/60 mt-0.5 font-mono">
                {error.field}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function WarningList({
  warnings,
}: {
  warnings: ValidationWarning[];
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <WarningIcon className="w-4 h-4 text-yellow-400 shrink-0" />
        <h4 className="text-sm font-semibold text-yellow-300">
          {warnings.length} {warnings.length === 1 ? "Warning" : "Warnings"}
        </h4>
      </div>
      <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin">
        {warnings.map((warning, i) => (
          <motion.div
            key={`${warning.field}-${i}`}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: i * 0.03 }}
            className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
          >
            <p className="text-xs text-yellow-200">{warning.message}</p>
            <p className="text-[10px] text-yellow-400/60 mt-0.5 font-mono">
              {warning.field}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ summary }: { summary: ValidationSummary }) {
  const totalChannels =
    summary.channels.text +
    summary.channels.voice +
    summary.channels.announcement;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={spring}
      className="p-4 rounded-xl bg-white/5 border border-white/10"
    >
      <h4 className="text-sm font-semibold text-slate-100 mb-3">
        Import Summary
      </h4>

      <div className="grid grid-cols-2 gap-3">
        {/* Categories */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <span className="text-xs text-blue-400" aria-hidden="true">
              #
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-400">Categories</p>
            <p className="text-sm font-medium text-slate-200">
              {summary.categories}
            </p>
          </div>
        </div>

        {/* Channels */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
            <HashIcon className="w-3.5 h-3.5 text-green-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Channels</p>
            <p className="text-sm font-medium text-slate-200">
              {totalChannels}
            </p>
          </div>
        </div>

        {/* Roles */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <ShieldIcon className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Roles</p>
            <p className="text-sm font-medium text-slate-200">
              {summary.roles}
            </p>
          </div>
        </div>

        {/* Family Safe */}
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              summary.family_safe ? "bg-green-500/10" : "bg-slate-500/10"
            }`}
          >
            <span
              className={`text-xs ${summary.family_safe ? "text-green-400" : "text-slate-400"}`}
              aria-hidden="true"
            >
              {summary.family_safe ? "F" : "-"}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-400">Family Safe</p>
            <p className="text-sm font-medium text-slate-200">
              {summary.family_safe ? "Yes" : "No"}
            </p>
          </div>
        </div>
      </div>

      {/* Channel breakdown */}
      <div className="mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          {summary.channels.text > 0 && (
            <span className="flex items-center gap-1">
              <HashIcon className="w-3 h-3" />
              {summary.channels.text} text
            </span>
          )}
          {summary.channels.voice > 0 && (
            <span className="flex items-center gap-1">
              <VolumeIcon className="w-3 h-3" />
              {summary.channels.voice} voice
            </span>
          )}
          {summary.channels.announcement > 0 && (
            <span className="flex items-center gap-1">
              <MegaphoneIcon className="w-3 h-3" />
              {summary.channels.announcement} announcement
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SanitizeChanges({ changes }: { changes: string[] }) {
  if (changes.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-blue-400" aria-hidden="true">
          ~
        </span>
        <h4 className="text-sm font-semibold text-blue-300">
          Auto-fixed ({changes.length})
        </h4>
      </div>
      <div className="space-y-1 max-h-28 overflow-y-auto scrollbar-thin">
        {changes.map((change, i) => (
          <p key={i} className="text-xs text-blue-200/70 pl-4">
            {change}
          </p>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ValidationResults({
  result,
  isLoading,
  onRetry,
  onProceed,
}: ValidationResultsProps) {
  if (isLoading) {
    return (
      <div className="glass-card rounded-xl">
        <LoadingState />
      </div>
    );
  }

  if (!result) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={result.valid ? "valid" : "invalid"}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={spring}
        className="glass-card rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div
          className={`px-4 py-3 flex items-center gap-2 border-b ${
            result.valid
              ? "border-green-500/20 bg-green-500/5"
              : "border-red-500/20 bg-red-500/5"
          }`}
        >
          {result.valid ? (
            <CheckIcon className="w-5 h-5 text-green-400 shrink-0" />
          ) : (
            <XIcon className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <h3 className="text-sm font-semibold text-slate-100">
            {result.valid ? "Validation Passed" : "Validation Failed"}
          </h3>
          {result.valid && result.warnings.length > 0 && (
            <span className="ml-auto text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">
              {result.warnings.length} warning{result.warnings.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Errors */}
          {result.errors.length > 0 && <ErrorList errors={result.errors} />}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <WarningList warnings={result.warnings} />
          )}

          {/* Auto-fix changes */}
          {result.sanitized && (
            <SanitizeChanges changes={result.sanitize_changes} />
          )}

          {/* Summary */}
          {result.valid && result.summary && (
            <SummaryCard summary={result.summary} />
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/5 flex items-center justify-end gap-3">
          {!result.valid && onRetry && (
            <motion.button
              type="button"
              onClick={onRetry}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 transition-colors min-h-[44px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Fix & Retry
            </motion.button>
          )}
          {result.valid && onProceed && (
            <motion.button
              type="button"
              onClick={onProceed}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-colors min-h-[44px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Proceed with Import
            </motion.button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
