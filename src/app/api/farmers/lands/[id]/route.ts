import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/session";
import { updateLandSchema } from "@/lib/schemas/farmer";
import {
  forbiddenOwnership,
  forbiddenRole,
  internalError,
  notFound,
  unauthorized,
  validationError,
} from "@/lib/api-error";

async function getOwnedLand(landId: string, userId: string) {
  let farmerProfile = await prisma.farmerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!farmerProfile) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && user.role === "PETANI") {
      farmerProfile = await prisma.farmerProfile.create({
        data: {
          userId: userId,
          fullName: user.fullName || "Petani",
          contactPhone: user.phoneNumber,
        },
        select: { id: true },
      });
    } else {
      return { error: "NO_PROFILE" as const };
    }
  }

  const land = await prisma.land.findUnique({
    where: { id: landId },
  });

  if (!land) {
    return { error: "NOT_FOUND" as const };
  }

  if (land.farmerProfileId !== farmerProfile.id) {
    return { error: "FORBIDDEN" as const };
  }

  return { land, farmerProfileId: farmerProfile.id };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireSession();
  if (!ctx) return unauthorized();
  if (!requireRole(ctx, "PETANI")) return forbiddenRole();

  const { id } = await params;

  try {
    const result = await getOwnedLand(id, ctx.userId);

    if ("error" in result) {
      if (result.error === "NOT_FOUND") return notFound("Lahan tidak ditemukan.");
      if (result.error === "FORBIDDEN") return forbiddenOwnership();
      return validationError(
        "Profil petani belum dibuat. Mohon lengkapi profil terlebih dahulu."
      );
    }

    return Response.json(result.land, { status: 200 });
  } catch (err) {
    console.error("[GET /api/farmers/lands/:id]", err);
    return internalError();
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireSession();
  if (!ctx) return unauthorized();
  if (!requireRole(ctx, "PETANI")) return forbiddenRole();

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return validationError("Body request bukan JSON valid.");
  }

  const parsed = updateLandSchema.safeParse(body);
  if (!parsed.success) {
    return validationError("Payload tidak valid.", parsed.error.flatten());
  }

  try {
    const result = await getOwnedLand(id, ctx.userId);

    if ("error" in result) {
      if (result.error === "NOT_FOUND") return notFound("Lahan tidak ditemukan.");
      if (result.error === "FORBIDDEN") return forbiddenOwnership();
      return validationError(
        "Profil petani belum dibuat. Mohon lengkapi profil terlebih dahulu."
      );
    }

    const updated = await prisma.land.update({
      where: { id },
      data: parsed.data,
    });

    return Response.json(updated, { status: 200 });
  } catch (err) {
    console.error("[PATCH /api/farmers/lands/:id]", err);
    return internalError();
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireSession();
  if (!ctx) return unauthorized();
  if (!requireRole(ctx, "PETANI")) return forbiddenRole();

  const { id } = await params;

  try {
    const result = await getOwnedLand(id, ctx.userId);

    if ("error" in result) {
      if (result.error === "NOT_FOUND") return notFound("Lahan tidak ditemukan.");
      if (result.error === "FORBIDDEN") return forbiddenOwnership();
      return validationError(
        "Profil petani belum dibuat. Mohon lengkapi profil terlebih dahulu."
      );
    }

    await prisma.land.delete({ where: { id } });

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/farmers/lands/:id]", err);
    return internalError();
  }
}