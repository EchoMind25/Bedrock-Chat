"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Modal } from "../../ui/modal/modal";
import { Input } from "../../ui/input/input";
import { Button } from "../../ui/button/button";
import { ImageUpload } from "../file-upload/image-upload";
import { JoinServerSearch } from "./join-server-search";
import { useServerManagementStore } from "../../../store/server-management.store";
import { useServerStore } from "../../../store/server.store";
import { useAuthStore } from "../../../store/auth.store";
import { toast } from "../../../lib/stores/toast-store";
import { cn } from "../../../lib/utils/cn";
import { createClient } from "../../../lib/supabase/client";
import type { ChannelType } from "../../../lib/types/server";
import { generateDefaultRoles } from "../../../lib/constants/roles";
import { DEFAULT_SERVER_SETTINGS } from "../../../lib/types/server-settings";

type ActiveTab = "create" | "join";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "gaming", label: "Gaming" },
  { value: "education", label: "Education" },
  { value: "technology", label: "Technology" },
  { value: "creative", label: "Creative Arts" },
  { value: "community", label: "Community" },
  { value: "other", label: "Other" },
];

export function AddServerModal() {
  const router = useRouter();
  const isAddServerOpen = useServerManagementStore((state) => state.isAddServerOpen);
  const closeAddServer = useServerManagementStore((state) => state.closeAddServer);

  const [activeTab, setActiveTab] = useState<ActiveTab>("create");

  // Create server form state
  const [serverName, setServerName] = useState("");
  const [serverIcon, setServerIcon] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [isPublic, setIsPublic] = useState(false);
  const [allowDiscovery, setAllowDiscovery] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setServerName("");
    setServerIcon(null);
    setDescription("");
    setCategory("general");
    setIsPublic(false);
    setAllowDiscovery(false);
    setRequireApproval(true);
    setError("");
    setIsLoading(false);
  };

  const handleClose = () => {
    closeAddServer();
    setTimeout(() => {
      setActiveTab("create");
      resetForm();
    }, 300);
  };

  const handleJoinSuccess = () => {
    handleClose();
  };

  const handleCreate = async () => {
    if (!serverName.trim()) {
      setError("Server name is required");
      return;
    }
    if (serverName.length < 2 || serverName.length > 100) {
      setError("Server name must be between 2 and 100 characters");
      return;
    }

    const user = useAuthStore.getState().user;
    if (!user) {
      setError("You must be logged in to create a server");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const supabase = createClient();

      // 1. Create server
      const { data: serverData, error: serverError } = await supabase
        .from("servers")
        .insert({
          name: serverName.trim(),
          description: description.trim() || null,
          owner_id: user.id,
          icon_url: serverIcon,
          is_public: isPublic,
          allow_discovery: isPublic ? true : allowDiscovery,
          require_approval: isPublic ? false : requireApproval,
          category,
        })
        .select()
        .single();

      if (serverError) throw serverError;
      const serverId = serverData.id;

      // 2. Add creator as owner
      const { error: memberError } = await supabase.from("server_members").insert({
        server_id: serverId,
        user_id: user.id,
        role: "owner",
      });

      if (memberError) {
        // Critical: clean up orphaned server
        await supabase.from("servers").delete().eq("id", serverId);
        throw memberError;
      }

      // 3. Create default category + channel
      const { data: categoriesData, error: catError } = await supabase
        .from("channel_categories")
        .insert([{ server_id: serverId, name: "TEXT CHANNELS", position: 0 }])
        .select();

      if (catError) {
        console.error("Error creating categories:", catError);
      }

      const defaultCategoryId = categoriesData?.[0]?.id || null;

      const { data: channelsData, error: chError } = await supabase
        .from("channels")
        .insert([
          {
            server_id: serverId,
            category_id: defaultCategoryId,
            name: "general",
            type: "text" as ChannelType,
            position: 0,
          },
        ])
        .select();

      if (chError) {
        console.error("Error creating channels:", chError);
      }

      // 4. Audit log (non-critical, don't block creation)
      try {
        await supabase.from("audit_log").insert({
          server_id: serverId,
          actor_id: user.id,
          action: "server_create",
          target_id: serverId,
          target_name: serverName.trim(),
          target_type: "server",
        });
      } catch {
        // Audit log failure is non-critical
      }

      // 5. Build local server and add to store
      const categories = (categoriesData || []).map((cat) => ({
        id: cat.id,
        name: cat.name,
        serverId,
        position: cat.position,
        collapsed: false,
      }));

      const channels = (channelsData || []).map((ch) => ({
        id: ch.id,
        name: ch.name,
        type: ch.type as ChannelType,
        serverId,
        categoryId: ch.category_id,
        position: ch.position,
        unreadCount: 0,
        isNsfw: ch.is_nsfw,
        slowMode: ch.slow_mode_seconds,
      }));

      useServerStore.setState((state) => ({
        servers: [
          ...state.servers,
          {
            id: serverId,
            name: serverName.trim(),
            icon: serverIcon,
            ownerId: user.id,
            memberCount: 1,
            isOwner: true,
            categories,
            channels,
            unreadCount: 0,
            createdAt: new Date(serverData.created_at),
            roles: generateDefaultRoles(serverId),
            settings: {
              ...DEFAULT_SERVER_SETTINGS,
              icon: serverIcon,
              banner: null,
            },
            description: description.trim(),
          },
        ],
        currentServerId: serverId,
        currentChannelId: channels[0]?.id || null,
      }));

      // Close modal before navigation to prevent state conflicts
      handleClose();

      // Verify the server was actually added to the store
      const createdServer = useServerStore.getState().servers.find((s) => s.id === serverId);
      if (!createdServer) {
        toast.error("Server Error", "Server was created but could not be loaded. Please refresh.");
        return;
      }

      const firstChannel = channels[0];
      if (firstChannel) {
        toast.success("Server Created", `${serverName} has been created successfully`);
        router.push(`/servers/${serverId}/${firstChannel.id}`);
      } else {
        toast.success("Server Created", `${serverName} was created. Add channels in server settings.`);
        router.push("/friends");
      }
    } catch (err) {
      console.error("Error creating server:", err);
      const message = err instanceof Error ? err.message : "Could not create server";
      setError(message);
      toast.error("Creation Failed", "Could not create server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const privacySummary = isPublic
    ? "Public server - anyone can find and join instantly."
    : allowDiscovery
    ? requireApproval
      ? "Private server - appears in search, requires approval."
      : "Private server - appears in search, instant join."
    : "Private server - hidden from search, invite-only.";

  return (
    <Modal
      isOpen={isAddServerOpen}
      onClose={handleClose}
      title="Add a Server"
      description="Create your own server or join an existing community"
      size="lg"
    >
      {/* Tab Navigation */}
      <div className="border-b border-white/10 -mx-6 mb-6 sticky top-0 z-10 bg-glass-dark/95 backdrop-blur-sm">
        <div className="flex px-6">
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2",
              activeTab === "create"
                ? "text-blue-400 border-b-2 border-blue-500"
                : "text-slate-400 hover:text-slate-200 border-b-2 border-transparent"
            )}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Server
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("join")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2",
              activeTab === "join"
                ? "text-blue-400 border-b-2 border-blue-500"
                : "text-slate-400 hover:text-slate-200 border-b-2 border-transparent"
            )}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Join Server
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "create" ? (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Server Name */}
            <Input
              label="Server Name"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="My Awesome Server"
              maxLength={100}
            />

            {/* Server Icon */}
            <ImageUpload
              label="Server Icon (Optional)"
              value={serverIcon}
              onChange={setServerIcon}
              aspectRatio="square"
              placeholder="Upload an icon for your server"
            />

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's your server about?"
                rows={2}
                maxLength={500}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">{description.length}/500</p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value} className="bg-gray-900">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Privacy Settings */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <h3 className="text-sm font-semibold text-slate-200">Privacy Settings</h3>

              {/* Public toggle */}
              <label className="flex items-start gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/8 transition-colors">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => {
                    setIsPublic(e.target.checked);
                    if (e.target.checked) {
                      setAllowDiscovery(true);
                      setRequireApproval(false);
                    }
                  }}
                  className="mt-0.5 w-4 h-4 rounded-sm border-white/30 text-blue-600 focus:ring-blue-500/50"
                />
                <div>
                  <span className="text-sm font-medium text-slate-200">Public Server</span>
                  <p className="text-xs text-slate-400 mt-1">
                    Anyone can discover and join this server instantly
                  </p>
                </div>
              </label>

              {/* Allow Discovery (private only) */}
              {!isPublic && (
                <label className="flex items-start gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/8 transition-colors">
                  <input
                    type="checkbox"
                    checked={allowDiscovery}
                    onChange={(e) => setAllowDiscovery(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded-sm border-white/30 text-blue-600 focus:ring-blue-500/50"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-200">Allow Discovery</span>
                    <p className="text-xs text-slate-400 mt-1">
                      Let others find this server in search (may still require approval)
                    </p>
                  </div>
                </label>
              )}

              {/* Require Approval (private + discoverable) */}
              {!isPublic && allowDiscovery && (
                <label className="flex items-start gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/8 transition-colors">
                  <input
                    type="checkbox"
                    checked={requireApproval}
                    onChange={(e) => setRequireApproval(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded-sm border-white/30 text-blue-600 focus:ring-blue-500/50"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-200">Require Join Approval</span>
                    <p className="text-xs text-slate-400 mt-1">
                      Review and approve join requests before members can enter
                    </p>
                  </div>
                </label>
              )}

              {/* Privacy summary */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex gap-2">
                  <svg className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-xs text-slate-300">
                    <strong className="text-blue-300">Privacy: </strong>
                    {privacySummary}
                  </p>
                </div>
              </div>
            </div>

            {/* Create Button */}
            <Button
              onClick={handleCreate}
              loading={isLoading}
              disabled={!serverName.trim()}
              className="w-full"
            >
              Create Server
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="join"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <JoinServerSearch onSuccess={handleJoinSuccess} />
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
