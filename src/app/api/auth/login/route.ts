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
});

export async function POST(req: NextRequest) {
    try {
        const json = await req.json();
        const parsed = bodySchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json({ success: false, message: "Nomor HP tidak valid" }, { status: 400 });
        }

        const phoneNumber = normalizePhoneNumber(parsed.data.phoneNumber);

        const user = await prisma.user.findUnique({ where: { phoneNumber } });
        if (!user) {
            return NextResponse.json(
                { success: false, message: "Nomor HP belum terdaftar" },
                { status: 404 }
            );
        }

        await assertOtpNotRateLimited(phoneNumber, "LOGIN");

        const otp = generateOtp();
        const codeHash = await hashOtp(otp);
        const expiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);

        await prisma.otpCode.create({
            data: { phoneNumber, codeHash, purpose: "LOGIN", expiresAt },
        });

        await sendOtpMessage(phoneNumber, otp);

        return NextResponse.json({
            success: true,
            message: "Kode OTP telah dikirim ke WhatsApp Anda",
            expiresInSeconds: env.otpExpiryMinutes * 60,
        });
    } catch (err) {
        if (err instanceof RateLimitError) {
            return NextResponse.json({ success: false, message: err.message }, { status: 429 });
        }
        console.error("login error:", err);
        return NextResponse.json(
            { success: false, message: "Terjadi kesalahan server" },
            { status: 500 }
        );
    }
}
