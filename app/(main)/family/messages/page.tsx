"use client";

import { useState, useEffect } from "react";
import { useFamilyStore } from "@/store/family.store";
import { useServerStore } from "@/store/server.store";
import { useMessageStore } from "@/store/message.store";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from "@/components/ui/card/card";
import { Badge } from "@/components/ui/badge/badge";
import { Avatar } from "@/components/ui/avatar/avatar";
import { motion } from "motion/react";

export default function FamilyMessagesPage() {
	const { getSelectedTeenAccount, viewMessages } = useFamilyStore();
	const { servers } = useServerStore();
	const { messages, loadMessages, isLoading } = useMessageStore();

	const teenAccount = getSelectedTeenAccount();

	const [selectedServerId, setSelectedServerId] = useState<string>("");
	const [selectedChannelId, setSelectedChannelId] = useState<string>("");
	const [accessLogged, setAccessLogged] = useState(false);

	// Get available servers and channels
	const availableServers = servers.filter((s) => s.id !== "home");
	const selectedServer = availableServers.find((s) => s.id === selectedServerId);
	const availableChannels = selectedServer?.channels.filter(
		(c) => c.type === "text",
	) || [];

	// Load messages when channel is selected
	useEffect(() => {
		if (selectedChannelId) {
			loadMessages(selectedChannelId);
		}
	}, [selectedChannelId, loadMessages]);

	// Log access when viewing messages
	const handleViewChannel = (channelId: string, channelName: string) => {
		if (!teenAccount || !selectedServer) return;

		setSelectedChannelId(channelId);
		viewMessages(
			teenAccount.id,
			channelId,
			channelName,
			selectedServer.id,
			selectedServer.name,
		);
		setAccessLogged(true);

		// Clear the logged message after 3 seconds
		setTimeout(() => setAccessLogged(false), 3000);
	};

	const channelMessages = selectedChannelId ? messages[selectedChannelId] : null;

	if (!teenAccount) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-white/60">No teen account selected</p>
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col bg-[oklch(0.12_0.02_250)]">
			{/* Header */}
			<div className="px-6 py-4 border-b border-white/10 bg-[oklch(0.15_0.02_250)]">
				<h1 className="text-2xl font-bold text-white">Message Viewer</h1>
				<p className="text-sm text-white/60">
					Read-only view of {teenAccount.user.displayName}'s messages
				</p>

				{/* Warning Banner */}
				<motion.div
					className="mt-3 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg"
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
				>
					<p className="text-sm text-yellow-200 flex items-center gap-2">
						<span>⚠️</span>
						<span>
							Viewing messages will be logged and visible to your teen in their
							transparency log
						</span>
					</p>
				</motion.div>

				{/* Access Logged Toast */}
				{accessLogged && (
					<motion.div
						className="mt-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg"
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
					>
						<p className="text-sm text-green-200 flex items-center gap-2">
							<span>✓</span>
							<span>Access logged to transparency log</span>
						</p>
					</motion.div>
				)}
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto p-6 space-y-6">
				{/* Filters */}
				<Card tilt={false}>
					<CardHeader>
						<CardTitle>Select Channel</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{/* Server Selector */}
							<div>
								<label className="block text-sm text-white/70 mb-2">
									Server
								</label>
								<select
									value={selectedServerId}
									onChange={(e) => {
										setSelectedServerId(e.target.value);
										setSelectedChannelId("");
									}}
									className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
								>
									<option value="" className="bg-[oklch(0.15_0.02_250)]">
										Select a server
									</option>
									{availableServers.map((server) => (
										<option
											key={server.id}
											value={server.id}
											className="bg-[oklch(0.15_0.02_250)]"
										>
											{server.icon} {server.name}
										</option>
									))}
								</select>
							</div>

							{/* Channel Selector */}
							{selectedServerId && (
								<div>
									<label className="block text-sm text-white/70 mb-2">
										Channel
									</label>
									<div className="space-y-2">
										{availableChannels.map((channel) => (
											<motion.button
												key={channel.id}
												type="button"
												onClick={() =>
													handleViewChannel(channel.id, channel.name)
												}
												className={`
													w-full px-4 py-3 rounded-lg border text-left
													transition-colors
													${
														selectedChannelId === channel.id
															? "bg-white/10 border-white/30"
															: "bg-white/5 border-white/10 hover:bg-white/10"
													}
												`}
												whileHover={{ x: 4 }}
												whileTap={{ scale: 0.98 }}
											>
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-2">
														<span className="text-white/60">#</span>
														<span className="text-white font-medium">
															{channel.name}
														</span>
													</div>
													{channel.unreadCount > 0 && (
														<Badge variant="primary" className="text-xs">
															{channel.unreadCount}
														</Badge>
													)}
												</div>
											</motion.button>
										))}
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Messages Display */}
				{selectedChannelId && (
					<Card tilt={false}>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>
									#{availableChannels.find((c) => c.id === selectedChannelId)?.name}
								</CardTitle>
								<Badge variant="secondary" className="text-xs">
									Read-Only
								</Badge>
							</div>
						</CardHeader>
						<CardContent>
							{isLoading ? (
								<div className="flex items-center justify-center py-8">
									<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
								</div>
							) : channelMessages && channelMessages.length > 0 ? (
								<div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-thin pr-2">
									{channelMessages.map((message) => (
										<div
											key={message.id}
											className="flex gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
										>
											<Avatar
												src={message.author.avatar}
												alt={message.author.displayName}
												size="md"
											/>
											<div className="flex-1 min-w-0">
												<div className="flex items-baseline gap-2">
													<span className="font-medium text-white">
														{message.author.displayName}
													</span>
													<span className="text-xs text-white/40">
														{new Date(message.timestamp).toLocaleString()}
													</span>
												</div>
												<p className="text-white/80 mt-1 break-words">
													{message.content}
												</p>
												{message.reactions.length > 0 && (
													<div className="flex gap-2 mt-2">
														{message.reactions.map((reaction, idx) => (
															<Badge
																key={idx}
																variant="secondary"
																className="text-xs"
															>
																{reaction.emoji} {reaction.count}
															</Badge>
														))}
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-8 text-white/60">
									No messages in this channel
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{!selectedChannelId && (
					<div className="text-center py-12">
						<div className="text-6xl mb-4">💬</div>
						<p className="text-white/60">
							Select a server and channel to view messages
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
