"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useServerSoundsStore } from "@/store/server-sounds.store";
import { Glass } from "@/components/ui/glass";
import { Volume2, VolumeX } from "lucide-react";

interface SoundboardPanelProps {
  serverId: string;
}

const RATE_LIMIT_MS = 3000;

function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 1) return "<1s";
  return `${seconds}s`;
}

export function SoundboardPanel({ serverId }: SoundboardPanelProps) {
  const loadSounds = useServerSoundsStore((s) => s.loadSounds);
  const getServerSounds = useServerSoundsStore((s) => s.getServerSounds);
  const playSound = useServerSoundsStore((s) => s.playSound);
  const playingSoundId = useServerSoundsStore((s) => s.playingSoundId);
  const isLoading = useServerSoundsStore((s) => s.isLoading);

  const [isRateLimited, setIsRateLimited] = useState(false);
  const rateLimitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (serverId) {
      loadSounds(serverId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId]);

  // Cleanup rate limit timer on unmount
  useEffect(() => {
    return () => {
      if (rateLimitTimerRef.current) {
        clearTimeout(rateLimitTimerRef.current);
      }
    };
  }, []);

  const sounds = getServerSounds(serverId);

  const handlePlay = useCallback(
    (sound: (typeof sounds)[number]) => {
      if (isRateLimited) return;

      playSound(sound);

      // Start rate limit cooldown
      setIsRateLimited(true);
      rateLimitTimerRef.current = setTimeout(() => {
        setIsRateLimited(false);
        rateLimitTimerRef.current = null;
      }, RATE_LIMIT_MS);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isRateLimited],
  );

  if (isLoading && sounds.length === 0) {
    return (
      <Glass variant="light" border="light" className="p-4 rounded-lg">
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Glass>
    );
  }

  if (sounds.length === 0) {
    return (
      <Glass variant="light" border="light" className="p-4 rounded-lg">
        <div className="flex flex-col items-center py-8 text-foreground-secondary">
          <VolumeX className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">No sounds yet</p>
          <p className="text-xs mt-1 opacity-60">
            Sounds added to the server will appear here
          </p>
        </div>
      </Glass>
    );
  }

  return (
    <Glass variant="light" border="light" className="p-3 rounded-lg">
      <div className="grid grid-cols-4 gap-2">
        {sounds.map((sound) => {
          const isPlaying = playingSoundId === sound.id;
          const isDisabled = isRateLimited && !isPlaying;

          return (
            <motion.button
              key={sound.id}
              type="button"
              whileHover={isDisabled ? undefined : { scale: 1.05 }}
              whileTap={isDisabled ? undefined : { scale: 0.92 }}
              onClick={() => handlePlay(sound)}
              disabled={isDisabled}
              className={`
                relative flex flex-col items-center justify-center
                gap-1 p-2 rounded-lg text-center
                transition-colors
                ${
                  isDisabled
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-white/10 cursor-pointer"
                }
                ${
                  isPlaying
                    ? "bg-primary/10"
                    : "bg-white/5"
                }
              `}
              aria-label={`Play ${sound.name}`}
            >
              {/* Pulsing border for currently playing */}
              {isPlaying && (
                <motion.div
                  className="absolute inset-0 rounded-lg border-2 border-primary"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}

              {/* Sound icon or emoji */}
              <span className="text-lg leading-none" aria-hidden="true">
                {sound.emoji || (
                  <Volume2
                    className={`w-5 h-5 ${
                      isPlaying
                        ? "text-primary"
                        : "text-foreground-secondary"
                    }`}
                  />
                )}
              </span>

              {/* Sound name */}
              <span className="text-[10px] font-medium text-foreground truncate w-full leading-tight">
                {sound.name}
              </span>

              {/* Duration */}
              <span className="text-[9px] text-foreground-secondary leading-none">
                {formatDuration(sound.durationMs)}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Rate limit indicator */}
      {isRateLimited && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-center"
        >
          <span className="text-[10px] text-foreground-secondary">
            Cooldown...
          </span>
          <div className="mt-1 h-0.5 bg-white/10 rounded-full overflow-hidden mx-4">
            <motion.div
              className="h-full bg-primary/50 rounded-full"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: RATE_LIMIT_MS / 1000, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </Glass>
  );
}
