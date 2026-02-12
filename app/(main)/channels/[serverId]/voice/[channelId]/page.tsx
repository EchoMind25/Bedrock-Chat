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
  const setCurrentChannel = useServerStore((state) => state.setCurrentChannel);
  const getCurrentChannel = useServerStore((state) => state.getCurrentChannel);

  // Update Zustand store when route changes (wrapped in useEffect)
  useEffect(() => {
    if (channelId) {
      setCurrentChannel(channelId);
    }
  }, [channelId, setCurrentChannel]);

  const currentChannel = getCurrentChannel();
  const channelName = currentChannel?.name || "Voice Channel";

  const handleLeave = () => {
    // Navigate back to the text channel version of the same server/channel
    router.push(`/servers/${serverId}/${channelId}`);
  };

  return (
    <VoiceChannel
      channelName={channelName}
      participants={[]}
      onLeave={handleLeave}
    />
  );
}
