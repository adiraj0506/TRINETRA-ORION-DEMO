import { NextResponse } from "next/server";
import {
  approveClaimAction,
  rejectClaimAction,
  returnClaimAction,
  requestFieldVerificationAction,
} from "@/lib/services/claim-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, notes, reason } = body;

    let success = false;
    switch (action) {
      case "approve":
        success = await approveClaimAction(id, notes);
        break;
      case "reject":
        success = await rejectClaimAction(id, reason || "Documentation or occupancy criterion unverified.");
        break;
      case "return":
        success = await returnClaimAction(id, reason || "Please rectify survey numbers and provide supporting resolution.");
        break;
      case "field_verification":
        success = await requestFieldVerificationAction(id, notes);
        break;
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ success, action, claimId: id });
  } catch (error: any) {
    console.error("POST /api/claims/[id]/actions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
