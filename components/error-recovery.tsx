"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, RefreshCcw, Trash2, Download, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getRecentErrors,
  exportErrorLogs,
  clearErrorLogs,
  type ErrorLog,
} from "@/lib/utils/error-logger";

interface ErrorRecoveryProps {
  error?: Error | string | null;
  onRetry: () => void;
}

export function ErrorRecovery({ error, onRetry }: ErrorRecoveryProps) {
  const [showErrorLog, setShowErrorLog] = useState(false);
  const [recentErrors, setRecentErrors] = useState<ErrorLog[]>(getRecentErrors(3));

  const handleClearCacheAndReload = () => {
    // Clear all Bedrock-related localStorage keys
    const keysToRemove = [
      "bedrock-auth",
      "bedrock-server",
      "bedrock-ui",
      "bedrock-favorites",
      "bedrock-init-attempts",
      "bedrock-last-render",
    ];

    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (err) {
        console.error(`Failed to remove ${key}:`, err);
      }
    });

    // Reload the page
    window.location.reload();
  };

  const handleExportLogs = () => {
    const logs = exportErrorLogs();
    const blob = new Blob([logs], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bedrock-error-log-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    clearErrorLogs();
    setRecentErrors([]);
  };

  const errorMessage = error instanceof Error ? error.message : error || "An unexpected error occurred";

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full glass rounded-2xl p-8 shadow-2xl border border-slate-700/50"
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="shrink-0 w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-100 mb-2">Something Went Wrong</h1>
            <p className="text-slate-400">
              We encountered an error while initializing the application. Don't worry, your data is safe.
            </p>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-6 p-4 rounded-lg bg-red-500/5 border border-red-500/10">
          <p className="text-sm font-mono text-red-300">{errorMessage}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button onClick={onRetry} className="flex items-center gap-2">
            <RefreshCcw className="w-4 h-4" />
            Retry
          </Button>
          <Button onClick={handleClearCacheAndReload} variant="secondary" className="flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Clear Cache & Reload
          </Button>
        </div>

        {/* Error Log Section */}
        <div className="border-t border-slate-700/50 pt-6">
          <button
            onClick={() => setShowErrorLog(!showErrorLog)}
            className="w-full flex items-center justify-between text-sm font-semibold text-slate-300 hover:text-slate-100 transition-colors mb-4"
          >
            <span>Error Details ({recentErrors.length} recent errors)</span>
            {showErrorLog ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {showErrorLog && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {/* Recent Errors */}
                {recentErrors.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {recentErrors.map((errorLog) => (
                      <div
                        key={errorLog.id}
                        className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            {errorLog.category}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(errorLog.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-mono text-slate-300 break-words">{errorLog.message}</p>
                        {errorLog.stack && (
                          <details className="mt-2">
                            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                              Stack Trace
                            </summary>
                            <pre className="mt-2 text-xs font-mono text-slate-400 overflow-x-auto whitespace-pre-wrap">
                              {errorLog.stack}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 mb-4">No recent errors found.</p>
                )}

                {/* Log Actions */}
                <div className="flex gap-2">
                  <Button onClick={handleExportLogs} variant="secondary" size="sm" className="flex items-center gap-2">
                    <Download className="w-3.5 h-3.5" />
                    Export Logs
                  </Button>
                  <Button onClick={handleClearLogs} variant="secondary" size="sm" className="flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear Logs
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <p className="text-xs text-slate-500">
            If this problem persists, try clearing your browser cache or using an incognito window. For technical
            support, export the error logs and share them with your administrator.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
