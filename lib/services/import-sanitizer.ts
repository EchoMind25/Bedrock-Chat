import type { ServerDefinition } from "../types/server-definition";

/**
 * Import Sanitizer
 *
 * Beyond validation, this module TRANSFORMS import data to be safe and
 * consistent before it enters the server creation pipeline.
 *
 * SECURITY: Strips unknown fields, normalizes names, removes unsafe URLs.
 * PRIVACY: No PII is stored or forwarded — PII must be caught by the
 *          validator BEFORE reaching this sanitizer.
 */

// ---------------------------------------------------------------------------
// Allowed icon URL domains (same list as validator — single source of truth)
// ---------------------------------------------------------------------------

const ALLOWED_ICON_DOMAINS = new Set([
  "cdn.bedrockchat.com",
  "avatars.bedrockchat.com",
  "cdn.discordapp.com",
  "i.imgur.com",
]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SanitizeResult {
  definition: ServerDefinition;
  changes: SanitizeChange[];
}

export interface SanitizeChange {
  type: "stripped" | "normalized" | "removed" | "added" | "deduplicated" | "reindexed";
  field: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalizes a channel name to lowercase-hyphenated format.
 * "Tech Talk" → "tech-talk", "My_Channel" → "my_channel"
 */
function normalizeChannelName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Normalizes a role/category name: trim + limit length.
 */
function normalizeName(name: string, maxLength = 100): string {
  return name.trim().slice(0, maxLength);
}

/**
 * Checks if a URL is from an allowed domain.
 */
function isAllowedIconUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && ALLOWED_ICON_DOMAINS.has(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Deduplicates a name within a set by appending `-2`, `-3`, etc.
 */
function deduplicateName(name: string, existing: Set<string>): string {
  if (!existing.has(name)) return name;
  let counter = 2;
  while (existing.has(`${name}-${counter}`)) {
    counter++;
  }
  return `${name}-${counter}`;
}

// ---------------------------------------------------------------------------
// Main Sanitizer
// ---------------------------------------------------------------------------

/**
 * Sanitizes a ServerDefinition that has already passed Zod validation.
 *
 * This function:
 * 1. Strips unknown metadata fields (only allows known keys)
 * 2. Normalizes channel names to lowercase-hyphenated
 * 3. Normalizes role/category names (trim + limit length)
 * 4. Removes icon_url from disallowed domains
 * 5. Deduplicates channel names within each category
 * 6. Ensures at least one text channel exists
 * 7. Ensures at least one role with is_default exists
 * 8. Reindexes positions to be sequential
 */
export function sanitizeDefinition(input: ServerDefinition): SanitizeResult {
  const changes: SanitizeChange[] = [];

  // Deep clone to avoid mutating input
  const def: ServerDefinition = JSON.parse(JSON.stringify(input));

  // ------------------------------------------------------------------
  // 1. Strip unknown metadata fields
  // ------------------------------------------------------------------
  const KNOWN_METADATA_KEYS = new Set([
    "imported_at",
    "source_platform_version",
    "converter_version",
    "original_server_id",
  ]);

  if (def.metadata) {
    const keys = Object.keys(def.metadata);
    for (const key of keys) {
      if (!KNOWN_METADATA_KEYS.has(key)) {
        delete def.metadata[key];
        changes.push({
          type: "stripped",
          field: `metadata.${key}`,
          message: `Removed unknown metadata field "${key}"`,
        });
      }
    }
    // Remove metadata entirely if empty
    if (Object.keys(def.metadata).length === 0) {
      def.metadata = undefined;
    }
  }

  // ------------------------------------------------------------------
  // 2. Validate/remove icon_url from disallowed domains
  // ------------------------------------------------------------------
  if (def.server.icon_url) {
    if (!isAllowedIconUrl(def.server.icon_url)) {
      changes.push({
        type: "removed",
        field: "server.icon_url",
        message: `Removed icon_url from disallowed domain: ${new URL(def.server.icon_url).hostname}`,
      });
      def.server.icon_url = undefined;
    }
  }

  // ------------------------------------------------------------------
  // 3. Normalize category names
  // ------------------------------------------------------------------
  for (let i = 0; i < def.categories.length; i++) {
    const original = def.categories[i].name;
    const normalized = normalizeName(original);
    if (normalized !== original) {
      def.categories[i].name = normalized;
      changes.push({
        type: "normalized",
        field: `categories[${i}].name`,
        message: `Normalized category name "${original}" → "${normalized}"`,
      });
    }
  }

  // ------------------------------------------------------------------
  // 4. Normalize channel names + deduplicate within each category
  // ------------------------------------------------------------------
  const namesByCategory = new Map<string, Set<string>>();

  for (let i = 0; i < def.channels.length; i++) {
    const ch = def.channels[i];
    const original = ch.name;
    let normalized = normalizeChannelName(original);

    // Ensure non-empty after normalization
    if (normalized.length === 0) {
      normalized = "channel";
    }

    if (normalized !== original) {
      changes.push({
        type: "normalized",
        field: `channels[${i}].name`,
        message: `Normalized channel name "${original}" → "${normalized}"`,
      });
    }

    // Deduplicate within category
    const catKey = ch.category_ref ?? "__uncategorized__";
    if (!namesByCategory.has(catKey)) {
      namesByCategory.set(catKey, new Set());
    }
    const existing = namesByCategory.get(catKey)!;
    const deduped = deduplicateName(normalized, existing);

    if (deduped !== normalized) {
      changes.push({
        type: "deduplicated",
        field: `channels[${i}].name`,
        message: `Deduplicated channel name "${normalized}" → "${deduped}"`,
      });
    }

    existing.add(deduped);
    def.channels[i].name = deduped;
  }

  // ------------------------------------------------------------------
  // 5. Normalize role names
  // ------------------------------------------------------------------
  for (let i = 0; i < def.roles.length; i++) {
    const original = def.roles[i].name;
    const normalized = normalizeName(original);
    if (normalized !== original) {
      def.roles[i].name = normalized;
      changes.push({
        type: "normalized",
        field: `roles[${i}].name`,
        message: `Normalized role name "${original}" → "${normalized}"`,
      });
    }
  }

  // ------------------------------------------------------------------
  // 6. Ensure at least one text channel exists
  // ------------------------------------------------------------------
  const hasTextChannel = def.channels.some((ch) => ch.type === "text");
  if (!hasTextChannel) {
    const firstCatRef = def.categories[0]?.ref_id;
    def.channels.push({
      ref_id: "__generated_general__",
      name: "general",
      type: "text",
      category_ref: firstCatRef,
      position: 0,
    });
    changes.push({
      type: "added",
      field: "channels",
      message: 'Added default "general" text channel (none existed)',
    });
  }

  // ------------------------------------------------------------------
  // 7. Ensure at least one default role exists
  // ------------------------------------------------------------------
  const hasDefault = def.roles.some((r) => r.is_default);
  if (!hasDefault) {
    if (def.roles.length > 0) {
      // Mark the lowest-position role as default
      const sorted = [...def.roles].sort((a, b) => a.position - b.position);
      const lowestRef = sorted[0].ref_id;
      const idx = def.roles.findIndex((r) => r.ref_id === lowestRef);
      def.roles[idx].is_default = true;
      changes.push({
        type: "normalized",
        field: `roles[${idx}].is_default`,
        message: `Marked role "${def.roles[idx].name}" as default (no default role existed)`,
      });
    } else {
      // Create a Member role
      def.roles.push({
        ref_id: "__generated_member__",
        name: "Member",
        position: 0,
        permissions: ["send_messages", "read_messages", "add_reactions", "connect_voice", "speak_voice"],
        is_default: true,
      });
      changes.push({
        type: "added",
        field: "roles",
        message: 'Added default "Member" role (no roles existed)',
      });
    }
  }

  // ------------------------------------------------------------------
  // 8. Reindex positions to be sequential (no gaps)
  // ------------------------------------------------------------------

  // 8a. Category positions
  const sortedCats = [...def.categories].sort((a, b) => a.position - b.position);
  let catPositionsChanged = false;
  for (let i = 0; i < sortedCats.length; i++) {
    if (sortedCats[i].position !== i) catPositionsChanged = true;
    sortedCats[i].position = i;
  }
  if (catPositionsChanged) {
    // Write back sorted positions
    for (const sortedCat of sortedCats) {
      const idx = def.categories.findIndex((c) => c.ref_id === sortedCat.ref_id);
      def.categories[idx].position = sortedCat.position;
    }
    changes.push({
      type: "reindexed",
      field: "categories",
      message: "Reindexed category positions to be sequential",
    });
  }

  // 8b. Channel positions within each category
  const channelsByCategory = new Map<string, number[]>();
  for (let i = 0; i < def.channels.length; i++) {
    const catKey = def.channels[i].category_ref ?? "__uncategorized__";
    if (!channelsByCategory.has(catKey)) channelsByCategory.set(catKey, []);
    channelsByCategory.get(catKey)!.push(i);
  }

  let channelPositionsChanged = false;
  for (const indices of channelsByCategory.values()) {
    // Sort by current position
    indices.sort((a, b) => def.channels[a].position - def.channels[b].position);
    for (let pos = 0; pos < indices.length; pos++) {
      if (def.channels[indices[pos]].position !== pos) channelPositionsChanged = true;
      def.channels[indices[pos]].position = pos;
    }
  }
  if (channelPositionsChanged) {
    changes.push({
      type: "reindexed",
      field: "channels",
      message: "Reindexed channel positions to be sequential within categories",
    });
  }

  // 8c. Role positions
  const sortedRoles = def.roles.map((r, i) => ({ idx: i, pos: r.position }));
  sortedRoles.sort((a, b) => a.pos - b.pos);
  let rolePositionsChanged = false;
  for (let i = 0; i < sortedRoles.length; i++) {
    if (def.roles[sortedRoles[i].idx].position !== i) rolePositionsChanged = true;
    def.roles[sortedRoles[i].idx].position = i;
  }
  if (rolePositionsChanged) {
    changes.push({
      type: "reindexed",
      field: "roles",
      message: "Reindexed role positions to be sequential",
    });
  }

  return { definition: def, changes };
}
