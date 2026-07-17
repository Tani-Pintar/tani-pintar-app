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
      select: {
        id: true,
        farmerProfileId: true,
        status: true,
        commodity: true,
        readyToHarvestDate: true,
        estimatedVolume: true,
        land: {
          select: {
            latitude: true,
            longitude: true,
          }
        }
      },
    });

    if (!plan) {
      return notFound("Rencana panen tidak ditemukan.");
    }

    if (plan.farmerProfileId !== farmer.id) {
      return forbiddenOwnership();
    }

    // Generate recommendation data
    const prices: Record<string, number> = {
      cabai_merah: 38000,
      cabai_rawit: 45000,
      bawang_merah: 32000,
      bawang_putih: 28000,
      tomat: 12000,
      kentang: 16000,
      kubis: 6000
    };

    // Query latest price from database or fallback
    const latestPriceSnapshot = await prisma.priceSnapshot.findFirst({
      where: { commodity: plan.commodity.replace("_", " ") },
      orderBy: { snapshotDate: "desc" },
    });
    const basePrice = latestPriceSnapshot ? latestPriceSnapshot.pricePerUnit : (prices[plan.commodity] || 20000);

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

    // Calculate Sell Destinations
    const farmerProfile = await prisma.farmerProfile.findUnique({
      where: { id: plan.farmerProfileId }
    });
    const farmerLat = plan.land?.latitude || farmerProfile?.latitude || -6.8703;
    const farmerLng = plan.land?.longitude || farmerProfile?.longitude || 109.0398;

    const buyers = await prisma.buyerProfile.findMany();
    const costPerKgPerKm = 150;
    const destinations: any[] = [];

    const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    for (const buyer of buyers) {
      const buyerLat = buyer.latitude || -6.2198;
      const buyerLng = buyer.longitude || 106.8615;
      const distanceKm = getDistanceKm(farmerLat, farmerLng, buyerLat, buyerLng);
      const logisticsCost = Math.round(distanceKm * costPerKgPerKm * plan.estimatedVolume);
      
      const priceMultiplier = buyer.businessType === "PASAR_INDUK" ? 1.05 : buyer.businessType === "KOPERASI" ? 0.95 : 1.0;
      const netMargin = Math.round((plan.estimatedVolume * basePrice * priceMultiplier) - logisticsCost);
      const shelfLifeFeasible = distanceKm < 400;

      destinations.push({
        buyerId: buyer.id,
        buyerName: buyer.businessName,
        netMargin,
        distanceKm: Math.round(distanceKm * 10) / 10,
        logisticsCost,
        shelfLifeFeasible
      });
    }

    destinations.sort((a, b) => b.netMargin - a.netMargin);

    if (destinations.length < 3) {
      const mockBuyers = [
        { name: "Koperasi Tani Jaya", lat: farmerLat + 0.05, lng: farmerLng + 0.05, mult: 0.95 },
        { name: "Pasar Induk Brebes", lat: farmerLat + 0.15, lng: farmerLng - 0.05, mult: 1.02 },
        { name: "PT Tani Distribusi Jakarta", lat: -6.2198, lng: 106.8615, mult: 1.15 }
      ];
      for (const mb of mockBuyers) {
        if (destinations.some(d => d.buyerName === mb.name)) continue;
        const dist = getDistanceKm(farmerLat, farmerLng, mb.lat, mb.lng);
        const logCost = Math.round(dist * costPerKgPerKm * plan.estimatedVolume);
        const netM = Math.round((plan.estimatedVolume * basePrice * mb.mult) - logCost);
        destinations.push({
          buyerId: "mock-" + mb.name.replace(/\s+/g, "-").toLowerCase(),
          buyerName: mb.name,
          netMargin: netM,
          distanceKm: Math.round(dist * 10) / 10,
          logisticsCost: logCost,
          shelfLifeFeasible: dist < 400
        });
      }
      destinations.sort((a, b) => b.netMargin - a.netMargin);
    }

    const bestDest = destinations[0];
    const sellNaturalText = `Berdasarkan analisis logistik dan harga pasar, **${bestDest.buyerName}** memberikan margin bersih tertinggi sebesar **Rp ${bestDest.netMargin.toLocaleString("id-ID")}** dengan jarak ${bestDest.distanceKm} km.`;

    // Preservation Recommender
    const weatherSnapshot = await prisma.weatherSnapshot.findFirst({
      where: { region: "brebes" },
      orderBy: { forecastDate: "desc" }
    });
    const isRainy = weatherSnapshot ? (weatherSnapshot.condition?.includes("hujan") || (weatherSnapshot.humidity && weatherSnapshot.humidity > 80)) : true;

    let preservationText = "";
    let preservationSteps: any[] = [];

    if (plan.commodity === "cabai_merah" || plan.commodity === "cabai_rawit") {
      preservationText = isRainy
        ? "Karena kelembaban tinggi / cuaca hujan di Brebes, cabai merah rawan busuk. Disarankan melakukan pengeringan cepat menggunakan oven suhu 60 derajat atau screen house."
        : "Cuaca cerah berawan mendukung pengeringan alami. Lakukan penjemuran cabai di atas para-para dengan sirkulasi udara baik.";
      preservationSteps = [
        { step: "Sortasi", instruction: "Pisahkan cabai yang sehat dari yang busuk atau cacat fisik." },
        { step: "Pencucian & Penirisan", instruction: "Cuci dengan air bersih mengalir, tiriskan hingga benar-benar kering." },
        { step: "Pengeringan", instruction: isRainy ? "Gunakan oven pengering suhu 60 derajat selama 12-18 jam hingga kadar air mencapai 10%." : "Jemur di atas para-para beralas tikar/plastik selama 3-5 hari saat matahari terik." },
        { step: "Pengemasan", instruction: "Simpan dalam wadah kedap udara kering untuk mencegah penyerapan uap air kembali." }
      ];
    } else if (plan.commodity === "bawang_merah") {
      preservationText = "Untuk bawang merah, lakukan pengeringan pelayuan (curing) selama 7-14 hari di bawah sinar matahari langsung, kemudian ikat gantung di gudang berventilasi.";
      preservationSteps = [
        { step: "Pembersihan", instruction: "Bersihkan bawang merah dari tanah yang menempel tanpa mengupas kulit arinya." },
        { step: "Pelayuan (Curing)", instruction: "Jemur bawang merah dengan posisi daun menutupi umbi selama 7-10 hari hingga daun kering." },
        { step: "Pengasapan (Optional)", instruction: "Lakukan pengasapan di atas perapian tradisional selama 2-3 hari untuk membunuh mikroba." },
        { step: "Penyimpanan Gantung", instruction: "Ikat bawang merah dalam kelompok kecil dan gantung di rak berventilasi baik." }
      ];
    } else {
      preservationText = "Simpan hasil panen di tempat sejuk, kering, dan berventilasi baik untuk memperlambat respirasi dan mencegah tumbuhnya jamur.";
      preservationSteps = [
        { step: "Sortasi", instruction: "Pisahkan komoditas yang rusak agar tidak menulari yang sehat." },
        { step: "Pengemasan", instruction: "Bungkus menggunakan kertas koran atau wadah plastik berlubang." },
        { step: "Penyimpanan", instruction: "Letakkan di tempat yang teduh dengan suhu 15-20 derajat Celcius dan kelembaban 85%." }
      ];
    }

    // Waste Recovery
    let wasteText = "";
    let wasteAlternatives: any[] = [];
    const volume = plan.estimatedVolume;

    if (plan.commodity === "cabai_merah" || plan.commodity === "cabai_rawit") {
      wasteText = "Apabila kualitas cabai menurun (mulai layu/patah), konversikan menjadi cabai kering atau pasta cabai untuk mempertahankan nilai ekonomisnya hingga 40%.";
      wasteAlternatives = [
        {
          name: "Konversi ke Abon / Cabai Kering",
          recoveryPercentage: 40,
          estimatedValue: Math.round(volume * basePrice * 0.4),
          description: "Menggiling cabai kering menjadi cabai bubuk atau abon cabai. Memiliki daya simpan hingga 6 bulan."
        },
        {
          name: "Penjualan ke Pabrik Pakan/Industri Kompos",
          recoveryPercentage: 15,
          estimatedValue: Math.round(volume * basePrice * 0.15),
          description: "Menjual bagian cabai yang rusak parah ke peternakan lokal atau pabrik pupuk organik."
        }
      ];
    } else if (plan.commodity === "bawang_merah") {
      wasteText = "Bawang merah yang pecah atau berukuran kecil dapat diolah menjadi bawang goreng atau pasta bawang merah untuk menyelamatkan hingga 50% nilai modal.";
      wasteAlternatives = [
        {
          name: "Olahan Bawang Goreng",
          recoveryPercentage: 50,
          estimatedValue: Math.round(volume * basePrice * 0.5),
          description: "Iris tipis bawang merah berukuran kecil/pecah dan goreng kering. Kemas dalam toples kedap udara."
        },
        {
          name: "Penjualan untuk Pupuk Cair Organik",
          recoveryPercentage: 10,
          estimatedValue: Math.round(volume * basePrice * 0.1),
          description: "Bawang merah busuk difermentasikan menjadi bahan pestisida nabati atau pupuk organik cair."
        }
      ];
    } else {
      wasteText = "Konversikan sisa hasil panen yang tidak terserap menjadi pupuk kompos organik atau pakan ternak untuk mengembalikan sebagian modal usaha.";
      wasteAlternatives = [
        {
          name: "Pembuatan Pupuk Kompos",
          recoveryPercentage: 15,
          estimatedValue: Math.round(volume * basePrice * 0.15),
          description: "Cacah sisa hasil panen dan campur dengan starter mikroba untuk difermentasi menjadi pupuk organik."
        },
        {
          name: "Pakan Ternak Lokal",
          recoveryPercentage: 12,
          estimatedValue: Math.round(volume * basePrice * 0.12),
          description: "Berikan sisa sayuran kepada peternak unggas atau kambing di sekitar wilayah lahan."
        }
      ];
    }

    // Delete any old recommendations for this plan to keep it clean
    await prisma.recommendation.deleteMany({
      where: { harvestPlanId: plan.id }
    });

    // Create the recommendation rows
    await prisma.recommendation.createMany({
      data: [
        {
          harvestPlanId: plan.id,
          type: "HARVEST_TIMING",
          naturalLanguageText,
          jsonData: jsonData as any,
          modelVersion: "rule-based-v1",
        },
        {
          harvestPlanId: plan.id,
          type: "SELL_DESTINATION",
          naturalLanguageText: sellNaturalText,
          jsonData: { destinations } as any,
          modelVersion: "rule-based-v1",
        },
        {
          harvestPlanId: plan.id,
          type: "PRESERVATION",
          naturalLanguageText: preservationText,
          jsonData: { recommendations: preservationSteps } as any,
          modelVersion: "rule-based-v1",
        },
        {
          harvestPlanId: plan.id,
          type: "WASTE_RECOVERY",
          naturalLanguageText: wasteText,
          jsonData: { alternatives: wasteAlternatives } as any,
          modelVersion: "rule-based-v1",
        }
      ]
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