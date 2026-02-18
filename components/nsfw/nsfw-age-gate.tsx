"use client";

import { Modal } from "@/components/ui/modal/modal";
import { Button } from "@/components/ui/button/button";
import { acceptNsfw } from "@/lib/utils/nsfw-gate";
import { useRouter } from "next/navigation";
import { useServerStore } from "@/store/server.store";
import { useMemo } from "react";
import { ShieldAlert } from "lucide-react";

interface NsfwAgeGateProps {
	isOpen: boolean;
	onAccept: () => void;
	channelName: string;
}

export function NsfwAgeGate({ isOpen, onAccept, channelName }: NsfwAgeGateProps) {
	const router = useRouter();
	const servers = useServerStore((s) => s.servers);
	const currentServerId = useServerStore((s) => s.currentServerId);

	const safeChannel = useMemo(() => {
		const server = servers.find((s) => s.id === currentServerId);
		if (!server) return null;
		return server.channels.find((ch) => !ch.isNsfw && ch.type === "text") || null;
	}, [servers, currentServerId]);

	const handleAccept = () => {
		acceptNsfw();
		onAccept();
	};

	const handleGoBack = () => {
		if (safeChannel && currentServerId) {
			router.push(`/servers/${currentServerId}/${safeChannel.id}`);
		} else {
			router.push("/friends");
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleGoBack}
			size="sm"
			closeOnOverlay={false}
			closeOnEscape={true}
		>
			<div className="flex flex-col items-center text-center py-4">
				<div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
					<ShieldAlert className="w-6 h-6 text-red-400" />
				</div>

				<h3 className="text-lg font-semibold text-slate-50 mb-2">
					Age-Restricted Channel
				</h3>

				<p className="text-sm text-slate-300 mb-6">
					#{channelName} is marked as NSFW. You must be 18 or older to view this channel.
				</p>

				<div className="flex gap-3 w-full">
					<Button
						variant="ghost"
						onClick={handleGoBack}
						className="flex-1"
					>
						Go Back
					</Button>
					<Button
						variant="danger"
						onClick={handleAccept}
						className="flex-1"
					>
						I am 18+
					</Button>
				</div>
			</div>
		</Modal>
	);
}
