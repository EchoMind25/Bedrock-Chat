"use client";

import { motion, AnimatePresence } from "motion/react";
import { useImportStore } from "@/store/import.store";
import { StepServerName } from "./steps/step-server-name";
import { StepFamilySafe } from "./steps/step-family-safe";
import { StepCategories } from "./steps/step-categories";
import { StepChannels } from "./steps/step-channels";
import { StepRoles } from "./steps/step-roles";
import { StepReview } from "./steps/step-review";

const spring = { type: "spring" as const, stiffness: 260, damping: 25, mass: 1 };

const STEP_LABELS = [
  "Server Name",
  "Family Safety",
  "Categories",
  "Channels",
  "Roles",
  "Review",
];

export function GuidedWizard() {
  const guidedStep = useImportStore((s) => s.guidedStep);
  const guidedStepIndex = useImportStore((s) => s.guidedStepIndex);
  const guidedStepCount = useImportStore((s) => s.guidedStepCount);
  const setMethod = useImportStore((s) => s.setMethod);

  const currentIndex = guidedStepIndex();
  const totalSteps = guidedStepCount();

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => setMethod(null)}
        className="text-sm text-white/50 hover:text-white/80 transition-colors flex items-center gap-1.5 min-h-[44px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
        </svg>
        Back to method selection
      </button>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-white/40">
          <span>Step {currentIndex + 1} of {totalSteps}</span>
          <span>{STEP_LABELS[currentIndex]}</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500 rounded-full"
            initial={false}
            animate={{ width: `${((currentIndex + 1) / totalSteps) * 100}%` }}
            transition={spring}
          />
        </div>
        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 pt-1">
          {STEP_LABELS.map((label, i) => (
            <div
              key={label}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentIndex
                  ? "bg-blue-500"
                  : i < currentIndex
                    ? "bg-blue-500/40"
                    : "bg-white/15"
              }`}
              aria-label={`${label} ${i < currentIndex ? "(completed)" : i === currentIndex ? "(current)" : ""}`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={guidedStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={spring}
        >
          {guidedStep === "server-name" && <StepServerName />}
          {guidedStep === "family-safe" && <StepFamilySafe />}
          {guidedStep === "categories" && <StepCategories />}
          {guidedStep === "channels" && <StepChannels />}
          {guidedStep === "roles" && <StepRoles />}
          {guidedStep === "review" && <StepReview />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
