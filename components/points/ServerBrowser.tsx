"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePointsStore } from "@/store/points.store";
import { Glass } from "@/components/ui/glass/glass";
import type {
	DiscoverableServer,
	ServerCategory,
	ServerActivityLevel,
} from "@/lib/types/engagement";

// ── Mock discoverable servers ───────────────────────────────

const MOCK_SERVERS: DiscoverableServer[] = [
	{
		id: "disc-1",
		name: "Pixel Playground",
		description: "Retro gaming & pixel art community",
		icon: null,
		memberCount: 1247,
		activityLevel: "live",
		category: "gaming",
		tags: ["retro", "pixel-art", "speedrun"],
		themeColor: "oklch(0.65 0.2 25)",
		isJoined: false,
		createdAt: new Date("2025-11-01"),
	},
	{
		id: "disc-2",
		name: "Study Together",
		description: "Focused study sessions & accountability partners",
		icon: null,
		memberCount: 892,
		activityLevel: "moderate",
		category: "study",
		tags: ["pomodoro", "accountability", "college"],
		themeColor: "oklch(0.65 0.15 145)",
		isJoined: false,
		createdAt: new Date("2025-12-15"),
	},
	{
		id: "disc-3",
		name: "Synth Lounge",
		description: "Music production, synths, and beats",
		icon: null,
		memberCount: 3410,
		activityLevel: "live",
		category: "music",
		tags: ["production", "synth", "beats", "collab"],
		themeColor: "oklch(0.6 0.25 285)",
		isJoined: false,
		createdAt: new Date("2025-09-20"),
	},
	{
		id: "disc-4",
		name: "Frontend Craft",
		description: "CSS wizardry, React patterns, and web dev",
		icon: null,
		memberCount: 2103,
		activityLevel: "moderate",
		category: "tech",
		tags: ["react", "css", "typescript", "webdev"],
		themeColor: "oklch(0.65 0.2 220)",
		isJoined: false,
		createdAt: new Date("2025-10-05"),
	},
	{
		id: "disc-5",
		name: "Sketch & Chill",
		description: "Daily drawing prompts and art sharing",
		icon: null,
		memberCount: 678,
		activityLevel: "quiet",
		category: "art",
		tags: ["drawing", "digital-art", "prompts"],
		themeColor: "oklch(0.65 0.15 45)",
		isJoined: false,
		createdAt: new Date("2026-01-10"),
	},
	{
		id: "disc-6",
		name: "Board Game Night",
		description: "Virtual board games every weekend",
		icon: null,
		memberCount: 456,
		activityLevel: "quiet",
		category: "hobbies",
		tags: ["board-games", "tabletop", "weekend"],
		themeColor: "oklch(0.6 0.18 60)",
		isJoined: false,
		createdAt: new Date("2026-01-22"),
	},
	{
		id: "disc-7",
		name: "Vibe Tribe",
		description: "Chill hangouts and random convos",
		icon: null,
		memberCount: 5201,
		activityLevel: "live",
		category: "social",
		tags: ["chill", "voice", "hangout"],
		themeColor: "oklch(0.65 0.2 310)",
		isJoined: true,
		createdAt: new Date("2025-08-01"),
	},
	{
		id: "disc-8",
		name: "Indie Dev Hub",
		description: "Indie game development and playtesting",
		icon: null,
		memberCount: 1890,
		activityLevel: "moderate",
		category: "gaming",
		tags: ["gamedev", "indie", "playtesting"],
		themeColor: "oklch(0.6 0.22 150)",
		isJoined: false,
		createdAt: new Date("2025-10-30"),
	},
];

const CATEGORIES: { value: ServerCategory | "all"; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "gaming", label: "Gaming" },
	{ value: "study", label: "Study" },
	{ value: "tech", label: "Tech" },
	{ value: "music", label: "Music" },
	{ value: "art", label: "Art" },
	{ value: "hobbies", label: "Hobbies" },
	{ value: "social", label: "Social" },
];

/**
 * Discoverable server browser for finding new communities.
 * Awards points for browsing (once daily) and joining servers.
 */
export function ServerBrowser() {
	const isEnabled = usePointsStore((s) => s.isEnabled);
	const awardServerBrowsed = usePointsStore((s) => s.awardServerBrowsed);
	const awardServerJoined = usePointsStore((s) => s.awardServerJoined);

	const [search, setSearch] = useState("");
	const [category, setCategory] = useState<ServerCategory | "all">("all");
	const [servers, setServers] = useState(MOCK_SERVERS);
	const [hasBrowsed, setHasBrowsed] = useState(false);

	// Award browsing points once per session open
	if (!hasBrowsed && isEnabled) {
		setHasBrowsed(true);
		awardServerBrowsed();
	}

	const filtered = useMemo(() => {
		return servers.filter((s) => {
			if (category !== "all" && s.category !== category) return false;
			if (search) {
				const q = search.toLowerCase();
				return (
					s.name.toLowerCase().includes(q) ||
					s.description.toLowerCase().includes(q) ||
					s.tags.some((t) => t.includes(q))
				);
			}
			return true;
		});
	}, [servers, category, search]);

	const handleJoin = (serverId: string) => {
		setServers((prev) =>
			prev.map((s) =>
				s.id === serverId ? { ...s, isJoined: true } : s,
			),
		);
		awardServerJoined(serverId);
	};

	return (
		<div className="space-y-4">
			{/* Search */}
			<div className="relative">
				<svg
					className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300/40"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
				>
					<circle cx="11" cy="11" r="8" />
					<path d="m21 21-4.3-4.3" />
				</svg>
				<input
					type="text"
					placeholder="Search servers..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-blue-200 placeholder-blue-300/30 focus:outline-hidden focus:border-blue-500/30 transition-colors"
				/>
			</div>

			{/* Categories */}
			<div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
				{CATEGORIES.map((cat) => (
					<button
						key={cat.value}
						onClick={() => setCategory(cat.value)}
						className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
							category === cat.value
								? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
								: "bg-white/5 text-blue-300/50 border border-transparent hover:bg-white/10"
						}`}
					>
						{cat.label}
					</button>
				))}
			</div>

			{/* Results */}
			<div className="space-y-2">
				<AnimatePresence mode="popLayout">
					{filtered.map((server, index) => (
						<motion.div
							key={server.id}
							layout
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95 }}
							transition={{ delay: index * 0.03 }}
						>
							<ServerCard
								server={server}
								onJoin={() => handleJoin(server.id)}
							/>
						</motion.div>
					))}
				</AnimatePresence>

				{filtered.length === 0 && (
					<div className="text-center py-12">
						<p className="text-blue-300/40 text-sm">
							No servers found
						</p>
						<p className="text-blue-300/30 text-xs mt-1">
							Try different search terms or categories
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

// ── Server Card ────────────────────────────────────────────

function ServerCard({
	server,
	onJoin,
}: {
	server: DiscoverableServer;
	onJoin: () => void;
}) {
	return (
		<Glass
			variant="light"
			border="none"
			className="p-4 flex items-center gap-3"
		>
			{/* Icon */}
			<div
				className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg font-bold"
				style={{
					background: server.themeColor
						? `${server.themeColor} / 0.15`
						: "oklch(0.5 0.1 265 / 0.15)",
					color: server.themeColor || "oklch(0.7 0.15 265)",
				}}
			>
				{server.icon || server.name.charAt(0)}
			</div>

			{/* Info */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<p className="text-sm font-medium text-blue-300 truncate">
						{server.name}
					</p>
					<ActivityDot level={server.activityLevel} />
				</div>
				<p className="text-xs text-blue-300/40 truncate">
					{server.description}
				</p>
				<div className="flex items-center gap-3 mt-1">
					<span className="text-[10px] text-blue-300/30">
						{server.memberCount.toLocaleString()} members
					</span>
					<div className="flex gap-1">
						{server.tags.slice(0, 2).map((tag) => (
							<span
								key={tag}
								className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-blue-300/30"
							>
								{tag}
							</span>
						))}
					</div>
				</div>
			</div>

			{/* Join */}
			<div className="shrink-0">
				{server.isJoined ? (
					<span className="text-xs text-green-400/60 font-medium px-3 py-1.5">
						Joined
					</span>
				) : (
					<motion.button
						className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/20 hover:bg-blue-500/25 transition-colors"
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						onClick={onJoin}
					>
						Join
					</motion.button>
				)}
			</div>
		</Glass>
	);
}

// ── Activity Indicator ─────────────────────────────────────

function ActivityDot({ level }: { level: ServerActivityLevel }) {
	const colors: Record<ServerActivityLevel, string> = {
		live: "bg-green-400",
		moderate: "bg-yellow-400",
		quiet: "bg-blue-400/50",
	};

	return (
		<span
			className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors[level]}`}
			title={`${level} activity`}
		/>
	);
}
