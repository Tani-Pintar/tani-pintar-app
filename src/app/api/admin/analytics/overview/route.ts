import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/session";
import { forbiddenRole, internalError, unauthorized } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  const ctx = await requireSession();
  if (!ctx) return unauthorized();
  if (!requireRole(ctx, "ADMIN")) return forbiddenRole();

  try {
    const [
      totalFarmers,
      totalBuyers,
      totalHarvestPlans,
      totalMatches,
      totalTransactionsResult,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "PETANI" } }),
      prisma.user.count({ where: { role: "BUYER" } }),
      prisma.harvestPlan.count(),
      prisma.match.count(),
      prisma.transaction.aggregate({
        _sum: { totalAmount: true },
      }),
    ]);

    return Response.json(
      {
        totalFarmers,
        totalBuyers,
        totalHarvestPlans,
        totalMatches,
        totalTransactionsValue: totalTransactionsResult._sum.totalAmount ?? 0,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/admin/analytics/overview]", err);
    return internalError();
  }
}
