/**
 * Supabase service role client — bypasses RLS for privileged operations.
 *
 * IMPORTANT: Server-side only. NEVER import this file in client components
 * or any file marked with "use client". The service role key must never
 * appear in the client-side bundle.
 */

import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!url || !serviceKey) {
		throw new Error("Missing Supabase service configuration");
	}

	return createClient(url, serviceKey);
}
