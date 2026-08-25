import { NextResponse } from "next/server";
import { getFullClaimDetails } from "@/lib/services/claim-service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const details = await getFullClaimDetails(id);
    if (!details) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }
    return NextResponse.json(details);
  } catch (error: any) {
    console.error("GET /api/claims/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
