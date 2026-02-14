"use client";

import { useState } from "react";
import type { ChannelCategory as ChannelCategoryType } from "@/lib/types/server";
import { Plus, Edit, Trash2, GripVertical } from "lucide-react";
import { useServerManagementStore } from "@/store/server-management.store";
import { useServerStore } from "@/store/server.store";
import { motion } from "motion/react";

interface ChannelCategoryProps {
	category: ChannelCategoryType;
	isCollapsed: boolean;
	onToggle: () => void;
}

export function ChannelCategory({
	category,
	isCollapsed,
	onToggle,
}: ChannelCategoryProps) {
	// ✅ Use selector to subscribe only to specific value, not entire store
	const openCreateChannel = useServerManagementStore((state) => state.openCreateChannel);
	const updateCategory = useServerStore((s) => s.updateCategory);
	const deleteCategory = useServerStore((s) => s.deleteCategory);
	const currentServerId = useServerStore((s) => s.currentServerId);

	const [isEditing, setIsEditing] = useState(false);
	const [editName, setEditName] = useState(category.name);

	const handleRename = async () => {
		if (!currentServerId || !editName.trim()) return;

		try {
			await updateCategory(currentServerId, category.id, editName.trim());
			setIsEditing(false);
		} catch (err) {
			console.error("Error renaming category:", err);
		}
	};

	const handleDelete = async () => {
		if (!currentServerId) return;

		if (confirm(`Delete category "${category.name}"? Channels will be moved to uncategorized.`)) {
			try {
				await deleteCategory(currentServerId, category.id);
			} catch (err) {
				console.error("Error deleting category:", err);
			}
		}
	};

	return (
		<div className="relative w-full px-2 py-1 flex items-center gap-1 text-xs font-semibold text-white/60 hover:text-white/80 uppercase tracking-wide group">
			{/* Drag handle */}
			<GripVertical className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-60 cursor-grab" />

			{isEditing ? (
				<input
					type="text"
					value={editName}
					onChange={(e) => setEditName(e.target.value)}
					onBlur={handleRename}
					onKeyDown={(e) => {
						if (e.key === "Enter") handleRename();
						if (e.key === "Escape") {
							setEditName(category.name);
							setIsEditing(false);
						}
					}}
					className="flex-1 bg-white/10 px-2 py-1 rounded text-white outline-hidden focus:ring-2 focus:ring-blue-500"
					autoFocus
				/>
			) : (
				<motion.button
					type="button"
					onClick={onToggle}
					className="flex items-center gap-1 flex-1 min-w-0"
					variants={{
						hidden: { opacity: 0, x: -10 },
						visible: {
							opacity: 1,
							x: 0,
							transition: {
								type: "spring",
								stiffness: 260,
								damping: 20,
							},
						},
					}}
				>
					<motion.svg
						className="w-3 h-3 shrink-0"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						animate={{ rotate: isCollapsed ? -90 : 0 }}
						transition={{ duration: 0.2 }}
					>
						<title>{isCollapsed ? "Expand" : "Collapse"}</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={3}
							d="M19 9l-7 7-7-7"
						/>
					</motion.svg>
					<span className="truncate">{category.name}</span>
				</motion.button>
			)}

			{/* Actions */}
			<div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
				{/* Add Channel */}
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						openCreateChannel(category.id);
					}}
					className="p-0.5 hover:bg-white/10 rounded-sm transition-colors"
					aria-label="Create Channel"
				>
					<Plus className="w-3.5 h-3.5" />
				</button>

				{/* Edit Category */}
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						setIsEditing(true);
					}}
					className="p-0.5 hover:bg-white/10 rounded-sm transition-colors"
					aria-label="Edit Category"
				>
					<Edit className="w-3.5 h-3.5" />
				</button>

				{/* Delete Category */}
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						handleDelete();
					}}
					className="p-0.5 hover:bg-red-500/20 text-red-400 rounded-sm transition-colors"
					aria-label="Delete Category"
				>
					<Trash2 className="w-3.5 h-3.5" />
				</button>
			</div>
		</div>
	);
}
