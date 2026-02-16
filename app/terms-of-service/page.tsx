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
							Terms of Service
						</h1>
						<p className="text-slate-400 text-sm mb-8">
							Last updated: February 16, 2026
						</p>

						<p>
							These Terms of Service are written in plain English
							on purpose. We believe you shouldn&apos;t need a law
							degree to understand the rules of a chat app.
						</p>

						<h2>1. Introduction &amp; Acceptance</h2>
						<p>
							Bedrock Chat is built and operated by Bedrock AI
							Systems (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or
							&ldquo;us&rdquo;). These Terms of Service
							(&ldquo;Terms&rdquo;) are a legal agreement between
							you and Bedrock AI Systems that govern your use of
							the Bedrock Chat platform, including our website,
							apps, and all related services.
						</p>
						<p>
							<strong>By creating an account or using Bedrock
							Chat, you agree to these Terms.</strong> If you
							don&apos;t agree, please don&apos;t use the service.
						</p>

						<h3>1.1 Age Requirements</h3>
						<ul>
							<li>
								<strong>Under 13:</strong> You need a parent or
								guardian to create and manage your account
								through a Family Account. This is required by
								U.S. law (COPPA).
							</li>
							<li>
								<strong>Ages 13--17:</strong> You can create
								your own account. We strongly encourage using a
								Family Account so your parents can help keep you
								safe.
							</li>
							<li>
								<strong>18 and older:</strong> Full access. You
								are responsible for your own account.
							</li>
						</ul>

						<h3>1.2 Updates to These Terms</h3>
						<p>
							We may update these Terms from time to time. When we
							make significant changes, we&apos;ll give you at
							least 30 days&apos; notice through email or an
							in-app notification before the changes take effect.
							Continued use after that means you accept the
							updated Terms.
						</p>

						<h2>2. Account Registration &amp; Responsibilities</h2>

						<h3>2.1 Creating Your Account</h3>
						<ul>
							<li>
								Provide accurate information (you don&apos;t
								need a government ID -- just a valid email and a
								birthdate for age verification)
							</li>
							<li>One account per person -- no sharing accounts</li>
							<li>
								Choose a strong password and keep it private
							</li>
							<li>
								Don&apos;t impersonate someone else when
								creating your account
							</li>
						</ul>

						<h3>2.2 Your Responsibilities</h3>
						<p>
							You are responsible for everything that happens on
							your account. If someone else uses your account
							(with or without your permission), you&apos;re still
							on the hook. If you think someone has accessed your
							account without permission, contact us immediately
							at{" "}
							<a
								href="mailto:support@bedrockchat.com"
								className="text-primary hover:underline"
							>
								support@bedrockchat.com
							</a>
							.
						</p>

						<h2>3. Acceptable Use Policy</h2>
						<p>
							Bedrock Chat is a place for real conversations. We
							expect everyone to:
						</p>
						<ul>
							<li>
								<strong>Be respectful</strong> -- disagree
								without being cruel
							</li>
							<li>
								<strong>Follow the law</strong> -- don&apos;t
								use Bedrock Chat to do anything illegal where
								you live
							</li>
							<li>
								<strong>Respect server rules</strong> -- server
								owners set their own community standards, and
								you should follow them
							</li>
							<li>
								<strong>Don&apos;t game the system</strong> --
								don&apos;t try to bypass security measures, rate
								limits, or moderation tools
							</li>
						</ul>
						<p>
							We respect gaming culture. Friendly trash talk and
							competitive banter are part of the experience. But
							there&apos;s a line between banter and harassment --
							and you know where it is.
						</p>

						<h2>4. Prohibited Activities</h2>
						<p>
							The following are strictly prohibited on Bedrock
							Chat. Violations may result in immediate account
							termination:
						</p>
						<ul>
							<li>
								<strong>
									Sharing child sexual abuse material (CSAM)
									or exploiting minors
								</strong>{" "}
								in any way -- this results in permanent ban and
								a report to law enforcement
							</li>
							<li>
								<strong>Harassment, bullying, or threats</strong>{" "}
								-- targeted abuse, hate speech, or threats of
								violence against any person or group
							</li>
							<li>
								<strong>Doxxing</strong> -- sharing
								someone&apos;s private information (real name,
								address, phone number, etc.) without their
								consent
							</li>
							<li>
								<strong>
									Self-harm or suicide encouragement
								</strong>{" "}
								-- content that promotes or glorifies self-harm
							</li>
							<li>
								<strong>Illegal sales</strong> -- drugs,
								weapons, stolen goods, or any other illegal
								transactions
							</li>
							<li>
								<strong>Scams, spam, or phishing</strong> --
								tricking people into giving up personal
								information or money
							</li>
							<li>
								<strong>Malware or hacking</strong> --
								distributing harmful software or attempting to
								exploit vulnerabilities in Bedrock Chat or other
								users&apos; systems
							</li>
							<li>
								<strong>Impersonation</strong> -- pretending to
								be another user, a Bedrock employee, or any
								other real person
							</li>
							<li>
								<strong>Ban evasion</strong> -- creating new
								accounts to get around a suspension or ban
							</li>
							<li>
								<strong>Unauthorized bots</strong> -- running
								automated tools or bots without explicit
								permission
							</li>
						</ul>

						<h2>5. Family Accounts &amp; Parental Controls</h2>
						<p>
							Family Accounts are how we balance teen safety with
							teen privacy. Unlike platforms that secretly scan
							everything, our monitoring is{" "}
							<strong>completely transparent</strong>.
						</p>

						<h3>5.1 How It Works</h3>
						<p>
							Parents or guardians can link their account to their
							teen&apos;s account and choose a monitoring level:
						</p>
						<ul>
							<li>
								<strong>Minimal:</strong> Parent can see who
								their teen chats with (contact list only)
							</li>
							<li>
								<strong>Moderate:</strong> Parent receives
								summaries of conversations (not full messages)
							</li>
							<li>
								<strong>Active:</strong> Parent can view full
								message history
							</li>
							<li>
								<strong>Restricted:</strong> Teen can only
								message pre-approved contacts
							</li>
						</ul>

						<h3>5.2 What Parents Can Do</h3>
						<ul>
							<li>
								Choose and change the monitoring level at any
								time
							</li>
							<li>View who their teen communicates with</li>
							<li>
								See message summaries or full history (depending
								on monitoring level)
							</li>
							<li>
								Set approved contact lists in Restricted mode
							</li>
							<li>
								Receive notifications about potentially
								concerning content
							</li>
							<li>
								Export or delete their child&apos;s data at any
								time
							</li>
							<li>
								Dissolve the Family Account at any time
							</li>
						</ul>

						<h3>5.3 What Parents Cannot Do</h3>
						<ul>
							<li>
								<strong>Monitor secretly</strong> -- a badge is
								always visible to the teen and their friends
								showing that monitoring is active
							</li>
							<li>
								<strong>
									Share their teen&apos;s private data
								</strong>{" "}
								with others or use it for non-safety purposes
							</li>
							<li>
								<strong>Prevent dissolution</strong> -- when the
								teen turns 18, they can dissolve the Family
								Account on their own
							</li>
						</ul>

						<h3>5.4 What Teens Get</h3>
						<ul>
							<li>
								<strong>Transparency:</strong> You always know
								your monitoring level -- it&apos;s visible in
								your Settings
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
								dissolve the Family Account yourself
							</li>
						</ul>

						<h3>5.5 COPPA Compliance (Under 13)</h3>
						<p>
							For users under 13, a parent or guardian must create
							the account and provide verifiable consent. Parents
							can review, export, or delete their child&apos;s
							data at any time. We do not serve ads to children or
							collect data beyond what&apos;s needed to provide
							the service.
						</p>

						<h2>6. Content &amp; Intellectual Property</h2>

						<h3>6.1 Your Content</h3>
						<p>
							When you post content on Bedrock Chat, you still own
							it. We just need permission to show it to other
							users and store it on our servers so the service
							works. That&apos;s it. We won&apos;t use your
							content for advertising, training AI models, or
							anything else without your explicit permission.
						</p>
						<p>
							Specifically, you grant Bedrock Chat a limited
							license to display, transmit, and store your content
							solely for the purpose of providing the service.
							This license ends when you delete your content or
							your account.
						</p>

						<h3>6.2 Other People&apos;s Content</h3>
						<p>
							Respect copyright and intellectual property. Don&apos;t
							share content you don&apos;t have the right to
							share. If you believe someone is infringing your
							copyright on Bedrock Chat, contact us at{" "}
							<a
								href="mailto:legal@bedrockchat.com"
								className="text-primary hover:underline"
							>
								legal@bedrockchat.com
							</a>{" "}
							with a DMCA notice.
						</p>

						<h3>6.3 Bedrock Chat&apos;s Property</h3>
						<p>
							The Bedrock Chat name, logo, design, and code are
							our intellectual property. You can&apos;t use them
							without our written permission.
						</p>

						<h2>7. Privacy &amp; Data Protection</h2>
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
								<strong>End-to-end encryption:</strong> Your
								private messages are encrypted using AES-GCM --
								we cannot read them
							</li>
							<li>
								<strong>No data sales:</strong> We will never
								sell your personal information to anyone, period
							</li>
							<li>
								<strong>No ad trackers:</strong> We don&apos;t
								use advertising pixels, hidden trackers, or
								surveillance technology
							</li>
							<li>
								<strong>Data minimization:</strong> We only
								collect what&apos;s necessary to provide the
								service
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
							No government IDs. No facial scans. No tracking.
							That&apos;s the Bedrock promise.
						</p>

						<h2>8. Voice Chat &amp; Communications</h2>
						<p>
							Voice chat follows what we call the &ldquo;gamer
							code&rdquo; -- parents get safety information, but
							what you actually say stays between you and the
							people in the call.
						</p>

						<h3>8.1 What We Store</h3>
						<ul>
							<li>Who was in the voice chat</li>
							<li>When it started and ended</li>
							<li>How long it lasted</li>
						</ul>

						<h3>8.2 What We Do NOT Store</h3>
						<ul>
							<li>Audio recordings</li>
							<li>Voice transcriptions</li>
							<li>Summaries of what was said</li>
						</ul>

						<h3>8.3 Parental Oversight for Minors</h3>
						<p>
							If you&apos;re on a Family Account, your parent can
							see who you talked to and for how long. They cannot
							hear what was said. This is the balance: safety
							oversight without surveillance.
						</p>

						<h3>8.4 Recording</h3>
						<p>
							Bedrock Chat does not record voice calls. If you
							choose to record a call using external software, you
							must have the consent of all participants. Recording
							without consent may violate the law in your
							jurisdiction and will result in account action.
						</p>

						<h2>9. Moderation &amp; Enforcement</h2>
						<p>
							We don&apos;t scan all your messages looking for
							content to flag. Our moderation approach respects
							your privacy:
						</p>

						<h3>9.1 How Moderation Works</h3>
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
								flag potentially harmful content -- this is
								always opt-in, never forced
							</li>
							<li>
								<strong>Human review:</strong> Serious reports
								are reviewed by real people, not just algorithms
							</li>
						</ul>

						<h3>9.2 What Happens When Rules Are Broken</h3>
						<p>
							Depending on the severity, we may take one or more
							of the following actions:
						</p>
						<ul>
							<li>Warning</li>
							<li>Content removal</li>
							<li>Temporary mute or restriction</li>
							<li>Server ban (by server moderators)</li>
							<li>Account suspension (temporary)</li>
							<li>Account termination (permanent)</li>
						</ul>

						<h3>9.3 Appeals</h3>
						<p>
							If you believe a moderation action was unfair, you
							can appeal by emailing{" "}
							<a
								href="mailto:support@bedrockchat.com"
								className="text-primary hover:underline"
							>
								support@bedrockchat.com
							</a>{" "}
							with your username and a description of the
							situation. We&apos;ll review your appeal within 7
							business days.
						</p>

						<h2>10. Termination</h2>

						<h3>10.1 You Can Leave Anytime</h3>
						<p>
							You can delete your account at any time through your
							account settings or by contacting{" "}
							<a
								href="mailto:support@bedrockchat.com"
								className="text-primary hover:underline"
							>
								support@bedrockchat.com
							</a>
							. When you delete your account:
						</p>
						<ul>
							<li>
								Your profile is removed within 24 hours
							</li>
							<li>
								Your messages are deleted within 30 days
							</li>
							<li>
								Encrypted content becomes permanently
								unrecoverable (encryption keys are destroyed)
							</li>
							<li>
								Backup copies are purged within 90 days
							</li>
						</ul>

						<h3>10.2 We Can Terminate for Violations</h3>
						<p>
							If you violate these Terms, we may suspend or
							terminate your account. We&apos;ll try to notify you
							before taking action, except in severe cases
							(illegal content, active threats to safety, or court
							orders).
						</p>

						<h3>10.3 What Survives Termination</h3>
						<p>
							Sections 6 (Intellectual Property), 12
							(Disclaimers), 13 (Indemnification), and 14
							(Dispute Resolution) continue to apply after your
							account is terminated.
						</p>

						<h2>11. Third-Party Services</h2>
						<p>
							We believe in being upfront about our
							infrastructure. Right now, Bedrock Chat uses the
							following third-party services:
						</p>
						<ul>
							<li>
								<strong>Supabase</strong> -- database,
								authentication, and real-time messaging
							</li>
							<li>
								<strong>Daily.co</strong> -- voice and video
								call infrastructure (WebRTC)
							</li>
							<li>
								<strong>Vercel</strong> -- application hosting
								and content delivery
							</li>
						</ul>
						<p>
							These providers have their own terms and privacy
							policies. We chose them carefully, but our long-term
							goal is to{" "}
							<strong>
								migrate to fully self-hosted infrastructure
							</strong>{" "}
							so your data never touches a third party. We&apos;ll
							notify you as we make progress on this migration.
						</p>
						<p>
							We do not use any third-party advertising or
							analytics services.
						</p>

						<h2>12. Disclaimers &amp; Limitations of Liability</h2>

						<h3>12.1 The Service Is Provided &ldquo;As Is&rdquo;</h3>
						<p>
							We work hard to keep Bedrock Chat running smoothly,
							but we can&apos;t guarantee it will always be
							available, error-free, or perfectly secure. We
							provide the service &ldquo;as is&rdquo; and
							&ldquo;as available&rdquo; without warranties of any
							kind, whether express or implied.
						</p>

						<h3>12.2 What We&apos;re Not Responsible For</h3>
						<ul>
							<li>
								Content posted by other users
							</li>
							<li>
								Outages caused by third-party services
							</li>
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

						<h3>12.3 Liability Cap</h3>
						<p>
							To the maximum extent permitted by law, Bedrock AI
							Systems&apos; total liability to you for any claims
							related to the service is limited to the amount you
							paid us in the 12 months before the claim arose, or
							$100, whichever is greater.
						</p>

						<h3>12.4 Force Majeure</h3>
						<p>
							We&apos;re not liable for delays or failures caused
							by events outside our reasonable control, including
							natural disasters, internet outages, government
							actions, or cyberattacks.
						</p>

						<h2>13. Indemnification</h2>
						<p>
							In plain English: if you break these rules and
							someone sues us because of it, you agree to cover
							our costs.
						</p>
						<p>
							You agree to indemnify and hold harmless Bedrock AI
							Systems, its officers, employees, and agents from
							any claims, damages, losses, or expenses (including
							legal fees) arising from:
						</p>
						<ul>
							<li>Your violation of these Terms</li>
							<li>Content you post on Bedrock Chat</li>
							<li>
								Your use of the service in a way that harms
								others
							</li>
							<li>
								Any third-party claims related to your actions
								on the platform
							</li>
						</ul>

						<h2>14. Dispute Resolution</h2>

						<h3>14.1 Let&apos;s Talk First</h3>
						<p>
							If you have a dispute with us, please email{" "}
							<a
								href="mailto:support@bedrockchat.com"
								className="text-primary hover:underline"
							>
								support@bedrockchat.com
							</a>{" "}
							first. We&apos;ll try to resolve it informally
							within 30 days.
						</p>

						<h3>14.2 Formal Resolution</h3>
						<p>
							If we can&apos;t resolve it informally, disputes
							will be settled through binding arbitration on an
							individual basis. You agree that disputes will be
							resolved individually -- not as part of a class
							action or representative proceeding.
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
								Bedrock AI Systems regarding your use of the
								service
							</li>
							<li>
								<strong>Severability:</strong> If any part of
								these Terms is found to be unenforceable, the
								rest still applies
							</li>
							<li>
								<strong>No waiver:</strong> If we don&apos;t
								enforce a rule once, that doesn&apos;t mean we
								won&apos;t enforce it in the future
							</li>
							<li>
								<strong>Assignment:</strong> We may transfer
								these Terms as part of a business change (like a
								merger). You cannot transfer your rights under
								these Terms to someone else
							</li>
							<li>
								<strong>Notices:</strong> We&apos;ll send
								important notices to the email address on your
								account. Make sure it&apos;s up to date
							</li>
						</ul>

						<h2>16. Contact Us</h2>
						<p>
							We&apos;re real people, and we read our email.
							Reach us at:
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
									href="mailto:dpo@bedrockchat.com"
									className="text-primary hover:underline"
								>
									dpo@bedrockchat.com
								</a>
							</li>
						</ul>
						<p>
							Bedrock AI Systems
							<br />
							Privacy-first communication for families.
						</p>
					</article>
				</Glass>
			</div>
		</div>
	);
}
