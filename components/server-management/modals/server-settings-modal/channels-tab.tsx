"use client";

import { useState, useMemo } from "react";
import { Hash, Volume2, Megaphone, GripVertical, Plus } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "../../../ui/button/button";
import { useServerManagementStore } from "../../../../store/server-management.store";
import { cn } from "../../../../lib/utils/cn";
import type { Server, Channel, ChannelCategory } from "../../../../lib/types/server";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
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
  onChannelReorder: (channels: Channel[]) => void;
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
        isDragging && "opacity-50 scale-105 z-10",
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

function ChannelDragPreview({ channel }: { channel: Channel }) {
  const Icon = channel.type === "voice" ? Volume2 : channel.type === "announcement" ? Megaphone : Hash;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-blue-500/50 bg-slate-800/90 shadow-lg shadow-blue-500/20">
      <GripVertical className="w-4 h-4 text-slate-400" />
      <div className="p-1.5 rounded-md bg-slate-800/50">
        <Icon className="w-4 h-4 text-slate-300" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-slate-100 truncate">{channel.name}</div>
        <div className="text-xs text-slate-400 capitalize">{channel.type} Channel</div>
      </div>
    </div>
  );
}

function DroppableCategory({
  category,
  channels,
  isOver,
  children,
}: {
  category: ChannelCategory | null;
  channels: Channel[];
  isOver: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id: category ? `category:${category.id}` : "category:uncategorized",
  });

  return (
    <div ref={setNodeRef} className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {category?.name || "Uncategorized"}
        </h4>
        <span className="text-xs text-slate-500">
          {channels.length} {channels.length === 1 ? "channel" : "channels"}
        </span>
      </div>
      <div
        className={cn(
          "min-h-[48px] rounded-lg transition-colors",
          isOver && "bg-blue-500/10 border-2 border-dashed border-blue-500/30",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function ChannelsTab({ server, onChannelReorder }: ChannelsTabProps) {
  const openCreateChannel = useServerManagementStore((state) => state.openCreateChannel);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overCategoryId, setOverCategoryId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Build ordered channel list: grouped by category, then uncategorized
  const orderedChannels = useMemo(() => {
    const result: Channel[] = [];
    for (const category of server.categories) {
      const catChannels = server.channels
        .filter((ch) => ch.categoryId === category.id)
        .sort((a, b) => a.position - b.position);
      result.push(...catChannels);
    }
    const uncategorized = server.channels
      .filter((ch) => !ch.categoryId)
      .sort((a, b) => a.position - b.position);
    result.push(...uncategorized);
    return result;
  }, [server.channels, server.categories]);

  const channelsByCategory = useMemo(() => {
    const grouped: Record<string, Channel[]> = {};
    for (const category of server.categories) {
      grouped[category.id] = server.channels
        .filter((ch) => ch.categoryId === category.id)
        .sort((a, b) => a.position - b.position);
    }
    return grouped;
  }, [server.channels, server.categories]);

  const uncategorizedChannels = useMemo(
    () => server.channels.filter((ch) => !ch.categoryId).sort((a, b) => a.position - b.position),
    [server.channels],
  );

  const activeChannel = activeId ? server.channels.find((ch) => ch.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverCategoryId(null);
      return;
    }

    const overId = over.id as string;

    // If hovering over a category droppable
    if (overId.startsWith("category:")) {
      setOverCategoryId(overId.replace("category:", ""));
      return;
    }

    // If hovering over a channel, find its category
    const overChannel = server.channels.find((ch) => ch.id === overId);
    if (overChannel) {
      setOverCategoryId(overChannel.categoryId || "uncategorized");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverCategoryId(null);

    if (!over) return;

    const activeChannelId = active.id as string;
    const overId = over.id as string;

    // Find the dragged channel
    const draggedChannel = server.channels.find((ch) => ch.id === activeChannelId);
    if (!draggedChannel) return;

    // Determine target category
    let targetCategoryId: string | undefined;
    if (overId.startsWith("category:")) {
      const catId = overId.replace("category:", "");
      targetCategoryId = catId === "uncategorized" ? undefined : catId;
    } else {
      // Dropped on another channel - take that channel's category
      const overChannel = server.channels.find((ch) => ch.id === overId);
      if (overChannel) {
        targetCategoryId = overChannel.categoryId;
      }
    }

    // Build new channel list with updated categoryId and positions
    let updatedChannels = server.channels.map((ch) =>
      ch.id === activeChannelId
        ? { ...ch, categoryId: targetCategoryId }
        : ch,
    );

    // Reorder within the all-channels list
    const allIds = orderedChannels.map((ch) => ch.id);
    const oldIndex = allIds.indexOf(activeChannelId);

    if (overId.startsWith("category:")) {
      // Dropped on an empty category zone - move to end of that category's channels
      const catChannels = updatedChannels.filter((ch) =>
        targetCategoryId ? ch.categoryId === targetCategoryId : !ch.categoryId,
      );
      // Channel is already updated with new categoryId, just reposition
      const otherChannels = updatedChannels.filter((ch) => ch.id !== activeChannelId);
      // Find insertion point: after last channel of target category
      const lastCatChannel = catChannels.filter((ch) => ch.id !== activeChannelId).pop();
      const insertAfter = lastCatChannel ? otherChannels.indexOf(lastCatChannel) : -1;
      otherChannels.splice(insertAfter + 1, 0, updatedChannels.find((ch) => ch.id === activeChannelId)!);
      updatedChannels = otherChannels;
    } else if (active.id !== over.id) {
      // Dropped on a channel - reorder in the flat list
      const newAllIds = orderedChannels.map((ch) => ch.id);
      const newIndex = newAllIds.indexOf(overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedIds = arrayMove(newAllIds, oldIndex, newIndex);
        const channelMap = new Map(updatedChannels.map((ch) => [ch.id, ch]));
        updatedChannels = reorderedIds.map((id) => channelMap.get(id)!).filter(Boolean);
      }
    }

    // Assign positions per category
    const positionCounters: Record<string, number> = {};
    const finalChannels = updatedChannels.map((ch) => {
      const key = ch.categoryId || "__uncategorized__";
      positionCounters[key] = (positionCounters[key] || 0);
      const position = positionCounters[key];
      positionCounters[key]++;
      return { ...ch, position };
    });

    onChannelReorder(finalChannels);
  };

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
          <strong className="text-blue-200">Drag and drop</strong> channels to reorder them or move them between categories.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedChannels.map((ch) => ch.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-6">
            {/* Categorized channels */}
            {server.categories.map((category) => {
              const channels = channelsByCategory[category.id] || [];
              const isOver = overCategoryId === category.id;

              return (
                <DroppableCategory
                  key={category.id}
                  category={category}
                  channels={channels}
                  isOver={isOver}
                >
                  {channels.length === 0 ? (
                    <div className="p-6 rounded-lg border-2 border-dashed border-slate-700/30 bg-slate-800/10 text-center">
                      <p className="text-sm text-slate-400">No channels in this category yet</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Drag channels here or create a new one
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {channels.map((channel) => (
                        <SortableChannelItem key={channel.id} channel={channel} />
                      ))}
                    </div>
                  )}
                </DroppableCategory>
              );
            })}

            {/* Uncategorized channels */}
            {(uncategorizedChannels.length > 0 || activeId) && (
              <DroppableCategory
                category={null}
                channels={uncategorizedChannels}
                isOver={overCategoryId === "uncategorized"}
              >
                {uncategorizedChannels.length === 0 ? (
                  <div className="p-6 rounded-lg border-2 border-dashed border-slate-700/30 bg-slate-800/10 text-center">
                    <p className="text-sm text-slate-400">Drop channels here to uncategorize</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {uncategorizedChannels.map((channel) => (
                      <SortableChannelItem key={channel.id} channel={channel} />
                    ))}
                  </div>
                )}
              </DroppableCategory>
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
        </SortableContext>

        <DragOverlay>
          {activeChannel ? <ChannelDragPreview channel={activeChannel} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
