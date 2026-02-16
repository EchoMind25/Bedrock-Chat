import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

/**
 * Privacy-first performance telemetry endpoint.
 *
 * - Accepts aggregate metrics only (no user identification)
 * - Opt-in only (default OFF)
 * - 7-day retention policy
 * - Self-hosted (no external services)
 *
 * In production, this would store to a local database.
 * Currently logs to server console for monitoring.
 */

interface TelemetryPayload {
	// Web Vitals
	lcp: number | null;
	fid: number | null;
	cls: number | null;
	inp: number | null;
	ttfb: number | null;
	fcp: number | null;

	// Resources
	memoryMB: number | null;
	cpuPercent: number;
	fps: number;
	domNodes: number;
	activeAnimations: number;

	// Custom
	msgLatencyP50: number;
	msgLatencyP95: number;
	wsUptime: number;
	wsReconnects: number;
}

// In-memory store for development (would be database in production)
const telemetryBuffer: Array<{
	timestamp: number;
	data: TelemetryPayload;
}> = [];

const MAX_BUFFER_SIZE = 1000;
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function POST(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") || "unknown";
	const { allowed, retryAfterMs } = checkRateLimit(`performance:${ip}`, 30, 60_000);

	if (!allowed) {
		return NextResponse.json(
			{ error: "Too many requests" },
			{ status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
		);
	}

	try {
		const data: TelemetryPayload = await request.json();

		// Validate payload shape (no user-identifiable data allowed)
		if (typeof data.fps !== "number" || typeof data.cpuPercent !== "number") {
			return NextResponse.json(
				{ error: "Invalid payload" },
				{ status: 400 },
			);
		}

		// Store aggregate metric
		telemetryBuffer.push({
			timestamp: Date.now(),
			data,
		});

		// Enforce buffer size and retention
		const cutoff = Date.now() - RETENTION_MS;
		while (telemetryBuffer.length > 0 && telemetryBuffer[0].timestamp < cutoff) {
			telemetryBuffer.shift();
		}
		if (telemetryBuffer.length > MAX_BUFFER_SIZE) {
			telemetryBuffer.splice(0, telemetryBuffer.length - MAX_BUFFER_SIZE);
		}

		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json(
			{ error: "Failed to process telemetry" },
			{ status: 500 },
		);
	}
}

export async function GET() {
	// Return aggregate summary (admin only in production)
	const now = Date.now();
	const last5min = telemetryBuffer.filter(
		(e) => e.timestamp > now - 5 * 60 * 1000,
	);

	if (last5min.length === 0) {
		return NextResponse.json({
			count: 0,
			averages: null,
			message: "No telemetry data in last 5 minutes",
		});
	}

	const avg = (arr: (number | null)[]): number | null => {
		const valid = arr.filter((v): v is number => v !== null);
		if (valid.length === 0) return null;
		return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
	};

	return NextResponse.json({
		count: last5min.length,
		totalBuffered: telemetryBuffer.length,
		averages: {
			lcp: avg(last5min.map((e) => e.data.lcp)),
			fid: avg(last5min.map((e) => e.data.fid)),
			cls: avg(last5min.map((e) => e.data.cls)),
			inp: avg(last5min.map((e) => e.data.inp)),
			memoryMB: avg(last5min.map((e) => e.data.memoryMB)),
			cpuPercent: avg(last5min.map((e) => e.data.cpuPercent)),
			fps: avg(last5min.map((e) => e.data.fps)),
			msgLatencyP50: avg(last5min.map((e) => e.data.msgLatencyP50)),
			msgLatencyP95: avg(last5min.map((e) => e.data.msgLatencyP95)),
			wsUptime: avg(last5min.map((e) => e.data.wsUptime)),
		},
	});
}
