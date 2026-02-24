import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import webpush from "web-push";

// Configure VAPID — runs once at module load
const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:support@bedrockchat.com";

if (vapidPublic && vapidPrivate) {
	webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
}

export async function POST(req: NextRequest) {
	if (!vapidPublic || !vapidPrivate) {
		return NextResponse.json({ error: "VAPID not configured" }, { status: 503 });
	}

	// Use service role to look up another user's subscriptions
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!serviceKey) {
		return NextResponse.json({ error: "Service role key not configured" }, { status: 503 });
	}

	try {
		const { userId, title, body, icon, tag, url } = await req.json();

		if (!userId || !title) {
			return NextResponse.json({ error: "userId and title are required" }, { status: 400 });
		}

		// Service-role client bypasses RLS to read the target user's subscriptions
		const supabase = createServerClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			serviceKey,
			{ cookies: { getAll: () => [], setAll: () => {} } },
		);

		const { data: subs } = await supabase
			.from("push_subscriptions")
			.select("endpoint, keys_p256dh, keys_auth")
			.eq("user_id", userId);

		if (!subs?.length) {
			return NextResponse.json({ sent: 0 });
		}

		const payload = JSON.stringify({ title, body, icon, tag, url });
		let sent = 0;

		for (const sub of subs) {
			try {
				await webpush.sendNotification(
					{
						endpoint: sub.endpoint,
						keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
					},
					payload,
				);
				sent++;
			} catch (err: unknown) {
				const statusCode = (err as { statusCode?: number }).statusCode;
				// 410 Gone = subscription expired, clean it up
				if (statusCode === 410 || statusCode === 404) {
					await supabase
						.from("push_subscriptions")
						.delete()
						.eq("endpoint", sub.endpoint);
				}
			}
		}

		return NextResponse.json({ sent });
	} catch (err) {
		console.error("[push/send]", err);
		return NextResponse.json({ error: "Failed to send push" }, { status: 500 });
	}
}
