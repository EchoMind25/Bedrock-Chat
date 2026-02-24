import { create } from "zustand";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import type { ServerEvent, RSVPStatus } from "@/lib/types/server-event";
import { mapDbServerEvent } from "@/lib/types/server-event";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "@/lib/stores/toast-store";

const EMPTY_ARRAY: ServerEvent[] = [];

interface ServerEventsState {
  eventsByServer: Map<string, ServerEvent[]>;
  isLoading: boolean;

  loadEvents: (serverId: string) => Promise<void>;
  createEvent: (serverId: string, event: {
    name: string;
    description?: string;
    imageUrl?: string;
    eventType: ServerEvent["eventType"];
    channelId?: string;
    externalLocation?: string;
    startsAt: Date;
    endsAt?: Date;
    recurrenceRule?: string;
  }) => Promise<ServerEvent>;
  updateEvent: (eventId: string, updates: Partial<ServerEvent>) => Promise<void>;
  cancelEvent: (eventId: string) => Promise<void>;
  rsvpEvent: (eventId: string, status: RSVPStatus) => Promise<void>;
  getUpcomingEvents: (serverId: string) => ServerEvent[];
  getActiveEvents: (serverId: string) => ServerEvent[];
  getEventsByServer: (serverId: string) => ServerEvent[];
}

export const useServerEventsStore = create<ServerEventsState>()(
  conditionalDevtools(
    (set, get) => ({
      eventsByServer: new Map(),
      isLoading: false,

      loadEvents: async (serverId) => {
        try {
          set({ isLoading: true });
          const supabase = createClient();
          const userId = useAuthStore.getState().user?.id;

          const { data, error } = await supabase
            .from("server_events")
            .select("*")
            .eq("server_id", serverId)
            .in("status", ["scheduled", "active"])
            .order("starts_at", { ascending: true });

          if (error) throw error;

          let events = (data || []).map((row) =>
            mapDbServerEvent(row as Record<string, unknown>)
          );

          // Load current user's RSVPs
          if (userId && events.length > 0) {
            const eventIds = events.map((e) => e.id);
            const { data: rsvps } = await supabase
              .from("server_event_rsvps")
              .select("event_id, status")
              .eq("user_id", userId)
              .in("event_id", eventIds);

            if (rsvps) {
              const rsvpMap = new Map(rsvps.map((r) => [r.event_id, r.status as RSVPStatus]));
              events = events.map((e) => ({
                ...e,
                currentUserRsvp: rsvpMap.get(e.id),
              }));
            }
          }

          set((s) => {
            const map = new Map(s.eventsByServer);
            map.set(serverId, events);
            return { eventsByServer: map, isLoading: false };
          });
        } catch (err) {
          console.error("Error loading events:", err);
          set({ isLoading: false });
        }
      },

      createEvent: async (serverId, eventData) => {
        const supabase = createClient();
        const userId = useAuthStore.getState().user?.id;
        if (!userId) throw new Error("Not authenticated");

        const { data, error } = await supabase
          .from("server_events")
          .insert({
            server_id: serverId,
            name: eventData.name,
            description: eventData.description || null,
            image_url: eventData.imageUrl || null,
            event_type: eventData.eventType,
            channel_id: eventData.channelId || null,
            external_location: eventData.externalLocation || null,
            starts_at: eventData.startsAt.toISOString(),
            ends_at: eventData.endsAt?.toISOString() || null,
            recurrence_rule: eventData.recurrenceRule || null,
            created_by: userId,
          })
          .select()
          .single();

        if (error) {
          toast.error("Error", "Could not create event");
          throw error;
        }

        const event = mapDbServerEvent(data as Record<string, unknown>);

        set((s) => {
          const map = new Map(s.eventsByServer);
          const events = map.get(serverId) || [];
          map.set(serverId, [...events, event].sort(
            (a, b) => a.startsAt.getTime() - b.startsAt.getTime()
          ));
          return { eventsByServer: map };
        });

        toast.success("Event Created", `"${eventData.name}" has been scheduled`);
        return event;
      },

      updateEvent: async (eventId, updates) => {
        const supabase = createClient();
        const dbUpdates: Record<string, unknown> = {};

        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
        if (updates.startsAt !== undefined) dbUpdates.starts_at = updates.startsAt.toISOString();
        if (updates.endsAt !== undefined) dbUpdates.ends_at = updates.endsAt?.toISOString() || null;
        if (updates.status !== undefined) dbUpdates.status = updates.status;

        const { error } = await supabase
          .from("server_events")
          .update(dbUpdates)
          .eq("id", eventId);

        if (error) {
          toast.error("Error", "Could not update event");
          throw error;
        }

        // Update in store
        set((s) => {
          const map = new Map(s.eventsByServer);
          for (const [sid, events] of map) {
            const idx = events.findIndex((e) => e.id === eventId);
            if (idx !== -1) {
              const updated = [...events];
              updated[idx] = { ...updated[idx], ...updates, updatedAt: new Date() };
              map.set(sid, updated);
              break;
            }
          }
          return { eventsByServer: map };
        });

        toast.success("Event Updated", "Changes have been saved");
      },

      cancelEvent: async (eventId) => {
        const supabase = createClient();
        const { error } = await supabase
          .from("server_events")
          .update({ status: "cancelled" })
          .eq("id", eventId);

        if (error) {
          toast.error("Error", "Could not cancel event");
          throw error;
        }

        // Remove from active lists
        set((s) => {
          const map = new Map(s.eventsByServer);
          for (const [sid, events] of map) {
            const filtered = events.filter((e) => e.id !== eventId);
            if (filtered.length !== events.length) {
              map.set(sid, filtered);
              break;
            }
          }
          return { eventsByServer: map };
        });

        toast.success("Event Cancelled", "The event has been cancelled");
      },

      rsvpEvent: async (eventId, status) => {
        const supabase = createClient();
        const userId = useAuthStore.getState().user?.id;
        if (!userId) return;

        const { error } = await supabase
          .from("server_event_rsvps")
          .upsert(
            { event_id: eventId, user_id: userId, status },
            { onConflict: "event_id,user_id" }
          );

        if (error) {
          toast.error("Error", "Could not update RSVP");
          throw error;
        }

        // Optimistic update
        set((s) => {
          const map = new Map(s.eventsByServer);
          for (const [sid, events] of map) {
            const idx = events.findIndex((e) => e.id === eventId);
            if (idx !== -1) {
              const updated = [...events];
              const oldRsvp = updated[idx].currentUserRsvp;
              const wasInterested = oldRsvp === "interested" || oldRsvp === "going";
              const isInterested = status === "interested" || status === "going";
              const countDelta = (isInterested ? 1 : 0) - (wasInterested ? 1 : 0);

              updated[idx] = {
                ...updated[idx],
                currentUserRsvp: status,
                interestedCount: Math.max(0, updated[idx].interestedCount + countDelta),
              };
              map.set(sid, updated);
              break;
            }
          }
          return { eventsByServer: map };
        });
      },

      getUpcomingEvents: (serverId) => {
        const events = get().eventsByServer.get(serverId) || EMPTY_ARRAY;
        const now = new Date();
        return events.filter((e) => e.status === "scheduled" && e.startsAt > now);
      },

      getActiveEvents: (serverId) => {
        const events = get().eventsByServer.get(serverId) || EMPTY_ARRAY;
        return events.filter((e) => e.status === "active");
      },

      getEventsByServer: (serverId) => {
        return get().eventsByServer.get(serverId) || EMPTY_ARRAY;
      },
    }),
    { name: "ServerEventsStore" },
  ),
);
