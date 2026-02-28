"use client";

import { useState } from "react";
import { UserPlus, Check, Loader2, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Modal } from "@/components/ui/modal/modal";
import { Button } from "@/components/ui/button/button";
import { MONITORING_LEVELS } from "@/lib/types/family";
import type { MonitoringLevel } from "@/lib/types/family";
import { useFamilyStore } from "@/store/family.store";

interface AddTeenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (username: string) => void;
}

const MONITORING_LEVEL_OPTIONS: { value: MonitoringLevel; label: string; description: string }[] = [
  { value: 1, label: "Minimal", description: "Basic visibility — servers and friends only" },
  { value: 2, label: "Moderate", description: "Activity stats and message counts" },
  { value: 3, label: "Supervised", description: "AI flags, server/friend approval required" },
  { value: 4, label: "Restricted", description: "Whitelist only, time limits, full logs" },
];

export function AddTeenModal({ isOpen, onClose, onSuccess }: AddTeenModalProps) {
  const selectedTeen = useFamilyStore((s) => s.getSelectedTeenAccount());
  const familyDefaultLevel = selectedTeen?.monitoringLevel ?? 1;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [dob, setDob] = useState("");
  const [monitoringLevel, setMonitoringLevel] = useState<MonitoringLevel>(familyDefaultLevel);
  const [coppaConsent, setCoppaConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdUsername, setCreatedUsername] = useState("");

  const maxDob = new Date().toISOString().split("T")[0];
  const minDob = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 17);
    return d.toISOString().split("T")[0];
  })();

  const isUnder13 = (() => {
    if (!dob) return false;
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age < 13;
  })();

  const handleClose = () => {
    if (isSubmitting) return;
    setUsername("");
    setPassword("");
    setConfirm("");
    setDob("");
    setMonitoringLevel(familyDefaultLevel);
    setCoppaConsent(false);
    setError(null);
    setSuccess(false);
    setCreatedUsername("");
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (!/^[a-z0-9_]+$/i.test(username.trim())) {
      setError("Username may only contain letters, numbers, and underscores");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (!dob) {
      setError("Date of birth is required for COPPA compliance");
      return;
    }
    if (!coppaConsent) {
      setError("You must confirm parental consent to create this account");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/family/add-teen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password,
          date_of_birth: dob,
          monitoring_level: monitoringLevel,
          coppa_consent: true,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setCreatedUsername(data.teen.username);
      setSuccess(true);
      setTimeout(() => {
        onSuccess(data.teen.username);
        handleClose();
      }, 2000);
    } catch {
      setError("Network error — please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  const levelInfo = MONITORING_LEVELS[monitoringLevel];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Teen Account"
      size="md"
      closeOnOverlay={!isSubmitting}
      closeOnEscape={!isSubmitting}
      footer={
        success ? undefined : (
          <>
            <Button variant="secondary" size="sm" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || !username || !password || !confirm || !dob || !coppaConsent}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Creating…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus size={14} />
                  Create Account
                </span>
              )}
            </Button>
          </>
        )
      }
    >
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 py-6"
          >
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check size={22} className="text-green-400" />
            </div>
            <p className="font-semibold text-green-400">@{createdUsername} created!</p>
            <p className="text-sm text-center text-white/60">
              Share the username and password with your teen so they can log in.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5"
          >
            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="teen-modal-username" className="text-sm font-medium text-slate-300">
                Username <span className="text-red-400">*</span>
              </label>
              <input
                id="teen-modal-username"
                type="text"
                autoComplete="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="coolteen123"
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
              />
              <p className="text-xs text-white/40">No email needed — teen logs in with username + password</p>
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="teen-modal-password" className="text-sm font-medium text-slate-300">
                  Password <span className="text-red-400">*</span>
                </label>
                <input
                  id="teen-modal-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="teen-modal-confirm" className="text-sm font-medium text-slate-300">
                  Confirm <span className="text-red-400">*</span>
                </label>
                <input
                  id="teen-modal-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Date of birth */}
            <div className="space-y-1.5">
              <label htmlFor="teen-modal-dob" className="text-sm font-medium text-slate-300">
                Date of Birth <span className="text-red-400">*</span>
              </label>
              <input
                id="teen-modal-dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={maxDob}
                min={minDob}
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
                style={{ colorScheme: "dark" }}
              />
              <p className="text-xs text-white/40 flex items-center gap-1">
                <Info size={11} />
                Required for COPPA compliance (children under 13 have stricter protections)
              </p>
              {isUnder13 && dob && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                  <p className="text-xs text-amber-400">
                    This child is under 13. Federal law (COPPA) applies — your consent below
                    serves as the required parental authorization.
                  </p>
                </div>
              )}
            </div>

            {/* Monitoring level */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">
                Monitoring Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MONITORING_LEVEL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMonitoringLevel(opt.value)}
                    disabled={isSubmitting}
                    className="flex items-start gap-2 p-2.5 rounded-lg border text-left transition-colors disabled:opacity-60"
                    style={{
                      borderColor:
                        monitoringLevel === opt.value
                          ? MONITORING_LEVELS[opt.value].color
                          : "rgba(255,255,255,0.1)",
                      backgroundColor:
                        monitoringLevel === opt.value
                          ? `${MONITORING_LEVELS[opt.value].color}20`
                          : "rgba(255,255,255,0.03)",
                    }}
                    aria-pressed={monitoringLevel === opt.value}
                  >
                    <span
                      className="w-2 h-2 rounded-full mt-1 shrink-0"
                      style={{ backgroundColor: MONITORING_LEVELS[opt.value].color }}
                    />
                    <div className="min-w-0">
                      <p
                        className="text-xs font-medium"
                        style={{
                          color:
                            monitoringLevel === opt.value
                              ? MONITORING_LEVELS[opt.value].color
                              : "rgba(255,255,255,0.8)",
                        }}
                      >
                        {opt.label}
                      </p>
                      <p className="text-xs text-white/40 mt-0.5 leading-snug">{opt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/40">
                Selected: <span style={{ color: levelInfo.color }}>{levelInfo.name}</span> —{" "}
                {levelInfo.description}
              </p>
            </div>

            {/* COPPA consent */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={coppaConsent}
                onChange={(e) => setCoppaConsent(e.target.checked)}
                disabled={isSubmitting}
                className="mt-0.5 w-4 h-4 accent-primary"
              />
              <span className="text-xs text-white/70 leading-relaxed">
                I confirm I am the parent or legal guardian of this child and provide my consent to
                create this account on their behalf. I understand my teen will always be able to see
                what I access in their Transparency Log. <span className="text-red-400">*</span>
              </span>
            </label>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
