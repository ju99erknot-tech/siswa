"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Users, User, Camera, X, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Siswa } from "@/types";
import { getKelasColor, getInitials } from "@/lib/utils";
import { useAppStore } from "@/store/app.store";

interface ClassRosterProps {
  kelas: string;
  waliKelas?: string;
  siswaList: Siswa[];
  onClose: () => void;
}

export function ClassRoster({
  kelas,
  waliKelas,
  siswaList,
  onClose,
}: ClassRosterProps) {
  const router = useRouter();
  const { setDetailSiswa } = useAppStore();
  const color = getKelasColor(kelas);

  const stats = useMemo(() => {
    const total = siswaList.length;
    const laki = siswaList.filter((s) => s.jk === "L").length;
    const perempuan = total - laki;
    const hasFoto = siswaList.filter((s) => s.foto_url).length;
    return {
      total,
      laki,
      perempuan,
      hasFoto,
      fotoPct: total > 0 ? Math.round((hasFoto / total) * 100) : 0,
    };
  }, [siswaList]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Header */}
      <div
        className="p-5 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black"
            style={{
              background: `${color}15`,
              border: `1px solid ${color}30`,
              color,
            }}
          >
            {kelas.split(" ")[0]}
          </div>
          <div>
            <h3 className="text-white font-black text-base">Kelas {kelas}</h3>
            <p className="text-[10px] text-white/30 font-bold mt-0.5">
              {waliKelas ? `Wali: ${waliKelas}` : "Wali kelas belum diset"} •{" "}
              {stats.total} siswa
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/siswa?kelas=${kelas}`)}
            className="p-2 rounded-lg text-white/20 hover:text-violet-400 hover:bg-white/5 transition-all"
            title="Buka di Buku Induk"
          >
            <ExternalLink size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/20 hover:text-white hover:bg-white/5 transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Mini Stats */}
      <div
        className="grid grid-cols-4 gap-3 p-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
      >
        {[
          { label: "Total", value: stats.total, c: "#8b5cf6" },
          { label: "Laki-laki", value: stats.laki, c: "#22d3ee" },
          { label: "Perempuan", value: stats.perempuan, c: "#ec4899" },
          { label: "Foto", value: `${stats.fotoPct}%`, c: "#34d399" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-lg font-black" style={{ color: s.c }}>
              {s.value}
            </p>
            <p className="text-[9px] text-white/25 font-bold uppercase">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Gender Bar */}
      {stats.total > 0 && (
        <div className="px-4 py-2 flex items-center gap-2">
          <span className="text-[9px] font-bold text-cyan-400">
            {stats.laki}L
          </span>
          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-cyan-500/50 rounded-l-full"
              style={{ width: `${(stats.laki / stats.total) * 100}%` }}
            />
            <div
              className="h-full bg-pink-500/50 rounded-r-full"
              style={{ width: `${(stats.perempuan / stats.total) * 100}%` }}
            />
          </div>
          <span className="text-[9px] font-bold text-pink-400">
            {stats.perempuan}P
          </span>
        </div>
      )}

      {/* Student List */}
      <div className="max-h-[400px] overflow-y-auto custom-scroll">
        {siswaList.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-white/20 text-xs font-bold">
              Belum ada siswa di kelas ini
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {siswaList.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                onClick={() => setDetailSiswa(s)}
              >
                <span className="text-[10px] text-white/15 font-mono w-5 text-right">
                  {i + 1}
                </span>
                {s.foto_url ? (
                  <img
                    src={s.foto_url}
                    alt=""
                    className="w-8 h-8 rounded-lg object-cover border border-white/10"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/20 border border-white/5">
                    {getInitials(s.nama)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white/70 truncate group-hover:text-violet-300 transition-colors">
                    {s.nama}
                  </p>
                  <p className="text-[10px] text-white/20 font-mono">
                    {s.nisn}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.jk === "L" ? "text-cyan-400/60 bg-cyan-500/10" : "text-pink-400/60 bg-pink-500/10"}`}
                >
                  {s.jk}
                </span>
                {s.foto_url ? (
                  <Camera size={10} className="text-emerald-400/40" />
                ) : (
                  <Camera size={10} className="text-white/10" />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
