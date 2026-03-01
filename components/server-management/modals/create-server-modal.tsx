"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Upload } from "lucide-react";
import { Modal } from "../../ui/modal/modal";
import { Input } from "../../ui/input/input";
import { Button } from "../../ui/button/button";
import { ImageUpload } from "../file-upload/image-upload";
import { TemplateCard, TemplatePreview } from "../templates/template-card";
import { useServerManagementStore } from "../../../store/server-management.store";
import { useServerStore } from "../../../store/server.store";
import { useAuthStore } from "../../../store/auth.store";
import { toast } from "../../../lib/stores/toast-store";
import { usePointsStore } from "../../../store/points.store";
import { createClient } from "../../../lib/supabase/client";
import { createServerFromDefinition } from "../../../lib/services/server-creation";
import { ALL_TEMPLATES } from "../../../lib/templates/builtin";
import type { BuiltinTemplate } from "../../../lib/templates/builtin";
import { DEFAULT_SERVER_SETTINGS } from "../../../lib/types/server-settings";
import { deriveThemeColor } from "../../../lib/utils/derive-theme-color";

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
  const isCreateServerOpen = useServerManagementStore((state) => state.isCreateServerOpen);
  const closeCreateServer = useServerManagementStore((state) => state.closeCreateServer);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState("community");
  const [serverName, setServerName] = useState("");
  const [serverIcon, setServerIcon] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Privacy settings
  const [isPublic, setIsPublic] = useState(false);
  const [allowDiscovery, setAllowDiscovery] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);
  const [isFamilyFriendly, setIsFamilyFriendly] = useState(false);
  const [category, setCategory] = useState("general");

  const selectedTemplate: BuiltinTemplate =
    ALL_TEMPLATES.find((t) => t.id === selectedTemplateId) || ALL_TEMPLATES[0];

  const handleClose = () => {
    closeCreateServer();
    setTimeout(() => {
      setStep(1);
      setSelectedTemplateId("community");
      setServerName("");
      setServerIcon(null);
      setError("");
      setIsPublic(false);
      setAllowDiscovery(false);
      setRequireApproval(true);
      setIsFamilyFriendly(false);
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
      // Auto-set family-friendly from template
      if (selectedTemplate.isFamilySafe) {
        setIsFamilyFriendly(true);
      }
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

      const result = await createServerFromDefinition(supabase, {
        definition: selectedTemplate.definition,
        serverName,
        userId: user.id,
        serverIcon,
        description: "",
        category,
        isPublic,
        allowDiscovery,
        requireApproval,
        isFamilyFriendly,
      });

      // Build local server object and add to store
      useServerStore.setState((state) => ({
        servers: [
          ...state.servers,
          {
            id: result.serverId,
            name: serverName.trim(),
            icon: serverIcon,
            ownerId: user.id,
            memberCount: 1,
            isOwner: true,
            categories: result.categories,
            channels: result.channels,
            unreadCount: 0,
            createdAt: new Date(),
            themeColor: deriveThemeColor(serverName.trim()),
            roles: result.roles,
            settings: {
              ...DEFAULT_SERVER_SETTINGS,
              icon: serverIcon,
              banner: null,
            },
            description: "",
            isFamilyFriendly,
          },
        ],
        currentServerId: result.serverId,
        currentChannelId: result.firstChannelId,
      }));

      toast.success("Server Created", `${serverName} has been created successfully`);

      try {
        usePointsStore.getState().awardServerCreated();
        usePointsStore.getState().updateAchievementProgress("founder", 1);
      } catch { /* ignore */ }

      handleClose();

      if (result.firstChannelId) {
        router.push(`/servers/${result.serverId}/${result.firstChannelId}`);
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

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ALL_TEMPLATES.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplateId === template.id}
                  onSelect={() => setSelectedTemplateId(template.id)}
                />
              ))}
            </div>

            {/* Template preview */}
            {selectedTemplate.id !== "custom" && (
              <TemplatePreview template={selectedTemplate} />
            )}

            {/* Import from Discord placeholder */}
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                disabled
                className="flex items-center gap-2 text-sm text-white/40 cursor-not-allowed"
                aria-label="Import from Discord (coming soon)"
              >
                <Upload className="w-4 h-4" aria-hidden="true" />
                Import from Discord
                <span className="text-xs text-white/30">(coming soon)</span>
              </button>
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
                <strong>{selectedTemplate.displayName}</strong> template.
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
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
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
                className="mt-0.5 w-4 h-4 rounded-sm border-white/30 text-blue-600 focus:ring-blue-500/50"
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
                  className="mt-0.5 w-4 h-4 rounded-sm border-white/30 text-blue-600 focus:ring-blue-500/50"
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
                  className="mt-0.5 w-4 h-4 rounded-sm border-white/30 text-blue-600 focus:ring-blue-500/50"
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

            {/* Family Friendly */}
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <input
                type="checkbox"
                id="family-friendly"
                checked={isFamilyFriendly}
                onChange={(e) => setIsFamilyFriendly(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded-sm border-white/30 text-emerald-600 focus:ring-emerald-500/50"
              />
              <div className="flex-1">
                <label htmlFor="family-friendly" className="text-sm font-medium text-white cursor-pointer">
                  Family Friendly
                </label>
                <p className="text-xs text-white/50 mt-1">
                  Mark this server as safe for all ages. This badge is visible to parents managing teen accounts.
                </p>
              </div>
            </div>

            {/* Privacy Summary */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex gap-2">
                <svg className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
