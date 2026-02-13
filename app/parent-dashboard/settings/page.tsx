"use client";

import { useState } from "react";
import { useParentDashboardStore } from "@/store/parent-dashboard.store";
import { useAuthStore } from "@/store/auth.store";
import {
	Bell,
	Mail,
	Smartphone,
	FileText,
	Database,
	Shield,
	Sun,
	Moon,
	Download,
	ExternalLink,
	Check,
} from "lucide-react";

export default function SettingsPage() {
	const darkMode = useParentDashboardStore((s) => s.darkMode);
	const toggleDarkMode = useParentDashboardStore((s) => s.toggleDarkMode);
	const user = useAuthStore((s) => s.user);

	const [emailNotifications, setEmailNotifications] = useState(true);
	const [pushNotifications, setPushNotifications] = useState(false);
	const [dailyDigest, setDailyDigest] = useState(true);
	const [alertThreshold, setAlertThreshold] = useState<"all" | "medium-high" | "high-only">("all");

	const [activityRetention, setActivityRetention] = useState(90);
	const [messageRetention, setMessageRetention] = useState(30);
	const [voiceRetention, setVoiceRetention] = useState(60);
	const [autoDelete, setAutoDelete] = useState(true);

	const [saved, setSaved] = useState(false);

	const handleSave = () => {
		setSaved(true);
		setTimeout(() => setSaved(false), 2000);
	};

	return (
		<div className="max-w-3xl mx-auto p-4 lg:p-6 space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-semibold" style={{ color: "var(--pd-text)" }}>
					Settings
				</h1>
				<p className="text-sm mt-1" style={{ color: "var(--pd-text-muted)" }}>
					Configure your Parent Dashboard preferences
				</p>
			</div>

			{/* Notification Preferences */}
			<div className="pd-card p-5 space-y-4">
				<div className="flex items-center gap-2">
					<Bell size={18} style={{ color: "var(--pd-primary)" }} />
					<h2 className="text-base font-semibold" style={{ color: "var(--pd-text)" }}>
						Notification Preferences
					</h2>
				</div>

				<ToggleRow
					icon={<Mail size={16} />}
					label="Email Notifications"
					description="Receive alerts via email"
					value={emailNotifications}
					onChange={setEmailNotifications}
				/>
				<ToggleRow
					icon={<Smartphone size={16} />}
					label="Push Notifications"
					description="Receive push notifications on mobile"
					value={pushNotifications}
					onChange={setPushNotifications}
				/>
				<ToggleRow
					icon={<FileText size={16} />}
					label="Daily Digest"
					description="Receive a daily summary email"
					value={dailyDigest}
					onChange={setDailyDigest}
				/>

				<div className="pt-2" style={{ borderTop: "1px solid var(--pd-border)" }}>
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium" style={{ color: "var(--pd-text)" }}>
								Alert Threshold
							</p>
							<p className="text-xs" style={{ color: "var(--pd-text-muted)" }}>
								Minimum severity to trigger alerts
							</p>
						</div>
						<select
							value={alertThreshold}
							onChange={(e) => setAlertThreshold(e.target.value as typeof alertThreshold)}
							className="px-3 py-1.5 rounded-lg text-sm"
							style={{
								background: "var(--pd-bg-secondary)",
								color: "var(--pd-text)",
								border: "1px solid var(--pd-border)",
							}}
						>
							<option value="all">All Alerts</option>
							<option value="medium-high">Medium & High</option>
							<option value="high-only">High Only</option>
						</select>
					</div>
				</div>
			</div>

			{/* Data Retention */}
			<div className="pd-card p-5 space-y-4">
				<div className="flex items-center gap-2">
					<Database size={18} style={{ color: "var(--pd-primary)" }} />
					<h2 className="text-base font-semibold" style={{ color: "var(--pd-text)" }}>
						Data Retention
					</h2>
				</div>

				<RetentionRow
					label="Activity Log"
					description="How long to keep activity log entries"
					value={activityRetention}
					onChange={setActivityRetention}
					options={[30, 60, 90, 180, 365]}
				/>
				<RetentionRow
					label="Message Access Logs"
					description="How long to keep message access records"
					value={messageRetention}
					onChange={setMessageRetention}
					options={[7, 14, 30, 60, 90]}
				/>
				<RetentionRow
					label="Voice Metadata"
					description="How long to keep voice call metadata"
					value={voiceRetention}
					onChange={setVoiceRetention}
					options={[14, 30, 60, 90]}
				/>

				<ToggleRow
					icon={<Database size={16} />}
					label="Auto-Delete Expired Data"
					description="Automatically remove data past retention period"
					value={autoDelete}
					onChange={setAutoDelete}
				/>
			</div>

			{/* Compliance */}
			<div className="pd-card p-5 space-y-4">
				<div className="flex items-center gap-2">
					<Shield size={18} style={{ color: "var(--pd-success)" }} />
					<h2 className="text-base font-semibold" style={{ color: "var(--pd-text)" }}>
						Compliance & Privacy
					</h2>
				</div>

				<div className="space-y-3">
					<div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "var(--pd-success-light)" }}>
						<Check size={18} className="mt-0.5 shrink-0" style={{ color: "var(--pd-success)" }} />
						<div>
							<p className="text-sm font-medium" style={{ color: "var(--pd-success)" }}>
								COPPA Compliant
							</p>
							<p className="text-xs" style={{ color: "var(--pd-text-muted)" }}>
								Parental consent verified and active
							</p>
						</div>
					</div>

					<div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--pd-bg-secondary)" }}>
						<div>
							<p className="text-sm font-medium" style={{ color: "var(--pd-text)" }}>
								Privacy Policy
							</p>
							<p className="text-xs" style={{ color: "var(--pd-text-muted)" }}>
								Review how we handle family data
							</p>
						</div>
						<ExternalLink size={16} style={{ color: "var(--pd-text-muted)" }} />
					</div>

					<div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--pd-bg-secondary)" }}>
						<div>
							<p className="text-sm font-medium" style={{ color: "var(--pd-text)" }}>
								Export All Data
							</p>
							<p className="text-xs" style={{ color: "var(--pd-text-muted)" }}>
								Download all monitoring data as JSON
							</p>
						</div>
						<Download size={16} style={{ color: "var(--pd-text-muted)" }} />
					</div>
				</div>
			</div>

			{/* Appearance */}
			<div className="pd-card p-5 space-y-4">
				<h2 className="text-base font-semibold" style={{ color: "var(--pd-text)" }}>
					Appearance
				</h2>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						{darkMode ? <Moon size={16} style={{ color: "var(--pd-text-secondary)" }} /> : <Sun size={16} style={{ color: "var(--pd-text-secondary)" }} />}
						<div>
							<p className="text-sm font-medium" style={{ color: "var(--pd-text)" }}>
								Dark Mode
							</p>
							<p className="text-xs" style={{ color: "var(--pd-text-muted)" }}>
								Toggle dark theme for the dashboard
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={toggleDarkMode}
						className="w-10 h-6 rounded-full transition-colors relative"
						style={{ background: darkMode ? "var(--pd-primary)" : "var(--pd-border)" }}
					>
						<span
							className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
							style={{ left: darkMode ? "18px" : "2px" }}
						/>
					</button>
				</div>
			</div>

			{/* Save */}
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={handleSave}
					className="px-6 py-2.5 rounded-lg text-sm font-medium text-white"
					style={{ background: "var(--pd-primary)" }}
				>
					Save Settings
				</button>
				{saved && (
					<span className="text-sm flex items-center gap-1" style={{ color: "var(--pd-success)" }}>
						<Check size={16} /> Saved
					</span>
				)}
			</div>
		</div>
	);
}

function ToggleRow({
	icon,
	label,
	description,
	value,
	onChange,
}: {
	icon?: React.ReactNode;
	label: string;
	description: string;
	value: boolean;
	onChange: (val: boolean) => void;
}) {
	return (
		<div className="flex items-center justify-between py-1">
			<div className="flex items-start gap-3">
				{icon && <span className="mt-0.5 shrink-0" style={{ color: "var(--pd-text-secondary)" }}>{icon}</span>}
				<div>
					<p className="text-sm font-medium" style={{ color: "var(--pd-text)" }}>
						{label}
					</p>
					<p className="text-xs" style={{ color: "var(--pd-text-muted)" }}>
						{description}
					</p>
				</div>
			</div>
			<button
				type="button"
				onClick={() => onChange(!value)}
				className="w-10 h-6 rounded-full transition-colors relative shrink-0"
				style={{ background: value ? "var(--pd-primary)" : "var(--pd-border)" }}
			>
				<span
					className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
					style={{ left: value ? "18px" : "2px" }}
				/>
			</button>
		</div>
	);
}

function RetentionRow({
	label,
	description,
	value,
	onChange,
	options,
}: {
	label: string;
	description: string;
	value: number;
	onChange: (val: number) => void;
	options: number[];
}) {
	return (
		<div className="flex items-center justify-between py-1">
			<div>
				<p className="text-sm font-medium" style={{ color: "var(--pd-text)" }}>
					{label}
				</p>
				<p className="text-xs" style={{ color: "var(--pd-text-muted)" }}>
					{description}
				</p>
			</div>
			<select
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="px-3 py-1.5 rounded-lg text-sm"
				style={{
					background: "var(--pd-bg-secondary)",
					color: "var(--pd-text)",
					border: "1px solid var(--pd-border)",
				}}
			>
				{options.map((days) => (
					<option key={days} value={days}>
						{days} days
					</option>
				))}
			</select>
		</div>
	);
}
