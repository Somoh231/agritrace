import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function clampStr(v: unknown, max: number) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  return s.length > max ? s.slice(0, max) : s;
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      full_name?: string;
      email?: string;
      organization?: string;
      phone?: string;
      message?: string;
      source?: string;
    };

    const full_name = clampStr(body.full_name, 200);
    const email = clampStr(body.email, 320).toLowerCase();
    const organization = clampStr(body.organization, 200) || null;
    const phone = clampStr(body.phone, 80) || null;
    const message = clampStr(body.message, 4000) || null;
    const source = clampStr(body.source, 64) || "request_demo";

    if (full_name.length < 2) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }
    if (!isEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    let admin;
    try {
      admin = getSupabaseAdminClient();
    } catch {
      return NextResponse.json(
        { error: "Demo requests are not configured yet. Contact the administrator." },
        { status: 503 },
      );
    }

    const { error } = await admin.from("demo_inquiries").insert({
      full_name,
      email,
      organization,
      phone,
      message,
      source,
      status: "new",
    } as any);

    if (error) {
      if (error.message.includes("does not exist") || error.code === "42P01") {
        return NextResponse.json(
          { error: "Database table missing. Run schema.demo_inquiries.sql in Supabase." },
          { status: 503 },
        );
      }
      console.error("demo_inquiries insert", error);
      return NextResponse.json({ error: "Could not save your request. Try again later." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
