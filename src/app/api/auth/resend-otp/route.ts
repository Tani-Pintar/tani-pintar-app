import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";
import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber } from "@/lib/phone";
import { generateOtp, hashOtp } from "@/lib/otp";
import { sendOtpMessage } from "@/lib/sendMessage";
import { assertOtpNotRateLimited, RateLimitError } from "@/lib/rateLimit";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const bodySchema = z.object({
  phoneNumber: z.string().min(9).max(16),
  purpose: z.enum(["REGISTER", "LOGIN"]),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Data tidak valid" }, { status: 400 });
    }

    const phoneNumber = normalizePhoneNumber(parsed.data.phoneNumber);
    const { purpose } = parsed.data;

    await assertOtpNotRateLimited(phoneNumber, purpose);

    // For REGISTER, carry forward the fullName/role captured on the first request.
    const lastOtp = await prisma.otpCode.findFirst({
      where: { phoneNumber, purpose },
      orderBy: { createdAt: "desc" },
    });

    if (purpose === "REGISTER" && !lastOtp?.metadata) {
      return NextResponse.json(
        { success: false, message: "Sesi pendaftaran tidak ditemukan, silakan daftar ulang" },
        { status: 400 }
      );
    }

    const otp = generateOtp();
    const codeHash = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);

    await prisma.otpCode.create({
      data: {
        phoneNumber,
        codeHash,
        purpose,
        expiresAt,
        metadata: purpose === "REGISTER" ? lastOtp!.metadata! : undefined,
      },
    });

    await sendOtpMessage(phoneNumber, otp);

    return NextResponse.json({ success: true, message: "Kode OTP baru telah dikirim" });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ success: false, message: err.message }, { status: 429 });
    }
    console.error("resend-otp error:", err);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
