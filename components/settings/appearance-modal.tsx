"use client";

import { Modal } from "@/components/ui/modal/modal";
import { Toggle } from "@/components/ui/toggle/toggle";
import { useThemeStore } from "@/store/theme.store";
import type { ThemeOverrideMode } from "@/lib/themes/types";

interface AppearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppearanceModal({ isOpen, onClose }: AppearanceModalProps) {
  const preferences = useThemeStore((s) => s.preferences);
  const setMessageDensity = useThemeStore((s) => s.setMessageDensity);
  const setFontSize = useThemeStore((s) => s.setFontSize);
  const setHighContrast = useThemeStore((s) => s.setHighContrast);
  const setReducedMotion = useThemeStore((s) => s.setReducedMotion);
  const setLargerText = useThemeStore((s) => s.setLargerText);
  const setShowAvatars = useThemeStore((s) => s.setShowAvatars);
  const setShowTimestamps = useThemeStore((s) => s.setShowTimestamps);
  const setOverrideMode = useThemeStore((s) => s.setOverrideMode);

  const themeOptions: Array<{ value: ThemeOverrideMode; label: string; desc: string }> = [
    { value: "use_server", label: "Use Server Theme", desc: "Respect each server's custom theme" },
    { value: "force_personal", label: "Force Personal Theme", desc: "Apply your preferred theme everywhere" },
    { value: "simple_mode", label: "Simple Mode", desc: "Minimal effects for better performance" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Appearance"
      size="md"
    >
      <div className="space-y-8 pb-4">
        {/* Theme Override */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Theme Mode
          </h3>
          <div className="space-y-2">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setOverrideMode(option.value)}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  preferences.overrideMode === option.value
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-white/10 hover:border-white/20 hover:bg-white/5"
                }`}
              >
                <div className="font-medium text-sm text-slate-100">{option.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{option.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Message Density */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Message Density
          </h3>
          <div className="flex gap-2">
            {(["compact", "cozy", "spacious"] as const).map((density) => (
              <button
                key={density}
                type="button"
                onClick={() => setMessageDensity(density)}
                className={`flex-1 p-3 rounded-lg border-2 transition-all text-center text-sm capitalize ${
                  preferences.messageDensity === density
                    ? "border-blue-500 bg-blue-500/10 text-blue-300"
                    : "border-white/10 hover:border-white/20 text-slate-300"
                }`}
              >
                {density}
              </button>
            ))}
          </div>
        </section>

        {/* Font Size */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Font Size
          </h3>
          <div className="flex gap-2">
            {(["small", "medium", "large"] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setFontSize(size)}
                className={`flex-1 p-3 rounded-lg border-2 transition-all text-center text-sm capitalize ${
                  preferences.fontSize === size
                    ? "border-blue-500 bg-blue-500/10 text-blue-300"
                    : "border-white/10 hover:border-white/20 text-slate-300"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </section>

        {/* Accessibility */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Accessibility
          </h3>
          <div className="space-y-3">
            <Toggle
              checked={preferences.highContrast}
              onChange={(e) => setHighContrast(e.target.checked)}
              label="High Contrast"
            />
            <Toggle
              checked={preferences.reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              label="Reduced Motion"
            />
            <Toggle
              checked={preferences.largerText}
              onChange={(e) => setLargerText(e.target.checked)}
              label="Larger Text"
            />
          </div>
        </section>

        {/* Display */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Display
          </h3>
          <div className="space-y-3">
            <Toggle
              checked={preferences.showAvatars}
              onChange={(e) => setShowAvatars(e.target.checked)}
              label="Show Avatars"
            />
            <Toggle
              checked={preferences.showTimestamps}
              onChange={(e) => setShowTimestamps(e.target.checked)}
              label="Show Timestamps"
            />
          </div>
        </section>
      </div>
    </Modal>
  );
}
