"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Minimize2, Maximize2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Avatar } from "../ui/avatar";
import { useVoiceStore } from "@/store/voice.store";

const springConfig = {
  type: "spring" as const,
  stiffness: 260,
  damping: 20,
  mass: 1,
};

export function ScreenShare() {
  const activeScreenShare = useVoiceStore((s) => s.activeScreenShare);
  const setScreenSharing = useVoiceStore((s) => s.setScreenSharing);
  const participants = useVoiceStore((s) => s.participants);

  const [isMinimized, setIsMinimized] = useState(false);

  const screenSharingParticipant = useMemo(() => {
    if (!activeScreenShare) return null;
    return participants[activeScreenShare.identity];
  }, [activeScreenShare, participants]);

  const username = activeScreenShare?.username || "Unknown";
  const avatar = screenSharingParticipant?.avatar;
  const isLocalShare = activeScreenShare?.isLocal || false;

  const handleClose = () => {
    if (isLocalShare) {
      setScreenSharing(false);
    }
  };

  if (!activeScreenShare) return null;

  return (
    <AnimatePresence>
      {isMinimized ? (
        <MinimizedView
          onMaximize={() => setIsMinimized(false)}
          onClose={handleClose}
          username={username}
          isLocalShare={isLocalShare}
        />
      ) : (
        <FullScreenView
          onMinimize={() => setIsMinimized(true)}
          onClose={handleClose}
          username={username}
          avatar={avatar}
          isLocalShare={isLocalShare}
        />
      )}
    </AnimatePresence>
  );
}

interface FullScreenViewProps {
  onMinimize: () => void;
  onClose: () => void;
  username: string;
  avatar?: string;
  isLocalShare: boolean;
}

function FullScreenView({
  onMinimize,
  onClose,
  username,
  avatar,
  isLocalShare,
}: FullScreenViewProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={springConfig}
    >
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="relative w-full h-full max-w-7xl rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
          <p className="text-white/40 text-sm">
            Screen share active
          </p>

          <div className="absolute top-4 left-4 z-10">
            <motion.div
              className="flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={springConfig}
            >
              <Avatar src={avatar} alt={username} size="sm" />
              <div>
                <p className="text-sm font-medium text-white">{username}</p>
                <p className="text-xs text-white/60">is presenting</p>
              </div>
              <motion.div
                className="w-2 h-2 rounded-full bg-red-500"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.7, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </div>
        </div>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...springConfig, delay: 0.2 }}
      >
        <div className="flex items-center gap-3 px-6 py-4 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
          <motion.button
            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMinimize}
            aria-label="Minimize"
          >
            <Minimize2 className="w-5 h-5" />
          </motion.button>

          {isLocalShare && (
            <>
              <div className="w-px h-8 bg-white/20" />
              <motion.button
                className="p-3 rounded-xl bg-red-500/90 hover:bg-red-600 text-white transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                aria-label="Stop sharing"
              >
                <X className="w-5 h-5" />
              </motion.button>
              <span className="ml-2 text-sm text-white/80">Stop Sharing</span>
            </>
          )}

          {!isLocalShare && (
            <span className="ml-2 text-sm text-white/60">
              Viewing {username}&apos;s screen
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

interface MinimizedViewProps {
  onMaximize: () => void;
  onClose: () => void;
  username: string;
  isLocalShare: boolean;
}

function MinimizedView({
  onMaximize,
  onClose,
  username,
  isLocalShare,
}: MinimizedViewProps) {
  return (
    <motion.div
      className="fixed bottom-24 right-6 z-50 w-80 rounded-xl overflow-hidden shadow-2xl group"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={springConfig}
      drag
      dragConstraints={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      dragElastic={0.1}
      whileHover={{ scale: 1.02 }}
    >
      <div className="aspect-video bg-black relative flex items-center justify-center">
        <p className="text-white/30 text-xs">Screen share</p>

        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <motion.button
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onMaximize}
            aria-label="Maximize"
          >
            <Maximize2 className="w-4 h-4" />
          </motion.button>
          {isLocalShare && (
            <motion.button
              className="p-2 rounded-lg bg-red-500/90 hover:bg-red-600 text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              aria-label="Stop sharing"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>

      <div className="bg-black/80 backdrop-blur-md px-3 py-2 border-t border-white/10">
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/80">{username} is presenting</p>
          <motion.div
            className="w-2 h-2 rounded-full bg-red-500"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
