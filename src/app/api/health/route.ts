import { NextResponse } from "next/server";
import { queryDb } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  let dbStatus = "unreachable";
  let claimCount = 0;
  let errorMsg = null;

  try {
    const res = await queryDb<{ count: string }>("select count(*) as count from claims;");
    if (res && res[0]) {
      dbStatus = "connected";
      claimCount = parseInt(res[0].count, 10) || 0;
    }
  } catch (err: any) {
    errorMsg = err.message;
  }

  const clientConfigured = isSupabaseConfigured();

  return NextResponse.json({
    status: dbStatus === "connected" ? "healthy" : "degraded",
    dataSource: dbStatus === "connected" ? "supabase" : "fallback",
    database: {
      status: dbStatus,
      claimCount,
      error: errorMsg,
    },
    clientSupabase: {
      configured: clientConfigured,
    },
    timestamp: new Date().toISOString(),
  });
}
