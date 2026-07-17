import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/session";
import {
  forbiddenRole,
  internalError,
  notFound,
  unauthorized,
  validationError,
} from "@/lib/api-error";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireSession();
  if (!ctx) return unauthorized();
  if (!requireRole(ctx, "ADMIN")) return forbiddenRole();

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        isPhoneVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        farmerProfile: true,
        buyerProfile: true,
      },
    });

    if (!user) {
      return notFound("Pengguna tidak ditemukan.");
    }

    return Response.json(user, { status: 200 });
  } catch (err) {
    console.error("[GET /api/admin/users/[id]]", err);
    return internalError();
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireSession();
  if (!ctx) return unauthorized();
  if (!requireRole(ctx, "ADMIN")) return forbiddenRole();

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      return notFound("Pengguna tidak ditemukan.");
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return validationError("Body request bukan JSON valid.");
    }

    const payload = body as Record<string, unknown>;
    const data: Prisma.UserUpdateInput = {};

    if (typeof payload.isActive === "boolean") data.isActive = payload.isActive;
    if (typeof payload.isPhoneVerified === "boolean") data.isPhoneVerified = payload.isPhoneVerified;

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        isPhoneVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json(updated, { status: 200 });
  } catch (err) {
    console.error("[PATCH /api/admin/users/[id]]", err);
    return internalError();
  }
}
