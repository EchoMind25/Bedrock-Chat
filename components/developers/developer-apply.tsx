"use client";

import { useState } from "react";
import { Code, Rocket, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button/button";
import { Input, Textarea } from "@/components/ui/input/input";
import { toast } from "@/lib/stores/toast-store";

export function DeveloperApply() {
	const [email, setEmail] = useState("");
	const [intendedUse, setIntendedUse] = useState("");
	const [agreedDPA, setAgreedDPA] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const handleSubmit = async () => {
		if (!email || !intendedUse || !agreedDPA) {
			toast.error("Please fill in all fields and agree to the DPA");
			return;
		}

		setIsSubmitting(true);
		// Placeholder — will POST to /api/platform/developer-application in future
		await new Promise((r) => setTimeout(r, 1000));
		setIsSubmitting(false);
		setSubmitted(true);
		toast.success("Application submitted! We'll review it shortly.");
	};

	if (submitted) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
					<Rocket className="w-8 h-8 text-green-400" />
				</div>
				<h2 className="text-xl font-bold text-white mb-2">Application Submitted</h2>
				<p className="text-slate-400 max-w-md">
					Your developer access application has been submitted. A platform administrator
					will review it and you'll be notified when access is granted.
				</p>
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto py-12">
			<div className="text-center mb-10">
				<div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
					<Code className="w-8 h-8 text-blue-400" />
				</div>
				<h2 className="text-2xl font-bold text-white mb-2">Developer Program</h2>
				<p className="text-slate-400">
					Build bots, integrations, and tools for the Bedrock platform.
				</p>
			</div>

			{/* Benefits */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
				<div className="p-4 rounded-xl border border-white/10 bg-white/5">
					<Zap className="w-5 h-5 text-yellow-400 mb-2" />
					<h3 className="text-sm font-semibold text-white mb-1">Register Bots</h3>
					<p className="text-xs text-slate-400">Create and deploy custom bots to any server</p>
				</div>
				<div className="p-4 rounded-xl border border-white/10 bg-white/5">
					<Shield className="w-5 h-5 text-green-400 mb-2" />
					<h3 className="text-sm font-semibold text-white mb-1">Webhook Access</h3>
					<p className="text-xs text-slate-400">Send and receive events via secure webhooks</p>
				</div>
				<div className="p-4 rounded-xl border border-white/10 bg-white/5">
					<Code className="w-5 h-5 text-blue-400 mb-2" />
					<h3 className="text-sm font-semibold text-white mb-1">Analytics</h3>
					<p className="text-xs text-slate-400">Track bot usage with aggregate analytics</p>
				</div>
			</div>

			{/* Application Form */}
			<div className="space-y-4 p-6 rounded-xl border border-white/10 bg-white/5">
				<h3 className="text-lg font-semibold text-white">Apply for Developer Access</h3>

				<Input
					label="Contact Email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					helperText="We'll send status updates to this email"
				/>

				<Textarea
					label="Intended Use"
					value={intendedUse}
					onChange={(e) => setIntendedUse(e.target.value)}
					helperText="Describe what you plan to build (max 500 characters)"
					maxLength={500}
				/>

				<label className="flex items-start gap-3 cursor-pointer group">
					<input
						type="checkbox"
						checked={agreedDPA}
						onChange={(e) => setAgreedDPA(e.target.checked)}
						className="mt-1 w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
					/>
					<span className="text-sm text-slate-300 group-hover:text-slate-200">
						I agree to the{" "}
						<span className="text-blue-400 hover:underline">
							Bedrock Data Processing Agreement
						</span>{" "}
						and will handle user data in accordance with GDPR and COPPA requirements.
					</span>
				</label>

				<Button
					onClick={handleSubmit}
					disabled={!email || !intendedUse || !agreedDPA || isSubmitting}
					className="w-full"
				>
					{isSubmitting ? "Submitting..." : "Submit Application"}
				</Button>
			</div>
		</div>
	);
}
