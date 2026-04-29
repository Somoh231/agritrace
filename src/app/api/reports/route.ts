import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    reports: [
      {
        id: "rice_ministry_summary",
        title: "Rice ministry summary",
        formats: ["pdf", "csv"],
        endpoint: "/api/reports/rice",
      },
      {
        id: "compliance_dds",
        title: "Due diligence statement",
        formats: ["pdf"],
        endpoint: "/api/reports/dds",
      },
    ],
  });
}

