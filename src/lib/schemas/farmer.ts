import { z } from "zod";

const latitude = z
  .number()
  .min(-90, { message: "Latitude minimal -90" })
  .max(90, { message: "Latitude maksimal 90" });

const longitude = z
  .number()
  .min(-180, { message: "Longitude minimal -180" })
  .max(180, { message: "Longitude maksimal 180" });

export const createFarmerProfileSchema = z.object({
  fullName: z
    .string()
    .min(3, { message: "Nama lengkap minimal 3 karakter" })
    .max(120),
  locationName: z.string().max(200).optional(),
  latitude: latitude.optional(),
  longitude: longitude.optional(),
  primaryCommodity: z.string().max(100).optional(),
  contactPhone: z
    .string()
    .min(9, { message: "Nomor HP minimal 9 digit" })
    .max(13, { message: "Nomor HP maksimal 13 digit" })
    .regex(/^[0-9]+$/, { message: "Nomor HP hanya boleh berisi angka" })
    .optional(),
});

export const updateFarmerProfileSchema = createFarmerProfileSchema.partial();

export type CreateFarmerProfileInput = z.infer<typeof createFarmerProfileSchema>;
export type UpdateFarmerProfileInput = z.infer<typeof updateFarmerProfileSchema>;

export const PLANTING_PHASES = [
  "PERSIAPAN_LAHAN",
  "PENANAMAN",
  "PEMELIHARAAN",
  "PANEN",
  "PASCA_PANEN",
] as const;

export const AREA_UNITS = ["hektar", "are", "meter_persegi"] as const;

export const createLandSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Nama lahan minimal 2 karakter" })
    .max(120),
  commodityType: z
    .string()
    .min(2, { message: "Jenis komoditas minimal 2 karakter" })
    .max(100),
  areaSize: z
    .number()
    .positive({ message: "Luas lahan harus lebih besar dari 0" }),
  areaUnit: z.enum(AREA_UNITS).default("hektar"),
  plantingPhase: z.enum(PLANTING_PHASES).default("PERSIAPAN_LAHAN"),
  latitude: latitude.optional(),
  longitude: longitude.optional(),
  address: z.string().max(500).optional(),
});

export const updateLandSchema = createLandSchema.partial();

export type CreateLandInput = z.infer<typeof createLandSchema>;
export type UpdateLandInput = z.infer<typeof updateLandSchema>;

export const listLandsQuerySchema = z.object({
  commodityType: z.string().max(100).optional(),
  plantingPhase: z.enum(PLANTING_PHASES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListLandsQuery = z.infer<typeof listLandsQuerySchema>;