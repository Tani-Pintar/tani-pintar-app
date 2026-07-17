import { z } from "zod";

const latitude = z
  .number()
  .min(-90, { message: "Latitude minimal -90" })
  .max(90, { message: "Latitude maksimal 90" });

const longitude = z
  .number()
  .min(-180, { message: "Longitude minimal -180" })
  .max(180, { message: "Longitude maksimal 180" });

export const BUSINESS_TYPES = [
  "PASAR_INDUK",
  "KOPERASI",
  "RESTORAN",
  "PABRIK_OLAHAN",
  "LAINNYA",
] as const;

const contactPhone = z
  .string()
  .min(9, { message: "Nomor HP minimal 9 digit" })
  .max(13, { message: "Nomor HP maksimal 13 digit" })
  .regex(/^[0-9]+$/, { message: "Nomor HP hanya boleh berisi angka" })
  .optional();

export const createBuyerProfileSchema = z.object({
  businessName: z
    .string()
    .min(3, { message: "Nama usaha minimal 3 karakter" })
    .max(150),
  businessType: z.enum(BUSINESS_TYPES).default("LAINNYA"),
  locationName: z.string().max(200).optional(),
  latitude: latitude.optional(),
  longitude: longitude.optional(),
  capacityAbsorption: z
    .number()
    .positive({ message: "Kapasitas serap harus lebih besar dari 0" })
    .optional(),
  capacityUnit: z.string().max(20).optional(),
  contactPhone,
});

export const updateBuyerProfileSchema = createBuyerProfileSchema.partial();

export type CreateBuyerProfileInput = z.infer<typeof createBuyerProfileSchema>;
export type UpdateBuyerProfileInput = z.infer<typeof updateBuyerProfileSchema>;

export const searchBuyersQuerySchema = z.object({
  businessType: z.enum(BUSINESS_TYPES).optional(),
  commodity: z.string().max(100).optional(),
  q: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type SearchBuyersQuery = z.infer<typeof searchBuyersQuerySchema>;