"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useServerEventsStore } from "@/store/server-events.store";
import { Glass } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { CalendarDays, ChevronDown, ChevronUp, Users } from "lucide-react";

interface EventsPanelProps {
  serverId: string;
}

const MAX_VISIBLE_EVENTS = 3;

function formatEventDate(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return `Today at ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  if (days === 1) {
    return `Tomorrow at ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  if (days < 7) {
    return `${date.toLocaleDateString([], { weekday: "long" })} at ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function EventsPanel({ serverId }: EventsPanelProps) {
  const loadEvents = useServerEventsStore((s) => s.loadEvents);
  const getUpcomingEvents = useServerEventsStore((s) => s.getUpcomingEvents);
  const rsvpEvent = useServerEventsStore((s) => s.rsvpEvent);
  const isLoading = useServerEventsStore((s) => s.isLoading);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (serverId) {
      loadEvents(serverId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId]);

  const upcomingEvents = getUpcomingEvents(serverId);

  const visibleEvents = useMemo(() => {
    if (showAll) return upcomingEvents;
    return upcomingEvents.slice(0, MAX_VISIBLE_EVENTS);
  }, [upcomingEvents, showAll]);

  const hasMore = upcomingEvents.length > MAX_VISIBLE_EVENTS;

  const handleRsvp = async (eventId: string) => {
    await rsvpEvent(eventId, "interested");
  };

  return (
    <div className="flex flex-col">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-foreground-secondary hover:text-foreground transition-colors w-full text-left"
      >
        {isCollapsed ? (
          <ChevronDown className="w-3 h-3 shrink-0" />
        ) : (
          <ChevronUp className="w-3 h-3 shrink-0" />
        )}
        <CalendarDays className="w-3.5 h-3.5 shrink-0" />
        <span>Upcoming Events</span>
        {upcomingEvents.length > 0 && (
          <span className="ml-auto text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
            {upcomingEvents.length}
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            key="events-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2 flex flex-col gap-2">
              {isLoading && upcomingEvents.length === 0 && (
                <div className="flex items-center justify-center py-6">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!isLoading && upcomingEvents.length === 0 && (
                <div className="flex flex-col items-center py-6 text-foreground-secondary">
                  <CalendarDays className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">No upcoming events</p>
                </div>
              )}

              {visibleEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  }}
                >
                  <Glass
                    variant="light"
                    border="light"
                    className="p-3 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className="flex flex-col gap-2">
                      {/* Event name */}
                      <p className="text-sm font-medium text-foreground leading-tight truncate">
                        {event.name}
                      </p>

                      {/* Date and time */}
                      <div className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                        <CalendarDays className="w-3 h-3 shrink-0" />
                        <span>{formatEventDate(event.startsAt)}</span>
                      </div>

                      {/* Footer: interested count + RSVP */}
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1 text-xs text-foreground-secondary">
                          <Users className="w-3 h-3 shrink-0" />
                          <span>
                            {event.interestedCount} interested
                          </span>
                        </div>

                        {event.currentUserRsvp ? (
                          <span className="text-xs text-primary font-medium px-2 py-0.5 bg-primary/10 rounded-full">
                            {event.currentUserRsvp === "going"
                              ? "Going"
                              : "Interested"}
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRsvp(event.id)}
                            className="text-xs h-6 px-2"
                          >
                            Interested
                          </Button>
                        )}
                      </div>
                    </div>
                  </Glass>
                </motion.div>
              ))}

              {/* View All link */}
              {hasMore && !showAll && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="text-xs text-primary hover:text-primary/80 transition-colors text-center py-1 font-medium"
                >
                  View All ({upcomingEvents.length} events)
                </button>
              )}

              {hasMore && showAll && (
                <button
                  type="button"
                  onClick={() => setShowAll(false)}
                  className="text-xs text-foreground-secondary hover:text-foreground transition-colors text-center py-1"
                >
                  Show less
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
