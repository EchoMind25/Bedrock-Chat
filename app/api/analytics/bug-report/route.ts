import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sanitizePathServer } from "@/lib/analytics/sanitize";

const VALID_CATEGORIES = new Set(["bug", "ui_issue", "performance", "voice_issue", "other"]);
const VALID_SEVERITIES = new Set(["low", "medium", "high", "critical"]);

// Patterns that might indicate PII — strip from text fields
const PII_PATTERNS = [
	/[\w.+-]+@[\w.+-]+\.\w{2,}/g, // emails
	/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // US phone numbers
	/\b\d{3}-\d{2}-\d{4}\b/g, // SSNs
];

function sanitizeText(text: string): string {
	let result = text;
	for (const pattern of PII_PATTERNS) {
		result = result.replace(pattern, "[redacted]");
	}
	return result;
}

interface BugReportBody {
	session_token?: string;
	include_identity?: boolean;
	title: string;
	description: string;
	category: string;
	severity?: string;
	page_path?: string;
	device_category?: string;
	viewport_bucket?: string;
	browser_family?: string;
	os_family?: string;
	screenshot_base64?: string;
	screenshot_filename?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
	// Require authentication
	const serverClient = await createClient();
	const {
		data: { user },
	} = await serverClient.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: "Authentication required" }, { status: 401 });
	}

	let body: BugReportBody;
	try {
		body = (await request.json()) as BugReportBody;
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	// Validate required fields
	if (!body.title || typeof body.title !== "string" || body.title.trim().length === 0) {
		return NextResponse.json({ error: "Title is required" }, { status: 400 });
	}
	if (!body.description || typeof body.description !== "string" || body.description.trim().length === 0) {
		return NextResponse.json({ error: "Description is required" }, { status: 400 });
	}
	if (!body.category || !VALID_CATEGORIES.has(body.category)) {
		return NextResponse.json({ error: "Invalid category" }, { status: 400 });
	}

	const severity = body.severity && VALID_SEVERITIES.has(body.severity) ? body.severity : "medium";

	// Sanitize text fields for PII
	const title = sanitizeText(body.title.trim().slice(0, 200));
	const description = sanitizeText(body.description.trim().slice(0, 2000));

	// Sanitize path server-side
	const pagePath = body.page_path ? sanitizePathServer(body.page_path).slice(0, 500) : null;

	// Validate and coerce auto-context fields
	const validDeviceCategories = new Set(["desktop", "tablet", "mobile"]);
	const validViewportBuckets = new Set(["sm", "md", "lg", "xl"]);
	const validBrowserFamilies = new Set(["chrome", "firefox", "safari", "edge", "other"]);
	const validOsFamilies = new Set(["windows", "macos", "linux", "ios", "android", "other"]);

	const deviceCategory =
		body.device_category && validDeviceCategories.has(body.device_category)
			? body.device_category
			: null;
	const viewportBucket =
		body.viewport_bucket && validViewportBuckets.has(body.viewport_bucket)
			? body.viewport_bucket
			: null;
	const browserFamily =
		body.browser_family && validBrowserFamilies.has(body.browser_family)
			? body.browser_family
			: null;
	const osFamily =
		body.os_family && validOsFamilies.has(body.os_family) ? body.os_family : null;

	// Service client for privileged operations
	const service = createServiceClient();

	// Fetch last 5 error events for this session (for context)
	let recentErrors: unknown[] = [];
	if (body.session_token && typeof body.session_token === "string") {
		const { data: errorData } = await service
			.schema("analytics")
			.from("error_events")
			.select("error_type, error_message, page_path, created_at")
			.eq("session_token", body.session_token)
			.order("created_at", { ascending: false })
			.limit(5);
		recentErrors = errorData ?? [];
	}

	// Identity: server-side enforcement — if include_identity is false, always null
	const userId = body.include_identity === true ? user.id : null;
	let userDisplayName: string | null = null;
	if (body.include_identity === true) {
		const { data: profile } = await service
			.from("profiles")
			.select("display_name")
			.eq("id", user.id)
			.single();
		userDisplayName = profile?.display_name ?? null;
	}

	// Insert bug report
	const { data: report, error: insertError } = await service
		.schema("analytics")
		.from("bug_reports")
		.insert({
			session_token: body.session_token ?? null,
			user_id: userId,
			user_display_name: userDisplayName,
			title,
			description,
			category: body.category,
			severity,
			page_path: pagePath,
			device_category: deviceCategory,
			viewport_bucket: viewportBucket,
			browser_family: browserFamily,
			os_family: osFamily,
			recent_errors: recentErrors,
			screenshot_paths: [],
		})
		.select("id")
		.single();

	if (insertError || !report) {
		console.error("[analytics/bug-report] Insert failed:", insertError?.code);
		return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
	}

	// Handle screenshot upload if provided
	if (body.screenshot_base64 && body.screenshot_filename && report.id) {
		try {
			const base64Data = body.screenshot_base64.replace(/^data:image\/\w+;base64,/, "");
			const buffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
			const filename = `${report.id}/${body.screenshot_filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

			const { error: uploadError } = await service.storage
				.from("bug-report-screenshots")
				.upload(`reports/${filename}`, buffer, {
					contentType: "image/png",
					upsert: false,
				});

			if (!uploadError) {
				await service
					.schema("analytics")
					.from("bug_reports")
					.update({ screenshot_paths: [`reports/${filename}`] })
					.eq("id", report.id);
			}
		} catch (e) {
			// Screenshot upload failure is non-fatal
			console.error("[analytics/bug-report] Screenshot upload failed:", e);
		}
	}

	return NextResponse.json({ id: report.id }, { status: 201 });
}
