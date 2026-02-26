import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MainLayoutClient } from "./layout-client";

export default async function MainLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	// Check waitlist status — super_admins bypass entirely
	const { data: profile } = await supabase
		.from("profiles")
		.select("waitlist_status, platform_role")
		.eq("id", user.id)
		.single();

	if (
		profile?.platform_role !== "super_admin" &&
		profile?.platform_role !== "beta_tester" &&
		profile?.waitlist_status !== "approved" &&
		profile?.waitlist_status !== "bypassed"
	) {
		redirect("/waitlist-pending");
	}

	return <MainLayoutClient>{children}</MainLayoutClient>;
}
