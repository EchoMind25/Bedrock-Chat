"use client";

import { useState, type HTMLAttributes } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "../../../lib/utils/cn";
import { PRESET_ROLE_COLORS } from "../../../lib/constants/roles";
import { Input } from "../../ui/input/input";

interface ColorPickerProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPicker({ value, onChange, label, className, ...props }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(value);

  const handlePresetSelect = (color: string) => {
    onChange(color);
    setCustomColor(color);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);

    // Simple validation: Check if it looks like an OKLCH or hex color
    if (color.startsWith("oklch(") || color.startsWith("#")) {
      onChange(color);
    }
  };

  return (
    <div className={cn("space-y-4", className)} {...props}>
      {label && <label className="text-sm font-medium">{label}</label>}

      {/* Preset swatches */}
      <div className="space-y-2">
        <p className="text-xs text-white/60">Preset Colors</p>
        <div className="grid grid-cols-6 gap-2">
          {PRESET_ROLE_COLORS.map((preset) => (
            <motion.button
              key={preset.name}
              type="button"
              onClick={() => handlePresetSelect(preset.color)}
              className={cn(
                "relative w-full aspect-square rounded-lg transition-transform",
                "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/30",
              )}
              style={{ backgroundColor: preset.color }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Select ${preset.name} color`}
              title={preset.name}
            >
              {value === preset.color && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="p-1 rounded-full bg-white">
                    <Check className="w-3 h-3 text-black" />
                  </div>
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Custom color input */}
      <div className="space-y-2">
        <p className="text-xs text-white/60">Custom Color (OKLCH)</p>
        <Input
          value={customColor}
          onChange={(e) => handleCustomColorChange(e.target.value)}
          placeholder="oklch(0.65 0.25 265)"
          className="font-mono text-sm"
        />
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <p className="text-xs text-white/60">Preview</p>
        <motion.div
          className="p-4 rounded-lg text-center font-medium"
          style={{ backgroundColor: value }}
          animate={{ backgroundColor: value }}
          transition={{ duration: 0.2 }}
        >
          <span className="drop-shadow-lg">Role Name</span>
        </motion.div>
      </div>
    </div>
  );
}
