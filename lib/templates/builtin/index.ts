import type { LucideIcon } from "lucide-react";
import { Gamepad2, GraduationCap, Globe, Heart, Sparkles } from "lucide-react";
import type { ServerDefinition } from "../../types/server-definition";
import { GAMING_TEMPLATE } from "./gaming";
import { FAMILY_TEMPLATE } from "./family";
import { STUDY_GROUP_TEMPLATE } from "./study-group";
import { COMMUNITY_TEMPLATE } from "./community";

export interface BuiltinTemplate {
  id: string;
  slug: string;
  definition: ServerDefinition;
  displayName: string;
  description: string;
  icon: LucideIcon;
  iconEmoji: string;
  color: string;
  channelCount: number;
  roleCount: number;
  isFamilySafe: boolean;
}

export const BUILTIN_TEMPLATES: BuiltinTemplate[] = [
  {
    id: "gaming",
    slug: "gaming",
    definition: GAMING_TEMPLATE,
    displayName: "Gaming",
    description: "For gaming communities with LFG and voice channels",
    icon: Gamepad2,
    iconEmoji: "\uD83C\uDFAE",
    color: "oklch(0.65 0.25 265)",
    channelCount: GAMING_TEMPLATE.channels.length,
    roleCount: GAMING_TEMPLATE.roles.length,
    isFamilySafe: false,
  },
  {
    id: "family",
    slug: "family",
    definition: FAMILY_TEMPLATE,
    displayName: "Family",
    description: "A safe space for family communication",
    icon: Heart,
    iconEmoji: "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66",
    color: "oklch(0.7 0.25 150)",
    channelCount: FAMILY_TEMPLATE.channels.length,
    roleCount: FAMILY_TEMPLATE.roles.length,
    isFamilySafe: true,
  },
  {
    id: "study-group",
    slug: "study-group",
    definition: STUDY_GROUP_TEMPLATE,
    displayName: "Study Group",
    description: "For study sessions and homework help",
    icon: GraduationCap,
    iconEmoji: "\uD83D\uDCDA",
    color: "oklch(0.7 0.2 50)",
    channelCount: STUDY_GROUP_TEMPLATE.channels.length,
    roleCount: STUDY_GROUP_TEMPLATE.roles.length,
    isFamilySafe: true,
  },
  {
    id: "community",
    slug: "community",
    definition: COMMUNITY_TEMPLATE,
    displayName: "Community",
    description: "A general-purpose community server",
    icon: Globe,
    iconEmoji: "\uD83C\uDF10",
    color: "oklch(0.65 0.2 200)",
    channelCount: COMMUNITY_TEMPLATE.channels.length,
    roleCount: COMMUNITY_TEMPLATE.roles.length,
    isFamilySafe: false,
  },
];

/** Minimal "custom" template with just a #general channel */
const CUSTOM_DEFINITION: ServerDefinition = {
  schema_version: "1.0",
  source: "template",
  server: {
    name: "My Server",
    description: "",
    family_safe: false,
  },
  categories: [
    { ref_id: "cat-text", name: "TEXT CHANNELS", position: 0 },
  ],
  channels: [
    { ref_id: "ch-general", name: "general", type: "text", category_ref: "cat-text", position: 0 },
  ],
  roles: [],
};

export const CUSTOM_TEMPLATE: BuiltinTemplate = {
  id: "custom",
  slug: "custom",
  definition: CUSTOM_DEFINITION,
  displayName: "Custom",
  description: "Start from scratch with just #general",
  icon: Sparkles,
  iconEmoji: "\u2728",
  color: "oklch(0.5 0 0)",
  channelCount: 1,
  roleCount: 0,
  isFamilySafe: false,
};

/** All templates including custom */
export const ALL_TEMPLATES: BuiltinTemplate[] = [...BUILTIN_TEMPLATES, CUSTOM_TEMPLATE];

export { GAMING_TEMPLATE, FAMILY_TEMPLATE, STUDY_GROUP_TEMPLATE, COMMUNITY_TEMPLATE };
