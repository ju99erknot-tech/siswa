"use client";

import { motion } from "framer-motion";
import {
  PlaneTakeoff,
  ExternalLink,
  Info,
  ShieldCheck,
  Zap,
  FileText,
} from "lucide-react";
import UtilityHeader from "./UtilityHeader";

export default function ESPPD() {
  // Note: This URL should be moved to an environment variable NEXT_PUBLIC_SPPD_URL in production
  const urlSPPD =
    process.env.NEXT_PUBLIC_SPPD_URL ||
    "https://script.google.com/macros/s/AKfycbw0vEX43NAdfMH8On_UNwfSnjcW_H0wF5W9M5Gx22POxWw3kiwPDFu6zseQmhTV5r-Erg/exec";

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-5xl mx-auto pb-10">
      <UtilityHeader
        icon={PlaneTakeoff}
        title="Aplikasi e-SPPD"
        subtitle="Pusat Cetak & Utility • Surat Perjalanan Dinas Elektronik"
        accentColor="emerald"
        actionLabel="Buka Fullscreen"
        actionIcon={ExternalLink}
        onAction={() => window.open(urlSPPD, "_blank")}
      />

      {/* Info Grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          {
            icon: ShieldCheck,
            label: "Resmi & Sah",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            icon: Zap,
            label: "Instan Generator",
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
          {
            icon: FileText,
            label: "Format Standard",
            color: "text-violet-400",
            bg: "bg-violet-500/10",
          },
        ].map((item, i) => (
          <div key={i} className="card p-5 flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center ${item.color}`}
            >
              <item.icon className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-300 text-sm uppercase tracking-tight">
              {item.label}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Iframe */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 z-10" />
        <iframe
          src={urlSPPD}
          className="w-full h-[800px] border-none bg-white"
          title="e-SPPD Application"
        />
        <div className="p-5 border-t border-white/[0.06] flex items-start gap-3">
          <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Aplikasi e-SPPD terintegrasi dengan Google Apps Script untuk
            manajemen data real-time. Jika tampilan tidak muncul, pastikan sudah
            login ke akun Google sekolah atau klik{" "}
            <b className="text-slate-300">Buka Fullscreen</b>.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
