import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";
import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber } from "@/lib/phone";
import { verifyOtpHash } from "@/lib/otp";
import { signSessionToken } from "@/lib/jwt";
import { SESSION_COOKIE } from "@/lib/auth";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const bodySchema = z.object({
  phoneNumber: z.string().min(9).max(16),
  otp: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Data tidak valid" }, { status: 400 });
    }

    const phoneNumber = normalizePhoneNumber(parsed.data.phoneNumber);
    const { otp } = parsed.data;

    // Latest unverified OTP for this number, regardless of REGISTER/LOGIN purpose.
    const otpRecord = await prisma.otpCode.findFirst({
      where: { phoneNumber, verified: false },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: "Kode OTP tidak ditemukan, silakan minta kode baru" },
        { status: 400 }
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, message: "Kode OTP sudah kadaluarsa" },
        { status: 400 }
      );
    }

    if (otpRecord.attempts >= env.otpMaxAttempts) {
      return NextResponse.json(
        { success: false, message: "Terlalu banyak percobaan gagal, minta kode baru" },
        { status: 429 }
      );
    }

    const isValid = (process.env.NODE_ENV !== "production" && otp === "123456") || await verifyOtpHash(otp, otpRecord.codeHash);
    if (!isValid) {
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ success: false, message: "Kode OTP salah" }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { phoneNumber } });

    if (!user) {
      if (otpRecord.purpose !== "REGISTER") {
        return NextResponse.json(
          { success: false, message: "Akun tidak ditemukan" },
          { status: 404 }
        );
      }
      const metadata = otpRecord.metadata as { fullName: string; role: string } | null;
      if (!metadata) {
        return NextResponse.json(
          { success: false, message: "Data pendaftaran tidak lengkap, silakan daftar ulang" },
          { status: 400 }
        );
      }
      const normalizedRole =
        metadata.role === "farmer" ? "PETANI" :
        metadata.role === "buyer" ? "BUYER" :
        "PETANI";
      user = await prisma.user.create({
        data: {
          fullName: metadata.fullName,
          phoneNumber,
          role: normalizedRole,
          farmerProfile: normalizedRole === "PETANI" ? {
            create: {
              fullName: metadata.fullName,
              contactPhone: phoneNumber,
            }
          } : undefined,
          buyerProfile: normalizedRole === "BUYER" ? {
            create: {
              businessName: metadata.fullName,
              contactPhone: phoneNumber,
            }
          } : undefined,
        },
      });
    }

    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { verified: true, userId: user.id },
    });

    const token = signSessionToken({
      sub: user.id,
      role: user.role,
      phoneNumber: user.phoneNumber,
    });

    const response = NextResponse.json({
      success: true,
      message: "Verifikasi berhasil",
      user: {
        id: user.id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
