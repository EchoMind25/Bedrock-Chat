'use client';

import { motion } from 'motion/react';
import type { Channel } from '@/lib/types/server';

interface ChannelHeaderProps {
	channel: Channel;
	memberCount?: number;
}

export function ChannelHeader({ channel, memberCount = 42 }: ChannelHeaderProps) {
	const handlePinsClick = () => {
		alert('Pinned messages coming soon!');
	};

	const handleSearchClick = () => {
		alert('Search coming soon!');
	};

	const getChannelIcon = () => {
		switch (channel.type) {
			case 'announcement':
				return (
					<svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
					</svg>
				);
			case 'voice':
				return (
					<svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.06m0 0a5 5 0 007.072 0m-7.072 0L12 21m3.536-5.536a5 5 0 001.06-1.414" />
					</svg>
				);
			default:
				return (
					<svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
					</svg>
				);
		}
	};

	return (
		<div
			className="shrink-0 h-12 flex items-center justify-between px-4 border-b"
			style={{
				borderColor: 'oklch(0.25 0.02 285 / 0.3)',
				backgroundColor: 'oklch(0.12 0.02 250 / 0.5)',
				backdropFilter: 'blur(10px)',
			}}
		>
			{/* Left side - Channel info */}
			<div className="flex items-center gap-2 min-w-0">
				{getChannelIcon()}
				<h2 className="font-semibold text-white truncate">{channel.name}</h2>
				{channel.description && (
					<>
						<div className="w-px h-4 bg-white/20" />
						<span className="text-sm text-white/60 truncate max-w-md">
							{channel.description}
						</span>
					</>
				)}
			</div>

			{/* Right side - Actions */}
			<div className="flex items-center gap-1">
				{/* Member count */}
				<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-default">
					<svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
					</svg>
					<span className="text-sm text-white/60 font-medium">{memberCount}</span>
				</div>

				{/* Pins button */}
				<motion.button
					onClick={handlePinsClick}
					className="p-2 rounded-lg hover:bg-white/10 transition-colors"
					title="Pinned messages"
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
				>
					<svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
					</svg>
				</motion.button>

				{/* Search button */}
				<motion.button
					onClick={handleSearchClick}
					className="p-2 rounded-lg hover:bg-white/10 transition-colors"
					title="Search messages"
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
				>
					<svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
				</motion.button>
			</div>
		</div>
	);
}
