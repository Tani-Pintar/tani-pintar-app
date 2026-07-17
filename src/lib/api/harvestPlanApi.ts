import { HarvestPlan, Recommendation, Komoditas, VolumeUnit } from "@/types";

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

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.message || "Gagal memicu rekomendasi.");
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
