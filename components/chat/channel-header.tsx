'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Channel } from '@/lib/types/server';
import { useMessageStore } from '@/store/message.store';
import type { Message } from '@/lib/types/message';

// Stable empty array reference - prevents re-renders from `|| []` creating new refs
const EMPTY_MESSAGES: Message[] = [];

interface ChannelHeaderProps {
	channel: Channel;
	memberCount?: number;
}

export function ChannelHeader({ channel, memberCount = 42 }: ChannelHeaderProps) {
	const [showSearch, setShowSearch] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const channelMessages = useMessageStore((state) => state.messages[channel.id] ?? EMPTY_MESSAGES);
	const [searchResults, setSearchResults] = useState<number>(0);

	const handleSearchToggle = () => {
		setShowSearch(!showSearch);
		setSearchQuery('');
		setSearchResults(0);
	};

	const handleSearch = (query: string) => {
		setSearchQuery(query);
		if (query.trim()) {
			const results = channelMessages.filter((m) =>
				m.content.toLowerCase().includes(query.toLowerCase())
			);
			setSearchResults(results.length);
		} else {
			setSearchResults(0);
		}
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
			className="shrink-0 border-b"
			style={{
				borderColor: 'oklch(0.25 0.02 285 / 0.3)',
				backgroundColor: 'oklch(0.12 0.02 250 / 0.5)',
				backdropFilter: 'blur(10px)',
			}}
		>
			<div className="h-12 flex items-center justify-between px-4">
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
						onClick={handleSearchToggle}
						className={`p-2 rounded-lg transition-colors ${showSearch ? 'bg-white/15 text-white' : 'hover:bg-white/10 text-white/60'}`}
						title="Search messages"
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</motion.button>
				</div>
			</div>

			{/* Search Bar */}
			<AnimatePresence>
				{showSearch && (
					<motion.div
						className="px-4 pb-3"
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2 }}
					>
						<div className="relative">
							<svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => handleSearch(e.target.value)}
								placeholder="Search messages..."
								className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-hidden focus:border-blue-500/50"
								autoFocus
							/>
							{searchQuery && (
								<span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">
									{searchResults} result{searchResults !== 1 ? 's' : ''}
								</span>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
