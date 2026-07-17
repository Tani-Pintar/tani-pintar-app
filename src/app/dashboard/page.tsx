"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Leaf, Sprout, Briefcase, LogOut, CheckCircle, Smartphone } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; phoneNumber: string; role: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = sessionStorage.getItem("user_authenticated");
      const pendingData = sessionStorage.getItem("pending_register");
      
      if (auth === "true" && pendingData) {
        setUser(JSON.parse(pendingData));
      } else {
        router.push("/register");
      }
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.clear();
    }
    router.push("/register");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Top Navigation */}
      <header className="w-full max-w-lg mx-auto flex items-center justify-between pb-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/20">
            <Leaf className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">Tani Pintar</span>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Keluar"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Area (Mobile-First Card) */}
      <main className="flex-1 w-full max-w-lg mx-auto flex flex-col justify-center py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-card rounded-3xl p-6 shadow-xl border border-border/50 space-y-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              {user.role === "farmer" ? (
                <Sprout className="w-8 h-8" />
              ) : (
                <Briefcase className="w-8 h-8" />
              )}
            </div>
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                {user.role === "farmer" ? "Petani" : "Buyer B2B / Koperasi"}
              </span>
              <h2 className="text-xl font-bold mt-1 text-foreground">
                {user.fullName}
              </h2>
            </div>
          </div>

          <div className="space-y-3.5 pt-2">
            <div className="bg-background/80 p-4 rounded-2xl border border-border/50">
              <span className="text-xs text-muted-foreground block font-medium">Nomor Terverifikasi (WhatsApp)</span>
              <span className="font-semibold text-foreground mt-0.5 block flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-primary" />
                +62 {user.phoneNumber}
              </span>
            </div>

            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="font-bold text-sm text-foreground">Akun Berhasil Dibuat</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {user.role === "farmer"
                  ? "Selanjutnya: Buat Profil Lahan (FR-02) untuk memetakan koordinat lahan, luas, dan komoditas tanam Anda."
                  : "Selanjutnya: Isi Profil Pembeli (FR-09) dan buat Demand Listing (FR-10) untuk mencocokkan pasokan pangan dari petani."}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 rounded-2xl bg-secondary text-secondary-foreground hover:bg-secondary/80 font-semibold text-sm transition-all min-h-[44px]"
            >
              Ulangi Simulasi Registrasi
            </button>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-lg mx-auto text-center text-xs text-muted-foreground pt-4 border-t border-border/50">
        &copy; {new Date().getFullYear()} Tani Pintar. Semua Hak Dilindungi.
      </footer>
    </div>
  );
}
