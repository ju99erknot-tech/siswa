"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Star,
  Medal,
  Users,
  ArrowUp,
  Crown,
  Sparkles,
} from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { PageShell, PageHeader } from "@/components/shared/PageShell";
import { uiSound } from "@/lib/audio";

const deterministicBonus = (nisn: string) => {
  let hash = 0;
  for (const ch of nisn || "0")
    hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return Math.abs(hash) % 50;
};

export default function LeaderboardPage() {
  const { dataSiswa, dataPrestasi } = useAppStore();

  // Hitung poin tiap siswa berdasarkan jumlah prestasi
  const rankedStudents = useMemo(() => {
    const scores = dataSiswa
      .map((siswa) => {
        const prestasiSiswa = dataPrestasi.filter(
          (p) =>
            p.nama.toLowerCase() === siswa.nama.toLowerCase() ||
            p.id === siswa.id,
        );
        const points = prestasiSiswa.length * 150; // 150 poin per prestasi
        return {
          ...siswa,
          prestasiCount: prestasiSiswa.length,
          points: points > 0 ? points + deterministicBonus(siswa.nisn) : 0,
        };
      })
      .filter((s) => s.points > 0)
      .sort((a, b) => b.points - a.points);

    return scores;
  }, [dataSiswa, dataPrestasi]);

  const top3 = rankedStudents.slice(0, 3);
  const others = rankedStudents.slice(3, 10);

  // Animasi
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <PageShell>
      <PageHeader
        icon={<Crown className="w-6 h-6 text-yellow-400" />}
        title="Leaderboard & Peringkat"
        subtitle="Sistem Peringkat Siswa Berdasarkan Poin Prestasi Akademik & Non-Akademik"
        gradient="linear-gradient(135deg, #1f1005 0%, #0d0905 50%, #050505 100%)"
        glowColor="rgba(250, 204, 21, 0.25)"
        stats={[
          { label: "Siswa Berprestasi", value: rankedStudents.length },
          {
            label: "Total Poin",
            value: rankedStudents.reduce((a, b) => a + b.points, 0),
          },
        ]}
      />

      {rankedStudents.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center">
          <Trophy size={48} className="text-white/10 mb-4" />
          <h3 className="text-xl font-bold text-white/50">
            Belum Ada Data Leaderboard
          </h3>
          <p className="text-white/30 text-sm mt-2">
            Tambahkan data prestasi siswa untuk melihat peringkat mereka di
            sini.
          </p>
        </div>
      ) : (
        <div className="space-y-12 mt-8">
          {/* Podium Top 3 */}
          <div className="relative flex justify-center items-end h-[350px] gap-2 md:gap-6 px-4">
            {/* Juara 2 (Kiri) */}
            {top3[1] && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center relative z-10 w-28 md:w-40"
              >
                <div className="relative mb-4">
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-300 border-2 border-[#0d0905] flex items-center justify-center z-10 shadow-lg shadow-slate-400/20">
                    <span className="text-slate-800 font-black text-xs">2</span>
                  </div>
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-slate-300 bg-slate-800 flex items-center justify-center overflow-hidden">
                    <span className="text-2xl font-black text-slate-400">
                      {top3[1].nama.charAt(0)}
                    </span>
                  </div>
                </div>
                <div
                  className="w-full h-[140px] rounded-t-2xl flex flex-col items-center justify-start pt-4 relative overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(148,163,184,0.15) 0%, rgba(148,163,184,0.05) 100%)",
                    border: "1px solid rgba(148,163,184,0.2)",
                  }}
                >
                  <p className="text-xs md:text-sm font-bold text-white text-center px-2 truncate w-full">
                    {top3[1].nama}
                  </p>
                  <p className="text-[10px] text-white/40 mt-1">
                    {top3[1].kelas}
                  </p>
                  <div className="mt-3 px-3 py-1 rounded-full bg-slate-400/10 border border-slate-400/20">
                    <p className="text-xs font-black text-slate-300">
                      {top3[1].points} pts
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Juara 1 (Tengah) */}
            {top3[0] && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                className="flex flex-col items-center relative z-20 w-32 md:w-48"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 4,
                    ease: "easeInOut",
                  }}
                  className="relative mb-6"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                    <Crown size={32} />
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-yellow-400 border-2 border-[#0d0905] flex items-center justify-center z-10 shadow-lg shadow-yellow-500/30">
                    <span className="text-yellow-900 font-black text-xs">
                      1
                    </span>
                  </div>
                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-yellow-400 bg-yellow-900/50 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(250,204,21,0.15)] relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/20 to-transparent" />
                    <span className="text-4xl font-black text-yellow-500 relative z-10">
                      {top3[0].nama.charAt(0)}
                    </span>
                  </div>
                </motion.div>
                <div
                  className="w-full h-[180px] rounded-t-2xl flex flex-col items-center justify-start pt-6 relative overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(250,204,21,0.15) 0%, rgba(250,204,21,0.02) 100%)",
                    border: "1px solid rgba(250,204,21,0.3)",
                  }}
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.8)]" />
                  <p className="text-sm md:text-base font-black text-white text-center px-2 truncate w-full">
                    {top3[0].nama}
                  </p>
                  <p className="text-[11px] text-yellow-400/70 mt-1 font-bold">
                    {top3[0].kelas}
                  </p>
                  <div className="mt-4 px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 shadow-[0_0_15px_rgba(250,204,21,0.1)]">
                    <p className="text-sm font-black text-yellow-400">
                      {top3[0].points} pts
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Juara 3 (Kanan) */}
            {top3[2] && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col items-center relative z-10 w-28 md:w-40"
              >
                <div className="relative mb-4">
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-amber-600 border-2 border-[#0d0905] flex items-center justify-center z-10 shadow-lg shadow-amber-700/20">
                    <span className="text-amber-100 font-black text-xs">3</span>
                  </div>
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-amber-600 bg-amber-900/40 flex items-center justify-center overflow-hidden">
                    <span className="text-2xl font-black text-amber-500">
                      {top3[2].nama.charAt(0)}
                    </span>
                  </div>
                </div>
                <div
                  className="w-full h-[110px] rounded-t-2xl flex flex-col items-center justify-start pt-4 relative overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(217,119,6,0.15) 0%, rgba(217,119,6,0.05) 100%)",
                    border: "1px solid rgba(217,119,6,0.2)",
                  }}
                >
                  <p className="text-xs md:text-sm font-bold text-white text-center px-2 truncate w-full">
                    {top3[2].nama}
                  </p>
                  <p className="text-[10px] text-white/40 mt-1">
                    {top3[2].kelas}
                  </p>
                  <div className="mt-2 px-3 py-1 rounded-full bg-amber-600/10 border border-amber-600/20">
                    <p className="text-xs font-black text-amber-500">
                      {top3[2].points} pts
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* List Peringkat 4 - 10 */}
          {others.length > 0 && (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="max-w-3xl mx-auto space-y-3"
            >
              <div className="flex items-center gap-3 mb-6 px-2">
                <Medal className="w-5 h-5 text-white/40" />
                <h3 className="text-sm font-black text-white/60 uppercase tracking-widest">
                  Peringkat Selanjutnya
                </h3>
              </div>

              {others.map((s, idx) => (
                <motion.div
                  key={s.id}
                  variants={item}
                  whileHover={{
                    scale: 1.01,
                    backgroundColor: "rgba(255,255,255,0.04)",
                  }}
                  onClick={() => uiSound.playClick()}
                  className="flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="flex items-center gap-5">
                    <span className="text-xl font-black text-white/20 w-8 text-center">
                      {idx + 4}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-white/60">
                      {s.nama.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white/90">
                        {s.nama}
                      </p>
                      <p className="text-xs text-white/40">
                        {s.kelas} • {s.prestasiCount} Prestasi
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-emerald-400">
                      {s.points}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400/50 uppercase tracking-wider">
                      PTS
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </PageShell>
  );
}
