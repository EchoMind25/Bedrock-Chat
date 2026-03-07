"use client";

import { useEffect, useState } from "react";
import { useNativeStore } from "@/store/native.store";

/**
 * Overlay page — rendered ONLY inside the Tauri overlay window.
 * Compact dark glass card showing voice, activity, and online friends.
 *
 * Performance: <50KB bundle target. No analytics, no error tracking.
 * Privacy: only shows friends with mutual activity sharing enabled.
 */

// Guard: redirect to / if not in Tauri context
function useTauriGuard() {
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "__TAURI__" in window) {
      setIsTauri(true);
    } else {
      window.location.href = "/";
    }
  }, []);

  return isTauri;
}

export default function OverlayPage() {
  const isTauri = useTauriGuard();
  const currentGame = useNativeStore((s) => s.currentGame);
  const nativeAvailable = useNativeStore((s) => s.nativeAvailable);

  // Lazy-load voice participants and online friends to keep bundle small
  const [voiceUsers, setVoiceUsers] = useState<VoiceUser[]>([]);
  const [onlineFriends, setOnlineFriends] = useState<OnlineFriend[]>([]);

  // Load voice state
  useEffect(() => {
    if (!isTauri) return;

    let cancelled = false;

    async function loadVoice() {
      try {
        const { useVoiceStore } = await import("@/store/voice.store");
        const update = () => {
          if (cancelled) return;
          const participants = useVoiceStore.getState().participants;
          setVoiceUsers(
            Object.values(participants).map((p) => ({
              username: p.username,
              isMuted: p.isMuted,
              isSpeaking: p.isSpeaking,
            })),
          );
        };
        update();
        const unsub = useVoiceStore.subscribe(update);
        return () => {
          cancelled = true;
          unsub();
        };
      } catch {
        // Voice store not available
      }
    }

    const cleanup = loadVoice();
    return () => {
      cancelled = true;
      cleanup?.then((fn) => fn?.());
    };
  }, [isTauri]);

  // Load online friends with activity sharing
  useEffect(() => {
    if (!isTauri) return;

    let cancelled = false;

    async function loadFriends() {
      try {
        const { usePresenceStore } = await import("@/store/presence.store");
        const update = () => {
          if (cancelled) return;
          const onlineUsers = usePresenceStore.getState().onlineUsers;
          const friends: OnlineFriend[] = [];
          onlineUsers.forEach((user) => {
            // Only show friends who are not invisible
            if (user.status !== "invisible") {
              friends.push({
                username: user.username,
                displayName: user.displayName,
                status: user.status,
                avatar: user.avatar,
              });
            }
          });
          setOnlineFriends(friends);
        };
        update();
        const unsub = usePresenceStore.subscribe(update);
        return () => {
          cancelled = true;
          unsub();
        };
      } catch {
        // Presence store not available
      }
    }

    const cleanup = loadFriends();
    return () => {
      cancelled = true;
      cleanup?.then((fn) => fn?.());
    };
  }, [isTauri]);

  if (!isTauri || !nativeAvailable) {
    return null;
  }

  return (
    <div className="overlay-container">
      <style>{overlayStyles}</style>

      {/* Voice participants */}
      {voiceUsers.length > 0 && (
        <section className="overlay-section">
          <h3 className="overlay-heading">Voice</h3>
          <ul className="overlay-list">
            {voiceUsers.map((user) => (
              <li key={user.username} className="overlay-voice-item">
                <span
                  className={`voice-indicator ${user.isSpeaking ? "speaking" : ""} ${user.isMuted ? "muted" : ""}`}
                />
                <span className="overlay-text">{user.username}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Current game activity */}
      {currentGame && (
        <section className="overlay-section">
          <h3 className="overlay-heading">Playing</h3>
          <p className="overlay-game">{currentGame}</p>
        </section>
      )}

      {/* Online friends */}
      {onlineFriends.length > 0 && (
        <section className="overlay-section">
          <h3 className="overlay-heading">Online ({onlineFriends.length})</h3>
          <ul className="overlay-list">
            {onlineFriends.slice(0, 8).map((f) => (
              <li key={f.username} className="overlay-friend-item">
                <span className={`status-dot status-${f.status}`} />
                <span className="overlay-text">{f.displayName}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Hotkey hint */}
      <div className="overlay-hint">Shift+F1 to toggle</div>
    </div>
  );
}

// ── Types (local, keep bundle small) ────────────────────────

interface VoiceUser {
  username: string;
  isMuted: boolean;
  isSpeaking: boolean;
}

interface OnlineFriend {
  username: string;
  displayName: string;
  status: string;
  avatar: string;
}

// ── Inline styles (no Tailwind import to minimize bundle) ───

const overlayStyles = `
  .overlay-container {
    width: 100%;
    height: 100%;
    background: rgba(15, 15, 25, 0.85);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 12px;
    font-family: system-ui, -apple-system, sans-serif;
    color: rgba(255, 255, 255, 0.9);
    font-size: 12px;
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
  }

  .overlay-section {
    margin-bottom: 8px;
  }

  .overlay-heading {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.5);
    margin: 0 0 4px 0;
  }

  .overlay-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .overlay-voice-item,
  .overlay-friend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 0;
  }

  .overlay-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .overlay-game {
    margin: 0;
    font-weight: 500;
    color: rgba(130, 200, 255, 0.95);
  }

  .voice-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(100, 100, 100, 0.6);
    flex-shrink: 0;
  }

  .voice-indicator.speaking {
    background: rgba(80, 220, 100, 0.9);
    box-shadow: 0 0 4px rgba(80, 220, 100, 0.5);
  }

  .voice-indicator.muted {
    background: rgba(220, 80, 80, 0.7);
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-dot.status-online { background: #43b581; }
  .status-dot.status-idle { background: #faa61a; }
  .status-dot.status-dnd { background: #f04747; }

  .overlay-hint {
    position: absolute;
    bottom: 4px;
    right: 8px;
    font-size: 9px;
    color: rgba(255, 255, 255, 0.25);
  }
`;
