import { NextResponse } from "next/server";
import { createClaimFromDigitization } from "@/lib/services/claim-service";
import { queryDb } from "@/lib/db";
import type { ClaimMapRow } from "@/lib/types";

export async function GET() {
  try {
    const claims = await queryDb<ClaimMapRow>(
      `select * from claims_map order by submitted_on desc;`
    );
    return NextResponse.json(claims);
  } catch (error: any) {
    console.error("GET /api/claims error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createClaimFromDigitization(body);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("POST /api/claims error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
