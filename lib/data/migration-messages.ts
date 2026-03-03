/**
 * Pre-formatted migration messages for server owners.
 *
 * These are template messages that server owners can copy and paste into
 * their Discord server to announce the migration to Bedrock Chat.
 *
 * PRIVACY: These templates contain NO user data. Variable substitution
 * happens client-side with the owner's invite links and server info.
 */

export interface MigrationMessageVars {
  INVITE_LINK: string;
  ROLE_NAME: string;
  JOINED_COUNT: number;
  DAYS_REMAINING: number;
  DATE: string;
  SERVER_NAME: string;
}

export interface MigrationTemplate {
  id: string;
  title: string;
  description: string;
  template: string;
}

export const MIGRATION_TEMPLATES: MigrationTemplate[] = [
  {
    id: "initial",
    title: "Initial Announcement",
    description: "First message to announce the migration. Post this in your main Discord channel.",
    template: `Hey everyone! We're moving to Bedrock Chat — a privacy-first platform that actually respects your data.

Why? [Your reason here — e.g., "better privacy", "family-safe features", "no surveillance"]

How to join:
1. Click this link: {INVITE_LINK}
2. Create your free account (takes 30 seconds)
3. You'll automatically get your {ROLE_NAME} role

What you keep: Same channels, same roles, same community.
What changes: Better privacy, no surveillance, family-safe options.

See you on Bedrock!`,
  },
  {
    id: "reminder",
    title: "Reminder (1 week later)",
    description: "Send this a week after the initial announcement to catch stragglers.",
    template: `Reminder: We're on Bedrock Chat now!

{JOINED_COUNT} of us have already made the switch. If you haven't yet:

{INVITE_LINK}

Your {ROLE_NAME} role will be set up automatically.

We'll keep this Discord active for {DAYS_REMAINING} more days, then we're going Bedrock-only.`,
  },
  {
    id: "final",
    title: "Final Notice",
    description: "Last call before archiving the Discord server.",
    template: `Last call — {SERVER_NAME} is moving to Bedrock Chat.

This Discord server will be archived on {DATE}. {JOINED_COUNT} members are already there.

Join now: {INVITE_LINK}

Your {ROLE_NAME} role will be set up automatically. No messages or data from Discord are transferred — your privacy is protected.`,
  },
];

/**
 * Replace template variables with actual values.
 * Unknown variables are left as-is for the owner to fill in.
 */
export function interpolateTemplate(
  template: string,
  vars: Partial<MigrationMessageVars>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    if (value !== undefined && value !== null) {
      result = result.replaceAll(`{${key}}`, String(value));
    }
  }
  return result;
}
