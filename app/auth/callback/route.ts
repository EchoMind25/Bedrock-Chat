import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth callback handler for Supabase email confirmation links.
 *
 * Flow:
 * 1. User clicks "Confirm your email" link in their inbox
 * 2. Supabase verifies the token and redirects here with a `code` param
 * 3. We exchange the code for a session (sets auth cookies)
 * 4. We create the user's profile if it doesn't exist yet
 * 5. We redirect to the main app
 */
export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get("code");
	const next = searchParams.get("next") ?? "/servers/server-1/channel-1";

	if (code) {
		const supabase = await createClient();
		const { error } = await supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			// Session is now active — create profile if it doesn't exist
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (user) {
				const { data: existingProfile } = await supabase
					.from("profiles")
					.select("id")
					.eq("id", user.id)
					.maybeSingle();

				if (!existingProfile) {
					const metadata = user.user_metadata;
					const username =
						metadata?.username ||
						user.email?.split("@")[0] ||
						`user_${user.id.slice(0, 8)}`;

					await supabase.from("profiles").insert({
						id: user.id,
						username,
						display_name: username,
						account_type: metadata?.account_type || "standard",
					});
				}
			}

			// Redirect to the app — the main layout will call checkAuth()
			// which reads the session from cookies and loads the profile
			return NextResponse.redirect(`${origin}${next}`);
		}
	}

	// If code exchange fails, redirect to login
	return NextResponse.redirect(`${origin}/login`);
}
