import { create } from "zustand";
import type {
  ServerDefinition,
  CategoryDefinition,
  ChannelDefinition,
  RoleDefinition,
  BedrockPermission,
} from "@/lib/types/server-definition";
import type { ValidationResult } from "@/lib/types/import-validation";
import type { DiscordServerEntry } from "@/lib/services/discord-export-parser";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ImportMethod = "json" | "guided" | null;

export type GuidedStep =
  | "server-name"
  | "family-safe"
  | "categories"
  | "channels"
  | "roles"
  | "review";

const GUIDED_STEPS: GuidedStep[] = [
  "server-name",
  "family-safe",
  "categories",
  "channels",
  "roles",
  "review",
];

interface ImportState {
  // -- Top-level wizard state --
  method: ImportMethod;
  setMethod: (method: ImportMethod) => void;

  // -- JSON upload path --
  jsonText: string;
  setJsonText: (text: string) => void;
  validationResult: ValidationResult | null;
  setValidationResult: (result: ValidationResult | null) => void;
  isValidating: boolean;
  setIsValidating: (v: boolean) => void;

  // -- Discord export path --
  discordServers: DiscordServerEntry[];
  setDiscordServers: (servers: DiscordServerEntry[]) => void;
  selectedDiscordServer: DiscordServerEntry | null;
  setSelectedDiscordServer: (server: DiscordServerEntry | null) => void;

  // -- Guided form state --
  guidedStep: GuidedStep;
  setGuidedStep: (step: GuidedStep) => void;
  nextGuidedStep: () => void;
  prevGuidedStep: () => void;
  guidedStepIndex: () => number;
  guidedStepCount: () => number;

  serverName: string;
  setServerName: (name: string) => void;
  serverDescription: string;
  setServerDescription: (desc: string) => void;
  familySafe: boolean;
  setFamilySafe: (safe: boolean) => void;

  categories: CategoryDefinition[];
  addCategory: (name: string) => void;
  removeCategory: (refId: string) => void;
  renameCategory: (refId: string, name: string) => void;
  reorderCategories: (fromIndex: number, toIndex: number) => void;

  channels: ChannelDefinition[];
  addChannel: (channel: Omit<ChannelDefinition, "ref_id" | "position">) => void;
  removeChannel: (refId: string) => void;
  updateChannel: (refId: string, updates: Partial<ChannelDefinition>) => void;
  reorderChannels: (categoryRef: string, fromIndex: number, toIndex: number) => void;

  roles: RoleDefinition[];
  addRole: (name: string, color?: string) => void;
  removeRole: (refId: string) => void;
  updateRole: (refId: string, updates: Partial<RoleDefinition>) => void;
  toggleRolePermission: (refId: string, perm: BedrockPermission) => void;
  reorderRoles: (fromIndex: number, toIndex: number) => void;

  // -- Build final definition --
  buildDefinition: () => ServerDefinition;

  // -- Creation state --
  isCreating: boolean;
  setIsCreating: (v: boolean) => void;
  createdServerId: string | null;
  setCreatedServerId: (id: string | null) => void;

  // -- Reset --
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let nextId = 1;
function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${nextId++}`;
}

const DEFAULT_CATEGORIES_FAMILY: CategoryDefinition[] = [
  { ref_id: "cat-info", name: "Information", position: 0 },
  { ref_id: "cat-general", name: "General", position: 1 },
  { ref_id: "cat-activities", name: "Activities", position: 2 },
];

const DEFAULT_CATEGORIES_STANDARD: CategoryDefinition[] = [
  { ref_id: "cat-info", name: "Information", position: 0 },
  { ref_id: "cat-text", name: "Text Channels", position: 1 },
  { ref_id: "cat-voice", name: "Voice Channels", position: 2 },
];

const DEFAULT_CHANNELS_FAMILY: ChannelDefinition[] = [
  { ref_id: "ch-welcome", name: "welcome", type: "announcement", category_ref: "cat-info", position: 0 },
  { ref_id: "ch-rules", name: "rules", type: "announcement", category_ref: "cat-info", position: 1 },
  { ref_id: "ch-general", name: "general", type: "text", category_ref: "cat-general", position: 0 },
  { ref_id: "ch-introductions", name: "introductions", type: "text", category_ref: "cat-general", position: 1 },
  { ref_id: "ch-hangout", name: "hangout", type: "text", category_ref: "cat-activities", position: 0 },
  { ref_id: "ch-voice", name: "General Voice", type: "voice", category_ref: "cat-activities", position: 1 },
];

const DEFAULT_CHANNELS_STANDARD: ChannelDefinition[] = [
  { ref_id: "ch-welcome", name: "welcome", type: "announcement", category_ref: "cat-info", position: 0 },
  { ref_id: "ch-rules", name: "rules", type: "text", category_ref: "cat-info", position: 1 },
  { ref_id: "ch-general", name: "general", type: "text", category_ref: "cat-text", position: 0 },
  { ref_id: "ch-random", name: "random", type: "text", category_ref: "cat-text", position: 1 },
  { ref_id: "ch-voice-general", name: "General Voice", type: "voice", category_ref: "cat-voice", position: 0 },
];

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState = {
  method: null as ImportMethod,
  jsonText: "",
  validationResult: null as ValidationResult | null,
  isValidating: false,
  discordServers: [] as DiscordServerEntry[],
  selectedDiscordServer: null as DiscordServerEntry | null,
  guidedStep: "server-name" as GuidedStep,
  serverName: "",
  serverDescription: "",
  familySafe: false,
  categories: [] as CategoryDefinition[],
  channels: [] as ChannelDefinition[],
  roles: [] as RoleDefinition[],
  isCreating: false,
  createdServerId: null as string | null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useImportStore = create<ImportState>((set, get) => ({
  ...initialState,

  setMethod: (method) => {
    set({ method });
    if (method) {
      // Aggregate analytics — fire-and-forget, no PII
      fetch("/api/analytics/migration-track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "import_started" }),
      }).catch(() => {});
    }
  },

  // -- JSON --
  setJsonText: (jsonText) => set({ jsonText }),
  setValidationResult: (validationResult) => set({ validationResult }),
  setIsValidating: (isValidating) => set({ isValidating }),

  // -- Discord --
  setDiscordServers: (discordServers) => set({ discordServers }),
  setSelectedDiscordServer: (selectedDiscordServer) =>
    set({ selectedDiscordServer }),

  // -- Guided steps --
  setGuidedStep: (guidedStep) => set({ guidedStep }),
  guidedStepIndex: () => GUIDED_STEPS.indexOf(get().guidedStep),
  guidedStepCount: () => GUIDED_STEPS.length,

  nextGuidedStep: () => {
    const idx = GUIDED_STEPS.indexOf(get().guidedStep);
    if (idx < GUIDED_STEPS.length - 1) {
      set({ guidedStep: GUIDED_STEPS[idx + 1] });
    }
  },

  prevGuidedStep: () => {
    const idx = GUIDED_STEPS.indexOf(get().guidedStep);
    if (idx > 0) {
      set({ guidedStep: GUIDED_STEPS[idx - 1] });
    }
  },

  // -- Server info --
  setServerName: (serverName) => set({ serverName }),
  setServerDescription: (serverDescription) => set({ serverDescription }),
  setFamilySafe: (familySafe) => {
    const state = get();
    // If toggling family-safe and categories are still at initial state, swap defaults
    const isDefaultCats =
      state.categories.length === 0 ||
      (state.categories.length <= 3 &&
        state.categories.every((c) =>
          ["cat-info", "cat-general", "cat-activities", "cat-text", "cat-voice"].includes(c.ref_id),
        ));

    if (isDefaultCats) {
      set({
        familySafe,
        categories: familySafe ? DEFAULT_CATEGORIES_FAMILY : DEFAULT_CATEGORIES_STANDARD,
        channels: familySafe ? DEFAULT_CHANNELS_FAMILY : DEFAULT_CHANNELS_STANDARD,
      });
    } else {
      set({ familySafe });
    }
  },

  // -- Categories --
  addCategory: (name) => {
    const cats = get().categories;
    set({
      categories: [
        ...cats,
        {
          ref_id: genId("cat"),
          name,
          position: cats.length,
        },
      ],
    });
  },

  removeCategory: (refId) => {
    const state = get();
    const cats = state.categories.filter((c) => c.ref_id !== refId);
    // Reindex positions
    cats.forEach((c, i) => (c.position = i));
    // Remove channels in this category
    const channels = state.channels.filter((ch) => ch.category_ref !== refId);
    set({ categories: cats, channels });
  },

  renameCategory: (refId, name) => {
    set({
      categories: get().categories.map((c) =>
        c.ref_id === refId ? { ...c, name } : c,
      ),
    });
  },

  reorderCategories: (fromIndex, toIndex) => {
    const cats = [...get().categories];
    const [moved] = cats.splice(fromIndex, 1);
    cats.splice(toIndex, 0, moved);
    cats.forEach((c, i) => (c.position = i));
    set({ categories: cats });
  },

  // -- Channels --
  addChannel: (partial) => {
    const channels = get().channels;
    const categoryChannels = channels.filter(
      (ch) => ch.category_ref === partial.category_ref,
    );
    set({
      channels: [
        ...channels,
        {
          ...partial,
          ref_id: genId("ch"),
          position: categoryChannels.length,
        },
      ],
    });
  },

  removeChannel: (refId) => {
    const channels = get().channels.filter((ch) => ch.ref_id !== refId);
    // Reindex within each category
    const byCat = new Map<string, ChannelDefinition[]>();
    for (const ch of channels) {
      const key = ch.category_ref ?? "__none__";
      if (!byCat.has(key)) byCat.set(key, []);
      byCat.get(key)!.push(ch);
    }
    for (const group of byCat.values()) {
      group.sort((a, b) => a.position - b.position);
      group.forEach((ch, i) => (ch.position = i));
    }
    set({ channels });
  },

  updateChannel: (refId, updates) => {
    set({
      channels: get().channels.map((ch) =>
        ch.ref_id === refId ? { ...ch, ...updates } : ch,
      ),
    });
  },

  reorderChannels: (categoryRef, fromIndex, toIndex) => {
    const state = get();
    const catChannels = state.channels
      .filter((ch) => ch.category_ref === categoryRef)
      .sort((a, b) => a.position - b.position);
    const otherChannels = state.channels.filter(
      (ch) => ch.category_ref !== categoryRef,
    );

    const [moved] = catChannels.splice(fromIndex, 1);
    catChannels.splice(toIndex, 0, moved);
    catChannels.forEach((ch, i) => (ch.position = i));

    set({ channels: [...otherChannels, ...catChannels] });
  },

  // -- Roles --
  addRole: (name, color) => {
    const roles = get().roles;
    set({
      roles: [
        ...roles,
        {
          ref_id: genId("role"),
          name,
          color: color ?? "oklch(0.5 0.15 265)",
          position: roles.length,
          permissions: ["read_messages", "send_messages", "add_reactions"],
          is_default: roles.length === 0,
        },
      ],
    });
  },

  removeRole: (refId) => {
    const roles = get().roles.filter((r) => r.ref_id !== refId);
    roles.forEach((r, i) => (r.position = i));
    // If we removed the default, mark first as default
    if (roles.length > 0 && !roles.some((r) => r.is_default)) {
      roles[0].is_default = true;
    }
    set({ roles });
  },

  updateRole: (refId, updates) => {
    set({
      roles: get().roles.map((r) =>
        r.ref_id === refId ? { ...r, ...updates } : r,
      ),
    });
  },

  toggleRolePermission: (refId, perm) => {
    set({
      roles: get().roles.map((r) => {
        if (r.ref_id !== refId) return r;
        const has = r.permissions.includes(perm);
        return {
          ...r,
          permissions: has
            ? r.permissions.filter((p) => p !== perm)
            : [...r.permissions, perm],
        };
      }),
    });
  },

  reorderRoles: (fromIndex, toIndex) => {
    const roles = [...get().roles];
    const [moved] = roles.splice(fromIndex, 1);
    roles.splice(toIndex, 0, moved);
    roles.forEach((r, i) => (r.position = i));
    set({ roles });
  },

  // -- Build definition --
  buildDefinition: (): ServerDefinition => {
    const state = get();
    return {
      schema_version: "1.0",
      source: "discord",
      server: {
        name: state.serverName.trim(),
        description: state.serverDescription.trim() || undefined,
        family_safe: state.familySafe,
      },
      categories: state.categories,
      channels: state.channels,
      roles: state.roles,
    };
  },

  // -- Creation --
  setIsCreating: (isCreating) => set({ isCreating }),
  setCreatedServerId: (createdServerId) => {
    set({ createdServerId });
    if (createdServerId) {
      // Aggregate analytics — fire-and-forget, no PII
      fetch("/api/analytics/migration-track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "import_completed" }),
      }).catch(() => {});
    }
  },

  // -- Reset --
  reset: () => set(initialState),
}));
