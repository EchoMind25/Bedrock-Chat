import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth callback handler for Supabase email confirmation links.
 *
 * When a user clicks the confirmation link in their email,
 * Supabase redirects them here with a `code` query parameter.
 * We exchange the code for a session, then redirect to the app.
 */
export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get("code");
	const next = searchParams.get("next") ?? "/servers/server-1/channel-1";

	if (code) {
		const supabase = await createClient();
		const { error } = await supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			// Check if the user has a profile, create one if missing
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
					// Create profile from user metadata (set during signUp)
					const metadata = user.user_metadata;
					await supabase.from("profiles").insert({
						id: user.id,
						username:
							metadata?.username ||
							user.email?.split("@")[0] ||
							`user_${user.id.slice(0, 8)}`,
						display_name: metadata?.username || user.email?.split("@")[0],
						account_type: metadata?.account_type || "standard",
					});
				}
			}

			return NextResponse.redirect(`${origin}${next}`);
		}
	}

	// If code exchange fails, redirect to login with error
	return NextResponse.redirect(`${origin}/login`);
}
