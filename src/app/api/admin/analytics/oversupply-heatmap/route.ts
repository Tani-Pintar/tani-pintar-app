import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/session";
import { forbiddenRole, internalError, unauthorized } from "@/lib/api-error";

export async function GET(_req: NextRequest) {
  const ctx = await requireSession();
  if (!ctx) return unauthorized();
  if (!requireRole(ctx, "ADMIN")) return forbiddenRole();

  try {
    const listings = await prisma.saleListing.findMany({
      where: {
        isOversupply: true,
        status: "OPEN",
      },
      orderBy: { volume: "desc" },
      take: 50,
    });

    const points = listings.map((l) => ({
      commodity: l.commodity,
      region: l.locationName ?? "Tidak diketahui",
      latitude: l.latitude ?? 0,
      longitude: l.longitude ?? 0,
      intensity: l.volume / 1000,
      volumeAtRisk: l.volume,
    }));

    return Response.json(
      {
        points,
        generatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/admin/analytics/oversupply-heatmap]", err);
    return internalError();
  }
}
