"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mail, Loader2, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button/button";
import type { OTPInitiateResponse, OTPVerifyResponse } from "@/lib/types/otp";

type OTPStep = "email_entry" | "otp_sent" | "verifying" | "success" | "error";

interface ParentalConsentOTPProps {
  /** Called when consent is successfully verified */
  onVerified: (verificationId: string) => void;
  /** Called when user wants to go back */
  onCancel: () => void;
  /** Pre-fill context for the consent record */
  consentContext?: {
    monitoringLevel?: number;
    teenDisplayName?: string;
  };
  /** Disable interactions while parent form is submitting */
  disabled?: boolean;
}

const OTP_EXPIRY_SECONDS = 15 * 60; // 15 minutes
const RESEND_COOLDOWN_SECONDS = 60;

export function ParentalConsentOTP({
  onVerified,
  onCancel,
  consentContext,
  disabled = false,
}: ParentalConsentOTPProps) {
  const [step, setStep] = useState<OTPStep>("email_entry");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Countdown timers
  const [expirySeconds, setExpirySeconds] = useState(OTP_EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);
  const expiryRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const resendRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (expiryRef.current) clearInterval(expiryRef.current);
      if (resendRef.current) clearInterval(resendRef.current);
    };
  }, []);

  const startExpiryTimer = useCallback(() => {
    setExpirySeconds(OTP_EXPIRY_SECONDS);
    if (expiryRef.current) clearInterval(expiryRef.current);
    expiryRef.current = setInterval(() => {
      setExpirySeconds((prev) => {
        if (prev <= 1) {
          if (expiryRef.current) clearInterval(expiryRef.current);
          setStep("error");
          setError("Verification code expired. Please request a new one.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const startResendCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    if (resendRef.current) clearInterval(resendRef.current);
    resendRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (resendRef.current) clearInterval(resendRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleInitiate = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/family/consent/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentEmail: trimmedEmail,
          consentContext,
        }),
      });

      const data: OTPInitiateResponse = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? "Failed to send verification code");
        return;
      }

      setVerificationId(data.verificationId);
      setMaskedEmail(data.maskedEmail);
      setOtpCode("");
      setAttemptsRemaining(null);
      setStep("otp_sent");
      startExpiryTimer();
      startResendCooldown();

      // Auto-focus OTP input after animation
      setTimeout(() => otpInputRef.current?.focus(), 300);
    } catch {
      setError("Network error — please try again");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
      setError("Please enter the 6-digit code from your email");
      return;
    }

    setError(null);
    setIsLoading(true);
    setStep("verifying");

    try {
      const res = await fetch("/api/family/consent/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId,
          otpCode,
        }),
      });

      const data: OTPVerifyResponse = await res.json();

      if (!res.ok || !data.success) {
        if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining);
        }

        if (data.errorCode === "MAX_ATTEMPTS" || data.errorCode === "EXPIRED") {
          setStep("error");
          setError(data.error ?? "Verification failed");
          if (expiryRef.current) clearInterval(expiryRef.current);
        } else {
          setStep("otp_sent");
          setError(data.error ?? "Incorrect code");
          setTimeout(() => otpInputRef.current?.focus(), 100);
        }
        return;
      }

      // Success
      if (expiryRef.current) clearInterval(expiryRef.current);
      setStep("success");
      onVerified(data.consentId ?? verificationId);
    } catch {
      setStep("otp_sent");
      setError("Network error — please try again");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setStep("email_entry");
    setOtpCode("");
    setError(null);
    setAttemptsRemaining(null);
    if (expiryRef.current) clearInterval(expiryRef.current);
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {/* ── Email Entry ── */}
        {step === "email_entry" && (
          <motion.div
            key="email"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3">
              <p className="text-xs text-amber-300 leading-relaxed">
                <strong>COPPA Verification Required</strong> — Federal law requires
                us to verify your identity as a parent before creating a child&apos;s
                account. We&apos;ll send a 6-digit code to your email.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="consent-email" className="text-sm font-medium text-slate-300">
                Your Email Address <span className="text-red-400">*</span>
              </label>
              <input
                id="consent-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !disabled && !isLoading) handleInitiate();
                }}
                placeholder="parent@example.com"
                disabled={disabled || isLoading}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-hidden focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
              />
              <p className="text-xs text-white/40">
                We&apos;ll send a one-time verification code. No spam — ever.
              </p>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={onCancel}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleInitiate}
                disabled={disabled || isLoading || !email.trim()}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Sending…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Mail size={14} />
                    Send Verification Code
                  </span>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── OTP Entry ── */}
        {(step === "otp_sent" || step === "verifying") && (
          <motion.div
            key="otp"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="text-center space-y-1">
              <p className="text-sm text-slate-300">
                We sent a 6-digit code to <strong className="text-white">{maskedEmail}</strong>
              </p>
              <p className="text-xs text-white/40">
                Check your inbox (and spam folder). Code expires in{" "}
                <span className={expirySeconds < 120 ? "text-amber-400" : "text-white/60"}>
                  {formatTime(expirySeconds)}
                </span>
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="otp-input" className="text-sm font-medium text-slate-300">
                Verification Code
              </label>
              <input
                ref={otpInputRef}
                id="otp-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtpCode(val);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && otpCode.length === 6 && !isLoading) handleVerify();
                }}
                placeholder="000000"
                disabled={step === "verifying"}
                className="w-full px-3 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-center text-2xl font-mono tracking-[0.5em] outline-hidden focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
                aria-describedby="otp-status"
              />
            </div>

            {attemptsRemaining !== null && attemptsRemaining > 0 && (
              <p id="otp-status" className="text-xs text-amber-400 text-center">
                {attemptsRemaining} attempt{attemptsRemaining !== 1 ? "s" : ""} remaining
              </p>
            )}

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || step === "verifying"}
                className="text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline flex items-center gap-1"
              >
                <RefreshCw size={11} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
              </button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleVerify}
                disabled={otpCode.length !== 6 || step === "verifying"}
              >
                {step === "verifying" ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Verifying…
                  </span>
                ) : (
                  "Verify Code"
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Success ── */}
        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 py-4"
          >
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle size={22} className="text-green-400" />
            </div>
            <p className="font-semibold text-green-400">Parental consent verified</p>
            <p className="text-xs text-center text-white/50">
              A confirmation email has been sent to {maskedEmail}
            </p>
          </motion.div>
        )}

        {/* ── Error (terminal — must restart) ── */}
        {step === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle size={22} className="text-red-400" />
              </div>
              <p className="text-sm text-red-400 text-center">{error}</p>
            </div>
            <div className="flex justify-center">
              <Button variant="secondary" size="sm" onClick={handleResend}>
                Try Again
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
