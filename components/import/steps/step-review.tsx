"use client";

import { useCallback } from "react";
import { motion } from "motion/react";
import { useImportStore } from "@/store/import.store";
import { ServerPreview } from "../server-preview";
import { toast } from "@/lib/stores/toast-store";
import { createClient } from "@/lib/supabase/client";
import { createServerFromDefinition } from "@/lib/services/server-creation";
import { useServerStore } from "@/store/server.store";
import { useAuthStore } from "@/store/auth.store";
import { DEFAULT_SERVER_SETTINGS } from "@/lib/types/server-settings";
import { deriveThemeColor } from "@/lib/utils/derive-theme-color";

const spring = { type: "spring" as const, stiffness: 260, damping: 20, mass: 1 };

export function StepReview() {
  const buildDefinition = useImportStore((s) => s.buildDefinition);
  const serverName = useImportStore((s) => s.serverName);
  const familySafe = useImportStore((s) => s.familySafe);
  const categories = useImportStore((s) => s.categories);
  const channels = useImportStore((s) => s.channels);
  const roles = useImportStore((s) => s.roles);
  const isCreating = useImportStore((s) => s.isCreating);
  const setIsCreating = useImportStore((s) => s.setIsCreating);
  const setCreatedServerId = useImportStore((s) => s.setCreatedServerId);
  const setGuidedStep = useImportStore((s) => s.setGuidedStep);
  const prevGuidedStep = useImportStore((s) => s.prevGuidedStep);

  const definition = buildDefinition();

  const handleCreate = useCallback(async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      toast.error("Not Authenticated", "Please log in to create a server");
      return;
    }

    setIsCreating(true);
    try {
      const supabase = createClient();
      const def = buildDefinition();

      const result = await createServerFromDefinition(supabase, {
        definition: def,
        serverName: def.server.name,
        userId: user.id,
        description: def.server.description,
        isFamilyFriendly: def.server.family_safe,
      });

      // Update local store (matches create-server-modal pattern)
      useServerStore.setState((state) => ({
        servers: [
          ...state.servers,
          {
            id: result.serverId,
            name: def.server.name.trim(),
            icon: null,
            ownerId: user.id,
            memberCount: 1,
            isOwner: true,
            categories: result.categories,
            channels: result.channels,
            unreadCount: 0,
            createdAt: new Date(),
            themeColor: deriveThemeColor(def.server.name.trim()),
            roles: result.roles,
            settings: {
              ...DEFAULT_SERVER_SETTINGS,
              icon: null,
              banner: null,
            },
            description: def.server.description ?? "",
            isFamilyFriendly: def.server.family_safe,
          },
        ],
      }));

      setCreatedServerId(result.serverId);
      toast.success("Server Created", `${def.server.name} is ready!`);
    } catch (err) {
      toast.error(
        "Creation Failed",
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setIsCreating(false);
    }
  }, [buildDefinition, setIsCreating, setCreatedServerId]);

  const textChannels = channels.filter((c) => c.type === "text").length;
  const voiceChannels = channels.filter((c) => c.type === "voice").length;
  const announcementChannels = channels.filter((c) => c.type === "announcement").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Review your server
        </h2>
        <p className="text-sm text-white/50 mt-1">
          Everything look good? You can go back to any step to make changes.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
          <p className="text-lg font-bold text-white">{categories.length}</p>
          <p className="text-xs text-white/40">Categories</p>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
          <p className="text-lg font-bold text-white">{channels.length}</p>
          <p className="text-xs text-white/40">Channels</p>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
          <p className="text-lg font-bold text-white">{roles.length}</p>
          <p className="text-xs text-white/40">Roles</p>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
          <p className="text-lg font-bold text-white">
            {familySafe ? "Yes" : "No"}
          </p>
          <p className="text-xs text-white/40">Family Safe</p>
        </div>
      </div>

      {/* Quick edit links */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setGuidedStep("server-name")}
          className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded bg-blue-500/10 transition-colors focus-visible:outline-2 focus-visible:outline-primary"
        >
          Edit name
        </button>
        <button
          type="button"
          onClick={() => setGuidedStep("categories")}
          className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded bg-blue-500/10 transition-colors focus-visible:outline-2 focus-visible:outline-primary"
        >
          Edit categories
        </button>
        <button
          type="button"
          onClick={() => setGuidedStep("channels")}
          className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded bg-blue-500/10 transition-colors focus-visible:outline-2 focus-visible:outline-primary"
        >
          Edit channels
        </button>
        <button
          type="button"
          onClick={() => setGuidedStep("roles")}
          className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded bg-blue-500/10 transition-colors focus-visible:outline-2 focus-visible:outline-primary"
        >
          Edit roles
        </button>
      </div>

      {/* Structure preview */}
      <ServerPreview definition={definition} />

      {/* Channel breakdown */}
      <div className="flex items-center gap-4 text-xs text-white/40">
        {textChannels > 0 && <span>{textChannels} text</span>}
        {voiceChannels > 0 && <span>{voiceChannels} voice</span>}
        {announcementChannels > 0 && <span>{announcementChannels} announcement</span>}
      </div>

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
          onClick={handleCreate}
          disabled={isCreating}
          className="px-6 py-2.5 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={spring}
        >
          {isCreating ? "Creating..." : "Create Server"}
        </motion.button>
      </div>

      {/* Creating overlay */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card rounded-xl p-8 text-center">
            <motion.div
              className="w-8 h-8 mx-auto mb-4 rounded-full border-2 border-green-400 border-t-transparent"
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
