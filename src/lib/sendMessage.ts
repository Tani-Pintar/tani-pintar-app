import { randomUUID } from "crypto";
import { env } from "./env";
import { toE164 } from "./phone";

/**
 * Sends the OTP code to the user's WhatsApp/phone number via the local
 * messaging API: POST http://localhost:3111/api/send-message
 * Body shape: { id, phoneNumber, text }
 */
export async function sendOtpMessage(phoneCore: string, otp: string): Promise<void> {
  const text = `Kode verifikasi Tani Pintar Anda: ${otp}. Jangan bagikan kode ini kepada siapa pun. Berlaku ${env.otpExpiryMinutes} menit.`;

  // Always log OTP to server console in development so developers can see it
  console.log(`\n==================================================`);
  console.log(`[WA BOT SIMULATION] Target: ${phoneCore}`);
  console.log(`[WA BOT SIMULATION] Kode OTP: ${otp}`);
  console.log(`==================================================\n`);

  try {
    const res = await fetch("https://botgh7.expiproject.com/api/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: randomUUID(),
        to: toE164(phoneCore),
        text,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`[WA Bot Warning] Gagal mengirim OTP (status ${res.status}): ${body}`);
      if (process.env.NODE_ENV === "production") {
        throw new Error(`Gagal mengirim OTP (status ${res.status}): ${body}`);
      }
    }
  } catch (err: any) {
    console.error(`[WA Bot Error] Gagal menghubungi gateway: ${err?.message || err}`);
    if (process.env.NODE_ENV === "production") {
      throw err;
    }
  }
}
