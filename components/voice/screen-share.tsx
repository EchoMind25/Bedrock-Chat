"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Minimize2, Maximize2, Monitor } from "lucide-react";
import { useState } from "react";
import { Avatar } from "../ui/avatar";

interface ScreenShareProps {
  isActive: boolean;
  onClose: () => void;
  username?: string;
  avatar?: string;
}

const springConfig = {
  type: "spring" as const,
  stiffness: 260,
  damping: 20,
  mass: 1,
};

export function ScreenShare({
  isActive,
  onClose,
  username = "You",
  avatar,
}: ScreenShareProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      {isMinimized ? (
        <MinimizedView
          onMaximize={() => setIsMinimized(false)}
          onClose={onClose}
          username={username}
        />
      ) : (
        <FullScreenView
          onMinimize={() => setIsMinimized(true)}
          onClose={onClose}
          username={username}
          avatar={avatar}
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
}

function FullScreenView({ onMinimize, onClose, username, avatar }: FullScreenViewProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={springConfig}
    >
      {/* Mock Screen Content */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="relative w-full h-full max-w-7xl rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 border border-white/10">
          {/* Mock desktop/application */}
          <div className="absolute inset-0 p-8">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 h-full">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="space-y-3">
                  <div className="h-8 bg-white/5 rounded-lg w-1/3" />
                  <div className="h-32 bg-white/10 rounded-lg" />
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-24 bg-white/5 rounded-lg" />
                    <div className="h-24 bg-white/5 rounded-lg" />
                    <div className="h-24 bg-white/5 rounded-lg" />
                  </div>
                </div>
              </div>

              {/* Mock content indicator */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <Monitor className="w-24 h-24 text-white/20 mx-auto mb-4" />
                <p className="text-white/40 text-2xl font-medium">Screen Share Active</p>
                <p className="text-white/20 text-sm mt-2">
                  This is a mock screen share view
                </p>
              </div>
            </div>
          </div>

          {/* Presenter indicator */}
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
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating Controls */}
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
        </div>
      </motion.div>
    </motion.div>
  );
}

interface MinimizedViewProps {
  onMaximize: () => void;
  onClose: () => void;
  username: string;
}

function MinimizedView({ onMaximize, onClose, username }: MinimizedViewProps) {
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
      {/* Mini screen preview */}
      <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Monitor className="w-12 h-12 text-white/30 mx-auto mb-2" />
            <p className="text-white/50 text-xs">Screen Share</p>
          </div>
        </div>

        {/* Overlay controls */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <motion.button
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onMaximize}
            aria-label="Maximize"
          >
            <Maximize2 className="w-4 h-4" />
          </motion.button>
          <motion.button
            className="p-2 rounded-lg bg-red-500/90 hover:bg-red-600 text-white"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            aria-label="Stop sharing"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Info bar */}
      <div className="bg-black/80 backdrop-blur-md px-3 py-2 border-t border-white/10">
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/80">
            {username} is presenting
          </p>
          <motion.div
            className="w-2 h-2 rounded-full bg-red-500"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
