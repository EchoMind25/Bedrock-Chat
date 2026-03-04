import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
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

	// Only super_admin and staff can access admin routes
	const { data: profile } = await supabase
		.from("profiles")
		.select("platform_role")
		.eq("id", user.id)
		.single();

	if (
		profile?.platform_role !== "super_admin" &&
		profile?.platform_role !== "staff" &&
		profile?.platform_role !== "moderator"
	) {
		redirect("/friends");
	}

	return <>{children}</>;
}
