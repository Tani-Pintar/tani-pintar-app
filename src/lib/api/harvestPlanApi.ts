import { HarvestPlan, Recommendation, Komoditas, VolumeUnit } from "@/types";
import { STORAGE_KEYS } from "@/data/constants";

export const harvestPlanApi = {
  // 1. Create Harvest Plan
  createHarvestPlan: async (planData: { landId?: string | null; commodity: Komoditas | string; estimatedVolume: number; volumeUnit: VolumeUnit; readyToHarvestDate: string; notes?: string }): Promise<HarvestPlan> => {
    const payload = {
      landId: planData.landId || undefined,
      commodity: planData.commodity,
      estimatedVolume: planData.estimatedVolume,
      volumeUnit: planData.volumeUnit,
      readyToHarvestDate: planData.readyToHarvestDate,
      notes: planData.notes || undefined,
    };

    const res = await fetch("/api/harvest-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.message || "Gagal membuat rencana panen.");
    }

    const plan = await res.json();
    return {
      ...plan,
      readyToHarvestDate: new Date(plan.readyToHarvestDate).toISOString().split("T")[0],
    };
  },

  // 2. Trigger Recommendations
  triggerRecommendations: async (harvestPlanId: string): Promise<{ jobId: string; status: string; estimatedCompletionAt: string }> => {
    const res = await fetch(`/api/harvest-plans/${harvestPlanId}/trigger-recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force: true }),
    });

    if (typeof window !== "undefined") {
      setTimeout(() => {
        const plansStr = localStorage.getItem(STORAGE_KEYS.HARVEST_PLANS);
        const allPlans: HarvestPlan[] = plansStr ? JSON.parse(plansStr) : [];
        const plan = allPlans.find(p => p.id === harvestPlanId);

        if (plan) {
          const prices: Record<string, number> = {
            cabai_merah: 32000,
            cabai_rawit: 48000,
            tomat: 12000,
            bawang_merah: 35000,
            kentang: 16000,
            kubis: 6000
          };
          const basePrice = prices[plan.commodity] || 20000;
          let currentPrice = basePrice;
          const trend = Array.from({ length: 14 }).map((_, i) => {
            const date = new Date(plan.readyToHarvestDate);
            date.setDate(date.getDate() + i);
            const fluctuation = (Math.random() - 0.5) * 1500;
            currentPrice = Math.round(currentPrice + fluctuation);
            return {
              date: date.toISOString().split("T")[0],
              price: currentPrice
            };
          });

          const isOversupply = Math.random() > 0.5; // 50% chance for demo
          const optimalDate = new Date(plan.readyToHarvestDate);
          if (isOversupply) optimalDate.setDate(optimalDate.getDate() + 5);

          const newRec: Recommendation = {
            id: "rec-ht-" + Math.random().toString(36).substring(2, 9),
            harvestPlanId: plan.id,
            type: "HARVEST_TIMING",
            jsonData: {
              projectedPrice: trend[isOversupply ? 5 : 0]?.price || basePrice,
              projectedPriceDate: optimalDate.toISOString().split("T")[0],
              oversupplyStatus: isOversupply ? "OVERSUPPLY" : "AMAN",
              suggestedHarvestDate: optimalDate.toISOString().split("T")[0],
              confidence: 0.85,
              projectedPriceTrend: trend
            },
            naturalLanguageText: isOversupply
              ? `Terdeteksi potensi oversupply di minggu ini. Disarankan untuk menunda panen hingga ${optimalDate.toLocaleDateString("id-ID")} untuk menghindari harga anjlok.`
              : `Kondisi pasar aman. Anda dapat memanen sesuai jadwal pada ${optimalDate.toLocaleDateString("id-ID")} dengan estimasi harga yang baik.`,
            modelVersion: "rule-based-v1",
            isRead: false,
            createdAt: new Date().toISOString()
          };

          // Generate Sell Destination recommendation matching FR-05
          const costPerKgPerKm = 150; // flat rate Rp 150 per kg per km
          const destinations = [
            {
              buyerId: "buyer-1",
              buyerName: "Pasar Induk Brebes",
              netMargin: Math.round((plan.estimatedVolume * basePrice * 0.97) - (15.4 * costPerKgPerKm * plan.estimatedVolume)),
              distanceKm: 15.4,
              logisticsCost: Math.round(15.4 * costPerKgPerKm * plan.estimatedVolume),
              shelfLifeFeasible: true
            },
            {
              buyerId: "buyer-2",
              buyerName: "Koperasi Tani Jaya",
              netMargin: Math.round((plan.estimatedVolume * basePrice * 0.92) - (5.2 * costPerKgPerKm * plan.estimatedVolume)),
              distanceKm: 5.2,
              logisticsCost: Math.round(5.2 * costPerKgPerKm * plan.estimatedVolume),
              shelfLifeFeasible: true
            },
            {
              buyerId: "buyer-3",
              buyerName: "PT Tani Distribusi Jakarta",
              netMargin: Math.round((plan.estimatedVolume * basePrice * 1.15) - (312.8 * costPerKgPerKm * plan.estimatedVolume)),
              distanceKm: 312.8,
              logisticsCost: Math.round(312.8 * costPerKgPerKm * plan.estimatedVolume),
              shelfLifeFeasible: plan.commodity !== "tomat" && plan.commodity !== "cabai_merah" && plan.commodity !== "cabai_rawit"
            }
          ].sort((a, b) => b.netMargin - a.netMargin);

          const newSellRec: Recommendation = {
            id: "rec-sd-" + Math.random().toString(36).substring(2, 9),
            harvestPlanId: plan.id,
            type: "SELL_DESTINATION",
            jsonData: {
              destinations: destinations
            },
            naturalLanguageText: `Berdasarkan analisis logistik dan harga pasar, **${destinations[0].buyerName}** memberikan margin bersih tertinggi sebesar **Rp ${destinations[0].netMargin.toLocaleString("id-ID")}** dengan jarak ${destinations[0].distanceKm} km.`,
            modelVersion: "rule-based-v1",
            isRead: false,
            createdAt: new Date().toISOString()
          };

          const recsStr = localStorage.getItem(STORAGE_KEYS.RECOMMENDATIONS);
          const allRecs: Recommendation[] = recsStr ? JSON.parse(recsStr) : [];
          allRecs.push(newRec);
          allRecs.push(newSellRec);
          localStorage.setItem(STORAGE_KEYS.RECOMMENDATIONS, JSON.stringify(allRecs));
        }
      }, 2000); // 2 second delay
    }

    return res.json();
  },

  // 3. Get Recommendations by Plan ID
  getRecommendationsByPlanId: async (harvestPlanId: string, type?: string): Promise<{ data: Recommendation[] }> => {
    try {
      let url = `/api/recommendations?harvestPlanId=${harvestPlanId}`;
      if (type) {
        url += `&type=${type}`;
      }
      const res = await fetch(url);
      if (!res.ok) return { data: [] };
      const json = await res.json();
      return { data: json.data || [] };
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      return { data: [] };
    }
  },

  // 4. Get Harvest Plans for the current user
  getHarvestPlans: async (landId?: string): Promise<{ data: HarvestPlan[] }> => {
    try {
      const res = await fetch("/api/harvest-plans?pageSize=100");
      if (!res.ok) return { data: [] };
      const json = await res.json();
      let list: HarvestPlan[] = (json.data || []).map((plan: any) => ({
        ...plan,
        readyToHarvestDate: new Date(plan.readyToHarvestDate).toISOString().split("T")[0],
      }));

      if (landId) {
        list = list.filter((p) => p.landId === landId);
      }

      return { data: list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) };
    } catch (err) {
      console.error("Failed to fetch harvest plans:", err);
      return { data: [] };
    }
  }
};
