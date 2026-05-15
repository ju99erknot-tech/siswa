"use client";

import { motion } from "framer-motion";
import {
  Cake,
  Zap,
  Bell,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { toast } from "sonner";
import { useMemo } from "react";

export function DashboardBriefing() {
  const { dataSiswa, dataPrestasi, dataGuru } = useAppStore();

  const briefing = useMemo(() => {
    const today = new Date();
    const todayMM = today.getMonth() + 1;
    const todayDD = today.getDate();

    const birthdays = dataSiswa.filter((s) => {
      if (!s.tanggal_lahir) return false;
      const parts = s.tanggal_lahir.split("-");
      return parseInt(parts[1]) === todayMM && parseInt(parts[2]) === todayDD;
    });

    const latestPrestasi = dataPrestasi.slice(0, 2);
    const guruAktif = dataGuru.filter((g) => g.status_aktif).length;

    return { birthdays, latestPrestasi, guruAktif };
  }, [dataSiswa, dataPrestasi, dataGuru]);

  if (briefing.birthdays.length === 0 && briefing.latestPrestasi.length === 0)
    return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl mx-auto mb-12 grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {/* Birthday Briefing */}
      {briefing.birthdays.length > 0 && (
        <div className="relative group overflow-hidden rounded-[32px] p-1">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-violet-500/20 blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative h-full bg-[#0d1117]/80 backdrop-blur-3xl rounded-[31px] p-6 border border-white/10 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20 shrink-0">
              <Cake className="w-7 h-7 text-pink-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                Ulang Tahun Hari Ini{" "}
                <Sparkles size={14} className="text-pink-400" />
              </h4>
              <p className="text-xs text-white/40 font-medium mt-1 truncate">
                {briefing.birthdays.map((s) => s.nama).join(", ")}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    const first = briefing.birthdays[0];
                    const noWa = first?.no_wa?.trim();
                    if (!noWa || noWa === "-") {
                      toast.error("Nomor WA tidak tersedia");
                      return;
                    }
                    let phone = noWa.replace(/[^0-9]/g, "");
                    if (phone.startsWith("0")) phone = "62" + phone.slice(1);
                    if (!phone.startsWith("62")) phone = "62" + phone;
                    const nama = encodeURIComponent(first.nama);
                    window.open(
                      `https://wa.me/${phone}?text=Selamat%20ulang%20tahun%20${nama}!`,
                      "_blank",
                    );
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-pink-400 hover:text-pink-300 transition-colors flex items-center gap-1"
                >
                  Kirim Ucapan <ChevronRight size={10} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Briefing */}
      {briefing.latestPrestasi.length > 0 && (
        <div className="relative group overflow-hidden rounded-[32px] p-1">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative h-full bg-[#0d1117]/80 backdrop-blur-3xl rounded-[31px] p-6 border border-white/10 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Zap className="w-7 h-7 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-black text-white tracking-tight">
                Pencapaian Baru
              </h4>
              <p className="text-xs text-white/40 font-medium mt-1 truncate">
                {briefing.latestPrestasi[0].nama} —{" "}
                {briefing.latestPrestasi[0].jenis_lomba}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-black text-amber-400 uppercase tracking-tighter">
                  New Record
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
