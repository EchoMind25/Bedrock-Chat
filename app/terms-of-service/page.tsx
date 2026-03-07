import { Glass } from "@/components/ui/glass";
import Link from "next/link";

export default function TermsOfServicePage() {
	return (
		<div className="min-h-screen bg-[oklch(0.12_0.02_250)] overflow-y-auto scrollbar-thin p-6 py-12">
			<div className="max-w-4xl mx-auto">
				<Link
					href="/"
					className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors mb-6"
				>
					&larr; Back to Home
				</Link>
				<Glass
					variant="liquid-elevated"
					border="liquid"
					className="p-8"
				>
					<article className="prose prose-invert prose-sm max-w-none [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-slate-200 [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-slate-300 [&_p]:mb-3 [&_li]:text-slate-300 [&_ul]:mb-3 [&_strong]:text-white">
						<h1 className="text-3xl font-bold text-white mb-1">
							Terms of Use
						</h1>
						<p className="text-slate-400 text-sm mb-8">
							Last updated: March 4, 2026 &middot; Version 2.0.0
						</p>

						<p>
							These Terms of Use are written in plain English on
							purpose. We believe you shouldn&apos;t need a law
							degree to understand the rules of a chat app.
						</p>

						{/* ===== 1. WHAT BEDROCK CHAT IS ===== */}
						<h2>1. What Bedrock Chat Is</h2>
						<p>
							Bedrock Chat is a privacy-first communication
							platform built for families, gamers, and communities.
							Think of it as a Discord alternative that puts your
							privacy first &mdash; no surveillance, no ad
							tracking, no selling your data. We offer text
							channels, voice and video calls, direct messages,
							servers, and family safety features.
						</p>
						<p>
							Bedrock Chat is built and operated by Bedrock AI
							Systems (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or
							&ldquo;us&rdquo;). These Terms of Use
							(&ldquo;Terms&rdquo;) are a legal agreement between
							you and Bedrock AI Systems that govern your use of
							the platform.
						</p>
						<p>
							<strong>
								By creating an account or using Bedrock Chat,
								you agree to these Terms.
							</strong>{" "}
							If you don&apos;t agree, please don&apos;t use the
							service.
						</p>

						{/* ===== 2. WHO CAN USE IT ===== */}
						<h2>2. Who Can Use It</h2>

						<h3>2.1 Age Requirements</h3>
						<ul>
							<li>
								<strong>Under 13:</strong> You need a parent or
								guardian to create and manage your account
								through a Family Account. This is required by
								U.S. law (COPPA). Your parent must provide
								verifiable consent before your account is
								activated.
							</li>
							<li>
								<strong>Ages 13&ndash;17:</strong> You can
								create your own account. We strongly encourage
								using a Family Account so your parents can help
								keep you safe online.
							</li>
							<li>
								<strong>18 and older:</strong> Full access. You
								are responsible for your own account.
							</li>
						</ul>

						<h3>2.2 Account Types</h3>
						<ul>
							<li>
								<strong>Standard:</strong> For adults and teens
								13+. Full features.
							</li>
							<li>
								<strong>Parent:</strong> For parents/guardians
								who want to manage Family Accounts. Includes
								access to the parent dashboard and monitoring
								tools.
							</li>
							<li>
								<strong>Teen:</strong> Created by a parent
								through a Family Account. Subject to the
								monitoring level set by the parent (see
								Section 5).
							</li>
						</ul>

						<h3>2.3 Account Registration</h3>
						<ul>
							<li>
								Provide accurate information (you don&apos;t
								need a government ID &mdash; just a valid email
								and, for teen accounts, a date of birth)
							</li>
							<li>One account per person &mdash; no sharing accounts</li>
							<li>
								Choose a strong password (8+ characters,
								uppercase, lowercase, number) and keep it
								private
							</li>
							<li>
								Don&apos;t impersonate someone else when
								creating your account
							</li>
						</ul>

						{/* ===== 3. WHAT YOU CAN DO ===== */}
						<h2>3. What You Can Do</h2>
						<p>
							Bedrock Chat is your platform. You have the right
							to:
						</p>
						<ul>
							<li>
								Create and join servers, channels, and
								conversations
							</li>
							<li>
								Send text messages, share files, react with
								emoji, and use voice/video calls
							</li>
							<li>
								Create and manage your own servers with custom
								roles and moderation tools
							</li>
							<li>
								Customize your profile, theme, and notification
								preferences
							</li>
							<li>
								Export all your data at any time in
								machine-readable format
							</li>
							<li>Delete your account and all associated data at any time</li>
							<li>
								Opt out of anonymous analytics with no penalty
								or reduced functionality
							</li>
							<li>
								Know exactly what monitoring is happening on
								your account (for teen accounts)
							</li>
							<li>
								Appeal any moderation action taken against you
							</li>
						</ul>

						{/* ===== 4. WHAT YOU CANNOT DO ===== */}
						<h2>4. What You Cannot Do</h2>
						<p>
							The following are strictly prohibited. Violations
							may result in immediate account termination:
						</p>
						<ul>
							<li>
								<strong>
									Sharing child sexual abuse material (CSAM)
									or exploiting minors
								</strong>{" "}
								in any way &mdash; this results in a permanent
								ban, report to law enforcement, and a mandatory
								report to NCMEC (the National Center for
								Missing &amp; Exploited Children) as required by
								18 U.S.C. &sect;2258A. Zero tolerance. No
								exceptions.
							</li>
							<li>
								<strong>Harassment, bullying, or threats</strong>{" "}
								&mdash; targeted abuse, hate speech, or threats
								of violence against any person or group
							</li>
							<li>
								<strong>Doxxing</strong> &mdash; sharing
								someone&apos;s private information (real name,
								address, phone number, etc.) without their
								consent
							</li>
							<li>
								<strong>
									Self-harm or suicide encouragement
								</strong>{" "}
								&mdash; content that promotes or glorifies
								self-harm
							</li>
							<li>
								<strong>Illegal sales</strong> &mdash; drugs,
								weapons, stolen goods, or any other illegal
								transactions
							</li>
							<li>
								<strong>Scams, spam, or phishing</strong> &mdash;
								tricking people into giving up personal
								information or money
							</li>
							<li>
								<strong>Malware or hacking</strong> &mdash;
								distributing harmful software or attempting to
								exploit vulnerabilities in Bedrock Chat or other
								users&apos; systems
							</li>
							<li>
								<strong>Impersonation</strong> &mdash; pretending
								to be another user, a Bedrock employee, or any
								other real person
							</li>
							<li>
								<strong>Ban evasion</strong> &mdash; creating new
								accounts to get around a suspension or ban
							</li>
							<li>
								<strong>Unauthorized bots</strong> &mdash;
								running automated tools or bots without explicit
								permission
							</li>
							<li>
								<strong>
									Circumventing family monitoring
								</strong>{" "}
								&mdash; for teen accounts, attempting to bypass,
								disable, or hide from parental monitoring
								features
							</li>
							<li>
								<strong>
									Attempting to de-anonymize other users
								</strong>{" "}
								&mdash; trying to uncover the real identity of
								other users without their consent
							</li>
						</ul>
						<p>
							We respect gaming culture. Friendly trash talk and
							competitive banter are part of the experience. But
							there&apos;s a line between banter and harassment
							&mdash; and you know where it is.
						</p>

						{/* ===== 5. FAMILY ACCOUNTS ===== */}
						<h2>5. Family Accounts &mdash; Rights &amp; Responsibilities</h2>
						<p>
							Family Accounts are how we balance teen safety with
							teen privacy. Unlike platforms that secretly scan
							everything, our monitoring is{" "}
							<strong>completely transparent</strong>.
						</p>

						<h3>5.1 How Monitoring Works</h3>
						<p>
							Parents choose a monitoring level for their
							teen&apos;s account:
						</p>
						<ul>
							<li>
								<strong>Minimal:</strong> Parent can see server
								list and friend list. No message access.
							</li>
							<li>
								<strong>Moderate:</strong> Parent can also see
								message frequency, online time, and request to
								view messages.
							</li>
							<li>
								<strong>Supervised:</strong> Parent receives AI
								content flags. Server joins and friend requests
								require parental approval before taking effect.
							</li>
							<li>
								<strong>Restricted:</strong> Whitelist-only
								communication. Keyword alerts, time limits, and
								complete activity logging. Friend requests also
								require approval.
							</li>
						</ul>

						<h3>5.2 What Parents Can Do</h3>
						<ul>
							<li>Choose and change the monitoring level at any time</li>
							<li>View who their teen communicates with</li>
							<li>
								See message history (depending on monitoring
								level)
							</li>
							<li>Approve or deny server joins and friend requests (Level 3+)</li>
							<li>Set keyword alerts and time limits (Level 4)</li>
							<li>
								Export or delete their child&apos;s data at any
								time
							</li>
							<li>Dissolve the Family Account at any time</li>
						</ul>

						<h3>5.3 What Parents Cannot Do</h3>
						<ul>
							<li>
								<strong>Monitor secretly</strong> &mdash; every
								parent action is logged in a transparency log
								that the teen can see in real-time. A
								non-dismissible badge is always visible to the
								teen and their friends showing that monitoring is
								active. This transparency is enforced at the
								database level and cannot be bypassed.
							</li>
							<li>
								<strong>
									Listen to voice calls
								</strong>{" "}
								&mdash; parents can see who the teen talked to
								and for how long, but voice audio is never
								recorded (see Section 6)
							</li>
							<li>
								<strong>
									Prevent dissolution at 18
								</strong>{" "}
								&mdash; when the teen turns 18, they can
								dissolve the Family Account on their own
							</li>
						</ul>

						<h3>5.4 What Teens Get</h3>
						<ul>
							<li>
								<strong>Transparency:</strong> You always know
								your monitoring level and can see a complete log
								of every action your parent has taken
							</li>
							<li>
								<strong>Awareness:</strong> Your friends see a
								badge when chatting with you, so everyone knows
								monitoring is active
							</li>
							<li>
								<strong>Voice:</strong> You can request changes
								to your monitoring level
							</li>
							<li>
								<strong>Independence:</strong> At 18, you can
								dissolve the Family Account and convert to a
								standard account
							</li>
						</ul>

						<h3>5.5 COPPA Compliance (Under 13)</h3>
						<p>
							For users under 13, a parent must create the account
							and provide verifiable consent. Parents can review,
							export, or delete their child&apos;s data at any
							time. We do not serve ads to children or collect data
							beyond what is needed to provide the service.
						</p>
						<p>
							<strong>
								Anonymous analytics is completely disabled for
								users under 13.
							</strong>{" "}
							No usage events, no session tokens, no collection of
							any kind. For users ages 13&ndash;15, only
							anonymized page views are collected. See our{" "}
							<Link
								href="/privacy-policy"
								className="text-primary hover:underline"
							>
								Privacy Policy
							</Link>{" "}
							for full details.
						</p>

						{/* ===== 6. VOICE CHANNELS — THE GAMER CODE ===== */}
						<h2>6. Voice Channels &mdash; The Gamer Code</h2>
						<p>
							Voice chat follows what we call the &ldquo;gamer
							code&rdquo; &mdash; your conversations are yours.
							Here is our commitment, plainly stated:
						</p>

						<h3>6.1 What We Store</h3>
						<ul>
							<li>Who was in the voice/video call (participant list)</li>
							<li>When it started and ended (timestamps)</li>
							<li>How long it lasted (duration)</li>
							<li>Whether video or screen sharing was used (yes/no only)</li>
						</ul>

						<h3>6.2 What We Do NOT Store</h3>
						<ul>
							<li>Audio recordings &mdash; ever, under any circumstances</li>
							<li>Video recordings</li>
							<li>Voice transcriptions or summaries</li>
							<li>Screen share content</li>
						</ul>
						<p>
							This is not just a policy &mdash; it is
							architecturally enforced. Our voice infrastructure
							(LiveKit WebRTC) is configured for real-time
							streaming only. No recording capability is enabled.
							There is no mechanism to record your calls, even if
							we wanted to.
						</p>

						<h3>6.3 Parental Oversight for Minors</h3>
						<p>
							If you are on a Family Account, your parent can see{" "}
							<strong>who</strong> you talked to and{" "}
							<strong>for how long</strong>. They cannot hear{" "}
							<strong>what was said</strong>. This is the balance:
							safety oversight without surveillance.
						</p>

						<h3>6.4 Law Enforcement and Voice Data</h3>
						<p>
							If law enforcement requests voice call recordings,
							we cannot provide them because they do not exist. We
							can only provide the metadata listed in Section 6.1
							(who, when, how long).
						</p>

						<h3>6.5 External Recording</h3>
						<p>
							If you choose to record a call using external
							software, you must have the consent of all
							participants. Recording without consent may violate
							the law in your jurisdiction and will result in
							account action.
						</p>

						{/* ===== 7. CONTENT & OWNERSHIP ===== */}
						<h2>7. Content &amp; Ownership</h2>

						<h3>7.1 Your Content</h3>
						<p>
							When you post content on Bedrock Chat,{" "}
							<strong>you still own it</strong>. We need permission
							to show it to other users and store it on our
							servers so the service works. That&apos;s it.
						</p>
						<p>
							Specifically, you grant Bedrock Chat a limited,
							non-exclusive, royalty-free license to display,
							transmit, and store your content solely for the
							purpose of providing the service. This license ends
							when you delete your content or your account.
						</p>
						<p>
							<strong>We will not</strong> use your content for
							advertising, training AI models, or any other
							purpose without your explicit permission.
						</p>

						<h3>7.2 Other People&apos;s Content</h3>
						<p>
							Respect copyright and intellectual property.
							Don&apos;t share content you don&apos;t have the
							right to share. If you believe someone is infringing
							your copyright, contact us at{" "}
							<a
								href="mailto:legal@bedrockchat.com"
								className="text-primary hover:underline"
							>
								legal@bedrockchat.com
							</a>{" "}
							with a DMCA notice.
						</p>

						<h3>7.3 What Happens to Content on Deletion</h3>
						<ul>
							<li>
								Profile is removed within 24 hours
							</li>
							<li>
								Messages are deleted within 30 days
							</li>
							<li>
								Encryption keys are destroyed (when E2E is
								deployed, this makes encrypted content
								permanently unrecoverable)
							</li>
							<li>
								Backup copies are purged within 90 days
							</li>
						</ul>

						{/* ===== 8. SERVICE AVAILABILITY ===== */}
						<h2>8. Service Availability &amp; Changes</h2>
						<p>
							Bedrock Chat is currently in beta. We work hard to
							keep it running, but we cannot guarantee 100%
							uptime.
						</p>
						<ul>
							<li>
								We do not offer formal SLA guarantees during
								beta
							</li>
							<li>
								We may need to take the service offline for
								maintenance with reasonable notice
							</li>
							<li>
								We will communicate significant changes via
								email and in-app notification with at least 30
								days notice
							</li>
							<li>
								If we ever discontinue Bedrock Chat, we will
								give you at least 90 days notice and ensure you
								can export all your data
							</li>
						</ul>

						{/* ===== 9. LAW ENFORCEMENT ===== */}
						<h2>9. Law Enforcement &amp; Legal Requests</h2>
						<p>
							We believe in being transparent about how we handle
							legal requests. Here is what we can and cannot
							provide:
						</p>

						<h3>9.1 What Data We Have That Could Be Provided</h3>
						<ul>
							<li>Account information (username, email, account creation date)</li>
							<li>Message content (currently stored in our database)</li>
							<li>Server membership and role information</li>
							<li>Voice call metadata (who, when, how long &mdash; no audio)</li>
							<li>Content reports and moderation actions</li>
							<li>Login timestamps</li>
						</ul>

						<h3>9.2 What Data We Do NOT Have</h3>
						<ul>
							<li>
								<strong>Voice recordings</strong> &mdash; audio
								is never recorded and does not exist in our
								systems
							</li>
							<li>
								<strong>IP addresses</strong> &mdash; used only
								momentarily for rate limiting and never stored
							</li>
							<li>
								<strong>Browsing history</strong> outside our
								platform
							</li>
							<li>
								<strong>Device identifiers</strong> &mdash; we
								do not fingerprint devices
							</li>
						</ul>

						<h3>9.3 Our Process</h3>
						<ul>
							<li>
								We require valid legal process (warrant,
								subpoena, court order) before disclosing user
								data
							</li>
							<li>
								We will notify affected users when legally
								permitted to do so
							</li>
							<li>
								CSAM reports are filed with NCMEC as required by
								federal law (18 U.S.C. &sect;2258A)
							</li>
							<li>
								We will challenge overly broad or legally
								deficient requests
							</li>
						</ul>

						{/* ===== 10. PRIVACY & DATA PROTECTION SUMMARY ===== */}
						<h2>10. Privacy &amp; Data Protection</h2>
						<p>
							Privacy is the foundation of Bedrock Chat. Our full{" "}
							<Link
								href="/privacy-policy"
								className="text-primary hover:underline"
							>
								Privacy Policy
							</Link>{" "}
							covers every detail, but here are the highlights:
						</p>
						<ul>
							<li>
								<strong>No data sales:</strong> We will never
								sell your personal information to anyone
							</li>
							<li>
								<strong>No ad trackers:</strong> We don&apos;t
								use advertising pixels, hidden trackers, or
								surveillance technology
							</li>
							<li>
								<strong>Messages:</strong> Encrypted in transit
								(TLS) and at rest (database encryption). E2E
								encryption library is built and integration is
								in active development.{" "}
								<strong>
									Messages are not yet end-to-end encrypted.
								</strong>
							</li>
							<li>
								<strong>Anonymous analytics:</strong> Anonymous
								usage data that cannot identify you. Opt out
								anytime in Settings. Completely disabled for
								under 13.
							</li>
							<li>
								<strong>Your rights:</strong> Access, export, or
								delete your data anytime through{" "}
								<Link
									href="/data-export"
									className="text-primary hover:underline"
								>
									Data Export
								</Link>
							</li>
							<li>
								<strong>GDPR &amp; CCPA compliant:</strong> We
								respect your legal rights regardless of where
								you live
							</li>
						</ul>
						<p>
							No government IDs. No facial scans. No personal
							tracking. That&apos;s the Bedrock promise.
						</p>

						{/* ===== 11. MODERATION & ENFORCEMENT ===== */}
						<h2>11. Moderation &amp; Enforcement</h2>

						<h3>11.1 How Moderation Works</h3>
						<ul>
							<li>
								<strong>User reports:</strong> Community members
								can report content that violates these Terms
							</li>
							<li>
								<strong>Server moderation:</strong> Server
								owners and their moderators manage their own
								communities
							</li>
							<li>
								<strong>AI assistance (opt-in):</strong> Server
								owners can enable AI-powered moderation to help
								flag potentially harmful content &mdash; this is
								always opt-in, never forced
							</li>
							<li>
								<strong>Human review:</strong> Serious reports
								are reviewed by real people, not just algorithms
							</li>
						</ul>

						<h3>11.2 Enforcement Ladder</h3>
						<p>
							Depending on severity, we may take one or more of
							these actions:
						</p>
						<ul>
							<li>Warning</li>
							<li>Content removal</li>
							<li>Temporary mute or restriction</li>
							<li>Server ban (by server moderators)</li>
							<li>Account suspension (temporary)</li>
							<li>Account termination (permanent)</li>
						</ul>

						<h3>11.3 Appeals</h3>
						<p>
							If you believe a moderation action was unfair,
							email{" "}
							<a
								href="mailto:support@bedrockchat.com"
								className="text-primary hover:underline"
							>
								support@bedrockchat.com
							</a>{" "}
							with your username and a description of the
							situation. We will review your appeal within 7
							business days.
						</p>

						{/* ===== 12. TERMINATION ===== */}
						<h2>12. Termination</h2>

						<h3>12.1 You Can Leave Anytime</h3>
						<p>
							You can delete your account at any time through
							Settings or by contacting{" "}
							<a
								href="mailto:support@bedrockchat.com"
								className="text-primary hover:underline"
							>
								support@bedrockchat.com
							</a>
							. When you delete your account:
						</p>
						<ul>
							<li>Profile removed within 24 hours</li>
							<li>Messages deleted within 30 days</li>
							<li>
								Encryption keys destroyed (content becomes
								permanently unrecoverable once E2E is deployed)
							</li>
							<li>Backup copies purged within 90 days</li>
						</ul>

						<h3>12.2 We Can Terminate for Violations</h3>
						<p>
							If you violate these Terms, we may suspend or
							terminate your account. We will try to notify you
							before taking action, except in severe cases
							(illegal content, active threats to safety, or court
							orders).
						</p>

						{/* ===== 13. DISCLAIMERS & LIABILITY ===== */}
						<h2>13. Disclaimers &amp; Limitation of Liability</h2>

						<h3>13.1 &ldquo;As Is&rdquo; Service</h3>
						<p>
							We work hard to keep Bedrock Chat running smoothly,
							but we provide the service &ldquo;as is&rdquo; and
							&ldquo;as available&rdquo; without warranties of any
							kind, whether express or implied. This includes
							warranties of merchantability, fitness for a
							particular purpose, and non-infringement.
						</p>

						<h3>13.2 What We Are Not Responsible For</h3>
						<ul>
							<li>Content posted by other users</li>
							<li>Outages caused by third-party services</li>
							<li>
								Data loss beyond what our encryption and backups
								can prevent
							</li>
							<li>
								Actions taken by server owners or moderators in
								their communities
							</li>
							<li>
								Indirect, incidental, or consequential damages
								arising from your use of the service
							</li>
						</ul>

						<h3>13.3 Liability Cap</h3>
						<p>
							To the maximum extent permitted by law, Bedrock AI
							Systems&apos; total liability to you for any claims
							related to the service is limited to the amount you
							paid us in the 12 months before the claim arose, or
							$100, whichever is greater.
						</p>

						<h3>13.4 Force Majeure</h3>
						<p>
							We are not liable for delays or failures caused by
							events outside our reasonable control, including
							natural disasters, internet outages, government
							actions, or cyberattacks.
						</p>

						{/* ===== 14. DISPUTE RESOLUTION ===== */}
						<h2>14. Governing Law &amp; Disputes</h2>

						<h3>14.1 Informal Resolution First</h3>
						<p>
							If you have a dispute with us, please email{" "}
							<a
								href="mailto:support@bedrockchat.com"
								className="text-primary hover:underline"
							>
								support@bedrockchat.com
							</a>{" "}
							first. We will try to resolve it informally within
							30 days.
						</p>

						<h3>14.2 Binding Arbitration</h3>
						<p>
							If we cannot resolve it informally, disputes will be
							settled through binding arbitration on an individual
							basis. You agree that disputes will be resolved
							individually &mdash; not as part of a class action
							or representative proceeding.
						</p>
						<p className="text-slate-400 text-sm">
							Note: Class action waivers may not be enforceable
							in all jurisdictions. Where prohibited by law, this
							provision will not apply.
						</p>

						<h3>14.3 Small Claims Court</h3>
						<p>
							Either party can bring claims in small claims court
							if the claim qualifies.
						</p>

						<h3>14.4 Governing Law</h3>
						<p>
							These Terms are governed by the laws of the State of
							Delaware, United States, without regard to conflict
							of law principles.
						</p>

						{/* ===== 15. GENERAL PROVISIONS ===== */}
						<h2>15. General Provisions</h2>
						<ul>
							<li>
								<strong>Entire agreement:</strong> These Terms,
								together with our{" "}
								<Link
									href="/privacy-policy"
									className="text-primary hover:underline"
								>
									Privacy Policy
								</Link>
								, are the complete agreement between you and
								Bedrock AI Systems
							</li>
							<li>
								<strong>Severability:</strong> If any part of
								these Terms is found to be unenforceable, the
								rest still applies
							</li>
							<li>
								<strong>No waiver:</strong> If we don&apos;t
								enforce a rule once, that doesn&apos;t mean we
								won&apos;t in the future
							</li>
							<li>
								<strong>Assignment:</strong> We may transfer
								these Terms as part of a business change. You
								cannot transfer your rights under these Terms
							</li>
							<li>
								<strong>Updates:</strong> We will give at least
								30 days notice of significant changes via email
								or in-app notification. Parents of minor users
								are notified separately.
							</li>
						</ul>

						{/* ===== 16. CONTACT ===== */}
						<h2>16. Contact</h2>
						<p>
							We are real people, and we read our email. Reach us
							at:
						</p>
						<ul>
							<li>
								General support:{" "}
								<a
									href="mailto:support@bedrockchat.com"
									className="text-primary hover:underline"
								>
									support@bedrockchat.com
								</a>
							</li>
							<li>
								Legal inquiries:{" "}
								<a
									href="mailto:legal@bedrockchat.com"
									className="text-primary hover:underline"
								>
									legal@bedrockchat.com
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
						<p className="text-slate-400 text-sm mt-8 pt-4 border-t border-slate-700">
							Bedrock AI Systems &mdash; Privacy-first
							communication for families.
							<br />
							<strong>Legal counsel review recommended</strong>{" "}
							before publishing. This document reflects actual
							platform behavior as of the date above.
						</p>
					</article>
				</Glass>
			</div>
		</div>
	);
}
