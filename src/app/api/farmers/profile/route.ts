import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/session";
import {
  createFarmerProfileSchema,
  updateFarmerProfileSchema,
} from "@/lib/schemas/farmer";
import {
  apiError,
  conflict,
  forbiddenRole,
  internalError,
  notFound,
  unauthorized,
  validationError,
} from "@/lib/api-error";

export async function GET() {
  const ctx = await requireSession();
  if (!ctx) return unauthorized();
  if (!requireRole(ctx, "PETANI")) return forbiddenRole();

  try {
    const profile = await prisma.farmerProfile.findUnique({
      where: { userId: ctx.userId },
    });

    if (!profile) {
      return notFound("Profil petani belum dibuat.");
    }

    return Response.json(profile, { status: 200 });
  } catch (err) {
    console.error("[GET /api/farmers/profile]", err);
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

  const parsed = createFarmerProfileSchema.safeParse(body);
  if (!parsed.success) {
    return validationError("Payload tidak valid.", parsed.error.flatten());
  }

  try {
    const profile = await prisma.farmerProfile.create({
      data: {
        userId: ctx.userId,
        fullName: parsed.data.fullName,
        locationName: parsed.data.locationName,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        primaryCommodity: parsed.data.primaryCommodity,
        contactPhone: parsed.data.contactPhone,
      },
    });

    return Response.json(profile, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return conflict(
          "Profil petani untuk akun ini sudah ada. Gunakan PATCH untuk memperbarui."
        );
      }
    }
    console.error("[POST /api/farmers/profile]", err);
    return internalError();
  }
}

export async function PATCH(req: NextRequest) {
  const ctx = await requireSession();
  if (!ctx) return unauthorized();
  if (!requireRole(ctx, "PETANI")) return forbiddenRole();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return validationError("Body request bukan JSON valid.");
  }

  const parsed = updateFarmerProfileSchema.safeParse(body);
  if (!parsed.success) {
    return validationError("Payload tidak valid.", parsed.error.flatten());
  }

  try {
    const existing = await prisma.farmerProfile.findUnique({
      where: { userId: ctx.userId },
      select: { id: true },
    });

    if (!existing) {
      return notFound("Profil petani belum dibuat.");
    }

    const updated = await prisma.farmerProfile.update({
      where: { userId: ctx.userId },
      data: parsed.data,
    });

    return Response.json(updated, { status: 200 });
  } catch (err) {
    console.error("[PATCH /api/farmers/profile]", err);
    return internalError();
  }
}