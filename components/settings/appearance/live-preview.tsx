"use client";

import { cn } from "@/lib/utils/cn";

interface LivePreviewProps {
	accentColor: string;
	fontFamily: string;
	messageFontSize: string;
	messageStyle: "flat" | "bubble" | "minimal";
	messageDensity: "compact" | "default" | "spacious";
	lineHeight: string;
	showAvatars: boolean;
	showTimestamps: boolean;
	chatBackground: string | null;
	timestampFormat: string;
}

const FONT_MAP: Record<string, string> = {
	system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
	inter: '"Inter", sans-serif',
	"sf-pro": '"SF Pro Display", -apple-system, sans-serif',
	"jetbrains-mono": '"JetBrains Mono", monospace',
	merriweather: '"Merriweather", serif',
	opendyslexic: '"OpenDyslexic", sans-serif',
};

const SIZE_MAP: Record<string, string> = {
	small: "0.8rem",
	medium: "0.875rem",
	large: "0.95rem",
};

const LH_MAP: Record<string, string> = {
	tight: "1.3",
	normal: "1.5",
	relaxed: "1.8",
};

const DENSITY_GAP: Record<string, string> = {
	compact: "2px",
	default: "8px",
	spacious: "14px",
};

const MOCK_MESSAGES = [
	{
		id: 1,
		user: "Alex",
		avatar: "A",
		avatarColor: "oklch(0.65 0.20 240)",
		text: "Hey, has anyone tried the new settings yet?",
		time: "2:14 PM",
		own: false,
	},
	{
		id: 2,
		user: "Jordan",
		avatar: "J",
		avatarColor: "oklch(0.65 0.20 155)",
		text: "Yeah! The color picker is really smooth",
		time: "2:15 PM",
		own: false,
	},
	{
		id: 3,
		user: "You",
		avatar: "Y",
		avatarColor: "oklch(0.65 0.25 265)",
		text: "I love the new bubble style!",
		time: "2:16 PM",
		own: true,
	},
];

function formatTime(time: string, format: string): string {
	if (format === "24h") return time.replace(" PM", "").replace(" AM", "");
	if (format === "relative") return "just now";
	if (format === "full") return `Today at ${time}`;
	return time;
}

export function LivePreview({
	accentColor,
	fontFamily,
	messageFontSize,
	messageStyle,
	messageDensity,
	lineHeight,
	showAvatars,
	showTimestamps,
	chatBackground,
	timestampFormat,
}: LivePreviewProps) {
	const isBubble = messageStyle === "bubble";
	const isMinimal = messageStyle === "minimal";

	return (
		<div
			className="rounded-xl border border-white/10 overflow-hidden bg-[oklch(0.14_0.02_250)]"
			style={{
				fontFamily: FONT_MAP[fontFamily] ?? FONT_MAP.system,
				fontSize: SIZE_MAP[messageFontSize] ?? SIZE_MAP.medium,
				lineHeight: LH_MAP[lineHeight] ?? LH_MAP.normal,
			}}
		>
			{/* Channel header */}
			<div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-white/[0.02]">
				<span className="text-slate-500 text-xs">#</span>
				<span className="text-xs font-semibold text-slate-200">preview-channel</span>
			</div>

			{/* Messages area */}
			<div
				className="p-3 space-y-0"
				style={{
					background: chatBackground || undefined,
					gap: DENSITY_GAP[messageDensity],
					display: "flex",
					flexDirection: "column",
				}}
			>
				{MOCK_MESSAGES.map((msg) => (
					<div
						key={msg.id}
						className={cn(
							"flex gap-2",
							isBubble && msg.own && "justify-end",
						)}
						style={{ marginTop: DENSITY_GAP[messageDensity] }}
					>
						{/* Avatar */}
						{showAvatars && !isBubble && (
							<div
								className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
								style={{ backgroundColor: msg.avatarColor }}
							>
								{msg.avatar}
							</div>
						)}

						{/* Content */}
						<div
							className={cn(
								"min-w-0",
								isBubble && "max-w-[80%]",
							)}
						>
							{/* Username + timestamp (flat/minimal only) */}
							{!isBubble && (
								<div className="flex items-baseline gap-2">
									<span
										className="text-[11px] font-semibold"
										style={{ color: msg.own ? accentColor : msg.avatarColor }}
									>
										{msg.user}
									</span>
									{showTimestamps && (
										<span className="text-[9px] text-slate-500">
											{formatTime(msg.time, timestampFormat)}
										</span>
									)}
								</div>
							)}

							{/* Message body */}
							<div
								className={cn(
									"message-content-wrapper",
									msg.own && "own-message",
									isBubble && "rounded-2xl px-3 py-1.5",
									isMinimal && "py-0.5",
									!isBubble && !isMinimal && "py-0.5",
								)}
								style={{
									...(isBubble
										? {
												backgroundColor: msg.own
													? accentColor
													: "oklch(0.18 0.02 250 / 0.6)",
												color: msg.own ? "white" : "oklch(0.88 0.01 250)",
											}
										: {}),
								}}
							>
								<p className={cn(
									"text-slate-200",
									isBubble && msg.own && "text-white",
								)}>
									{msg.text}
								</p>
							</div>

							{/* Bubble timestamp */}
							{isBubble && showTimestamps && (
								<span className={cn(
									"text-[9px] text-slate-500 mt-0.5 block",
									msg.own && "text-right",
								)}>
									{formatTime(msg.time, timestampFormat)}
								</span>
							)}
						</div>
					</div>
				))}
			</div>

			{/* Mock input bar */}
			<div className="px-3 py-2 border-t border-white/5">
				<div
					className="rounded-lg px-3 py-2 text-[11px] text-slate-500"
					style={{
						backgroundColor: "oklch(0.18 0.02 250 / 0.5)",
						borderColor: "oklch(0.25 0.02 250 / 0.3)",
						borderWidth: 1,
					}}
				>
					Message #preview-channel
				</div>
			</div>
		</div>
	);
}
