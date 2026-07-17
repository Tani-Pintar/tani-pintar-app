import { NextRequest } from "next/server";
import { requireSession, requireRole } from "@/lib/session";
import { forbiddenRole, internalError, unauthorized } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  const ctx = await requireSession();
  if (!ctx) return unauthorized();
  if (!requireRole(ctx, "ADMIN")) return forbiddenRole();

  try {
    const url = new URL(req.url);
    const commodity = url.searchParams.get("commodity");

    return Response.json(
      {
        commodity: commodity || "Bawang Merah",
        series: [],
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/admin/analytics/commodity-trend]", err);
    return internalError();
  }
}
