"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Calendar,
  User,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { Alumni } from "@/types";
import { formatTanggal } from "@/lib/utils";

interface Props {
  data: Alumni[];
}

export function AlumniTimeline({ data }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedYear, setSelectedYear] = useState<string>("");

  // Group alumni by year
  const grouped = useMemo(() => {
    const groups: Record<string, Alumni[]> = {};
    data.forEach((a) => {
      if (!groups[a.tahun_lulus]) groups[a.tahun_lulus] = [];
      groups[a.tahun_lulus].push(a);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [data]);

  const years = useMemo(() => grouped.map((g) => g[0]), [grouped]);

  useEffect(() => {
    if (!selectedYear && years.length > 0) setSelectedYear(years[0]);
  }, [years, selectedYear]);

  const filteredAlumni = grouped.find((g) => g[0] === selectedYear)?.[1] || [];

  return (
    <div className="space-y-8 py-4">
      {/* Year Navigation Bar */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#050811] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#050811] to-transparent z-10 pointer-events-none" />

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto custom-scroll-h px-12 py-4 no-scrollbar"
        >
          {years.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`relative flex-shrink-0 px-8 py-3 rounded-2xl transition-all duration-500 border ${
                selectedYear === year
                  ? "bg-violet-500/10 border-violet-500/40 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                  : "bg-white/5 border-white/5 text-white/30 hover:text-white/60 hover:bg-white/10"
              }`}
            >
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-0.5">
                  Angkatan
                </span>
                <span className="text-xl font-black">{year}</span>
              </div>
              {selectedYear === year && (
                <motion.div
                  layoutId="activeYear"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-violet-400 rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Alumni Grid for Selected Year */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedYear}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-2"
        >
          {filteredAlumni.map((alumni, i) => (
            <motion.div
              key={alumni.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="group relative"
            >
              <div className="card-obsidian p-6 space-y-4 hover:border-violet-500/30 transition-all duration-500 overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all" />

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:text-violet-400 transition-all group-hover:scale-110">
                    <User size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-white/90 truncate leading-tight group-hover:text-white transition-colors">
                      {alumni.nama}
                    </h3>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">
                      NISN {alumni.nisn}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2.5 text-xs text-white/50">
                    <MapPin size={14} className="text-cyan-400/60" />
                    <span className="truncate">
                      {alumni.sekolah_lanjutan || "Data Belum Terupdate"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-white/50">
                    <Calendar size={14} className="text-violet-400/60" />
                    <span>Lulus Tahun {alumni.tahun_lulus}</span>
                  </div>
                </div>

                <div className="pt-4 flex items-center border-t border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500/50" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {grouped.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
            <GraduationCap size={32} className="text-white/10" />
          </div>
          <p className="text-white/20 text-sm font-medium">
            Digital Time Capsule masih kosong.
          </p>
        </div>
      )}
    </div>
  );
}
