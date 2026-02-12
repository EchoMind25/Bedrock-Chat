"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, Users, Shield } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../../../ui/button/button";
import { Input } from "../../../ui/input/input";
import { Toggle } from "../../../ui/toggle/toggle";
import { ColorPicker } from "../../role-editor/color-picker";
import { PermissionGrid } from "../../permission-grid/permission-grid";
import { cn } from "../../../../lib/utils/cn";
import type { Role } from "../../../../lib/types/permissions";
import { Permission } from "../../../../lib/types/permissions";
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

interface RolesTabProps {
  roles: Role[];
  onRoleCreate: (role: Omit<Role, "id">) => void;
  onRoleUpdate: (roleId: string, updates: Partial<Role>) => void;
  onRoleDelete: (roleId: string) => void;
  onRoleReorder: (roleIds: string[]) => void;
}

function SortableRoleItem({
  role,
  isSelected,
  onClick,
}: {
  role: Role;
  isSelected: boolean;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: role.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer",
        isSelected
          ? "glass-interactive bg-blue-600/15 border-blue-500/40 ring-1 ring-blue-500/20"
          : "border border-slate-700/30 hover:border-slate-600/40 hover:bg-slate-800/30",
        isDragging && "opacity-50",
      )}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-slate-400" />
      </div>

      <div
        className="w-3.5 h-3.5 rounded-full flex-shrink-0 ring-2 ring-slate-800/50"
        style={{ backgroundColor: role.color }}
      />

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-slate-100 truncate">{role.name}</div>
        <div className="text-xs text-slate-400 flex items-center gap-1">
          <Users className="w-3 h-3" />
          {role.memberCount} {role.memberCount === 1 ? "member" : "members"}
        </div>
      </div>

      {role.isDefault && (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-700/50 text-slate-300">
          DEFAULT
        </span>
      )}
    </motion.div>
  );
}

export function RolesTab({
  roles,
  onRoleCreate,
  onRoleUpdate,
  onRoleDelete,
  onRoleReorder,
}: RolesTabProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // New role form state
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleColor, setNewRoleColor] = useState("oklch(0.65 0.25 265)");
  const [newRolePermissions, setNewRolePermissions] = useState<number>(
    Permission.VIEW_CHANNELS | Permission.SEND_MESSAGES,
  );
  const [newRoleMentionable, setNewRoleMentionable] = useState(false);

  // Sort roles by position (highest first)
  const sortedRoles = [...roles].sort((a, b) => b.position - a.position);

  const selectedRole = selectedRoleId
    ? roles.find((r) => r.id === selectedRoleId)
    : null;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedRoles.findIndex((r) => r.id === active.id);
      const newIndex = sortedRoles.findIndex((r) => r.id === over.id);

      const reorderedRoles = arrayMove(sortedRoles, oldIndex, newIndex);
      onRoleReorder(reorderedRoles.map((r) => r.id));
    }
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) return;

    const maxPosition = Math.max(...roles.map((r) => r.position), 0);

    onRoleCreate({
      serverId: roles[0]?.serverId || "",
      name: newRoleName,
      color: newRoleColor,
      permissions: newRolePermissions,
      position: maxPosition + 1,
      mentionable: newRoleMentionable,
      memberCount: 0,
      isDefault: false,
      createdAt: new Date(),
    });

    // Reset form
    setNewRoleName("");
    setNewRoleColor("oklch(0.65 0.25 265)");
    setNewRolePermissions(Permission.VIEW_CHANNELS | Permission.SEND_MESSAGES);
    setNewRoleMentionable(false);
    setIsCreating(false);
  };

  const handleDeleteRole = () => {
    if (!selectedRole || selectedRole.isDefault) return;

    if (confirm(`Are you sure you want to delete the role "${selectedRole.name}"?`)) {
      onRoleDelete(selectedRole.id);
      setSelectedRoleId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Roles</h3>
          <p className="text-sm text-slate-300 mt-1">
            Manage server roles and permissions
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsCreating(true)}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Create Role
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6 h-[540px]">
        {/* Role List */}
        <div className="glass-card rounded-xl p-4 overflow-y-auto settings-scrollbar">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Server Roles &mdash; {sortedRoles.length}
          </h4>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedRoles.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {sortedRoles.map((role) => (
                  <SortableRoleItem
                    key={role.id}
                    role={role}
                    isSelected={selectedRoleId === role.id}
                    onClick={() => {
                      setSelectedRoleId(role.id);
                      setIsCreating(false);
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {sortedRoles.length === 0 && (
            <div className="text-center py-8">
              <Shield className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm text-slate-400">No roles yet</p>
            </div>
          )}
        </div>

        {/* Role Editor */}
        <div className="col-span-2 overflow-y-auto settings-scrollbar">
          <AnimatePresence mode="wait">
            {isCreating ? (
              <motion.div
                key="create"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card rounded-xl p-6 space-y-6"
              >
                <h3 className="text-lg font-semibold text-slate-100">Create Role</h3>

                <Input
                  label="Role Name"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="New Role"
                  maxLength={100}
                />

                <ColorPicker
                  label="Role Color"
                  value={newRoleColor}
                  onChange={setNewRoleColor}
                />

                <Toggle
                  checked={newRoleMentionable}
                  onChange={(e) => setNewRoleMentionable(e.target.checked)}
                  label="Allow anyone to @mention this role"
                />

                <div>
                  <h4 className="text-sm font-semibold text-slate-200 mb-3">Permissions</h4>
                  <PermissionGrid
                    permissions={newRolePermissions}
                    onChange={setNewRolePermissions}
                  />
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-700/30">
                  <Button onClick={handleCreateRole} disabled={!newRoleName.trim()}>
                    Create Role
                  </Button>
                  <Button variant="ghost" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </motion.div>
            ) : selectedRole ? (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card rounded-xl p-6 space-y-6"
              >
                {/* Role Display Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ring-2 ring-slate-700/50"
                      style={{ backgroundColor: selectedRole.color }}
                    >
                      {selectedRole.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100">{selectedRole.name}</h3>
                      <p className="text-xs text-slate-400">{selectedRole.memberCount} {selectedRole.memberCount === 1 ? "member" : "members"}</p>
                    </div>
                  </div>
                  {!selectedRole.isDefault && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleDeleteRole}
                      className="gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  )}
                </div>

                <Input
                  label="Role Name"
                  value={selectedRole.name}
                  onChange={(e) =>
                    onRoleUpdate(selectedRole.id, { name: e.target.value })
                  }
                  placeholder="Role Name"
                  maxLength={100}
                  disabled={selectedRole.isDefault}
                />

                <ColorPicker
                  label="Role Color"
                  value={selectedRole.color}
                  onChange={(color) => onRoleUpdate(selectedRole.id, { color })}
                />

                <Toggle
                  checked={selectedRole.mentionable}
                  onChange={(e) =>
                    onRoleUpdate(selectedRole.id, { mentionable: e.target.checked })
                  }
                  label="Allow anyone to @mention this role"
                  disabled={selectedRole.isDefault}
                />

                <div>
                  <h4 className="text-sm font-semibold text-slate-200 mb-3">Permissions</h4>
                  <PermissionGrid
                    permissions={selectedRole.permissions}
                    onChange={(permissions) =>
                      onRoleUpdate(selectedRole.id, { permissions })
                    }
                  />
                </div>

                {selectedRole.isDefault && (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-sm text-yellow-300">
                      The @everyone role applies to all members and cannot be deleted.
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card rounded-xl flex items-center justify-center h-full"
              >
                <div className="text-center p-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                    <Users className="w-10 h-10 text-slate-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-200 mb-2">
                    Select a role to edit
                  </h4>
                  <p className="text-sm text-slate-400">
                    Choose a role from the list to edit permissions and settings
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
