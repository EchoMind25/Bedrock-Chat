"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import type { UserStatus } from "@/store/auth.store";
import { usePresenceStore } from "@/store/presence.store";
import { useFamilyStore } from "@/store/family.store";
import { usePlatformRoleStore } from "@/store/platform-role.store";
import { performFullLogout } from "@/lib/utils/logout";
import { Avatar } from "@/components/ui/avatar/avatar";
import type { AvatarStatus } from "@/components/ui/avatar/avatar";
import { Home, Hash, Users, Bell } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

/**
 * Mobile bottom navigation bar
 * Fixed at bottom with safe area insets for iOS notch/home indicator
 * 5 navigation items with active state highlighting
 * Touch targets: 44x44px minimum (iOS requirement)
 */
export function MobileNav() {
  const router = useRouter();
  const pathname = usePathname();
  const setMobileChannelListOpen = useUIStore(
    (state) => state.setMobileChannelListOpen
  );
  const setMobileServerListOpen = useUIStore(
    (state) => state.setMobileServerListOpen
  );
  const openSettings = useUIStore((s) => s.openSettings);

  // User data for profile button
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const setPresenceStatus = usePresenceStore((s) => s.setStatus);
  const monitoringLevel = useFamilyStore((s) => s.myMonitoringLevel);
  const platformIsDeveloper = usePlatformRoleStore((s) => s.isDeveloper());
  const platformIsStaff = usePlatformRoleStore((s) => s.isStaff());

  // Bottom sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close sheet on route change
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  const statusToAvatar: Record<UserStatus, AvatarStatus> = {
    online: "online",
    idle: "away",
    dnd: "busy",
    offline: "offline",
    invisible: "offline",
  };

  const statusOptions: { value: UserStatus; label: string; color: string }[] = [
    { value: "online", label: "Online", color: "oklch(0.72 0.19 145)" },
    { value: "idle", label: "Idle", color: "oklch(0.80 0.18 85)" },
    { value: "dnd", label: "Do Not Disturb", color: "oklch(0.63 0.21 25)" },
    ...(monitoringLevel === 4
      ? []
      : [{ value: "invisible" as UserStatus, label: "Invisible", color: "oklch(0.50 0.01 250)" }]),
  ];

  const handleSetStatus = (status: UserStatus) => {
    updateUser({ status });
    setPresenceStatus(status);
    setSheetOpen(false);
  };

  const avatarStatus = user ? (statusToAvatar[user.status] ?? "online") : "offline";

  const navItems = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      onClick: () => {
        useUIStore.getState().closeMobileSidebars();
        router.push("/friends");
      },
      isActive: pathname === "/friends",
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
  ];

  return (
    <>
      <motion.nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-[oklch(0.15_0.02_250)]/95 backdrop-blur-lg border-t border-white/10 md:hidden"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
      >
        <div className="flex items-center justify-around h-14 px-2">
          {navItems.map((item, index) => {
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
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  delay: index * 0.04,
                }}
                whileTap={{ scale: 0.92 }}
                aria-label={item.label}
              >
                <Icon className="w-5 h-5 mb-0.5" aria-hidden="true" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </motion.button>
            );
          })}

          {/* Profile button — 5th item */}
          <motion.button
            type="button"
            onClick={() => setSheetOpen((v) => !v)}
            className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-3 py-1 rounded-lg transition-colors touch-manipulation ${
              sheetOpen ? "text-primary" : "text-white/60 hover:text-white/80"
            }`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              delay: 0.16,
            }}
            whileTap={{ scale: 0.92 }}
            aria-label="Profile"
            aria-expanded={sheetOpen}
            aria-haspopup="menu"
          >
            {user ? (
              <Avatar
                src={user.avatar}
                fallback={user.displayName.slice(0, 2).toUpperCase()}
                status={avatarStatus}
                size="xs"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-white/20" />
            )}
            <span className="text-[10px] font-medium mt-0.5">Profile</span>
          </motion.button>
        </div>
      </motion.nav>

      {/* Profile bottom sheet — portal to escape overflow clipping */}
      {mounted && createPortal(
        <AnimatePresence>
          {sheetOpen && (
            <>
              {/* Backdrop — onClick (not onPointerDown) so child button taps aren't intercepted */}
              <motion.div
                className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setSheetOpen(false)}
              />

              {/* Sheet
                  overflow: clip instead of overflow: hidden — avoids the iOS Safari bug
                  where overflow:hidden on a CSS-transformed element blocks touch events
                  on its children. overflow:clip provides the same visual clipping without
                  the stacking-context side-effects that cause the pointer-event blockage. */}
              <motion.div
                className="fixed left-0 right-0 z-[61] bg-[oklch(0.18_0.02_250)] border-t border-white/10 rounded-t-2xl shadow-2xl md:hidden"
                style={{
                  bottom: `calc(56px + env(safe-area-inset-bottom))`,
                  maxHeight: "75vh",
                  overflow: "clip",
                }}
                initial={{ y: 300, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 300, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 34 }}
              >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* User info header */}
                {user && (
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                    <Avatar
                      src={user.avatar}
                      fallback={user.displayName.slice(0, 2).toUpperCase()}
                      status={avatarStatus}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{user.displayName}</p>
                      <p className="text-xs text-white/50 truncate">@{user.username}</p>
                    </div>
                  </div>
                )}

                <div className="overflow-y-auto p-2 space-y-0.5" style={{ maxHeight: "calc(75vh - 100px)" }}>
                  {/* My Profile */}
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-sm text-left text-white/80 hover:bg-white/5 active:bg-white/10 rounded-lg transition-colors flex items-center gap-3 touch-manipulation"
                    onClick={() => {
                      setSheetOpen(false);
                      openSettings("profile");
                    }}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <title>Profile</title>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Profile
                  </button>

                  {/* Settings */}
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-sm text-left text-white/80 hover:bg-white/5 active:bg-white/10 rounded-lg transition-colors flex items-center gap-3 touch-manipulation"
                    onClick={() => {
                      setSheetOpen(false);
                      openSettings();
                    }}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <title>Settings</title>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>

                  {platformIsDeveloper && (
                    <button
                      type="button"
                      className="w-full px-3 py-2.5 text-sm text-left text-white/80 hover:bg-white/5 active:bg-white/10 rounded-lg transition-colors flex items-center gap-3 touch-manipulation"
                      onClick={() => {
                        setSheetOpen(false);
                        router.push("/developers");
                      }}
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <title>Developer Portal</title>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      Developer Portal
                    </button>
                  )}

                  {platformIsStaff && (
                    <button
                      type="button"
                      className="w-full px-3 py-2.5 text-sm text-left text-white/80 hover:bg-white/5 active:bg-white/10 rounded-lg transition-colors flex items-center gap-3 touch-manipulation"
                      onClick={() => {
                        setSheetOpen(false);
                        openSettings("admin");
                      }}
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <title>Admin Panel</title>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Admin Panel
                    </button>
                  )}

                  {/* Status divider */}
                  <div className="h-px bg-white/10 my-1.5 mx-1" />

                  {/* Status options */}
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`w-full px-3 py-2.5 text-sm text-left hover:bg-white/5 active:bg-white/10 rounded-lg transition-colors flex items-center gap-3 touch-manipulation ${
                        user?.status === option.value ? "text-white bg-white/5" : "text-white/80"
                      }`}
                      onClick={() => handleSetStatus(option.value)}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: option.color }}
                      />
                      {option.label}
                      {user?.status === option.value && (
                        <svg className="w-3.5 h-3.5 ml-auto text-white/50 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}

                  {/* Logout divider */}
                  <div className="h-px bg-white/10 my-1.5 mx-1" />

                  {/* Log Out */}
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-sm text-left text-red-400 hover:bg-red-500/10 active:bg-red-500/20 rounded-lg transition-colors flex items-center gap-3 touch-manipulation"
                    onClick={async () => {
                      setSheetOpen(false);
                      await performFullLogout();
                      router.push("/login");
                    }}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <title>Logout</title>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log Out
                  </button>
                </div>

                {/* Bottom safe area spacer */}
                <div style={{ height: "env(safe-area-inset-bottom)" }} />
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
