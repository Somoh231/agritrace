import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

type ChatMessage = { role: "user" | "assistant"; content: string };

/** Override via ANTHROPIC_MODEL; default is broadly available on Anthropic accounts. */
const ANTHROPIC_MODEL = (process.env.ANTHROPIC_MODEL ?? "claude-3-haiku-20240307").trim();

if (typeof console !== "undefined" && console.info) {
  console.info("[ai/chat] Anthropic operational assistant model:", ANTHROPIC_MODEL);
}

type ReqBody = {
  messages: ChatMessage[];
  role: UserRole;
  pathname?: string;
};

type Intent =
  | "food_risk"
  | "warehouse_low_stock"
  | "dao_overdue"
  | "subsidy_progress"
  | "county_performance"
  | "briefing"
  | "warehouse_alerts"
  | "generic";

function classifyIntent(latest: string): Intent {
  const q = latest.toLowerCase();
  if (q.includes("food") || q.includes("insecurity") || q.includes("risk")) return "food_risk";
  if (q.includes("stockout") || q.includes("low on") || q.includes("fertilizer") || q.includes("warehouse")) return "warehouse_low_stock";
  if (q.includes("dao") && (q.includes("overdue") || q.includes("compliance") || q.includes("anomal"))) return "dao_overdue";
  if (q.includes("subsidy") && (q.includes("progress") || q.includes("distribution") || q.includes("utilization") || q.includes("fraud"))) return "subsidy_progress";
  if (q.includes("declin") || q.includes("production") || q.includes("county")) return "county_performance";
  if (q.includes("brief") || q.includes("cabinet") || q.includes("minister")) return "briefing";
  if (q.includes("expiry") || q.includes("delay") || q.includes("utilization")) return "warehouse_alerts";
  return "generic";
}

function systemPromptForRole(role: UserRole): string {
  const base = [
    "You are an agricultural operational intelligence analyst assisting Liberia’s Ministry of Agriculture.",
    "You produce government-grade briefings: concise, analytical, operational, and actionable.",
    "Avoid generic chatbot tone, excessive friendliness, emojis, or casual phrasing.",
    "",
    "Critical architecture constraints:",
    "- You MUST NOT query Supabase or request database credentials.",
    "- You MUST rely ONLY on the operational context provided in the request.",
    "- If context is missing, ask for the minimal missing detail and propose the next best action using available signals.",
    "",
    "Output format:",
    "- Start with a short headline (1 line).",
    "- Then 3–7 bullet points under: Situation, Risks, Recommended actions.",
    "- When asked for rankings, include a compact table-like list (county/warehouse + reason + severity).",
  ].join("\n");

  const roleLens =
    role === "warehouse_manager"
      ? "Role lens: Warehouse Manager — emphasize stockouts, expiry risk, receipts, transfers, and custody confirmation."
      : role === "district_officer" || role === "field_agent"
        ? "Role lens: DAO — emphasize field reporting cadence, inspections, pest evidence, subsidy delivery verification, and offline queue hygiene."
        : role === "county_officer"
          ? "Role lens: CAO — emphasize county intervention priorities, DAO supervision, subsidy progress, and anomaly routing."
          : role === "donor_partner" || role === "auditor"
            ? "Role lens: Donor/Auditor — emphasize transparency, immutable ledgers, verification chains, and read-only evidence trails."
            : "Role lens: Ministry leadership — emphasize national posture, inter-county prioritization, and briefing-ready language.";

  return `${base}\n\n${roleLens}`;
}

async function fetchOperationalContext(args: {
  intent: Intent;
  role: UserRole;
}): Promise<Record<string, unknown>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Small, role-governed extracts. RLS will redact as needed.
  const limit = 80;
  const now = new Date();
  const since30d = new Date(now.getTime() - 30 * 86400000).toISOString();

  const base: Record<string, unknown> = {
    generated_at: new Date().toISOString(),
    intent: args.intent,
    role: args.role,
    notes:
      "Context is a concise, role-governed snapshot from Supabase. If some arrays are empty, that may indicate RLS redaction or unseeded tables.",
  };

  const tasks: Array<PromiseLike<void>> = [];

  const add = (key: string, p: PromiseLike<{ data: unknown; error: unknown }>) => {
    tasks.push(
      p.then((r) => {
        (base as any)[key] = (r as any).data ?? [];
        (base as any)[`${key}_error`] = (r as any).error ? String((r as any).error.message ?? (r as any).error) : null;
      }),
    );
  };

  // Core sources requested.
  add(
    "pilot_county_metrics",
    supabase.from("pilot_county_metrics").select("county,production_index,food_risk,dao_compliance,updated_at").limit(limit),
  );
  add(
    "pilot_operational_events",
    supabase.from("pilot_operational_events").select("event_code,occurred_at,severity,county,district,event_type,message,status").order("occurred_at", { ascending: false }).limit(limit),
  );
  add("farmers", supabase.from("farmers").select("id,registry_public_id,county,district,verification_status,created_at").order("created_at", { ascending: false }).limit(limit));
  add("warehouse_stock", supabase.from("warehouse_stock").select("warehouse_id,inventory_item_id,quantity,expiry_date,donor_tagged,loss_flag,theft_flag").limit(limit));
  add("inventory_movements", supabase.from("inventory_movements").select("created_at,movement_type,quantity,warehouse_from,warehouse_to,reference").order("created_at", { ascending: false }).limit(limit));
  add("rice_production_records", supabase.from("rice_production_records").select("season,county,expected_yield_kg,actual_yield_kg,created_at").order("created_at", { ascending: false }).limit(limit));
  add("reports", supabase.from("reports").select("report_code,title,period_label,status,created_at").order("created_at", { ascending: false }).limit(40));
  add("audit_log", supabase.from("audit_log").select("created_at,action,table_name,record_id,user_id").order("created_at", { ascending: false }).limit(limit));

  // DAO oversight rows (pilot_dao_officers).
  add(
    "dao_oversight",
    supabase.from("pilot_dao_officers").select("dao_code,county,district,reports_submitted,overdue_reports,farm_visits,last_activity,compliance_score,status").limit(limit),
  );

  // Warehouse intelligence (warehouses + donor shipments + distributions + transfer orders).
  add(
    "warehouses",
    supabase.from("warehouses").select("id,name,county,ministry_code,capacity_mt,current_stock_mt,utilization_pct,donor_resupply_flag").limit(limit),
  );
  add(
    "donor_shipments",
    supabase.from("donor_shipments").select("donor_name,programme_code,quantity,received_at,warehouse_id,inventory_item_id,created_at").order("created_at", { ascending: false }).limit(limit),
  );
  add(
    "distribution_logs",
    supabase.from("distribution_logs").select("distributed_at,quantity,channel,warehouse_id,inventory_item_id,farmer_id,created_by").order("distributed_at", { ascending: false }).limit(limit),
  );
  add(
    "warehouse_transfer_orders",
    supabase.from("warehouse_transfer_orders").select("requested_at,transfer_code,status,quantity,warehouse_from,warehouse_to,sku_code,inventory_item_id").order("requested_at", { ascending: false }).limit(limit),
  );
  // Field reporting cadence for anomaly checks.
  add(
    "field_reports_30d",
    supabase.from("field_reports").select("submitted_at,county,channel,summary").gte("submitted_at", since30d).order("submitted_at", { ascending: false }).limit(limit),
  );

  await Promise.all(tasks);
  return base;
}

function safeMessagesForClaude(messages: ChatMessage[]): ChatMessage[] {
  // Keep last 12 exchanges; strip huge payloads.
  const trimmed = messages.slice(-24).map((m) => ({
    role: m.role,
    content: String(m.content ?? "").slice(0, 8000),
  }));
  // Ensure last is user.
  if (trimmed.length && trimmed[trimmed.length - 1]!.role !== "user") {
    trimmed.push({ role: "user", content: "Continue with the last operational question." });
  }
  return trimmed;
}

function describeAnthropicStreamError(e: unknown): { logLine: string; streamNotice: string } {
  const anyErr = e as Record<string, unknown> & { message?: string };
  const status = Number(anyErr?.status ?? (anyErr?.response as { status?: number } | undefined)?.status ?? 0);
  const nestedObj =
    anyErr?.error && typeof anyErr.error === "object"
      ? (anyErr.error as { message?: string; type?: string })
      : null;
  const nestedMessage = nestedObj?.message != null ? String(nestedObj.message) : "";
  const apiType = nestedObj?.type != null ? String(nestedObj.type) : "";
  const topMessage = anyErr?.message != null ? String(anyErr.message) : "";
  const message = topMessage || nestedMessage || String(e ?? "unknown error");

  if (status === 401 || status === 403) {
    return {
      logLine: `[ai/chat] Anthropic auth rejected (HTTP ${status}) for model=${ANTHROPIC_MODEL}: ${message}`,
      streamNotice:
        "\n\n[AI unavailable] API authentication was rejected. Verify ANTHROPIC_API_KEY and account access.\n",
    };
  }
  if (
    status === 404 ||
    /not_found/i.test(apiType) ||
    /model_not_found|model.*not found|does not exist|not have access/i.test(message)
  ) {
    return {
      logLine: `[ai/chat] Model unavailable or denied for model=${ANTHROPIC_MODEL}: ${message}`,
      streamNotice: `\n\n[AI unavailable] Model "${ANTHROPIC_MODEL}" is not enabled for this Anthropic account. Set ANTHROPIC_MODEL to an enabled model (default: claude-3-haiku-20240307).\n`,
    };
  }
  if (status >= 400 && status < 500) {
    return {
      logLine: `[ai/chat] Anthropic client error (HTTP ${status}) model=${ANTHROPIC_MODEL}: ${message}`,
      streamNotice: "\n\n[AI unavailable] The request could not be accepted. Check configuration or try again.\n",
    };
  }
  if (status >= 500) {
    return {
      logLine: `[ai/chat] Anthropic server error (HTTP ${status}) model=${ANTHROPIC_MODEL}: ${message}`,
      streamNotice: "\n\n[AI unavailable] The AI provider returned an error. Retry shortly.\n",
    };
  }
  return {
    logLine: `[ai/chat] Anthropic stream failed model=${ANTHROPIC_MODEL}: ${message}`,
    streamNotice: "\n\n[AI unavailable] The assistant could not complete this response. Retry shortly.\n",
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReqBody;
    const latestUser = [...(body.messages ?? [])].reverse().find((m) => m.role === "user")?.content ?? "";
    const intent = classifyIntent(latestUser);

    const context = await fetchOperationalContext({ intent, role: body.role });

    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing ANTHROPIC_API_KEY on server." },
        { status: 500 },
      );
    }

    const client = new Anthropic({ apiKey });

    const system = systemPromptForRole(body.role);
    const userContext = [
      "Operational context (JSON):",
      JSON.stringify(context),
      "",
      "User question:",
      latestUser,
    ].join("\n");

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          const messages = [
            ...safeMessagesForClaude(body.messages ?? []).filter((m) => m.role !== "assistant"),
            { role: "user", content: userContext },
          ] satisfies Array<{ role: "user" | "assistant"; content: string }>;

          try {
            const s = client.messages.stream({
              model: ANTHROPIC_MODEL,
              max_tokens: 900,
              system,
              messages,
            });

            for await (const event of s) {
              if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
                controller.enqueue(encoder.encode(event.delta.text ?? ""));
              }
            }
          } catch (e) {
            const { logLine, streamNotice } = describeAnthropicStreamError(e);
            console.error(logLine);
            controller.enqueue(encoder.encode(streamNotice));
          }
        } catch (e) {
          console.error("[ai/chat] Unexpected stream wrapper error:", e instanceof Error ? e.message : String(e));
          controller.enqueue(encoder.encode("\n\n[AI unavailable] Service error. Retry shortly.\n"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 400 },
    );
  }
}

