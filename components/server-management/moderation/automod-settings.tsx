"use client";

import { Toggle } from "../../ui/toggle/toggle";
import { Input } from "../../ui/input/input";
import type { AutoModSettings } from "../../../lib/types/moderation";

interface AutoModSettingsFormProps {
  settings: AutoModSettings;
  onChange: (settings: Partial<AutoModSettings>) => void;
}

export function AutoModSettingsForm({ settings }: AutoModSettingsFormProps) {
  return (
    <div className="space-y-4">
      {/* Coming Soon banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <span className="text-amber-400 text-lg leading-none mt-0.5">&#9888;</span>
        <div>
          <p className="text-sm font-semibold text-amber-200 mb-1">AutoMod — Coming Soon</p>
          <p className="text-xs text-amber-300/80 leading-relaxed">
            AutoMod is under development. These settings are preview-only and are{" "}
            <strong className="text-amber-200">not currently enforced</strong>. No content
            filtering is active on your server. Configuration will be saved and activated
            when AI-powered moderation launches.
          </p>
        </div>
      </div>

      {/* Settings preview — disabled */}
      <div className="space-y-4 pointer-events-none opacity-50" aria-disabled="true">
        <Toggle
          checked={settings.enabled}
          onChange={() => {}}
          label="Enable AutoMod"
          size="md"
        />

        <div className="space-y-3 pl-8 border-l-2 border-blue-500/30">
          <Toggle
            checked={settings.filterProfanity}
            onChange={() => {}}
            label="Filter profanity and offensive language"
          />

          <Toggle
            checked={settings.filterSpam}
            onChange={() => {}}
            label="Filter spam and repeated messages"
          />

          <Toggle
            checked={settings.filterLinks}
            onChange={() => {}}
            label="Filter suspicious links"
          />

          <Toggle
            checked={settings.filterInvites}
            onChange={() => {}}
            label="Filter server invite links"
          />

          <div className="space-y-2">
            <Toggle
              checked={settings.filterMentionSpam}
              onChange={() => {}}
              label="Filter mention spam"
            />
            <Input
              type="number"
              label="Max mentions per message"
              value={settings.mentionLimit.toString()}
              onChange={() => {}}
              min={1}
              max={50}
              helperText="Maximum number of @mentions allowed in a single message"
            />
          </div>
        </div>
      </div>

      {/* Future implementation note */}
      <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
        <p className="text-xs text-slate-400">
          <strong className="text-slate-300">Planned:</strong> AutoMod will use AI-powered
          moderation to automatically flag and remove rule-violating content. All actions will
          be logged in the audit log with full transparency. Server owners control all rules.
        </p>
      </div>
    </div>
  );
}
