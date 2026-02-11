"use client";

import { motion } from "motion/react";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import { Avatar } from "../ui/avatar";

interface ParticipantTileProps {
  id: string;
  username: string;
  avatar?: string;
  isSpeaking?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isDeafened?: boolean;
}

const springConfig = {
  type: "spring" as const,
  stiffness: 260,
  damping: 20,
  mass: 1,
};

export function ParticipantTile({
  username,
  avatar,
  isSpeaking = false,
  isMuted = false,
  isVideoOff = true,
  isDeafened = false,
}: ParticipantTileProps) {
  return (
    <motion.div
      className="relative aspect-video rounded-xl overflow-hidden group"
      whileHover={{ scale: 1.02, rotateX: 2, rotateY: 2 }}
      transition={springConfig}
      style={{ perspective: "1000px" }}
    >
      {/* Speaking indicator ring */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none z-10"
        animate={{
          boxShadow: isSpeaking
            ? [
                "0 0 0 0px oklch(0.7 0.2 145 / 0.8)",
                "0 0 0 4px oklch(0.7 0.2 145 / 0.5)",
                "0 0 0 8px oklch(0.7 0.2 145 / 0)",
              ]
            : "0 0 0 0px oklch(0.7 0.2 145 / 0)",
        }}
        transition={{
          duration: 1.5,
          repeat: isSpeaking ? Number.POSITIVE_INFINITY : 0,
          ease: "easeOut",
        }}
      />

      {/* Video placeholder / Avatar */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-pink-500/20 backdrop-blur-xl">
        {isVideoOff ? (
          <div className="flex items-center justify-center h-full">
            <Avatar
              src={avatar}
              alt={username}
              size="xl"
              className="ring-4 ring-white/10"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-white/30 text-sm">
            [Video Feed]
          </div>
        )}
      </div>

      {/* Glass overlay on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
      />

      {/* Username label */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
        <div className="flex items-center justify-between">
          <motion.div
            className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springConfig}
          >
            <p className="text-sm font-medium text-white truncate max-w-[150px]">
              {username}
            </p>
          </motion.div>

          {/* Status icons */}
          <div className="flex items-center gap-1">
            {isMuted && (
              <motion.div
                className="p-1.5 rounded-lg bg-red-500/90 backdrop-blur-md"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={springConfig}
              >
                <MicOff className="w-4 h-4 text-white" />
              </motion.div>
            )}
            {isDeafened && (
              <motion.div
                className="p-1.5 rounded-lg bg-red-500/90 backdrop-blur-md"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={springConfig}
              >
                <MicOff className="w-4 h-4 text-white" strokeWidth={3} />
              </motion.div>
            )}
            {!isVideoOff && (
              <motion.div
                className="p-1.5 rounded-lg bg-green-500/90 backdrop-blur-md"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={springConfig}
              >
                <Video className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Speaking indicator (additional visual) */}
      {isSpeaking && (
        <motion.div
          className="absolute top-2 right-2 w-3 h-3 rounded-full bg-green-400 z-20"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 0.8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>
  );
}
