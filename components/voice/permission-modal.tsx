"use client";

import { Modal } from "../ui/modal/modal";
import { Button } from "../ui/button";
import { Mic, Camera, Shield, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

interface PermissionModalProps {
  type: "mic" | "camera";
  onAllow: () => void;
  onDeny: () => void;
}

export function PermissionModal({ type, onAllow, onDeny }: PermissionModalProps) {
  const accountType = useAuthStore((s) => s.user?.accountType);
  const isTeen = accountType === "teen";

  const isMic = type === "mic";
  const Icon = isMic ? Mic : Camera;
  const title = isMic ? "Microphone Access" : "Camera Access";
  const description = isMic
    ? "Voice chat requires microphone access to communicate with other participants."
    : "Enable your camera to share video with other participants in the voice channel.";

  return (
    <Modal
      isOpen={true}
      onClose={onDeny}
      title={title}
      size="sm"
      closeOnOverlay={false}
      footer={
        <div className="flex gap-3 w-full">
          <Button variant="ghost" onClick={onDeny} className="flex-1">
            Deny
          </Button>
          <Button variant="primary" onClick={onAllow} className="flex-1">
            Allow Access
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-4 rounded-2xl bg-[oklch(0.55_0.2_265/0.15)] border border-[oklch(0.55_0.2_265/0.2)]">
            <Icon className="w-8 h-8 text-[oklch(0.7_0.2_265)]" />
          </div>
        </div>

        {/* Explanation */}
        <p className="text-sm text-slate-300 text-center">{description}</p>

        {/* Privacy disclosure */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-[oklch(0.7_0.2_145/0.08)] border border-[oklch(0.7_0.2_145/0.15)]">
          <Shield className="w-4 h-4 text-[oklch(0.7_0.2_145)] shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300">
            We only log connection times and participant lists, never audio or
            video content. Your {isMic ? "voice" : "video"} stays between
            participants and is not recorded or stored.
          </p>
        </div>

        {/* COPPA notice for teen accounts */}
        {isTeen && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[oklch(0.8_0.15_80/0.1)] border border-[oklch(0.8_0.15_80/0.2)]">
            <AlertTriangle className="w-4 h-4 text-[oklch(0.8_0.15_80)] shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300">
              If you&apos;re under 13, please ask a parent or guardian before
              proceeding.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
