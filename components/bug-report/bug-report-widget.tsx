"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/stores/toast-store";
import { useAuthStore } from "@/store/auth.store";
import { createClient } from "@/lib/supabase/client";

type Severity = "blocker" | "major" | "minor";
type Step = "consent" | "form";

const SEVERITY_OPTIONS: { value: Severity; label: string; desc: string; color: string }[] = [
  { value: "blocker", label: "Blocker", desc: "Can't use the app", color: "bg-red-500" },
  { value: "major", label: "Major", desc: "Feature broken but app works", color: "bg-yellow-500" },
  { value: "minor", label: "Minor", desc: "Cosmetic or small issue", color: "bg-blue-500" },
];

const APP_VERSION = "0.1.0";
const PRODUCT = "bedrock-chat";

export function BugReportWidget() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("consent");
  const [screenshot, setScreenshot] = useState<Blob | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Form state
  const [description, setDescription] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [consoleErrors, setConsoleErrors] = useState("");
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = useCallback(() => {
    setStep("consent");
    setScreenshot(null);
    setScreenshotPreview(null);
    setDescription("");
    setStepsToReproduce("");
    setConsoleErrors("");
    setSeverity(null);
    setIsAnonymous(false);
    setErrors({});
    setIsSubmitting(false);
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Delay reset so modal exit animation completes
    setTimeout(resetForm, 300);
  }, [resetForm]);

  const captureScreenshot = useCallback(async () => {
    setIsCapturing(true);
    // Temporarily hide the widget and modal for capture
    const widgetEl = document.getElementById("bug-report-widget");
    const modalEls = document.querySelectorAll("[role='dialog']");

    if (widgetEl) widgetEl.style.visibility = "hidden";
    modalEls.forEach((el) => {
      (el as HTMLElement).style.visibility = "hidden";
    });

    // Small delay to let the browser repaint
    await new Promise((r) => setTimeout(r, 100));

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 1,
        logging: false,
      });

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );

      if (blob) {
        setScreenshot(blob);
        setScreenshotPreview(URL.createObjectURL(blob));
      }
    } catch (err) {
      console.error("[BugReport] Screenshot capture failed:", err);
      toast.error("Screenshot failed", "Could not capture the screen. You can still submit without one.");
    } finally {
      // Restore visibility
      if (widgetEl) widgetEl.style.visibility = "visible";
      modalEls.forEach((el) => {
        (el as HTMLElement).style.visibility = "visible";
      });
      setIsCapturing(false);
      setStep("form");
    }
  }, []);

  const handleAllowScreenshot = useCallback(() => {
    captureScreenshot();
  }, [captureScreenshot]);

  const handleSkipScreenshot = useCallback(() => {
    setStep("form");
  }, []);

  const handleRemoveScreenshot = useCallback(() => {
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    setScreenshot(null);
    setScreenshotPreview(null);
  }, [screenshotPreview]);

  const handleRetakeScreenshot = useCallback(() => {
    handleRemoveScreenshot();
    // Close modal briefly for recapture
    setIsOpen(false);
    setTimeout(() => {
      setIsOpen(true);
      captureScreenshot();
    }, 200);
  }, [handleRemoveScreenshot, captureScreenshot]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!description.trim()) newErrors.description = "Please describe the bug";
    if (!stepsToReproduce.trim()) newErrors.steps = "Please describe what you were doing";
    if (!severity) newErrors.severity = "Please select a severity level";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [description, stepsToReproduce, severity]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("product", PRODUCT);
      formData.append("description", description.trim());
      formData.append("steps_to_reproduce", stepsToReproduce.trim());
      formData.append("severity", severity!);
      formData.append("app_version", APP_VERSION);
      formData.append("current_route", pathname || "/");
      formData.append("user_agent", navigator.userAgent);
      formData.append("viewport", `${window.innerWidth}x${window.innerHeight}`);

      if (consoleErrors.trim()) {
        formData.append("console_errors", consoleErrors.trim());
      }
      if (isAnonymous) {
        formData.append("anonymous", "true");
      }
      if (user?.id && !isAnonymous) {
        formData.append("username", user.username || user.displayName || "");
      }
      if (screenshot) {
        formData.append("screenshot", screenshot, "screenshot.png");
      }

      // Auth header required
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Not authenticated", "Please log in to submit a bug report.");
        return;
      }
      const headers: Record<string, string> = {
        Authorization: `Bearer ${session.access_token}`,
      };

      const response = await fetch("/api/bug-report", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Submission failed");
      }

      toast.success(
        "Bug report submitted",
        "Thank you for helping improve Bedrock Chat."
      );
      handleClose();
    } catch (err) {
      console.error("[BugReport] Submit failed:", err);
      toast.error(
        "Submission failed",
        "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, description, stepsToReproduce, severity, consoleErrors, isAnonymous, pathname, user, screenshot, handleClose]);

  // Only show for authenticated users
  if (!isAuthenticated) return null;

  return (
    <>
      {/* Floating bug report button */}
      <div id="bug-report-widget" className="fixed bottom-6 right-6 z-40">
        <div className="relative">
          {/* Tooltip */}
          <AnimatePresence>
            {showTooltip && !isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full right-0 mb-2 px-3 py-1.5 text-xs font-medium text-white bg-slate-800 rounded-lg whitespace-nowrap pointer-events-none"
              >
                Report a Bug
                <div className="absolute top-full right-4 -mt-px w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800" />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={handleOpen}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              "bg-slate-800/90 text-slate-300 border border-slate-700/50",
              "hover:bg-slate-700/90 hover:text-white hover:border-slate-600/50",
              "transition-colors duration-200",
              "focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-transparent",
              "shadow-lg"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Report a Bug"
          >
            {/* Bug/beetle icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2l1.88 1.88" />
              <path d="M14.12 3.88 16 2" />
              <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
              <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
              <path d="M12 20v-9" />
              <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
              <path d="M6 13H2" />
              <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
              <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
              <path d="M22 13h-4" />
              <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Bug report modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Report a Bug"
        size="md"
      >
        <AnimatePresence mode="wait">
          {step === "consent" && (
            <motion.div
              key="consent"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 py-2"
            >
              <div className="rounded-lg bg-slate-800/50 border border-slate-700/30 p-4">
                <p className="text-sm text-slate-300 leading-relaxed">
                  To help us understand the bug, we can capture a screenshot of your
                  current screen. This may include visible messages or content.
                  You can skip this step if you prefer.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={handleAllowScreenshot}
                  loading={isCapturing}
                  className="flex-1"
                >
                  Allow Screenshot
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleSkipScreenshot}
                  className="flex-1"
                >
                  Skip Screenshot
                </Button>
              </div>
            </motion.div>
          )}

          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 py-2"
            >
              {/* Screenshot preview */}
              {screenshotPreview && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200">
                    Screenshot
                  </label>
                  <div className="relative rounded-lg overflow-hidden border border-slate-700/30">
                    <img
                      src={screenshotPreview}
                      alt="Bug report screenshot"
                      className="w-full max-h-40 object-cover object-top"
                    />
                    <div className="absolute bottom-2 right-2 flex gap-2">
                      <button
                        type="button"
                        onClick={handleRetakeScreenshot}
                        className="px-2 py-1 text-xs font-medium rounded bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 transition-colors"
                      >
                        Retake
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveScreenshot}
                        className="px-2 py-1 text-xs font-medium rounded bg-red-900/80 text-red-200 hover:bg-red-800/80 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <Textarea
                id="bug-description"
                label="What went wrong?"
                placeholder="Describe what you experienced"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors((prev) => ({ ...prev, description: "" }));
                }}
                error={errors.description}
                rows={3}
                required
              />

              {/* Steps to reproduce */}
              <Textarea
                id="bug-steps"
                label="What were you doing before this happened?"
                placeholder="E.g., I clicked on the voice channel, then tried to send a message..."
                value={stepsToReproduce}
                onChange={(e) => {
                  setStepsToReproduce(e.target.value);
                  if (errors.steps) setErrors((prev) => ({ ...prev, steps: "" }));
                }}
                error={errors.steps}
                rows={3}
                required
              />

              {/* Console errors */}
              <Textarea
                id="bug-console-errors"
                label="Console errors (optional)"
                placeholder="Paste any error messages from the browser console here"
                value={consoleErrors}
                onChange={(e) => setConsoleErrors(e.target.value)}
                rows={3}
                className="font-mono text-xs"
              />

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  How much does this affect your experience?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SEVERITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSeverity(opt.value);
                        if (errors.severity) setErrors((prev) => ({ ...prev, severity: "" }));
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-lg border transition-all duration-200",
                        "focus:outline-hidden focus:ring-2 focus:ring-primary",
                        severity === opt.value
                          ? "border-primary bg-primary/10 text-white"
                          : "border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600/50 hover:text-slate-300"
                      )}
                    >
                      <span className={cn("w-2.5 h-2.5 rounded-full", opt.color)} />
                      <span className="text-sm font-medium">{opt.label}</span>
                      <span className="text-[10px] opacity-70">{opt.desc}</span>
                    </button>
                  ))}
                </div>
                {errors.severity && (
                  <motion.p
                    className="mt-1 text-sm text-red-500"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="alert"
                  >
                    {errors.severity}
                  </motion.p>
                )}
              </div>

              {/* Anonymous toggle */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={cn(
                    "w-9 h-5 rounded-full transition-colors duration-200",
                    "bg-slate-700 peer-checked:bg-primary",
                    "peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-slate-900"
                  )} />
                  <div className={cn(
                    "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200",
                    isAnonymous && "translate-x-4"
                  )} />
                </div>
                <div>
                  <span className="text-sm text-slate-200">Submit anonymously</span>
                  <p className="text-[11px] text-slate-500">Your identity will not be attached to this report</p>
                </div>
              </label>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  className="flex-1"
                >
                  Submit Bug Report
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>
    </>
  );
}
