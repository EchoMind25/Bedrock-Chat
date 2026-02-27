import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";
import { createServiceClient } from "@/lib/supabase/service";
import { sanitizePathServer } from "@/lib/analytics/sanitize";

const ALLOWED_ORIGINS = ["https://bedrockchat.com", "https://www.bedrockchat.com"];
const MAX_EVENTS_PER_REQUEST = 100;
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

const ALLOWED_EVENT_TYPES = new Set(["page_view", "feature_use", "performance", "session", "error"]);
const ALLOWED_EVENT_FIELDS = new Set([
	"event_type",
	"event_name",
	"event_data",
	"page_path",
	"referrer_path",
	"timestamp",
]);
const ALLOWED_EVENT_DATA_KEYS = new Set([
	"category",
	"duration_ms",
	"is_error",
	"error_type",
	"error_message",
	"metric_name",
	"error_stack",
]);

interface IncomingEvent {
	event_type: string;
	event_name: string;
	event_data?: Record<string, unknown>;
	page_path?: string;
	referrer_path?: string;
	timestamp?: string;
}

interface IncomingBatch {
	session_token: string;
	device_category: string;
	viewport_bucket: string;
	events: IncomingEvent[];
}

function sanitizeEventData(raw: Record<string, unknown>): Record<string, string | number | boolean> {
	const safe: Record<string, string | number | boolean> = {};
	for (const [key, value] of Object.entries(raw)) {
		if (!ALLOWED_EVENT_DATA_KEYS.has(key)) continue;
		if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
			safe[key] = value;
		}
	}
	return safe;
}

function isValidDeviceCategory(v: string): v is "desktop" | "tablet" | "mobile" {
	return ["desktop", "tablet", "mobile"].includes(v);
}

function isValidViewportBucket(v: string): v is "sm" | "md" | "lg" | "xl" {
	return ["sm", "md", "lg", "xl"].includes(v);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
	// CORS origin validation
	const origin = request.headers.get("origin") ?? "";
	const isDev = process.env.NODE_ENV === "development";
	if (!isDev && !ALLOWED_ORIGINS.includes(origin)) {
		return new NextResponse(null, { status: 403 });
	}

	// Parse body
	let body: IncomingBatch;
	try {
		body = (await request.json()) as IncomingBatch;
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	// Validate session token
	if (!body.session_token || typeof body.session_token !== "string" || body.session_token.length > 36) {
		return NextResponse.json({ error: "Invalid session token" }, { status: 400 });
	}

	// Rate limit per session token
	const { allowed, retryAfterMs } = checkRateLimit(
		`analytics:${body.session_token}`,
		RATE_LIMIT_REQUESTS,
		RATE_LIMIT_WINDOW_MS,
	);
	if (!allowed) {
		return NextResponse.json(
			{ error: "Too many requests" },
			{
				status: 429,
				headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
			},
		);
	}

	// Validate events array
	if (!Array.isArray(body.events) || body.events.length === 0) {
		return NextResponse.json({ error: "No events provided" }, { status: 400 });
	}
	if (body.events.length > MAX_EVENTS_PER_REQUEST) {
		return NextResponse.json({ error: "Too many events in batch" }, { status: 400 });
	}

	// Validate device/viewport values
	const deviceCategory = isValidDeviceCategory(body.device_category)
		? body.device_category
		: null;
	const viewportBucket = isValidViewportBucket(body.viewport_bucket)
		? body.viewport_bucket
		: null;

	// Build sanitized rows for insertion
	const rows: Record<string, unknown>[] = [];
	const errorRows: Record<string, unknown>[] = [];

	for (const event of body.events) {
		// Strip unknown fields — only allow listed fields
		const sanitized: Record<string, unknown> = {};
		for (const field of ALLOWED_EVENT_FIELDS) {
			if (field in event) {
				sanitized[field] = (event as Record<string, unknown>)[field];
			}
		}

		const eventType = String(sanitized.event_type ?? "");
		if (!ALLOWED_EVENT_TYPES.has(eventType)) continue;

		const eventName = String(sanitized.event_name ?? "").slice(0, 100);
		if (!eventName) continue;

		// Re-sanitize paths server-side (defense in depth)
		const pagePath = sanitized.page_path
			? sanitizePathServer(String(sanitized.page_path)).slice(0, 500)
			: null;
		const referrerPath = sanitized.referrer_path
			? sanitizePathServer(String(sanitized.referrer_path)).slice(0, 500)
			: null;

		// Sanitize event_data
		const rawEventData =
			sanitized.event_data && typeof sanitized.event_data === "object"
				? sanitizeEventData(sanitized.event_data as Record<string, unknown>)
				: {};

		const row = {
			session_token: body.session_token,
			event_type: eventType,
			event_name: eventName,
			event_data: rawEventData,
			page_path: pagePath,
			referrer_path: referrerPath,
			device_category: deviceCategory,
			viewport_bucket: viewportBucket,
		};

		// Route error events to error_events table
		if (eventType === "error") {
			errorRows.push({
				session_token: body.session_token,
				error_type: eventName,
				error_message: String(rawEventData.error_message ?? "").slice(0, 500),
				error_stack: rawEventData.error_stack ? String(rawEventData.error_stack).slice(0, 2000) : null,
				page_path: pagePath,
				event_data: rawEventData,
			});
		} else {
			rows.push(row);
		}
	}

	if (rows.length === 0 && errorRows.length === 0) {
		return new NextResponse(null, { status: 204 });
	}

	// Insert using service role (bypasses RLS)
	const supabase = createServiceClient();

	const insertions: Promise<unknown>[] = [];

	if (rows.length > 0) {
		insertions.push(
			supabase.schema("analytics").from("raw_events").insert(rows).then(({ error }) => {
				if (error) {
					// Log count only, never contents
					console.error(`[analytics/ingest] raw_events insert error for ${rows.length} events:`, error.code);
				}
			}),
		);
	}

	if (errorRows.length > 0) {
		insertions.push(
			supabase.schema("analytics").from("error_events").insert(errorRows).then(({ error }) => {
				if (error) {
					console.error(`[analytics/ingest] error_events insert error for ${errorRows.length} events:`, error.code);
				}
			}),
		);
	}

	await Promise.all(insertions);

	// 204 No Content — minimal response
	return new NextResponse(null, { status: 204 });
}

// Preflight CORS
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
	const origin = request.headers.get("origin") ?? "";
	const isDev = process.env.NODE_ENV === "development";
	if (!isDev && !ALLOWED_ORIGINS.includes(origin)) {
		return new NextResponse(null, { status: 403 });
	}
	return new NextResponse(null, {
		status: 204,
		headers: {
			"Access-Control-Allow-Origin": origin,
			"Access-Control-Allow-Methods": "POST",
			"Access-Control-Allow-Headers": "Content-Type",
		},
	});
}
