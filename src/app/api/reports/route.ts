import { NextResponse } from "next/server";

import { apiHeaders, beginApiRequestAsync, rejectIfRateLimited } from "@/lib/http/api-response";
import { READ_POLICY } from "@/lib/http/rate-limit-policies";
import { requireApiSession } from "@/lib/http/require-api-session";

export async function GET(request: Request) {
  const auth = await requireApiSession(request);
  if (!auth.ok) return auth.response;

  const ctx = await beginApiRequestAsync(request, READ_POLICY, auth.session.userId);
  const blocked = rejectIfRateLimited(ctx);
  if (blocked) return blocked;

  return NextResponse.json(
    {
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
    },
    { headers: apiHeaders(ctx) },
  );
}
