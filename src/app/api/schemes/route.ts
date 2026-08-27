import { NextResponse } from "next/server";
import { queryDb } from "@/lib/db";
import { STATIC_SCHEMES, SchemeRow } from "@/lib/dss";

export async function GET() {
  try {
    const rows = await queryDb<SchemeRow>(
      `select code, name, description, eligibility_json, department, benefit_description from schemes order by code;`
    );

    if (rows && rows.length > 0) {
      return NextResponse.json({
        data: rows,
        dataSource: "supabase",
        count: rows.length,
      });
    }
  } catch (error: any) {
    console.warn("[TRINETRA API] /api/schemes database query failed, using static fallback:", error.message);
  }

  return NextResponse.json({
    data: STATIC_SCHEMES,
    dataSource: "fallback",
    count: STATIC_SCHEMES.length,
  });
}
