"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth.store";
import { Glass } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  ChevronRight,
  Hash,
  Shield,
  Sparkles,
  Users,
  X,
} from "lucide-react";

interface WelcomeScreenProps {
  serverId: string;
  onComplete: () => void;
}

interface WelcomeData {
  id: string;
  title: string;
  description: string;
  featured_channels: { id: string; name: string; description: string }[];
  onboarding_steps: { key: string; label: string; description: string }[];
  require_rules_acceptance: boolean;
  rules_text: string | null;
  selectable_roles: string[];
}

interface OnboardingProgress {
  completed: boolean;
  completed_steps: string[];
  accepted_rules: boolean;
  selected_roles: string[];
}

interface ServerRole {
  id: string;
  name: string;
  color: string | null;
}

const stepTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

export function WelcomeScreen({ serverId, onComplete }: WelcomeScreenProps) {
  const userId = useAuthStore((s) => s.user?.id);

  const [welcomeData, setWelcomeData] = useState<WelcomeData | null>(null);
  const [roles, setRoles] = useState<ServerRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load welcome screen data and onboarding progress
  useEffect(() => {
    if (!serverId || !userId) return;

    let cancelled = false;

    async function load() {
      const supabase = createClient();

      // Load welcome screen config
      const { data: welcomeRow } = await supabase
        .from("server_welcome_screens")
        .select("*")
        .eq("server_id", serverId)
        .single();

      if (cancelled) return;

      if (!welcomeRow) {
        onComplete();
        return;
      }

      // Load onboarding progress
      const { data: progressRow } = await supabase
        .from("server_onboarding_progress")
        .select("*")
        .eq("server_id", serverId)
        .eq("user_id", userId)
        .single();

      if (cancelled) return;

      if (progressRow?.completed) {
        onComplete();
        return;
      }

      const welcome = welcomeRow as unknown as WelcomeData;

      // Load role names for selectable_roles
      if (welcome.selectable_roles?.length > 0) {
        const { data: roleRows } = await supabase
          .from("server_roles")
          .select("id, name, color")
          .in("id", welcome.selectable_roles)
          .eq("server_id", serverId);

        if (!cancelled && roleRows) {
          setRoles(roleRows as ServerRole[]);
        }
      }

      if (!cancelled) {
        setWelcomeData(welcome);
        if (progressRow) {
          const p = progressRow as unknown as OnboardingProgress;
          setCompletedSteps(new Set(p.completed_steps || []));
          setRulesAccepted(p.accepted_rules || false);
          setSelectedRoles(new Set(p.selected_roles || []));
        }
        setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId, userId]);

  const totalSteps = useMemo(() => {
    if (!welcomeData) return 0;
    let count = 1; // Welcome step is always first
    if (welcomeData.featured_channels.length > 0) count++;
    if (welcomeData.onboarding_steps.length > 0)
      count += welcomeData.onboarding_steps.length;
    if (welcomeData.require_rules_acceptance) count++;
    if (welcomeData.selectable_roles.length > 0) count++;
    return count;
  }, [welcomeData]);

  const progressPercent = useMemo(() => {
    if (totalSteps === 0) return 0;
    return Math.round(((currentStep + 1) / totalSteps) * 100);
  }, [currentStep, totalSteps]);

  const handleToggleRole = (roleId: string) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  };

  const handleComplete = async () => {
    if (!userId || !serverId) return;
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const payload = {
        server_id: serverId,
        user_id: userId,
        completed: true,
        completed_steps: Array.from(completedSteps),
        accepted_rules: rulesAccepted,
        selected_roles: Array.from(selectedRoles),
        completed_at: new Date().toISOString(),
      };

      await supabase
        .from("server_onboarding_progress")
        .upsert(payload, { onConflict: "server_id,user_id" });

      // Apply selected roles
      if (selectedRoles.size > 0) {
        const roleAssignments = Array.from(selectedRoles).map((roleId) => ({
          server_id: serverId,
          user_id: userId,
          role_id: roleId,
        }));
        await supabase
          .from("server_member_roles")
          .upsert(roleAssignments, {
            onConflict: "server_id,user_id,role_id",
          });
      }

      onComplete();
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      const stepKey = `step-${currentStep}`;
      setCompletedSteps((prev) => new Set([...prev, stepKey]));
      setCurrentStep((s) => s + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  // Determine which step index corresponds to which content
  const renderStepContent = () => {
    if (!welcomeData) return null;

    let stepIndex = 0;

    // Step 0: Welcome intro
    if (currentStep === stepIndex) {
      return (
        <motion.div
          key="welcome-intro"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={stepTransition}
          className="flex flex-col items-center text-center gap-6"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, ...stepTransition }}
          >
            <Sparkles className="w-16 h-16 text-primary" />
          </motion.div>
          <h2 className="text-3xl font-bold text-foreground">
            {welcomeData.title}
          </h2>
          <p className="text-foreground-secondary max-w-md text-lg leading-relaxed">
            {welcomeData.description}
          </p>
        </motion.div>
      );
    }
    stepIndex++;

    // Featured channels step
    if (welcomeData.featured_channels.length > 0) {
      if (currentStep === stepIndex) {
        return (
          <motion.div
            key="featured-channels"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={stepTransition}
            className="flex flex-col gap-4 w-full max-w-lg"
          >
            <h3 className="text-xl font-semibold text-foreground text-center mb-2">
              Channels to explore
            </h3>
            <div className="grid gap-3">
              {welcomeData.featured_channels.map((ch) => (
                <Glass
                  key={ch.id}
                  variant="light"
                  border="light"
                  className="p-4 cursor-pointer hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Hash className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{ch.name}</p>
                      <p className="text-sm text-foreground-secondary truncate">
                        {ch.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-foreground-secondary shrink-0 ml-auto mt-0.5" />
                  </div>
                </Glass>
              ))}
            </div>
          </motion.div>
        );
      }
      stepIndex++;
    }

    // Individual onboarding steps
    for (const step of welcomeData.onboarding_steps) {
      if (currentStep === stepIndex) {
        return (
          <motion.div
            key={`onboarding-${step.key}`}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={stepTransition}
            className="flex flex-col items-center text-center gap-4 max-w-md"
          >
            <CheckCircle className="w-12 h-12 text-primary" />
            <h3 className="text-xl font-semibold text-foreground">
              {step.label}
            </h3>
            <p className="text-foreground-secondary leading-relaxed">
              {step.description}
            </p>
          </motion.div>
        );
      }
      stepIndex++;
    }

    // Rules acceptance step
    if (welcomeData.require_rules_acceptance) {
      if (currentStep === stepIndex) {
        return (
          <motion.div
            key="rules"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={stepTransition}
            className="flex flex-col gap-4 w-full max-w-lg"
          >
            <div className="flex items-center gap-3 justify-center mb-2">
              <Shield className="w-8 h-8 text-primary" />
              <h3 className="text-xl font-semibold text-foreground">
                Server Rules
              </h3>
            </div>
            {welcomeData.rules_text && (
              <Glass
                variant="light"
                border="light"
                className="p-4 max-h-60 overflow-y-auto scrollbar-thin"
              >
                <p className="text-sm text-foreground-secondary whitespace-pre-wrap leading-relaxed">
                  {welcomeData.rules_text}
                </p>
              </Glass>
            )}
            <label className="flex items-center gap-3 cursor-pointer select-none mt-2">
              <input
                type="checkbox"
                checked={rulesAccepted}
                onChange={(e) => setRulesAccepted(e.target.checked)}
                className="w-5 h-5 rounded border-border accent-primary shrink-0"
              />
              <span className="text-foreground text-sm">
                I have read and agree to the server rules
              </span>
            </label>
          </motion.div>
        );
      }
      stepIndex++;
    }

    // Role selection step
    if (welcomeData.selectable_roles.length > 0) {
      if (currentStep === stepIndex) {
        return (
          <motion.div
            key="roles"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={stepTransition}
            className="flex flex-col gap-4 w-full max-w-lg"
          >
            <div className="flex items-center gap-3 justify-center mb-2">
              <Users className="w-8 h-8 text-primary" />
              <h3 className="text-xl font-semibold text-foreground">
                Pick your roles
              </h3>
            </div>
            <p className="text-foreground-secondary text-center text-sm">
              Select roles that match your interests
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {roles.map((role) => {
                const isSelected = selectedRoles.has(role.id);
                return (
                  <motion.button
                    key={role.id}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggleRole(role.id)}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium
                      transition-colors border
                      ${
                        isSelected
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-white/5 border-border/30 text-foreground-secondary hover:border-border/60"
                      }
                    `}
                    style={
                      role.color && isSelected
                        ? { borderColor: role.color, color: role.color }
                        : undefined
                    }
                  >
                    {role.name}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        );
      }
    }

    return null;
  };

  // Determine if "Next" should be disabled
  const isNextDisabled = useMemo(() => {
    if (!welcomeData) return true;

    // Calculate which step index the rules step is at
    let rulesStepIndex = 1;
    if (welcomeData.featured_channels.length > 0) rulesStepIndex++;
    rulesStepIndex += welcomeData.onboarding_steps.length;

    if (
      welcomeData.require_rules_acceptance &&
      currentStep === rulesStepIndex &&
      !rulesAccepted
    ) {
      return true;
    }

    return false;
  }, [welcomeData, currentStep, rulesAccepted]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background-dark/80 backdrop-blur-md"
      >
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </motion.div>
    );
  }

  if (!welcomeData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background-dark/80 backdrop-blur-md p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={stepTransition}
          className="relative w-full max-w-2xl"
        >
          <Glass
            variant="strong"
            border="medium"
            className="rounded-2xl p-8 overflow-hidden"
          >
            {/* Close / Skip button */}
            <button
              type="button"
              onClick={onComplete}
              className="absolute top-4 right-4 p-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-white/10 transition-colors"
              aria-label="Skip onboarding"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs text-foreground-secondary mb-2">
                <span>
                  Step {currentStep + 1} of {totalSteps}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                />
              </div>
            </div>

            {/* Step content */}
            <div className="min-h-[280px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/20">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={currentStep === 0}
                className={
                  currentStep === 0 ? "opacity-0 pointer-events-none" : ""
                }
              >
                Back
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleNext}
                disabled={isNextDisabled || isSubmitting}
                loading={isSubmitting}
              >
                {currentStep === totalSteps - 1 ? "Complete" : "Next"}
              </Button>
            </div>
          </Glass>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
