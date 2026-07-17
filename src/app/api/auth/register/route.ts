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
    fullName: z.string().min(3, "Nama lengkap minimal 3 karakter"),
    phoneNumber: z.string().min(9).max(16),
    role: z.enum(["farmer", "buyer"]),
});

export async function POST(req: NextRequest) {
    try {
        const json = await req.json();
        const parsed = bodySchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, message: "Data tidak valid", errors: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { fullName, role } = parsed.data;
        const phoneNumber = normalizePhoneNumber(parsed.data.phoneNumber);

        const existingUser = await prisma.user.findUnique({ where: { phoneNumber } });
        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "Nomor HP sudah terdaftar. Silakan masuk." },
                { status: 409 }
            );
        }

        await assertOtpNotRateLimited(phoneNumber, "REGISTER");

        const otp = generateOtp();
        const codeHash = await hashOtp(otp);
        const expiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);

        await prisma.otpCode.create({
            data: {
                phoneNumber,
                codeHash,
                purpose: "REGISTER",
                expiresAt,
                metadata: { fullName, role },
            },
        });

        await sendOtpMessage(phoneNumber, otp);

        return NextResponse.json({
            success: true,
            message: "Kode OTP telah dikirim ke WhatsApp Anda",
            phoneNumber,
            expiresInSeconds: env.otpExpiryMinutes * 60,
        });
    } catch (err) {
        if (err instanceof RateLimitError) {
            return NextResponse.json({ success: false, message: err.message }, { status: 429 });
        }
        console.error("register error:", err);
        return NextResponse.json(
            { success: false, message: "Terjadi kesalahan server" },
            { status: 500 }
        );
    }
}
