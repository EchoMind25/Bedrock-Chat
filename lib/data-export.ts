import { createClient } from "@/lib/supabase/client";

export interface UserDataExport {
	exportedAt: string;
	profile: {
		id: string;
		username: string;
		displayName: string;
		email: string;
		avatarUrl: string;
		status: string;
		accountType: string;
		createdAt: string;
	};
	servers: Array<{
		id: string;
		name: string;
		role: string;
		joinedAt: string;
	}>;
	friends: Array<{
		username: string;
		displayName: string;
		addedAt: string;
	}>;
	messages: Array<{
		id: string;
		channelId: string;
		content: string;
		createdAt: string;
		editedAt: string | null;
	}>;
	directMessages: Array<{
		id: string;
		content: string;
		recipientUsername: string;
		createdAt: string;
	}>;
	consentPreferences: Record<string, unknown>;
	familyData: {
		memberships: Array<{ familyId: string; role: string; joinedAt: string }>;
		activityLog: Array<{
			actionType: string;
			details: Record<string, unknown>;
			occurredAt: string;
			visibleToChild: boolean;
		}>;
		keywordAlertsOnMyAccount: Array<{
			keyword: string;
			severity: string;
			isActive: boolean;
			createdAt: string;
		}>;
	};
}

export async function exportUserData(userId: string): Promise<UserDataExport> {
	const supabase = createClient();

	// Fetch all user data in parallel
	const [
		profileRes,
		serversRes,
		friends1Res,
		friends2Res,
		messagesRes,
		dmsRes,
		familyMemberRes,
		activityLogRes,
		keywordAlertsRes,
	] = await Promise.all([
		supabase.from("profiles").select("*").eq("id", userId).single(),
		supabase
			.from("server_members")
			.select(
				`
				role,
				joined_at,
				server:servers(id, name)
			`,
			)
			.eq("user_id", userId),
		supabase
			.from("friendships")
			.select(
				`
				created_at,
				friend:profiles!friendships_user2_id_fkey(username, display_name)
			`,
			)
			.eq("user1_id", userId),
		supabase
			.from("friendships")
			.select(
				`
				created_at,
				friend:profiles!friendships_user1_id_fkey(username, display_name)
			`,
			)
			.eq("user2_id", userId),
		supabase
			.from("messages")
			.select("id, channel_id, content, created_at, edited_at")
			.eq("user_id", userId)
			.eq("is_deleted", false)
			.order("created_at", { ascending: false })
			.limit(10000),
		supabase
			.from("direct_messages")
			.select(
				`
				id,
				content,
				created_at,
				receiver:profiles!direct_messages_receiver_id_fkey(username)
			`,
			)
			.eq("sender_id", userId)
			.eq("is_deleted", false)
			.order("created_at", { ascending: false })
			.limit(5000),
		// Family data (GDPR Article 20 - all personal data)
		supabase
			.from("family_members")
			.select("family_id, role, created_at")
			.eq("user_id", userId),
		supabase
			.from("family_activity_log")
			.select("activity_type, details, occurred_at, visible_to_child")
			.eq("user_id", userId)
			.order("occurred_at", { ascending: false })
			.limit(500),
		supabase
			.from("family_keyword_alerts")
			.select("keyword, severity, is_active, created_at")
			.eq("teen_user_id", userId),
	]);

	const profile = profileRes.data;
	const { data: sessionData } = await supabase.auth.getUser();

	// Get consent preferences from localStorage (client-side only)
	let consentPreferences: Record<string, unknown> = {};
	try {
		const stored = localStorage.getItem("bedrock-consent");
		if (stored) {
			const parsed = JSON.parse(stored);
			consentPreferences = parsed?.state?.preferences ?? {};
		}
	} catch {
		// Ignore parse errors
	}

	return {
		exportedAt: new Date().toISOString(),
		profile: {
			id: profile?.id ?? userId,
			username: profile?.username ?? "",
			displayName: profile?.display_name ?? "",
			email: sessionData?.user?.email ?? "",
			avatarUrl: profile?.avatar_url ?? "",
			status: profile?.status ?? "offline",
			accountType: profile?.account_type ?? "standard",
			createdAt: profile?.created_at ?? "",
		},
		servers:
			serversRes.data?.map((s) => ({
				id: (s.server as any)?.id ?? "",
				name: (s.server as any)?.name ?? "",
				role: s.role ?? "member",
				joinedAt: s.joined_at ?? "",
			})) ?? [],
		friends: [
			...(friends1Res.data?.map((f) => ({
				username: (f.friend as any)?.username ?? "",
				displayName: (f.friend as any)?.display_name ?? "",
				addedAt: f.created_at ?? "",
			})) ?? []),
			...(friends2Res.data?.map((f) => ({
				username: (f.friend as any)?.username ?? "",
				displayName: (f.friend as any)?.display_name ?? "",
				addedAt: f.created_at ?? "",
			})) ?? []),
		],
		messages:
			messagesRes.data?.map((m) => ({
				id: m.id,
				channelId: m.channel_id,
				content: m.content,
				createdAt: m.created_at,
				editedAt: m.edited_at ?? null,
			})) ?? [],
		directMessages:
			dmsRes.data?.map((d) => ({
				id: d.id,
				content: d.content,
				recipientUsername: (d.receiver as any)?.username ?? "",
				createdAt: d.created_at,
			})) ?? [],
		consentPreferences,
		familyData: {
			memberships:
				familyMemberRes.data?.map((m) => ({
					familyId: m.family_id,
					role: m.role,
					joinedAt: m.created_at,
				})) ?? [],
			activityLog:
				activityLogRes.data?.map((l) => ({
					actionType: l.activity_type,
					details: (l.details as Record<string, unknown>) ?? {},
					occurredAt: l.occurred_at,
					visibleToChild: l.visible_to_child,
				})) ?? [],
			keywordAlertsOnMyAccount:
				keywordAlertsRes.data?.map((k) => ({
					keyword: k.keyword,
					severity: k.severity,
					isActive: k.is_active,
					createdAt: k.created_at,
				})) ?? [],
		},
	};
}

export function downloadAsJSON(data: unknown, filename: string) {
	const json = JSON.stringify(data, null, 2);
	const blob = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}
