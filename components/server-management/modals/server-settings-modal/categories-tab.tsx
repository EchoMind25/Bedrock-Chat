"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, GripVertical, Folder } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../../../ui/button/button";
import { Input } from "../../../ui/input/input";
import { useServerStore } from "../../../../store/server.store";
import { cn } from "../../../../lib/utils/cn";
import type { Server, ChannelCategory } from "../../../../lib/types/server";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CategoriesTabProps {
	server: Server;
}

export function CategoriesTab({ server }: CategoriesTabProps) {
	const createCategory = useServerStore((s) => s.createCategory);
	const updateCategory = useServerStore((s) => s.updateCategory);
	const deleteCategory = useServerStore((s) => s.deleteCategory);
	const reorderCategories = useServerStore((s) => s.reorderCategories);

	const [isCreating, setIsCreating] = useState(false);
	const [newCategoryName, setNewCategoryName] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor)
	);

	const handleCreate = async () => {
		if (!newCategoryName.trim() || isLoading) return;

		setIsLoading(true);
		try {
			await createCategory(server.id, newCategoryName);
			setNewCategoryName("");
			setIsCreating(false);
		} catch (err) {
			console.error("Error creating category:", err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleUpdate = async (categoryId: string) => {
		if (!editName.trim() || isLoading) return;

		setIsLoading(true);
		try {
			await updateCategory(server.id, categoryId, editName);
			setEditingId(null);
		} catch (err) {
			console.error("Error updating category:", err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async (categoryId: string, categoryName: string) => {
		if (isLoading) return;

		const channelCount = server.channels.filter(ch => ch.categoryId === categoryId).length;
		const message = channelCount > 0
			? `Delete "${categoryName}"? ${channelCount} channel(s) will be moved to uncategorized.`
			: `Delete "${categoryName}"?`;

		if (!confirm(message)) return;

		setIsLoading(true);
		try {
			await deleteCategory(server.id, categoryId);
		} catch (err) {
			console.error("Error deleting category:", err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = server.categories.findIndex(c => c.id === active.id);
			const newIndex = server.categories.findIndex(c => c.id === over.id);

			const reordered = [...server.categories];
			const [moved] = reordered.splice(oldIndex, 1);
			reordered.splice(newIndex, 0, moved);

			const categoryIds = reordered.map(c => c.id);
			reorderCategories(server.id, categoryIds);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold text-slate-100">Channel Categories</h3>
					<p className="text-sm text-slate-300 mt-1">
						Organize your channels into custom categories
					</p>
				</div>
				<Button onClick={() => setIsCreating(!isCreating)} className="gap-1.5">
					<Plus className="w-4 h-4" />
					Create Category
				</Button>
			</div>

			{/* Create Category Form */}
			<AnimatePresence>
				{isCreating && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="overflow-hidden"
					>
						<div className="p-5 rounded-xl glass-card space-y-4">
							<h4 className="font-medium text-slate-100">Create New Category</h4>

							<Input
								label="Category Name"
								value={newCategoryName}
								onChange={(e) => setNewCategoryName(e.target.value)}
								placeholder="e.g., Important Channels"
								maxLength={50}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleCreate();
									if (e.key === "Escape") setIsCreating(false);
								}}
							/>

							<div className="flex items-center gap-2 pt-3 border-t border-slate-700/30">
								<Button
									onClick={handleCreate}
									loading={isLoading}
									disabled={!newCategoryName.trim()}
								>
									Create Category
								</Button>
								<Button variant="ghost" onClick={() => setIsCreating(false)}>
									Cancel
								</Button>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Categories List with Drag & Drop */}
			<div className="space-y-2">
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleDragEnd}
				>
					<SortableContext
						items={server.categories.map(c => c.id)}
						strategy={verticalListSortingStrategy}
					>
						<AnimatePresence>
							{server.categories.map((category) => (
								<SortableCategoryItem
									key={category.id}
									category={category}
									channelCount={server.channels.filter(ch => ch.categoryId === category.id).length}
									isEditing={editingId === category.id}
									editName={editName}
									onStartEdit={() => {
										setEditingId(category.id);
										setEditName(category.name);
									}}
									onUpdateName={setEditName}
									onSaveEdit={() => handleUpdate(category.id)}
									onCancelEdit={() => setEditingId(null)}
									onDelete={() => handleDelete(category.id, category.name)}
									isLoading={isLoading}
								/>
							))}
						</AnimatePresence>
					</SortableContext>
				</DndContext>

				{server.categories.length === 0 && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="glass-card rounded-xl p-12 text-center"
					>
						<div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
							<Folder className="w-10 h-10 text-slate-500" />
						</div>
						<h4 className="text-lg font-semibold text-slate-200 mb-2">
							No categories yet
						</h4>
						<p className="text-sm text-slate-400 mb-6">
							Create categories to organize your channels
						</p>
						<Button onClick={() => setIsCreating(true)} className="gap-1.5">
							<Plus className="w-4 h-4" />
							Create First Category
						</Button>
					</motion.div>
				)}
			</div>
		</div>
	);
}

interface SortableCategoryItemProps {
	category: ChannelCategory;
	channelCount: number;
	isEditing: boolean;
	editName: string;
	onStartEdit: () => void;
	onUpdateName: (name: string) => void;
	onSaveEdit: () => void;
	onCancelEdit: () => void;
	onDelete: () => void;
	isLoading: boolean;
}

function SortableCategoryItem({
	category,
	channelCount,
	isEditing,
	editName,
	onStartEdit,
	onUpdateName,
	onSaveEdit,
	onCancelEdit,
	onDelete,
	isLoading,
}: SortableCategoryItemProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: category.id
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<motion.div
			ref={setNodeRef}
			style={style}
			layout
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 10 }}
			className="p-4 rounded-xl glass-card hover:bg-white/5 transition-all"
		>
			<div className="flex items-center gap-3">
				{/* Drag Handle */}
				<div
					{...attributes}
					{...listeners}
					className="cursor-grab active:cursor-grabbing p-2 hover:bg-white/10 rounded-lg transition-colors"
				>
					<GripVertical className="w-5 h-5 text-white/40" />
				</div>

				{/* Category Info */}
				<div className="flex-1">
					{isEditing ? (
						<Input
							value={editName}
							onChange={(e) => onUpdateName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") onSaveEdit();
								if (e.key === "Escape") onCancelEdit();
							}}
							className="text-sm"
							autoFocus
						/>
					) : (
						<>
							<div className="font-medium text-slate-100">{category.name}</div>
							<div className="text-xs text-slate-400 mt-0.5">
								{channelCount} {channelCount === 1 ? "channel" : "channels"}
							</div>
						</>
					)}
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2">
					{isEditing ? (
						<>
							<Button size="sm" onClick={onSaveEdit} loading={isLoading}>
								Save
							</Button>
							<Button size="sm" variant="ghost" onClick={onCancelEdit}>
								Cancel
							</Button>
						</>
					) : (
						<>
							<Button
								size="sm"
								variant="ghost"
								onClick={onStartEdit}
								className="gap-1"
							>
								<Edit className="w-4 h-4" />
							</Button>
							<Button
								size="sm"
								variant="danger"
								onClick={onDelete}
								loading={isLoading}
								className="gap-1"
							>
								<Trash2 className="w-4 h-4" />
							</Button>
						</>
					)}
				</div>
			</div>
		</motion.div>
	);
}
