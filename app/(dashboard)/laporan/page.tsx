"use client";

import { useState, useMemo } from "react";
import {
  FileBarChart,
  Download,
  Printer,
  BarChart3,
  Users,
  Trophy,
  UserPlus,
  UserMinus,
  Heart,
  GraduationCap,
  TrendingUp,
  ClipboardList,
} from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { SCHOOL } from "@/lib/school.config";
import {
  PageShell,
  PageHeader,
  PageCard,
  PageCardHeader,
} from "@/components/shared/PageShell";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  Legend,
} from "recharts";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#22d3ee",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#ec4899",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#fb923c",
  "#f472b6",
];

type ReportType =
  | "overview"
  | "gender"
  | "kelas"
  | "agama"
  | "kelengkapan"
  | "tren";

const REPORT_TYPES = [
  {
    id: "overview" as ReportType,
    label: "Ringkasan Umum",
    desc: "Statistik keseluruhan sekolah",
    icon: BarChart3,
    accent: "#8b5cf6",
  },
  {
    id: "gender" as ReportType,
    label: "Rasio Gender",
    desc: "Perbandingan L/P per kelas",
    icon: Users,
    accent: "#3b82f6",
  },
  {
    id: "kelas" as ReportType,
    label: "Distribusi Kelas",
    desc: "Jumlah siswa per kelas",
    icon: BarChart3,
    accent: "#22d3ee",
  },
  {
    id: "agama" as ReportType,
    label: "Distribusi Agama",
    desc: "Sebaran agama siswa",
    icon: Heart,
    accent: "#f59e0b",
  },
  {
    id: "kelengkapan" as ReportType,
    label: "Kelengkapan Data",
    desc: "Audit data per siswa",
    icon: ClipboardList,
    accent: "#10b981",
  },
  {
    id: "tren" as ReportType,
    label: "Tren Bulanan",
    desc: "Pertumbuhan data per bulan",
    icon: TrendingUp,
    accent: "#f43f5e",
  },
];

export default function LaporanPage() {
  const {
    dataSiswa,
    dataPrestasi,
    dataMutasiMasuk,
    dataMutasiKeluar,
    dataAlumni,
    dataGuru,
  } = useAppStore();
  const [activeReport, setActiveReport] = useState<ReportType>("overview");

  const overview = useMemo(
    () => ({
      totalSiswa: dataSiswa.length,
      laki: dataSiswa.filter((s) => s.jk === "L").length,
      peremp: dataSiswa.filter((s) => s.jk === "P").length,
      prestasi: dataPrestasi.length,
      mutasiMasuk: dataMutasiMasuk.length,
      mutasiKeluar: dataMutasiKeluar.length,
      alumni: dataAlumni.length,
      kelasCount: new Set(dataSiswa.map((s) => s.kelas)).size,
    }),
    [dataSiswa, dataPrestasi, dataMutasiMasuk, dataMutasiKeluar, dataAlumni],
  );

  const genderData = useMemo(() => {
    const map: Record<string, { L: number; P: number }> = {};
    dataSiswa.forEach((s) => {
      const k = s.kelas || "Lainnya";
      if (!map[k]) map[k] = { L: 0, P: 0 };
      if (s.jk === "L") map[k].L++;
      else map[k].P++;
    });
    return Object.entries(map)
      .map(([name, val]) => ({ name: name.replace("Kelas ", ""), ...val }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [dataSiswa]);

  const kelasData = useMemo(() => {
    const map: Record<string, number> = {};
    dataSiswa.forEach((s) => {
      const k = s.kelas || "Lainnya";
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value], i) => ({
        name,
        value,
        fill: COLORS[i % COLORS.length],
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [dataSiswa]);

  const agamaData = useMemo(() => {
    const map: Record<string, number> = {};
    dataSiswa.forEach((s) => {
      const a = s.agama || "Lainnya";
      map[a] = (map[a] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value], i) => ({
        name,
        value,
        fill: COLORS[i % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [dataSiswa]);

  const kelengkapanData = useMemo(() => {
    const fields = [
      "nama",
      "nisn",
      "nik",
      "tempat_lahir",
      "tanggal_lahir",
      "jk",
      "agama",
      "alamat",
      "kecamatan",
      "nama_ayah",
      "nama_ibu",
      "no_wa",
    ] as const;
    return dataSiswa
      .map((s) => {
        const filled = fields.filter((f) => {
          const v = s[f as keyof typeof s];
          return v && v !== "-" && String(v).trim() !== "";
        }).length;
        return {
          id: s.id,
          nama: s.nama,
          kelas: s.kelas || "-",
          filled,
          total: fields.length,
          persen: Math.round((filled / fields.length) * 100),
        };
      })
      .sort((a, b) => a.persen - b.persen);
  }, [dataSiswa]);

  // ── Tren bulanan (12 bulan terakhir) ──────────────────
  const trenData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (11 - i));
      const y = d.getFullYear(),
        m = d.getMonth();
      const label = d.toLocaleDateString("id-ID", {
        month: "short",
        year: "2-digit",
      });
      const siswaBaru = dataSiswa.filter((s) => {
        if (!s.created_at) return false;
        const cd = new Date(s.created_at);
        return cd.getFullYear() === y && cd.getMonth() === m;
      }).length;
      const prestasiBulan = dataPrestasi.filter((p) => {
        if (!p.tanggal_lomba) return false;
        const td = new Date(p.tanggal_lomba);
        return td.getFullYear() === y && td.getMonth() === m;
      }).length;
      return { label, siswaBaru, prestasi: prestasiBulan };
    });
  }, [dataSiswa, dataPrestasi]);

  const handleExport = () => {
    let rows: Record<string, unknown>[] = [],
      sheetName = "Laporan";
    if (activeReport === "overview") {
      rows = [
        { Kategori: "Total Siswa", Jumlah: overview.totalSiswa },
        { Kategori: "Laki-laki", Jumlah: overview.laki },
        { Kategori: "Perempuan", Jumlah: overview.peremp },
        { Kategori: "Kelas", Jumlah: overview.kelasCount },
        { Kategori: "Prestasi", Jumlah: overview.prestasi },
        { Kategori: "Alumni", Jumlah: overview.alumni },
      ];
      sheetName = "Overview";
    } else if (activeReport === "gender") {
      rows = genderData.map((g) => ({
        Kelas: g.name,
        L: g.L,
        P: g.P,
        Total: g.L + g.P,
      }));
      sheetName = "Gender";
    } else if (activeReport === "kelas") {
      rows = kelasData.map((k) => ({ Kelas: k.name, Jumlah: k.value }));
      sheetName = "Kelas";
    } else if (activeReport === "agama") {
      rows = agamaData.map((a) => ({ Agama: a.name, Jumlah: a.value }));
      sheetName = "Agama";
    } else if (activeReport === "tren") {
      rows = trenData.map((t) => ({
        Bulan: t.label,
        "Siswa Baru": t.siswaBaru,
        Prestasi: t.prestasi,
      }));
      sheetName = "Tren";
    } else {
      rows = kelengkapanData.map((k, i) => ({
        No: i + 1,
        Nama: k.nama,
        Kelas: k.kelas,
        Terisi: k.filled,
        Total: k.total,
        "%": `${k.persen}%`,
      }));
      sheetName = "Kelengkapan";
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(
      wb,
      `Laporan_${sheetName}_${SCHOOL.nama.replace(/\s+/g, "_")}.xlsx`,
    );
    toast.success(`Laporan ${sheetName} berhasil diunduh`);
  };

  const report = REPORT_TYPES.find((r) => r.id === activeReport)!;

  return (
    <PageShell>
      <PageHeader
        icon={<FileBarChart className="w-6 h-6 text-violet-400" />}
        title="Laporan & Analitik"
        subtitle={`${SCHOOL.nama} — TA ${SCHOOL.tahunAjaran}`}
        gradient="linear-gradient(135deg, #1a0533 0%, #0c0820 50%, #050d1e 100%)"
        glowColor="rgba(139,92,246,0.35)"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="h-9 px-4 rounded-xl text-[12px] font-semibold flex items-center gap-2 text-white/50 hover:text-white/80 transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak
            </button>
            <button
              onClick={handleExport}
              className="h-9 px-4 rounded-xl text-[12px] font-bold flex items-center gap-2 text-white transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg,#8b5cf6,#6d28d9)",
                boxShadow: "0 4px 14px rgba(139,92,246,0.3)",
              }}
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor Excel
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Selector */}
        <div className="lg:col-span-3 space-y-2">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-3">
            Jenis Laporan
          </p>
          {REPORT_TYPES.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveReport(r.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left"
              style={{
                background:
                  activeReport === r.id
                    ? `${r.accent}10`
                    : "rgba(255,255,255,0.02)",
                border: `1px solid ${activeReport === r.id ? `${r.accent}30` : "rgba(255,255,255,0.05)"}`,
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${r.accent}14` }}
              >
                <r.icon className="w-4 h-4" style={{ color: r.accent }} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-[12px] font-bold truncate ${activeReport === r.id ? "text-white/90" : "text-white/50"}`}
                >
                  {r.label}
                </p>
                <p className="text-[9px] text-white/20 truncate">{r.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-9">
          <PageCard>
            <PageCardHeader
              title={report.label}
              icon={
                <report.icon
                  className="w-4 h-4"
                  style={{ color: report.accent }}
                />
              }
            />
            <div className="pt-5">
              {activeReport === "overview" && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    {
                      icon: Users,
                      label: "Total Siswa",
                      value: overview.totalSiswa,
                      accent: "#8b5cf6",
                    },
                    {
                      icon: TrendingUp,
                      label: "Laki-laki",
                      value: overview.laki,
                      accent: "#3b82f6",
                    },
                    {
                      icon: Heart,
                      label: "Perempuan",
                      value: overview.peremp,
                      accent: "#ec4899",
                    },
                    {
                      icon: BarChart3,
                      label: "Jumlah Kelas",
                      value: overview.kelasCount,
                      accent: "#22d3ee",
                    },
                    {
                      icon: Trophy,
                      label: "Prestasi",
                      value: overview.prestasi,
                      accent: "#f59e0b",
                    },
                    {
                      icon: UserPlus,
                      label: "Mutasi Masuk",
                      value: overview.mutasiMasuk,
                      accent: "#10b981",
                    },
                    {
                      icon: UserMinus,
                      label: "Mutasi Keluar",
                      value: overview.mutasiKeluar,
                      accent: "#f43f5e",
                    },
                    {
                      icon: GraduationCap,
                      label: "Alumni",
                      value: overview.alumni,
                      accent: "#a78bfa",
                    },
                  ].map((c) => (
                    <div
                      key={c.label}
                      className="rounded-xl p-4"
                      style={{
                        background: `${c.accent}08`,
                        border: `1px solid ${c.accent}15`,
                      }}
                    >
                      <c.icon
                        className="w-4 h-4 mb-2"
                        style={{ color: c.accent }}
                      />
                      <p
                        className="text-2xl font-black"
                        style={{ color: c.accent }}
                      >
                        {c.value}
                      </p>
                      <p
                        className="text-[9px] font-bold uppercase tracking-widest mt-0.5"
                        style={{ color: `${c.accent}80` }}
                      >
                        {c.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {activeReport === "gender" && (
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={genderData} barGap={2}>
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        fontSize={10}
                        tick={{ fill: "rgba(255,255,255,0.25)" }}
                      />
                      <YAxis hide />
                      <Tooltip
                        content={({ active, payload }) =>
                          active && payload?.length ? (
                            <div
                              className="rounded-xl px-3 py-2"
                              style={{
                                background: "#0a0e1a",
                                border: "1px solid rgba(255,255,255,0.08)",
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
              )}

              {(activeReport === "kelas" || activeReport === "agama") &&
                (() => {
                  const data = activeReport === "kelas" ? kelasData : agamaData;
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={data}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={95}
                              paddingAngle={2}
                              dataKey="value"
                              stroke="none"
                            >
                              {data.map((_, i) => (
                                <Cell
                                  key={i}
                                  fill={COLORS[i % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              content={({ active, payload }) =>
                                active && payload?.length ? (
                                  <div
                                    className="rounded-xl px-3 py-2"
                                    style={{
                                      background: "#0a0e1a",
                                      border:
                                        "1px solid rgba(255,255,255,0.08)",
                                    }}
                                  >
                                    <p className="text-xs font-bold text-white/80">
                                      {payload[0].name}: {payload[0].value}
                                    </p>
                                  </div>
                                ) : null
                              }
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2 overflow-y-auto max-h-[260px] custom-scroll">
                        {data.map((d, i) => (
                          <div
                            key={d.name}
                            className="flex items-center gap-3 p-2 rounded-lg"
                          >
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ background: COLORS[i % COLORS.length] }}
                            />
                            <span className="text-xs text-white/60 flex-1 truncate">
                              {d.name}
                            </span>
                            <span className="text-xs font-bold text-white/80">
                              {d.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

              {activeReport === "tren" && (
                <div className="space-y-4">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trenData}>
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          fontSize={10}
                          tick={{ fill: "rgba(255,255,255,0.25)" }}
                        />
                        <YAxis hide />
                        <Tooltip
                          content={({ active, payload, label }) =>
                            active && payload?.length ? (
                              <div
                                className="rounded-xl px-3 py-2"
                                style={{
                                  background: "#0a0e1a",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                }}
                              >
                                <p className="text-xs font-bold text-white/60 mb-1">
                                  {label}
                                </p>
                                <p className="text-xs text-violet-400">
                                  Siswa Baru: {payload[0]?.value}
                                </p>
                                <p className="text-xs text-amber-400">
                                  Prestasi: {payload[1]?.value}
                                </p>
                              </div>
                            ) : null
                          }
                        />
                        <Legend
                          wrapperStyle={{
                            fontSize: "11px",
                            color: "rgba(255,255,255,0.4)",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="siswaBaru"
                          name="Siswa Baru"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          dot={{ fill: "#8b5cf6", r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="prestasi"
                          name="Prestasi"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={{ fill: "#f59e0b", r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="rounded-xl p-4"
                      style={{
                        background: "rgba(139,92,246,0.08)",
                        border: "1px solid rgba(139,92,246,0.15)",
                      }}
                    >
                      <p className="text-2xl font-black text-violet-400">
                        {trenData.reduce((s, t) => s + t.siswaBaru, 0)}
                      </p>
                      <p className="text-xs text-white/40 mt-1">
                        Total Siswa Baru (12 Bln)
                      </p>
                    </div>
                    <div
                      className="rounded-xl p-4"
                      style={{
                        background: "rgba(245,158,11,0.08)",
                        border: "1px solid rgba(245,158,11,0.15)",
                      }}
                    >
                      <p className="text-2xl font-black text-amber-400">
                        {trenData.reduce((s, t) => s + t.prestasi, 0)}
                      </p>
                      <p className="text-xs text-white/40 mt-1">
                        Total Prestasi (12 Bln)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeReport === "kelengkapan" && (
                <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scroll">
                  {kelengkapanData.map((k, i) => (
                    <div
                      key={k.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.02] transition-colors"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                      }}
                    >
                      <span className="text-[10px] text-white/15 w-6 font-bold">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-white/70 truncate">
                          {k.nama}
                        </p>
                        <p className="text-[9px] text-white/25">{k.kelas}</p>
                      </div>
                      <div
                        className="w-24 h-2 rounded-full overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${k.persen}%`,
                            background:
                              k.persen >= 80
                                ? "#10b981"
                                : k.persen >= 50
                                  ? "#f59e0b"
                                  : "#f43f5e",
                          }}
                        />
                      </div>
                      <span
                        className={`text-[10px] font-black w-8 text-right ${k.persen >= 80 ? "text-emerald-400" : k.persen >= 50 ? "text-amber-400" : "text-red-400"}`}
                      >
                        {k.persen}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PageCard>
        </div>
      </div>
    </PageShell>
  );
}
