"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  GripVertical,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Hash,
  Save,
  Loader2,
} from "lucide-react";

import { Button } from "../../../ui/button/button";
import { Input, Textarea } from "../../../ui/input/input";
import { Toggle } from "../../../ui/toggle/toggle";
import { useServerStore } from "../../../../store/server.store";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/stores/toast-store";

interface OnboardingStep {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

interface WelcomeScreenData {
  enabled: boolean;
  title: string;
  description: string;
  featuredChannelIds: string[];
  onboardingSteps: OnboardingStep[];
  requireRoleSelection: boolean;
  requireRulesAcceptance: boolean;
}

const DEFAULT_WELCOME: WelcomeScreenData = {
  enabled: false,
  title: "",
  description: "",
  featuredChannelIds: [],
  onboardingSteps: [],
  requireRoleSelection: false,
  requireRulesAcceptance: false,
};

interface WelcomeTabProps {
  serverId: string;
}

export function WelcomeTab({ serverId }: WelcomeTabProps) {
  const channels = useServerStore((s) => {
    const server = s.servers.find((srv) => srv.id === serverId);
    return server?.channels ?? [];
  });

  const [data, setData] = useState<WelcomeScreenData>(DEFAULT_WELCOME);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track original data for dirty checking
  const [originalData, setOriginalData] = useState<string>("");

  // Load welcome screen from Supabase
  useEffect(() => {
    const loadWelcomeScreen = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data: row, error } = await supabase
          .from("server_welcome_screens")
          .select("*")
          .eq("server_id", serverId)
          .maybeSingle();

        if (error) throw error;

        if (row) {
          const loaded: WelcomeScreenData = {
            enabled: row.enabled ?? false,
            title: (row.title as string) || "",
            description: (row.description as string) || "",
            featuredChannelIds: (row.featured_channel_ids as string[]) || [],
            onboardingSteps: (row.onboarding_steps as OnboardingStep[]) || [],
            requireRoleSelection: row.require_role_selection ?? false,
            requireRulesAcceptance: row.require_rules_acceptance ?? false,
          };
          setData(loaded);
          setOriginalData(JSON.stringify(loaded));
        } else {
          setOriginalData(JSON.stringify(DEFAULT_WELCOME));
        }
      } catch (err) {
        console.error("Error loading welcome screen:", err);
        toast.error("Load Failed", "Could not load welcome screen settings");
      } finally {
        setIsLoading(false);
      }
    };

    loadWelcomeScreen();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId]);

  // Track changes
  useEffect(() => {
    if (!originalData) return;
    setHasChanges(JSON.stringify(data) !== originalData);
  }, [data, originalData]);

  const textChannels = useMemo(
    () => channels.filter((ch) => ch.type === "text" || ch.type === "announcement"),
    [channels],
  );

  const updateField = useCallback(
    <K extends keyof WelcomeScreenData>(key: K, value: WelcomeScreenData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // Featured channel toggling
  const toggleFeaturedChannel = useCallback(
    (channelId: string) => {
      setData((prev) => {
        const ids = prev.featuredChannelIds.includes(channelId)
          ? prev.featuredChannelIds.filter((id) => id !== channelId)
          : [...prev.featuredChannelIds, channelId];
        return { ...prev, featuredChannelIds: ids };
      });
    },
    [],
  );

  // Onboarding steps management
  const addStep = useCallback(() => {
    const newStep: OnboardingStep = {
      id: crypto.randomUUID(),
      emoji: "👋",
      title: "",
      description: "",
    };
    setData((prev) => ({
      ...prev,
      onboardingSteps: [...prev.onboardingSteps, newStep],
    }));
  }, []);

  const removeStep = useCallback((stepId: string) => {
    setData((prev) => ({
      ...prev,
      onboardingSteps: prev.onboardingSteps.filter((s) => s.id !== stepId),
    }));
  }, []);

  const updateStep = useCallback(
    (stepId: string, updates: Partial<OnboardingStep>) => {
      setData((prev) => ({
        ...prev,
        onboardingSteps: prev.onboardingSteps.map((s) =>
          s.id === stepId ? { ...s, ...updates } : s,
        ),
      }));
    },
    [],
  );

  const moveStep = useCallback((stepId: string, direction: "up" | "down") => {
    setData((prev) => {
      const steps = [...prev.onboardingSteps];
      const idx = steps.findIndex((s) => s.id === stepId);
      if (idx === -1) return prev;

      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= steps.length) return prev;

      // Swap
      [steps[idx], steps[targetIdx]] = [steps[targetIdx], steps[idx]];
      return { ...prev, onboardingSteps: steps };
    });
  }, []);

  // Save to Supabase
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("server_welcome_screens")
        .upsert(
          {
            server_id: serverId,
            enabled: data.enabled,
            title: data.title || null,
            description: data.description || null,
            featured_channel_ids: data.featuredChannelIds,
            onboarding_steps: data.onboardingSteps,
            require_role_selection: data.requireRoleSelection,
            require_rules_acceptance: data.requireRulesAcceptance,
          },
          { onConflict: "server_id" },
        );

      if (error) throw error;

      setOriginalData(JSON.stringify(data));
      setHasChanges(false);
      toast.success("Saved", "Welcome screen settings updated");
    } catch (err) {
      console.error("Error saving welcome screen:", err);
      toast.error("Save Failed", "Could not save welcome screen settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        <span className="ml-3 text-sm text-slate-400">Loading welcome screen...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Welcome Screen</h3>
          <p className="text-sm text-slate-300 mt-1">
            Configure the welcome experience for new members joining your server
          </p>
        </div>
        <Toggle
          checked={data.enabled}
          onChange={(e) => updateField("enabled", e.target.checked)}
          label="Enabled"
        />
      </div>

      <AnimatePresence>
        {data.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6 overflow-hidden"
          >
            {/* Title & Description */}
            <div className="glass-card rounded-xl p-6 space-y-4">
              <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                Welcome Message
              </h4>

              <Input
                label="Title"
                value={data.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Welcome to our server!"
                maxLength={100}
                helperText={`${data.title.length}/100 characters`}
              />

              <Textarea
                label="Description"
                value={data.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Tell new members what your server is about and how to get started..."
                maxLength={2000}
                helperText={`${data.description.length}/2000 characters`}
                rows={4}
              />
            </div>

            {/* Featured Channels */}
            <div className="glass-card rounded-xl p-6 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                  Featured Channels
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Select channels to highlight for new members
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto settings-scrollbar pr-1">
                {textChannels.map((channel) => {
                  const isSelected = data.featuredChannelIds.includes(channel.id);
                  return (
                    <label
                      key={channel.id}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150
                        border
                        ${
                          isSelected
                            ? "border-blue-500/40 bg-blue-600/10"
                            : "border-slate-700/30 hover:border-slate-600/40 hover:bg-slate-800/20"
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleFeaturedChannel(channel.id)}
                        className="
                          w-4 h-4 rounded shrink-0
                          border-slate-600 bg-slate-800/50
                          text-blue-500 focus:ring-blue-500/30 focus:ring-offset-0
                        "
                      />
                      <Hash className="w-4 h-4 shrink-0 text-slate-400" />
                      <span className="text-sm text-slate-200 truncate">
                        {channel.name}
                      </span>
                    </label>
                  );
                })}
              </div>

              {textChannels.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  No text channels available
                </p>
              )}
            </div>

            {/* Onboarding Steps */}
            <div className="glass-card rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                    Onboarding Steps
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Guide new members through getting started
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={addStep}
                  className="gap-1.5"
                  disabled={data.onboardingSteps.length >= 10}
                >
                  <Plus className="w-4 h-4" />
                  Add Step
                </Button>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {data.onboardingSteps.map((step, index) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      className="border border-slate-700/30 rounded-lg p-4 space-y-3 bg-slate-800/20"
                    >
                      <div className="flex items-center gap-3">
                        {/* Reorder controls */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveStep(step.id, "up")}
                            disabled={index === 0}
                            className="p-0.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveStep(step.id, "down")}
                            disabled={index === data.onboardingSteps.length - 1}
                            className="p-0.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <GripVertical className="w-4 h-4 text-slate-500 shrink-0" />

                        {/* Step number badge */}
                        <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-blue-300">
                            {index + 1}
                          </span>
                        </div>

                        {/* Emoji input */}
                        <input
                          type="text"
                          value={step.emoji}
                          onChange={(e) =>
                            updateStep(step.id, { emoji: e.target.value.slice(0, 4) })
                          }
                          className="
                            w-10 h-10 text-center text-lg rounded-lg shrink-0
                            bg-slate-800/50 border border-slate-700/40
                            text-slate-100 focus:border-blue-500/50 focus:outline-hidden
                            transition-colors
                          "
                          placeholder="👋"
                          maxLength={4}
                        />

                        {/* Title */}
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) =>
                            updateStep(step.id, { title: e.target.value })
                          }
                          className="
                            flex-1 px-3 py-2 rounded-lg text-sm
                            bg-slate-800/50 border border-slate-700/40
                            text-slate-100 placeholder-slate-500
                            focus:border-blue-500/50 focus:outline-hidden
                            transition-colors
                          "
                          placeholder="Step title"
                          maxLength={100}
                        />

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => removeStep(step.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/15 text-slate-400 hover:text-red-400 transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <textarea
                        value={step.description}
                        onChange={(e) =>
                          updateStep(step.id, { description: e.target.value })
                        }
                        className="
                          w-full px-3 py-2 rounded-lg text-sm resize-none
                          bg-slate-800/50 border border-slate-700/40
                          text-slate-100 placeholder-slate-500
                          focus:border-blue-500/50 focus:outline-hidden
                          transition-colors
                        "
                        placeholder="Describe this step..."
                        rows={2}
                        maxLength={500}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {data.onboardingSteps.length === 0 && (
                  <div className="text-center py-8 border border-dashed border-slate-700/40 rounded-lg">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm text-slate-400">No onboarding steps yet</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Add steps to guide new members
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Requirements */}
            <div className="glass-card rounded-xl p-6 space-y-4">
              <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                Requirements
              </h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-700/30 hover:border-slate-600/40 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      Require Role Selection
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      New members must pick a role before proceeding
                    </p>
                  </div>
                  <Toggle
                    checked={data.requireRoleSelection}
                    onChange={(e) =>
                      updateField("requireRoleSelection", e.target.checked)
                    }
                    size="sm"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-700/30 hover:border-slate-600/40 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      Require Rules Acceptance
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      New members must accept the server rules
                    </p>
                  </div>
                  <Toggle
                    checked={data.requireRulesAcceptance}
                    onChange={(e) =>
                      updateField("requireRulesAcceptance", e.target.checked)
                    }
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Bar */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="
              sticky bottom-0 p-4 -mx-6 -mb-6 mt-4
              bg-gradient-to-t from-slate-900/95 via-slate-900/90 to-transparent
              backdrop-blur-sm
            "
          >
            <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-700/40 bg-slate-800/80">
              <p className="text-sm text-slate-300">
                You have unsaved changes
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setData(JSON.parse(originalData));
                    setHasChanges(false);
                  }}
                  disabled={isSaving}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-1.5"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
