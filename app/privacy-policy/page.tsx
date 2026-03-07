import { Glass } from "@/components/ui/glass";
import Link from "next/link";

export default function PrivacyPolicyPage() {
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
					<article className="prose prose-invert prose-sm max-w-none [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-slate-200 [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-slate-300 [&_p]:mb-3 [&_li]:text-slate-300 [&_ul]:mb-3 [&_strong]:text-white [&_table]:w-full [&_th]:text-left [&_th]:text-slate-200 [&_th]:py-2 [&_th]:px-3 [&_th]:border-b [&_th]:border-slate-700 [&_td]:py-2 [&_td]:px-3 [&_td]:border-b [&_td]:border-slate-800 [&_td]:text-slate-300">
						<h1 className="text-3xl font-bold text-white mb-1">
							Privacy Policy
						</h1>
						<p className="text-slate-400 text-sm mb-8">
							Last updated: March 4, 2026 &middot; Version 2.0.0
						</p>

						{/* ===== 1. WHO WE ARE & OUR PROMISE ===== */}
						<h2>1. Who We Are &amp; Our Promise</h2>
						<p>
							Bedrock Chat is built and operated by Bedrock AI
							Systems. We are a privacy-first communication
							platform designed for families, gamers, and
							communities who believe private conversations should
							stay private.
						</p>
						<p>
							<strong>Our promise, in concrete terms:</strong>
						</p>
						<ul>
							<li>No government IDs or facial scans &mdash; ever</li>
							<li>No behavioral advertising or ad profiles</li>
							<li>No selling or sharing your data with advertisers</li>
							<li>No third-party analytics services (Google Analytics, Mixpanel, etc.)</li>
							<li>No tracking pixels or cross-site surveillance</li>
							<li>No audio or video recordings of voice calls</li>
							<li>Anonymous analytics only, with opt-out at any time</li>
							<li>Family monitoring that is always transparent to the teen</li>
						</ul>
						<p>
							If you have questions about this policy, contact us
							at{" "}
							<a
								href="mailto:privacy@bedrock-chat.com"
								className="text-primary hover:underline"
							>
								privacy@bedrock-chat.com
							</a>{" "}
							or our Data Protection Officer at{" "}
							<a
								href="mailto:dpo@bedrock-chat.com"
								className="text-primary hover:underline"
							>
								dpo@bedrock-chat.com
							</a>
							.
						</p>

						{/* ===== 2. WHAT WE COLLECT — DATA CARDS ===== */}
						<h2>2. What We Collect &amp; Exactly How We See It</h2>
						<p>
							This is the centerpiece of our policy. Every type of
							data we collect is described below as a
							&ldquo;card&rdquo; so you can see exactly what we
							know, why, and for how long.
						</p>

						{/* -- Card: Account Information -- */}
						<div className="border border-slate-700 rounded-lg p-4 bg-slate-800/30 mb-4">
							<p className="text-white font-semibold mb-1">
								ACCOUNT INFORMATION
							</p>
							<p className="text-sm mb-1">
								<strong>What we store:</strong> Username, email
								address, password (hashed &mdash; we cannot read
								it), display name, avatar, bio, account type
								(standard, parent, or teen), date of birth (for
								COPPA compliance on teen accounts only)
							</p>
							<p className="text-sm mb-1">
								<strong>Why:</strong> To operate your account and
								authenticate you
							</p>
							<p className="text-sm mb-1">
								<strong>How long:</strong> While your account is
								active. Deleted within 30 days of account
								deletion
							</p>
							<p className="text-sm mb-1">
								<strong>Your control:</strong> Edit in Settings,
								export via{" "}
								<Link
									href="/data-export"
									className="text-primary hover:underline"
								>
									Data Export
								</Link>
								, or delete your account at any time
							</p>
							<p className="text-sm">
								<strong>Legal basis (GDPR):</strong> Contractual
								necessity (Art. 6(1)(b))
							</p>
						</div>

						{/* -- Card: Messages & Content -- */}
						<div className="border border-slate-700 rounded-lg p-4 bg-slate-800/30 mb-4">
							<p className="text-white font-semibold mb-1">
								MESSAGES &amp; CONTENT
							</p>
							<p className="text-sm mb-1">
								<strong>What we store:</strong> Text messages,
								file uploads (10MB limit), emoji reactions,
								message edits and deletions
							</p>
							<p className="text-sm mb-1">
								<strong>Why:</strong> To deliver your messages to
								recipients and store conversation history
							</p>
							<p className="text-sm mb-1">
								<strong>How long:</strong> Until you delete them
								or delete your account
							</p>
							<p className="text-sm mb-1">
								<strong>Your control:</strong> Delete individual
								messages, delete your account (cascading delete
								of all messages)
							</p>
							<p className="text-sm mb-1">
								<strong>Encryption status:</strong> Messages are
								encrypted in transit (TLS 1.3) and at rest
								(database encryption). We have built an
								end-to-end encryption library (ECDH key exchange
								+ AES-256-GCM) and are actively working to
								integrate it into the message pipeline.{" "}
								<strong>
									Currently, messages are not yet
									end-to-end encrypted between users.
								</strong>{" "}
								We will update this policy when E2E encryption
								is deployed.
							</p>
							<p className="text-sm">
								<strong>Legal basis (GDPR):</strong> Contractual
								necessity (Art. 6(1)(b))
							</p>
						</div>

						{/* -- Card: Voice/Video Call Metadata -- */}
						<div className="border border-slate-700 rounded-lg p-4 bg-slate-800/30 mb-4">
							<p className="text-white font-semibold mb-1">
								VOICE &amp; VIDEO CALL METADATA
							</p>
							<p className="text-sm mb-1">
								<strong>What we store:</strong> Who was in the
								call, start/end timestamps, duration, whether
								video or screen sharing was used (yes/no &mdash;
								not the content)
							</p>
							<p className="text-sm mb-1">
								<strong>What we DO NOT store:</strong> Audio
								recordings, video recordings, transcriptions,
								summaries of what was said. This is
								architecturally enforced &mdash; our voice
								infrastructure (LiveKit WebRTC) is configured
								for real-time streaming only with no recording
								capability enabled.
							</p>
							<p className="text-sm mb-1">
								<strong>Why:</strong> Safety oversight for family
								accounts (who talked to whom, not what was said)
								and service reliability
							</p>
							<p className="text-sm mb-1">
								<strong>How long:</strong> 90 days
							</p>
							<p className="text-sm">
								<strong>Legal basis (GDPR):</strong> Legitimate
								interest (Art. 6(1)(f)) &mdash; safety and
								service reliability
							</p>
						</div>

						{/* -- Card: Anonymous Analytics -- */}
						<div className="border border-slate-700 rounded-lg p-4 bg-slate-800/30 mb-4">
							<p className="text-white font-semibold mb-1">
								ANONYMOUS ANALYTICS
							</p>
							<p className="text-sm mb-1">
								<strong>What we see:</strong> A number next to a
								label. Example: &ldquo;Channel joins today:
								847&rdquo;
							</p>
							<p className="text-sm mb-1">
								<strong>What we DO NOT see:</strong> Who joined,
								when exactly, from where, or any identifying
								information
							</p>
							<p className="text-sm mb-1">
								<strong>Data collected:</strong> Anonymized page
								paths (IDs stripped), feature usage categories,
								performance metrics (page load times, error
								rates), session duration patterns, device
								category (mobile/tablet/desktop from viewport
								width only), viewport bucket (sm/md/lg/xl),
								browser family (no version), OS family (no
								version)
							</p>
							<p className="text-sm mb-1">
								<strong>Session token:</strong> A random UUID
								generated fresh each browser session, stored in
								sessionStorage only. When you close the tab,
								it&apos;s gone. No way to link sessions.
							</p>
							<p className="text-sm mb-1">
								<strong>Why:</strong> To know which features are
								being used and where errors happen so we can
								improve the app
							</p>
							<p className="text-sm mb-1">
								<strong>How long:</strong> Raw events
								auto-deleted after 30 days. Only statistical
								aggregates survive (e.g., &ldquo;47 sessions
								visited Settings on Feb 15&rdquo; &mdash; no
								individual data)
							</p>
							<p className="text-sm mb-1">
								<strong>Who sees it:</strong> Bedrock development
								team only. Never shared with third parties.
								Stored exclusively in our own database.
							</p>
							<p className="text-sm mb-1">
								<strong>Your control:</strong> Opt out anytime in
								Settings &rarr; Privacy &amp; Analytics. No
								penalty, no reduced functionality.
							</p>
							<p className="text-sm mb-1">
								<strong>Age protections:</strong>
							</p>
							<ul className="text-sm">
								<li>
									<strong>Under 13:</strong> Analytics{" "}
									<strong>completely disabled</strong>. No
									events, no session tokens, no collection of
									any kind.
								</li>
								<li>
									<strong>Ages 13&ndash;15:</strong> Only
									anonymized page views. No feature tracking.
								</li>
								<li>
									<strong>16 and up:</strong> Standard
									anonymous collection with opt-out.
								</li>
							</ul>
							<p className="text-sm mb-1">
								<strong>Third parties:</strong> None. All
								analytics are self-hosted. No Google Analytics,
								Mixpanel, Amplitude, Hotjar, or any other
								external service.
							</p>
							<p className="text-sm">
								<strong>Legal basis (GDPR):</strong> Legitimate
								interest (Art. 6(1)(f)). No personal data is
								processed. You can opt out at any time.
							</p>
						</div>

						{/* -- Card: Bug Reports -- */}
						<div className="border border-slate-700 rounded-lg p-4 bg-slate-800/30 mb-4">
							<p className="text-white font-semibold mb-1">
								BUG REPORTS
							</p>
							<p className="text-sm mb-1">
								<strong>What we store:</strong> Your description
								of the problem, the page you were on, device
								type, browser family, OS family, recent app
								errors from your session
							</p>
							<p className="text-sm mb-1">
								<strong>Anonymous by default:</strong> We
								don&apos;t know who submitted bug reports unless
								you toggle &ldquo;Attach my account&rdquo; (OFF
								by default)
							</p>
							<p className="text-sm mb-1">
								<strong>PII scrubbing:</strong> We automatically
								scan descriptions for accidentally included
								email addresses, phone numbers, and SSNs and
								remove them before storing
							</p>
							<p className="text-sm mb-1">
								<strong>How long:</strong> Until resolved, then
								archived for 12 months
							</p>
							<p className="text-sm">
								<strong>Legal basis (GDPR):</strong> Consent
								(Art. 6(1)(a)) &mdash; you choose to submit
							</p>
						</div>

						{/* -- Card: Cookies & Local Storage -- */}
						<div className="border border-slate-700 rounded-lg p-4 bg-slate-800/30 mb-4">
							<p className="text-white font-semibold mb-1">
								COOKIES &amp; LOCAL STORAGE
							</p>
							<p className="text-sm mb-2">
								<strong>Cookies (2 total):</strong>
							</p>
							<table className="text-sm w-full mb-2">
								<thead>
									<tr>
										<th>Cookie</th>
										<th>Purpose</th>
										<th>Duration</th>
										<th>Essential?</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>
											<code className="text-xs bg-slate-800 px-1 rounded">
												sb-*-auth-token
											</code>
										</td>
										<td>Authentication session</td>
										<td>Session or 30 days (Remember Me)</td>
										<td>Yes</td>
									</tr>
									<tr>
										<td>
											<code className="text-xs bg-slate-800 px-1 rounded">
												privacy-mode
											</code>
										</td>
										<td>GPC/DNT signal detected</td>
										<td>1 year</td>
										<td>Yes</td>
									</tr>
								</tbody>
							</table>
							<p className="text-sm mb-2">
								<strong>
									localStorage (preferences, cleared on
									logout):
								</strong>
							</p>
							<table className="text-sm w-full mb-2">
								<thead>
									<tr>
										<th>Key</th>
										<th>Purpose</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>
											<code className="text-xs bg-slate-800 px-1 rounded">
												bedrock-auth
											</code>
										</td>
										<td>Auth state (profile, lockout)</td>
									</tr>
									<tr>
										<td>
											<code className="text-xs bg-slate-800 px-1 rounded">
												bedrock-server
											</code>
										</td>
										<td>Selected server/channel</td>
									</tr>
									<tr>
										<td>
											<code className="text-xs bg-slate-800 px-1 rounded">
												bedrock-ui
											</code>
										</td>
										<td>Theme, sidebar states</td>
									</tr>
									<tr>
										<td>
											<code className="text-xs bg-slate-800 px-1 rounded">
												bedrock-consent
											</code>
										</td>
										<td>Cookie consent choices</td>
									</tr>
									<tr>
										<td>
											<code className="text-xs bg-slate-800 px-1 rounded">
												bedrock-settings
											</code>
										</td>
										<td>Appearance &amp; accessibility</td>
									</tr>
									<tr>
										<td>
											<code className="text-xs bg-slate-800 px-1 rounded">
												bedrock-favorites
											</code>
										</td>
										<td>Channel favorites</td>
									</tr>
									<tr>
										<td>
											<code className="text-xs bg-slate-800 px-1 rounded">
												bedrock-remember-me
											</code>
										</td>
										<td>Login persistence preference</td>
									</tr>
									<tr>
										<td>
											<code className="text-xs bg-slate-800 px-1 rounded">
												bedrock-family
											</code>
										</td>
										<td>Family account state</td>
									</tr>
								</tbody>
							</table>
							<p className="text-sm mb-2">
								<strong>sessionStorage (dies on tab close):</strong>
							</p>
							<ul className="text-sm">
								<li>
									<code className="text-xs bg-slate-800 px-1 rounded">
										bedrock_analytics_session
									</code>{" "}
									&mdash; Random UUID for anonymous analytics
								</li>
							</ul>
							<p className="text-sm mt-2 mb-2">
								<strong>IndexedDB:</strong>
							</p>
							<ul className="text-sm">
								<li>
									<code className="text-xs bg-slate-800 px-1 rounded">
										bedrock-keys
									</code>{" "}
									&mdash; Encrypted private keys for future
									E2E encryption (ECDH P-256, protected by
									AES-GCM with password-derived key)
								</li>
							</ul>
							<p className="text-sm mt-2">
								Rejecting non-essential cookies does not break
								any core functionality. See our{" "}
								<Link
									href="/cookie-policy"
									className="text-primary hover:underline"
								>
									Cookie Policy
								</Link>{" "}
								for details.
							</p>
						</div>

						{/* -- Card: Family Monitoring Data -- */}
						<div className="border border-slate-700 rounded-lg p-4 bg-slate-800/30 mb-4">
							<p className="text-white font-semibold mb-1">
								FAMILY MONITORING DATA
							</p>
							<p className="text-sm mb-1">
								<strong>What we store:</strong> Parent-teen
								relationship records, monitoring level settings,
								transparency log of all parent actions, keyword
								alert configurations, server/friend approval
								decisions
							</p>
							<p className="text-sm mb-1">
								<strong>Transparency guarantee:</strong> Every
								action a parent takes is logged in a
								transparency log that the teen can see in
								real-time. This transparency is enforced at the
								database level with a constraint that physically
								prevents hidden monitoring &mdash; it cannot be
								bypassed by code changes alone.
							</p>
							<p className="text-sm mb-1">
								<strong>How long:</strong> While the Family
								Account is active
							</p>
							<p className="text-sm">
								<strong>Legal basis (GDPR):</strong> Parental
								consent (COPPA) and legitimate interest (child
								safety, Art. 6(1)(f))
							</p>
						</div>

						{/* -- Card: Push Notifications -- */}
						<div className="border border-slate-700 rounded-lg p-4 bg-slate-800/30 mb-4">
							<p className="text-white font-semibold mb-1">
								PUSH NOTIFICATIONS
							</p>
							<p className="text-sm mb-1">
								<strong>What we store:</strong> Push subscription
								endpoint, encryption keys (p256dh, auth), user
								agent string
							</p>
							<p className="text-sm mb-1">
								<strong>Why:</strong> To deliver notifications
								when the app is in the background
							</p>
							<p className="text-sm mb-1">
								<strong>Your control:</strong> Requires explicit
								Notification permission. Unsubscribe anytime in
								browser settings or app settings.
							</p>
							<p className="text-sm">
								<strong>Legal basis (GDPR):</strong> Consent
								(Art. 6(1)(a))
							</p>
						</div>

						{/* -- Card: Content Reports -- */}
						<div className="border border-slate-700 rounded-lg p-4 bg-slate-800/30 mb-4">
							<p className="text-white font-semibold mb-1">
								CONTENT REPORTS
							</p>
							<p className="text-sm mb-1">
								<strong>What we store:</strong> Reporter identity,
								reported content snapshot (preserved even if
								original is deleted), report type (CSAM,
								harassment, spam, hate speech, violence,
								self-harm, impersonation), resolution status
							</p>
							<p className="text-sm mb-1">
								<strong>Why:</strong> To enforce community safety
								rules and comply with mandatory reporting
								obligations (18 U.S.C. &sect;2258A for CSAM)
							</p>
							<p className="text-sm mb-1">
								<strong>CSAM reports:</strong> Automatically
								escalated. We are legally required to report
								suspected CSAM to the National Center for
								Missing &amp; Exploited Children (NCMEC).
							</p>
							<p className="text-sm">
								<strong>Legal basis (GDPR):</strong> Legal
								obligation (Art. 6(1)(c)) and legitimate
								interest (Art. 6(1)(f))
							</p>
						</div>

						{/* ===== 3. WHAT WE NEVER COLLECT ===== */}
						<h2>3. What We NEVER Collect</h2>
						<ul>
							<li>
								<strong>Government IDs or biometrics</strong>{" "}
								&mdash; no facial scans, fingerprints, or
								government-issued identification
							</li>
							<li>
								<strong>Audio or video recordings</strong>{" "}
								&mdash; voice calls store metadata only
								(timestamps, participants). No audio is
								recorded, transcribed, or summarized.
							</li>
							<li>
								<strong>IP addresses</strong> &mdash; used
								momentarily as a rate-limit key to prevent abuse,
								then immediately discarded. Never stored in any
								database table or analytics record.
							</li>
							<li>
								<strong>Device fingerprints</strong> &mdash; no
								canvas fingerprinting, no audio fingerprinting,
								no user-agent sniffing for tracking purposes
							</li>
							<li>
								<strong>Browsing history</strong> outside our
								platform
							</li>
							<li>
								<strong>Behavioral advertising profiles</strong>{" "}
								&mdash; we do not build profiles about you and
								never will
							</li>
							<li>
								<strong>Third-party tracker data</strong> &mdash;
								no advertising pixels, no cross-site tracking
								scripts, no hidden surveillance
							</li>
							<li>
								<strong>Your real name</strong> unless you choose
								to provide it as your display name
							</li>
							<li>
								<strong>Your phone number</strong> unless you
								choose to provide it for future 2FA
							</li>
						</ul>

						{/* ===== 4. THIRD-PARTY SERVICES ===== */}
						<h2>4. Third-Party Services</h2>
						<p>
							We use a small number of infrastructure providers.
							No third-party advertising or analytics services are
							used. Here is every third-party service that
							processes your data:
						</p>
						<ul>
							<li>
								<strong>Supabase</strong> &mdash; Database,
								authentication, real-time messaging, and file
								storage. They process your account data,
								messages, and uploaded files on our behalf.{" "}
								<a
									href="https://supabase.com/privacy"
									className="text-primary hover:underline"
									target="_blank"
									rel="noopener noreferrer"
								>
									Supabase Privacy Policy
								</a>
							</li>
							<li>
								<strong>LiveKit</strong> &mdash; Voice and video
								call infrastructure (WebRTC). They route your
								audio/video streams in real-time but do not
								record or store them. They receive your user
								identity and room name for the duration of a
								call.{" "}
								<a
									href="https://livekit.io/privacy"
									className="text-primary hover:underline"
									target="_blank"
									rel="noopener noreferrer"
								>
									LiveKit Privacy Policy
								</a>
							</li>
							<li>
								<strong>Vercel</strong> &mdash; Application
								hosting and CDN. They serve our web application.
								We do not use Vercel Analytics or Vercel Speed
								Insights.{" "}
								<a
									href="https://vercel.com/legal/privacy-policy"
									className="text-primary hover:underline"
									target="_blank"
									rel="noopener noreferrer"
								>
									Vercel Privacy Policy
								</a>
							</li>
						</ul>
						<p>
							Our long-term goal is to migrate to fully
							self-hosted infrastructure. We will update this
							policy as we make progress on that migration.
						</p>
						<p>
							<strong>Data Processing Agreements:</strong> We are
							in the process of executing formal DPAs with each
							provider to ensure GDPR-compliant data processing
							terms are contractually binding.
						</p>

						{/* ===== 5. FAMILY ACCOUNTS & PARENTAL MONITORING ===== */}
						<h2>5. Family Accounts &amp; Parental Monitoring</h2>
						<p>
							Family Accounts let parents oversee their
							teen&apos;s safety while respecting teen privacy.
							Unlike platforms that secretly scan everything, our
							monitoring is completely transparent.
						</p>

						<h3>5.1 Four Monitoring Levels</h3>
						<ul>
							<li>
								<strong>Minimal (Level 1):</strong> Parent can
								see server list and friend list only. No message
								access.
							</li>
							<li>
								<strong>Moderate (Level 2):</strong> Parent can
								also see message counts, online time, and view
								messages on request.
							</li>
							<li>
								<strong>Supervised (Level 3):</strong> Adds AI
								content flags, plus server joins and friend
								requests require parental approval.
							</li>
							<li>
								<strong>Restricted (Level 4):</strong>{" "}
								Whitelist-only communication. Adds keyword
								alerts, time limits, and real-time activity
								monitoring. Friend requests also require
								approval.
							</li>
						</ul>

						<h3>5.2 Transparency Guarantee</h3>
						<p>
							Teens can always see what their parents are
							monitoring:
						</p>
						<ul>
							<li>
								Every parent action (viewing messages, checking
								friends, changing settings) is logged in a
								transparency log visible to the teen in real-time
							</li>
							<li>
								A non-dismissible monitoring badge is visible to
								the teen at all times in the app
							</li>
							<li>
								Friends chatting with a monitored teen see a
								badge indicating monitoring is active
							</li>
							<li>
								This transparency is enforced at the database
								level &mdash; it is architecturally impossible
								for monitoring to be hidden
							</li>
						</ul>

						<h3>5.3 COPPA Compliance for Under-13 Users</h3>
						<ul>
							<li>
								Users under 13 must have a parent create their
								account through a Family Account
							</li>
							<li>
								Parental consent is collected with timestamp,
								method, and policy version recorded
							</li>
							<li>
								Parents can review, export, or delete their
								child&apos;s data at any time
							</li>
							<li>
								Parents can refuse further data collection (by
								deleting the account)
							</li>
							<li>
								Analytics is completely disabled for under-13
								users &mdash; no events, no session tokens, no
								collection of any kind
							</li>
							<li>
								No behavioral advertising is served to any
								users, including minors
							</li>
							<li>
								No data is shared with third parties for
								commercial purposes
							</li>
						</ul>
						<p>
							To exercise COPPA rights, email{" "}
							<a
								href="mailto:privacy@bedrock-chat.com"
								className="text-primary hover:underline"
							>
								privacy@bedrock-chat.com
							</a>{" "}
							from the parent account&apos;s email address. We
							will respond within 72 hours.
						</p>

						{/* ===== 6. YOUR RIGHTS ===== */}
						<h2>6. Your Rights</h2>

						<h3>6.1 Everyone</h3>
						<ul>
							<li>
								<strong>Right to know</strong> what data we have
								about you
							</li>
							<li>
								<strong>Right to export</strong> your data in
								machine-readable format (JSON) via{" "}
								<Link
									href="/data-export"
									className="text-primary hover:underline"
								>
									Data Export
								</Link>
							</li>
							<li>
								<strong>Right to delete</strong> your account and
								all associated data
							</li>
							<li>
								<strong>Right to opt out</strong> of anonymous
								analytics at any time in Settings &rarr; Privacy
								&amp; Analytics
							</li>
						</ul>

						<h3>6.2 GDPR Rights (EU/UK Residents)</h3>
						<ul>
							<li>
								<strong>Right of access (Art. 15):</strong>{" "}
								Request a copy of your personal data
							</li>
							<li>
								<strong>Right to rectification (Art. 16):</strong>{" "}
								Correct inaccurate data via Settings
							</li>
							<li>
								<strong>Right to erasure (Art. 17):</strong>{" "}
								Delete your data (&ldquo;right to be
								forgotten&rdquo;)
							</li>
							<li>
								<strong>Right to data portability (Art. 20):</strong>{" "}
								Receive your data in JSON format
							</li>
							<li>
								<strong>Right to object (Art. 21):</strong> Opt
								out of analytics processing
							</li>
							<li>
								<strong>Right to withdraw consent:</strong> At
								any time, without affecting prior processing
							</li>
							<li>
								<strong>Right to lodge a complaint:</strong> With
								your local supervisory authority
							</li>
						</ul>

						<h3>6.3 CCPA/CPRA Rights (California Residents)</h3>
						<ul>
							<li>Right to know what personal information is collected</li>
							<li>Right to delete personal information</li>
							<li>
								Right to opt out of the sale or sharing of
								personal information &mdash;{" "}
								<strong>
									we do not sell or share your data
								</strong>
							</li>
							<li>Right to limit use of sensitive personal information</li>
							<li>Right to non-discrimination for exercising your rights</li>
						</ul>
						<p>
							We honor Global Privacy Control (GPC) signals
							automatically. If your browser sends a GPC signal,
							we disable non-essential data collection. We also
							honor Do Not Track (DNT) signals.
						</p>
						<p>
							<strong>Note:</strong> Anonymous analytics session
							tokens are not &ldquo;personal information&rdquo;
							under CCPA because they cannot be reasonably linked
							to any consumer or household.
						</p>

						<h3>6.4 COPPA Rights (Users Under 13)</h3>
						<ul>
							<li>
								Parental right to review all collected
								information
							</li>
							<li>
								Parental right to delete all collected
								information
							</li>
							<li>
								Parental right to refuse further collection
							</li>
						</ul>
						<p>
							To exercise these rights: visit{" "}
							<Link
								href="/data-export"
								className="text-primary hover:underline"
							>
								Data Export
							</Link>
							,{" "}
							<Link
								href="/privacy-settings"
								className="text-primary hover:underline"
							>
								Privacy Settings
							</Link>
							, or email{" "}
							<a
								href="mailto:privacy@bedrock-chat.com"
								className="text-primary hover:underline"
							>
								privacy@bedrock-chat.com
							</a>
							.
						</p>

						{/* ===== 7. DATA SECURITY ===== */}
						<h2>7. Data Security</h2>
						<ul>
							<li>
								<strong>Encryption in transit:</strong> All data
								transmitted over TLS/HTTPS
							</li>
							<li>
								<strong>Encryption at rest:</strong>{" "}
								Database-level encryption via Supabase
							</li>
							<li>
								<strong>End-to-end encryption:</strong> We have
								built an E2E encryption library using ECDH
								P-256 key exchange and AES-256-GCM. Integration
								into the message pipeline is in active
								development.{" "}
								<strong>
									Messages are not yet end-to-end encrypted.
								</strong>
							</li>
							<li>
								<strong>Security headers:</strong> HSTS,
								Content Security Policy, X-Frame-Options (DENY),
								X-Content-Type-Options (nosniff), Referrer-Policy
								(strict-origin-when-cross-origin),
								Permissions-Policy (microphone/camera self-only)
							</li>
							<li>
								<strong>Password security:</strong> Passwords
								hashed with bcrypt. 8+ character requirement with
								uppercase, lowercase, and number. Account lockout
								after 5 failed attempts (15 minutes).
							</li>
							<li>
								<strong>Rate limiting:</strong> All API endpoints
								have rate limits to prevent abuse
							</li>
							<li>
								<strong>Row-Level Security:</strong> All 30+
								database tables have RLS policies ensuring users
								can only access their own data
							</li>
							<li>
								<strong>Multi-factor authentication:</strong>{" "}
								Planned but not yet implemented. We will update
								this policy when MFA is available.
							</li>
						</ul>

						<h3>7.1 Breach Notification</h3>
						<p>
							In the event of a data breach affecting your
							personal data:
						</p>
						<ul>
							<li>
								<strong>GDPR:</strong> We will notify the
								relevant supervisory authority within 72 hours
								and affected users without undue delay
							</li>
							<li>
								<strong>COPPA:</strong> We will notify parents
								of affected minor users as expeditiously as
								possible
							</li>
							<li>
								<strong>State laws:</strong> We will comply with
								applicable state breach notification laws
							</li>
						</ul>

						{/* ===== 8. DATA RETENTION SCHEDULE ===== */}
						<h2>8. Data Retention Schedule</h2>
						<table>
							<thead>
								<tr>
									<th>Data Type</th>
									<th>Retention Period</th>
									<th>Deletion Method</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>Account data</td>
									<td>While active + 30 days after deletion</td>
									<td>Cascading database delete + auth user removal</td>
								</tr>
								<tr>
									<td>Messages</td>
									<td>Until user deletes or account deletion</td>
									<td>Cascading database delete</td>
								</tr>
								<tr>
									<td>Voice call metadata</td>
									<td>90 days</td>
									<td>Automated purge</td>
								</tr>
								<tr>
									<td>Analytics raw events</td>
									<td>30 days</td>
									<td>Nightly automated purge</td>
								</tr>
								<tr>
									<td>Analytics aggregates</td>
									<td>Indefinite (no PII)</td>
									<td>N/A &mdash; contains no personal data</td>
								</tr>
								<tr>
									<td>Bug reports</td>
									<td>Until resolved + 12 months</td>
									<td>Manual archive and deletion</td>
								</tr>
								<tr>
									<td>Content reports</td>
									<td>As required by law</td>
									<td>Per legal retention requirements</td>
								</tr>
								<tr>
									<td>Family monitoring logs</td>
									<td>While Family Account active</td>
									<td>Cascading delete on family dissolution</td>
								</tr>
								<tr>
									<td>Push subscriptions</td>
									<td>Until unsubscribed or expired</td>
									<td>Automatic cleanup on expired endpoints</td>
								</tr>
								<tr>
									<td>File uploads</td>
									<td>Until user deletes or account deletion</td>
									<td>Storage bucket cleanup</td>
								</tr>
							</tbody>
						</table>

						{/* ===== 9. DATA TRANSFERS ===== */}
						<h2>9. International Data Transfers</h2>
						<p>
							Your data may be processed in the United States
							where our infrastructure providers (Supabase,
							Vercel, LiveKit) maintain servers. For EU/UK users,
							we ensure appropriate safeguards are in place for
							international data transfers in compliance with GDPR
							Chapter V requirements.
						</p>
						<p>
							We are in the process of documenting Standard
							Contractual Clauses (SCCs) with our data processors
							to formalize these transfer mechanisms.
						</p>

						{/* ===== 10. HOW WE USE YOUR INFORMATION ===== */}
						<h2>10. How We Use Your Information</h2>
						<ul>
							<li>Provide, maintain, and improve the Bedrock Chat service</li>
							<li>Authenticate and secure your account</li>
							<li>Deliver your messages and enable voice/video calls</li>
							<li>Enable family safety features (when Family Account is active)</li>
							<li>Detect and prevent abuse, spam, and security threats</li>
							<li>Understand anonymous usage patterns to prioritize features and fix bugs</li>
							<li>Respond to support requests and bug reports</li>
							<li>Comply with legal obligations (including mandatory CSAM reporting)</li>
						</ul>
						<p>
							We do <strong>not</strong> use your data for
							advertising, behavioral profiling, AI model
							training, or selling to third parties.
						</p>

						{/* ===== 11. POLICY UPDATES ===== */}
						<h2>11. Changes to This Policy</h2>
						<p>
							When we update this Privacy Policy:
						</p>
						<ul>
							<li>
								We update the version number and &ldquo;Last
								updated&rdquo; date at the top
							</li>
							<li>
								Our consent management system will re-prompt you
								to review the new version
							</li>
							<li>
								For material changes, we provide at least 30
								days notice via email or in-app notification
							</li>
							<li>
								Parents of minor users are notified separately
								via their parent account email
							</li>
						</ul>

						{/* ===== 12. CONTACT & COMPLAINTS ===== */}
						<h2>12. Contact &amp; Complaints</h2>
						<p>
							We are real people, and we read our email.
						</p>
						<ul>
							<li>
								Privacy questions:{" "}
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
							<li>
								General support:{" "}
								<a
									href="mailto:support@bedrockchat.com"
									className="text-primary hover:underline"
								>
									support@bedrockchat.com
								</a>
							</li>
						</ul>
						<p>
							<strong>Response SLA:</strong> We acknowledge
							privacy requests within 72 hours and resolve them
							within 30 days.
						</p>
						<p>
							<strong>GDPR:</strong> You have the right to lodge a
							complaint with your local supervisory authority if
							you believe your rights have been violated.
						</p>
						<p>
							<strong>CCPA:</strong> You may also file a complaint
							with the California Attorney General.
						</p>
						<p className="text-slate-400 text-sm mt-8 pt-4 border-t border-slate-700">
							Bedrock AI Systems &mdash; Privacy-first
							communication for families.
							<br />
							<strong>Legal counsel review recommended</strong>{" "}
							before publishing. This policy reflects actual
							codebase behavior as of the date above.
						</p>
					</article>
				</Glass>
			</div>
		</div>
	);
}
