"use client";

import { motion } from "motion/react";
import { useState, useMemo } from "react";
import { ParticipantTile } from "./participant-tile";
import { ControlsBar } from "./controls-bar";
import { VoiceSettings } from "./voice-settings";
import { ScreenShare } from "./screen-share";
import { Users } from "lucide-react";

export interface Participant {
  id: string;
  username: string;
  avatar?: string;
  isSpeaking?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isDeafened?: boolean;
}

interface VoiceChannelProps {
  channelName: string;
  participants: Participant[];
  onLeave?: () => void;
}

const springConfig = {
  type: "spring" as const,
  stiffness: 260,
  damping: 20,
  mass: 1,
};

export function VoiceChannel({ channelName, participants, onLeave }: VoiceChannelProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Calculate grid layout based on participant count
  const gridCols = useMemo(() => {
    const count = participants.length;
    if (count <= 1) return "grid-cols-1";
    if (count <= 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2 lg:grid-cols-2";
    if (count <= 6) return "grid-cols-2 lg:grid-cols-3";
    if (count <= 9) return "grid-cols-2 lg:grid-cols-3";
    return "grid-cols-2 lg:grid-cols-4";
  }, [participants.length]);

  const handleLeave = () => {
    onLeave?.();
  };

  const handleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
  };

  return (
    <>
      <div className="flex flex-col h-full bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header */}
        <motion.div
          className="flex-shrink-0 px-6 py-4 border-b border-border/50 bg-background/50 backdrop-blur-sm"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={springConfig}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Users className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">{channelName}</h1>
                <p className="text-sm text-slate-400">
                  {participants.length} {participants.length === 1 ? "participant" : "participants"}
                </p>
              </div>
            </div>

            {/* Connection indicator */}
            <motion.div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={springConfig}
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-green-500"
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
              <span className="text-sm font-medium text-green-500">Connected</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Participants Grid */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <div className={`grid ${gridCols} gap-4 auto-rows-fr`}>
            {participants.map((participant, index) => (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  ...springConfig,
                  delay: index * 0.05,
                }}
              >
                <ParticipantTile {...participant} />
              </motion.div>
            ))}

            {/* Empty state */}
            {participants.length === 0 && (
              <motion.div
                className="col-span-full flex flex-col items-center justify-center py-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={springConfig}
              >
                <Users className="w-16 h-16 text-slate-400/50 mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  No one else is here
                </h2>
                <p className="text-slate-300 text-center max-w-sm">
                  Invite some friends to join the voice channel or wait for others to connect.
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Controls Bar */}
        <ControlsBar
          onLeave={handleLeave}
          onSettingsOpen={() => setIsSettingsOpen(true)}
          onScreenShare={handleScreenShare}
        />
      </div>

      {/* Voice Settings Modal */}
      <VoiceSettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Screen Share Overlay */}
      <ScreenShare
        isActive={isScreenSharing}
        onClose={() => setIsScreenSharing(false)}
        username="You"
      />
    </>
  );
}
