"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Leaf, Sprout, Briefcase, ArrowRight, Phone, User } from "lucide-react";

// Schema validasi menggunakan Zod
const registerSchema = z.object({
  fullName: z.string().min(3, { message: "Nama lengkap minimal 3 karakter" }),
  phoneNumber: z
    .string()
    .min(9, { message: "Nomor HP minimal 9 digit" })
    .max(13, { message: "Nomor HP maksimal 13 digit" })
    .regex(/^[0-9]+$/, { message: "Nomor HP hanya boleh berisi angka" }),
  role: z.enum(["farmer", "buyer"], {
    required_error: "Silakan pilih peran Anda",
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      role: "farmer",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterFormValues) => {
    // Simpan data pendaftaran sementara untuk verifikasi OTP
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pending_register", JSON.stringify(data));
    }
    
    // Simulasikan delay network
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Redirect ke halaman verifikasi OTP
    router.push("/verify-otp");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md text-center"
      >
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 mb-4">
          <Leaf className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-display font-extrabold text-foreground tracking-tight">
          Tani Pintar
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w">
          Keputusan Cerdas Hasil Panen Maksimal
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-card py-8 px-4 shadow-xl rounded-3xl border border-border/50 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Input Nama Lengkap */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-foreground/80 mb-1">
                Nama Lengkap
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Masukkan nama lengkap Anda"
                  {...register("fullName")}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-2xl bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all min-h-[44px] ${
                    errors.fullName ? "border-destructive focus:ring-destructive" : "border-border"
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Input Nomor HP */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-foreground/80 mb-1">
                Nomor WhatsApp (HP)
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <span className="text-sm font-semibold select-none mr-1">+62</span>
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Contoh: 8123456789"
                  {...register("phoneNumber")}
                  className={`block w-full pl-16 pr-3 py-3 border rounded-2xl bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all min-h-[44px] ${
                    errors.phoneNumber ? "border-destructive focus:ring-destructive" : "border-border"
                  }`}
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Masukkan nomor tanpa angka 0 di depan (misal: 812345678).
              </p>
              {errors.phoneNumber && (
                <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            {/* Pilihan Peran (Role Selector - Mobile-First Card Style) */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Pilih Peran Anda
              </label>
              <div className="grid grid-cols-1 gap-3">
                {/* Peran Petani */}
                <button
                  type="button"
                  onClick={() => setValue("role", "farmer")}
                  className={`flex items-start p-4 border-2 rounded-2xl text-left transition-all min-h-[44px] focus:outline-none ${
                    selectedRole === "farmer"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-foreground/70 hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5 mr-3">
                    <div className={`p-2 rounded-xl ${selectedRole === "farmer" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <Sprout className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Petani</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ingin memantau harga pasar, mengoptimalkan waktu panen, dan mencari pembeli terbaik.
                    </p>
                  </div>
                </button>

                {/* Peran Buyer */}
                <button
                  type="button"
                  onClick={() => setValue("role", "buyer")}
                  className={`flex items-start p-4 border-2 rounded-2xl text-left transition-all min-h-[44px] focus:outline-none ${
                    selectedRole === "buyer"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-foreground/70 hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5 mr-3">
                    <div className={`p-2 rounded-xl ${selectedRole === "buyer" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <Briefcase className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Pembeli (Buyer B2B)</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ingin memposting kebutuhan komoditas dan mencari kecocokan pasokan langsung dari petani.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Tombol Submit */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all min-h-[44px]"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
              ) : (
                <>
                  Daftar & Kirim OTP
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
