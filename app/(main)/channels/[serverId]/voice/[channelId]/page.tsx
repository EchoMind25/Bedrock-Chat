"use client";

import { use, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { VoiceChannel } from "@/components/voice/voice-channel";
import { useServerStore } from "@/store/server.store";

interface VoiceChannelPageProps {
  params: Promise<{
    serverId: string;
    channelId: string;
  }>;
}

export default function VoiceChannelPage({ params }: VoiceChannelPageProps) {
  const { serverId, channelId } = use(params);
  const router = useRouter();
  const mountedRef = useRef(false); // Race condition guard

  const setCurrentServer = useServerStore((state) => state.setCurrentServer);
  const setCurrentChannel = useServerStore((state) => state.setCurrentChannel);
  const servers = useServerStore((state) => state.servers);
  const isInitialized = useServerStore((state) => state.isInitialized);

  // Track mounting state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Update Zustand store when route changes (wrapped in useEffect)
  useEffect(() => {
    // Guard against rapid unmount
    if (!mountedRef.current) return;

    if (serverId && channelId) {
      setCurrentServer(serverId);
      setCurrentChannel(channelId);
    }
  // Exclude store actions - stable Zustand actions
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId, channelId]);

  // Look up channel from params directly to avoid race conditions
  const server = servers.find((s) => s.id === serverId);
  const currentChannel = server?.channels.find((c) => c.id === channelId);
  const channelName = currentChannel?.name || "Voice Channel";

  if (!isInitialized) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[oklch(0.14_0.02_250)]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLeave = () => {
    // Guard against double-leave during unmount
    if (!mountedRef.current) return;

    // Replace (not push) so back button doesn't return to dead voice channel
    const textChannel = server?.channels.find((c) => c.type === "text");
    if (textChannel) {
      router.replace(`/servers/${serverId}/${textChannel.id}`);
    } else {
      router.replace(`/servers/${serverId}/${channelId}`);
    }
  };

  return (
    <VoiceChannel
      channelId={channelId}
      channelName={channelName}
      serverId={serverId}
      onLeave={handleLeave}
    />
  );
}
