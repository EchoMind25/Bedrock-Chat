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
 * 5. We redirect to the main app (onboarding for new users, /friends for returning)
 */
export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get("code");
	const next = searchParams.get("next");

	if (code) {
		const supabase = await createClient();
		const { error } = await supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			// Session is now active — create profile if it doesn't exist
			const {
				data: { user },
			} = await supabase.auth.getUser();

			let isNewUser = false;

			if (user) {
				const { data: existingProfile } = await supabase
					.from("profiles")
					.select("id")
					.eq("id", user.id)
					.maybeSingle();

				if (!existingProfile) {
					isNewUser = true;
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

			// Redirect: new users go to onboarding, returning users to main app
			const redirectTo = next ?? (isNewUser ? "/onboarding" : "/friends");
			return NextResponse.redirect(`${origin}${redirectTo}`);
		}
	}

	// If code exchange fails, redirect to login
	return NextResponse.redirect(`${origin}/login`);
}
