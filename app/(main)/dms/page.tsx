"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { MessageCircle } from "lucide-react";
import { useDMStore } from "@/store/dm.store";
import { useAuthStore } from "@/store/auth.store";
import { Avatar } from "@/components/ui/avatar/avatar";

export default function DMsPage() {
  const router = useRouter();
  const dms = useDMStore((s) => s.dms);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const sorted = [...dms].sort((a, b) => {
    const aTime = a.lastMessage?.timestamp
      ? new Date(a.lastMessage.timestamp).getTime()
      : new Date(a.createdAt).getTime();
    const bTime = b.lastMessage?.timestamp
      ? new Date(b.lastMessage.timestamp).getTime()
      : new Date(b.createdAt).getTime();
    return bTime - aTime;
  });

  return (
    <main className="flex-1 flex flex-col bg-[oklch(0.14_0.02_250)]">
      <header className="h-12 px-4 flex items-center gap-3 border-b border-white/10 bg-[oklch(0.15_0.02_250)] shrink-0">
        <MessageCircle className="w-5 h-5 text-white/60" aria-hidden="true" />
        <h1 className="font-semibold text-white">Direct Messages</h1>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {sorted.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="flex flex-col items-center text-center py-16 px-8"
          >
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-white/20" aria-hidden="true" />
            </div>
            <p className="text-white/60 font-medium">No direct messages yet</p>
            <p className="text-sm text-white/40 mt-1">
              Start a conversation from the Friends page.
            </p>
          </motion.div>
        ) : (
          <ul role="list" className="space-y-0.5">
            {sorted.map((dm) => {
              const other = dm.participants.find((p) => p.userId !== currentUserId);
              if (!other) return null;

              const statusMap: Record<string, "online" | "away" | "busy" | "offline"> = {
                online: "online",
                idle: "away",
                dnd: "busy",
                offline: "offline",
              };

              return (
                <li key={dm.id}>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors touch-manipulation text-left"
                    onClick={() => router.push(`/dms/dm-${other.userId}`)}
                  >
                    <Avatar
                      src={other.avatar}
                      fallback={other.displayName.slice(0, 2).toUpperCase()}
                      status={statusMap[other.status] ?? "offline"}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {other.displayName}
                      </p>
                      {dm.lastMessage && (
                        <p className="text-xs text-white/40 truncate">
                          {dm.lastMessage.content}
                        </p>
                      )}
                    </div>
                    {dm.unreadCount > 0 && (
                      <span className="min-w-[20px] h-5 bg-primary rounded-full flex items-center justify-center px-1 text-white text-[10px] font-bold shrink-0">
                        {dm.unreadCount > 99 ? "99+" : dm.unreadCount}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
