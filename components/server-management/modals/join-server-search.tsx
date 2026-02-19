"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Input } from "../../ui/input/input";
import { Button } from "../../ui/button/button";
import { useServerManagementStore } from "../../../store/server-management.store";
import { useServerStore } from "../../../store/server.store";
import { cn } from "../../../lib/utils/cn";
import { getImageUrl, SERVER_ICON_TRANSFORM } from "../../../lib/utils/image-url";
import type { DiscoverableServer } from "../../../store/server-management.store";

interface JoinServerSearchProps {
  onSuccess: () => void;
}

export function JoinServerSearch({ onSuccess }: JoinServerSearchProps) {
  const { searchDiscoverableServers, joinPublicServer, requestToJoinServer, joinServerByInvite } =
    useServerManagementStore();

  const [activeTab, setActiveTab] = useState<"search" | "invite">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [servers, setServers] = useState<DiscoverableServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Debounced search
  useEffect(() => {
    if (activeTab !== "search") return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchDiscoverableServers(searchQuery);
        setServers(results);
      } catch {
        setServers([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, activeTab, searchDiscoverableServers]);

  async function handleJoinServer(server: DiscoverableServer) {
    setJoining(server.id);
    setError("");

    try {
      if (server.is_public || !server.require_approval) {
        await joinPublicServer(server.id);
        // Reload servers in the sidebar
        useServerStore.getState().loadServers();
        onSuccess();
      } else {
        await requestToJoinServer(server.id);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to join server";
      setError(message);
    } finally {
      setJoining(null);
    }
  }

  async function handleJoinWithInvite() {
    if (!inviteCode.trim()) return;

    setJoining("invite");
    setError("");

    try {
      await joinServerByInvite(inviteCode);
      // Reload servers in the sidebar
      useServerStore.getState().loadServers();
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to join with invite code";
      setError(message);
    } finally {
      setJoining(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
        <button
          type="button"
          onClick={() => { setActiveTab("search"); setError(""); }}
          className={cn(
            "flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors",
            activeTab === "search"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-slate-200",
          )}
        >
          Search Servers
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("invite"); setError(""); }}
          className={cn(
            "flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors",
            activeTab === "invite"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-slate-200",
          )}
        >
          Invite Code
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {activeTab === "search" ? (
        <>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for servers..."
          />

          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                Searching servers...
              </div>
            ) : servers.length === 0 ? (
              <div className="text-center py-8">
                <svg
                  className="w-12 h-12 mx-auto text-slate-400 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-slate-300 text-sm">No discoverable servers found</p>
                <p className="text-slate-400 text-xs mt-1">
                  {searchQuery ? "Try a different search term" : "Try searching for a server"}
                </p>
              </div>
            ) : (
              servers.map((server) => (
                <motion.div
                  key={server.id}
                  whileHover={{ scale: 1.01 }}
                  className="p-4 bg-white/5 hover:bg-white/8 rounded-lg border border-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Server Icon */}
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        {server.icon_url ? (
                          <img
                            src={getImageUrl(server.icon_url, SERVER_ICON_TRANSFORM)}
                            alt={server.name}
                            className="w-full h-full rounded-xl object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold text-lg">
                            {server.name[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-slate-100 text-sm truncate">
                            {server.name}
                          </h3>
                          {server.is_public && (
                            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-full shrink-0">
                              Public
                            </span>
                          )}
                        </div>
                        {server.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 mb-1">
                            {server.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {server.member_count} members
                          </span>
                          {server.category && (
                            <span className="capitalize">{server.category}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleJoinServer(server)}
                      loading={joining === server.id}
                      className="shrink-0"
                    >
                      {server.is_public || !server.require_approval ? "Join" : "Request"}
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <div>
            <Input
              label="Enter Invite Code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="e.g. A1B2C3D4"
              maxLength={20}
              helperText="Invite codes are provided by server admins"
            />
          </div>

          <Button
            onClick={handleJoinWithInvite}
            loading={joining === "invite"}
            disabled={!inviteCode.trim()}
            className="w-full"
          >
            Join Server
          </Button>

          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex gap-2">
              <svg
                className="w-4 h-4 text-blue-400 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-xs text-slate-400">
                Invite codes provide direct access to servers, bypassing the search system.
                Only use codes from trusted sources.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
