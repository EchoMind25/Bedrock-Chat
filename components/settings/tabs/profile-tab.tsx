"use client";

import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { usePresenceStore } from "@/store/presence.store";
import type { UserStatus } from "@/store/auth.store";
import { Avatar } from "@/components/ui/avatar/avatar";
import type { AvatarStatus } from "@/components/ui/avatar/avatar";
import { Input, Textarea } from "@/components/ui/input/input";
import { SettingsSection } from "../settings-section";
import { uploadProfileImage } from "@/lib/upload-profile-image";
import { toast } from "@/lib/stores/toast-store";

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
  { value: "invisible", label: "Invisible", color: "oklch(0.50 0.01 250)" },
];

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function ProfileTab() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const setPresenceStatus = usePresenceStore((s) => s.setStatus);

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const avatarStatus = statusToAvatar[user.status] || "online";

  const handleDisplayNameBlur = () => {
    const trimmed = displayName.trim();
    if (trimmed && trimmed !== user.displayName) {
      updateUser({ displayName: trimmed });
    }
  };

  const handleBioBlur = () => {
    const trimmed = bio.trim();
    updateUser({ bio: trimmed });
  };

  const handleStatusChange = (status: UserStatus) => {
    updateUser({ status });
    setPresenceStatus(status);
  };

  const handleFileSelect = async (
    file: File | undefined,
    type: "avatar" | "banner"
  ) => {
    if (!file) return;

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(
        "Invalid File",
        "Please upload a JPEG, PNG, WebP, or GIF image"
      );
      return;
    }

    // Validate size
    const maxSize = type === "avatar" ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(
        "File Too Large",
        `Maximum size is ${type === "avatar" ? "2MB" : "5MB"}`
      );
      return;
    }

    // Show local preview immediately
    const previewUrl = URL.createObjectURL(file);
    if (type === "avatar") {
      setAvatarPreview(previewUrl);
      setIsUploadingAvatar(true);
    } else {
      setBannerPreview(previewUrl);
      setIsUploadingBanner(true);
    }

    try {
      const url = await uploadProfileImage(file, type);

      // Update local state
      if (type === "avatar") {
        updateUser({ avatar: url });
      } else {
        updateUser({ banner: url });
      }

      toast.success("Upload Complete", `Your ${type} has been updated`);
    } catch (err) {
      // Revert preview on failure
      if (type === "avatar") {
        setAvatarPreview(null);
      } else {
        setBannerPreview(null);
      }

      toast.error(
        "Upload Failed",
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      if (type === "avatar") {
        setIsUploadingAvatar(false);
      } else {
        setIsUploadingBanner(false);
      }

      // Clean up the object URL
      URL.revokeObjectURL(previewUrl);

      // Reset the input so selecting the same file again triggers onChange
      if (type === "avatar" && avatarInputRef.current) {
        avatarInputRef.current.value = "";
      } else if (bannerInputRef.current) {
        bannerInputRef.current.value = "";
      }
    }
  };

  const bannerSrc = bannerPreview || user.banner || null;
  const avatarSrc = avatarPreview || user.avatar || undefined;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your public profile
        </p>
      </div>

      {/* Profile Banner + Avatar */}
      <div className="rounded-xl overflow-hidden border border-white/10">
        {/* Banner — clickable upload area */}
        <div
          className="h-28 relative group cursor-pointer"
          onClick={() => bannerInputRef.current?.click()}
        >
          {bannerSrc ? (
            <img
              src={bannerSrc}
              alt="Profile banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/40 via-purple-500/30 to-blue-500/40" />
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {isUploadingBanner ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <div className="flex items-center gap-2 text-white text-sm font-medium">
                <Camera className="w-5 h-5" />
                <span>Change Banner</span>
              </div>
            )}
          </div>

          <input
            ref={bannerInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0], "banner")}
          />
        </div>

        {/* Avatar + user info */}
        <div className="p-4 bg-white/5 relative">
          {/* Avatar — clickable upload area */}
          <div
            className="absolute -top-10 left-4 group cursor-pointer"
            onClick={() => avatarInputRef.current?.click()}
          >
            <Avatar
              src={avatarSrc}
              fallback={user.displayName}
              status={avatarStatus}
              size="xl"
            />

            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {isUploadingAvatar ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </div>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0], "avatar")}
            />
          </div>

          <div className="ml-20 pt-2">
            <p className="font-semibold text-white">{user.displayName}</p>
            <p className="text-sm text-slate-400">@{user.username}</p>
          </div>
        </div>
      </div>

      <SettingsSection title="Profile Information">
        <div className="space-y-4">
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onBlur={handleDisplayNameBlur}
            helperText="This is how others see you"
          />
          <Textarea
            label="About Me"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            onBlur={handleBioBlur}
            helperText="Tell others a bit about yourself (190 characters max)"
            maxLength={190}
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Status">
        <div className="grid grid-cols-2 gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleStatusChange(option.value)}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                user.status === option.value
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-white/10 hover:border-white/20 hover:bg-white/5"
              }`}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: option.color }}
              />
              <span className="text-sm text-slate-200">{option.label}</span>
            </button>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}
