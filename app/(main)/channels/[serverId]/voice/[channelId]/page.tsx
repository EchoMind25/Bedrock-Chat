"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VoiceChannel, type Participant } from "@/components/voice/voice-channel";
import { useServerStore } from "@/store/server.store";

interface VoiceChannelPageProps {
  params: Promise<{
    serverId: string;
    channelId: string;
  }>;
}

// Mock participants data
const mockParticipants: Participant[] = [
  {
    id: "user-1",
    username: "Alex Chen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    isSpeaking: true,
    isMuted: false,
    isVideoOff: true,
    isDeafened: false,
  },
  {
    id: "user-2",
    username: "Sarah Miller",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    isSpeaking: false,
    isMuted: true,
    isVideoOff: true,
    isDeafened: false,
  },
  {
    id: "user-3",
    username: "Jordan Taylor",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan",
    isSpeaking: false,
    isMuted: false,
    isVideoOff: false,
    isDeafened: false,
  },
  {
    id: "user-4",
    username: "Morgan Lee",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan",
    isSpeaking: false,
    isMuted: false,
    isVideoOff: true,
    isDeafened: false,
  },
  {
    id: "user-5",
    username: "Casey Kim",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Casey",
    isSpeaking: true,
    isMuted: false,
    isVideoOff: true,
    isDeafened: false,
  },
];

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
      participants={mockParticipants}
      onLeave={handleLeave}
    />
  );
}
