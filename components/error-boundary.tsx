"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";

type ErrorLevel = "app" | "page" | "feature" | "component";

interface ErrorBoundaryProps {
	children: ReactNode;
	level: ErrorLevel;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
	name?: string;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

function logErrorToStorage(entry: {
	message: string;
	level: ErrorLevel;
	boundaryName?: string;
	componentStack?: string | null;
}) {
	if (typeof window === "undefined") return;
	try {
		const key = "bedrock-error-log";
		const existing: unknown[] = JSON.parse(
			localStorage.getItem(key) || "[]",
		);
		const log = {
			...entry,
			timestamp: new Date().toISOString(),
		};
		// Keep last 50 entries
		const updated = [...existing.slice(-49), log];
		localStorage.setItem(key, JSON.stringify(updated));
	} catch {
		// Storage full or unavailable
	}
}

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		const { level, name, onError } = this.props;

		logErrorToStorage({
			message: error.message,
			level,
			boundaryName: name,
			componentStack: errorInfo.componentStack,
		});

		console.error(`[ErrorBoundary:${name || level}]`, error, errorInfo);
		onError?.(error, errorInfo);
	}

	private handleRetry = () => {
		this.setState({ hasError: false, error: null });
	};

	private handleReload = () => {
		window.location.reload();
	};

	render() {
		if (!this.state.hasError) {
			return this.props.children;
		}

		if (this.props.fallback) {
			return this.props.fallback;
		}

		const { level } = this.props;

		if (level === "app") {
			return (
				<div
					style={{
						minHeight: "100vh",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						backgroundColor: "oklch(0.12 0.02 250)",
						color: "white",
						fontFamily: "system-ui, sans-serif",
					}}
				>
					<div style={{ textAlign: "center", maxWidth: 400, padding: 24 }}>
						<h1
							style={{
								fontSize: 20,
								fontWeight: 600,
								marginBottom: 8,
							}}
						>
							Bedrock Chat
						</h1>
						<p
							style={{
								fontSize: 14,
								opacity: 0.6,
								marginBottom: 24,
							}}
						>
							Something unexpected happened. Your data is safe.
						</p>
						<button
							type="button"
							onClick={this.handleReload}
							style={{
								padding: "10px 24px",
								backgroundColor: "oklch(0.65 0.25 265)",
								color: "white",
								border: "none",
								borderRadius: 8,
								cursor: "pointer",
								fontSize: 14,
								fontWeight: 500,
							}}
						>
							Reload App
						</button>
					</div>
				</div>
			);
		}

		if (level === "page") {
			return (
				<div className="flex-1 flex items-center justify-center p-8">
					<div className="text-center max-w-md">
						<div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
							<svg
								className="w-6 h-6 text-red-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<title>Error</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
						</div>
						<h2 className="text-lg font-semibold text-white mb-2">
							Something went wrong
						</h2>
						<p className="text-sm text-white/50 mb-6">
							This section encountered an error. Your data is safe.
						</p>
						<button
							type="button"
							onClick={this.handleRetry}
							className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
						>
							Try Again
						</button>
					</div>
				</div>
			);
		}

		if (level === "feature") {
			return (
				<div className="flex flex-col items-center justify-center p-4 h-full">
					<p className="text-xs text-white/40 mb-3">Failed to load</p>
					<button
						type="button"
						onClick={this.handleRetry}
						className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/15 text-white/70 rounded-sm transition-colors"
					>
						Retry
					</button>
				</div>
			);
		}

		// component level
		return (
			<span className="text-xs text-white/30 px-2">
				Error{" "}
				<button
					type="button"
					onClick={this.handleRetry}
					className="underline hover:text-white/50 transition-colors"
				>
					retry
				</button>
			</span>
		);
	}
}
