"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, UserMinus, Ban, X, Phone, Video } from "lucide-react";
import { Avatar, type AvatarStatus } from "@/components/ui/avatar/avatar";
import { Button } from "@/components/ui/button/button";
import { useFriendsStore } from "@/store/friends.store";
import { useDMStore } from "@/store/dm.store";
import { usePresenceStore } from "@/store/presence.store";
import { useVoiceStore } from "@/store/voice.store";
import { toast } from "@/lib/stores/toast-store";
import type { Friend } from "@/lib/types/friend";

interface FriendProfileCardProps {
	friend: Friend;
	onClose: () => void;
}

function getAvatarStatus(status: string): AvatarStatus {
	switch (status) {
		case "online": return "online";
		case "idle": return "away";
		case "dnd": return "busy";
		default: return "offline";
	}
}

const STATUS_COLORS: Record<string, string> = {
	online: "text-green-400",
	idle: "text-yellow-400",
	dnd: "text-red-400",
	offline: "text-slate-400",
};

const STATUS_LABELS: Record<string, string> = {
	online: "Online",
	idle: "Idle",
	dnd: "Do Not Disturb",
	offline: "Offline",
};

export function FriendProfileCard({ friend, onClose }: FriendProfileCardProps) {
	const cardRef = useRef<HTMLDivElement>(null);
	const router = useRouter();
	const removeFriend = useFriendsStore((s) => s.removeFriend);
	const blockUser = useFriendsStore((s) => s.blockUser);
	const createDm = useDMStore((s) => s.createDm);

	const [isRemoving, setIsRemoving] = useState(false);

	// Live presence status
	const liveStatus = usePresenceStore((s) => {
		const presence = s.onlineUsers.get(friend.userId);
		return presence?.status ?? null;
	});

	const effectiveStatus = liveStatus ?? friend.status;

	// Close on outside click and Escape
	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
				onClose();
			}
		}
		function handleEscape(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		document.addEventListener("mousedown", handleClick);
		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("mousedown", handleClick);
			document.removeEventListener("keydown", handleEscape);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleMessage = () => {
		const dm = createDm(friend.userId);
		if (dm) {
			router.push(`/dms/${dm.id}`);
			onClose();
		}
	};

	const handleRemove = async () => {
		if (isRemoving) return;
		if (!confirm(`Remove ${friend.displayName} from friends?`)) return;
		setIsRemoving(true);
		await removeFriend(friend.id);
		onClose();
	};

	const handleBlock = async () => {
		if (!confirm(`Block ${friend.displayName}?`)) return;
		await blockUser(friend.userId);
		onClose();
	};

	const handleCall = useCallback(async (callType: "voice" | "video") => {
		const currentCallState = useVoiceStore.getState().callState;
		if (currentCallState !== "idle") {
			toast.error("Already in Call", "End your current call before starting a new one.");
			return;
		}

		try {
			const res = await fetch("/api/voice/direct/initiate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ calleeId: friend.userId, callType }),
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				toast.error("Call Failed", err.error || "Could not start call.");
				return;
			}

			const { callId, token, wsUrl, roomName } = await res.json();
			const store = useVoiceStore.getState();
			store.setActiveDirectCall({
				id: callId,
				callerId: "",
				calleeId: friend.userId,
				callerName: "",
				calleeName: friend.displayName,
				calleeAvatar: friend.avatar,
				roomName,
				callType,
				status: "ringing",
			});
			store.setDirectCallConnection(token, wsUrl);
			store.setCallState("outgoing_ringing");
			onClose();
		} catch {
			toast.error("Call Failed", "Could not start call. Check your connection.");
		}
	}, [friend.userId, friend.displayName, friend.avatar, onClose]);

	const friendSince = friend.createdAt instanceof Date
		? friend.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
		: "Unknown";

	return (
		<motion.div
			ref={cardRef}
			initial={{ opacity: 0, scale: 0.95, y: -4 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.95, y: -4 }}
			transition={{ duration: 0.15 }}
			className="w-72 bg-[oklch(0.16_0.02_250)] border border-white/10 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50"
		>
			{/* Banner */}
			<div className="h-16 relative">
				<div
					className="absolute inset-0 opacity-60"
					style={{
						background: "linear-gradient(135deg, oklch(0.4 0.15 265), oklch(0.3 0.12 240))",
					}}
				/>
				<button
					type="button"
					onClick={onClose}
					className="absolute top-2 right-2 p-1 rounded-full bg-black/30 hover:bg-black/50 text-white/70 hover:text-white transition-colors"
				>
					<X className="w-3.5 h-3.5" />
				</button>
			</div>

			{/* Avatar + Info */}
			<div className="px-4 -mt-8 pb-3">
				<div className="mb-3">
					<Avatar
						src={friend.avatar || undefined}
						fallback={friend.displayName?.[0]?.toUpperCase() || "?"}
						size="lg"
						status={getAvatarStatus(effectiveStatus)}
					/>
				</div>

				<div className="mb-1">
					<h3 className="text-base font-semibold text-white">
						{friend.displayName}
					</h3>
					<p className="text-xs text-white/50">@{friend.username}</p>
				</div>

				{/* Status + Custom Status */}
				<div className="flex items-center gap-2 mb-3">
					<span className={`text-xs font-medium ${STATUS_COLORS[effectiveStatus] || "text-slate-400"}`}>
						{STATUS_LABELS[effectiveStatus] || "Offline"}
					</span>
					{friend.customStatus && (
						<>
							<span className="text-white/20">·</span>
							<span className="text-xs text-white/50 truncate">{friend.customStatus}</span>
						</>
					)}
				</div>

				{/* Friend Since */}
				<div className="text-[10px] text-white/30 mb-3">
					Friends since {friendSince}
				</div>

				{/* Divider */}
				<div className="border-t border-white/10 my-3" />

				{/* Actions */}
				<div className="space-y-2">
					<Button
						size="sm"
						variant="primary"
						onClick={handleMessage}
						className="w-full gap-1.5 h-8 text-xs"
					>
						<MessageSquare className="w-3.5 h-3.5" />
						Send Message
					</Button>

					<div className="flex gap-2">
						<Button
							size="sm"
							variant="ghost"
							onClick={() => handleCall("voice")}
							className="flex-1 gap-1.5 h-8 text-xs text-green-400 hover:text-green-300"
						>
							<Phone className="w-3.5 h-3.5" />
							Call
						</Button>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => handleCall("video")}
							className="flex-1 gap-1.5 h-8 text-xs text-blue-400 hover:text-blue-300"
						>
							<Video className="w-3.5 h-3.5" />
							Video
						</Button>
					</div>

					<div className="flex gap-2">
						<Button
							size="sm"
							variant="ghost"
							onClick={handleRemove}
							disabled={isRemoving}
							className="flex-1 gap-1.5 h-8 text-xs"
						>
							<UserMinus className="w-3.5 h-3.5" />
							Remove
						</Button>
						<Button
							size="sm"
							variant="ghost"
							onClick={handleBlock}
							className="flex-1 gap-1.5 h-8 text-xs text-red-400 hover:text-red-300"
						>
							<Ban className="w-3.5 h-3.5" />
							Block
						</Button>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
