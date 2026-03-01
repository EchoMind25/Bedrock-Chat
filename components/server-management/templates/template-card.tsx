"use client";

import { motion } from "motion/react";
import { Hash, Volume2, Megaphone } from "lucide-react";
import { Badge } from "../../ui/badge/badge";
import { cn } from "../../../lib/utils/cn";
import type { BuiltinTemplate } from "../../../lib/templates/builtin";

interface TemplateCardProps {
  template: BuiltinTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

export function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  const Icon = template.icon;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-label={`${template.displayName} template`}
      aria-pressed={isSelected}
      className={cn(
        "p-4 rounded-lg border-2 transition-colors text-left min-h-[44px] touch-manipulation",
        isSelected
          ? "border-blue-500 bg-blue-500/10"
          : "border-white/10 hover:border-white/20 hover:bg-white/5",
        "focus-visible:outline-2 focus-visible:outline-primary",
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon
        className={cn(
          "w-8 h-8 mb-2",
          isSelected ? "text-blue-400" : "text-white/60",
        )}
        aria-hidden="true"
      />
      <h3 className="font-medium mb-1">{template.displayName}</h3>
      <p className="text-xs text-white/60 mb-2">{template.description}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-white/40">
          {template.channelCount} channels
        </span>
        {template.isFamilySafe && (
          <Badge variant="success">Family Safe</Badge>
        )}
      </div>
    </motion.button>
  );
}

interface TemplatePreviewProps {
  template: BuiltinTemplate;
}

const CHANNEL_ICONS = {
  text: Hash,
  voice: Volume2,
  announcement: Megaphone,
} as const;

export function TemplatePreview({ template }: TemplatePreviewProps) {
  const { definition } = template;

  // Group channels by category
  const categoryMap = new Map<string, typeof definition.channels>();
  for (const cat of definition.categories) {
    categoryMap.set(cat.ref_id, []);
  }
  for (const ch of definition.channels) {
    if (ch.category_ref && categoryMap.has(ch.category_ref)) {
      categoryMap.get(ch.category_ref)!.push(ch);
    }
  }

  return (
    <div className="space-y-3 p-3 bg-white/5 rounded-lg border border-white/10 max-h-48 overflow-y-auto scrollbar-thin">
      {definition.categories.map((cat) => {
        const channels = categoryMap.get(cat.ref_id) || [];
        return (
          <div key={cat.ref_id}>
            <p className="text-xs font-semibold text-white/40 uppercase mb-1">
              {cat.name}
            </p>
            <div className="space-y-0.5 ml-1">
              {channels.map((ch) => {
                const ChannelIcon = CHANNEL_ICONS[ch.type];
                return (
                  <div key={ch.ref_id} className="flex items-center gap-1.5 text-sm text-white/60">
                    <ChannelIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{ch.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {definition.roles.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase mb-1">
            ROLES
          </p>
          <div className="space-y-0.5 ml-1">
            {definition.roles.map((role) => (
              <div key={role.ref_id} className="flex items-center gap-1.5 text-sm text-white/60">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: role.color || "oklch(0.5 0 0)" }}
                  aria-hidden="true"
                />
                <span>{role.name}</span>
                {role.is_default && (
                  <span className="text-xs text-white/30">(default)</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
