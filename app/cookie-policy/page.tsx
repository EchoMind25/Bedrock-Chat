import { Glass } from "@/components/ui/glass";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Cookie Policy | Bedrock Chat",
	description:
		"Learn how Bedrock Chat uses cookies and local storage. We use no third-party tracking, analytics, or advertising cookies.",
};

export default function CookiePolicyPage() {
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
							Cookie Policy
						</h1>
						<p className="text-slate-400 text-sm mb-8">
							Last updated: February 16, 2026
						</p>

						<h2>1. What Are Cookies and Local Storage?</h2>
						<p>
							<strong>Cookies</strong> are small text files placed
							on your device by websites you visit. They are
							widely used to make websites work efficiently and to
							provide information to site owners.
						</p>
						<p>
							<strong>Local storage</strong> is a web browser
							feature that allows websites to store data on your
							device. Unlike cookies, local storage data is not
							sent to the server with every request, making it
							more efficient for storing application state.
						</p>
						<p>
							Bedrock Chat uses both cookies and local storage
							strictly for essential functionality. We do not use
							any third-party tracking, analytics, or advertising
							cookies.
						</p>

						<h2>2. Storage We Use</h2>
						<p>
							The following table lists every cookie and local
							storage item used by Bedrock Chat:
						</p>

						<div className="overflow-x-auto my-6">
							<table className="w-full text-sm text-left">
								<thead>
									<tr className="border-b border-white/10">
										<th className="py-3 pr-4 text-blue-400 font-semibold">
											Name
										</th>
										<th className="py-3 pr-4 text-blue-400 font-semibold">
											Type
										</th>
										<th className="py-3 pr-4 text-blue-400 font-semibold">
											Purpose
										</th>
										<th className="py-3 text-blue-400 font-semibold">
											Duration
										</th>
									</tr>
								</thead>
								<tbody className="[&_td]:py-3 [&_td]:pr-4 [&_td]:align-top [&_tr]:border-b [&_tr]:border-white/5">
									<tr>
										<td className="font-mono text-blue-300/60 text-xs">
											sb-*-auth-token
										</td>
										<td className="text-slate-300">
											Cookie
										</td>
										<td className="text-slate-300">
											Supabase authentication session
											token. Required to keep you logged
											in securely.
										</td>
										<td className="text-slate-300">
											Session / up to 7 days
										</td>
									</tr>
									<tr>
										<td className="font-mono text-blue-300/60 text-xs">
											privacy-mode
										</td>
										<td className="text-slate-300">
											Cookie
										</td>
										<td className="text-slate-300">
											Records whether your browser sends a
											Global Privacy Control (GPC) or Do
											Not Track (DNT) signal, so we can
											honor your privacy preferences.
										</td>
										<td className="text-slate-300">
											1 year
										</td>
									</tr>
									<tr>
										<td className="font-mono text-blue-300/60 text-xs">
											bedrock-auth
										</td>
										<td className="text-slate-300">
											localStorage
										</td>
										<td className="text-slate-300">
											Persisted authentication state
											(Zustand store). Stores login status
											and session metadata so the app
											loads without re-authenticating on
											every visit.
										</td>
										<td className="text-slate-300">
											Until logout or manual deletion
										</td>
									</tr>
									<tr>
										<td className="font-mono text-blue-300/60 text-xs">
											bedrock-server
										</td>
										<td className="text-slate-300">
											localStorage
										</td>
										<td className="text-slate-300">
											Stores your selected server and
											channel so the app restores your
											last view on return.
										</td>
										<td className="text-slate-300">
											Until manual deletion
										</td>
									</tr>
									<tr>
										<td className="font-mono text-blue-300/60 text-xs">
											bedrock-ui
										</td>
										<td className="text-slate-300">
											localStorage
										</td>
										<td className="text-slate-300">
											UI preferences including theme
											(dark/light), sidebar collapsed
											states, and layout settings.
										</td>
										<td className="text-slate-300">
											Until manual deletion
										</td>
									</tr>
									<tr>
										<td className="font-mono text-blue-300/60 text-xs">
											bedrock-remember-me
										</td>
										<td className="text-slate-300">
											localStorage
										</td>
										<td className="text-slate-300">
											Stores your &ldquo;remember
											me&rdquo; login preference to
											control session persistence
											behavior.
										</td>
										<td className="text-slate-300">
											Until manual deletion
										</td>
									</tr>
									<tr>
										<td className="font-mono text-blue-300/60 text-xs">
											bedrock-consent
										</td>
										<td className="text-slate-300">
											localStorage
										</td>
										<td className="text-slate-300">
											Records your cookie consent choices
											so we do not repeatedly prompt you.
										</td>
										<td className="text-slate-300">
											Until manual deletion
										</td>
									</tr>
								</tbody>
							</table>
						</div>

						<h2>3. What We Do NOT Use</h2>
						<p>
							Bedrock Chat does <strong>not</strong> use:
						</p>
						<ul>
							<li>
								<strong>Third-party tracking cookies</strong>{" "}
								&mdash; no Google Analytics, no Facebook Pixel,
								no advertising networks
							</li>
							<li>
								<strong>Analytics cookies</strong> &mdash; we do
								not track your behavior across pages or sessions
								for analytics purposes
							</li>
							<li>
								<strong>Advertising cookies</strong> &mdash; we
								do not serve ads and do not share your data with
								advertisers
							</li>
							<li>
								<strong>Cross-site tracking</strong> &mdash; we
								do not track your activity on other websites
							</li>
							<li>
								<strong>Fingerprinting</strong> &mdash; we do
								not use browser fingerprinting techniques to
								identify you
							</li>
						</ul>

						<h2>4. Managing and Deleting Cookies</h2>
						<p>
							You can control and delete cookies and local storage
							through your browser settings:
						</p>
						<ul>
							<li>
								<strong>Chrome:</strong> Settings &gt; Privacy
								and Security &gt; Cookies and other site data
							</li>
							<li>
								<strong>Firefox:</strong> Settings &gt; Privacy
								&amp; Security &gt; Cookies and Site Data
							</li>
							<li>
								<strong>Safari:</strong> Preferences &gt;
								Privacy &gt; Manage Website Data
							</li>
							<li>
								<strong>Edge:</strong> Settings &gt; Cookies and
								site permissions &gt; Cookies and site data
							</li>
						</ul>
						<p>
							To clear local storage specifically, open your
							browser&apos;s Developer Tools (usually F12),
							navigate to the Application or Storage tab, and
							select Local Storage for this site.
						</p>

						<h2>5. Impact of Disabling Cookies</h2>
						<p>
							Because all cookies and local storage used by
							Bedrock Chat are essential for core functionality:
						</p>
						<ul>
							<li>
								<strong>
									Disabling the authentication cookie
								</strong>{" "}
								will prevent you from logging in or staying
								logged in
							</li>
							<li>
								<strong>Clearing local storage</strong> will
								reset your UI preferences and require you to log
								in again
							</li>
							<li>
								<strong>Blocking all cookies</strong> for this
								site will make Bedrock Chat unusable
							</li>
						</ul>
						<p>
							We have designed the application to use the absolute
							minimum storage necessary. Every item listed above
							is required for the application to function
							correctly.
						</p>

						<h2>6. Changes to This Policy</h2>
						<p>
							If we add new cookies or local storage items, we
							will update this policy and the &ldquo;Last
							updated&rdquo; date above. Where required by law, we
							will also notify you through our consent management
							system before introducing new non-essential storage.
						</p>

						<h2>7. Related Policies</h2>
						<p>
							For more information about how we handle your data,
							please see our{" "}
							<Link
								href="/privacy-policy"
								className="text-primary hover:underline"
							>
								Privacy Policy
							</Link>
							, which includes details on your GDPR and CCPA
							rights, data retention, and how to exercise your
							data subject rights.
						</p>

						<h2>8. Contact Us</h2>
						<p>
							If you have questions about this Cookie Policy:
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
