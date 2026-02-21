import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_BCC_API_URL;
  const ingestKey = process.env.BCC_INGEST_KEY;

  if (!apiUrl || !ingestKey) {
    return NextResponse.json(
      { error: "Bug reporting is not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();

    const response = await fetch(`${apiUrl}/api/bcc/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ingestKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[report-bug]", error);
    return NextResponse.json(
      { error: "Failed to submit bug report" },
      { status: 502 }
    );
  }
}
