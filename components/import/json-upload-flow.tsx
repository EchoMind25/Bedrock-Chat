"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { useImportStore } from "@/store/import.store";
import { ValidationResults } from "./validation-results";
import { ServerPreview } from "./server-preview";
import { toast } from "@/lib/stores/toast-store";
import { createClient } from "@/lib/supabase/client";
import { createServerFromDefinition } from "@/lib/services/server-creation";
import { useServerStore } from "@/store/server.store";
import { useAuthStore } from "@/store/auth.store";
import { DEFAULT_SERVER_SETTINGS } from "@/lib/types/server-settings";
import { deriveThemeColor } from "@/lib/utils/derive-theme-color";
import type { ServerDefinition } from "@/lib/types/server-definition";

const spring = { type: "spring" as const, stiffness: 260, damping: 20, mass: 1 };

export function JsonUploadFlow() {
  const jsonText = useImportStore((s) => s.jsonText);
  const setJsonText = useImportStore((s) => s.setJsonText);
  const validationResult = useImportStore((s) => s.validationResult);
  const setValidationResult = useImportStore((s) => s.setValidationResult);
  const isValidating = useImportStore((s) => s.isValidating);
  const setIsValidating = useImportStore((s) => s.setIsValidating);
  const setMethod = useImportStore((s) => s.setMethod);
  const isCreating = useImportStore((s) => s.isCreating);
  const setIsCreating = useImportStore((s) => s.setIsCreating);
  const setCreatedServerId = useImportStore((s) => s.setCreatedServerId);
  const setServerName = useImportStore((s) => s.setServerName);

  const [isDragOver, setIsDragOver] = useState(false);
  const [parsedDefinition, setParsedDefinition] = useState<ServerDefinition | null>(null);

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".json") && file.type !== "application/json") {
        toast.error("Invalid File", "Please upload a .json file");
        return;
      }
      if (file.size > 1024 * 1024) {
        toast.error("File Too Large", "Maximum file size is 1MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === "string") {
          setJsonText(text);
        }
      };
      reader.readAsText(file);
    },
    [setJsonText],
  );

  const handleValidate = useCallback(async () => {
    if (!jsonText.trim()) {
      toast.error("Empty Input", "Please paste or upload JSON first");
      return;
    }

    setIsValidating(true);
    setValidationResult(null);
    setParsedDefinition(null);

    try {
      const res = await fetch("/api/import/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonText,
      });

      const result = await res.json();
      setValidationResult(result);

      if (result.valid) {
        try {
          const def = JSON.parse(jsonText) as ServerDefinition;
          setParsedDefinition(def);
        } catch {
          // Already validated server-side
        }
      }
    } catch {
      toast.error("Validation Failed", "Could not connect to the server");
    } finally {
      setIsValidating(false);
    }
  }, [jsonText, setIsValidating, setValidationResult]);

  const handleCreate = useCallback(async () => {
    if (!parsedDefinition) return;

    const user = useAuthStore.getState().user;
    if (!user) {
      toast.error("Not Authenticated", "Please log in to create a server");
      return;
    }

    setIsCreating(true);
    try {
      const supabase = createClient();

      const result = await createServerFromDefinition(supabase, {
        definition: parsedDefinition,
        serverName: parsedDefinition.server.name,
        userId: user.id,
        description: parsedDefinition.server.description,
        isFamilyFriendly: parsedDefinition.server.family_safe,
      });

      // Update local store (matches create-server-modal pattern)
      useServerStore.setState((state) => ({
        servers: [
          ...state.servers,
          {
            id: result.serverId,
            name: parsedDefinition.server.name.trim(),
            icon: null,
            ownerId: user.id,
            memberCount: 1,
            isOwner: true,
            categories: result.categories,
            channels: result.channels,
            unreadCount: 0,
            createdAt: new Date(),
            themeColor: deriveThemeColor(parsedDefinition.server.name.trim()),
            roles: result.roles,
            settings: {
              ...DEFAULT_SERVER_SETTINGS,
              icon: null,
              banner: null,
            },
            description: parsedDefinition.server.description ?? "",
            isFamilyFriendly: parsedDefinition.server.family_safe,
          },
        ],
      }));

      setServerName(parsedDefinition.server.name);
      setCreatedServerId(result.serverId);
      toast.success("Server Created", `${parsedDefinition.server.name} is ready!`);
    } catch (err) {
      toast.error(
        "Creation Failed",
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setIsCreating(false);
    }
  }, [parsedDefinition, setIsCreating, setCreatedServerId, setServerName]);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => setMethod(null)}
        className="text-sm text-white/50 hover:text-white/80 transition-colors flex items-center gap-1.5 min-h-[44px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
        </svg>
        Back to method selection
      </button>

      {/* Drop zone / Text area */}
      <div
        className={`relative rounded-xl border-2 border-dashed transition-colors ${
          isDragOver
            ? "border-blue-500 bg-blue-500/10"
            : "border-white/15 hover:border-white/25"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFileSelect(file);
        }}
      >
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='Paste your ServerDefinition JSON here, or drag and drop a .json file...'
          className="w-full h-64 bg-transparent text-sm text-white/80 placeholder:text-white/30 font-mono p-4 resize-none outline-hidden scrollbar-thin"
          spellCheck={false}
          aria-label="Server definition JSON"
        />

        {/* File upload trigger */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
            <span className="text-xs text-white/40 hover:text-white/70 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
              Upload file
            </span>
          </label>
        </div>
      </div>

      {/* Validate button */}
      <div className="flex items-center justify-end gap-3">
        {jsonText.trim() && !isValidating && (
          <button
            type="button"
            onClick={() => {
              setJsonText("");
              setValidationResult(null);
              setParsedDefinition(null);
            }}
            className="px-4 py-2 text-sm text-white/50 hover:text-white/80 transition-colors min-h-[44px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
          >
            Clear
          </button>
        )}
        <motion.button
          type="button"
          onClick={handleValidate}
          disabled={!jsonText.trim() || isValidating}
          className="px-5 py-2.5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={spring}
        >
          {isValidating ? "Validating..." : "Validate"}
        </motion.button>
      </div>

      {/* Validation results */}
      <ValidationResults
        result={validationResult}
        isLoading={isValidating}
        onRetry={() => setValidationResult(null)}
        onProceed={handleCreate}
      />

      {/* Preview */}
      {parsedDefinition && validationResult?.valid && (
        <ServerPreview definition={parsedDefinition} />
      )}

      {/* Creating overlay */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card rounded-xl p-8 text-center">
            <motion.div
              className="w-8 h-8 mx-auto mb-4 rounded-full border-2 border-blue-400 border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-sm text-white/80">Creating your server...</p>
          </div>
        </div>
      )}
    </div>
  );
}
