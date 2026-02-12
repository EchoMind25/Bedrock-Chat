"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Gamepad2, GraduationCap, Users, Sparkles } from "lucide-react";
import { Modal } from "../../ui/modal/modal";
import { Input } from "../../ui/input/input";
import { Button } from "../../ui/button/button";
import { ImageUpload } from "../file-upload/image-upload";
import { useServerManagementStore } from "../../../store/server-management.store";
import { useServerStore } from "../../../store/server.store";
import { toast } from "../../../lib/stores/toast-store";
import { cn } from "../../../lib/utils/cn";
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

export function CreateServerModal() {
  const { isCreateServerOpen, closeCreateServer } = useServerManagementStore();
  const { servers } = useServerStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<ServerTemplate>("friends");
  const [serverName, setServerName] = useState("");
  const [serverIcon, setServerIcon] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    closeCreateServer();
    // Reset after animation
    setTimeout(() => {
      setStep(1);
      setSelectedTemplate("friends");
      setServerName("");
      setServerIcon(null);
      setError("");
    }, 300);
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleCreate = async () => {
    // Validation
    if (!serverName.trim()) {
      setError("Server name is required");
      return;
    }

    if (serverName.length < 2 || serverName.length > 100) {
      setError("Server name must be between 2 and 100 characters");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // Mock API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const template = TEMPLATES.find((t) => t.id === selectedTemplate)!;
      const serverId = `server-${Date.now()}`;

      // Create categories
      const categoryNames = Array.from(new Set(template.channels.map((ch) => ch.category)));
      const categories = categoryNames.map((name, index) => ({
        id: `cat-${serverId}-${index}`,
        name,
        serverId,
        position: index,
      }));

      // Create channels
      const channels = template.channels.map((ch, index) => {
        const category = categories.find((cat) => cat.name === ch.category)!;
        return {
          id: `${serverId}-ch-${index}`,
          name: ch.name,
          type: ch.type,
          serverId,
          categoryId: category.id,
          position: index,
          unreadCount: 0,
          isNsfw: false,
          slowMode: 0,
        };
      });

      // Create new server
      const newServer = {
        id: serverId,
        name: serverName,
        icon: serverIcon,
        ownerId: "current-user",
        memberCount: 1,
        isOwner: true,
        categories,
        channels,
        unreadCount: 0,
        createdAt: new Date(),
        roles: generateDefaultRoles(serverId),
        settings: {
          ...DEFAULT_SERVER_SETTINGS,
          icon: serverIcon,
          banner: null,
        },
        description: "",
      };

      // Add to store
      useServerStore.setState((state) => ({
        servers: [...state.servers, newServer],
        currentServerId: serverId,
        currentChannelId: channels[0]?.id || null,
      }));

      toast.success("Server Created", `${serverName} has been created successfully`);
      handleClose();

      // Navigate to new server
      window.location.href = `/servers/${serverId}/${channels[0]?.id || ""}`;
    } catch (error) {
      toast.error("Creation Failed", "Could not create server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isCreateServerOpen}
      onClose={handleClose}
      title={step === 1 ? "Choose a Template" : "Customize Your Server"}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          {step === 2 ? (
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
            {step === 1 ? (
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
        {step === 1 ? (
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
        ) : (
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
      </AnimatePresence>
    </Modal>
  );
}
