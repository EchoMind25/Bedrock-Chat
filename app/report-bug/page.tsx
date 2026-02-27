"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useAuthStore } from "@/store/auth.store";
import { BugReportModal } from "@/components/modals/BugReportModal";

export default function ReportBugPage() {
	const router = useRouter();
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const isInitializing = useAuthStore((s) => s.isInitializing);
	const [submitted, setSubmitted] = useState(false);
	const [reportId, setReportId] = useState<string | null>(null);

	useEffect(() => {
		if (!isInitializing && !isAuthenticated) {
			router.push("/login");
		}
	}, [isAuthenticated, isInitializing, router]);

	if (isInitializing || !isAuthenticated) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background-dark">
				<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	if (submitted && reportId) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background-dark p-4">
				<motion.div
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					className="glass-strong rounded-2xl p-8 max-w-md w-full text-center space-y-4"
				>
					<div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
						<svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<div>
						<h1 className="text-xl font-bold text-white">Report Submitted</h1>
						<p className="text-sm text-slate-400 mt-2">
							Thank you for helping improve Bedrock Chat. Our team will review your report.
						</p>
						<p className="text-xs text-slate-500 mt-1 font-mono">Report ID: {reportId}</p>
					</div>
					<button
						type="button"
						onClick={() => router.push("/channels")}
						className="w-full bg-primary hover:opacity-90 text-white text-sm font-medium rounded-lg py-2.5 transition-opacity"
					>
						Back to Chat
					</button>
				</motion.div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background-dark p-4 flex items-start justify-center py-12">
			<motion.div
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				className="glass-strong rounded-2xl p-8 max-w-xl w-full"
			>
				{/* Header */}
				<div className="mb-6">
					<button
						type="button"
						onClick={() => router.back()}
						className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-4"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
						Back
					</button>
					<h1 className="text-2xl font-bold text-white">Report a Bug</h1>
					<p className="text-sm text-slate-400 mt-1">
						Help us improve Bedrock Chat. Reports are reviewed by our team.
					</p>
				</div>

				<BugReportModal
					onSuccess={(id) => {
						setReportId(id);
						setSubmitted(true);
					}}
				/>
			</motion.div>
		</div>
	);
}
