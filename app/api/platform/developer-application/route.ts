import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePlatformRole, auditLog } from "@/lib/platform-roles.server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

export async function POST(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") || "unknown";
	const { allowed } = checkRateLimit(`dev-application:${ip}`, 3, 3_600_000);
	if (!allowed) {
		return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
	}

	try {
		const supabase = await createClient();
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();
		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Check if user already has developer role
		const serviceClient = createServiceClient();
		const { data: profile } = await serviceClient
			.from("profiles")
			.select("platform_role")
			.eq("id", user.id)
			.single();

		if (profile && profile.platform_role !== "user") {
			return NextResponse.json(
				{ error: "You already have an elevated platform role" },
				{ status: 400 },
			);
		}

		const body = await request.json();
		const { email, intendedUse, agreedDPA } = body as {
			email: string;
			intendedUse: string;
			agreedDPA: boolean;
		};

		if (!email || typeof email !== "string") {
			return NextResponse.json({ error: "Email is required" }, { status: 400 });
		}

		if (!intendedUse || typeof intendedUse !== "string" || intendedUse.length > 500) {
			return NextResponse.json(
				{ error: "Intended use is required (max 500 characters)" },
				{ status: 400 },
			);
		}

		if (!agreedDPA) {
			return NextResponse.json(
				{ error: "Data Processing Agreement must be accepted" },
				{ status: 400 },
			);
		}

		// Check for existing pending application
		const { data: existingApps } = await serviceClient
			.from("platform_role_audit_log")
			.select("id")
			.eq("actor_id", user.id)
			.eq("action", "developer_application_submitted")
			.limit(1);

		if (existingApps && existingApps.length > 0) {
			return NextResponse.json(
				{ error: "You already have a pending application" },
				{ status: 409 },
			);
		}

		await auditLog({
			actorId: user.id,
			actorRole: "user",
			action: "developer_application_submitted",
			metadata: {
				email,
				intended_use: intendedUse,
				dpa_agreed: true,
				dpa_agreed_at: new Date().toISOString(),
			},
			ipAddress: ip !== "unknown" ? ip : undefined,
		});

		return NextResponse.json({ success: true }, { status: 201 });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Internal error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function GET(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") || "unknown";
	const { allowed } = checkRateLimit(`dev-applications-list:${ip}`, 30, 60_000);
	if (!allowed) {
		return NextResponse.json({ error: "Too many requests" }, { status: 429 });
	}

	try {
		const supabase = await createClient();
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();
		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		await requirePlatformRole(user.id, "admin");

		const serviceClient = createServiceClient();

		// Get all developer applications
		const { data: applications, error } = await serviceClient
			.from("platform_role_audit_log")
			.select(`
				id, actor_id, metadata, created_at,
				actor:profiles!actor_id (id, username, display_name, avatar_url, platform_role)
			`)
			.eq("action", "developer_application_submitted")
			.order("created_at", { ascending: true });

		if (error) {
			return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
		}

		// Filter to only pending applications (actor still has 'user' role)
		const pending = (applications ?? []).filter(
			(app) => {
				const actor = app.actor as { platform_role?: string } | null;
				return actor?.platform_role === "user";
			},
		);

		return NextResponse.json({ applications: pending, total: pending.length });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Internal error";
		if (message === "FORBIDDEN") {
			return NextResponse.json({ error: "Admin access required" }, { status: 403 });
		}
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
