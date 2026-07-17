import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/session";
import { forbiddenRole, internalError, unauthorized } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  const ctx = await requireSession();
  if (!ctx) return unauthorized();
  if (!requireRole(ctx, "ADMIN")) return forbiddenRole();

  const url = new URL(req.url);
  const role = url.searchParams.get("role");
  const isActive = url.searchParams.get("isActive");
  const isPhoneVerified = url.searchParams.get("isPhoneVerified");
  const q = url.searchParams.get("q");
  const page = parseInt(url.searchParams.get("page") ?? "1", 10) || 1;
  const pageSize = parseInt(url.searchParams.get("pageSize") ?? "20", 10) || 20;

  try {
    const where: Prisma.UserWhereInput = {};

    if (role) where.role = role as Prisma.EnumUserRoleFilter["equals"];
    if (isActive !== null && isActive !== "") where.isActive = isActive === "true";
    if (isPhoneVerified !== null && isPhoneVerified !== "") where.isPhoneVerified = isPhoneVerified === "true";

    if (q) {
      where.OR = [
        { phoneNumber: { contains: q } },
        { fullName: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
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
      }),
    ]);

    return Response.json(
      {
        data,
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
    console.error("[GET /api/admin/users]", err);
    return internalError();
  }
}
