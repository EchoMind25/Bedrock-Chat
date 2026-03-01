import type { ServerDefinition } from "../../types/server-definition";

export const STUDY_GROUP_TEMPLATE: ServerDefinition = {
  schema_version: "1.0",
  source: "template",
  server: {
    name: "Study Group",
    description: "For study sessions and homework help",
    family_safe: true,
  },
  categories: [
    { ref_id: "cat-resources", name: "RESOURCES", position: 0 },
    { ref_id: "cat-study", name: "STUDY ROOMS", position: 1 },
    { ref_id: "cat-voice", name: "VOICE STUDY", position: 2 },
  ],
  channels: [
    { ref_id: "ch-announcements", name: "announcements", type: "announcement", category_ref: "cat-resources", position: 0 },
    { ref_id: "ch-general", name: "general", type: "text", category_ref: "cat-resources", position: 1 },
    { ref_id: "ch-resources", name: "resources", type: "text", category_ref: "cat-resources", position: 2 },
    { ref_id: "ch-homework", name: "homework-help", type: "text", category_ref: "cat-study", position: 0 },
    { ref_id: "ch-exam", name: "exam-prep", type: "text", category_ref: "cat-study", position: 1 },
    { ref_id: "ch-offtopic", name: "off-topic", type: "text", category_ref: "cat-study", position: 2 },
    { ref_id: "ch-voice-quiet", name: "Quiet Study", type: "voice", category_ref: "cat-voice", position: 0 },
    { ref_id: "ch-voice-group", name: "Group Study", type: "voice", category_ref: "cat-voice", position: 1 },
    { ref_id: "ch-voice-office", name: "Office Hours", type: "voice", category_ref: "cat-voice", position: 2 },
  ],
  roles: [
    {
      ref_id: "role-instructor",
      name: "Instructor",
      color: "oklch(0.7 0.2 50)",
      position: 2,
      permissions: ["manage_server", "manage_messages", "manage_channels"],
    },
    {
      ref_id: "role-lead",
      name: "Study Lead",
      color: "oklch(0.65 0.25 265)",
      position: 1,
      permissions: ["manage_messages", "send_messages", "read_messages", "connect_voice", "speak_voice", "add_reactions", "attach_files"],
    },
    {
      ref_id: "role-student",
      name: "Student",
      color: "oklch(0.5 0 0)",
      position: 0,
      permissions: ["send_messages", "read_messages", "connect_voice", "speak_voice", "add_reactions", "attach_files"],
      is_default: true,
    },
  ],
};
