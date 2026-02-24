"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  X,
  Mic,
  Radio,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Check,
  Star,
  Ban,
} from "lucide-react";

import { Button } from "../../../ui/button/button";
import { Input, Textarea } from "../../../ui/input/input";
import { useServerEventsStore } from "../../../../store/server-events.store";
import { useServerStore } from "../../../../store/server.store";
import { useAuthStore } from "../../../../store/auth.store";
import type { ServerEvent, EventType, RSVPStatus } from "../../../../lib/types/server-event";

interface EventsTabProps {
  serverId: string;
}

// --- Event Type Config ---

const EVENT_TYPE_CONFIG: Record<EventType, { label: string; icon: typeof Mic; color: string }> = {
  voice: { label: "Voice", icon: Mic, color: "oklch(0.7 0.15 160)" },
  stage: { label: "Stage", icon: Radio, color: "oklch(0.7 0.2 300)" },
  external: { label: "External", icon: ExternalLink, color: "oklch(0.7 0.15 60)" },
};

const RSVP_OPTIONS: { status: RSVPStatus; label: string; icon: typeof Star }[] = [
  { status: "interested", label: "Interested", icon: Star },
  { status: "going", label: "Going", icon: Check },
  { status: "not_going", label: "Not Going", icon: Ban },
];

// --- Helper: format date ---

function formatEventDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatEventTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// --- Event Card Component ---

function EventCard({
  event,
  isAdmin,
  onRsvp,
  onCancel,
}: {
  event: ServerEvent;
  isAdmin: boolean;
  onRsvp: (eventId: string, status: RSVPStatus) => void;
  onCancel: (eventId: string) => void;
}) {
  const config = EVENT_TYPE_CONFIG[event.eventType];
  const TypeIcon = config.icon;
  const isActive = event.status === "active";
  const isPast = event.endsAt ? new Date() > event.endsAt : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        border rounded-xl p-4 transition-all duration-200
        ${
          isActive
            ? "border-green-500/30 bg-green-500/5"
            : "border-slate-700/30 bg-slate-800/20 hover:border-slate-600/40"
        }
      `}
    >
      <div className="flex items-start gap-4">
        {/* Date badge */}
        <div className="shrink-0 w-14 text-center">
          <div
            className="w-14 h-14 rounded-xl flex flex-col items-center justify-center"
            style={{
              backgroundColor: `color-mix(in oklch, ${config.color} 15%, transparent)`,
              borderColor: `color-mix(in oklch, ${config.color} 30%, transparent)`,
              borderWidth: "1px",
            }}
          >
            <span className="text-xs font-medium text-slate-300">
              {event.startsAt.toLocaleDateString("en-US", { month: "short" })}
            </span>
            <span className="text-lg font-bold text-slate-100">
              {event.startsAt.getDate()}
            </span>
          </div>
        </div>

        {/* Event info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isActive && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-green-500/20 text-green-300 border border-green-500/30">
                Live
              </span>
            )}
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{
                backgroundColor: `color-mix(in oklch, ${config.color} 15%, transparent)`,
                color: config.color,
              }}
            >
              <TypeIcon className="w-3 h-3" />
              {config.label}
            </span>
          </div>

          <h4 className="text-sm font-semibold text-slate-100 truncate">{event.name}</h4>

          {event.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              {event.description}
            </p>
          )}

          {/* Time & Location */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatEventDate(event.startsAt)} at {formatEventTime(event.startsAt)}
              {event.endsAt && (
                <> &mdash; {formatEventTime(event.endsAt)}</>
              )}
            </span>
            {event.externalLocation && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {event.externalLocation}
              </span>
            )}
          </div>

          {/* Interested count */}
          <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
            <Users className="w-3 h-3" />
            {event.interestedCount} interested
          </div>

          {/* RSVP Buttons */}
          <div className="flex items-center gap-2 mt-3">
            {RSVP_OPTIONS.map((option) => {
              const isSelected = event.currentUserRsvp === option.status;
              const RsvpIcon = option.icon;
              return (
                <button
                  key={option.status}
                  type="button"
                  onClick={() => onRsvp(event.id, option.status)}
                  className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                    transition-all duration-150
                    ${
                      isSelected
                        ? "bg-blue-600/20 border border-blue-500/40 text-blue-300"
                        : "bg-slate-800/40 border border-slate-700/30 text-slate-400 hover:text-slate-200 hover:border-slate-600/40"
                    }
                  `}
                >
                  <RsvpIcon className="w-3.5 h-3.5" />
                  {option.label}
                </button>
              );
            })}

            {/* Admin cancel button */}
            {isAdmin && !isPast && (
              <button
                type="button"
                onClick={() => onCancel(event.id)}
                className="
                  ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                  bg-red-500/10 border border-red-500/20 text-red-400
                  hover:bg-red-500/20 hover:border-red-500/30
                  transition-all duration-150
                "
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Create Event Form ---

interface CreateEventFormState {
  name: string;
  description: string;
  eventType: EventType;
  channelId: string;
  externalLocation: string;
  startsAt: string;
  endsAt: string;
}

const INITIAL_FORM: CreateEventFormState = {
  name: "",
  description: "",
  eventType: "voice",
  channelId: "",
  externalLocation: "",
  startsAt: "",
  endsAt: "",
};

function CreateEventForm({
  serverId,
  onClose,
}: {
  serverId: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CreateEventFormState>(() => ({
    ...INITIAL_FORM,
    startsAt: formatDateTimeLocal(new Date(Date.now() + 3600000)), // 1 hour from now
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const channels = useServerStore((s) => {
    const server = s.servers.find((srv) => srv.id === serverId);
    return server?.channels ?? [];
  });

  const createEvent = useServerEventsStore((s) => s.createEvent);

  const voiceChannels = useMemo(
    () => channels.filter((ch) => ch.type === "voice"),
    [channels],
  );

  const updateField = <K extends keyof CreateEventFormState>(
    key: K,
    value: CreateEventFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const needsChannel = form.eventType === "voice" || form.eventType === "stage";
  const needsLocation = form.eventType === "external";

  const isValid =
    form.name.trim().length > 0 &&
    form.startsAt.length > 0 &&
    (!needsChannel || form.channelId.length > 0) &&
    (!needsLocation || form.externalLocation.trim().length > 0);

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);

    try {
      await createEvent(serverId, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        eventType: form.eventType,
        channelId: needsChannel ? form.channelId : undefined,
        externalLocation: needsLocation ? form.externalLocation.trim() : undefined,
        startsAt: new Date(form.startsAt),
        endsAt: form.endsAt ? new Date(form.endsAt) : undefined,
      });

      onClose();
    } catch {
      // Error toast handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-card rounded-xl p-6 space-y-5"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold text-slate-100">Create Event</h4>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <Input
        label="Event Name"
        value={form.name}
        onChange={(e) => updateField("name", e.target.value)}
        placeholder="Friday Game Night"
        maxLength={100}
      />

      <Textarea
        label="Description (Optional)"
        value={form.description}
        onChange={(e) => updateField("description", e.target.value)}
        placeholder="What is this event about?"
        maxLength={1000}
        rows={3}
      />

      {/* Event Type Selector */}
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">
          Event Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(EVENT_TYPE_CONFIG) as EventType[]).map((type) => {
            const cfg = EVENT_TYPE_CONFIG[type];
            const TypeIcon = cfg.icon;
            const isSelected = form.eventType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => updateField("eventType", type)}
                className={`
                  flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium
                  transition-all duration-150 border
                  ${
                    isSelected
                      ? "border-blue-500/40 bg-blue-600/15 text-blue-300"
                      : "border-slate-700/30 bg-slate-800/30 text-slate-400 hover:text-slate-200 hover:border-slate-600/40"
                  }
                `}
              >
                <TypeIcon className="w-4 h-4" />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Channel Selector (for voice/stage) */}
      <AnimatePresence>
        {needsChannel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Voice Channel
            </label>
            <select
              value={form.channelId}
              onChange={(e) => updateField("channelId", e.target.value)}
              className="
                w-full px-3 py-2.5 rounded-lg text-sm
                bg-slate-800/50 border border-slate-700/40
                text-slate-100
                focus:border-blue-500/50 focus:outline-hidden
                transition-colors
              "
            >
              <option value="">Select a channel...</option>
              {voiceChannels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.name}
                </option>
              ))}
            </select>
            {voiceChannels.length === 0 && (
              <p className="text-xs text-yellow-400 mt-1">
                No voice channels available in this server
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* External Location (for external) */}
      <AnimatePresence>
        {needsLocation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Input
              label="External Location"
              value={form.externalLocation}
              onChange={(e) => updateField("externalLocation", e.target.value)}
              placeholder="https://example.com or a physical address"
              leftIcon={<MapPin className="w-4 h-4" />}
              maxLength={500}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date/Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">
            Start Date & Time
          </label>
          <input
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => updateField("startsAt", e.target.value)}
            className="
              w-full px-3 py-2.5 rounded-lg text-sm
              bg-slate-800/50 border border-slate-700/40
              text-slate-100
              focus:border-blue-500/50 focus:outline-hidden
              transition-colors
              [color-scheme:dark]
            "
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">
            End Date & Time (Optional)
          </label>
          <input
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => updateField("endsAt", e.target.value)}
            min={form.startsAt}
            className="
              w-full px-3 py-2.5 rounded-lg text-sm
              bg-slate-800/50 border border-slate-700/40
              text-slate-100
              focus:border-blue-500/50 focus:outline-hidden
              transition-colors
              [color-scheme:dark]
            "
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-700/30">
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className="gap-1.5"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Calendar className="w-4 h-4" />
          )}
          Create Event
        </Button>
        <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}

// --- Main Events Tab ---

export function EventsTab({ serverId }: EventsTabProps) {
  const isLoading = useServerEventsStore((s) => s.isLoading);
  const loadEvents = useServerEventsStore((s) => s.loadEvents);
  const getActiveEvents = useServerEventsStore((s) => s.getActiveEvents);
  const getUpcomingEvents = useServerEventsStore((s) => s.getUpcomingEvents);
  const rsvpEvent = useServerEventsStore((s) => s.rsvpEvent);
  const cancelEvent = useServerEventsStore((s) => s.cancelEvent);

  const currentUserId = useAuthStore((s) => s.user?.id);
  const serverOwnerId = useServerStore((s) => {
    const server = s.servers.find((srv) => srv.id === serverId);
    return server?.ownerId ?? null;
  });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  const isAdmin = currentUserId === serverOwnerId;

  // Load events on mount
  useEffect(() => {
    loadEvents(serverId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId]);

  const activeEvents = getActiveEvents(serverId);
  const upcomingEvents = getUpcomingEvents(serverId);

  const handleRsvp = (eventId: string, status: RSVPStatus) => {
    rsvpEvent(eventId, status);
  };

  const handleCancel = (eventId: string) => {
    if (cancelConfirmId === eventId) {
      cancelEvent(eventId);
      setCancelConfirmId(null);
    } else {
      setCancelConfirmId(eventId);
      // Auto-clear confirm after 3 seconds
      setTimeout(() => setCancelConfirmId(null), 3000);
    }
  };

  if (isLoading && activeEvents.length === 0 && upcomingEvents.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        <span className="ml-3 text-sm text-slate-400">Loading events...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Events</h3>
          <p className="text-sm text-slate-300 mt-1">
            Schedule and manage server events
          </p>
        </div>
        {!showCreateForm && (
          <Button
            size="sm"
            onClick={() => setShowCreateForm(true)}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
        )}
      </div>

      {/* Create Event Form */}
      <AnimatePresence>
        {showCreateForm && (
          <CreateEventForm
            serverId={serverId}
            onClose={() => setShowCreateForm(false)}
          />
        )}
      </AnimatePresence>

      {/* Active Events */}
      {activeEvents.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-green-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Active Now &mdash; {activeEvents.length}
          </h4>
          <div className="space-y-3">
            <AnimatePresence>
              {activeEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isAdmin={isAdmin}
                  onRsvp={handleRsvp}
                  onCancel={handleCancel}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Upcoming &mdash; {upcomingEvents.length}
          </h4>
          <div className="space-y-3">
            <AnimatePresence>
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isAdmin={isAdmin}
                  onRsvp={handleRsvp}
                  onCancel={handleCancel}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeEvents.length === 0 && upcomingEvents.length === 0 && !showCreateForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-xl flex items-center justify-center py-16"
        >
          <div className="text-center px-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-slate-500" />
            </div>
            <h4 className="text-base font-semibold text-slate-200 mb-2">
              No Events Scheduled
            </h4>
            <p className="text-sm text-slate-400 mb-4 max-w-sm">
              Create an event to bring your community together. Schedule voice chats, stage talks, or link external meetups.
            </p>
            <Button
              size="sm"
              onClick={() => setShowCreateForm(true)}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Create Your First Event
            </Button>
          </div>
        </motion.div>
      )}

      {/* Info banner */}
      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <p className="text-sm text-blue-300">
          <strong className="text-blue-200">Tip:</strong> Members can RSVP to events to show interest.
          Voice and stage events will automatically appear in their respective channels when they start.
        </p>
      </div>
    </div>
  );
}
