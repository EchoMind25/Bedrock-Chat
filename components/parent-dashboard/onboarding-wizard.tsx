"use client";

import { useState } from "react";
import {
  Shield,
  Bell,
  Clock,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  SkipForward,
  Search,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MonitoringLevelSelector } from "./monitoring-level-selector";
import { PdCard } from "./pd-card";
import type { TeenAccount, MonitoringLevel } from "@/lib/types/family";

interface OnboardingWizardProps {
  onComplete: () => void;
  teenAccounts: TeenAccount[];
}

const TOTAL_STEPS = 5;

const stepMeta = [
  { icon: Shield, title: "Welcome" },
  { icon: Shield, title: "Monitoring" },
  { icon: Bell, title: "Alerts" },
  { icon: Clock, title: "Time Limits" },
  { icon: CheckCircle, title: "Review" },
];

interface WizardState {
  monitoringLevels: Record<string, MonitoringLevel>;
  keywords: string[];
  keywordSeverities: Record<string, "low" | "medium" | "high">;
  dailyLimitMinutes: number;
  timeLimitsEnabled: boolean;
}

export function OnboardingWizard({
  onComplete,
  teenAccounts,
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState<WizardState>(() => {
    const levels: Record<string, MonitoringLevel> = {};
    for (const teen of teenAccounts) {
      levels[teen.id] = teen.monitoringLevel;
    }
    return {
      monitoringLevels: levels,
      keywords: [],
      keywordSeverities: {},
      dailyLimitMinutes: 120,
      timeLimitsEnabled: false,
    };
  });
  const [newKeyword, setNewKeyword] = useState("");

  const canGoNext = currentStep < TOTAL_STEPS - 1;
  const canGoBack = currentStep > 0;
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const handleSkip = () => {
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const addKeyword = () => {
    const trimmed = newKeyword.trim();
    if (!trimmed || state.keywords.includes(trimmed)) return;
    setState((s) => ({
      ...s,
      keywords: [...s.keywords, trimmed],
      keywordSeverities: { ...s.keywordSeverities, [trimmed]: "medium" },
    }));
    setNewKeyword("");
  };

  const removeKeyword = (keyword: string) => {
    setState((s) => ({
      ...s,
      keywords: s.keywords.filter((k) => k !== keyword),
    }));
  };

  const progressPercent = ((currentStep + 1) / TOTAL_STEPS) * 100;

  return (
    <div
      className="mx-auto max-w-3xl"
      style={{ color: "var(--pd-text)" }}
    >
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          {stepMeta.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            return (
              <div
                key={step.title}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors"
                  style={{
                    background: isCompleted
                      ? "var(--pd-success)"
                      : isActive
                        ? "var(--pd-primary)"
                        : "var(--pd-bg-secondary)",
                    color: isCompleted || isActive
                      ? "white"
                      : "var(--pd-text-muted)",
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className="text-[11px] font-medium"
                  style={{
                    color: isActive
                      ? "var(--pd-primary)"
                      : "var(--pd-text-muted)",
                  }}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full"
          style={{ background: "var(--pd-bg-secondary)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: "var(--pd-primary)" }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Step 1: Welcome */}
          {currentStep === 0 && (
            <PdCard padding="lg">
              <div className="text-center">
                <div
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
                  style={{
                    background: "var(--pd-primary-light)",
                    color: "var(--pd-primary)",
                  }}
                >
                  <Shield className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold">
                  Welcome to the Parent Dashboard
                </h2>
                <p
                  className="mx-auto mt-3 max-w-lg text-base"
                  style={{ color: "var(--pd-text-secondary)" }}
                >
                  This dashboard helps you stay informed about your teen&apos;s
                  online activity while respecting their growing independence.
                  Every action you take here is logged transparently -- your
                  teen can always see what you&apos;ve accessed.
                </p>
                <div className="mt-8 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
                  {[
                    {
                      icon: Shield,
                      title: "Choose oversight level",
                      desc: "From minimal to supervised, pick what works for your family.",
                    },
                    {
                      icon: Bell,
                      title: "Set up alerts",
                      desc: "Get notified about specific keywords or concerning activity.",
                    },
                    {
                      icon: Clock,
                      title: "Manage screen time",
                      desc: "Optional daily limits and schedules to maintain balance.",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-lg p-4"
                      style={{ background: "var(--pd-bg-secondary)" }}
                    >
                      <item.icon
                        className="mb-2 h-5 w-5"
                        style={{ color: "var(--pd-primary)" }}
                      />
                      <h4 className="text-sm font-semibold">{item.title}</h4>
                      <p
                        className="mt-1 text-xs"
                        style={{ color: "var(--pd-text-muted)" }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </PdCard>
          )}

          {/* Step 2: Monitoring Level */}
          {currentStep === 1 && (
            <div>
              <h2
                className="mb-2 text-xl font-bold"
                style={{ color: "var(--pd-text)" }}
              >
                Choose Monitoring Level
              </h2>
              <p
                className="mb-6 text-sm"
                style={{ color: "var(--pd-text-muted)" }}
              >
                Set an appropriate level for each teen. You can change this
                anytime.
              </p>
              <div className="space-y-6">
                {teenAccounts.map((teen) => (
                  <div key={teen.id}>
                    <h3
                      className="mb-3 text-base font-semibold"
                      style={{ color: "var(--pd-text)" }}
                    >
                      {teen.user.displayName}
                    </h3>
                    <MonitoringLevelSelector
                      currentLevel={
                        state.monitoringLevels[teen.id] || teen.monitoringLevel
                      }
                      onLevelChange={(level) =>
                        setState((s) => ({
                          ...s,
                          monitoringLevels: {
                            ...s.monitoringLevels,
                            [teen.id]: level,
                          },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Keyword Alerts */}
          {currentStep === 2 && (
            <PdCard padding="lg">
              <h2
                className="mb-2 text-xl font-bold"
                style={{ color: "var(--pd-text)" }}
              >
                Keyword Alerts (Optional)
              </h2>
              <p
                className="mb-6 text-sm"
                style={{ color: "var(--pd-text-muted)" }}
              >
                Get notified when specific words or phrases appear. This is
                optional and can be configured later.
              </p>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: "var(--pd-text-muted)" }}
                  />
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                    placeholder="Enter a keyword..."
                    className="w-full rounded-lg py-2.5 pl-10 pr-3 text-sm"
                    style={{
                      border: "1px solid var(--pd-border)",
                      background: "var(--pd-surface)",
                      color: "var(--pd-text)",
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={addKeyword}
                  disabled={!newKeyword.trim()}
                  className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: "var(--pd-primary)" }}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>

              {state.keywords.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {state.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm"
                      style={{
                        background: "var(--pd-primary-light)",
                        color: "var(--pd-primary)",
                      }}
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeKeyword(keyword)}
                        className="ml-1 rounded-full p-0.5 transition-colors hover:bg-white/20"
                        aria-label={`Remove ${keyword}`}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {state.keywords.length === 0 && (
                <p
                  className="mt-6 text-center text-sm"
                  style={{ color: "var(--pd-text-muted)" }}
                >
                  No keywords added yet. You can skip this step and configure
                  alerts later.
                </p>
              )}
            </PdCard>
          )}

          {/* Step 4: Time Limits */}
          {currentStep === 3 && (
            <PdCard padding="lg">
              <h2
                className="mb-2 text-xl font-bold"
                style={{ color: "var(--pd-text)" }}
              >
                Time Limits (Optional)
              </h2>
              <p
                className="mb-6 text-sm"
                style={{ color: "var(--pd-text-muted)" }}
              >
                Set daily usage limits. This is optional and can be configured
                later.
              </p>

              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-medium">Enable time limits</span>
                <button
                  type="button"
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      timeLimitsEnabled: !s.timeLimitsEnabled,
                    }))
                  }
                  className="relative h-6 w-11 rounded-full transition-colors"
                  style={{
                    background: state.timeLimitsEnabled
                      ? "var(--pd-primary)"
                      : "var(--pd-border)",
                  }}
                  aria-label="Toggle time limits"
                >
                  <span
                    className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-transform"
                    style={{
                      transform: state.timeLimitsEnabled
                        ? "translateX(20px)"
                        : "translateX(0)",
                    }}
                  />
                </button>
              </div>

              {state.timeLimitsEnabled && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">
                      Daily Limit
                    </label>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--pd-primary)" }}
                    >
                      {Math.floor(state.dailyLimitMinutes / 60)}h{" "}
                      {state.dailyLimitMinutes % 60 > 0
                        ? `${state.dailyLimitMinutes % 60}m`
                        : ""}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={1440}
                    step={15}
                    value={state.dailyLimitMinutes}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        dailyLimitMinutes: parseInt(e.target.value),
                      }))
                    }
                    className="w-full accent-(--pd-primary)"
                  />
                  <div
                    className="flex justify-between text-xs mt-1"
                    style={{ color: "var(--pd-text-muted)" }}
                  >
                    <span>15 min</span>
                    <span>24h</span>
                  </div>
                </div>
              )}

              {!state.timeLimitsEnabled && (
                <p
                  className="text-center text-sm"
                  style={{ color: "var(--pd-text-muted)" }}
                >
                  Time limits are disabled. You can skip this step and set them
                  up later in the dashboard settings.
                </p>
              )}
            </PdCard>
          )}

          {/* Step 5: Review & Confirm */}
          {currentStep === 4 && (
            <PdCard padding="lg">
              <div className="text-center mb-6">
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                  style={{
                    background: "var(--pd-success-light)",
                    color: "var(--pd-success)",
                  }}
                >
                  <CheckCircle className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-bold">Review Your Settings</h2>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--pd-text-muted)" }}
                >
                  Here is a summary of your configuration. You can always adjust
                  these in the dashboard.
                </p>
              </div>

              <div className="space-y-4">
                {/* Monitoring Levels Summary */}
                <div
                  className="rounded-lg p-4"
                  style={{ background: "var(--pd-bg-secondary)" }}
                >
                  <h4 className="mb-2 text-sm font-semibold">
                    Monitoring Levels
                  </h4>
                  {teenAccounts.map((teen) => {
                    const level =
                      state.monitoringLevels[teen.id] || teen.monitoringLevel;
                    return (
                      <div
                        key={teen.id}
                        className="flex items-center justify-between py-1"
                      >
                        <span className="text-sm">
                          {teen.user.displayName}
                        </span>
                        <span
                          className="text-sm font-medium"
                          style={{ color: "var(--pd-primary)" }}
                        >
                          Level {level}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Keywords Summary */}
                <div
                  className="rounded-lg p-4"
                  style={{ background: "var(--pd-bg-secondary)" }}
                >
                  <h4 className="mb-2 text-sm font-semibold">
                    Keyword Alerts
                  </h4>
                  {state.keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {state.keywords.map((k) => (
                        <span
                          key={k}
                          className="rounded-full px-2 py-0.5 text-xs"
                          style={{
                            background: "var(--pd-primary-light)",
                            color: "var(--pd-primary)",
                          }}
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p
                      className="text-sm"
                      style={{ color: "var(--pd-text-muted)" }}
                    >
                      None configured
                    </p>
                  )}
                </div>

                {/* Time Limits Summary */}
                <div
                  className="rounded-lg p-4"
                  style={{ background: "var(--pd-bg-secondary)" }}
                >
                  <h4 className="mb-2 text-sm font-semibold">Time Limits</h4>
                  {state.timeLimitsEnabled ? (
                    <p className="text-sm">
                      Daily limit:{" "}
                      <span
                        className="font-medium"
                        style={{ color: "var(--pd-primary)" }}
                      >
                        {Math.floor(state.dailyLimitMinutes / 60)}h
                        {state.dailyLimitMinutes % 60 > 0
                          ? ` ${state.dailyLimitMinutes % 60}m`
                          : ""}
                      </span>
                    </p>
                  ) : (
                    <p
                      className="text-sm"
                      style={{ color: "var(--pd-text-muted)" }}
                    >
                      Not enabled
                    </p>
                  )}
                </div>
              </div>
            </PdCard>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="mt-6 flex items-center justify-between">
        <div>
          {canGoBack && (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                border: "1px solid var(--pd-border)",
                color: "var(--pd-text)",
                background: "var(--pd-surface)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--pd-bg-secondary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--pd-surface)";
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {canGoNext && (currentStep === 2 || currentStep === 3) && (
            <button
              type="button"
              onClick={handleSkip}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
              style={{ color: "var(--pd-text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--pd-text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--pd-text-muted)";
              }}
            >
              Skip
              <SkipForward className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors"
            style={{ background: "var(--pd-primary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--pd-primary-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--pd-primary)";
            }}
          >
            {isLastStep ? (
              <>
                Complete Setup
                <CheckCircle className="h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export type { OnboardingWizardProps };
