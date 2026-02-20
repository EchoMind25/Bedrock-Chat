"use client";

import { motion } from "motion/react";
import { useState } from "react";
import {
  Mic,
  MicOff,
  Headphones,
  HeadphoneOff,
  MonitorUp,
  Video,
  VideoOff,
  Settings,
  PhoneOff,
} from "lucide-react";
import { useVoiceStore } from "@/store/voice.store";
import { ScreenShareConsentModal } from "./screen-share-consent-modal";

interface ControlsBarProps {
  onLeave?: () => void;
  onSettingsOpen?: () => void;
}

const springConfig = {
  type: "spring" as const,
  stiffness: 260,
  damping: 20,
  mass: 1,
};

export function ControlsBar({ onLeave, onSettingsOpen }: ControlsBarProps) {
  const [showScreenShareConsent, setShowScreenShareConsent] = useState(false);

  const isMuted = useVoiceStore((s) => s.isMuted);
  const isDeafened = useVoiceStore((s) => s.isDeafened);
  const isVideoOn = useVoiceStore((s) => s.isVideoOn);
  const isScreenSharing = useVoiceStore((s) => s.isScreenSharing);
  const connectionStatus = useVoiceStore((s) => s.connectionStatus);
  const capabilities = useVoiceStore((s) => s.capabilities);
  const setMuted = useVoiceStore((s) => s.setMuted);
  const setDeafened = useVoiceStore((s) => s.setDeafened);
  const setVideoOn = useVoiceStore((s) => s.setVideoOn);
  const setScreenSharing = useVoiceStore((s) => s.setScreenSharing);
  const setPermissionStep = useVoiceStore((s) => s.setPermissionStep);

  const isDisabled = connectionStatus !== "connected";

  const handleMuteToggle = () => {
    setMuted(!isMuted);
    if (isDeafened) setDeafened(false);
  };

  const handleDeafenToggle = () => {
    const newDeafened = !isDeafened;
    setDeafened(newDeafened);
    if (newDeafened) setMuted(true);
  };

  const handleScreenShare = () => {
    if (isScreenSharing) {
      setScreenSharing(false);
    } else {
      setShowScreenShareConsent(true);
    }
  };

  const handleScreenShareConfirm = () => {
    setShowScreenShareConsent(false);
    setScreenSharing(true);
  };

  const handleVideoToggle = () => {
    if (!isVideoOn) {
      setPermissionStep("camera");
      return;
    }
    setVideoOn(false);
  };

  return (
    <>
      <motion.div
        className="shrink-0 p-4"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={springConfig}
      >
        <div className="max-w-4xl mx-auto">
          <div className="liquid-glass rounded-2xl border border-white/10 shadow-2xl p-4">
            <div className="flex items-center justify-center gap-3">
              <ControlButton
                active={isMuted}
                activeColor="bg-red-500/90"
                inactiveColor="glass-interactive"
                onClick={handleMuteToggle}
                disabled={isDisabled}
                icon={
                  isMuted ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )
                }
                label={isMuted ? "Unmute" : "Mute"}
              />

              <ControlButton
                active={isDeafened}
                activeColor="bg-red-500/90"
                inactiveColor="glass-interactive"
                onClick={handleDeafenToggle}
                disabled={isDisabled}
                icon={
                  isDeafened ? (
                    <HeadphoneOff className="w-5 h-5" />
                  ) : (
                    <Headphones className="w-5 h-5" />
                  )
                }
                label={isDeafened ? "Undeafen" : "Deafen"}
              />

              {capabilities.screen_share && (
                <ControlButton
                  active={isScreenSharing}
                  activeColor="bg-linear-to-r from-[oklch(0.55_0.2_265)] to-[oklch(0.5_0.15_300)]"
                  inactiveColor="glass-interactive"
                  onClick={handleScreenShare}
                  disabled={isDisabled}
                  icon={<MonitorUp className="w-5 h-5" />}
                  label="Screen Share"
                />
              )}

              {capabilities.video && (
                <ControlButton
                  active={isVideoOn}
                  activeColor="bg-linear-to-r from-[oklch(0.55_0.2_265)] to-[oklch(0.5_0.15_300)]"
                  inactiveColor="glass-interactive"
                  onClick={handleVideoToggle}
                  disabled={isDisabled}
                  icon={
                    isVideoOn ? (
                      <Video className="w-5 h-5" />
                    ) : (
                      <VideoOff className="w-5 h-5" />
                    )
                  }
                  label={isVideoOn ? "Turn Off Camera" : "Turn On Camera"}
                />
              )}

              <div className="w-px h-8 bg-white/10 mx-2" />

              <ControlButton
                active={false}
                inactiveColor="glass-interactive"
                onClick={onSettingsOpen}
                disabled={isDisabled}
                icon={<Settings className="w-5 h-5" />}
                label="Settings"
              />

              <ControlButton
                active={false}
                inactiveColor="bg-red-500/90 hover:bg-red-600/90"
                onClick={onLeave}
                disabled={false}
                icon={<PhoneOff className="w-5 h-5" />}
                label="Disconnect"
              />
            </div>
          </div>
        </div>
      </motion.div>

      <ScreenShareConsentModal
        isOpen={showScreenShareConsent}
        onConfirm={handleScreenShareConfirm}
        onCancel={() => setShowScreenShareConsent(false)}
      />
    </>
  );
}

interface ControlButtonProps {
  active: boolean;
  activeColor?: string;
  inactiveColor: string;
  onClick?: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
}

function ControlButton({
  active,
  activeColor,
  inactiveColor,
  onClick,
  disabled = false,
  icon,
  label,
}: ControlButtonProps) {
  return (
    <motion.button
      className={`relative p-4 rounded-xl text-white transition-colors group ${
        active && activeColor ? activeColor : inactiveColor
      } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      whileHover={disabled ? undefined : { scale: 1.05 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={springConfig}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {icon}

      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black/90 backdrop-blur-md rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
          <div className="border-4 border-transparent border-t-black/90" />
        </div>
      </div>

      {active && (
        <motion.div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={springConfig}
        />
      )}
    </motion.button>
  );
}
