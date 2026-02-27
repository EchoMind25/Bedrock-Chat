"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "@/store/auth.store";
import { useAnalyticsCollector } from "@/providers/AnalyticsProvider";
import { getDeviceCategory, getViewportBucket, getBrowserFamily, getOsFamily } from "@/lib/analytics/sanitize";
import { cn } from "@/lib/utils/cn";

type Category = "bug" | "ui_issue" | "performance" | "voice_issue" | "other";
type Severity = "low" | "medium" | "high" | "critical";

interface BugReportModalProps {
	onSuccess?: (reportId: string) => void;
}

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
	{ value: "bug", label: "Bug" },
	{ value: "ui_issue", label: "UI Issue" },
	{ value: "performance", label: "Performance" },
	{ value: "voice_issue", label: "Voice Issue" },
	{ value: "other", label: "Other" },
];

const SEVERITY_OPTIONS: { value: Severity; label: string; color: string }[] = [
	{ value: "low", label: "Low", color: "text-slate-400" },
	{ value: "medium", label: "Medium", color: "text-blue-400" },
	{ value: "high", label: "High", color: "text-yellow-400" },
	{ value: "critical", label: "Critical", color: "text-red-400" },
];

export function BugReportModal({ onSuccess }: BugReportModalProps) {
	const user = useAuthStore((s) => s.user);
	const collector = useAnalyticsCollector();

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [category, setCategory] = useState<Category>("bug");
	const [severity, setSeverity] = useState<Severity>("medium");
	const [includeIdentity, setIncludeIdentity] = useState(false);
	const [showDataDetails, setShowDataDetails] = useState(false);
	const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
	const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
	const [isCapturing, setIsCapturing] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [submitError, setSubmitError] = useState<string | null>(null);

	const screenshotPreviewRef = useRef<string | null>(null);

	const captureScreenshot = useCallback(async () => {
		setIsCapturing(true);
		try {
			const html2canvas = (await import("html2canvas")).default;
			const canvas = await html2canvas(document.body, {
				useCORS: true,
				allowTaint: true,
				scale: Math.min(window.devicePixelRatio, 2),
				logging: false,
			});
			const dataUrl = canvas.toDataURL("image/png");
			if (screenshotPreviewRef.current) URL.revokeObjectURL(screenshotPreviewRef.current);
			setScreenshotPreview(dataUrl);
			setScreenshotBase64(dataUrl);
		} catch {
			// Screenshot capture is non-critical
		} finally {
			setIsCapturing(false);
		}
	}, []);

	const removeScreenshot = useCallback(() => {
		setScreenshotPreview(null);
		setScreenshotBase64(null);
	}, []);

	const validate = useCallback((): boolean => {
		const next: Record<string, string> = {};
		if (!title.trim()) next.title = "Title is required";
		if (!description.trim()) next.description = "Description is required";
		setErrors(next);
		return Object.keys(next).length === 0;
	}, [title, description]);

	const handleSubmit = useCallback(async () => {
		if (!validate()) return;
		setIsSubmitting(true);
		setSubmitError(null);

		try {
			const body: Record<string, unknown> = {
				session_token: collector?.getSessionToken() ?? undefined,
				include_identity: includeIdentity,
				title: title.trim(),
				description: description.trim(),
				category,
				severity,
				page_path: window.location.pathname,
				device_category: getDeviceCategory(),
				viewport_bucket: getViewportBucket(),
				browser_family: getBrowserFamily(),
				os_family: getOsFamily(),
			};

			if (screenshotBase64) {
				body.screenshot_base64 = screenshotBase64;
				body.screenshot_filename = "screenshot.png";
			}

			const res = await fetch("/api/analytics/bug-report", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!res.ok) {
				const data = (await res.json().catch(() => ({}))) as { error?: string };
				throw new Error(data.error ?? `Error ${res.status}`);
			}

			const { id } = (await res.json()) as { id: string };
			onSuccess?.(id);
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Submission failed. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	}, [
		validate,
		collector,
		includeIdentity,
		title,
		description,
		category,
		severity,
		screenshotBase64,
		onSuccess,
	]);

	const currentPagePath = typeof window !== "undefined" ? window.location.pathname : "/";

	return (
		<div className="space-y-6">
			{/* Title */}
			<div>
				<label className="block text-sm font-medium text-slate-300 mb-1.5">
					Title <span className="text-red-400">*</span>
				</label>
				<input
					type="text"
					value={title}
					maxLength={200}
					onChange={(e) => {
						setTitle(e.target.value);
						if (errors.title) setErrors((p) => ({ ...p, title: "" }));
					}}
					placeholder="Brief summary of the issue"
					className="w-full bg-slate-800 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-primary/50 transition-colors"
				/>
				{errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
			</div>

			{/* Description */}
			<div>
				<label className="block text-sm font-medium text-slate-300 mb-1.5">
					Description <span className="text-red-400">*</span>
				</label>
				<textarea
					value={description}
					maxLength={2000}
					onChange={(e) => {
						setDescription(e.target.value);
						if (errors.description) setErrors((p) => ({ ...p, description: "" }));
					}}
					rows={5}
					placeholder="What happened? What did you expect to happen? What steps reproduce this?"
					className="w-full bg-slate-800 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-primary/50 resize-none transition-colors"
				/>
				<p className="mt-1 text-xs text-slate-500 text-right">{description.length}/2000</p>
				{errors.description && <p className="mt-1 text-xs text-red-400">{errors.description}</p>}
			</div>

			{/* Category + Severity */}
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
					<select
						value={category}
						onChange={(e) => setCategory(e.target.value as Category)}
						className="w-full bg-slate-800 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
					>
						{CATEGORY_OPTIONS.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
				</div>
				<div>
					<label className="block text-sm font-medium text-slate-300 mb-1.5">Severity</label>
					<select
						value={severity}
						onChange={(e) => setSeverity(e.target.value as Severity)}
						className="w-full bg-slate-800 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
					>
						{SEVERITY_OPTIONS.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Screenshot */}
			<div>
				<label className="block text-sm font-medium text-slate-300 mb-1.5">
					Screenshot <span className="text-slate-500 font-normal">(optional)</span>
				</label>
				{screenshotPreview ? (
					<div className="space-y-2">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={screenshotPreview}
							alt="Bug screenshot preview"
							className="w-full max-h-40 object-cover object-top rounded-lg border border-slate-700/50"
						/>
						<button
							type="button"
							onClick={removeScreenshot}
							className="text-xs text-red-400 hover:text-red-300 transition-colors"
						>
							Remove screenshot
						</button>
					</div>
				) : (
					<button
						type="button"
						onClick={captureScreenshot}
						disabled={isCapturing}
						className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 border-dashed rounded-lg text-sm text-slate-400 hover:text-slate-200 disabled:opacity-60 transition-colors"
					>
						{isCapturing ? "Capturing..." : "Capture screenshot"}
					</button>
				)}
			</div>

			{/* Identity toggle */}
			<div className="p-4 bg-slate-800/50 border border-slate-700/30 rounded-lg">
				<label className="flex items-start gap-3 cursor-pointer select-none">
					<div className="relative shrink-0 w-9 h-5 mt-0.5">
						<input
							type="checkbox"
							checked={includeIdentity}
							onChange={(e) => setIncludeIdentity(e.target.checked)}
							className="sr-only"
							aria-label="Attach my account to this bug report"
						/>
						<div
							className={cn(
								"absolute inset-0 rounded-full transition-colors duration-200",
								includeIdentity ? "bg-primary" : "bg-slate-700",
							)}
						/>
						<div
							className={cn(
								"absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200",
								includeIdentity ? "translate-x-[1.25rem]" : "translate-x-0.5",
							)}
						/>
					</div>
					<div>
						{includeIdentity ? (
							<>
								<p className="text-sm font-medium text-slate-200">Attach my account</p>
								<p className="text-xs text-slate-400 mt-0.5">
									Your display name (<span className="text-slate-300">{user?.username}</span>) and account ID will be included so we can follow up.
								</p>
							</>
						) : (
							<>
								<p className="text-sm font-medium text-slate-200">Submit anonymously</p>
								<p className="text-xs text-slate-400 mt-0.5">
									Your identity will not be attached to this report. Toggle on to let us follow up with you.
								</p>
							</>
						)}
					</div>
				</label>
			</div>

			{/* What we'll include — collapsible transparency section */}
			<div className="border border-slate-700/30 rounded-lg overflow-hidden">
				<button
					type="button"
					onClick={() => setShowDataDetails((v) => !v)}
					className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-colors"
					aria-expanded={showDataDetails}
				>
					<span className="font-medium">What data is included?</span>
					<svg
						className={cn("w-4 h-4 transition-transform", showDataDetails && "rotate-180")}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
					</svg>
				</button>
				<AnimatePresence>
					{showDataDetails && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.2 }}
							className="overflow-hidden"
						>
							<div className="px-4 pb-4 space-y-2">
								<p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Always included (no personal data)</p>
								<ul className="text-xs text-slate-400 space-y-1">
									<li>• Current page: <span className="text-slate-300">{currentPagePath}</span></li>
									<li>• Device type: <span className="text-slate-300">{getDeviceCategory()}</span></li>
									<li>• Browser family: <span className="text-slate-300">{getBrowserFamily()}</span></li>
									<li>• OS family: <span className="text-slate-300">{getOsFamily()}</span></li>
									<li>• Recent errors from this session (last 5, sanitized)</li>
								</ul>
								{includeIdentity && (
									<>
										<p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-3">Also included (you opted in)</p>
										<ul className="text-xs text-slate-400 space-y-1">
											<li>• Display name: <span className="text-slate-300">{user?.username}</span></li>
											<li>• Account ID (internal use only)</li>
										</ul>
									</>
								)}
								<p className="text-xs text-slate-500 mt-2 italic">
									This information contains no message content, voice audio, or IP address.
								</p>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Submit error */}
			{submitError && (
				<div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
					{submitError}
				</div>
			)}

			{/* Actions */}
			<div className="flex gap-3">
				<button
					type="button"
					onClick={handleSubmit}
					disabled={isSubmitting}
					className="flex-1 bg-primary hover:opacity-90 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5 transition-opacity"
				>
					{isSubmitting ? "Submitting..." : "Submit Report"}
				</button>
			</div>
		</div>
	);
}
