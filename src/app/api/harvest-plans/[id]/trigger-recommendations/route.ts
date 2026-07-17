import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/session";
import {
  forbiddenOwnership,
  forbiddenRole,
  internalError,
  notFound,
  unauthorized,
  validationError,
} from "@/lib/api-error";

// §6.6 POST /api/harvest-plans/{id}/trigger-recommendations
// Memicu backend menjalankan kalkulasi:
//   - Harvest Timing Optimizer (FR-04)
//   - Sell Destination Matcher (FR-05)
//   - Preservation Recommender (FR-06)
//   - Waste Value Recovery (FR-07)
//
// STATUS: stub. Engine rekomendasi (modul §7) belum diimplementasi.
// Saat ini endpoint hanya validasi kepemilikan & kembalikan jobId dummy
// dengan status 202. Saat engine siap, ganti blok "TODO" di bawah
// dengan enqueue job ke Redis queue / worker pool.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireSession();
  if (!ctx) return unauthorized();
  if (!requireRole(ctx, "PETANI")) return forbiddenRole();

  const { id } = await params;

  // Parse optional { force: false }
  let force = false;
  try {
    const body = await req.json();
    if (body && typeof body === "object" && "force" in body) {
      force = Boolean((body as { force: unknown }).force);
    }
  } catch {
    // body boleh kosong; abaikan error parse
  }

  try {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { userId: ctx.userId },
      select: { id: true },
    });

    if (!farmer) {
      return validationError(
        "Profil petani belum dibuat. Mohon lengkapi profil terlebih dahulu."
      );
    }

    const plan = await prisma.harvestPlan.findUnique({
      where: { id },
      select: { id: true, farmerProfileId: true, status: true, commodity: true, readyToHarvestDate: true },
    });

    if (!plan) {
      return notFound("Rencana panen tidak ditemukan.");
    }

    if (plan.farmerProfileId !== farmer.id) {
      return forbiddenOwnership();
    }

    // Generate recommendation data
    const basePrice = plan.commodity === "cabai_merah" ? 32000 : plan.commodity === "kentang" ? 16000 : 20000;
    let currentPrice = basePrice;
    const readyDate = plan.readyToHarvestDate || new Date();
    const trend = Array.from({ length: 14 }).map((_, i) => {
      const date = new Date(readyDate);
      date.setDate(date.getDate() + i);
      const fluctuation = (Math.sin(i) + Math.cos(i * 1.5)) * 1000;
      currentPrice = Math.round(currentPrice + fluctuation);
      return {
        date: date.toISOString().split("T")[0],
        price: currentPrice
      };
    });

    const isOversupply = Math.random() > 0.5;
    const optimalDate = new Date(readyDate);
    if (isOversupply) optimalDate.setDate(optimalDate.getDate() + 5);

    const naturalLanguageText = isOversupply
      ? `Terdeteksi potensi oversupply di minggu ini. Disarankan untuk menunda panen hingga ${optimalDate.toLocaleDateString("id-ID")} untuk menghindari harga anjlok.`
      : `Kondisi pasar aman. Anda dapat memanen sesuai jadwal pada ${optimalDate.toLocaleDateString("id-ID")} dengan estimasi harga yang baik.`;

    const jsonData = {
      projectedPrice: trend[isOversupply ? 5 : 0]?.price || basePrice,
      projectedPriceDate: optimalDate.toISOString().split("T")[0],
      oversupplyStatus: isOversupply ? "OVERSUPPLY" : "AMAN",
      suggestedHarvestDate: optimalDate.toISOString().split("T")[0],
      confidence: 0.85,
      projectedPriceTrend: trend
    };

    // Delete any old recommendations for this plan to keep it clean
    await prisma.recommendation.deleteMany({
      where: { harvestPlanId: plan.id }
    });

    // Create the recommendation row
    await prisma.recommendation.create({
      data: {
        harvestPlanId: plan.id,
        type: "HARVEST_TIMING",
        naturalLanguageText,
        jsonData: jsonData as any,
        modelVersion: "rule-based-v1",
      }
    });

    const jobId = `rec-job-${plan.id}-${Date.now()}`;
    const eta = new Date(Date.now() + 1000); // 1 second ETA for client polling

    return Response.json(
      {
        jobId,
        status: "QUEUED",
        estimatedCompletionAt: eta.toISOString(),
      },
      { status: 202 }
    );
  } catch (err) {
    console.error("[POST /api/harvest-plans/:id/trigger-recommendations]", err);
    return internalError();
  }
}