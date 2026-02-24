import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { subscription, userAgent } = await req.json();

		if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
			return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
		}

		const { error } = await supabase.from("push_subscriptions").upsert(
			{
				user_id: user.id,
				endpoint: subscription.endpoint,
				keys_p256dh: subscription.keys.p256dh,
				keys_auth: subscription.keys.auth,
				user_agent: userAgent ?? null,
			},
			{ onConflict: "endpoint" },
		);

		if (error) {
			console.error("[push/subscribe]", error);
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ ok: true });
	} catch (err) {
		console.error("[push/subscribe]", err);
		return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { endpoint } = await req.json();

		if (!endpoint) {
			return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
		}

		await supabase
			.from("push_subscriptions")
			.delete()
			.eq("user_id", user.id)
			.eq("endpoint", endpoint);

		return NextResponse.json({ ok: true });
	} catch (err) {
		console.error("[push/unsubscribe]", err);
		return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 });
	}
}
