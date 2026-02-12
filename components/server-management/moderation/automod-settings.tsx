"use client";

import { Toggle } from "../../ui/toggle/toggle";
import { Input } from "../../ui/input/input";
import type { AutoModSettings } from "../../../lib/types/moderation";

interface AutoModSettingsFormProps {
  settings: AutoModSettings;
  onChange: (settings: Partial<AutoModSettings>) => void;
}

export function AutoModSettingsForm({ settings, onChange }: AutoModSettingsFormProps) {
  return (
    <div className="space-y-4">
      <Toggle
        checked={settings.enabled}
        onChange={(e) => onChange({ enabled: e.target.checked })}
        label="Enable AutoMod"
        size="md"
      />

      {settings.enabled && (
        <div className="space-y-3 pl-8 border-l-2 border-blue-500/30">
          <Toggle
            checked={settings.filterProfanity}
            onChange={(e) => onChange({ filterProfanity: e.target.checked })}
            label="Filter profanity and offensive language"
          />

          <Toggle
            checked={settings.filterSpam}
            onChange={(e) => onChange({ filterSpam: e.target.checked })}
            label="Filter spam and repeated messages"
          />

          <Toggle
            checked={settings.filterLinks}
            onChange={(e) => onChange({ filterLinks: e.target.checked })}
            label="Filter suspicious links"
          />

          <Toggle
            checked={settings.filterInvites}
            onChange={(e) => onChange({ filterInvites: e.target.checked })}
            label="Filter server invite links"
          />

          <div className="space-y-2">
            <Toggle
              checked={settings.filterMentionSpam}
              onChange={(e) => onChange({ filterMentionSpam: e.target.checked })}
              label="Filter mention spam"
            />
            {settings.filterMentionSpam && (
              <Input
                type="number"
                label="Max mentions per message"
                value={settings.mentionLimit.toString()}
                onChange={(e) =>
                  onChange({ mentionLimit: Number.parseInt(e.target.value) || 5 })
                }
                min={1}
                max={50}
                helperText="Maximum number of @mentions allowed in a single message"
              />
            )}
          </div>
        </div>
      )}

      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <p className="text-xs text-blue-300">
          <strong className="text-blue-200">Note:</strong> AutoMod automatically flags and removes content that violates these
          rules. Moderators can review actions in the audit log.
        </p>
      </div>
    </div>
  );
}
