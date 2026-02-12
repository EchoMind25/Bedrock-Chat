'use client';

import { useEffect, useState } from 'react';
import { createDailyCall } from '@/lib/daily/client';
import type { DailyCall, DailyParticipant } from '@daily-co/daily-js';

export function useDailyCall(roomUrl: string | null) {
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const [participants, setParticipants] = useState<DailyParticipant[]>([]);

  useEffect(() => {
    if (!roomUrl) return;

    const call = createDailyCall();
    setCallObject(call);

    call.join({ url: roomUrl });

    call.on('participant-joined', () => {
      setParticipants(Object.values(call.participants()));
    });

    call.on('participant-left', () => {
      setParticipants(Object.values(call.participants()));
    });

    return () => {
      call.destroy();
    };
  }, [roomUrl]);

  const toggleMute = () => {
    if (callObject) {
      callObject.setLocalAudio(!callObject.localAudio());
    }
  };

  const toggleDeafen = () => {
    if (callObject) {
      callObject.setLocalVideo(!callObject.localVideo());
    }
  };

  const leave = () => {
    if (callObject) {
      callObject.leave();
    }
  };

  return { callObject, participants, toggleMute, toggleDeafen, leave };
}
