"use client";

import { Hash, Volume2, Megaphone, GripVertical, Plus } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "../../../ui/button/button";
import { useServerManagementStore } from "../../../../store/server-management.store";
import { cn } from "../../../../lib/utils/cn";
import type { Server, Channel } from "../../../../lib/types/server";
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
        "flex items-center gap-3 p-3 rounded-lg border border-slate-700/30 bg-slate-800/20 hover:bg-slate-800/40 hover:border-slate-600/40 transition-all",
        isDragging && "opacity-50",
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-slate-400" />
      </div>

      <div className="p-1.5 rounded-md bg-slate-800/50">
        <Icon className="w-4 h-4 text-slate-300" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-slate-100 truncate">{channel.name}</div>
        <div className="text-xs text-slate-400 capitalize">{channel.type} Channel</div>
      </div>

      {channel.isNsfw && (
        <span className="px-2 py-0.5 rounded-sm text-xs font-medium bg-red-500/20 text-red-300">
          NSFW
        </span>
      )}
    </motion.div>
  );
}

export function ChannelsTab({ server, onChannelReorder }: ChannelsTabProps) {
  const openCreateChannel = useServerManagementStore((state) => state.openCreateChannel);
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 mb-1">Channels</h3>
          <p className="text-sm text-slate-300">
            Manage and reorder your server&apos;s channels
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => openCreateChannel()}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Create Channel
        </Button>
      </div>

      <div className="p-3 rounded-lg glass-card">
        <p className="text-sm text-blue-300">
          <strong className="text-blue-200">Drag and drop</strong> channels to reorder them. You can also manage channels
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

            return (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    {category.name}
                  </h4>
                  <span className="text-xs text-slate-500">
                    {channels.length} {channels.length === 1 ? "channel" : "channels"}
                  </span>
                </div>
                <SortableContext
                  items={channels.map((ch) => ch.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {channels.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-6 rounded-lg border-2 border-dashed border-slate-700/30 bg-slate-800/10 text-center"
                    >
                      <p className="text-sm text-slate-400">No channels in this category yet</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Drag channels here or create a new one
                      </p>
                    </motion.div>
                  ) : (
                    <div className="space-y-2">
                      {channels.map((channel) => (
                        <SortableChannelItem key={channel.id} channel={channel} />
                      ))}
                    </div>
                  )}
                </SortableContext>
              </div>
            );
          })}

          {/* Uncategorized channels */}
          {uncategorizedChannels.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
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

          {/* Empty state */}
          {server.channels.length === 0 && (
            <div className="glass-card rounded-xl p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                <Hash className="w-8 h-8 text-slate-500" />
              </div>
              <h4 className="text-lg font-semibold text-slate-200 mb-2">No channels yet</h4>
              <p className="text-sm text-slate-400">Create channels to start organizing your server</p>
            </div>
          )}
        </div>
      </DndContext>
    </div>
  );
}
