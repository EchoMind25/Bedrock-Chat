"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Webhook,
  Copy,
  Check,
  ExternalLink,
  ArrowDownToLine,
  ArrowUpFromLine,
  Eye,
  Power,
  PowerOff,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Button } from "../../../ui/button/button";
import { Input } from "../../../ui/input/input";
import { Badge } from "../../../ui/badge/badge";
import { Dropdown } from "../../../ui/dropdown/dropdown";
import { cn } from "../../../../lib/utils/cn";
import { useServerWebhooksStore } from "../../../../store/server-webhooks.store";
import { useServerStore } from "../../../../store/server.store";
import type { WebhookType, WebhookEvent } from "../../../../lib/types/server-webhook";

interface WebhooksTabProps {
  serverId: string;
}

const WEBHOOK_EVENT_OPTIONS: { id: WebhookEvent; label: string; description: string }[] = [
  { id: "message_create", label: "Message Created", description: "When a new message is sent" },
  { id: "member_join", label: "Member Joined", description: "When a member joins the server" },
  { id: "member_leave", label: "Member Left", description: "When a member leaves the server" },
  { id: "event_create", label: "Event Created", description: "When a server event is created" },
];

export function WebhooksTab({ serverId }: WebhooksTabProps) {
  const loadWebhooks = useServerWebhooksStore((s) => s.loadWebhooks);
  const createWebhook = useServerWebhooksStore((s) => s.createWebhook);
  const updateWebhook = useServerWebhooksStore((s) => s.updateWebhook);
  const deleteWebhook = useServerWebhooksStore((s) => s.deleteWebhook);
  const getWebhooksByServer = useServerWebhooksStore((s) => s.getWebhooksByServer);
  const isLoading = useServerWebhooksStore((s) => s.isLoading);

  const servers = useServerStore((s) => s.servers);

  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<string | null>(null);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create form state
  const [formName, setFormName] = useState("");
  const [formChannelId, setFormChannelId] = useState("");
  const [formType, setFormType] = useState<WebhookType>("incoming");
  const [formUrl, setFormUrl] = useState("");
  const [formEvents, setFormEvents] = useState<WebhookEvent[]>([]);

  // Load webhooks on mount
  useEffect(() => {
    loadWebhooks(serverId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId]);

  const webhooks = getWebhooksByServer(serverId);

  // Build channel options from the current server
  const channelOptions = useMemo(() => {
    const server = servers.find((s) => s.id === serverId);
    if (!server) return [];
    return server.channels
      .filter((ch) => ch.type === "text" || ch.type === "announcement")
      .map((ch) => ({
        id: ch.id,
        value: ch.id,
        label: `# ${ch.name}`,
      }));
  }, [servers, serverId]);

  // Set default channel when options load
  useEffect(() => {
    if (!formChannelId && channelOptions.length > 0) {
      setFormChannelId(channelOptions[0].value);
    }
  }, [channelOptions, formChannelId]);

  const resetForm = () => {
    setFormName("");
    setFormChannelId(channelOptions[0]?.value || "");
    setFormType("incoming");
    setFormUrl("");
    setFormEvents([]);
    setIsCreating(false);
  };

  const handleCreate = async () => {
    if (!formName.trim() || !formChannelId || isSubmitting) return;
    if (formType === "outgoing" && !formUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const webhook = await createWebhook(serverId, {
        channelId: formChannelId,
        name: formName.trim(),
        type: formType,
        url: formType === "outgoing" ? formUrl.trim() : undefined,
        events: formType === "outgoing" ? formEvents : undefined,
      });

      // Show the token once
      setNewlyCreatedToken(webhook.token);
      setNewlyCreatedId(webhook.id);
      resetForm();
    } catch {
      // Error handled by store toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (webhookId: string, currentActive: boolean) => {
    try {
      await updateWebhook(webhookId, { isActive: !currentActive });
    } catch {
      // Error handled by store toast
    }
  };

  const handleDelete = async (webhookId: string) => {
    try {
      await deleteWebhook(serverId, webhookId);
      setDeleteConfirmId(null);
    } catch {
      // Error handled by store toast
    }
  };

  const handleCopyToken = async (token: string, webhookId: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedTokenId(webhookId);
      setTimeout(() => setCopiedTokenId(null), 2000);
    } catch {
      // Clipboard API may fail in some contexts
    }
  };

  const toggleEvent = (event: WebhookEvent) => {
    setFormEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Webhooks</h3>
          <p className="text-sm text-slate-300 mt-1">
            Manage webhook integrations for this server
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsCreating(true)}
          disabled={isCreating}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Create Webhook
        </Button>
      </div>

      {/* Newly Created Token Banner */}
      <AnimatePresence>
        {newlyCreatedToken && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl border-2 border-yellow-500/40 bg-yellow-500/10">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Eye className="w-4 h-4 text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-sm font-semibold text-yellow-200">
                    Webhook Token - Copy It Now
                  </p>
                  <p className="text-xs text-yellow-300/70">
                    This token will only be shown once. Save it somewhere secure.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 rounded-lg bg-slate-900/80 text-xs text-yellow-100 font-mono truncate border border-yellow-500/20">
                      {newlyCreatedToken}
                    </code>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleCopyToken(newlyCreatedToken, newlyCreatedId || "")}
                      className="gap-1 shrink-0"
                    >
                      {copiedTokenId === newlyCreatedId ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setNewlyCreatedToken(null);
                      setNewlyCreatedId(null);
                    }}
                    className="text-yellow-300/70 hover:text-yellow-200"
                  >
                    I have saved the token
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Webhook Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 rounded-xl glass-card space-y-4">
              <h4 className="font-medium text-slate-100">Create New Webhook</h4>

              <Input
                label="Webhook Name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., GitHub Notifications"
                maxLength={100}
              />

              <Dropdown
                label="Channel"
                items={channelOptions}
                value={formChannelId}
                onSelect={setFormChannelId}
                placeholder="Select a channel"
              />

              {/* Type Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType("incoming");
                      setFormUrl("");
                      setFormEvents([]);
                    }}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all text-left",
                      formType === "incoming"
                        ? "border-blue-500/50 bg-blue-500/10"
                        : "border-slate-700/30 hover:border-slate-600/40 hover:bg-slate-800/20"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowDownToLine className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-slate-100">Incoming</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      External services send messages to this channel
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType("outgoing")}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all text-left",
                      formType === "outgoing"
                        ? "border-blue-500/50 bg-blue-500/10"
                        : "border-slate-700/30 hover:border-slate-600/40 hover:bg-slate-800/20"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowUpFromLine className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-slate-100">Outgoing</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Server events are sent to an external URL
                    </p>
                  </button>
                </div>
              </div>

              {/* Outgoing-specific fields */}
              <AnimatePresence>
                {formType === "outgoing" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden space-y-4"
                  >
                    <Input
                      label="Payload URL"
                      value={formUrl}
                      onChange={(e) => setFormUrl(e.target.value)}
                      placeholder="https://example.com/webhook"
                      maxLength={2000}
                      leftIcon={<ExternalLink className="w-4 h-4" />}
                    />

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-200">
                        Event Subscriptions
                      </label>
                      <p className="text-xs text-slate-400">
                        Select which events will trigger this webhook
                      </p>
                      <div className="space-y-2 mt-2">
                        {WEBHOOK_EVENT_OPTIONS.map((event) => (
                          <label
                            key={event.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                              formEvents.includes(event.id)
                                ? "border-blue-500/40 bg-blue-500/10"
                                : "border-slate-700/30 hover:border-slate-600/40 hover:bg-slate-800/20"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={formEvents.includes(event.id)}
                              onChange={() => toggleEvent(event.id)}
                              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/30 focus:ring-offset-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-100">{event.label}</p>
                              <p className="text-xs text-slate-400">{event.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-700/30">
                <Button
                  onClick={handleCreate}
                  loading={isSubmitting}
                  disabled={
                    !formName.trim() ||
                    !formChannelId ||
                    (formType === "outgoing" && !formUrl.trim())
                  }
                >
                  Create Webhook
                </Button>
                <Button variant="ghost" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Webhooks List */}
      <div className="space-y-3">
        <AnimatePresence>
          {isLoading && webhooks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card rounded-xl p-8 text-center"
            >
              <div className="w-8 h-8 mx-auto mb-3 rounded-full border-2 border-slate-500 border-t-blue-400 animate-spin" />
              <p className="text-sm text-slate-400">Loading webhooks...</p>
            </motion.div>
          ) : webhooks.length > 0 ? (
            webhooks.map((webhook) => {
              const channel = channelOptions.find((ch) => ch.value === webhook.channelId);
              const isDeleting = deleteConfirmId === webhook.id;

              return (
                <motion.div
                  key={webhook.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    webhook.isActive
                      ? "glass-card border-slate-700/30"
                      : "bg-slate-900/30 border-slate-800/30 opacity-60"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Webhook Icon */}
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        webhook.type === "incoming"
                          ? "bg-blue-500/15 text-blue-400"
                          : "bg-emerald-500/15 text-emerald-400"
                      )}
                    >
                      {webhook.type === "incoming" ? (
                        <ArrowDownToLine className="w-5 h-5" />
                      ) : (
                        <ArrowUpFromLine className="w-5 h-5" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-slate-100 truncate">
                          {webhook.name}
                        </h4>
                        <Badge
                          variant={webhook.type === "incoming" ? "primary" : "success"}
                          className="text-[10px] shrink-0"
                        >
                          {webhook.type}
                        </Badge>
                        {!webhook.isActive && (
                          <Badge variant="default" className="text-[10px] shrink-0">
                            Inactive
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{channel?.label || "Unknown channel"}</span>
                        {webhook.lastUsedAt && (
                          <>
                            <span className="text-slate-600">|</span>
                            <span>
                              Last used{" "}
                              {new Date(webhook.lastUsedAt).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Event subscriptions for outgoing */}
                      {webhook.type === "outgoing" && webhook.events.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {webhook.events.map((event) => (
                            <span
                              key={event}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800/60 text-slate-300 border border-slate-700/30"
                            >
                              {event}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(webhook.id, webhook.isActive)}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          webhook.isActive
                            ? "text-emerald-400 hover:bg-emerald-500/15"
                            : "text-slate-500 hover:bg-slate-700/30"
                        )}
                        title={webhook.isActive ? "Deactivate" : "Activate"}
                      >
                        {webhook.isActive ? (
                          <Power className="w-4 h-4" />
                        ) : (
                          <PowerOff className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirmId(isDeleting ? null : webhook.id)
                        }
                        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/15 transition-all"
                        title="Delete webhook"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Delete Confirmation */}
                  <AnimatePresence>
                    {isDeleting && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-slate-700/30 flex items-center justify-between">
                          <p className="text-sm text-red-300">
                            Delete &quot;{webhook.name}&quot;? This cannot be undone.
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleDelete(webhook.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card rounded-xl p-12 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                <Webhook className="w-10 h-10 text-slate-500" />
              </div>
              <h4 className="text-lg font-semibold text-slate-200 mb-2">
                No webhooks yet
              </h4>
              <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                Webhooks let external services send messages to your channels or receive
                notifications when events happen in your server.
              </p>
              <Button onClick={() => setIsCreating(true)} className="gap-1.5">
                <Plus className="w-4 h-4" />
                Create First Webhook
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
