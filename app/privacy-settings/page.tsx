"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useConsentStore } from "@/store/consent.store";
import { Toggle } from "@/components/ui/toggle";
import { Glass } from "@/components/ui/glass";
import Link from "next/link";

function PrivacySettingsContent() {
	const searchParams = useSearchParams();
	const section = searchParams.get("section");

	const preferences = useConsentStore((s) => s.preferences);
	const savePreferences = useConsentStore((s) => s.savePreferences);

	return (
		<div className="min-h-screen bg-[oklch(0.12_0.02_250)] overflow-y-auto scrollbar-thin p-6 py-12">
			<div className="max-w-3xl mx-auto space-y-6">
				<Link
					href="/"
					className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
				>
					&larr; Back to Home
				</Link>

				{/* Page header */}
				<div>
					<h1 className="text-3xl font-bold text-white mb-2">
						Privacy Settings
					</h1>
					<p className="text-slate-400">
						Manage how your data is collected and used.
					</p>
				</div>

				{/* CCPA Section */}
				{section === "ccpa" && (
					<Glass
						variant="liquid-elevated"
						border="liquid"
						className="p-6"
					>
						<h2 className="text-xl font-semibold text-white mb-3">
							Do Not Sell or Share My Personal Information
						</h2>
						<p className="text-slate-300 text-sm mb-4">
							Under the California Consumer Privacy Act (CCPA/CPRA), you
							have the right to opt out of the sale or sharing of your
							personal information with third parties.
						</p>
						<div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
							<p className="text-green-400 font-medium text-sm">
								We do not sell or share your personal information
							</p>
							<p className="text-slate-300 text-xs mt-2">
								Bedrock Chat is privacy-first. We never sell, rent, or
								share your data with third parties for advertising or
								marketing purposes. Your data is only used to provide
								and improve the service.
							</p>
						</div>
					</Glass>
				)}

				{/* Sensitive Information Section */}
				{section === "sensitive" && (
					<Glass
						variant="liquid-elevated"
						border="liquid"
						className="p-6"
					>
						<h2 className="text-xl font-semibold text-white mb-3">
							Limit Use of Sensitive Personal Information
						</h2>
						<p className="text-slate-300 text-sm mb-4">
							You can control how we process sensitive personal
							information such as precise geolocation, biometric data,
							or private communications.
						</p>
						<div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
							<p className="text-blue-400 font-medium text-sm">
								Minimal sensitive data collection
							</p>
							<p className="text-slate-300 text-xs mt-2">
								We only collect sensitive data essential for the
								service: encrypted message content (only you and
								recipients can read it) and voice call metadata
								(timestamps and participant list only -- no audio
								recordings).
							</p>
						</div>
					</Glass>
				)}

				{/* Data Collection Preferences */}
				<Glass
					variant="liquid-elevated"
					border="liquid"
					className="p-6"
				>
					<h2 className="text-xl font-semibold text-white mb-4">
						Data Collection Preferences
					</h2>

					<div className="space-y-5">
						<div className="flex items-start gap-4 p-3 rounded-lg bg-slate-800/30">
							<div className="pt-0.5">
								<Toggle
									checked
									disabled
									size="sm"
									aria-label="Toggle Necessary cookies"
								/>
							</div>
							<div>
								<p className="text-sm font-medium text-slate-200">
									Necessary{" "}
									<span className="text-xs text-slate-400">
										(Required)
									</span>
								</p>
								<p className="text-xs text-slate-400 mt-1">
									Authentication, security, and core functionality.
								</p>
							</div>
						</div>

						<div className="flex items-start gap-4 p-3 rounded-lg bg-slate-800/30">
							<div className="pt-0.5">
								<Toggle
									checked={preferences.analytics}
									size="sm"
									onChange={(e) =>
										savePreferences({ analytics: e.target.checked })
									}
									aria-label="Toggle Analytics"
								/>
							</div>
							<div>
								<p className="text-sm font-medium text-slate-200">
									Analytics
								</p>
								<p className="text-xs text-slate-400 mt-1">
									Helps us understand how you use the platform to
									improve performance.
								</p>
							</div>
						</div>

						<div className="flex items-start gap-4 p-3 rounded-lg bg-slate-800/30">
							<div className="pt-0.5">
								<Toggle
									checked={preferences.marketing}
									size="sm"
									onChange={(e) =>
										savePreferences({ marketing: e.target.checked })
									}
									aria-label="Toggle Marketing"
								/>
							</div>
							<div>
								<p className="text-sm font-medium text-slate-200">
									Marketing
								</p>
								<p className="text-xs text-slate-400 mt-1">
									Product announcements and relevant updates.
								</p>
							</div>
						</div>

						<div className="flex items-start gap-4 p-3 rounded-lg bg-slate-800/30">
							<div className="pt-0.5">
								<Toggle
									checked={preferences.functional}
									size="sm"
									onChange={(e) =>
										savePreferences({
											functional: e.target.checked,
										})
									}
									aria-label="Toggle Functional"
								/>
							</div>
							<div>
								<p className="text-sm font-medium text-slate-200">
									Functional
								</p>
								<p className="text-xs text-slate-400 mt-1">
									Theme persistence, voice settings, and
									personalization.
								</p>
							</div>
						</div>
					</div>

					<p className="text-xs text-slate-500 mt-4">
						Last updated:{" "}
						{new Date(preferences.lastUpdated).toLocaleDateString()}
					</p>
				</Glass>

				{/* Links */}
				<Glass variant="liquid" border="liquid" className="p-6">
					<h2 className="text-lg font-semibold text-white mb-3">
						Your Rights
					</h2>
					<ul className="space-y-2 text-sm text-slate-300">
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
								href="/data-export"
								className="text-primary hover:underline"
							>
								Export your data (DSAR)
							</Link>
						</li>
						<li>
							<a
								href="mailto:privacy@bedrock-chat.com"
								className="text-primary hover:underline"
							>
								Contact our Data Protection Officer
							</a>
						</li>
					</ul>
				</Glass>
			</div>
		</div>
	);
}

export default function PrivacySettingsPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-[oklch(0.12_0.02_250)] flex items-center justify-center">
					<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			}
		>
			<PrivacySettingsContent />
		</Suspense>
	);
}
