"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { exportUserData, downloadAsJSON } from "@/lib/data-export";
import { Glass } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/stores/toast-store";
import Link from "next/link";

const DATA_SECTIONS = [
	{
		label: "Profile information",
		description: "Username, email, avatar, account type, creation date",
	},
	{
		label: "Server memberships",
		description: "Servers you belong to, your roles, and join dates",
	},
	{
		label: "Friends list",
		description: "Your friends and when they were added",
	},
	{
		label: "Messages",
		description: "Up to 10,000 most recent channel messages",
	},
	{
		label: "Direct messages",
		description: "Up to 5,000 most recent direct messages",
	},
	{
		label: "Consent preferences",
		description: "Your privacy and cookie preferences",
	},
];

export default function DataExportPage() {
	const [isExporting, setIsExporting] = useState(false);
	const user = useAuthStore((s) => s.user);

	const handleExport = async () => {
		if (!user) return;

		setIsExporting(true);
		try {
			const data = await exportUserData(user.id);
			const filename = `bedrock-chat-export-${user.username}-${new Date().toISOString().slice(0, 10)}.json`;
			downloadAsJSON(data, filename);
			toast.success("Data exported", "Your data has been downloaded as a JSON file.");
		} catch {
			toast.error("Export failed", "Unable to export your data. Please try again later.");
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<div className="flex-1 overflow-y-auto scrollbar-thin p-6">
			<div className="max-w-3xl mx-auto space-y-6">
				{/* Header */}
				<div>
					<h1 className="text-3xl font-bold text-white mb-2">
						Export Your Data
					</h1>
					<p className="text-slate-400">
						Under GDPR and CCPA, you have the right to receive a portable
						copy of your personal data.
					</p>
				</div>

				{/* What's included */}
				<Glass variant="liquid-elevated" border="liquid" className="p-6">
					<h2 className="text-lg font-semibold text-white mb-4">
						What&apos;s Included
					</h2>
					<div className="space-y-3">
						{DATA_SECTIONS.map((section) => (
							<div
								key={section.label}
								className="flex items-start gap-3"
							>
								<svg
									className="w-5 h-5 text-primary shrink-0 mt-0.5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<div>
									<p className="text-sm font-medium text-slate-200">
										{section.label}
									</p>
									<p className="text-xs text-slate-400">
										{section.description}
									</p>
								</div>
							</div>
						))}
					</div>
				</Glass>

				{/* Export action */}
				<Glass variant="liquid-elevated" border="liquid" className="p-6">
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
						<div className="flex-1">
							<h2 className="text-lg font-semibold text-white mb-1">
								Download Your Data
							</h2>
							<p className="text-sm text-slate-400">
								Your data will be exported as a JSON file. This may take
								a moment.
							</p>
						</div>
						<Button
							variant="primary"
							onClick={handleExport}
							disabled={isExporting}
							loading={isExporting}
						>
							{isExporting ? "Exporting..." : "Download My Data"}
						</Button>
					</div>
				</Glass>

				{/* Additional info */}
				<Glass variant="liquid" border="liquid" className="p-6">
					<h2 className="text-lg font-semibold text-white mb-3">
						Need Help?
					</h2>
					<p className="text-sm text-slate-300 mb-3">
						If you have questions about your data or want to request
						deletion, contact our Data Protection Officer.
					</p>
					<ul className="space-y-2 text-sm">
						<li>
							<a
								href="mailto:privacy@bedrock-chat.com"
								className="text-primary hover:underline"
							>
								privacy@bedrock-chat.com
							</a>
						</li>
						<li>
							<Link
								href="/privacy-policy"
								className="text-primary hover:underline"
							>
								Read our Privacy Policy
							</Link>
						</li>
						<li>
							<Link
								href="/privacy-settings"
								className="text-primary hover:underline"
							>
								Manage privacy settings
							</Link>
						</li>
					</ul>
				</Glass>
			</div>
		</div>
	);
}
