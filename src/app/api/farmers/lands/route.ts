import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/session";
import {
  createLandSchema,
  listLandsQuerySchema,
  type ListLandsQuery,
} from "@/lib/schemas/farmer";
import {
  forbiddenRole,
  internalError,
  unauthorized,
  validationError,
} from "@/lib/api-error";

export async function GET(req: NextRequest) {
  const ctx = await requireSession();
  if (!ctx) return unauthorized();
  if (!requireRole(ctx, "PETANI")) return forbiddenRole();

  const url = new URL(req.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const parsed = listLandsQuerySchema.safeParse(params);
  if (!parsed.success) {
    return validationError("Query parameter tidak valid.", parsed.error.flatten());
  }

  const { page, pageSize, commodityType, plantingPhase } = parsed.data as ListLandsQuery;

  try {
    let farmerProfile = await prisma.farmerProfile.findUnique({
      where: { userId: ctx.userId },
      select: { id: true },
    });

    if (!farmerProfile) {
      const user = await prisma.user.findUnique({ where: { id: ctx.userId } });
      if (user && user.role === "PETANI") {
        farmerProfile = await prisma.farmerProfile.create({
          data: {
            userId: ctx.userId,
            fullName: user.fullName || "Petani",
            contactPhone: user.phoneNumber,
          },
          select: { id: true },
        });
      } else {
        return validationError(
          "Profil petani belum dibuat. Mohon lengkapi profil terlebih dahulu."
        );
      }
    }

    const where = {
      farmerProfileId: farmerProfile.id,
      ...(commodityType ? { commodityType } : {}),
      ...(plantingPhase ? { plantingPhase } : {}),
    };

    const [total, lands] = await Promise.all([
      prisma.land.count({ where }),
      prisma.land.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return Response.json(
      {
        data: lands,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize) || 0,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/farmers/lands]", err);
    return internalError();
  }
}

export async function POST(req: NextRequest) {
  const ctx = await requireSession();
  if (!ctx) return unauthorized();
  if (!requireRole(ctx, "PETANI")) return forbiddenRole();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return validationError("Body request bukan JSON valid.");
  }

  const parsed = createLandSchema.safeParse(body);
  if (!parsed.success) {
    return validationError("Payload tidak valid.", parsed.error.flatten());
  }

  try {
    let farmerProfile = await prisma.farmerProfile.findUnique({
      where: { userId: ctx.userId },
      select: { id: true },
    });

    if (!farmerProfile) {
      const user = await prisma.user.findUnique({ where: { id: ctx.userId } });
      if (user && user.role === "PETANI") {
        farmerProfile = await prisma.farmerProfile.create({
          data: {
            userId: ctx.userId,
            fullName: user.fullName || "Petani",
            contactPhone: user.phoneNumber,
          },
          select: { id: true },
        });
      } else {
        return validationError(
          "Profil petani belum dibuat. Mohon lengkapi profil terlebih dahulu."
        );
      }
    }

    const land = await prisma.land.create({
      data: {
        farmerProfileId: farmerProfile.id,
        name: parsed.data.name,
        commodityType: parsed.data.commodityType,
        areaSize: parsed.data.areaSize,
        areaUnit: parsed.data.areaUnit,
        plantingPhase: parsed.data.plantingPhase,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        address: parsed.data.address,
      },
    });

    return Response.json(land, { status: 201 });
  } catch (err) {
    console.error("[POST /api/farmers/lands]", err);
    return internalError();
  }
}