"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  ChevronDown,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Cake,
  Users,
  TrendingUp,
  Heart,
  ArrowLeft,
  MoreVertical,
} from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { SCHOOL } from "@/lib/school.config";
import {
  PageShell,
  PageHeader,
  PageCard,
  PageCardHeader,
  StatCards,
  AuroraTable,
  ATRow,
  ATCell,
  EmptyState,
} from "@/components/shared/PageShell";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function KelasPage() {
  const router = useRouter();
  const { dataSiswa, dataGuru, dataKelas } = useAppStore();
  const KUMPULAN_KELAS = Array.from(new Set(dataSiswa.map((s) => s.kelas)))
    .filter((k): k is string => !!k)
    .sort();
  const [selectedKelas, setSelectedKelas] = useState<string>("all");
  const [selectedDetailKelas, setSelectedDetailKelas] = useState<string | null>(
    null,
  );

  const kelasStats = useMemo(() => {
    const map: Record<
      string,
      {
        total: number;
        laki: number;
        peremp: number;
        complete: number;
        incomplete: number;
        birthdays: string[];
        students: any[];
        wali?: string;
      }
    > = {};
    const todayMM = new Date().getMonth() + 1;
    const todayDD = new Date().getDate();

    dataSiswa.forEach((s) => {
      const kelas = s.kelas || "Tanpa Kelas";
      if (!map[kelas]) {
        const mk = dataKelas.find((k) => k.nama_kelas === kelas);
        const waliGuru = mk
          ? dataGuru.find((g) => g.id === mk.wali_kelas_id)?.nama
          : undefined;
        map[kelas] = {
          total: 0,
          laki: 0,
          peremp: 0,
          complete: 0,
          incomplete: 0,
          birthdays: [],
          students: [],
          wali: waliGuru,
        };
      }
      map[kelas].total++;
      map[kelas].students.push(s);
      if (s.jk === "L") map[kelas].laki++;
      if (s.jk === "P") map[kelas].peremp++;
      const fields = [
        s.nama,
        s.nisn,
        s.nik,
        s.tempat_lahir,
        s.tanggal_lahir,
        s.jk,
        s.agama,
        s.alamat,
        s.nama_ayah,
        s.nama_ibu,
      ];
      const filled = fields.filter(
        (v) => v && v !== "-" && String(v).trim() !== "",
      ).length;
      if (filled >= 8) map[kelas].complete++;
      else map[kelas].incomplete++;
      if (s.tanggal_lahir) {
        const parts = s.tanggal_lahir.split("-");
        if (parts.length === 3) {
          const mm = parseInt(parts[1]);
          const dd = parseInt(parts[2]);
          if (mm === todayMM && dd === todayDD)
            map[kelas].birthdays.push(s.nama);
        }
      }
    });
    return Object.entries(map)
      .map(([kelas, stats]) => ({ kelas, ...stats }))
      .sort((a, b) => a.kelas.localeCompare(b.kelas));
  }, [dataSiswa, dataKelas, dataGuru]);

  const chartData = kelasStats.map((k) => ({
    name: k.kelas.replace("Kelas ", ""),
    L: k.laki,
    P: k.peremp,
  }));

  const totalStats = useMemo(
    () =>
      kelasStats.reduce(
        (acc, k) => ({
          total: acc.total + k.total,
          laki: acc.laki + k.laki,
          peremp: acc.peremp + k.peremp,
          complete: acc.complete + k.complete,
        }),
        { total: 0, laki: 0, peremp: 0, complete: 0 },
      ),
    [kelasStats],
  );

  const currentDetail = selectedDetailKelas
    ? kelasStats.find((k) => k.kelas === selectedDetailKelas)
    : null;

  // ── These hooks MUST be before any early return ──────────
  const selData =
    selectedKelas === "all"
      ? null
      : kelasStats.find((k) => k.kelas === selectedKelas);

  const pieData = [
    {
      name: "Laki-laki",
      value: selData?.laki ?? totalStats.laki,
      fill: "#3b82f6",
    },
    {
      name: "Perempuan",
      value: selData?.peremp ?? totalStats.peremp,
      fill: "#ec4899",
    },
  ];

  const compPct = useMemo(() => {
    const t = selData?.total ?? totalStats.total;
    const c = selData?.complete ?? totalStats.complete;
    return t > 0 ? Math.round((c / t) * 100) : 0;
  }, [selData, totalStats]);
  // ─────────────────────────────────────────────────────────

  if (selectedDetailKelas && currentDetail) {
    return (
      <PageShell>
        <PageHeader
          icon={<Users className="w-6 h-6 text-violet-400" />}
          title={`Kelas ${selectedDetailKelas}`}
          subtitle={`Manajemen data siswa dan wali kelas ${selectedDetailKelas}`}
          gradient="linear-gradient(135deg, #1a0533 0%, #0c0820 50%, #050d1e 100%)"
          glowColor="rgba(139,92,246,0.35)"
          action={
            <button
              onClick={() => setSelectedDetailKelas(null)}
              className="btn-solid btn-sm bg-white/5 border-white/10 text-white/60 hover:text-white transition-all flex items-center gap-2"
            >
              <ArrowLeft size={14} /> Kembali
            </button>
          }
        />

        <StatCards
          items={[
            {
              label: "Total Siswa",
              value: currentDetail.total,
              color: "#8b5cf6",
              icon: <Users className="w-5 h-5 text-violet-400" />,
            },
            {
              label: "Laki-laki",
              value: currentDetail.laki,
              color: "#3b82f6",
              icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
            },
            {
              label: "Perempuan",
              value: currentDetail.peremp,
              color: "#ec4899",
              icon: <Heart className="w-5 h-5 text-pink-400" />,
            },
            {
              label: "Wali Kelas",
              value: currentDetail.wali || "Belum Diset",
              color: "#10b981",
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
            },
          ]}
        />

        <PageCard noPad>
          <PageCardHeader
            title="Daftar Siswa"
            subtitle={`Menampilkan ${currentDetail.students.length} siswa terdaftar`}
            icon={<Users className="w-4 h-4" />}
          />
          <AuroraTable
            headers={["No", "Nama Siswa", "NISN", "JK", "Data", "Aksi"]}
          >
            {currentDetail.students.map((s, i) => {
              const fields = [
                s.nama,
                s.nisn,
                s.nik,
                s.tempat_lahir,
                s.tanggal_lahir,
                s.jk,
                s.agama,
                s.alamat,
              ];
              const filled = fields.filter(
                (v) => v && v !== "-" && String(v).trim() !== "",
              ).length;
              const pct = Math.round((filled / fields.length) * 100);

              return (
                <ATRow key={s.id}>
                  <ATCell className="text-white/20 font-mono text-xs">
                    {i + 1}
                  </ATCell>
                  <ATCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 text-[10px] font-bold">
                        {s.nama.charAt(0)}
                      </div>
                      <span className="font-bold text-white/80">{s.nama}</span>
                    </div>
                  </ATCell>
                  <ATCell className="text-cyan-400/60 font-mono text-xs">
                    {s.nisn || "-"}
                  </ATCell>
                  <ATCell className="text-white/40 text-xs">
                    {s.jk === "L" ? "L" : "P"}
                  </ATCell>
                  <ATCell>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-white/20">
                        {pct}%
                      </span>
                    </div>
                  </ATCell>
                  <ATCell>
                    <div className="flex items-center gap-1">
                      {s.tanggal_lahir &&
                        (() => {
                          const parts = s.tanggal_lahir.split("-");
                          const mm = parseInt(parts[1]);
                          const dd = parseInt(parts[2]);
                          const today = new Date();
                          if (
                            mm === today.getMonth() + 1 &&
                            dd === today.getDate()
                          ) {
                            return (
                              <span title="Ulang Tahun Hari Ini!">
                                <Cake
                                  size={14}
                                  className="text-pink-400 animate-bounce"
                                />
                              </span>
                            );
                          }
                          return null;
                        })()}
                      <button
                        onClick={() => router.push(`/siswa?search=${s.nama}`)}
                        className="p-2 rounded-lg hover:bg-white/5 text-white/20 hover:text-violet-400 transition-all"
                      >
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </ATCell>
                </ATRow>
              );
            })}
          </AuroraTable>
        </PageCard>

        {currentDetail.birthdays.length > 0 && (
          <PageCard className="bg-gradient-to-br from-pink-500/10 to-violet-500/10 border-pink-500/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center border border-pink-500/30">
                <Cake className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  Hari Ini Ada yang Ulang Tahun! 🎂
                </h3>
                <p className="text-xs text-white/40 font-medium">
                  Berikan ucapan selamat kepada:
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {currentDetail.birthdays.map((name) => (
                <span
                  key={name}
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-pink-300"
                >
                  {name}
                </span>
              ))}
            </div>
          </PageCard>
        )}
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        icon={<BarChart3 className="w-6 h-6 text-cyan-400" />}
        title="Statistik per Kelas"
        subtitle={`${SCHOOL.nama} — TA ${SCHOOL.tahunAjaran}`}
        gradient="linear-gradient(135deg, #001a2e 0%, #0c0820 50%, #050d1e 100%)"
        glowColor="rgba(34,211,238,0.28)"
        action={
          <div className="relative">
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="h-9 appearance-none rounded-xl px-3 pr-8 text-[12px] font-semibold text-white/70 outline-none"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <option value="all">Semua Kelas</option>
              {KUMPULAN_KELAS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-white/40 pointer-events-none" />
          </div>
        }
      />

      <StatCards
        items={[
          {
            label: "Total Siswa",
            value: selData?.total ?? totalStats.total,
            color: "#8b5cf6",
            icon: <Users className="w-5 h-5 text-violet-400" />,
          },
          {
            label: "Laki-laki",
            value: selData?.laki ?? totalStats.laki,
            color: "#3b82f6",
            icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
          },
          {
            label: "Perempuan",
            value: selData?.peremp ?? totalStats.peremp,
            color: "#ec4899",
            icon: <Heart className="w-5 h-5 text-pink-400" />,
          },
          {
            label: "Data Lengkap",
            value: selData?.complete ?? totalStats.complete,
            color: "#10b981",
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <PageCard>
            <PageCardHeader
              title="Distribusi Siswa per Kelas"
              icon={<BarChart3 className="w-4 h-4" />}
            />
            <div className="pt-4 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    tick={{ fill: "rgba(255,255,255,0.25)" }}
                    dy={8}
                  />
                  <YAxis hide />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div
                          className="rounded-xl px-3 py-2 shadow-xl"
                          style={{
                            background: "#0a0e1a",
                            border: "1px solid rgba(255,255,255,0.04)",
                          }}
                        >
                          <p className="text-xs text-blue-400 font-bold">
                            ♂ {payload[0]?.value}
                          </p>
                          <p className="text-xs text-pink-400 font-bold">
                            ♀ {payload[1]?.value}
                          </p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar
                    dataKey="L"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    barSize={14}
                  />
                  <Bar
                    dataKey="P"
                    fill="#ec4899"
                    radius={[4, 4, 0, 0]}
                    barSize={14}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              {[
                { color: "#3b82f6", label: "Laki-laki" },
                { color: "#ec4899", label: "Perempuan" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: l.color }}
                  />
                  <span className="text-[10px] text-white/40 font-semibold">
                    {l.label}
                  </span>
                </div>
              ))}
            </div>
          </PageCard>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <PageCard>
            <PageCardHeader
              title="Rasio Gender"
              icon={<Users className="w-4 h-4" />}
            />
            <div className="h-[160px] mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((e, i) => (
                      <Cell key={i} fill={e.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-5 mt-1">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: d.fill }}
                  />
                  <span className="text-[10px] text-white/40 font-semibold">
                    {d.value} {d.name}
                  </span>
                </div>
              ))}
            </div>
          </PageCard>

          <PageCard>
            <PageCardHeader
              title="Kelengkapan Data"
              icon={<CheckCircle2 className="w-4 h-4" />}
            />
            <div className="pt-4 space-y-3">
              <div
                className="h-2.5 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${compPct}%`,
                    background: "linear-gradient(90deg,#7c3aed,#a78bfa)",
                  }}
                />
              </div>
              <p className="text-[11px] text-white/30 text-center">
                {compPct}% data sudah lengkap
              </p>
            </div>
          </PageCard>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">
          Pilih Kelas untuk Manajemen Detail
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {kelasStats.map((k) => {
            const pct =
              k.total > 0 ? Math.round((k.complete / k.total) * 100) : 0;
            return (
              <motion.div
                key={k.kelas}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedDetailKelas(k.kelas)}
                className="rounded-3xl p-6 cursor-pointer group relative overflow-hidden transition-all"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.03)",
                }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-violet-600/10 transition-all" />

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/[0.02] group-hover:border-violet-500/30 transition-all">
                    <span className="text-xs font-black text-white/40 group-hover:text-violet-400">
                      {k.kelas.split(" ")[0]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {k.birthdays.length > 0 && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center border border-pink-500/30"
                      >
                        <Cake size={14} className="text-pink-400" />
                      </motion.div>
                    )}
                    <span className="text-2xl font-black text-white group-hover:text-violet-400 transition-colors">
                      {k.total}
                    </span>
                  </div>
                </div>

                <div className="relative z-10">
                  <h4 className="text-sm font-black text-white/80 mb-1">
                    Kelas {k.kelas}
                  </h4>
                  <div className="flex items-center gap-2 mb-4">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                      Total Siswa
                    </p>
                    {k.wali && (
                      <span className="text-[10px] font-medium text-emerald-400/50 truncate max-w-[120px]">
                        👤 {k.wali}
                      </span>
                    )}
                  </div>

                  <div
                    className="h-1.5 rounded-full overflow-hidden flex mb-2"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <div
                      className="h-full"
                      style={{
                        width: `${k.total > 0 ? (k.laki / k.total) * 100 : 50}%`,
                        background: "#3b82f6",
                      }}
                    />
                    <div
                      className="h-full"
                      style={{
                        width: `${k.total > 0 ? (k.peremp / k.total) * 100 : 50}%`,
                        background: "#ec4899",
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-bold">
                    <span className="text-blue-400/60 uppercase tracking-widest">
                      {k.laki}L
                    </span>
                    <span className="text-pink-400/60 uppercase tracking-widest">
                      {k.peremp}P
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
