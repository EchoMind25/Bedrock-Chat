'use client';

import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { useServerEmojiStore } from '@/store/server-emoji.store';
import { useServerStore } from '@/store/server.store';
import { formatCustomEmoji } from '@/lib/types/server-emoji';

interface ServerEmojiCategoryProps {
  onSelect: (emoji: string) => void;
  searchQuery?: string;
}

export function ServerEmojiCategory({ onSelect, searchQuery }: ServerEmojiCategoryProps) {
  const currentServerId = useServerStore((s) => s.currentServerId);
  const getServerEmojis = useServerEmojiStore((s) => s.getServerEmojis);
  const searchEmojis = useServerEmojiStore((s) => s.searchEmojis);
  const loadEmojis = useServerEmojiStore((s) => s.loadEmojis);
  const isLoading = useServerEmojiStore((s) => s.isLoading);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (currentServerId && !loaded) {
      loadEmojis(currentServerId);
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentServerId, loaded]);

  if (!currentServerId) return null;

  const emojis = searchQuery
    ? searchEmojis(currentServerId, searchQuery)
    : getServerEmojis(currentServerId);

  if (emojis.length === 0 && !isLoading) return null;

  return (
    <div>
      <div className="px-2 py-1.5 text-xs font-semibold text-white/50 uppercase tracking-wider">
        Server Emojis
      </div>
      {isLoading ? (
        <div className="px-2 py-4 text-center text-sm text-white/40">
          Loading...
        </div>
      ) : (
        <div className="grid grid-cols-8 gap-1 px-2">
          {emojis.map((emoji) => (
            <motion.button
              key={emoji.id}
              onClick={() => onSelect(formatCustomEmoji(emoji.name, emoji.id))}
              className="aspect-square flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors relative group"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              title={`:${emoji.name}:`}
            >
              <img
                src={emoji.imageUrl}
                alt={emoji.name}
                className="w-7 h-7 object-contain"
                loading="lazy"
              />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-black/90 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                :{emoji.name}:
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
