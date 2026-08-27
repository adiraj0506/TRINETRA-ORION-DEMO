import { NextResponse } from "next/server";
import { queryDb } from "@/lib/db";

export async function GET() {
  try {
    const rows = await queryDb(
      `select * from dispute_zones_map limit 50;`
    );

    if (rows && rows.length > 0) {
      return NextResponse.json({
        data: rows,
        dataSource: "supabase",
        count: rows.length,
      });
    }
  } catch (error: any) {
    console.warn("[TRINETRA API] /api/dispute-zones query failed, using empty fallback:", error.message);
  }

  return NextResponse.json({
    data: [],
    dataSource: "fallback",
    count: 0,
  });
}
