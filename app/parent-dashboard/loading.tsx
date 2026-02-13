export default function ParentDashboardLoading() {
	return (
		<div className="flex-1 flex items-center justify-center p-8" style={{ backgroundColor: "var(--pd-bg, #f5f5f7)" }}>
			<div className="text-center">
				<div
					className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin mx-auto"
					style={{ borderColor: "oklch(0.55 0.15 240)", borderTopColor: "transparent" }}
				/>
				<p className="mt-4 text-sm" style={{ color: "var(--pd-text-muted, #6b7280)" }}>
					Loading dashboard...
				</p>
			</div>
		</div>
	);
}
