"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal/modal";
import { Input } from "@/components/ui/input/input";
import { Button } from "@/components/ui/button/button";
import { useFriendsStore } from "@/store/friends.store";

export function AddFriendModal() {
	const [username, setUsername] = useState("");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	const isOpen = useFriendsStore((state) => state.isAddFriendModalOpen);
	const closeModal = useFriendsStore((state) => state.closeAddFriendModal);
	const sendFriendRequest = useFriendsStore((state) => state.sendFriendRequest);

	const handleClose = () => {
		closeModal();
		// Reset form after a delay
		setTimeout(() => {
			setUsername("");
			setMessage("");
			setError("");
			setSuccess(false);
		}, 300);
	};

	const handleSubmit = async () => {
		if (!username.trim()) {
			setError("Please enter a username");
			return;
		}

		setError("");
		setIsLoading(true);

		const result = await sendFriendRequest(username.trim(), message.trim() || undefined);

		setIsLoading(false);

		if (result) {
			setSuccess(true);
			setTimeout(() => {
				handleClose();
			}, 1500);
		} else {
			setError("User not found or request failed");
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title="Add Friend"
			description="Send a friend request to connect with someone new"
			footer={
				<>
					<Button variant="ghost" onClick={handleClose} disabled={isLoading}>
						Cancel
					</Button>
					<Button
						variant="primary"
						onClick={handleSubmit}
						loading={isLoading}
						disabled={success}
					>
						{success ? "Request Sent!" : "Send Request"}
					</Button>
				</>
			}
		>
			<div className="space-y-4">
				<Input
					label="Username or Email"
					placeholder="Enter friend's username or email"
					type="text"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					error={error}
					disabled={isLoading || success}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							handleSubmit();
						}
					}}
				/>

				<Input
					label="Message (optional)"
					placeholder="Say hi! Let them know why you want to connect"
					type="text"
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					disabled={isLoading || success}
					helperText="Add a personal touch to your friend request"
				/>

				{success && (
					<div className="p-3 rounded-lg bg-success/20 border border-success/30">
						<p className="text-sm text-success">
							Friend request sent successfully!
						</p>
					</div>
				)}
			</div>
		</Modal>
	);
}
