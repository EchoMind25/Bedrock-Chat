"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ChevronDown, ChevronUp, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { toast } from "@/lib/stores/toast-store";

/**
 * Shown in Settings → Account for standard accounts (18+).
 * Guides the user through converting their account to a parent account.
 */
export function ConvertToParentCard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  const [isExpanded, setIsExpanded] = useState(false);
  const [dob, setDob] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Only show for standard accounts
  if (!user || user.accountType !== "standard") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!dob) {
      setError("Please enter your date of birth");
      return;
    }
    if (!agreed) {
      setError("Please confirm that you agree to the terms");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/family/convert-to-parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date_of_birth: dob }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setSuccess(true);
      // Refresh auth store so accountType updates everywhere
      await checkAuth();
      toast.success("Family Account Created", "Redirecting to your family dashboard…");
      setTimeout(() => router.push("/parent-dashboard/onboarding"), 1500);
    } catch {
      setError("Network error — please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  const maxDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split("T")[0];
  })();

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check size={18} className="text-green-400" />
        </div>
        <p className="text-sm font-medium text-green-400">Family account activated!</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="convert-parent-form"
      >
        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <Shield size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">Set Up a Family Account</p>
          <p className="text-xs text-white/50 mt-0.5">
            Monitor and protect your teen&apos;s experience — with full transparency
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp size={16} className="text-white/40 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-white/40 shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id="convert-parent-form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-5 pt-1 space-y-4 border-t border-white/10">
              {/* What you can do */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-white/60 uppercase tracking-wide">
                  As a parent account you can:
                </p>
                <ul className="space-y-1">
                  {[
                    "Add teen accounts for your family",
                    "Choose a monitoring level (your teen always sees which level)",
                    "View activity summaries and optionally message history",
                    "Approve server joins and friend requests (at higher levels)",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-white/70">
                      <Check size={12} className="text-primary shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Transparency promise */}
              <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-2.5">
                <p className="text-xs text-primary/90 leading-relaxed">
                  <strong>Transparency first:</strong> Your teen will always see when and what
                  you access in their Transparency Log. No hidden surveillance.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  id="parent-dob"
                  type="date"
                  label="Your date of birth"
                  labelClassName="text-slate-300"
                  max={maxDate}
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  disabled={isSubmitting}
                  helperText="We need to verify you're 18 or older"
                />

                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    disabled={isSubmitting}
                    className="mt-0.5 w-4 h-4 accent-primary"
                  />
                  <span className="text-xs text-white/70 leading-relaxed">
                    I am 18 or older and agree to the{" "}
                    <span className="text-primary">Terms of Service</span>. I understand that my
                    teen will see all monitoring activity in their Transparency Log.
                  </span>
                </label>

                {error && (
                  <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting || !dob || !agreed}
                  className="w-full"
                >
                  {isSubmitting ? "Setting up…" : "Activate Family Account"}
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
