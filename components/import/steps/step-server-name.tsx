"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { useImportStore } from "@/store/import.store";
import { DiscordGuide } from "../discord-guide";
import { parseDiscordExport } from "@/lib/services/discord-export-parser";
import type { DiscordServerEntry } from "@/lib/services/discord-export-parser";

const spring = { type: "spring" as const, stiffness: 260, damping: 20, mass: 1 };

export function StepServerName() {
  const serverName = useImportStore((s) => s.serverName);
  const setServerName = useImportStore((s) => s.setServerName);
  const serverDescription = useImportStore((s) => s.serverDescription);
  const setServerDescription = useImportStore((s) => s.setServerDescription);
  const discordServers = useImportStore((s) => s.discordServers);
  const setDiscordServers = useImportStore((s) => s.setDiscordServers);
  const setSelectedDiscordServer = useImportStore((s) => s.setSelectedDiscordServer);
  const nextGuidedStep = useImportStore((s) => s.nextGuidedStep);

  const [showDiscordImport, setShowDiscordImport] = useState(false);
  const [isParsingExport, setIsParsingExport] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const handleDiscordFile = useCallback(
    async (file: File) => {
      setIsParsingExport(true);
      setParseError(null);
      const result = await parseDiscordExport(file);
      setIsParsingExport(false);

      if (!result.success) {
        setParseError(result.error ?? "Failed to parse export");
        return;
      }

      setDiscordServers(result.servers);
    },
    [setDiscordServers],
  );

  const handleSelectServer = useCallback(
    (server: DiscordServerEntry) => {
      setServerName(server.name);
      setSelectedDiscordServer(server);
      setShowDiscordImport(false);
    },
    [setServerName, setSelectedDiscordServer],
  );

  const handleNext = useCallback(() => {
    const trimmed = serverName.trim();
    if (!trimmed) {
      setNameError("Server name is required");
      return;
    }
    if (trimmed.length < 2) {
      setNameError("Server name must be at least 2 characters");
      return;
    }
    if (trimmed.length > 100) {
      setNameError("Server name must be 100 characters or less");
      return;
    }
    setNameError(null);
    nextGuidedStep();
  }, [serverName, nextGuidedStep]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">
          What&apos;s your server name?
        </h2>
        <p className="text-sm text-white/50 mt-1">
          This is how your community will appear in Bedrock.
        </p>
      </div>

      {/* Server name input */}
      <div className="space-y-2">
        <label htmlFor="server-name" className="block text-sm font-medium text-white/70">
          Server Name
        </label>
        <input
          id="server-name"
          type="text"
          value={serverName}
          onChange={(e) => {
            setServerName(e.target.value);
            if (nameError) setNameError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleNext();
          }}
          placeholder="My Awesome Community"
          maxLength={100}
          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors min-h-[44px]"
          aria-invalid={!!nameError}
          aria-describedby={nameError ? "server-name-error" : undefined}
          autoFocus
        />
        {nameError && (
          <p id="server-name-error" className="text-xs text-red-400" role="alert">
            {nameError}
          </p>
        )}
        <p className="text-xs text-white/30">{serverName.length}/100</p>
      </div>

      {/* Description (optional) */}
      <div className="space-y-2">
        <label htmlFor="server-desc" className="block text-sm font-medium text-white/70">
          Description <span className="text-white/30">(optional)</span>
        </label>
        <textarea
          id="server-desc"
          value={serverDescription}
          onChange={(e) => setServerDescription(e.target.value)}
          placeholder="What's this server about?"
          maxLength={500}
          rows={3}
          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors resize-none"
        />
      </div>

      {/* Discord export option */}
      <div className="border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={() => setShowDiscordImport(!showDiscordImport)}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5 min-h-[44px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
          Import name from Discord data export
        </button>

        {showDiscordImport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={spring}
            className="mt-4 space-y-4"
          >
            <DiscordGuide />

            {/* File upload for Discord export */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white/70">
                Upload your Discord data export (.zip)
              </label>
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept=".zip"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleDiscordFile(file);
                  }}
                />
                <div className="px-4 py-3 rounded-lg border-2 border-dashed border-white/15 hover:border-blue-500/40 text-center text-sm text-white/50 hover:text-white/70 transition-colors">
                  {isParsingExport
                    ? "Parsing export..."
                    : "Click to select your Discord export ZIP"}
                </div>
              </label>

              {parseError && (
                <p className="text-xs text-red-400" role="alert">
                  {parseError}
                </p>
              )}

              {/* Server list from export */}
              {discordServers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-white/50">
                    Found {discordServers.length} servers. Select one to
                    pre-fill the name:
                  </p>
                  <div className="max-h-48 overflow-y-auto scrollbar-thin space-y-1">
                    {discordServers.map((server) => (
                      <button
                        key={server.id}
                        type="button"
                        onClick={() => handleSelectServer(server)}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors min-h-[44px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        {server.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-4">
        <motion.button
          type="button"
          onClick={handleNext}
          disabled={!serverName.trim()}
          className="px-5 py-2.5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
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
