"use client";

import type { PasswordValidation } from "@/lib/utils/password-validation";

const LABELS: Record<PasswordValidation["score"], string> = {
  0: "Too weak",
  1: "Weak",
  2: "Fair",
  3: "Good",
  4: "Strong",
};

const COLORS: Record<PasswordValidation["score"], string> = {
  0: "bg-red-500",
  1: "bg-orange-500",
  2: "bg-yellow-500",
  3: "bg-lime-500",
  4: "bg-green-500",
};

const LABEL_COLORS: Record<PasswordValidation["score"], string> = {
  0: "text-red-400",
  1: "text-orange-400",
  2: "text-yellow-400",
  3: "text-lime-400",
  4: "text-green-400",
};

interface PasswordStrengthProps {
  validation: PasswordValidation;
}

export function PasswordStrength({ validation }: PasswordStrengthProps) {
  const { score, errors } = validation;

  return (
    <div className="space-y-2">
      {/* Strength bars */}
      <div className="flex gap-1.5">
        {([1, 2, 3, 4] as const).map((segment) => (
          <div
            key={segment}
            className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden"
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                score >= segment ? COLORS[score] : "bg-transparent"
              }`}
              style={{ width: score >= segment ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>

      {/* Label */}
      <p className={`text-xs font-medium ${LABEL_COLORS[score]}`}>
        {LABELS[score]}
      </p>

      {/* Error list */}
      {errors.length > 0 && (
        <ul className="space-y-1">
          {errors.map((error) => (
            <li key={error} className="text-xs text-red-400/80">
              {error}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
