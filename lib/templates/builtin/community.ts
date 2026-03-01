import type { ServerDefinition } from "../../types/server-definition";

export const COMMUNITY_TEMPLATE: ServerDefinition = {
  schema_version: "1.0",
  source: "template",
  server: {
    name: "Community Server",
    description: "A general-purpose community server",
    family_safe: false,
  },
  categories: [
    { ref_id: "cat-welcome", name: "WELCOME", position: 0 },
    { ref_id: "cat-general", name: "GENERAL", position: 1 },
    { ref_id: "cat-topics", name: "TOPICS", position: 2 },
    { ref_id: "cat-voice", name: "VOICE", position: 3 },
  ],
  channels: [
    { ref_id: "ch-welcome", name: "welcome", type: "announcement", category_ref: "cat-welcome", position: 0 },
    { ref_id: "ch-rules", name: "rules", type: "announcement", category_ref: "cat-welcome", position: 1 },
    { ref_id: "ch-intros", name: "introductions", type: "text", category_ref: "cat-general", position: 0 },
    { ref_id: "ch-general", name: "general", type: "text", category_ref: "cat-general", position: 1 },
    { ref_id: "ch-events", name: "events", type: "text", category_ref: "cat-topics", position: 0 },
    { ref_id: "ch-feedback", name: "feedback", type: "text", category_ref: "cat-topics", position: 1 },
    { ref_id: "ch-voice-hangout", name: "Hangout", type: "voice", category_ref: "cat-voice", position: 0 },
    { ref_id: "ch-voice-events", name: "Events", type: "voice", category_ref: "cat-voice", position: 1 },
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
      permissions: ["send_messages", "read_messages", "embed_links", "attach_files", "add_reactions", "connect_voice", "speak_voice"],
      is_default: true,
    },
  ],
};
