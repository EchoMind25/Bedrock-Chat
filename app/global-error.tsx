"use client";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="en">
			<body
				style={{
					margin: 0,
					minHeight: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#1a1a2e",
					color: "white",
					fontFamily: "system-ui, -apple-system, sans-serif",
				}}
			>
				<div style={{ textAlign: "center", maxWidth: 420, padding: 32 }}>
					<h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
						Bedrock Chat
					</h1>
					<p style={{ fontSize: 14, opacity: 0.6, marginBottom: 8 }}>
						Something unexpected happened.
					</p>
					{error?.message && (
						<p
							style={{
								fontSize: 12,
								opacity: 0.4,
								marginBottom: 24,
								wordBreak: "break-word",
							}}
						>
							{error.message}
						</p>
					)}
					<div
						style={{
							display: "flex",
							gap: 12,
							justifyContent: "center",
							flexWrap: "wrap",
						}}
					>
						<button
							type="button"
							onClick={reset}
							style={{
								padding: "10px 24px",
								backgroundColor: "#5b6eae",
								color: "white",
								border: "none",
								borderRadius: 8,
								cursor: "pointer",
								fontSize: 14,
								fontWeight: 500,
							}}
						>
							Try Again
						</button>
						<button
							type="button"
							onClick={() => window.location.reload()}
							style={{
								padding: "10px 24px",
								backgroundColor: "rgba(255,255,255,0.1)",
								color: "white",
								border: "none",
								borderRadius: 8,
								cursor: "pointer",
								fontSize: 14,
								fontWeight: 500,
							}}
						>
							Reload
						</button>
						<button
							type="button"
							onClick={() => (window.location.href = "/login")}
							style={{
								padding: "10px 24px",
								backgroundColor: "rgba(255,255,255,0.1)",
								color: "white",
								border: "none",
								borderRadius: 8,
								cursor: "pointer",
								fontSize: 14,
								fontWeight: 500,
							}}
						>
							Go to Login
						</button>
					</div>
				</div>
			</body>
		</html>
	);
}
