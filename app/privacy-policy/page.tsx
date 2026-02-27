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
					<article className="prose prose-invert prose-sm max-w-none [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-slate-200 [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-slate-300 [&_p]:mb-3 [&_li]:text-slate-300 [&_ul]:mb-3 [&_strong]:text-white">
						<h1 className="text-3xl font-bold text-white mb-1">
							Privacy Policy
						</h1>
						<p className="text-slate-400 text-sm mb-8">
							Last updated: February 27, 2026
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

						<h3>2.2 Anonymous Technical Data</h3>
						<p>
							We collect anonymous technical data to understand how
							the app is being used and to fix problems. <strong>None
							of this data is linked to your account or identity.</strong>{" "}
							It cannot be used to identify you. See Section&nbsp;9
							for the full explanation.
						</p>
						<ul>
							<li>
								<strong>Pages visited</strong> &mdash; recorded as
								anonymized paths (e.g., &ldquo;/server/*/channel/*&rdquo;
								with all IDs stripped out)
							</li>
							<li>
								<strong>Features used</strong> &mdash; for example,
								&ldquo;a voice channel was joined&rdquo; (not who
								joined or which channel)
							</li>
							<li>
								<strong>Performance metrics</strong> &mdash; page
								load times, connection speeds, error rates
							</li>
							<li>
								<strong>Session patterns</strong> &mdash; how long
								anonymous sessions last (not who the sessions belong to)
							</li>
							<li>
								<strong>Device category</strong> &mdash; mobile,
								tablet, or desktop, derived from screen width only
								(not device fingerprinting or user-agent strings)
							</li>
							<li>
								<strong>Viewport size</strong> &mdash; small / medium
								/ large / extra-large (Tailwind breakpoints, not exact
								pixel dimensions)
							</li>
							<li>
								<strong>Browser family</strong> &mdash; Chrome,
								Firefox, Safari, Edge, or Other (no version numbers)
							</li>
							<li>
								<strong>OS family</strong> &mdash; Windows, macOS,
								Linux, iOS, or Android (no version numbers)
							</li>
						</ul>
						<p>
							<strong>Voice call metadata</strong> (timestamps,
							participant list, duration) is stored as part of your
							account record &mdash; not as anonymous analytics.
						</p>

						<h3>2.3 What We DO NOT Collect</h3>
						<ul>
							<li>
								<strong>Government IDs or facial scans</strong> &mdash;
								never required, never collected
							</li>
							<li>
								<strong>Audio or video recordings</strong> &mdash; only
								metadata is stored (timestamps, participants)
							</li>
							<li>
								<strong>Message content in analytics</strong> &mdash;
								your messages are end-to-end encrypted and never
								read by our analytics system
							</li>
							<li>
								<strong>IP addresses</strong> &mdash; not stored in
								any analytics record
							</li>
							<li>
								<strong>Device fingerprints</strong> &mdash; no
								canvas fingerprinting, no audio fingerprinting, no
								user-agent sniffing
							</li>
							<li>
								<strong>Browsing history</strong> outside our platform
							</li>
							<li>
								<strong>Third-party tracker data</strong> &mdash; no
								hidden surveillance, no advertising pixels
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
								Understand anonymous usage patterns to prioritize
								features and fix bugs
							</li>
							<li>
								Comply with legal obligations
							</li>
						</ul>
						<p>
							<strong>Legal basis under GDPR:</strong> We process
							account data on the basis of contractual necessity
							(providing the service) and security (legitimate
							interest). We process anonymous analytics data on the
							basis of legitimate interest (Article&nbsp;6(1)(f)) &mdash;
							specifically, improving app performance, fixing bugs, and
							understanding feature usage. This does not require
							consent because no personal data is processed, data is
							fully anonymized, and you can opt out at any time without
							any effect on your account.
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
								<strong>Anonymous analytics raw events:</strong> automatically
								deleted after 30 days. Only statistical aggregates
								survive (e.g., &ldquo;47 sessions visited the settings
								page on February&nbsp;15&rdquo; &mdash; no individual
								session data)
							</li>
							<li>
								<strong>Bug reports:</strong> retained until resolved
								or closed; then archived for 12 months
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
								<strong>Supabase</strong> &mdash; database, authentication,
								and real-time messaging (PostgreSQL)
							</li>
							<li>
								<strong>LiveKit</strong> &mdash; WebRTC voice and video
								calls
							</li>
							<li>
								<strong>Vercel</strong> &mdash; application hosting and CDN
							</li>
						</ul>
						<p>
							<strong>Note:</strong> These are temporary dependencies.
							We are building self-hosted infrastructure to eliminate
							all third-party data processors. <strong>No third-party
							advertising or analytics services are used.</strong> Our
							anonymous analytics system is entirely self-hosted &mdash;
							your usage data never leaves our infrastructure and is
							never sent to Google Analytics, Mixpanel, Amplitude,
							or any other external service.
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
							<li>
								<strong>Right to opt out of anonymous analytics:</strong>{" "}
								go to Settings &rarr; Privacy &amp; Analytics and
								toggle analytics off. This takes effect immediately.
								No data is collected after opting out. No penalty,
								no reduced functionality.
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
							<strong>Note for California residents:</strong> Anonymous
							analytics session tokens are not &ldquo;personal
							information&rdquo; under CCPA/CPRA because they are not
							reasonably linkable to a particular consumer or household.
							We do not &ldquo;sell&rdquo; or &ldquo;share&rdquo; (as
							defined by CCPA/CPRA) any analytics data. All analytics
							data remains exclusively on our infrastructure.
						</p>

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
						<p>
							<strong>Analytics and age protections:</strong>
						</p>
						<ul>
							<li>
								<strong>Under 13:</strong> Analytics is{" "}
								<strong>completely disabled</strong>. No events, no
								session tokens, no collection of any kind. Period.
								Parental consent for analytics is not required because
								no analytics data is collected.
							</li>
							<li>
								<strong>Ages 13&ndash;15:</strong> Only anonymized
								page views are collected. No feature usage tracking,
								no session duration, no performance metrics tied to
								their sessions.
							</li>
							<li>
								<strong>Ages 16&ndash;17 and adults:</strong> Standard
								anonymous collection with opt-out available at any
								time via Settings &rarr; Privacy &amp; Analytics.
							</li>
						</ul>

						<h2>9. Anonymous Analytics</h2>

						<p className="text-slate-200 border border-slate-700 rounded-lg px-4 py-3 bg-slate-800/40">
							<strong>TL;DR:</strong> We collect anonymous data about
							how people use Bedrock Chat so we can make it better.
							We never know who you are. You can turn it off anytime
							in Settings.
						</p>

						<h3>9.1 Why We Collect Analytics</h3>
						<p>
							We want to build the best privacy-first chat app. To do
							that, we need to know which features people actually use,
							which pages are slow to load, and where errors happen.
							Analytics helps us prioritize what to fix and build next.
						</p>
						<p>
							Most chat apps track you personally to build advertising
							profiles. We don&apos;t do that &mdash; and we don&apos;t
							want to. Our analytics only tells us that{" "}
							<em>someone</em> did something, never{" "}
							<em>who</em> did it.
						</p>

						<h3>9.2 What We Collect</h3>
						<ul>
							<li>Which pages are visited (with all IDs stripped)</li>
							<li>
								Which features are used (e.g., &ldquo;voice channel
								joined&rdquo; &mdash; not who joined or which channel)
							</li>
							<li>
								App performance metrics (page load times, connection
								speeds, error rates)
							</li>
							<li>
								Session duration patterns (how long sessions last,
								not who the sessions belong to)
							</li>
							<li>
								Device category (mobile/tablet/desktop &mdash; from
								screen width, never device fingerprinting)
							</li>
							<li>
								Viewport size bucket (sm/md/lg/xl &mdash; Tailwind
								breakpoints, not exact pixel dimensions)
							</li>
							<li>
								Browser family (Chrome/Firefox/Safari/Edge/Other &mdash;
								no version numbers)
							</li>
							<li>
								OS family (Windows/macOS/Linux/iOS/Android &mdash;
								no version numbers)
							</li>
						</ul>

						<h3>9.3 What We NEVER Collect Through Analytics</h3>
						<ul>
							<li>Your name, username, or display name</li>
							<li>Your email address</li>
							<li>Your IP address</li>
							<li>Any message content</li>
							<li>Voice audio or transcriptions</li>
							<li>Contact lists or friend lists</li>
							<li>Server or channel names or IDs</li>
							<li>Your account ID or user ID</li>
							<li>
								Any data that could identify a specific individual
							</li>
						</ul>

						<h3>9.4 How It Works (The Technical Bit)</h3>
						<p>
							When you open Bedrock Chat, your browser generates a
							random ID &mdash; something like{" "}
							<code className="text-xs bg-slate-800 px-1 py-0.5 rounded">
								7f3a9b2c-e4d1-...
							</code>{" "}
							&mdash; using your browser&apos;s built-in random number
							generator. This ID is stored only in your browser&apos;s
							session memory (called <code className="text-xs bg-slate-800 px-1 py-0.5 rounded">sessionStorage</code>).
							When you close the tab, it&apos;s gone. When you open
							a new tab, a completely new random ID is created. There
							is no way to link one session to another.
						</p>
						<p>
							Think of it like dropping an anonymous comment card into
							a suggestion box. The card says &ldquo;someone visited
							the Settings page&rdquo; &mdash; but there&apos;s no
							name on it, no handwriting analysis, no way to figure
							out who dropped it in. We see the card. We don&apos;t
							see you.
						</p>
						<p>
							When you visit the Settings page, we record that
							&ldquo;someone visited Settings&rdquo; &mdash; but we
							have no idea it was you.
						</p>
						<p>
							<strong>No cross-session tracking.</strong> Close the
							tab and reopen it &mdash; you are a completely new
							anonymous session. There is no mechanism, technical or
							otherwise, to link Tuesday&apos;s session to
							Wednesday&apos;s session.
						</p>

						<h3>9.5 How Long We Keep It</h3>
						<p>
							Raw anonymous events are automatically deleted after 30
							days. After that, only statistical summaries survive &mdash;
							for example, &ldquo;47 sessions visited the settings
							page on February&nbsp;15.&rdquo; Those summaries contain
							no individual session data.
						</p>

						<h3>9.6 Age-Specific Protections</h3>
						<ul>
							<li>
								<strong>Under 13:</strong> Analytics is completely
								off. No data. No session tokens. Nothing.
							</li>
							<li>
								<strong>Ages 13&ndash;15:</strong> Only anonymized
								page views. No feature tracking, no performance
								metrics tied to sessions.
							</li>
							<li>
								<strong>Ages 16 and up:</strong> Standard anonymous
								collection with opt-out available.
							</li>
						</ul>

						<h3>9.7 How to Opt Out</h3>
						<p>
							Go to <strong>Settings &rarr; Privacy &amp; Analytics</strong>{" "}
							and toggle analytics off. It takes effect immediately.
							No data is collected after you opt out. No penalty, no
							reduced functionality, no nagging.
						</p>

						<h3>9.8 No Third Parties</h3>
						<p>
							All analytics data is stored exclusively in our own
							database (Supabase, which we control). It is never sent
							to Google Analytics, Mixpanel, Amplitude, Hotjar, or
							any other analytics service. It never leaves our
							infrastructure.
						</p>

						<h3>9.9 GDPR Legal Basis</h3>
						<p>
							We process anonymous analytics data under legitimate
							interest (GDPR Article&nbsp;6(1)(f)). The legitimate
							interest is improving app performance, fixing bugs, and
							understanding feature usage to prioritize development.
							Consent is not required because: no personal data is
							processed, data is fully anonymized, users can opt out
							at any time, and the processing causes no detriment to
							users.
						</p>

						<h2>10. Bug Reports</h2>
						<p>
							You can submit bug reports to help us fix problems.
							Here&apos;s exactly how your data is handled:
						</p>
						<p>
							<strong>By default, bug reports are anonymous.</strong>{" "}
							We don&apos;t know who submitted them.
						</p>
						<p>
							If you choose to, you can attach your display name and
							account ID to a report by toggling &ldquo;Attach my
							account&rdquo; when submitting. This is{" "}
							<strong>OFF by default</strong> &mdash; you have to
							actively turn it on. You see exactly what will be shared
							before you submit.
						</p>

						<h3>10.1 What&apos;s Included in Every Bug Report (Anonymous)</h3>
						<ul>
							<li>Your description of the problem</li>
							<li>What page you were on</li>
							<li>Your device type (mobile/tablet/desktop)</li>
							<li>
								Your browser type (Chrome, Firefox, etc. &mdash; no
								version number)
							</li>
							<li>
								Your operating system (Windows, Mac, etc. &mdash; no
								version number)
							</li>
							<li>Recent app errors from your current session</li>
						</ul>

						<h3>10.2 What&apos;s NOT Included (Unless You Opt In)</h3>
						<ul>
							<li>Your name or username</li>
							<li>Your email</li>
							<li>Your account ID</li>
							<li>Any message content</li>
							<li>Any server or channel information</li>
						</ul>
						<p>
							We automatically scan bug report descriptions for
							accidentally included personal information (email addresses,
							phone numbers, etc.) and remove it before storing. Screenshots
							you attach are stored privately and only accessible by
							our support team.
						</p>

						<h2>11. Global Privacy Control (GPC)</h2>
						<p>
							We honor Global Privacy Control (GPC) signals. If your
							browser sends a GPC signal, we automatically disable
							analytics data collection. We also honor Do Not Track
							(DNT) signals.
						</p>

						<h2>12. Security</h2>
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

						<h2>13. Data Transfers</h2>
						<p>
							Your data may be processed in the United States where our
							infrastructure is hosted. We ensure appropriate safeguards
							are in place for international data transfers in
							compliance with GDPR requirements.
						</p>

						<h2>14. Changes to This Policy</h2>
						<p>
							We may update this Privacy Policy from time to time. When
							we make changes, we will update the &ldquo;Last
							updated&rdquo; date and prompt you to review the updated
							policy through our consent management system.
						</p>

						<h2>15. Contact Us</h2>
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
