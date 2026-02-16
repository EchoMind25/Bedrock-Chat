'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { EmojiPicker } from './emoji-picker';
import { FilePreview } from './file-preview';
import { useMessageStore } from '@/store/message.store';
import { usePresenceStore } from '@/store/presence.store';
import { useAuthStore } from '@/store/auth.store';
import { uploadFile } from '@/lib/supabase/storage';
import { toast } from '@/lib/stores/toast-store';

interface MessageInputProps {
	channelId: string;
	channelName: string;
}

const MAX_LENGTH = 2000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function MessageInput({ channelId, channelName }: MessageInputProps) {
	const [content, setContent] = useState('');
	const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const sendMessage = useMessageStore((s) => s.sendMessage);
	const broadcastTyping = usePresenceStore((s) => s.broadcastTyping);
	const user = useAuthStore((s) => s.user);

	// Auto-resize textarea
	useEffect(() => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		textarea.style.height = 'auto';
		textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
	}, [content]);

	// Typing indicator — broadcast via Supabase Presence (debounced 2s in store)
	useEffect(() => {
		if (content.length > 0 && user?.username) {
			broadcastTyping(channelId);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [content, channelId]); // Exclude broadcastTyping — stable Zustand action

	const handleSubmit = async () => {
		if (!content.trim() && !pendingFile) return;
		if (isUploading) return;

		let attachmentData: { url: string; fileName: string; fileSize: number; mimeType: string } | undefined;

		if (pendingFile) {
			setIsUploading(true);
			try {
				attachmentData = await uploadFile(pendingFile, channelId);
			} catch (err) {
				toast.error('Upload failed', err instanceof Error ? err.message : 'Could not upload file');
				setIsUploading(false);
				return;
			}
			setIsUploading(false);
			setPendingFile(null);
		}

		sendMessage(channelId, content || '', attachmentData);
		setContent('');

		// Reset textarea height
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	};

	const handleEmojiSelect = (emoji: string) => {
		setContent(prev => prev + emoji);
		textareaRef.current?.focus();
	};

	const handleFileUpload = () => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/jpeg,image/png,image/gif,image/webp,video/mp4,application/pdf,text/plain';
		input.onchange = () => {
			const file = input.files?.[0];
			if (!file) return;
			if (file.size > MAX_FILE_SIZE) {
				toast.error('File too large', 'Maximum file size is 10MB');
				return;
			}
			setPendingFile(file);
		};
		input.click();
	};

	const remainingChars = MAX_LENGTH - content.length;
	const showCounter = content.length >= 1800;

	return (
		<div className="shrink-0 p-4">
			<div
				className="rounded-2xl relative"
				style={{
					backgroundColor: 'oklch(0.18 0.02 250 / 0.7)',
					border: '1px solid oklch(0.25 0.02 285 / 0.5)',
				}}
			>
				{/* File preview */}
				<AnimatePresence>
					{pendingFile && (
						<FilePreview
							file={pendingFile}
							isUploading={isUploading}
							onRemove={() => setPendingFile(null)}
						/>
					)}
				</AnimatePresence>

				{/* Input area */}
				<div className="flex items-end gap-2 p-3">
					{/* File upload button */}
					<button
						onClick={handleFileUpload}
						disabled={isUploading}
						className="shrink-0 p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-40"
						title="Upload file"
					>
						<svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
						</svg>
					</button>

					{/* Textarea */}
					<div className="flex-1 relative">
						<textarea
							ref={textareaRef}
							value={content}
							onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
							onKeyDown={handleKeyDown}
							placeholder={`Message #${channelName}`}
							className="w-full bg-transparent text-white placeholder:text-white/40 resize-none focus:outline-hidden scrollbar-thin max-h-[200px]"
							rows={1}
						/>
					</div>

					{/* Emoji picker button */}
					<div className="relative shrink-0">
						<button
							onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
							className="p-2 rounded-lg hover:bg-white/10 transition-colors"
							title="Add emoji"
						>
							<svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</button>

						{/* Emoji picker */}
						<EmojiPicker
							isOpen={isEmojiPickerOpen}
							onClose={() => setIsEmojiPickerOpen(false)}
							onSelect={handleEmojiSelect}
							alignment="right"
						/>
					</div>
				</div>

				{/* Footer with counter and hints */}
				<div className="flex items-center justify-between px-4 pb-3 text-xs text-white/40">
					<div className="flex items-center gap-2">
						<span>Press Enter to send, Shift+Enter for newline</span>
					</div>
					{showCounter && (
						<motion.span
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							className={remainingChars < 100 ? 'text-red-400 font-medium' : ''}
						>
							{remainingChars} remaining
						</motion.span>
					)}
				</div>
			</div>
		</div>
	);
}
