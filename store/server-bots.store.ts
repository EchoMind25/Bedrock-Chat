import { create } from "zustand";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import type { ServerBot, BotCommand, ClaudeConfig, BotType } from "@/lib/types/server-bot";
import { mapDbServerBot, mapDbBotCommand, BOT_LIMITS, DEFAULT_CLAUDE_CONFIG } from "@/lib/types/server-bot";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "@/lib/stores/toast-store";

const EMPTY_BOTS: ServerBot[] = [];
const EMPTY_COMMANDS: BotCommand[] = [];

interface ServerBotsState {
  botsByServer: Map<string, ServerBot[]>;
  commandsByBot: Map<string, BotCommand[]>;
  isLoading: boolean;

  loadBots: (serverId: string) => Promise<void>;
  createBot: (serverId: string, options: {
    name: string;
    description?: string;
    botType: BotType;
    claudeConfig?: Partial<ClaudeConfig>;
  }) => Promise<ServerBot>;
  updateBot: (botId: string, updates: Partial<ServerBot>) => Promise<void>;
  deleteBot: (serverId: string, botId: string) => Promise<void>;
  updateClaudeConfig: (botId: string, config: Partial<ClaudeConfig>) => Promise<void>;
  loadCommands: (botId: string) => Promise<void>;
  createCommand: (botId: string, command: {
    name: string;
    description?: string;
    trigger: string;
    responseType: BotCommand["responseType"];
    systemPromptOverride?: string;
  }) => Promise<BotCommand>;
  deleteCommand: (botId: string, commandId: string) => Promise<void>;
  getBotsByServer: (serverId: string) => ServerBot[];
  getCommandsByBot: (botId: string) => BotCommand[];
}

export const useServerBotsStore = create<ServerBotsState>()(
  conditionalDevtools(
    (set, get) => ({
      botsByServer: new Map(),
      commandsByBot: new Map(),
      isLoading: false,

      loadBots: async (serverId) => {
        try {
          set({ isLoading: true });
          const supabase = createClient();
          const { data, error } = await supabase
            .from("server_bots")
            .select("*")
            .eq("server_id", serverId)
            .order("created_at", { ascending: true });

          if (error) throw error;

          const bots = (data || []).map((row) =>
            mapDbServerBot(row as Record<string, unknown>)
          );

          set((s) => {
            const map = new Map(s.botsByServer);
            map.set(serverId, bots);
            return { botsByServer: map, isLoading: false };
          });
        } catch (err) {
          console.error("Error loading bots:", err);
          set({ isLoading: false });
        }
      },

      createBot: async (serverId, options) => {
        const existing = get().getBotsByServer(serverId);
        if (existing.length >= BOT_LIMITS.maxPerServer) {
          toast.error("Limit Reached", `Maximum ${BOT_LIMITS.maxPerServer} bots per server`);
          throw new Error("Bot limit reached");
        }

        const supabase = createClient();
        const userId = useAuthStore.getState().user?.id;
        if (!userId) throw new Error("Not authenticated");

        const claudeConfig = options.botType === "claude"
          ? { ...DEFAULT_CLAUDE_CONFIG, ...options.claudeConfig }
          : null;

        const { data, error } = await supabase
          .from("server_bots")
          .insert({
            server_id: serverId,
            name: options.name,
            description: options.description || null,
            bot_type: options.botType,
            claude_config: claudeConfig,
            created_by: userId,
          })
          .select()
          .single();

        if (error) {
          toast.error("Error", "Could not create bot");
          throw error;
        }

        const bot = mapDbServerBot(data as Record<string, unknown>);

        set((s) => {
          const map = new Map(s.botsByServer);
          const bots = map.get(serverId) || [];
          map.set(serverId, [...bots, bot]);
          return { botsByServer: map };
        });

        toast.success("Bot Created", `"${options.name}" is ready to configure`);
        return bot;
      },

      updateBot: async (botId, updates) => {
        const supabase = createClient();
        const dbUpdates: Record<string, unknown> = {};

        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
        if (updates.permissions !== undefined) dbUpdates.permissions = updates.permissions;

        const { error } = await supabase
          .from("server_bots")
          .update(dbUpdates)
          .eq("id", botId)
          .select()
          .single();

        if (error) {
          toast.error("Error", "Could not update bot");
          throw error;
        }

        set((s) => {
          const map = new Map(s.botsByServer);
          for (const [sid, bots] of map) {
            const idx = bots.findIndex((b) => b.id === botId);
            if (idx !== -1) {
              const updated = [...bots];
              updated[idx] = { ...updated[idx], ...updates, updatedAt: new Date() };
              map.set(sid, updated);
              break;
            }
          }
          return { botsByServer: map };
        });

        toast.success("Bot Updated", "Changes saved");
      },

      deleteBot: async (serverId, botId) => {
        const supabase = createClient();
        const { error } = await supabase
          .from("server_bots")
          .delete()
          .eq("id", botId);

        if (error) {
          toast.error("Error", "Could not delete bot");
          throw error;
        }

        set((s) => {
          const botMap = new Map(s.botsByServer);
          const bots = (botMap.get(serverId) || []).filter((b) => b.id !== botId);
          botMap.set(serverId, bots);

          const cmdMap = new Map(s.commandsByBot);
          cmdMap.delete(botId);

          return { botsByServer: botMap, commandsByBot: cmdMap };
        });

        toast.success("Bot Deleted", "The bot has been removed");
      },

      updateClaudeConfig: async (botId, config) => {
        // Find the bot to merge configs
        let existingConfig: ClaudeConfig | null = null;
        for (const [, bots] of get().botsByServer) {
          const bot = bots.find((b) => b.id === botId);
          if (bot) {
            existingConfig = bot.claudeConfig;
            break;
          }
        }

        const merged = { ...DEFAULT_CLAUDE_CONFIG, ...existingConfig, ...config };
        const supabase = createClient();

        const { error } = await supabase
          .from("server_bots")
          .update({ claude_config: merged })
          .eq("id", botId);

        if (error) {
          toast.error("Error", "Could not update Claude config");
          throw error;
        }

        set((s) => {
          const map = new Map(s.botsByServer);
          for (const [sid, bots] of map) {
            const idx = bots.findIndex((b) => b.id === botId);
            if (idx !== -1) {
              const updated = [...bots];
              updated[idx] = { ...updated[idx], claudeConfig: merged };
              map.set(sid, updated);
              break;
            }
          }
          return { botsByServer: map };
        });
      },

      loadCommands: async (botId) => {
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("bot_commands")
            .select("*")
            .eq("bot_id", botId)
            .order("created_at", { ascending: true });

          if (error) throw error;

          const commands = (data || []).map((row) =>
            mapDbBotCommand(row as Record<string, unknown>)
          );

          set((s) => {
            const map = new Map(s.commandsByBot);
            map.set(botId, commands);
            return { commandsByBot: map };
          });
        } catch (err) {
          console.error("Error loading commands:", err);
        }
      },

      createCommand: async (botId, commandData) => {
        const existing = get().getCommandsByBot(botId);
        if (existing.length >= BOT_LIMITS.maxCommandsPerBot) {
          toast.error("Limit Reached", `Maximum ${BOT_LIMITS.maxCommandsPerBot} commands per bot`);
          throw new Error("Command limit reached");
        }

        const supabase = createClient();
        const { data, error } = await supabase
          .from("bot_commands")
          .insert({
            bot_id: botId,
            name: commandData.name,
            description: commandData.description || null,
            trigger: commandData.trigger,
            response_type: commandData.responseType,
            system_prompt_override: commandData.systemPromptOverride || null,
          })
          .select()
          .single();

        if (error) {
          toast.error("Error", "Could not create command");
          throw error;
        }

        const command = mapDbBotCommand(data as Record<string, unknown>);

        set((s) => {
          const map = new Map(s.commandsByBot);
          const commands = map.get(botId) || [];
          map.set(botId, [...commands, command]);
          return { commandsByBot: map };
        });

        toast.success("Command Created", `"/${commandData.name}" is ready`);
        return command;
      },

      deleteCommand: async (botId, commandId) => {
        const supabase = createClient();
        const { error } = await supabase
          .from("bot_commands")
          .delete()
          .eq("id", commandId);

        if (error) {
          toast.error("Error", "Could not delete command");
          throw error;
        }

        set((s) => {
          const map = new Map(s.commandsByBot);
          const commands = (map.get(botId) || []).filter((c) => c.id !== commandId);
          map.set(botId, commands);
          return { commandsByBot: map };
        });
      },

      getBotsByServer: (serverId) => {
        return get().botsByServer.get(serverId) || EMPTY_BOTS;
      },

      getCommandsByBot: (botId) => {
        return get().commandsByBot.get(botId) || EMPTY_COMMANDS;
      },
    }),
    { name: "ServerBotsStore" },
  ),
);
