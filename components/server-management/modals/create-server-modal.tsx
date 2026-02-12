"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Gamepad2, GraduationCap, Users, Sparkles } from "lucide-react";
import { Modal } from "../../ui/modal/modal";
import { Input } from "../../ui/input/input";
import { Button } from "../../ui/button/button";
import { ImageUpload } from "../file-upload/image-upload";
import { useServerManagementStore } from "../../../store/server-management.store";
import { useServerStore } from "../../../store/server.store";
import { useAuthStore } from "../../../store/auth.store";
import { toast } from "../../../lib/stores/toast-store";
import { cn } from "../../../lib/utils/cn";
import { createClient } from "../../../lib/supabase/client";
import type { ChannelType } from "../../../lib/types/server";
import { generateDefaultRoles } from "../../../lib/constants/roles";
import { DEFAULT_SERVER_SETTINGS } from "../../../lib/types/server-settings";

type ServerTemplate = "gaming" | "school" | "friends" | "custom";

const TEMPLATES = [
  {
    id: "gaming" as const,
    name: "Gaming",
    description: "For gaming communities",
    icon: Gamepad2,
    channels: [
      { name: "welcome", type: "announcement" as ChannelType, category: "INFORMATION" },
      { name: "rules", type: "announcement" as ChannelType, category: "INFORMATION" },
      { name: "general", type: "text" as ChannelType, category: "TEXT CHANNELS" },
      { name: "looking-for-group", type: "text" as ChannelType, category: "TEXT CHANNELS" },
      { name: "General Voice", type: "voice" as ChannelType, category: "VOICE CHANNELS" },
      { name: "Gaming", type: "voice" as ChannelType, category: "VOICE CHANNELS" },
    ],
  },
  {
    id: "school" as const,
    name: "School",
    description: "For study groups",
    icon: GraduationCap,
    channels: [
      { name: "announcements", type: "announcement" as ChannelType, category: "INFORMATION" },
      { name: "general", type: "text" as ChannelType, category: "TEXT CHANNELS" },
      { name: "homework-help", type: "text" as ChannelType, category: "TEXT CHANNELS" },
      { name: "resources", type: "text" as ChannelType, category: "TEXT CHANNELS" },
      { name: "Study Room", type: "voice" as ChannelType, category: "VOICE CHANNELS" },
    ],
  },
  {
    id: "friends" as const,
    name: "Friends",
    description: "For hanging out",
    icon: Users,
    channels: [
      { name: "general", type: "text" as ChannelType, category: "TEXT CHANNELS" },
      { name: "random", type: "text" as ChannelType, category: "TEXT CHANNELS" },
      { name: "Hangout", type: "voice" as ChannelType, category: "VOICE CHANNELS" },
    ],
  },
  {
    id: "custom" as const,
    name: "Custom",
    description: "Start from scratch",
    icon: Sparkles,
    channels: [
      { name: "general", type: "text" as ChannelType, category: "TEXT CHANNELS" },
    ],
  },
];

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "gaming", label: "Gaming" },
  { value: "education", label: "Education" },
  { value: "technology", label: "Technology" },
  { value: "creative", label: "Creative Arts" },
  { value: "community", label: "Community" },
  { value: "other", label: "Other" },
];

export function CreateServerModal() {
  const router = useRouter();
  const { isCreateServerOpen, closeCreateServer } = useServerManagementStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<ServerTemplate>("friends");
  const [serverName, setServerName] = useState("");
  const [serverIcon, setServerIcon] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Privacy settings
  const [isPublic, setIsPublic] = useState(false);
  const [allowDiscovery, setAllowDiscovery] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);
  const [category, setCategory] = useState("general");

  const handleClose = () => {
    closeCreateServer();
    setTimeout(() => {
      setStep(1);
      setSelectedTemplate("friends");
      setServerName("");
      setServerIcon(null);
      setError("");
      setIsPublic(false);
      setAllowDiscovery(false);
      setRequireApproval(true);
      setCategory("general");
    }, 300);
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!serverName.trim()) {
        setError("Server name is required");
        return;
      }
      if (serverName.length < 2 || serverName.length > 100) {
        setError("Server name must be between 2 and 100 characters");
        return;
      }
      setError("");
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const handleCreate = async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      setError("You must be logged in to create a server");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const supabase = createClient();
      const template = TEMPLATES.find((t) => t.id === selectedTemplate)!;

      // 1. Create server in Supabase
      const { data: serverData, error: serverError } = await supabase
        .from("servers")
        .insert({
          name: serverName.trim(),
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

      // 2. Add creator as owner member
      await supabase.from("server_members").insert({
        server_id: serverId,
        user_id: user.id,
        role: "owner",
      });

      // 3. Create categories
      const categoryNames = Array.from(new Set(template.channels.map((ch) => ch.category)));
      const categoryInserts = categoryNames.map((name, index) => ({
        server_id: serverId,
        name,
        position: index,
      }));

      const { data: categoriesData } = await supabase
        .from("channel_categories")
        .insert(categoryInserts)
        .select();

      // 4. Create channels
      const channelInserts = template.channels.map((ch, index) => {
        const cat = (categoriesData || []).find((c) => c.name === ch.category);
        return {
          server_id: serverId,
          category_id: cat?.id || null,
          name: ch.name,
          type: ch.type,
          position: index,
        };
      });

      const { data: channelsData } = await supabase
        .from("channels")
        .insert(channelInserts)
        .select();

      // 5. Log audit entry
      await supabase.from("audit_log").insert({
        server_id: serverId,
        actor_id: user.id,
        action: "server_create",
        target_id: serverId,
        target_name: serverName.trim(),
        target_type: "server",
      });

      // 6. Build local server object and add to store
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

      const newServer = {
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
        description: "",
      };

      useServerStore.setState((state) => ({
        servers: [...state.servers, newServer],
        currentServerId: serverId,
        currentChannelId: channels[0]?.id || null,
      }));

      toast.success("Server Created", `${serverName} has been created successfully`);
      handleClose();

      const firstChannel = channels[0];
      if (firstChannel) {
        router.push(`/servers/${serverId}/${firstChannel.id}`);
      }
    } catch (err) {
      console.error("Error creating server:", err);
      toast.error("Creation Failed", "Could not create server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const stepTitles = {
    1: "Choose a Template",
    2: "Customize Your Server",
    3: "Privacy Settings",
  };

  const privacySummary = isPublic
    ? "This server will be publicly discoverable and anyone can join instantly."
    : allowDiscovery
    ? requireApproval
      ? "This server will appear in search results, but you must approve join requests."
      : "This server will appear in search results and users can join instantly."
    : "This server will be completely hidden from search. Only invite links will work.";

  return (
    <Modal
      isOpen={isCreateServerOpen}
      onClose={handleClose}
      title={stepTitles[step]}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          {step > 1 ? (
            <Button variant="ghost" onClick={handleBack}>
              Back
            </Button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button onClick={handleCreate} loading={isLoading}>
                Create Server
              </Button>
            )}
          </div>
        </div>
      }
    >
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <p className="text-sm text-white/60">
              Choose a template to get started quickly, or start from scratch.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map((template) => {
                const Icon = template.icon;
                return (
                  <motion.button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplate(template.id)}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all text-left",
                      selectedTemplate === template.id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-white/10 hover:border-white/20 hover:bg-white/5",
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className={cn(
                      "w-8 h-8 mb-2",
                      selectedTemplate === template.id ? "text-blue-400" : "text-white/60",
                    )} />
                    <h3 className="font-medium mb-1">{template.name}</h3>
                    <p className="text-xs text-white/60">{template.description}</p>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <Input
              label="Server Name"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="My Awesome Server"
              error={error}
              maxLength={100}
            />

            <ImageUpload
              label="Server Icon (Optional)"
              value={serverIcon}
              onChange={setServerIcon}
              aspectRatio="square"
              placeholder="Upload an icon for your server"
            />

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-xs text-blue-200">
                Your server will be created with preset channels based on the{" "}
                <strong>{TEMPLATES.find((t) => t.id === selectedTemplate)?.name}</strong> template.
              </p>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <p className="text-sm text-white/60">
              Control who can find and join your server.
            </p>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value} className="bg-gray-900">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Public toggle */}
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <input
                type="checkbox"
                id="public-server"
                checked={isPublic}
                onChange={(e) => {
                  setIsPublic(e.target.checked);
                  if (e.target.checked) {
                    setAllowDiscovery(true);
                    setRequireApproval(false);
                  }
                }}
                className="mt-0.5 w-4 h-4 rounded border-white/30 text-blue-600 focus:ring-blue-500/50"
              />
              <div className="flex-1">
                <label htmlFor="public-server" className="text-sm font-medium text-white cursor-pointer">
                  Public Server
                </label>
                <p className="text-xs text-white/50 mt-1">
                  Anyone can discover and join this server instantly
                </p>
              </div>
            </div>

            {/* Allow Discovery (private servers only) */}
            {!isPublic && (
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <input
                  type="checkbox"
                  id="allow-discovery"
                  checked={allowDiscovery}
                  onChange={(e) => setAllowDiscovery(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-white/30 text-blue-600 focus:ring-blue-500/50"
                />
                <div className="flex-1">
                  <label htmlFor="allow-discovery" className="text-sm font-medium text-white cursor-pointer">
                    Allow Discovery
                  </label>
                  <p className="text-xs text-white/50 mt-1">
                    Let others find this server in search (they may still need approval to join)
                  </p>
                </div>
              </div>
            )}

            {/* Require Approval (private + discoverable) */}
            {!isPublic && allowDiscovery && (
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <input
                  type="checkbox"
                  id="require-approval"
                  checked={requireApproval}
                  onChange={(e) => setRequireApproval(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-white/30 text-blue-600 focus:ring-blue-500/50"
                />
                <div className="flex-1">
                  <label htmlFor="require-approval" className="text-sm font-medium text-white cursor-pointer">
                    Require Join Approval
                  </label>
                  <p className="text-xs text-white/50 mt-1">
                    Review and approve join requests before members can enter
                  </p>
                </div>
              </div>
            )}

            {/* Privacy Summary */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex gap-2">
                <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-xs text-blue-200">
                  <strong className="text-blue-300">Privacy Summary: </strong>
                  {privacySummary}
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
