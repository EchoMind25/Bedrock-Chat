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

	return <MainLayoutClient>{children}</MainLayoutClient>;
}
