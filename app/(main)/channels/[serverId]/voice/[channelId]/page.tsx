"use client";

import { use, useEffect } from "react";
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
  const setCurrentServer = useServerStore((state) => state.setCurrentServer);
  const setCurrentChannel = useServerStore((state) => state.setCurrentChannel);
  const servers = useServerStore((state) => state.servers);
  const isInitialized = useServerStore((state) => state.isInitialized);

  // Update Zustand store when route changes (wrapped in useEffect)
  useEffect(() => {
    if (serverId && channelId) {
      setCurrentServer(serverId);
      setCurrentChannel(channelId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId, channelId]); // Exclude store actions - stable Zustand actions

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
