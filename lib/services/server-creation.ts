import type { SupabaseClient } from "@supabase/supabase-js";
import type { ServerDefinition } from "../types/server-definition";
import type { ChannelType } from "../types/server";
import type { Role } from "../types/permissions";
import { resolvePermissions } from "../templates/permission-map";
import { generateDefaultRoles } from "../constants/roles";

export interface CreateServerOptions {
  /** The server definition (template or import) */
  definition: ServerDefinition;
  /** User-provided name (overrides definition.server.name) */
  serverName: string;
  /** Authenticated user ID */
  userId: string;
  /** User-uploaded icon URL */
  serverIcon?: string | null;
  /** User-provided description */
  description?: string;
  /** Server category for discovery */
  category?: string;
  /** Privacy settings */
  isPublic?: boolean;
  allowDiscovery?: boolean;
  requireApproval?: boolean;
  isFamilyFriendly?: boolean;
}

export interface CreateServerResult {
  serverId: string;
  categories: { id: string; name: string; serverId: string; position: number; collapsed: boolean }[];
  channels: {
    id: string;
    name: string;
    type: ChannelType;
    serverId: string;
    categoryId?: string;
    position: number;
    unreadCount: number;
    isNsfw: boolean;
    slowMode: number;
  }[];
  roles: Role[];
  firstChannelId: string | null;
}

/**
 * Creates a server from a ServerDefinition.
 *
 * This is the single pipeline for ALL server creation paths:
 * - Pre-built templates
 * - Discord imports
 * - Manual creation (custom template)
 *
 * The caller is responsible for:
 * - Updating Zustand stores (useServerStore, usePointsStore)
 * - Navigation (router.push)
 * - Toast notifications
 * - Closing modals
 */
export async function createServerFromDefinition(
  supabase: SupabaseClient,
  options: CreateServerOptions,
): Promise<CreateServerResult> {
  const {
    definition,
    serverName,
    userId,
    serverIcon = null,
    description = "",
    category = "general",
    isPublic = false,
    allowDiscovery = false,
    requireApproval = true,
    isFamilyFriendly,
  } = options;

  const familyFriendly = isFamilyFriendly ?? definition.server.family_safe;

  // Filter NSFW channels when family-safe
  const channels = familyFriendly
    ? definition.channels.filter((ch) => !ch.nsfw)
    : definition.channels;

  // Build category name → ref_id lookup
  const categoryRefToName = new Map<string, string>();
  for (const cat of definition.categories) {
    categoryRefToName.set(cat.ref_id, cat.name);
  }

  // 1. Create server
  const serverId = crypto.randomUUID();
  const { error: serverError } = await supabase.from("servers").insert({
    id: serverId,
    name: serverName.trim(),
    description: description.trim() || null,
    owner_id: userId,
    icon_url: serverIcon,
    is_public: isPublic,
    allow_discovery: isPublic ? true : allowDiscovery,
    require_approval: isPublic ? false : requireApproval,
    is_family_friendly: familyFriendly,
    category,
  });

  if (serverError) throw serverError;

  // 2. Add creator as owner (cleanup server on failure)
  const { error: memberError } = await supabase.from("server_members").insert({
    server_id: serverId,
    user_id: userId,
    role: "owner",
  });

  if (memberError) {
    await supabase.from("servers").delete().eq("id", serverId);
    throw memberError;
  }

  // 3. Create categories
  const categoryInserts = definition.categories.map((cat) => ({
    server_id: serverId,
    name: cat.name,
    position: cat.position,
  }));

  let categoriesData: Array<{ id: string; name: string; position: number }> = [];
  if (categoryInserts.length > 0) {
    const { data, error: catError } = await supabase
      .from("channel_categories")
      .insert(categoryInserts)
      .select();

    if (catError) {
      console.error("[ServerCreation] Error creating categories:", catError);
    } else {
      categoriesData = data || [];
    }
  }

  // Build category name → DB ID lookup
  const categoryNameToId = new Map<string, string>();
  for (const cat of categoriesData) {
    categoryNameToId.set(cat.name, cat.id);
  }

  // 4. Create channels
  const channelInserts = channels.map((ch) => {
    const catName = ch.category_ref ? categoryRefToName.get(ch.category_ref) : undefined;
    const catId = catName ? categoryNameToId.get(catName) : null;
    return {
      server_id: serverId,
      category_id: catId || null,
      name: ch.name,
      type: ch.type,
      position: ch.position,
      topic: ch.topic || null,
      is_nsfw: ch.nsfw || false,
    };
  });

  let channelsData: Array<{
    id: string;
    name: string;
    type: string;
    category_id: string | null;
    position: number;
    is_nsfw: boolean;
    slow_mode_seconds: number;
  }> = [];

  if (channelInserts.length > 0) {
    const { data, error: chError } = await supabase
      .from("channels")
      .insert(channelInserts)
      .select();

    if (chError) {
      console.error("[ServerCreation] Error creating channels:", chError);
    } else {
      channelsData = data || [];
    }
  }

  // 5. Create roles
  let roles: Role[];

  if (definition.roles.length > 0) {
    const roleInserts = definition.roles.map((r) => ({
      id: `${serverId}-role-${r.ref_id}`,
      server_id: serverId,
      name: r.name,
      color: r.color || "oklch(0.5 0 0)",
      permissions: resolvePermissions(r.permissions),
      position: r.position,
      mentionable: r.position > 0,
      is_default: r.is_default || false,
    }));

    const { error: roleError } = await supabase
      .from("server_roles")
      .insert(roleInserts);

    if (roleError) {
      console.error("[ServerCreation] Error creating roles:", roleError);
    }

    roles = definition.roles.map((r) => ({
      id: `${serverId}-role-${r.ref_id}`,
      serverId,
      name: r.name,
      color: r.color || "oklch(0.5 0 0)",
      permissions: resolvePermissions(r.permissions),
      position: r.position,
      mentionable: r.position > 0,
      memberCount: 0,
      isDefault: r.is_default || false,
      createdAt: new Date(),
    }));
  } else {
    // Fallback to default roles
    const defaultRoles = generateDefaultRoles(serverId);
    const roleInserts = defaultRoles.map((role) => ({
      id: role.id,
      server_id: serverId,
      name: role.name,
      color: role.color,
      permissions: role.permissions,
      position: role.position,
      mentionable: role.mentionable,
      is_default: role.isDefault,
    }));

    const { error: roleError } = await supabase
      .from("server_roles")
      .insert(roleInserts);

    if (roleError) {
      console.error("[ServerCreation] Error creating default roles:", roleError);
    }

    roles = defaultRoles;
  }

  // 6. Audit log (non-critical)
  try {
    await supabase.from("audit_log").insert({
      server_id: serverId,
      actor_id: userId,
      action: "server_create",
      target_id: serverId,
      target_name: serverName.trim(),
      target_type: "server",
    });
  } catch {
    // Audit log failure is non-critical
  }

  // 7. Build result
  const resultCategories = categoriesData.map((cat) => ({
    id: cat.id,
    name: cat.name,
    serverId,
    position: cat.position,
    collapsed: false,
  }));

  const resultChannels = channelsData.map((ch) => ({
    id: ch.id,
    name: ch.name,
    type: ch.type as ChannelType,
    serverId,
    categoryId: ch.category_id || undefined,
    position: ch.position,
    unreadCount: 0,
    isNsfw: ch.is_nsfw,
    slowMode: ch.slow_mode_seconds ?? 0,
  }));

  return {
    serverId,
    categories: resultCategories,
    channels: resultChannels,
    roles,
    firstChannelId: resultChannels[0]?.id || null,
  };
}
