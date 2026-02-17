"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useConsentStore } from "@/store/consent.store";
import { Toggle } from "@/components/ui/toggle";
import { Glass } from "@/components/ui/glass";
import Link from "next/link";

// ---------------------------------------------------------------------------
// GPC / DNT signal detection
// ---------------------------------------------------------------------------

interface PrivacySignals {
	gpc: boolean;
	dnt: boolean;
}

function detectPrivacySignals(): PrivacySignals {
	if (typeof navigator === "undefined") return { gpc: false, dnt: false };
	return {
		gpc: !!(navigator as unknown as { globalPrivacyControl?: boolean })
			.globalPrivacyControl,
		dnt: navigator.doNotTrack === "1",
	};
}

// ---------------------------------------------------------------------------
// Shared page shell (background, max-width, back link)
// ---------------------------------------------------------------------------

function PageShell({ children }: { children: React.ReactNode }) {
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

				{children}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Visitor (unauthenticated) view
// ---------------------------------------------------------------------------

function VisitorPrivacyView({
	privacySignals,
}: {
	privacySignals: PrivacySignals;
}) {
	return (
		<>
			{/* GPC / DNT signal acknowledgment */}
			{(privacySignals.gpc || privacySignals.dnt) && (
				<Glass variant="liquid-elevated" border="liquid" className="p-6">
					<div className="flex items-center gap-3 mb-3">
						<div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
							<svg
								className="w-5 h-5 text-green-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
								/>
							</svg>
						</div>
						<h3 className="text-lg font-semibold text-green-300">
							Privacy Signal Detected
						</h3>
					</div>
					<p className="text-slate-300 text-sm leading-relaxed">
						{privacySignals.gpc &&
							"We detected your browser\u2019s Global Privacy Control (GPC) signal. "}
						{privacySignals.dnt &&
							!privacySignals.gpc &&
							"We detected your browser\u2019s Do Not Track signal. "}
						{privacySignals.gpc &&
							privacySignals.dnt &&
							"We also detected your Do Not Track signal. "}
						Bedrock Chat honors these signals by default &mdash; we never
						track, profile, or sell visitor data.
					</p>
				</Glass>
			)}

			{/* Main privacy statement */}
			<Glass variant="liquid-elevated" border="liquid" className="p-6 space-y-6">
				<div>
					<h2 className="text-2xl font-bold text-slate-100 mb-3">
						Our Privacy Commitment
					</h2>
					<p className="text-slate-300 leading-relaxed">
						Bedrock Chat does not sell, share, or trade personal information.
						Period. We have no third-party trackers, no analytics cookies, no
						advertising pixels, and no data brokers.
					</p>
				</div>

				<div>
					<h3 className="text-lg font-semibold text-blue-300 mb-2">
						What We Collect From Visitors
					</h3>
					<p className="text-slate-300 leading-relaxed">
						If you don&apos;t have a Bedrock Chat account, we collect{" "}
						<strong className="text-slate-100">nothing</strong>. No IP logging,
						no fingerprinting, no session tracking. This page does not set any
						cookies or store any data in your browser.
					</p>
				</div>

				<div>
					<h3 className="text-lg font-semibold text-blue-300 mb-2">
						For Account Holders
					</h3>
					<p className="text-slate-300 leading-relaxed">
						If you have a Bedrock Chat account, you can manage your privacy
						preferences by logging in. Your privacy settings include controls
						for data sharing, sensitive information limits, and communication
						preferences.
					</p>
					<div className="mt-4 flex flex-wrap gap-3">
						<Link
							href="/login"
							className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
						>
							Log In to Manage Settings
						</Link>
						<Link
							href="/signup"
							className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
						>
							Create an Account
						</Link>
					</div>
				</div>
			</Glass>

			{/* CCPA-specific disclosures */}
			<Glass variant="liquid-elevated" border="liquid" className="p-6 space-y-4">
				<h3 className="text-lg font-semibold text-slate-100">
					California Consumer Privacy Act (CCPA) Notice
				</h3>

				<div>
					<h4 className="text-sm font-medium text-blue-300 mb-1">
						Do Not Sell or Share (&sect;1798.120)
					</h4>
					<p className="text-slate-400 text-sm leading-relaxed">
						Bedrock Chat has never sold or shared personal information with
						third parties for cross-context behavioral advertising or any other
						purpose. There is no data sale to opt out of.
					</p>
				</div>

				<div>
					<h4 className="text-sm font-medium text-blue-300 mb-1">
						Sensitive Personal Information (&sect;1798.121)
					</h4>
					<p className="text-slate-400 text-sm leading-relaxed">
						We process sensitive personal information (such as account
						credentials) only as necessary to provide our service. We do not use
						sensitive information for profiling or advertising.
					</p>
				</div>

				<div>
					<h4 className="text-sm font-medium text-blue-300 mb-1">
						Your Rights
					</h4>
					<p className="text-slate-400 text-sm leading-relaxed">
						California residents have the right to know what data we collect,
						request deletion, and opt out of data sales. Since we don&apos;t
						sell data, the right to opt out is automatically satisfied. For data
						access or deletion requests, contact us at{" "}
						<a
							href="mailto:privacy@bedrock-chat.com"
							className="text-blue-400 hover:text-blue-300"
						>
							privacy@bedrock-chat.com
						</a>
						.
					</p>
				</div>
			</Glass>

			{/* Policy links */}
			<Glass variant="liquid" border="liquid" className="p-6">
				<h2 className="text-lg font-semibold text-white mb-3">
					Related Policies
				</h2>
				<ul className="space-y-2 text-sm text-slate-300">
					<li>
						<Link
							href="/privacy-policy"
							className="text-primary hover:underline"
						>
							Full Privacy Policy
						</Link>
					</li>
					<li>
						<Link
							href="/cookie-policy"
							className="text-primary hover:underline"
						>
							Cookie Policy
						</Link>
					</li>
					<li>
						<Link
							href="/terms-of-service"
							className="text-primary hover:underline"
						>
							Terms of Service
						</Link>
					</li>
				</ul>
			</Glass>
		</>
	);
}

// ---------------------------------------------------------------------------
// Authenticated user view (functional toggles)
// ---------------------------------------------------------------------------

function AuthenticatedPrivacyView({ section }: { section: string | null }) {
	const preferences = useConsentStore((s) => s.preferences);
	const savePreferences = useConsentStore((s) => s.savePreferences);

	return (
		<>
			{/* CCPA Section */}
			{section === "ccpa" && (
				<Glass variant="liquid-elevated" border="liquid" className="p-6">
					<h2 className="text-xl font-semibold text-white mb-3">
						Do Not Sell or Share My Personal Information
					</h2>
					<p className="text-slate-300 text-sm mb-4">
						Under the California Consumer Privacy Act (CCPA/CPRA), you have the
						right to opt out of the sale or sharing of your personal information
						with third parties.
					</p>
					<div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
						<p className="text-green-400 font-medium text-sm">
							We do not sell or share your personal information
						</p>
						<p className="text-slate-300 text-xs mt-2">
							Bedrock Chat is privacy-first. We never sell, rent, or share your
							data with third parties for advertising or marketing purposes.
							Your data is only used to provide and improve the service.
						</p>
					</div>
				</Glass>
			)}

			{/* Sensitive Information Section */}
			{section === "sensitive" && (
				<Glass variant="liquid-elevated" border="liquid" className="p-6">
					<h2 className="text-xl font-semibold text-white mb-3">
						Limit Use of Sensitive Personal Information
					</h2>
					<p className="text-slate-300 text-sm mb-4">
						You can control how we process sensitive personal information such
						as precise geolocation, biometric data, or private communications.
					</p>
					<div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
						<p className="text-blue-400 font-medium text-sm">
							Minimal sensitive data collection
						</p>
						<p className="text-slate-300 text-xs mt-2">
							We only collect sensitive data essential for the service:
							encrypted message content (only you and recipients can read it)
							and voice call metadata (timestamps and participant list only --
							no audio recordings).
						</p>
					</div>
				</Glass>
			)}

			{/* Data Collection Preferences */}
			<Glass variant="liquid-elevated" border="liquid" className="p-6">
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
								<span className="text-xs text-slate-400">(Required)</span>
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
							<p className="text-sm font-medium text-slate-200">Analytics</p>
							<p className="text-xs text-slate-400 mt-1">
								Helps us understand how you use the platform to improve
								performance.
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
							<p className="text-sm font-medium text-slate-200">Marketing</p>
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
									savePreferences({ functional: e.target.checked })
								}
								aria-label="Toggle Functional"
							/>
						</div>
						<div>
							<p className="text-sm font-medium text-slate-200">Functional</p>
							<p className="text-xs text-slate-400 mt-1">
								Theme persistence, voice settings, and personalization.
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
				<h2 className="text-lg font-semibold text-white mb-3">Your Rights</h2>
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
						<Link href="/data-export" className="text-primary hover:underline">
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
		</>
	);
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

function PrivacySettingsContent() {
	const searchParams = useSearchParams();
	const section = searchParams.get("section");

	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const isInitializing = useAuthStore((s) => s.isInitializing);

	const [privacySignals, setPrivacySignals] = useState<PrivacySignals>({
		gpc: false,
		dnt: false,
	});

	useEffect(() => {
		setPrivacySignals(detectPrivacySignals());
	}, []);

	// Show loading spinner while auth state is being determined
	if (isInitializing) {
		return (
			<PageShell>
				<div className="flex items-center justify-center py-16">
					<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</PageShell>
		);
	}

	if (!isAuthenticated) {
		return (
			<PageShell>
				<VisitorPrivacyView privacySignals={privacySignals} />
			</PageShell>
		);
	}

	return (
		<PageShell>
			<AuthenticatedPrivacyView section={section} />
		</PageShell>
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
