"use client";

import { useState, useEffect } from "react";
import { Hash, Volume2, Megaphone, Lock } from "lucide-react";
import { Modal } from "../../ui/modal/modal";
import { Input } from "../../ui/input/input";
import { Button } from "../../ui/button/button";
import { Dropdown } from "../../ui/dropdown/dropdown";
import { Toggle } from "../../ui/toggle/toggle";
import { useServerManagementStore } from "../../../store/server-management.store";
import { useServerStore } from "../../../store/server.store";
import { toast } from "../../../lib/stores/toast-store";
import { cn } from "../../../lib/utils/cn";
import type { ChannelType } from "../../../lib/types/server";
import { Permission } from "../../../lib/types/permissions";

const CHANNEL_TYPES: Array<{
  type: ChannelType;
  label: string;
  icon: typeof Hash;
  description: string;
}> = [
  {
    type: "text",
    label: "Text Channel",
    icon: Hash,
    description: "Send messages, images, and links",
  },
  {
    type: "voice",
    label: "Voice Channel",
    icon: Volume2,
    description: "Talk with voice and video",
  },
  {
    type: "announcement",
    label: "Announcement Channel",
    icon: Megaphone,
    description: "Important updates and announcements",
  },
];

export function CreateChannelModal() {
  const { isCreateChannelOpen, closeCreateChannel, preselectedCategoryId } = useServerManagementStore();
  const { getCurrentServer } = useServerStore();

  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState<ChannelType>("text");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const currentServer = getCurrentServer();

  // Set preselected category when modal opens
  useEffect(() => {
    if (isCreateChannelOpen && preselectedCategoryId) {
      setSelectedCategoryId(preselectedCategoryId);
    }
  }, [isCreateChannelOpen, preselectedCategoryId]);

  const handleClose = () => {
    closeCreateChannel();
    // Reset after animation
    setTimeout(() => {
      setChannelName("");
      setChannelType("text");
      setSelectedCategoryId("");
      setIsPrivate(false);
      setError("");
    }, 300);
  };

  const formatChannelName = (name: string, type: ChannelType): string => {
    if (type === "text") {
      // For text channels: lowercase, replace spaces with hyphens
      return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    }
    // For voice/announcement: allow spaces
    return name.trim();
  };

  const handleCreate = async () => {
    if (!currentServer) return;

    // Validation
    if (!channelName.trim()) {
      setError("Channel name is required");
      return;
    }

    const formattedName = formatChannelName(channelName, channelType);

    if (formattedName.length < 1 || formattedName.length > 100) {
      setError("Channel name must be between 1 and 100 characters");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // Mock API delay
      await new Promise((resolve) => setTimeout(resolve, 700));

      const newChannel = {
        id: `${currentServer.id}-ch-${Date.now()}`,
        name: formattedName,
        type: channelType,
        serverId: currentServer.id,
        categoryId: selectedCategoryId || undefined,
        position: currentServer.channels.length,
        unreadCount: 0,
        isNsfw: false,
        slowMode: 0,
        permissionOverrides: isPrivate
          ? [
              {
                id: `override-${Date.now()}`,
                targetType: "role" as const,
                targetId: `${currentServer.id}-role-everyone`,
                allow: 0,
                deny: Permission.VIEW_CHANNELS,
              },
            ]
          : undefined,
      };

      // Add to server store
      useServerStore.setState((state) => ({
        servers: state.servers.map((server) =>
          server.id === currentServer.id
            ? { ...server, channels: [...server.channels, newChannel] }
            : server
        ),
        currentChannelId: newChannel.id,
      }));

      toast.success("Channel Created", `#${formattedName} has been created`);
      handleClose();

      // Navigate to new channel
      window.location.href = `/servers/${currentServer.id}/${newChannel.id}`;
    } catch (error) {
      toast.error("Creation Failed", "Could not create channel. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentServer) return null;

  const categoryOptions = [
    { id: "none", value: "", label: "No Category" },
    ...currentServer.categories.map((cat) => ({
      id: cat.id,
      value: cat.id,
      label: cat.name,
    })),
  ];

  return (
    <Modal
      isOpen={isCreateChannelOpen}
      onClose={handleClose}
      title="Create Channel"
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} loading={isLoading}>
            Create Channel
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Channel Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Channel Type</label>
          <div className="space-y-2">
            {CHANNEL_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.type}
                  type="button"
                  onClick={() => setChannelType(type.type)}
                  className={cn(
                    "w-full p-3 rounded-lg border-2 transition-all text-left flex items-start gap-3",
                    channelType === type.type
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-white/10 hover:border-white/20 hover:bg-white/5",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 mt-0.5 flex-shrink-0",
                      channelType === type.type ? "text-blue-400" : "text-white/60",
                    )}
                  />
                  <div>
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs text-white/60">{type.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Channel Name */}
        <Input
          label="Channel Name"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          placeholder={channelType === "text" ? "general" : "General Voice"}
          error={error}
          maxLength={100}
          helperText={
            channelType === "text"
              ? "Lowercase letters, numbers, and hyphens only"
              : undefined
          }
        />

        {/* Category Selection */}
        <Dropdown
          label="Category"
          items={categoryOptions}
          value={selectedCategoryId}
          onSelect={setSelectedCategoryId}
          placeholder="Select a category"
        />

        {/* Private Channel Toggle */}
        <div className="space-y-2">
          <Toggle
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            label="Private Channel"
            size="md"
          />
          {isPrivate && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <Lock className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-200">
                Only members with specific roles or permissions will be able to view this channel.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
