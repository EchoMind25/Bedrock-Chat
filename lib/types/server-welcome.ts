export interface OnboardingStep {
  title: string;
  description: string;
  emoji: string;
  action?: {
    type: "role_select" | "channel_visit" | "rules_accept" | "info";
    data?: Record<string, unknown>;
  };
}

export interface ServerWelcomeScreen {
  id: string;
  serverId: string;
  enabled: boolean;
  title: string;
  description: string | null;
  backgroundImageUrl: string | null;
  backgroundColor: string | null;
  featuredChannels: string[];
  onboardingSteps: OnboardingStep[];
  selectableRoles: string[];
  requireRoleSelection: boolean;
  requireRulesAcceptance: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingProgress {
  serverId: string;
  userId: string;
  completedAt: Date | null;
  acceptedRulesAt: Date | null;
  selectedRoles: string[];
  currentStep: number;
}

export const mapDbWelcomeScreen = (row: Record<string, unknown>): ServerWelcomeScreen => ({
  id: row.id as string,
  serverId: row.server_id as string,
  enabled: row.enabled as boolean,
  title: row.title as string,
  description: (row.description as string) || null,
  backgroundImageUrl: (row.background_image_url as string) || null,
  backgroundColor: (row.background_color as string) || null,
  featuredChannels: (row.featured_channels as string[]) || [],
  onboardingSteps: (row.onboarding_steps as OnboardingStep[]) || [],
  selectableRoles: (row.selectable_roles as string[]) || [],
  requireRoleSelection: row.require_role_selection as boolean,
  requireRulesAcceptance: row.require_rules_acceptance as boolean,
  createdAt: new Date(row.created_at as string),
  updatedAt: new Date(row.updated_at as string),
});

export const mapDbOnboardingProgress = (row: Record<string, unknown>): OnboardingProgress => ({
  serverId: row.server_id as string,
  userId: row.user_id as string,
  completedAt: row.completed_at ? new Date(row.completed_at as string) : null,
  acceptedRulesAt: row.accepted_rules_at ? new Date(row.accepted_rules_at as string) : null,
  selectedRoles: (row.selected_roles as string[]) || [],
  currentStep: (row.current_step as number) || 0,
});
