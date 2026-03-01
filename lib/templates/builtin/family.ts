import type { ServerDefinition } from "../../types/server-definition";

export const FAMILY_TEMPLATE: ServerDefinition = {
  schema_version: "1.0",
  source: "template",
  server: {
    name: "Family Server",
    description: "A safe space for family communication",
    family_safe: true,
  },
  categories: [
    { ref_id: "cat-hub", name: "FAMILY HUB", position: 0 },
    { ref_id: "cat-teens", name: "TEENS", position: 1 },
    { ref_id: "cat-parents", name: "PARENTS ONLY", position: 2 },
  ],
  channels: [
    { ref_id: "ch-announcements", name: "family-announcements", type: "announcement", category_ref: "cat-hub", position: 0 },
    { ref_id: "ch-general", name: "general", type: "text", category_ref: "cat-hub", position: 1 },
    { ref_id: "ch-homework", name: "homework-help", type: "text", category_ref: "cat-teens", position: 0 },
    { ref_id: "ch-gaming", name: "gaming", type: "text", category_ref: "cat-teens", position: 1 },
    { ref_id: "ch-parents", name: "parents-lounge", type: "text", category_ref: "cat-parents", position: 0 },
    { ref_id: "ch-voice-family", name: "Family Voice", type: "voice", category_ref: "cat-hub", position: 2 },
    { ref_id: "ch-voice-teen", name: "Teen Hangout", type: "voice", category_ref: "cat-teens", position: 2 },
  ],
  roles: [
    {
      ref_id: "role-parent",
      name: "Parent",
      color: "oklch(0.7 0.25 150)",
      position: 2,
      permissions: ["manage_server", "manage_channels", "view_audit_log", "manage_messages"],
    },
    {
      ref_id: "role-teen",
      name: "Teen",
      color: "oklch(0.65 0.25 265)",
      position: 1,
      permissions: ["send_messages", "read_messages", "add_reactions", "connect_voice", "speak_voice"],
    },
    {
      ref_id: "role-family",
      name: "Family Member",
      color: "oklch(0.5 0 0)",
      position: 0,
      permissions: ["send_messages", "read_messages", "add_reactions"],
      is_default: true,
    },
  ],
};
