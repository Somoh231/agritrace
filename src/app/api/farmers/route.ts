import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "50"), 1), 200);
  const county = (url.searchParams.get("county") ?? "").trim();

  let query = supabase
    .from("farmers")
    .select("id,full_name,national_id,phone,county,district,village,registration_date,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (county) query = query.eq("county", county);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ farmers: data ?? [] });
}

