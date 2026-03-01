import type { ServerDefinition } from "../../types/server-definition";

export const GAMING_TEMPLATE: ServerDefinition = {
  schema_version: "1.0",
  source: "template",
  server: {
    name: "Gaming Server",
    description: "A server for gaming communities with LFG and voice channels",
    family_safe: false,
  },
  categories: [
    { ref_id: "cat-info", name: "INFORMATION", position: 0 },
    { ref_id: "cat-text", name: "TEXT CHANNELS", position: 1 },
    { ref_id: "cat-voice", name: "VOICE CHANNELS", position: 2 },
  ],
  channels: [
    { ref_id: "ch-welcome", name: "welcome", type: "announcement", category_ref: "cat-info", position: 0 },
    { ref_id: "ch-rules", name: "rules", type: "announcement", category_ref: "cat-info", position: 1 },
    { ref_id: "ch-general", name: "general", type: "text", category_ref: "cat-text", position: 0 },
    { ref_id: "ch-offtopic", name: "off-topic", type: "text", category_ref: "cat-text", position: 1 },
    { ref_id: "ch-clips", name: "clips-and-highlights", type: "text", category_ref: "cat-text", position: 2 },
    { ref_id: "ch-lfg", name: "looking-for-group", type: "text", category_ref: "cat-text", position: 3 },
    { ref_id: "ch-voice-general", name: "General Voice", type: "voice", category_ref: "cat-voice", position: 0 },
    { ref_id: "ch-voice-gaming1", name: "Gaming Voice 1", type: "voice", category_ref: "cat-voice", position: 1 },
    { ref_id: "ch-voice-gaming2", name: "Gaming Voice 2", type: "voice", category_ref: "cat-voice", position: 2 },
    { ref_id: "ch-voice-afk", name: "AFK", type: "voice", category_ref: "cat-voice", position: 3 },
  ],
  roles: [
    {
      ref_id: "role-admin",
      name: "Admin",
      color: "oklch(0.6 0.2 30)",
      position: 2,
      permissions: ["manage_server", "manage_channels", "manage_roles", "manage_messages", "moderate_members"],
    },
    {
      ref_id: "role-mod",
      name: "Moderator",
      color: "oklch(0.65 0.25 265)",
      position: 1,
      permissions: ["manage_messages", "moderate_members"],
    },
    {
      ref_id: "role-member",
      name: "Member",
      color: "oklch(0.5 0 0)",
      position: 0,
      permissions: ["send_messages", "read_messages", "connect_voice", "speak_voice", "embed_links", "attach_files", "add_reactions"],
      is_default: true,
    },
  ],
};
