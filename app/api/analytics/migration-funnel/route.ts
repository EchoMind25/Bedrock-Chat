import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/app/api/analytics/_auth";
import { getMigrationFunnelData } from "@/lib/services/migration-analytics";

/**
 * GET /api/analytics/migration-funnel?start=YYYY-MM-DD&end=YYYY-MM-DD
 *
 * Returns aggregate migration funnel data for the admin dashboard.
 * Requires super_admin role.
 */
export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "start and end query params required" }, { status: 400 });
  }

  try {
    const data = await getMigrationFunnelData(start, end);
    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("[migration-funnel API]", err);
    return NextResponse.json({ error: "Failed to fetch funnel data" }, { status: 500 });
  }
}
