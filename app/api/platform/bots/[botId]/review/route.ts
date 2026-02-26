import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePlatformRole, auditLog } from "@/lib/platform-roles.server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ botId: string }> },
) {
	const { botId } = await params;
	const ip = request.headers.get("x-forwarded-for") || "unknown";
	const { allowed } = checkRateLimit(`bot-review:${ip}`, 10, 60_000);
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

		const actorRole = await requirePlatformRole(user.id, "admin");

		const body = await request.json();
		const { action, reviewNotes } = body as {
			action: "approve" | "reject" | "suspend";
			reviewNotes?: string;
		};

		if (!action || !["approve", "reject", "suspend"].includes(action)) {
			return NextResponse.json(
				{ error: "action must be 'approve', 'reject', or 'suspend'" },
				{ status: 400 },
			);
		}

		if (reviewNotes && (typeof reviewNotes !== "string" || reviewNotes.length > 1000)) {
			return NextResponse.json(
				{ error: "reviewNotes must be a string of 1000 characters or less" },
				{ status: 400 },
			);
		}

		const serviceClient = createServiceClient();

		const { data: bot } = await serviceClient
			.from("bot_applications")
			.select("id, owner_id, name, status, bot_type")
			.eq("id", botId)
			.single();

		if (!bot) {
			return NextResponse.json({ error: "Bot not found" }, { status: 404 });
		}

		const statusMap: Record<string, string> = {
			approve: "approved",
			reject: "rejected",
			suspend: "suspended",
		};

		const newStatus = statusMap[action];

		const { data: updated, error: updateError } = await serviceClient
			.from("bot_applications")
			.update({
				status: newStatus,
				reviewed_by: user.id,
				reviewed_at: new Date().toISOString(),
				review_notes: reviewNotes ?? null,
			})
			.eq("id", botId)
			.select()
			.single();

		if (updateError || !updated) {
			return NextResponse.json({ error: "Failed to update bot status" }, { status: 500 });
		}

		await auditLog({
			actorId: user.id,
			actorRole,
			action: `bot_${action}d`,
			targetUserId: bot.owner_id,
			targetBotId: bot.id,
			metadata: {
				bot_name: bot.name,
				bot_type: bot.bot_type,
				old_status: bot.status,
				new_status: newStatus,
				review_notes: reviewNotes ?? null,
			},
			ipAddress: ip !== "unknown" ? ip : undefined,
		});

		return NextResponse.json({ bot: updated });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Internal error";
		if (message === "FORBIDDEN") {
			return NextResponse.json({ error: "Admin access required" }, { status: 403 });
		}
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
