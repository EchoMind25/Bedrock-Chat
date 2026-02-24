import type { ChannelType } from "./server";
import type { ServerSettings } from "./server-settings";
import type { ServerThemeConfig } from "./server-theme";
import type { ServerWelcomeScreen } from "./server-welcome";

export interface ServerTemplateData {
  categories: { name: string; position: number }[];
  channels: {
    name: string;
    type: ChannelType;
    categoryName: string;
    position: number;
    topic?: string;
    slowMode?: number;
  }[];
  roles: {
    name: string;
    color: string;
    permissions: number;
    position: number;
  }[];
  settings: Partial<ServerSettings>;
  welcomeScreen: Partial<ServerWelcomeScreen> | null;
  theme: Partial<ServerThemeConfig> | null;
}

export interface ServerTemplate {
  id: string;
  name: string;
  description: string | null;
  sourceServerId: string | null;
  createdBy: string;
  templateData: ServerTemplateData;
  isPublic: boolean;
  code: string;
  useCount: number;
  previewImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const mapDbServerTemplate = (row: Record<string, unknown>): ServerTemplate => ({
  id: row.id as string,
  name: row.name as string,
  description: (row.description as string) || null,
  sourceServerId: (row.source_server_id as string) || null,
  createdBy: row.created_by as string,
  templateData: row.template_data as ServerTemplateData,
  isPublic: row.is_public as boolean,
  code: row.code as string,
  useCount: (row.use_count as number) || 0,
  previewImageUrl: (row.preview_image_url as string) || null,
  createdAt: new Date(row.created_at as string),
  updatedAt: new Date(row.updated_at as string),
});
