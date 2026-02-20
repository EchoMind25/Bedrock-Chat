"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef, useCallback } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
} from "@livekit/components-react";
import { Avatar } from "../ui/avatar";
import { useVoiceStore } from "@/store/voice.store";

const springConfig = {
  type: "spring" as const,
  stiffness: 260,
  damping: 20,
  mass: 1,
};

export function DirectCallUI() {
  const callState = useVoiceStore((s) => s.callState);
  const incomingCall = useVoiceStore((s) => s.incomingCall);
  const activeDirectCall = useVoiceStore((s) => s.activeDirectCall);
  const directCallToken = useVoiceStore((s) => s.directCallToken);
  const directCallWsUrl = useVoiceStore((s) => s.directCallWsUrl);

  if (callState === "idle") return null;

  return (
    <AnimatePresence>
      {callState === "incoming_ringing" && incomingCall && (
        <IncomingCallOverlay call={incomingCall} />
      )}
      {callState === "outgoing_ringing" && activeDirectCall && (
        <OutgoingCallOverlay call={activeDirectCall} />
      )}
      {callState === "active" &&
        activeDirectCall &&
        directCallToken &&
        directCallWsUrl && (
          <ActiveCallOverlay
            call={activeDirectCall}
            token={directCallToken}
            wsUrl={directCallWsUrl}
          />
        )}
    </AnimatePresence>
  );
}

interface IncomingCallOverlayProps {
  call: NonNullable<ReturnType<typeof useVoiceStore.getState>["incomingCall"]>;
}

function IncomingCallOverlay({ call }: IncomingCallOverlayProps) {
  const handleAnswer = useCallback(async () => {
    try {
      const res = await fetch("/api/voice/direct/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId: call.id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("[DirectCall] Failed to answer:", err);
        useVoiceStore.getState().clearCall();
        return;
      }

      const { token, wsUrl } = await res.json();
      const store = useVoiceStore.getState();
      store.setDirectCallConnection(token, wsUrl);
      store.setActiveDirectCall(call);
      store.setCallState("active");
      store.setIncomingCall(null);
    } catch (e) {
      console.error("[DirectCall] Answer error:", e);
      useVoiceStore.getState().clearCall();
    }
  }, [call]);

  const handleDecline = useCallback(async () => {
    try {
      await fetch("/api/voice/direct/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId: call.id }),
      });
    } catch {
      // Non-blocking
    }
    useVoiceStore.getState().clearCall();
  }, [call.id]);

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-[60] w-80"
      initial={{ scale: 0, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0, y: 50 }}
      transition={springConfig}
    >
      <div className="liquid-glass rounded-2xl border border-white/15 shadow-2xl p-6">
        <div className="flex flex-col items-center gap-4">
          {/* Caller avatar with ring animation */}
          <div className="relative">
            <motion.div
              className="absolute inset-[-4px] rounded-full border-2 border-green-400/50"
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.5, 0.2, 0.5],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <Avatar
              src={call.callerAvatar}
              alt={call.callerName}
              fallback={call.callerName}
              size="xl"
            />
          </div>

          <div className="text-center">
            <p className="text-white font-semibold">{call.callerName}</p>
            <p className="text-sm text-slate-400">
              Incoming {call.callType} call
            </p>
          </div>

          <div className="flex gap-4 w-full">
            <motion.button
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/90 hover:bg-red-600 text-white transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDecline}
            >
              <PhoneOff className="w-5 h-5" />
              <span className="text-sm font-medium">Decline</span>
            </motion.button>

            <motion.button
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/90 hover:bg-green-600 text-white transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAnswer}
            >
              <Phone className="w-5 h-5" />
              <span className="text-sm font-medium">Answer</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface OutgoingCallOverlayProps {
  call: NonNullable<
    ReturnType<typeof useVoiceStore.getState>["activeDirectCall"]
  >;
}

function OutgoingCallOverlay({ call }: OutgoingCallOverlayProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCancel = useCallback(async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    try {
      await fetch("/api/voice/direct/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId: call.id }),
      });
    } catch {
      // Non-blocking
    }
    useVoiceStore.getState().clearCall();
  }, [call.id]);

  // Auto-cancel after 30 seconds
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      handleCancel();
    }, 30_000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-[60] w-80"
      initial={{ scale: 0, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0, y: 50 }}
      transition={springConfig}
    >
      <div className="liquid-glass rounded-2xl border border-white/15 shadow-2xl p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <motion.div
              className="absolute inset-[-4px] rounded-full border-2 border-[oklch(0.55_0.2_265/0.5)]"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.1, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <Avatar
              src={call.calleeAvatar}
              alt={call.calleeName || "User"}
              fallback={call.calleeName || "User"}
              size="xl"
            />
          </div>

          <div className="text-center">
            <p className="text-white font-semibold">
              {call.calleeName || "User"}
            </p>
            <motion.p
              className="text-sm text-slate-400"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Calling...
            </motion.p>
          </div>

          <motion.button
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/90 hover:bg-red-600 text-white transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCancel}
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-sm font-medium">Cancel</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

interface ActiveCallOverlayProps {
  call: NonNullable<
    ReturnType<typeof useVoiceStore.getState>["activeDirectCall"]
  >;
  token: string;
  wsUrl: string;
}

function ActiveCallOverlay({ call, token, wsUrl }: ActiveCallOverlayProps) {
  const handleEndCall = useCallback(async () => {
    try {
      await fetch("/api/voice/direct/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId: call.id }),
      });
    } catch {
      // Non-blocking
    }
    useVoiceStore.getState().clearCall();
  }, [call.id]);

  const handleDisconnected = useCallback(() => {
    useVoiceStore.getState().clearCall();
  }, []);

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-[60] w-80"
      initial={{ scale: 0, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0, y: 50 }}
      transition={springConfig}
    >
      <LiveKitRoom
        serverUrl={wsUrl}
        token={token}
        connect={true}
        audio={true}
        video={false}
        onDisconnected={handleDisconnected}
      >
        <RoomAudioRenderer />
        <ActiveCallContent call={call} onEndCall={handleEndCall} />
      </LiveKitRoom>
    </motion.div>
  );
}

interface ActiveCallContentProps {
  call: NonNullable<
    ReturnType<typeof useVoiceStore.getState>["activeDirectCall"]
  >;
  onEndCall: () => void;
}

function ActiveCallContent({ call, onEndCall }: ActiveCallContentProps) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();

  const remoteParticipant = participants.find(
    (p) => p !== localParticipant,
  );
  const remoteName =
    remoteParticipant?.name || call.callerName || "Connected";
  const isSpeaking = remoteParticipant?.isSpeaking || false;

  return (
    <div className="liquid-glass rounded-2xl border border-white/15 shadow-2xl p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {isSpeaking && (
            <motion.div
              className="absolute inset-[-6px] rounded-full"
              animate={{
                boxShadow: [
                  "0 0 12px 4px oklch(0.7 0.2 145 / 0.4)",
                  "0 0 20px 8px oklch(0.7 0.2 145 / 0.2)",
                  "0 0 12px 4px oklch(0.7 0.2 145 / 0.4)",
                ],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
          <Avatar
            src={call.callerAvatar || call.calleeAvatar}
            alt={remoteName}
            fallback={remoteName}
            size="xl"
          />
        </div>

        <div className="text-center">
          <p className="text-white font-semibold">{remoteName}</p>
          <p className="text-xs text-green-400">
            {call.callType === "video" ? (
              <span className="flex items-center gap-1 justify-center">
                <Video className="w-3 h-3" /> Video Call
              </span>
            ) : (
              "Voice Call"
            )}
          </p>
        </div>

        <motion.button
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/90 hover:bg-red-600 text-white transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onEndCall}
        >
          <PhoneOff className="w-5 h-5" />
          <span className="text-sm font-medium">End Call</span>
        </motion.button>
      </div>
    </div>
  );
}
