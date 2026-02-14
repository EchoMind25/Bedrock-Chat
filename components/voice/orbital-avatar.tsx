"use client";

import { motion } from "motion/react";
import { MicOff, Video } from "lucide-react";
import { Avatar } from "../ui/avatar";
import { cn } from "@/lib/utils/cn";
import type { VoiceParticipant } from "@/store/voice.store";

interface OrbitalAvatarProps {
  participant: VoiceParticipant;
  isCenter: boolean;
}

const springConfig = {
  type: "spring" as const,
  stiffness: 260,
  damping: 20,
  mass: 1,
};

export function OrbitalAvatar({ participant, isCenter }: OrbitalAvatarProps) {
  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: isCenter ? 112 : 80, height: isCenter ? 130 : 100 }}
    >
      {/* Speaking glow ring */}
      {participant.isSpeaking && (
        <motion.div
          className={cn(
            "absolute rounded-full",
            isCenter
              ? "inset-[-8px] top-[-8px] w-[128px] h-[128px]"
              : "inset-[-6px] top-[-6px] w-[92px] h-[92px]"
          )}
          style={{ left: "50%", transform: "translateX(-50%)" }}
          animate={{
            boxShadow: [
              "0 0 16px 6px oklch(0.7 0.2 145 / 0.4)",
              "0 0 24px 10px oklch(0.7 0.2 145 / 0.25)",
              "0 0 16px 6px oklch(0.7 0.2 145 / 0.4)",
            ],
          }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Avatar container with glass rim */}
      <div
        className={cn(
          "relative rounded-full overflow-hidden",
          isCenter
            ? "ring-4 ring-white/20 shadow-[0_0_30px_oklch(0.5_0.15_265/0.3)]"
            : "ring-2 ring-white/10",
          participant.isMuted &&
            !participant.isSpeaking &&
            "saturate-50 opacity-80"
        )}
      >
        <Avatar
          src={participant.avatar || undefined}
          alt={participant.username}
          fallback={participant.username}
          size={isCenter ? "xl" : "lg"}
        />
      </div>

      {/* Muted indicator badge */}
      {participant.isMuted && (
        <motion.div
          className="absolute top-0 right-0 p-1 rounded-full bg-red-500/90 backdrop-blur-xs"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springConfig}
        >
          <MicOff className="w-3 h-3 text-white" />
        </motion.div>
      )}

      {/* Video on indicator badge */}
      {participant.isVideoOn && (
        <motion.div
          className="absolute top-0 left-0 p-1 rounded-full bg-green-500/90 backdrop-blur-xs"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springConfig}
        >
          <Video className="w-3 h-3 text-white" />
        </motion.div>
      )}

      {/* Username label */}
      <span className="mt-2 text-xs text-slate-300 font-medium truncate max-w-full text-center">
        {isCenter && participant.isLocal ? "You" : participant.username}
      </span>

      {/* Center avatar subtle pulse (when not speaking) */}
      {isCenter && !participant.isSpeaking && (
        <motion.div
          className="absolute rounded-full border border-white/10 pointer-events-none"
          style={{
            width: isCenter ? 120 : 88,
            height: isCenter ? 120 : 88,
            left: "50%",
            top: isCenter ? -4 : -4,
            transform: "translateX(-50%)",
          }}
          animate={{
            scale: [1, 1.04, 1],
            opacity: [0.4, 0.15, 0.4],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}
