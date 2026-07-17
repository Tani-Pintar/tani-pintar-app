"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Activity,
  Award,
  TrendingUp,
  MapPin,
  Leaf,
  ChevronDown,
  ChevronUp,
  Clock,
  Briefcase,
  AlertTriangle,
  Scale
} from "lucide-react";
import * as authApi from "@/lib/api/authApi";
import { UserProfile } from "@/types";
import { COMMODITY_LIST } from "@/lib/api/metadataApi";

interface RecommendationLog {
  id: string;
  harvestPlanId: string;
  type: "HARVEST_TIMING" | "SELL_DESTINATION" | "PRESERVATION" | "WASTE_RECOVERY";
  jsonData: any;
  naturalLanguageText: string;
  createdAt: string;
  harvestPlan: {
    id: string;
    commodity: string;
    estimatedVolume: number;
    volumeUnit: string;
    readyToHarvestDate: string;
    status: string;
  };
}

export default function RiwayatPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<RecommendationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Summary Metrics
  const [totalRecs, setTotalRecs] = useState(0);
  const [estimatedValue, setEstimatedValue] = useState(0);
  const [savedValue, setSavedValue] = useState(0);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      let currentUser = authApi.getCurrentUser();

      if (!currentUser) {
        try {
          const res = await authApi.getMe();
          if (res.success && res.user) {
            authApi.saveCurrentUser(res.user);
            currentUser = res.user;
          }
        } catch (err) {
          console.error("Failed to fetch session:", err);
        }
      }

      if (currentUser) {
        if (currentUser.role !== "farmer") {
          router.push("/buyer/dashboard");
          return;
        }
        setUser(currentUser);
        await loadHistory();
      } else {
        router.push("/register");
      }
    };

    checkAuthAndLoad();
  }, [router]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/recommendations/history?pageSize=50");
      if (res.ok) {
        const json = await res.json();
        const data: RecommendationLog[] = json.data || [];
        setLogs(data);
        setTotalRecs(data.length);

        // Calculate summary estimates based on timing or destination data
        let totalVal = 0;
        let totalSaved = 0;

        data.forEach((log) => {
          if (log.type === "HARVEST_TIMING") {
            const vol = log.harvestPlan?.estimatedVolume || 0;
            const price = log.jsonData?.projectedPrice || 20000;
            totalVal += vol * price;
          } else if (log.type === "WASTE_RECOVERY") {
            const alts = log.jsonData?.alternatives || [];
            if (alts.length > 0) {
              totalSaved += alts[0].estimatedValue || 0;
            }
          }
        });

        setEstimatedValue(totalVal);
        setSavedValue(totalSaved);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat rekomendasi:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "HARVEST_TIMING":
        return { label: "Harvest Timing", color: "bg-blue-500/10 text-blue-600 border-blue-500/10" };
      case "SELL_DESTINATION":
        return { label: "Sell Destination", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/10" };
      case "PRESERVATION":
        return { label: "Preservation Guide", color: "bg-amber-500/10 text-amber-600 border-amber-500/10" };
      case "WASTE_RECOVERY":
        return { label: "Waste Recovery", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/10" };
      default:
        return { label: type, color: "bg-muted text-muted-foreground" };
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Header */}
      <header className="w-full bg-card/85 backdrop-blur-md sticky top-0 border-b border-border/50 px-4 py-3 z-[100]">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push("/farmer/dashboard")}
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-display font-bold text-base tracking-tight text-foreground">
            Riwayat & Analitik Pribadi
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header Greeting */}
        <div className="space-y-1">
          <h2 className="text-xl font-black tracking-tight">Performa Keputusan Anda 📈</h2>
          <p className="text-xs text-muted-foreground">
            Rekam jejak rekomendasi panen dan estimasi nilai ekonomi yang terselamatkan.
          </p>
        </div>

        {/* Analytics Card Row */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-card border border-border p-3 rounded-2xl text-center space-y-1 shadow-sm">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Total Rek.</span>
            <div className="text-lg font-black text-foreground">{totalRecs}</div>
          </div>
          <div className="bg-card border border-border p-3 rounded-2xl text-center space-y-1 shadow-sm col-span-2">
            <span className="text-[9px] uppercase tracking-wider text-primary font-bold">Potensi Hasil Panen</span>
            <div className="text-sm font-black text-primary">
              Rp {estimatedValue.toLocaleString("id-ID")}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-4 rounded-3xl space-y-2 text-emerald-950 dark:text-emerald-300 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              Nilai Terselamatkan (Waste Recovery)
            </span>
            <span className="text-xs font-black bg-emerald-500/20 px-2 py-0.5 rounded-full">
              F5 Saving
            </span>
          </div>
          <div className="text-xl font-black">
            Rp {savedValue.toLocaleString("id-ID")}
          </div>
          <p className="text-[10px] leading-relaxed text-emerald-800 dark:text-emerald-400">
            Estimasi nilai jual yang berhasil dipertahankan dengan konversi produk olahan atau matching pembeli pakan ternak.
          </p>
        </div>

        {/* Logs Timeline */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Log Aktivitas Rekomendasi
          </h3>

          {logs.length === 0 ? (
            <div className="bg-card rounded-3xl p-8 border border-border text-center space-y-3">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto" />
              <div>
                <p className="text-sm font-bold text-foreground">Belum ada riwayat rekomendasi</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Mulai dengan membuat rencana panen pada menu "Prediksi Panen".
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const typeStyle = getTypeLabel(log.type);
                const comm = COMMODITY_LIST.find((c) => c.id === log.harvestPlan?.commodity);

                return (
                  <div
                    key={log.id}
                    className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all"
                  >
                    <div
                      onClick={() => toggleExpand(log.id)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-all select-none"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg">{comm?.icon || "🌱"}</span>
                          <strong className="text-xs font-bold text-foreground capitalize">
                            {comm?.label || log.harvestPlan?.commodity.replace("_", " ")}
                          </strong>
                          <span className="text-[10px] text-muted-foreground">
                            ({log.harvestPlan?.estimatedVolume} {log.harvestPlan?.volumeUnit})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${typeStyle.color}`}>
                            {typeStyle.label}
                          </span>
                          <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(log.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </span>
                        </div>
                      </div>

                      <div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border/50 bg-muted/20 px-4 py-4.5 space-y-3.5 text-xs text-foreground/90"
                        >
                          <div className="space-y-1 leading-relaxed">
                            <strong className="block text-[10px] uppercase tracking-wider text-muted-foreground">Rekomendasi Natural</strong>
                            <p className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-border/50 text-foreground leading-relaxed">
                              {log.naturalLanguageText.replace(/\*\*/g, "")}
                            </p>
                          </div>

                          {/* Render custom type details */}
                          {log.type === "HARVEST_TIMING" && log.jsonData && (
                            <div className="grid grid-cols-2 gap-2 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-border/50">
                              <div>
                                <span className="text-[9px] uppercase font-bold text-muted-foreground block">Proyeksi Harga</span>
                                <span className="font-extrabold text-foreground">Rp {log.jsonData.projectedPrice?.toLocaleString("id-ID")}/kg</span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase font-bold text-muted-foreground block">Saran Tanggal Panen</span>
                                <span className="font-extrabold text-foreground">{log.jsonData.suggestedHarvestDate}</span>
                              </div>
                            </div>
                          )}

                          {log.type === "SELL_DESTINATION" && log.jsonData?.destinations && (
                            <div className="space-y-2">
                              <strong className="block text-[10px] uppercase tracking-wider text-muted-foreground">Destinasi Logistik</strong>
                              <div className="space-y-1.5">
                                {log.jsonData.destinations.slice(0, 2).map((dest: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-border/50">
                                    <div>
                                      <span className="font-bold text-foreground block">{dest.buyerName}</span>
                                      <span className="text-[10px] text-muted-foreground">{dest.distanceKm} km &bull; Tarif Rp {dest.logisticsCost?.toLocaleString("id-ID")}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[10px] text-muted-foreground block font-semibold">Margin Bersih</span>
                                      <span className="font-extrabold text-emerald-600">Rp {dest.netMargin?.toLocaleString("id-ID")}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {log.type === "PRESERVATION" && log.jsonData?.recommendations && (
                            <div className="space-y-2">
                              <strong className="block text-[10px] uppercase tracking-wider text-muted-foreground">Langkah Preservasi</strong>
                              <div className="space-y-1.5">
                                {log.jsonData.recommendations.map((step: any, idx: number) => (
                                  <div key={idx} className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-border/50 flex gap-2">
                                    <span className="font-extrabold text-amber-500">{step.step}:</span>
                                    <span className="text-muted-foreground">{step.instruction}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {log.type === "WASTE_RECOVERY" && log.jsonData?.alternatives && (
                            <div className="space-y-2">
                              <strong className="block text-[10px] uppercase tracking-wider text-muted-foreground">Opsi Waste Recovery</strong>
                              <div className="space-y-1.5">
                                {log.jsonData.alternatives.map((alt: any, idx: number) => (
                                  <div key={idx} className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-border/50 flex justify-between items-center">
                                    <div>
                                      <span className="font-bold text-foreground block">{alt.name}</span>
                                      <span className="text-[10px] text-muted-foreground leading-snug">{alt.description}</span>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="font-extrabold text-emerald-600 block">Rp {alt.estimatedValue?.toLocaleString("id-ID")}</span>
                                      <span className="text-[9px] font-black text-emerald-600/90 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">+{alt.recoveryPercentage}%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-lg mx-auto text-center text-[10px] text-muted-foreground py-6 border-t border-border/50 px-4">
        &copy; {new Date().getFullYear()} Tani Pintar. Semua Hak Dilindungi.
      </footer>
    </div>
  );
}
