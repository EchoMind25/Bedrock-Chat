"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { usePlatformRoleStore } from "@/store/platform-role.store";
import { Button } from "@/components/ui/button/button";
import { Input, Textarea } from "@/components/ui/input/input";
import { toast } from "@/lib/stores/toast-store";
import type { BotApplication } from "@/lib/types/platform-role";

interface BotFormProps {
	bot?: BotApplication | null;
	onClose: () => void;
}

const BOT_TYPE_OPTIONS = [
	{ value: "custom", label: "Custom Bot", description: "A bot with custom webhook-based logic" },
	{ value: "claude", label: "Claude AI", description: "Powered by Claude with AI capabilities" },
	{ value: "webhook", label: "Webhook Only", description: "Receives and sends events via webhooks" },
] as const;

const SCOPE_OPTIONS = [
	{ value: "messages.read", label: "Read Messages", description: "Read messages in channels the bot has access to" },
	{ value: "messages.write", label: "Send Messages", description: "Send messages on behalf of the bot" },
	{ value: "reactions.write", label: "Add Reactions", description: "Add reactions to messages" },
	{ value: "members.read", label: "Read Members", description: "View server member list" },
	{ value: "channels.read", label: "Read Channels", description: "View channel information" },
	{ value: "presence.read", label: "Read Presence", description: "See online/offline status" },
];

export function BotForm({ bot, onClose }: BotFormProps) {
	const createBotApplication = usePlatformRoleStore((s) => s.createBotApplication);
	const updateBotApplication = usePlatformRoleStore((s) => s.updateBotApplication);

	const [name, setName] = useState(bot?.name ?? "");
	const [description, setDescription] = useState(bot?.description ?? "");
	const [botType, setBotType] = useState<"custom" | "claude" | "webhook">(bot?.bot_type ?? "custom");
	const [webhookUrl, setWebhookUrl] = useState(bot?.webhook_url ?? "");
	const [scopes, setScopes] = useState<string[]>(bot?.scopes ?? []);
	const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState(bot?.privacy_policy_url ?? "");
	const [dpaAccepted, setDpaAccepted] = useState(!!bot?.dpa_accepted_at);
	const [isTeenSafe, setIsTeenSafe] = useState(bot?.is_teen_safe ?? false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);
	const [webhookVerified, setWebhookVerified] = useState(bot?.webhook_verified ?? false);

	const isEditing = !!bot;

	const toggleScope = (scope: string) => {
		setScopes((prev) =>
			prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
		);
	};

	const handleVerifyWebhook = async () => {
		if (!bot?.id || !webhookUrl) return;
		setIsVerifying(true);
		try {
			const res = await fetch(`/api/platform/bots/${bot.id}/verify`, { method: "POST" });
			const data = await res.json();
			if (data.verified) {
				setWebhookVerified(true);
				toast.success("Webhook verified successfully");
			} else {
				toast.error(data.error || "Webhook verification failed");
			}
		} catch {
			toast.error("Failed to verify webhook");
		} finally {
			setIsVerifying(false);
		}
	};

	const handleSubmit = async () => {
		if (!name || name.length < 2) {
			toast.error("Bot name must be at least 2 characters");
			return;
		}

		if (!isEditing && !dpaAccepted) {
			toast.error("You must accept the Data Processing Agreement");
			return;
		}

		setIsSubmitting(true);

		if (isEditing) {
			await updateBotApplication(bot.id, {
				name,
				description: description || null,
				webhook_url: webhookUrl || null,
				scopes,
				privacy_policy_url: privacyPolicyUrl || null,
				is_teen_safe: isTeenSafe,
			});
		} else {
			const result = await createBotApplication({
				name,
				description: description || undefined,
				botType,
				webhookUrl: webhookUrl || undefined,
				scopes,
				privacyPolicyUrl: privacyPolicyUrl || undefined,
				dpaAccepted,
				isTeenSafe,
			});
			if (result) {
				onClose();
			}
		}

		setIsSubmitting(false);
	};

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
				onClick={onClose}
			/>
			<motion.div
				initial={{ x: "100%" }}
				animate={{ x: 0 }}
				exit={{ x: "100%" }}
				transition={{ type: "spring", stiffness: 300, damping: 30 }}
				className="fixed right-0 top-0 bottom-0 w-full max-w-lg z-50 bg-[oklch(0.14_0.02_250)] border-l border-white/10 overflow-y-auto scrollbar-thin"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/10 bg-[oklch(0.14_0.02_250)]">
					<h2 className="text-lg font-semibold text-white">
						{isEditing ? "Edit Bot" : "Register New Bot"}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Form */}
				<div className="p-4 space-y-6">
					{/* Bot Name */}
					<Input
						label="Bot Name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						helperText="2-100 characters"
						maxLength={100}
					/>

					{/* Description */}
					<Textarea
						label="Description"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						helperText="Max 500 characters"
						maxLength={500}
					/>

					{/* Bot Type (only on creation) */}
					{!isEditing && (
						<div>
							<label className="block text-sm font-medium text-slate-300 mb-2">Bot Type</label>
							<div className="space-y-2">
								{BOT_TYPE_OPTIONS.map((option) => (
									<button
										key={option.value}
										type="button"
										onClick={() => setBotType(option.value)}
										className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
											botType === option.value
												? "border-blue-500 bg-blue-500/10"
												: "border-white/10 hover:border-white/20"
										}`}
									>
										<p className="text-sm font-medium text-white">{option.label}</p>
										<p className="text-xs text-slate-400 mt-0.5">{option.description}</p>
									</button>
								))}
							</div>
						</div>
					)}

					{/* Webhook URL */}
					<div>
						<Input
							label="Webhook URL"
							type="url"
							value={webhookUrl}
							onChange={(e) => {
								setWebhookUrl(e.target.value);
								setWebhookVerified(false);
							}}
							helperText="HTTPS required. Events will be sent to this URL."
						/>
						{isEditing && webhookUrl && (
							<div className="flex items-center gap-2 mt-2">
								{webhookVerified ? (
									<span className="flex items-center gap-1 text-xs text-green-400">
										<CheckCircle className="w-3.5 h-3.5" />
										Verified
									</span>
								) : (
									<Button
										variant="secondary"
										size="sm"
										onClick={handleVerifyWebhook}
										disabled={isVerifying}
									>
										{isVerifying ? (
											<>
												<Loader2 className="w-3 h-3 mr-1 animate-spin" />
												Verifying...
											</>
										) : (
											"Test Webhook"
										)}
									</Button>
								)}
							</div>
						)}
					</div>

					{/* Scopes */}
					<div>
						<label className="block text-sm font-medium text-slate-300 mb-2">Scopes</label>
						<div className="space-y-1.5">
							{SCOPE_OPTIONS.map((scope) => (
								<label key={scope.value} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
									<input
										type="checkbox"
										checked={scopes.includes(scope.value)}
										onChange={() => toggleScope(scope.value)}
										className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500"
									/>
									<div>
										<p className="text-sm text-white">{scope.label}</p>
										<p className="text-xs text-slate-400">{scope.description}</p>
									</div>
								</label>
							))}
						</div>
					</div>

					{/* Privacy Policy URL */}
					<Input
						label="Privacy Policy URL"
						type="url"
						value={privacyPolicyUrl}
						onChange={(e) => setPrivacyPolicyUrl(e.target.value)}
						helperText="Required for verified bot status"
					/>

					{/* Teen-safe checkbox */}
					<label className="flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							checked={isTeenSafe}
							onChange={(e) => setIsTeenSafe(e.target.checked)}
							className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500"
						/>
						<div>
							<p className="text-sm text-white">Teen-safe application</p>
							<p className="text-xs text-slate-400">
								This bot is designed for users under 18 and will undergo additional review
							</p>
						</div>
					</label>

					{/* DPA Agreement (creation only) */}
					{!isEditing && (
						<label className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/5 cursor-pointer">
							<input
								type="checkbox"
								checked={dpaAccepted}
								onChange={(e) => setDpaAccepted(e.target.checked)}
								className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500"
							/>
							<div>
								<p className="text-sm text-white">Data Processing Agreement</p>
								<p className="text-xs text-slate-400 mt-0.5">
									I agree to the{" "}
									<span className="text-blue-400">Bedrock Data Processing Agreement</span>{" "}
									and will handle user data in accordance with GDPR and COPPA requirements.
								</p>
							</div>
						</label>
					)}
				</div>

				{/* Footer */}
				<div className="sticky bottom-0 p-4 border-t border-white/10 bg-[oklch(0.14_0.02_250)] flex gap-3">
					<Button variant="ghost" onClick={onClose} className="flex-1">
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={isSubmitting || (!isEditing && !dpaAccepted) || !name}
						className="flex-1"
					>
						{isSubmitting ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								{isEditing ? "Saving..." : "Submitting..."}
							</>
						) : (
							isEditing ? "Save Changes" : "Submit for Review"
						)}
					</Button>
				</div>
			</motion.div>
		</AnimatePresence>
	);
}
