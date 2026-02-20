"use client";

import { Modal } from "../ui/modal/modal";
import { Button } from "../ui/button";
import { MonitorUp, Shield } from "lucide-react";

interface ScreenShareConsentModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ScreenShareConsentModal({
  isOpen,
  onConfirm,
  onCancel,
}: ScreenShareConsentModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="You're about to share your screen"
      size="sm"
      closeOnOverlay={false}
      footer={
        <div className="flex gap-3 w-full">
          <Button variant="ghost" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm} className="flex-1">
            Share Screen
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="p-4 rounded-2xl bg-[oklch(0.55_0.2_265/0.15)] border border-[oklch(0.55_0.2_265/0.2)]">
            <MonitorUp className="w-8 h-8 text-[oklch(0.7_0.2_265)]" />
          </div>
        </div>

        <p className="text-sm text-slate-300 text-center">
          Everyone in this channel will be able to see your screen. Make sure
          you don&apos;t have personal information visible.
        </p>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-[oklch(0.7_0.2_145/0.08)] border border-[oklch(0.7_0.2_145/0.15)]">
          <Shield className="w-4 h-4 text-[oklch(0.7_0.2_145)] shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300">
            Screen sharing is not recorded or stored. Only participants
            currently in the channel can see your screen.
          </p>
        </div>
      </div>
    </Modal>
  );
}
