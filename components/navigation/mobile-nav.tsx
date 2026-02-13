"use client";

import { useRouter, usePathname } from "next/navigation";
import { useServerStore } from "@/store/server.store";
import { useUIStore } from "@/store/ui.store";
import { Home, Hash, Users, Bell, Settings } from "lucide-react";
import { motion } from "motion/react";

/**
 * Mobile bottom navigation bar
 * Fixed at bottom with safe area insets for iOS notch/home indicator
 * 5 navigation items with active state highlighting
 * Touch targets: 44x44px minimum (iOS requirement)
 */
export function MobileNav() {
  const router = useRouter();
  const pathname = usePathname();
  const currentServerId = useServerStore((state) => state.currentServerId);
  const setMobileChannelListOpen = useUIStore(
    (state) => state.setMobileChannelListOpen
  );
  const setMobileServerListOpen = useUIStore(
    (state) => state.setMobileServerListOpen
  );

  const navItems = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      onClick: () => {
        router.push("/");
      },
      isActive: pathname === "/" || pathname === "/friends",
    },
    {
      id: "channels",
      label: "Channels",
      icon: Hash,
      onClick: () => {
        setMobileChannelListOpen(true);
      },
      isActive: pathname.includes("/servers/"),
    },
    {
      id: "servers",
      label: "Servers",
      icon: Users,
      onClick: () => {
        setMobileServerListOpen(true);
      },
      isActive: false,
    },
    {
      id: "notifications",
      label: "Alerts",
      icon: Bell,
      onClick: () => {
        router.push("/notifications");
      },
      isActive: pathname === "/notifications",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      onClick: () => {
        router.push("/settings");
      },
      isActive: pathname === "/settings",
    },
  ];

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[oklch(0.15_0.02_250)]/95 backdrop-blur-lg border-t border-white/10 md:hidden"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-3 py-1 rounded-lg transition-colors touch-manipulation ${
                item.isActive
                  ? "text-primary"
                  : "text-white/60 hover:text-white/80"
              }`}
              whileTap={{ scale: 0.95 }}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5 mb-0.5" aria-hidden="true" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}
