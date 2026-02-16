"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal/modal";
import { toast } from "@/lib/stores/toast-store";
import type { ReportReason } from "@/lib/types/report";

interface ReportDialogProps {
  messageId: string;
  channelId: string;
  serverId: string;
  messageContent: string;
  messageAuthorId: string;
  isOpen: boolean;
  onClose: () => void;
}

const REASON_LABELS: Record<ReportReason, string> = {
  csam: "Child Sexual Abuse Material (CSAM)",
  harassment: "Harassment or Bullying",
  spam: "Spam",
  hate_speech: "Hate Speech",
  violence: "Violence or Threats",
  self_harm: "Self-Harm or Suicide",
  impersonation: "Impersonation",
  other: "Other",
};

const REASON_ORDER: ReportReason[] = [
  "csam",
  "harassment",
  "hate_speech",
  "violence",
  "self_harm",
  "spam",
  "impersonation",
  "other",
];

export function ReportDialog({
  messageId,
  channelId,
  serverId,
  messageContent,
  messageAuthorId,
  isOpen,
  onClose,
}: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_id: messageId,
          channel_id: channelId,
          server_id: serverId,
          reason,
          description,
          message_content_snapshot: messageContent,
          message_author_id: messageAuthorId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit report");
      }

      toast.success(
        "Report submitted",
        "Thank you. Our moderation team will review this report.",
      );
      handleClose();
    } catch (err) {
      toast.error(
        "Failed to submit report",
        err instanceof Error ? err.message : "Please try again later.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason(null);
    setDescription("");
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Report Message"
      description="Select a reason for reporting this message. Reports are confidential."
      size="md"
    >
      <div className="space-y-4">
        {/* Reason selection */}
        <fieldset>
          <legend className="text-sm font-medium text-slate-300 mb-2">
            Reason
          </legend>
          <div className="space-y-1.5">
            {REASON_ORDER.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  reason === r
                    ? "bg-primary/20 border border-primary/40"
                    : "hover:bg-white/5 border border-transparent"
                }`}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    reason === r
                      ? "border-primary bg-primary"
                      : "border-slate-500"
                  }`}
                >
                  {reason === r && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <span
                  className={`text-sm ${
                    r === "csam"
                      ? "text-red-400 font-medium"
                      : "text-slate-200"
                  }`}
                >
                  {REASON_LABELS[r]}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Description */}
        <div>
          <label
            htmlFor="report-description"
            className="block text-sm font-medium text-slate-300 mb-1.5"
          >
            Additional details (optional)
          </label>
          <textarea
            id="report-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide any context that may help our moderation team..."
            rows={3}
            maxLength={1000}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 resize-none focus:outline-hidden focus:border-primary/50 transition-colors"
          />
        </div>

        {/* CSAM notice */}
        {reason === "csam" && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
            <p className="text-xs text-red-300">
              CSAM reports are automatically escalated to our highest priority
              queue. As required by federal law (18 U.S.C. 2258A), confirmed
              CSAM is reported to NCMEC via the CyberTipline.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary hover:bg-primary/80 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
