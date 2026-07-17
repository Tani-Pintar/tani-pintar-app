import { LahanProfile, Komoditas, FaseTanam } from "@/types";

const mapBackendPhaseToFrontend = (phase: string): FaseTanam => {
  switch (phase) {
    case "PERSIAPAN_LAHAN": return "persiapan";
    case "PENANAMAN": return "awal_tanam";
    case "PEMELIHARAAN": return "vegetatif";
    case "PANEN": return "siap_panen";
    case "PASCA_PANEN": return "siap_panen";
    default: return "persiapan";
  }
};

const mapFrontendPhaseToBackend = (phase: FaseTanam): string => {
  switch (phase) {
    case "persiapan": return "PERSIAPAN_LAHAN";
    case "awal_tanam": return "PENANAMAN";
    case "vegetatif": return "PEMELIHARAAN";
    case "generatif": return "PEMELIHARAAN";
    case "siap_panen": return "PANEN";
    default: return "PERSIAPAN_LAHAN";
  }
};

export const mapLandToLahanProfile = (land: any): LahanProfile => {
  return {
    id: land.id,
    userId: land.farmerProfileId,
    namaLahan: land.name,
    luasLahan: land.areaSize,
    komoditas: land.commodityType as Komoditas,
    faseTanam: mapBackendPhaseToFrontend(land.plantingPhase),
    koordinat: {
      lat: land.latitude || 0,
      lng: land.longitude || 0,
    },
    alamat: land.address || "",
    tanggalTanam: land.createdAt,
    createdAt: land.createdAt,
  };
};

export const getLandList = async (): Promise<LahanProfile[]> => {
  try {
    const res = await fetch("/api/farmers/lands");
    if (!res.ok) return [];
    const json = await res.json();
    if (json && json.data) {
      return json.data.map(mapLandToLahanProfile);
    }
    return [];
  } catch (err) {
    console.error("Failed to fetch land list:", err);
    return [];
  }
};

export const getLandById = async (id: string): Promise<LahanProfile | null> => {
  try {
    const res = await fetch(`/api/farmers/lands/${id}`);
    if (!res.ok) return null;
    const json = await res.json();
    return mapLandToLahanProfile(json);
  } catch (err) {
    console.error(`Failed to fetch land ${id}:`, err);
    return null;
  }
};

export const createLand = async (landData: Omit<LahanProfile, "id" | "userId" | "createdAt">): Promise<LahanProfile> => {
  const payload = {
    name: landData.namaLahan,
    commodityType: landData.komoditas,
    areaSize: landData.luasLahan,
    areaUnit: "hektar",
    plantingPhase: mapFrontendPhaseToBackend(landData.faseTanam),
    latitude: landData.koordinat.lat,
    longitude: landData.koordinat.lng,
    address: landData.alamat,
  };

  const res = await fetch("/api/farmers/lands", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || "Gagal membuat lahan baru.");
  }

  const json = await res.json();
  return mapLandToLahanProfile(json);
};

export const updateLand = async (id: string, updateData: Partial<Omit<LahanProfile, "id" | "userId" | "createdAt">>): Promise<LahanProfile> => {
  const payload: any = {};
  if (updateData.namaLahan !== undefined) payload.name = updateData.namaLahan;
  if (updateData.komoditas !== undefined) payload.commodityType = updateData.komoditas;
  if (updateData.luasLahan !== undefined) payload.areaSize = updateData.luasLahan;
  if (updateData.faseTanam !== undefined) payload.plantingPhase = mapFrontendPhaseToBackend(updateData.faseTanam);
  if (updateData.koordinat?.lat !== undefined) payload.latitude = updateData.koordinat.lat;
  if (updateData.koordinat?.lng !== undefined) payload.longitude = updateData.koordinat.lng;
  if (updateData.alamat !== undefined) payload.address = updateData.alamat;

  const res = await fetch(`/api/farmers/lands/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || "Gagal memperbarui data lahan.");
  }

  const json = await res.json();
  return mapLandToLahanProfile(json);
};

export const deleteLand = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch(`/api/farmers/lands/${id}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (err) {
    console.error(`Failed to delete land ${id}:`, err);
    return false;
  }
};
