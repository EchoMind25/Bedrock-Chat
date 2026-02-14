import { Glass } from "@/components/ui/glass";
import Link from "next/link";

export default function PrivacyPolicyPage() {
	return (
		<div className="flex-1 overflow-y-auto scrollbar-thin p-6">
			<div className="max-w-4xl mx-auto">
				<Glass
					variant="liquid-elevated"
					border="liquid"
					className="p-8"
				>
					<article className="prose prose-invert prose-sm max-w-none [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-slate-200 [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-slate-300 [&_p]:mb-3 [&_li]:text-slate-300 [&_ul]:mb-3 [&_strong]:text-white">
						<h1 className="text-3xl font-bold text-white mb-1">
							Privacy Policy
						</h1>
						<p className="text-slate-400 text-sm mb-8">
							Last updated: February 14, 2026
						</p>

						<h2>1. Introduction</h2>
						<p>
							Bedrock Chat (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or
							&ldquo;us&rdquo;) is committed to protecting your
							privacy. This Privacy Policy explains how we collect,
							use, disclose, and safeguard your information when you
							use our communication platform.
						</p>
						<p>
							By using Bedrock Chat, you agree to the collection and
							use of information in accordance with this policy. If you
							do not agree, please do not use the service.
						</p>

						<h2>2. Information We Collect</h2>

						<h3>2.1 Information You Provide</h3>
						<ul>
							<li>
								<strong>Account information:</strong> username,
								email address, password (hashed)
							</li>
							<li>
								<strong>Profile information:</strong> display name,
								avatar, status
							</li>
							<li>
								<strong>Messages and content:</strong> text
								messages, file uploads, reactions
							</li>
							<li>
								<strong>Server and channel settings:</strong> server
								names, roles, permissions
							</li>
						</ul>

						<h3>2.2 Automatically Collected Information</h3>
						<ul>
							<li>
								Usage data (features accessed, session duration)
							</li>
							<li>
								Device information (browser type, operating system)
							</li>
							<li>
								Voice call metadata (timestamps, participant list,
								duration)
							</li>
							<li>
								Performance metrics (page load times, error reports)
							</li>
						</ul>

						<h3>2.3 What We DO NOT Collect</h3>
						<ul>
							<li>
								<strong>Government IDs or facial scans</strong> --
								never required, never collected
							</li>
							<li>
								<strong>Audio or video recordings</strong> -- only
								metadata is stored (timestamps, participants)
							</li>
							<li>
								<strong>Browsing history</strong> outside our platform
							</li>
							<li>
								<strong>Third-party tracker data</strong> -- no hidden
								surveillance, no advertising pixels
							</li>
						</ul>

						<h2>3. How We Use Your Information</h2>
						<ul>
							<li>
								Provide, maintain, and improve the Bedrock Chat
								service
							</li>
							<li>
								Authenticate and secure your account
							</li>
							<li>
								Enable messaging, voice, and collaboration features
							</li>
							<li>
								Detect and prevent abuse, spam, and security threats
							</li>
							<li>
								Comply with legal obligations
							</li>
						</ul>
						<p>
							We process your data based on contractual necessity
							(providing the service), legitimate interest (security
							and improvement), and your consent (optional analytics
							and marketing).
						</p>

						<h2>4. Data Retention</h2>
						<ul>
							<li>
								<strong>Messages:</strong> retained until you delete
								them or delete your account
							</li>
							<li>
								<strong>Account data:</strong> retained while your
								account is active; deleted within 30 days of account
								deletion
							</li>
							<li>
								<strong>Voice call metadata:</strong> retained for 90
								days
							</li>
							<li>
								<strong>Analytics data:</strong> anonymized after 30
								days
							</li>
							<li>
								<strong>Security logs:</strong> retained for 12
								months
							</li>
						</ul>

						<h2>5. End-to-End Encryption</h2>
						<p>
							Bedrock Chat uses end-to-end encryption (AES-GCM) for
							messages. This means:
						</p>
						<ul>
							<li>
								Messages are encrypted on your device before
								transmission
							</li>
							<li>
								Only you and your intended recipients can read
								messages
							</li>
							<li>
								Our servers cannot decrypt your message content
							</li>
							<li>
								Private keys are stored locally in your
								browser&apos;s IndexedDB
							</li>
							<li>
								Key exchange uses ECDH (Elliptic Curve
								Diffie-Hellman)
							</li>
						</ul>

						<h2>6. Third-Party Services</h2>
						<p>
							We currently use the following third-party services to
							operate Bedrock Chat:
						</p>
						<ul>
							<li>
								<strong>Supabase</strong> -- database, authentication,
								and real-time messaging (PostgreSQL)
							</li>
							<li>
								<strong>Daily.co</strong> -- WebRTC voice and video
								calls
							</li>
							<li>
								<strong>Vercel</strong> -- application hosting and CDN
							</li>
						</ul>
						<p>
							<strong>Note:</strong> These are temporary dependencies.
							We are building self-hosted infrastructure to eliminate
							all third-party data processors. No third-party
							advertising or analytics services are used.
						</p>

						<h2>7. Your Rights</h2>

						<h3>7.1 GDPR Rights (EU/EEA Residents)</h3>
						<ul>
							<li>
								<strong>Right of access:</strong> request a copy of
								your personal data
							</li>
							<li>
								<strong>Right to rectification:</strong> correct
								inaccurate data
							</li>
							<li>
								<strong>Right to erasure:</strong> request deletion
								of your data (&ldquo;right to be forgotten&rdquo;)
							</li>
							<li>
								<strong>Right to restrict processing:</strong> limit
								how we use your data
							</li>
							<li>
								<strong>Right to data portability:</strong> receive
								your data in a machine-readable format
							</li>
							<li>
								<strong>Right to object:</strong> opt out of certain
								data processing
							</li>
						</ul>

						<h3>7.2 CCPA/CPRA Rights (California Residents)</h3>
						<ul>
							<li>
								Right to know what personal information is collected,
								used, and shared
							</li>
							<li>Right to delete personal information</li>
							<li>
								Right to opt out of the sale or sharing of personal
								information (we do not sell your data)
							</li>
							<li>
								Right to limit use of sensitive personal information
							</li>
							<li>Right to non-discrimination</li>
						</ul>

						<p>
							To exercise any of these rights, visit{" "}
							<Link
								href="/data-export"
								className="text-primary hover:underline"
							>
								Data Export
							</Link>{" "}
							or contact us at{" "}
							<a
								href="mailto:privacy@bedrock-chat.com"
								className="text-primary hover:underline"
							>
								privacy@bedrock-chat.com
							</a>
							.
						</p>

						<h2>8. Children&apos;s Privacy (COPPA)</h2>
						<p>
							Users under 13 require parental consent through our
							Family Account system. Parents can:
						</p>
						<ul>
							<li>
								Set monitoring levels (Minimal, Moderate, Balanced,
								Restricted)
							</li>
							<li>
								View a transparency log of all monitoring actions
							</li>
							<li>
								Control which servers their child can join
							</li>
							<li>
								Export or delete their child&apos;s data at any time
							</li>
						</ul>
						<p>
							Teens always see their current monitoring level in
							Settings, ensuring full transparency.
						</p>

						<h2>9. Global Privacy Control (GPC)</h2>
						<p>
							We honor Global Privacy Control (GPC) signals. If your
							browser sends a GPC signal, we automatically disable
							analytics and marketing data collection. We also honor
							Do Not Track (DNT) signals.
						</p>

						<h2>10. Security</h2>
						<p>
							We implement industry-standard security measures
							including:
						</p>
						<ul>
							<li>
								End-to-end encryption for messages (AES-GCM)
							</li>
							<li>TLS/HTTPS for all data in transit</li>
							<li>Secure password hashing</li>
							<li>
								Content Security Policy (CSP) headers
							</li>
							<li>
								Rate limiting and brute-force protection
							</li>
							<li>Regular security reviews</li>
						</ul>

						<h2>11. Data Transfers</h2>
						<p>
							Your data may be processed in the United States where our
							infrastructure is hosted. We ensure appropriate safeguards
							are in place for international data transfers in
							compliance with GDPR requirements.
						</p>

						<h2>12. Changes to This Policy</h2>
						<p>
							We may update this Privacy Policy from time to time. When
							we make changes, we will update the &ldquo;Last
							updated&rdquo; date and prompt you to review the updated
							policy through our consent management system.
						</p>

						<h2>13. Contact Us</h2>
						<p>
							If you have questions about this Privacy Policy or your
							data:
						</p>
						<ul>
							<li>
								Email:{" "}
								<a
									href="mailto:privacy@bedrock-chat.com"
									className="text-primary hover:underline"
								>
									privacy@bedrock-chat.com
								</a>
							</li>
							<li>
								Data Protection Officer:{" "}
								<a
									href="mailto:dpo@bedrock-chat.com"
									className="text-primary hover:underline"
								>
									dpo@bedrock-chat.com
								</a>
							</li>
						</ul>
					</article>
				</Glass>
			</div>
		</div>
	);
}
