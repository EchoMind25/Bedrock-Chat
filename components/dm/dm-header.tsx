"use client";

import { Avatar } from "@/components/ui/avatar/avatar";
import { Badge } from "@/components/ui/badge/badge";
import type { DirectMessage } from "@/lib/types/dm";

interface DMHeaderProps {
	dm: DirectMessage;
}

export function DMHeader({ dm }: DMHeaderProps) {
	// Get the other participant (not the current user)
	const otherParticipant = dm.participants.find((p) => p.userId !== "current-user-id");
	if (!otherParticipant) return null;

	const statusText =
		otherParticipant.status === "online"
			? "Online"
			: otherParticipant.status === "idle"
				? "Idle"
				: otherParticipant.status === "dnd"
					? "Do Not Disturb"
					: "Offline";

	return (
		<div className="h-12 px-4 flex items-center justify-between border-b border-white/10 bg-[oklch(0.14_0.02_250)]">
			<div className="flex items-center gap-3">
				{/* Avatar */}
				<Avatar
					src={otherParticipant.avatar}
					fallback={otherParticipant.displayName.slice(0, 2)}
					status={
						otherParticipant.status === "idle"
							? "away"
							: otherParticipant.status === "dnd"
								? "busy"
								: otherParticipant.status
					}
					size="sm"
				/>

				{/* User Info */}
				<div className="flex flex-col">
					<h2 className="font-semibold text-white text-sm">
						{otherParticipant.displayName}
					</h2>
					<p className="text-xs text-white/50">{statusText}</p>
				</div>
			</div>

			{/* E2E Encryption Badge */}
			<div className="flex items-center gap-2">
				<Badge variant="success" className="flex items-center gap-1.5">
					<svg
						className="w-3 h-3"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<title>Encrypted</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
						/>
					</svg>
					<span className="text-[10px]">E2E Encrypted</span>
				</Badge>

				{/* Actions */}
				<button
					type="button"
					className="p-2 rounded hover:bg-white/5 transition-colors text-white/60 hover:text-white"
					onClick={() => {
						// TODO: Implement voice call
						console.log("Start voice call");
					}}
				>
					<svg
						className="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<title>Voice Call</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
						/>
					</svg>
				</button>

				<button
					type="button"
					className="p-2 rounded hover:bg-white/5 transition-colors text-white/60 hover:text-white"
					onClick={() => {
						// TODO: Implement video call
						console.log("Start video call");
					}}
				>
					<svg
						className="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<title>Video Call</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
						/>
					</svg>
				</button>
			</div>
		</div>
	);
}
