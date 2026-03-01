import { z } from "zod";
import type { ServerDefinition } from "../types/server-definition";
import type { ValidationWarning } from "../types/import-validation";

/**
 * SECURITY: This validator is the gatekeeper between untrusted external data
 * and the server creation pipeline. Every import passes through here.
 *
 * PRIVACY: Validates that NO PII exists in the import data.
 * COMPLIANCE: COPPA/GDPR/CCPA — no personal data in server structure definitions.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BEDROCK_PERMISSIONS = [
  "manage_server",
  "manage_channels",
  "manage_roles",
  "manage_messages",
  "moderate_members",
  "send_messages",
  "read_messages",
  "connect_voice",
  "speak_voice",
  "view_audit_log",
  "manage_webhooks",
  "embed_links",
  "attach_files",
  "add_reactions",
  "mention_everyone",
  "use_slash_commands",
] as const;

/** Maximum total JSON payload size (1 MB). */
export const MAX_PAYLOAD_BYTES = 1_048_576;

// ---------------------------------------------------------------------------
// PII Detection Patterns (compiled once)
// ---------------------------------------------------------------------------

const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
  phone: /(?:\+?\d{1,3}[\s\-]?)?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,4}/,
  ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
  ipv6: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/,
} as const;

/** Patterns that produce warnings (not hard rejections). */
const WARNING_PATTERNS = {
  at_username: /@[a-zA-Z0-9_]{2,32}/,
} as const;

// ---------------------------------------------------------------------------
// Injection Detection Patterns
// ---------------------------------------------------------------------------

const INJECTION_PATTERNS = [
  /<script[\s>]/i,
  /javascript\s*:/i,
  /on(?:error|load|click|mouseover)\s*=/i,
  /\$\{/,
  /\{\{/,
  /<\/?\s*(?:script|iframe|object|embed|applet|form|input|link|meta|style)\b/i,
  /['";]\s*(?:OR|AND|UNION|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|EXEC)\s/i,
  /--\s/,
  /\/\*[\s\S]*?\*\//,
] as const;

/** Null byte check. */
const NULL_BYTE = /\0/;

// ---------------------------------------------------------------------------
// Sanitization Helpers
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the string contains any injection attempt.
 */
function containsInjection(s: string): boolean {
  if (NULL_BYTE.test(s)) return true;
  return INJECTION_PATTERNS.some((p) => p.test(s));
}

/**
 * Scans a string for PII. Returns detected categories.
 */
function detectPII(s: string): string[] {
  const found: string[] = [];
  for (const [key, pattern] of Object.entries(PII_PATTERNS)) {
    if (pattern.test(s)) found.push(key);
  }
  return found;
}

/**
 * Scans a string for warning-level patterns (e.g. @usernames).
 */
function detectWarnings(s: string): string[] {
  const found: string[] = [];
  for (const [key, pattern] of Object.entries(WARNING_PATTERNS)) {
    if (pattern.test(s)) found.push(key);
  }
  return found;
}

// ---------------------------------------------------------------------------
// Shared Zod primitives
// ---------------------------------------------------------------------------

const sanitizedString = z
  .string()
  .max(100, "Name exceeds 100 character limit")
  .regex(/^[^<>{}$]*$/, "Contains prohibited characters")
  .transform((s) => s.trim());

const channelNameString = z
  .string()
  .min(1)
  .max(100)
  .regex(
    /^[a-z0-9\-_ ]+$/i,
    "Channel names must be alphanumeric with hyphens, underscores, or spaces",
  )
  .transform((s) => s.toLowerCase().trim());

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
  .optional();

const descriptionString = z.string().max(1024, "Description exceeds 1024 character limit").optional();

/** Allowed icon URL domains. Null/undefined always OK. */
const ALLOWED_ICON_DOMAINS = [
  "cdn.bedrockchat.com",
  "avatars.bedrockchat.com",
  "cdn.discordapp.com",
  "i.imgur.com",
];

const iconUrlSchema = z
  .string()
  .url("Must be a valid URL")
  .refine(
    (url) => {
      try {
        const u = new URL(url);
        return u.protocol === "https:" && ALLOWED_ICON_DOMAINS.includes(u.hostname);
      } catch {
        return false;
      }
    },
    {
      message: `icon_url must be HTTPS from allowed domains: ${ALLOWED_ICON_DOMAINS.join(", ")}`,
    },
  )
  .optional();

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

const categorySchema = z.object({
  ref_id: z.string().min(1).max(100),
  name: sanitizedString.pipe(z.string().min(1)),
  position: z.number().int().min(0),
});

const channelSchema = z.object({
  ref_id: z.string().min(1).max(100),
  name: channelNameString,
  type: z.enum(["text", "voice", "announcement"]),
  category_ref: z.string().optional(),
  topic: descriptionString,
  position: z.number().int().min(0),
  voice_config: z
    .object({
      bitrate: z.number().int().min(8000).max(384000).optional(),
      user_limit: z.number().int().min(0).max(99).optional(),
    })
    .optional(),
  nsfw: z.boolean().optional(),
});

const roleSchema = z.object({
  ref_id: z.string().min(1).max(100),
  name: sanitizedString.pipe(z.string().min(1)),
  color: hexColor,
  position: z.number().int().min(0),
  permissions: z.array(z.enum(BEDROCK_PERMISSIONS)),
  is_default: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Main schema
// ---------------------------------------------------------------------------

const serverDefinitionSchema = z
  .object({
    schema_version: z.literal("1.0"),
    source: z.enum(["template", "discord", "slack", "telegram", "manual"]),
    server: z.object({
      name: sanitizedString.pipe(z.string().min(2).max(100)),
      description: z.string().max(500).optional(),
      icon_url: iconUrlSchema,
      family_safe: z.boolean(),
    }),
    categories: z.array(categorySchema).max(50),
    channels: z.array(channelSchema).min(1).max(500),
    roles: z.array(roleSchema).max(50),
    metadata: z.record(z.unknown()).optional(),
  })
  .superRefine((data, ctx) => {
    // ---------------------------------------------------------------
    // 1. Security: Injection & PII scanning across ALL string fields
    // ---------------------------------------------------------------
    const allStrings: Array<{ value: string; path: (string | number)[] }> = [];

    // Collect every string field
    allStrings.push({ value: data.server.name, path: ["server", "name"] });
    if (data.server.description) {
      allStrings.push({ value: data.server.description, path: ["server", "description"] });
    }

    for (let i = 0; i < data.categories.length; i++) {
      allStrings.push({ value: data.categories[i].name, path: ["categories", i, "name"] });
    }

    for (let i = 0; i < data.channels.length; i++) {
      allStrings.push({ value: data.channels[i].name, path: ["channels", i, "name"] });
      if (data.channels[i].topic) {
        allStrings.push({ value: data.channels[i].topic!, path: ["channels", i, "topic"] });
      }
    }

    for (let i = 0; i < data.roles.length; i++) {
      allStrings.push({ value: data.roles[i].name, path: ["roles", i, "name"] });
    }

    // Scan metadata string values (one level deep)
    if (data.metadata) {
      for (const [key, val] of Object.entries(data.metadata)) {
        if (typeof val === "string") {
          allStrings.push({ value: val, path: ["metadata", key] });
        }
      }
    }

    for (const { value, path } of allStrings) {
      // Injection check
      if (containsInjection(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Contains potentially unsafe content (injection attempt detected)",
          path,
        });
      }

      // PII check
      const pii = detectPII(value);
      if (pii.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Contains personally identifiable information (${pii.join(", ")}) — PII is not allowed in server definitions`,
          path,
        });
      }
    }

    // ---------------------------------------------------------------
    // 2. Structural: Category ref_id uniqueness
    // ---------------------------------------------------------------
    const categoryRefIds = new Set<string>();
    for (const cat of data.categories) {
      if (categoryRefIds.has(cat.ref_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate category ref_id: ${cat.ref_id}`,
          path: ["categories"],
        });
      }
      categoryRefIds.add(cat.ref_id);
    }

    // ---------------------------------------------------------------
    // 3. Structural: Channel category_ref validity
    // ---------------------------------------------------------------
    for (let i = 0; i < data.channels.length; i++) {
      const ch = data.channels[i];
      if (ch.category_ref && !categoryRefIds.has(ch.category_ref)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Channel "${ch.name}" references unknown category_ref: ${ch.category_ref}`,
          path: ["channels", i, "category_ref"],
        });
      }
    }

    // ---------------------------------------------------------------
    // 4. Structural: Channel ref_id uniqueness
    // ---------------------------------------------------------------
    const channelRefIds = new Set<string>();
    for (const ch of data.channels) {
      if (channelRefIds.has(ch.ref_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate channel ref_id: ${ch.ref_id}`,
          path: ["channels"],
        });
      }
      channelRefIds.add(ch.ref_id);
    }

    // ---------------------------------------------------------------
    // 5. Structural: No duplicate channel names within same category
    // ---------------------------------------------------------------
    const channelNamesByCategory = new Map<string, Set<string>>();
    for (let i = 0; i < data.channels.length; i++) {
      const ch = data.channels[i];
      const catKey = ch.category_ref ?? "__uncategorized__";
      if (!channelNamesByCategory.has(catKey)) {
        channelNamesByCategory.set(catKey, new Set());
      }
      const names = channelNamesByCategory.get(catKey)!;
      if (names.has(ch.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate channel name "${ch.name}" in the same category`,
          path: ["channels", i, "name"],
        });
      }
      names.add(ch.name);
    }

    // ---------------------------------------------------------------
    // 6. Structural: Channel positions unique within each category
    // ---------------------------------------------------------------
    const positionsByCategory = new Map<string, Set<number>>();
    for (let i = 0; i < data.channels.length; i++) {
      const ch = data.channels[i];
      const catKey = ch.category_ref ?? "__uncategorized__";
      if (!positionsByCategory.has(catKey)) {
        positionsByCategory.set(catKey, new Set());
      }
      const positions = positionsByCategory.get(catKey)!;
      if (positions.has(ch.position)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate channel position ${ch.position} in category "${catKey}"`,
          path: ["channels", i, "position"],
        });
      }
      positions.add(ch.position);
    }

    // ---------------------------------------------------------------
    // 7. Structural: Role ref_id uniqueness + exactly one default
    // ---------------------------------------------------------------
    const roleRefIds = new Set<string>();
    const roleNames = new Set<string>();
    let defaultCount = 0;
    const rolePositions = new Set<number>();

    for (let i = 0; i < data.roles.length; i++) {
      const role = data.roles[i];

      if (roleRefIds.has(role.ref_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate role ref_id: ${role.ref_id}`,
          path: ["roles", i, "ref_id"],
        });
      }
      roleRefIds.add(role.ref_id);

      // Duplicate role name
      const lowerName = role.name.toLowerCase();
      if (roleNames.has(lowerName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate role name: "${role.name}"`,
          path: ["roles", i, "name"],
        });
      }
      roleNames.add(lowerName);

      // Unique positions
      if (rolePositions.has(role.position)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate role position: ${role.position}`,
          path: ["roles", i, "position"],
        });
      }
      rolePositions.add(role.position);

      if (role.is_default) defaultCount++;
    }

    if (defaultCount > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At most one role can be the default (@everyone) role",
        path: ["roles"],
      });
    }

    // ---------------------------------------------------------------
    // 8. Family-safe: no NSFW channels
    // ---------------------------------------------------------------
    if (data.server.family_safe) {
      for (let i = 0; i < data.channels.length; i++) {
        if (data.channels[i].nsfw) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Family-safe servers cannot contain NSFW channels: "${data.channels[i].name}"`,
            path: ["channels", i, "nsfw"],
          });
        }
      }
    }
  });

// ---------------------------------------------------------------------------
// Warning-level scanner (runs AFTER Zod validation passes)
// ---------------------------------------------------------------------------

/**
 * Scans a validated definition for non-blocking warnings.
 * These don't prevent import but the user should be aware.
 */
export function scanForWarnings(definition: ServerDefinition): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  const scan = (value: string, field: string) => {
    const found = detectWarnings(value);
    if (found.includes("at_username")) {
      warnings.push({
        field,
        message: `Contains what looks like a username mention (@...) which may identify a real user`,
        type: "at_username",
      });
    }
  };

  scan(definition.server.name, "server.name");
  if (definition.server.description) scan(definition.server.description, "server.description");

  definition.categories.forEach((cat, i) => scan(cat.name, `categories[${i}].name`));

  definition.channels.forEach((ch, i) => {
    scan(ch.name, `channels[${i}].name`);
    if (ch.topic) scan(ch.topic, `channels[${i}].topic`);
  });

  definition.roles.forEach((r, i) => scan(r.name, `roles[${i}].name`));

  return warnings;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parses and validates a ServerDefinition from unknown input.
 * Returns the validated definition or throws a ZodError.
 */
export function parseServerDefinition(input: unknown): ServerDefinition {
  return serverDefinitionSchema.parse(input) as ServerDefinition;
}

/**
 * Safely parses a ServerDefinition, returning a result object instead of throwing.
 */
export function safeParseServerDefinition(input: unknown) {
  return serverDefinitionSchema.safeParse(input);
}

export { serverDefinitionSchema };
