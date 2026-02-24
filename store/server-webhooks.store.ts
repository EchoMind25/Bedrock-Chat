import { create } from "zustand";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import type { ServerWebhook, WebhookType, WebhookEvent } from "@/lib/types/server-webhook";
import { mapDbServerWebhook, WEBHOOK_LIMITS } from "@/lib/types/server-webhook";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "@/lib/stores/toast-store";

const EMPTY_ARRAY: ServerWebhook[] = [];

interface ServerWebhooksState {
  webhooksByServer: Map<string, ServerWebhook[]>;
  isLoading: boolean;

  loadWebhooks: (serverId: string) => Promise<void>;
  createWebhook: (serverId: string, options: {
    channelId: string;
    name: string;
    type: WebhookType;
    url?: string;
    events?: WebhookEvent[];
  }) => Promise<ServerWebhook>;
  updateWebhook: (webhookId: string, updates: Partial<ServerWebhook>) => Promise<void>;
  deleteWebhook: (serverId: string, webhookId: string) => Promise<void>;
  getWebhooksByServer: (serverId: string) => ServerWebhook[];
}

export const useServerWebhooksStore = create<ServerWebhooksState>()(
  conditionalDevtools(
    (set, get) => ({
      webhooksByServer: new Map(),
      isLoading: false,

      loadWebhooks: async (serverId) => {
        try {
          set({ isLoading: true });
          const supabase = createClient();
          const { data, error } = await supabase
            .from("server_webhooks")
            .select("*")
            .eq("server_id", serverId)
            .order("created_at", { ascending: true });

          if (error) throw error;

          const webhooks = (data || []).map((row) =>
            mapDbServerWebhook(row as Record<string, unknown>)
          );

          set((s) => {
            const map = new Map(s.webhooksByServer);
            map.set(serverId, webhooks);
            return { webhooksByServer: map, isLoading: false };
          });
        } catch (err) {
          console.error("Error loading webhooks:", err);
          set({ isLoading: false });
        }
      },

      createWebhook: async (serverId, options) => {
        const existing = get().getWebhooksByServer(serverId);
        if (existing.length >= WEBHOOK_LIMITS.maxPerServer) {
          toast.error("Limit Reached", `Maximum ${WEBHOOK_LIMITS.maxPerServer} webhooks per server`);
          throw new Error("Webhook limit reached");
        }

        const supabase = createClient();
        const userId = useAuthStore.getState().user?.id;
        if (!userId) throw new Error("Not authenticated");

        const { data, error } = await supabase
          .from("server_webhooks")
          .insert({
            server_id: serverId,
            channel_id: options.channelId,
            name: options.name,
            type: options.type,
            url: options.url || null,
            events: options.events || [],
            created_by: userId,
          })
          .select()
          .single();

        if (error) {
          toast.error("Error", "Could not create webhook");
          throw error;
        }

        const webhook = mapDbServerWebhook(data as Record<string, unknown>);

        set((s) => {
          const map = new Map(s.webhooksByServer);
          const webhooks = map.get(serverId) || [];
          map.set(serverId, [...webhooks, webhook]);
          return { webhooksByServer: map };
        });

        toast.success("Webhook Created", `"${options.name}" webhook is ready`);
        return webhook;
      },

      updateWebhook: async (webhookId, updates) => {
        const supabase = createClient();
        const dbUpdates: Record<string, unknown> = {};

        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
        if (updates.url !== undefined) dbUpdates.url = updates.url;
        if (updates.events !== undefined) dbUpdates.events = updates.events;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

        const { error } = await supabase
          .from("server_webhooks")
          .update(dbUpdates)
          .eq("id", webhookId);

        if (error) {
          toast.error("Error", "Could not update webhook");
          throw error;
        }

        set((s) => {
          const map = new Map(s.webhooksByServer);
          for (const [sid, webhooks] of map) {
            const idx = webhooks.findIndex((w) => w.id === webhookId);
            if (idx !== -1) {
              const updated = [...webhooks];
              updated[idx] = { ...updated[idx], ...updates, updatedAt: new Date() };
              map.set(sid, updated);
              break;
            }
          }
          return { webhooksByServer: map };
        });

        toast.success("Webhook Updated", "Changes saved");
      },

      deleteWebhook: async (serverId, webhookId) => {
        const supabase = createClient();
        const { error } = await supabase
          .from("server_webhooks")
          .delete()
          .eq("id", webhookId);

        if (error) {
          toast.error("Error", "Could not delete webhook");
          throw error;
        }

        set((s) => {
          const map = new Map(s.webhooksByServer);
          const webhooks = (map.get(serverId) || []).filter((w) => w.id !== webhookId);
          map.set(serverId, webhooks);
          return { webhooksByServer: map };
        });

        toast.success("Webhook Deleted", "The webhook has been removed");
      },

      getWebhooksByServer: (serverId) => {
        return get().webhooksByServer.get(serverId) || EMPTY_ARRAY;
      },
    }),
    { name: "ServerWebhooksStore" },
  ),
);
