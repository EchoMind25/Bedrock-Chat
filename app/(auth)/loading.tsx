export default function AuthLoading() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[oklch(0.15_0.05_250)] to-[oklch(0.12_0.05_270)]">
			<div className="text-center space-y-4">
				<div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
				<p className="text-white/60 text-sm">Loading...</p>
			</div>
		</div>
	);
}
