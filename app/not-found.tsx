import Link from "next/link";
import { NotFoundRedirect } from "@/components/not-found-redirect";

export default function NotFound() {
	return (
		<div className="min-h-screen bg-[oklch(0.12_0.02_250)] flex items-center justify-center p-8">
			{/* Auto-redirect authenticated users to /friends */}
			<NotFoundRedirect />
			<div className="text-center max-w-md">
				<div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
					<svg
						className="w-8 h-8 text-white/40"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<title>Not Found</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
				<p className="text-sm text-white/50 mb-8">
					The page you&apos;re looking for doesn&apos;t exist or has been moved.
				</p>
				<div className="flex gap-3 justify-center">
					<Link
						href="/friends"
						className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
					>
						Go to Chat
					</Link>
					<Link
						href="/"
						className="px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white/70 text-sm font-medium rounded-lg transition-colors"
					>
						Home
					</Link>
				</div>
			</div>
		</div>
	);
}
