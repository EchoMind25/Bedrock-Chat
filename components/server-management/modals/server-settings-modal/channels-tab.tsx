"use client";

import { Hash, Volume2, Megaphone, GripVertical } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../../../lib/utils/cn";
import type { Server, Channel, ChannelCategory } from "../../../../lib/types/server";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ChannelsTabProps {
  server: Server;
  onChannelReorder: (channelIds: string[]) => void;
}

function SortableChannelItem({ channel }: { channel: Channel }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: channel.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = channel.type === "voice" ? Volume2 : channel.type === "announcement" ? Megaphone : Hash;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors",
        isDragging && "opacity-50",
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-white/40" />
      </div>

      <Icon className="w-4 h-4 text-white/60" />

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{channel.name}</div>
        <div className="text-xs text-white/60 capitalize">{channel.type} Channel</div>
      </div>

      {channel.isNsfw && (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">
          NSFW
        </span>
      )}
    </motion.div>
  );
}

export function ChannelsTab({ server, onChannelReorder }: ChannelsTabProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const channelIds = server.channels.map((ch) => ch.id);
      const oldIndex = channelIds.indexOf(active.id as string);
      const newIndex = channelIds.indexOf(over.id as string);

      const reorderedIds = arrayMove(channelIds, oldIndex, newIndex);
      onChannelReorder(reorderedIds);
    }
  };

  // Group channels by category
  const channelsByCategory = server.categories.reduce(
    (acc, category) => {
      acc[category.id] = server.channels.filter((ch) => ch.categoryId === category.id);
      return acc;
    },
    {} as Record<string, Channel[]>,
  );

  const uncategorizedChannels = server.channels.filter((ch) => !ch.categoryId);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Channels</h3>
        <p className="text-sm text-white/60">
          Manage and reorder your server's channels
        </p>
      </div>

      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <p className="text-sm text-blue-200">
          <strong>Drag and drop</strong> channels to reorder them. You can also manage channels
          from the channel list or by clicking the settings icon next to each channel.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          {/* Categorized channels */}
          {server.categories.map((category) => {
            const channels = channelsByCategory[category.id] || [];
            if (channels.length === 0) return null;

            return (
              <div key={category.id} className="space-y-2">
                <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                  {category.name}
                </h4>
                <SortableContext
                  items={channels.map((ch) => ch.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {channels.map((channel) => (
                      <SortableChannelItem key={channel.id} channel={channel} />
                    ))}
                  </div>
                </SortableContext>
              </div>
            );
          })}

          {/* Uncategorized channels */}
          {uncategorizedChannels.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                Uncategorized
              </h4>
              <SortableContext
                items={uncategorizedChannels.map((ch) => ch.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {uncategorizedChannels.map((channel) => (
                    <SortableChannelItem key={channel.id} channel={channel} />
                  ))}
                </div>
              </SortableContext>
            </div>
          )}
        </div>
      </DndContext>
    </div>
  );
}
