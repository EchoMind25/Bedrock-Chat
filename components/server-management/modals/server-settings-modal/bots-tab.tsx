"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Bot,
  Power,
  PowerOff,
  Sparkles,
  Terminal,
  Webhook,
  MessageSquare,
  AtSign,
  Hash,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Button } from "../../../ui/button/button";
import { Input } from "../../../ui/input/input";
import { Toggle } from "../../../ui/toggle/toggle";
import { Badge } from "../../../ui/badge/badge";
import { Dropdown } from "../../../ui/dropdown/dropdown";
import { cn } from "../../../../lib/utils/cn";
import { useServerBotsStore } from "../../../../store/server-bots.store";
import type { BotType, ClaudeTriggerMode, BotCommand } from "../../../../lib/types/server-bot";
import { DEFAULT_CLAUDE_CONFIG } from "../../../../lib/types/server-bot";

interface BotsTabProps {
  serverId: string;
}

const BOT_TYPE_META: Record<BotType, { label: string; icon: typeof Bot; color: string; description: string }> = {
  custom: {
    label: "Custom Bot",
    icon: Terminal,
    color: "text-blue-400",
    description: "A programmable bot with custom logic",
  },
  claude: {
    label: "Claude AI",
    icon: Sparkles,
    color: "text-violet-400",
    description: "AI-powered bot using Claude API",
  },
  webhook: {
    label: "Webhook Bot",
    icon: Webhook,
    color: "text-emerald-400",
    description: "A bot triggered by webhook events",
  },
};

const TRIGGER_MODE_OPTIONS = [
  { id: "mention", value: "mention", label: "Mention (@bot)" },
  { id: "prefix", value: "prefix", label: "Command Prefix" },
  { id: "all_messages", value: "all_messages", label: "All Messages" },
];

const RESPONSE_TYPE_OPTIONS = [
  { id: "text", value: "text", label: "Text Response" },
  { id: "embed", value: "embed", label: "Embed Response" },
  { id: "action", value: "action", label: "Action (side effect)" },
];

export function BotsTab({ serverId }: BotsTabProps) {
  const loadBots = useServerBotsStore((s) => s.loadBots);
  const createBot = useServerBotsStore((s) => s.createBot);
  const updateBot = useServerBotsStore((s) => s.updateBot);
  const deleteBot = useServerBotsStore((s) => s.deleteBot);
  const updateClaudeConfig = useServerBotsStore((s) => s.updateClaudeConfig);
  const loadCommands = useServerBotsStore((s) => s.loadCommands);
  const createCommand = useServerBotsStore((s) => s.createCommand);
  const deleteCommand = useServerBotsStore((s) => s.deleteCommand);
  const getBotsByServer = useServerBotsStore((s) => s.getBotsByServer);
  const getCommandsByBot = useServerBotsStore((s) => s.getCommandsByBot);
  const isLoading = useServerBotsStore((s) => s.isLoading);

  const [isCreating, setIsCreating] = useState(false);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<BotType>("custom");

  // Claude config editing state (used when a claude bot is selected)
  const [claudeSystemPrompt, setClaudeSystemPrompt] = useState(DEFAULT_CLAUDE_CONFIG.systemPrompt);
  const [claudeTriggerMode, setClaudeTriggerMode] = useState<ClaudeTriggerMode>(DEFAULT_CLAUDE_CONFIG.triggerMode);
  const [claudePrefix, setClaudePrefix] = useState(DEFAULT_CLAUDE_CONFIG.prefix);
  const [claudeTemperature, setClaudeTemperature] = useState(DEFAULT_CLAUDE_CONFIG.temperature);
  const [claudeMaxTokens, setClaudeMaxTokens] = useState(DEFAULT_CLAUDE_CONFIG.maxTokens);
  const [claudePersonalityName, setClaudePersonalityName] = useState(DEFAULT_CLAUDE_CONFIG.personality.name);
  const [claudePersonalityTraits, setClaudePersonalityTraits] = useState<string[]>(DEFAULT_CLAUDE_CONFIG.personality.traits);
  const [claudePersonalityTone, setClaudePersonalityTone] = useState(DEFAULT_CLAUDE_CONFIG.personality.tone);
  const [newTrait, setNewTrait] = useState("");

  // Command form state
  const [showCommandForm, setShowCommandForm] = useState(false);
  const [cmdName, setCmdName] = useState("");
  const [cmdTrigger, setCmdTrigger] = useState("");
  const [cmdDescription, setCmdDescription] = useState("");
  const [cmdResponseType, setCmdResponseType] = useState<BotCommand["responseType"]>("text");

  // Sections expand state
  const [showClaudeConfig, setShowClaudeConfig] = useState(true);
  const [showCommands, setShowCommands] = useState(true);

  // Load bots on mount
  useEffect(() => {
    loadBots(serverId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId]);

  const bots = getBotsByServer(serverId);

  const selectedBot = useMemo(() => {
    if (!selectedBotId) return null;
    return bots.find((b) => b.id === selectedBotId) || null;
  }, [bots, selectedBotId]);

  const commands = selectedBotId ? getCommandsByBot(selectedBotId) : [];

  // Load commands and sync Claude config when selecting a bot
  useEffect(() => {
    if (!selectedBotId) return;
    loadCommands(selectedBotId);

    const bot = bots.find((b) => b.id === selectedBotId);
    if (bot?.botType === "claude" && bot.claudeConfig) {
      const cfg = bot.claudeConfig;
      setClaudeSystemPrompt(cfg.systemPrompt);
      setClaudeTriggerMode(cfg.triggerMode);
      setClaudePrefix(cfg.prefix);
      setClaudeTemperature(cfg.temperature);
      setClaudeMaxTokens(cfg.maxTokens);
      setClaudePersonalityName(cfg.personality.name);
      setClaudePersonalityTraits([...cfg.personality.traits]);
      setClaudePersonalityTone(cfg.personality.tone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBotId]);

  const resetCreateForm = () => {
    setFormName("");
    setFormDescription("");
    setFormType("custom");
    setIsCreating(false);
  };

  const handleCreate = async () => {
    if (!formName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const bot = await createBot(serverId, {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        botType: formType,
      });

      resetCreateForm();
      setSelectedBotId(bot.id);
    } catch {
      // Error handled by store toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (botId: string, currentActive: boolean) => {
    try {
      await updateBot(botId, { isActive: !currentActive });
    } catch {
      // Error handled by store toast
    }
  };

  const handleDelete = async (botId: string) => {
    try {
      await deleteBot(serverId, botId);
      setDeleteConfirmId(null);
      if (selectedBotId === botId) {
        setSelectedBotId(null);
      }
    } catch {
      // Error handled by store toast
    }
  };

  const handleSaveClaudeConfig = async () => {
    if (!selectedBotId) return;

    try {
      await updateClaudeConfig(selectedBotId, {
        systemPrompt: claudeSystemPrompt,
        triggerMode: claudeTriggerMode,
        prefix: claudePrefix,
        temperature: claudeTemperature,
        maxTokens: claudeMaxTokens,
        personality: {
          name: claudePersonalityName,
          traits: claudePersonalityTraits,
          tone: claudePersonalityTone,
        },
      });
    } catch {
      // Error handled by store toast
    }
  };

  const handleAddTrait = () => {
    const trimmed = newTrait.trim();
    if (!trimmed || claudePersonalityTraits.includes(trimmed)) return;
    setClaudePersonalityTraits((prev) => [...prev, trimmed]);
    setNewTrait("");
  };

  const handleRemoveTrait = (trait: string) => {
    setClaudePersonalityTraits((prev) => prev.filter((t) => t !== trait));
  };

  const handleCreateCommand = async () => {
    if (!selectedBotId || !cmdName.trim() || !cmdTrigger.trim()) return;

    try {
      await createCommand(selectedBotId, {
        name: cmdName.trim(),
        trigger: cmdTrigger.trim(),
        description: cmdDescription.trim() || undefined,
        responseType: cmdResponseType,
      });

      setCmdName("");
      setCmdTrigger("");
      setCmdDescription("");
      setCmdResponseType("text");
      setShowCommandForm(false);
    } catch {
      // Error handled by store toast
    }
  };

  const handleDeleteCommand = async (commandId: string) => {
    if (!selectedBotId) return;
    try {
      await deleteCommand(selectedBotId, commandId);
    } catch {
      // Error handled by store toast
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Bots</h3>
          <p className="text-sm text-slate-300 mt-1">
            Manage bot integrations and AI assistants
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setIsCreating(true);
            setSelectedBotId(null);
          }}
          disabled={isCreating}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Create Bot
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6 min-h-[540px]">
        {/* Bot List */}
        <div className="glass-card rounded-xl p-4 overflow-y-auto scrollbar-thin">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Server Bots &mdash; {bots.length}
          </h4>

          {isLoading && bots.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-6 h-6 mx-auto mb-2 rounded-full border-2 border-slate-500 border-t-blue-400 animate-spin" />
              <p className="text-xs text-slate-400">Loading...</p>
            </div>
          ) : bots.length > 0 ? (
            <div className="space-y-2">
              {bots.map((bot) => {
                const meta = BOT_TYPE_META[bot.botType];
                const TypeIcon = meta.icon;
                const isSelected = selectedBotId === bot.id;

                return (
                  <button
                    key={bot.id}
                    type="button"
                    onClick={() => {
                      setSelectedBotId(bot.id);
                      setIsCreating(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
                      "hover:scale-[1.01] active:scale-[0.99]",
                      isSelected
                        ? "border border-blue-500/40 bg-blue-600/15 ring-1 ring-blue-500/20"
                        : "border border-slate-700/30 hover:border-slate-600/40 hover:bg-slate-800/30"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", `${meta.color} bg-slate-800/50`)}>
                      <TypeIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-slate-100 truncate">{bot.name}</span>
                        {!bot.isActive && (
                          <span className="px-1 py-0.5 rounded text-[9px] bg-slate-700/50 text-slate-400 shrink-0">OFF</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{meta.label}</span>
                        <span className="text-slate-600">|</span>
                        <span>{bot.messagesSent} msgs</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bot className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm text-slate-400">No bots yet</p>
            </div>
          )}
        </div>

        {/* Bot Detail / Create Panel */}
        <div className="col-span-2 overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait">
            {isCreating ? (
              /* ── Create Bot Form ── */
              <motion.div
                key="create"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card rounded-xl p-6 space-y-5"
              >
                <h3 className="text-lg font-semibold text-slate-100">Create Bot</h3>

                <Input
                  label="Bot Name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Moderation Bot"
                  maxLength={100}
                />

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-200">Description</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="What does this bot do?"
                    maxLength={500}
                    rows={2}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 resize-none",
                      "bg-slate-800/50 border border-slate-700/30 outline-hidden",
                      "focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                    )}
                  />
                  <p className="text-xs text-slate-500">{formDescription.length}/500</p>
                </div>

                {/* Bot Type Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Bot Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(Object.entries(BOT_TYPE_META) as [BotType, typeof BOT_TYPE_META[BotType]][]).map(([type, meta]) => {
                      const TypeIcon = meta.icon;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormType(type)}
                          className={cn(
                            "p-4 rounded-lg border-2 transition-all text-left relative",
                            formType === type
                              ? "border-blue-500/50 bg-blue-500/10"
                              : "border-slate-700/30 hover:border-slate-600/40 hover:bg-slate-800/20"
                          )}
                        >
                          <TypeIcon className={cn("w-5 h-5 mb-2", meta.color)} />
                          <div className="text-sm font-medium text-slate-100">{meta.label}</div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{meta.description}</p>
                          {type === "claude" && (
                            <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                              AI
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formType === "claude" && (
                  <div className="p-3 rounded-lg border border-violet-500/30 bg-violet-500/10">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                      <span className="text-sm font-medium text-violet-200">Claude API Coming Soon</span>
                    </div>
                    <p className="text-xs text-violet-300/70 mt-1">
                      Claude integration is in beta. You can configure the bot now and it will activate when the API is available.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-4 border-t border-slate-700/30">
                  <Button onClick={handleCreate} loading={isSubmitting} disabled={!formName.trim()}>
                    Create Bot
                  </Button>
                  <Button variant="ghost" onClick={resetCreateForm}>
                    Cancel
                  </Button>
                </div>
              </motion.div>
            ) : selectedBot ? (
              /* ── Bot Detail View ── */
              <motion.div
                key={`detail-${selectedBot.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Bot Header Card */}
                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        `${BOT_TYPE_META[selectedBot.botType].color} bg-slate-800/50`
                      )}>
                        {(() => {
                          const Icon = BOT_TYPE_META[selectedBot.botType].icon;
                          return <Icon className="w-6 h-6" />;
                        })()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-100">{selectedBot.name}</h3>
                          {selectedBot.botType === "claude" && (
                            <Badge variant="warning" className="text-[10px]">
                              Claude API Coming Soon
                            </Badge>
                          )}
                          <Badge
                            variant={selectedBot.isActive ? "success" : "default"}
                            className="text-[10px]"
                          >
                            {selectedBot.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400 mt-0.5">
                          {selectedBot.description || BOT_TYPE_META[selectedBot.botType].description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {selectedBot.messagesSent} messages sent
                          </span>
                          {selectedBot.lastActiveAt && (
                            <span>
                              Last active {new Date(selectedBot.lastActiveAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(selectedBot.id, selectedBot.isActive)}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          selectedBot.isActive
                            ? "text-emerald-400 hover:bg-emerald-500/15"
                            : "text-slate-500 hover:bg-slate-700/30"
                        )}
                        title={selectedBot.isActive ? "Deactivate" : "Activate"}
                      >
                        {selectedBot.isActive ? (
                          <Power className="w-4 h-4" />
                        ) : (
                          <PowerOff className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirmId(
                            deleteConfirmId === selectedBot.id ? null : selectedBot.id
                          )
                        }
                        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/15 transition-all"
                        title="Delete bot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Delete Confirmation */}
                  <AnimatePresence>
                    {deleteConfirmId === selectedBot.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-slate-700/30 flex items-center justify-between">
                          <p className="text-sm text-red-300">
                            Delete &quot;{selectedBot.name}&quot;? All commands will be removed.
                          </p>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(null)}>
                              Cancel
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleDelete(selectedBot.id)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Claude Configuration (only for claude type) */}
                {selectedBot.botType === "claude" && (
                  <div className="glass-card rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowClaudeConfig(!showClaudeConfig)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-800/20 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        <h4 className="text-sm font-semibold text-slate-100">Claude Configuration</h4>
                      </div>
                      {showClaudeConfig ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    <AnimatePresence>
                      {showClaudeConfig && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 pt-0 space-y-4">
                            {/* System Prompt */}
                            <div className="space-y-1.5">
                              <label className="text-sm font-medium text-slate-200">System Prompt</label>
                              <textarea
                                value={claudeSystemPrompt}
                                onChange={(e) => setClaudeSystemPrompt(e.target.value)}
                                placeholder="You are a helpful server assistant..."
                                rows={4}
                                className={cn(
                                  "w-full rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 resize-none",
                                  "bg-slate-800/50 border border-slate-700/30 outline-hidden",
                                  "focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all",
                                  "font-mono text-xs"
                                )}
                              />
                            </div>

                            {/* Trigger Mode */}
                            <Dropdown
                              label="Trigger Mode"
                              items={TRIGGER_MODE_OPTIONS}
                              value={claudeTriggerMode}
                              onSelect={(v) => setClaudeTriggerMode(v as ClaudeTriggerMode)}
                            />

                            {/* Prefix (only when trigger mode is prefix) */}
                            <AnimatePresence>
                              {claudeTriggerMode === "prefix" && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <Input
                                    label="Command Prefix"
                                    value={claudePrefix}
                                    onChange={(e) => setClaudePrefix(e.target.value)}
                                    placeholder="!"
                                    maxLength={10}
                                    leftIcon={<Hash className="w-4 h-4" />}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Temperature */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-200">Temperature</label>
                                <span className="text-xs font-mono text-slate-400">{claudeTemperature.toFixed(2)}</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={claudeTemperature}
                                onChange={(e) => setClaudeTemperature(Number.parseFloat(e.target.value))}
                                className={cn(
                                  "w-full h-2 rounded-full appearance-none cursor-pointer",
                                  "bg-slate-700/50",
                                  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4",
                                  "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-400",
                                  "[&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
                                )}
                              />
                              <div className="flex justify-between text-[10px] text-slate-500">
                                <span>Precise (0)</span>
                                <span>Creative (1)</span>
                              </div>
                            </div>

                            {/* Max Tokens */}
                            <Input
                              label="Max Tokens"
                              type="number"
                              value={String(claudeMaxTokens)}
                              onChange={(e) => {
                                const val = Number.parseInt(e.target.value, 10);
                                if (!Number.isNaN(val) && val > 0 && val <= 8192) {
                                  setClaudeMaxTokens(val);
                                }
                              }}
                              placeholder="1024"
                              helperText="Maximum tokens in response (1-8192)"
                            />

                            {/* Personality */}
                            <div className="space-y-3 p-3 rounded-lg border border-slate-700/20 bg-slate-800/20">
                              <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                Personality
                              </h5>

                              <Input
                                label="Display Name"
                                value={claudePersonalityName}
                                onChange={(e) => setClaudePersonalityName(e.target.value)}
                                placeholder="Assistant"
                                maxLength={50}
                                leftIcon={<AtSign className="w-4 h-4" />}
                              />

                              <Input
                                label="Tone"
                                value={claudePersonalityTone}
                                onChange={(e) => setClaudePersonalityTone(e.target.value)}
                                placeholder="e.g., conversational, formal, playful"
                                maxLength={100}
                              />

                              {/* Traits */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-200">Traits</label>
                                <div className="flex flex-wrap gap-1.5">
                                  {claudePersonalityTraits.map((trait) => (
                                    <span
                                      key={trait}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-violet-500/15 text-violet-300 border border-violet-500/25"
                                    >
                                      {trait}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveTrait(trait)}
                                        className="p-0.5 rounded-full hover:bg-violet-500/30 transition-colors"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={newTrait}
                                    onChange={(e) => setNewTrait(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddTrait();
                                      }
                                    }}
                                    placeholder="Add a trait..."
                                    maxLength={30}
                                    className={cn(
                                      "flex-1 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500",
                                      "bg-slate-800/50 border border-slate-700/30 outline-hidden",
                                      "focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                                    )}
                                  />
                                  <Button size="sm" variant="secondary" onClick={handleAddTrait} disabled={!newTrait.trim()}>
                                    Add
                                  </Button>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-3 border-t border-slate-700/30">
                              <Button onClick={handleSaveClaudeConfig} variant="primary">
                                Save Configuration
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Bot Commands */}
                <div className="glass-card rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowCommands(!showCommands)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-800/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-blue-400" />
                      <h4 className="text-sm font-semibold text-slate-100">
                        Commands ({commands.length})
                      </h4>
                    </div>
                    {showCommands ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showCommands && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 space-y-3">
                          {/* Command List */}
                          {commands.length > 0 ? (
                            <div className="space-y-2">
                              {commands.map((cmd) => (
                                <div
                                  key={cmd.id}
                                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-700/30 bg-slate-800/20"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-slate-700/40 flex items-center justify-center shrink-0">
                                    <span className="text-xs font-mono text-blue-400">/</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-slate-100">{cmd.name}</span>
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700/40 text-slate-300">
                                        {cmd.trigger}
                                      </span>
                                      <Badge variant="default" className="text-[9px]">
                                        {cmd.responseType}
                                      </Badge>
                                    </div>
                                    {cmd.description && (
                                      <p className="text-xs text-slate-400 mt-0.5 truncate">{cmd.description}</p>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCommand(cmd.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/15 transition-all shrink-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 py-2">
                              No commands configured. Add a command to define triggers and responses.
                            </p>
                          )}

                          {/* Add Command Form */}
                          <AnimatePresence>
                            {showCommandForm ? (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-3 rounded-lg border border-slate-700/30 bg-slate-800/20 space-y-3">
                                  <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    New Command
                                  </h5>
                                  <div className="grid grid-cols-2 gap-3">
                                    <Input
                                      label="Name"
                                      value={cmdName}
                                      onChange={(e) => setCmdName(e.target.value)}
                                      placeholder="help"
                                      maxLength={50}
                                    />
                                    <Input
                                      label="Trigger"
                                      value={cmdTrigger}
                                      onChange={(e) => setCmdTrigger(e.target.value)}
                                      placeholder="/help"
                                      maxLength={50}
                                    />
                                  </div>
                                  <Input
                                    label="Description"
                                    value={cmdDescription}
                                    onChange={(e) => setCmdDescription(e.target.value)}
                                    placeholder="Displays help information"
                                    maxLength={200}
                                  />
                                  <Dropdown
                                    label="Response Type"
                                    items={RESPONSE_TYPE_OPTIONS}
                                    value={cmdResponseType}
                                    onSelect={(v) => setCmdResponseType(v as BotCommand["responseType"])}
                                  />
                                  <div className="flex items-center gap-2 pt-2">
                                    <Button
                                      size="sm"
                                      onClick={handleCreateCommand}
                                      disabled={!cmdName.trim() || !cmdTrigger.trim()}
                                    >
                                      Add Command
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setShowCommandForm(false)}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setShowCommandForm(true)}
                                className="gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add Command
                              </Button>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              /* ── Empty State ── */
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card rounded-xl flex items-center justify-center h-full min-h-[400px]"
              >
                <div className="text-center p-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                    <Bot className="w-10 h-10 text-slate-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-200 mb-2">
                    Select a bot to configure
                  </h4>
                  <p className="text-sm text-slate-400 max-w-sm">
                    Choose a bot from the list to edit its settings, commands, and AI configuration
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
