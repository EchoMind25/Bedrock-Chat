"use client";

import { motion } from "motion/react";
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
import { useState } from "react";

interface ControlsBarProps {
  onLeave?: () => void;
  onSettingsOpen?: () => void;
  onScreenShare?: () => void;
}

const springConfig = {
  type: "spring" as const,
  stiffness: 260,
  damping: 20,
  mass: 1,
};

export function ControlsBar({
  onLeave,
  onSettingsOpen,
  onScreenShare,
}: ControlsBarProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (isDeafened) setIsDeafened(false);
  };

  const handleDeafenToggle = () => {
    const newDeafened = !isDeafened;
    setIsDeafened(newDeafened);
    if (newDeafened) setIsMuted(true);
  };

  const handleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    onScreenShare?.();
  };

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-40 p-4"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={springConfig}
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-4">
          <div className="flex items-center justify-center gap-3">
            {/* Mute/Unmute */}
            <ControlButton
              active={isMuted}
              activeColor="bg-red-500/90"
              inactiveColor="bg-white/10 hover:bg-white/20"
              onClick={handleMuteToggle}
              icon={isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              label={isMuted ? "Unmute" : "Mute"}
            />

            {/* Deafen */}
            <ControlButton
              active={isDeafened}
              activeColor="bg-red-500/90"
              inactiveColor="bg-white/10 hover:bg-white/20"
              onClick={handleDeafenToggle}
              icon={
                isDeafened ? (
                  <HeadphoneOff className="w-5 h-5" />
                ) : (
                  <Headphones className="w-5 h-5" />
                )
              }
              label={isDeafened ? "Undeafen" : "Deafen"}
            />

            {/* Screen Share */}
            <ControlButton
              active={isScreenSharing}
              activeColor="bg-green-500/90"
              inactiveColor="bg-white/10 hover:bg-white/20"
              onClick={handleScreenShare}
              icon={<MonitorUp className="w-5 h-5" />}
              label="Screen Share"
            />

            {/* Camera Toggle */}
            <ControlButton
              active={!isVideoOff}
              activeColor="bg-green-500/90"
              inactiveColor="bg-white/10 hover:bg-white/20"
              onClick={() => setIsVideoOff(!isVideoOff)}
              icon={
                isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />
              }
              label={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
            />

            {/* Divider */}
            <div className="w-px h-8 bg-white/10 mx-2" />

            {/* Settings */}
            <ControlButton
              active={false}
              inactiveColor="bg-white/10 hover:bg-white/20"
              onClick={onSettingsOpen}
              icon={<Settings className="w-5 h-5" />}
              label="Settings"
            />

            {/* Disconnect */}
            <ControlButton
              active={false}
              inactiveColor="bg-red-500/90 hover:bg-red-600/90"
              onClick={onLeave}
              icon={<PhoneOff className="w-5 h-5" />}
              label="Disconnect"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface ControlButtonProps {
  active: boolean;
  activeColor?: string;
  inactiveColor: string;
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
}

function ControlButton({
  active,
  activeColor,
  inactiveColor,
  onClick,
  icon,
  label,
}: ControlButtonProps) {
  return (
    <motion.button
      className={`relative p-4 rounded-xl text-white transition-colors group ${
        active && activeColor ? activeColor : inactiveColor
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={springConfig}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {icon}

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black/90 backdrop-blur-md rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
          <div className="border-4 border-transparent border-t-black/90" />
        </div>
      </div>

      {/* Active indicator */}
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
