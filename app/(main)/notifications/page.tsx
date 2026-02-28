"use client";

import { Bell } from "lucide-react";
import { motion } from "motion/react";

export default function NotificationsPage() {
  return (
    <main className="flex-1 flex flex-col bg-[oklch(0.14_0.02_250)]">
      {/* Header */}
      <header className="h-12 px-4 flex items-center gap-3 border-b border-white/10 bg-[oklch(0.15_0.02_250)] shrink-0">
        <Bell className="w-5 h-5 text-white/60" aria-hidden="true" />
        <h1 className="font-semibold text-white">Notifications</h1>
      </header>

      {/* Empty state */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="flex flex-col items-center text-center max-w-sm"
        >
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Bell className="w-10 h-10 text-white/20" aria-hidden="true" />
          </div>
          <p className="text-white/60 font-medium">No notifications yet</p>
          <p className="text-sm text-white/40 mt-1">
            Mentions, friend requests, and server activity will appear here.
          </p>
        </motion.div>
      </div>
    </main>
  );
}
