"use client";

import { useState, useMemo } from "react";
import {
  Download,
  Database,
  Loader2,
  FileSpreadsheet,
  ChevronDown,
  Filter,
  SlidersHorizontal,
  Check,
  X,
} from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { SCHOOL } from "@/lib/school.config";
import {
  PageShell,
  PageHeader,
  PageCard,
  PageCardHeader,
  EmptyState,
} from "@/components/shared/PageShell";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// â”€â”€ Semua kolom siswa yang tersedia â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ALL_SISWA_COLS = [
  { key: "nama", label: "Nama Lengkap", group: "Identitas" },
  { key: "nisn", label: "NISN", group: "Identitas" },
  { key: "nik", label: "NIK", group: "Identitas" },
  { key: "no_kk", label: "No. KK", group: "Identitas" },
  { key: "jk", label: "Jenis Kelamin", group: "Identitas" },
  { key: "tempat_lahir", label: "Tempat Lahir", group: "Identitas" },
  { key: "tanggal_lahir", label: "Tanggal Lahir", group: "Identitas" },
  { key: "agama", label: "Agama", group: "Identitas" },
  { key: "kelas", label: "Kelas", group: "Akademik" },
  { key: "tahun_masuk", label: "Tahun Masuk", group: "Akademik" },
  { key: "status_siswa", label: "Status Siswa", group: "Akademik" },
  { key: "asal_sekolah", label: "Asal Sekolah", group: "Akademik" },
  { key: "alamat", label: "Alamat", group: "Domisili" },
  { key: "rt", label: "RT", group: "Domisili" },
  { key: "rw", label: "RW", group: "Domisili" },
  { key: "kelurahan", label: "Kelurahan", group: "Domisili" },
  { key: "kecamatan", label: "Kecamatan", group: "Domisili" },
  { key: "kode_pos", label: "Kode Pos", group: "Domisili" },
  { key: "jenis_tinggal", label: "Jenis Tinggal", group: "Domisili" },
  { key: "alat_transportasi", label: "Transportasi", group: "Domisili" },
  { key: "no_wa", label: "No. WA", group: "Kontak" },
  { key: "telepon", label: "Telepon", group: "Kontak" },
  { key: "email", label: "Email", group: "Kontak" },
  { key: "nama_ayah", label: "Nama Ayah", group: "Orang Tua" },
  { key: "pekerjaan_ayah", label: "Pekerjaan Ayah", group: "Orang Tua" },
  { key: "nama_ibu", label: "Nama Ibu", group: "Orang Tua" },
  { key: "pekerjaan_ibu", label: "Pekerjaan Ibu", group: "Orang Tua" },
  { key: "nama_wali", label: "Nama Wali", group: "Orang Tua" },
  { key: "tinggi_badan", label: "Tinggi Badan", group: "Fisik" },
  { key: "berat_badan", label: "Berat Badan", group: "Fisik" },
  { key: "lingkar_kepala", label: "Lingkar Kepala", group: "Fisik" },
  { key: "penerima_kip", label: "Penerima KIP", group: "Sosial" },
  { key: "no_kip", label: "No. KIP", group: "Sosial" },
  { key: "layak_pip", label: "Layak PIP", group: "Sosial" },
];

const COL_GROUPS = [
  "Identitas",
  "Akademik",
  "Domisili",
  "Kontak",
  "Orang Tua",
  "Fisik",
  "Sosial",
];

const PRESETS: Record<string, string[]> = {
  basic: ["nama", "nisn", "kelas", "jk", "no_wa"],
  dapodik: [
    "nama",
    "nisn",
    "nik",
    "no_kk",
    "tempat_lahir",
    "tanggal_lahir",
    "jk",
    "agama",
    "alamat",
    "rt",
    "rw",
    "kelurahan",
    "kecamatan",
    "kode_pos",
    "jenis_tinggal",
    "alat_transportasi",
    "nama_ayah",
    "nama_ibu",
    "kelas",
  ],
  lengkap: ALL_SISWA_COLS.map((c) => c.key),
};

const loadSavedCols = (): string[] => {
  try {
    return (
      JSON.parse(localStorage.getItem("ekspor_siswa_cols") || "null") ||
      PRESETS.dapodik
    );
  } catch {
    return PRESETS.dapodik;
  }
};

const MODULES = [
  {
    id: "siswa",
    label: "Data Siswa",
    desc: "Buku induk siswa aktif",
    accent: "#8b5cf6",
  },
  {
    id: "prestasi",
    label: "Prestasi Siswa",
    desc: "Rekap capaian prestasi",
    accent: "#f59e0b",
    fields: [
      "nama",
      "nisn",
      "kelas",
      "jenis_lomba",
      "tingkat",
      "peringkat",
      "tanggal_lomba",
      "penyelenggara",
    ],
    fieldLabels: [
      "Nama",
      "NISN",
      "Kelas",
      "Jenis Lomba",
      "Tingkat",
      "Peringkat",
      "Tgl Lomba",
      "Penyelenggara",
    ],
  },
  {
    id: "mutasi_masuk",
    label: "Mutasi Masuk",
    desc: "Siswa pindahan masuk",
    accent: "#10b981",
    fields: [
      "nama",
      "nisn",
      "kelas",
      "asal_sekolah",
      "tanggal_masuk",
      "alasan",
      "keterangan",
    ],
    fieldLabels: [
      "Nama",
      "NISN",
      "Kelas",
      "Asal Sekolah",
      "Tgl Masuk",
      "Alasan",
      "Keterangan",
    ],
  },
  {
    id: "mutasi_keluar",
    label: "Mutasi Keluar",
    desc: "Siswa pindahan keluar",
    accent: "#f43f5e",
    fields: [
      "nama",
      "nisn",
      "kelas",
      "sekolah_tujuan",
      "tanggal_keluar",
      "alasan",
      "keterangan",
    ],
    fieldLabels: [
      "Nama",
      "NISN",
      "Kelas",
      "Sekolah Tujuan",
      "Tgl Keluar",
      "Alasan",
      "Keterangan",
    ],
  },
  {
    id: "alumni",
    label: "Data Alumni",
    desc: "Lulusan & tracer study",
    accent: "#22d3ee",
    fields: [
      "nama",
      "nisn",
      "jk",
      "tahun_lulus",
      "no_ijazah",
      "sekolah_lanjutan",
      "no_wa",
    ],
    fieldLabels: [
      "Nama",
      "NISN",
      "JK",
      "Tahun Lulus",
      "No Ijazah",
      "Sekolah Lanjutan",
      "No WA",
    ],
  },
];

export default function EksporPage() {
  const {
    dataSiswa,
    dataPrestasi,
    dataMutasiMasuk,
    dataMutasiKeluar,
    dataAlumni,
  } = useAppStore();
  const KUMPULAN_KELAS = Array.from(new Set(dataSiswa.map((s) => s.kelas)))
    .filter((k): k is string => !!k)
    .sort();

  const [selectedModule, setSelectedModule] = useState("siswa");
  const [filterKelas, setFilterKelas] = useState("all");
  const [filterJK, setFilterJK] = useState("all");
  const [loading, setLoading] = useState(false);

  // â”€â”€ Kolom custom untuk modul siswa â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [selectedCols, setSelectedCols] = useState<string[]>(() =>
    loadSavedCols(),
  );
  const [showColModal, setShowColModal] = useState(false);
  const [tempCols, setTempCols] = useState<string[]>([]);

  const module = MODULES.find((m) => m.id === selectedModule)!;

  // Kolom aktif (untuk siswa pakai selectedCols, lainnya pakai fields modul)
  const activeCols =
    selectedModule === "siswa" ? selectedCols : (module as any).fields || [];
  const activeLabels =
    selectedModule === "siswa"
      ? selectedCols.map(
          (k) => ALL_SISWA_COLS.find((c) => c.key === k)?.label ?? k,
        )
      : (module as any).fieldLabels || [];

  const sourceData = useMemo((): Record<string, unknown>[] => {
    const map: Record<string, unknown[]> = {
      siswa: dataSiswa,
      prestasi: dataPrestasi,
      mutasi_masuk: dataMutasiMasuk,
      mutasi_keluar: dataMutasiKeluar,
      alumni: dataAlumni,
    };
    return (map[selectedModule] || []) as Record<string, unknown>[];
  }, [
    selectedModule,
    dataSiswa,
    dataPrestasi,
    dataMutasiMasuk,
    dataMutasiKeluar,
    dataAlumni,
  ]);

  const filteredData = useMemo(() => {
    let data = [...sourceData];
    if (selectedModule === "siswa") {
      if (filterKelas !== "all")
        data = data.filter((d) => d.kelas === filterKelas);
      if (filterJK !== "all") data = data.filter((d) => d.jk === filterJK);
    }
    return data;
  }, [sourceData, selectedModule, filterKelas, filterJK]);

  const applyPreset = (preset: keyof typeof PRESETS) => {
    setTempCols([...PRESETS[preset]]);
  };

  const openColModal = () => {
    setTempCols([...selectedCols]);
    setShowColModal(true);
  };

  const saveColModal = () => {
    if (tempCols.length === 0) {
      toast.error("Pilih minimal 1 kolom");
      return;
    }
    setSelectedCols(tempCols);
    try {
      localStorage.setItem("ekspor_siswa_cols", JSON.stringify(tempCols));
    } catch {}
    setShowColModal(false);
    toast.success(`${tempCols.length} kolom dipilih`);
  };

  const toggleCol = (key: string) => {
    setTempCols((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const toggleGroup = (group: string) => {
    const groupKeys = ALL_SISWA_COLS.filter((c) => c.group === group).map(
      (c) => c.key,
    );
    const allSelected = groupKeys.every((k) => tempCols.includes(k));
    if (allSelected)
      setTempCols((prev) => prev.filter((k) => !groupKeys.includes(k)));
    else setTempCols((prev) => [...new Set([...prev, ...groupKeys])]);
  };

  const handleExport = async () => {
    if (!filteredData.length) {
      toast.error("Tidak ada data");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    const rows = filteredData.map((item, i) => {
      const row: Record<string, unknown> = { No: i + 1 };
      activeCols.forEach((f: string, fi: number) => {
        row[activeLabels[fi]] = item[f] ?? "";
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, module.label);
    XLSX.writeFile(wb, `Ekspor_${module.label.replace(/\s/g, "_")}.xlsx`);
    toast.success(
      `${module.label} (${filteredData.length} data, ${activeCols.length} kolom) berhasil diunduh`,
    );
    setLoading(false);
  };

  return (
    <PageShell>
      <PageHeader
        icon={<Database className="w-6 h-6 text-cyan-400" />}
        title="Ekspor Data"
        subtitle={`${SCHOOL.nama} — Unduh data ke Excel`}
        gradient="linear-gradient(135deg, #00141e 0%, #0c0820 50%, #050d1e 100%)"
        glowColor="rgba(34,211,238,0.28)"
        action={
          <button
            onClick={handleExport}
            disabled={loading || !filteredData.length}
            className="h-9 px-5 rounded-xl text-[12px] font-bold flex items-center gap-2 text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              boxShadow: "0 4px 14px rgba(14,165,233,0.3)",
            }}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {loading
              ? "Memproses..."
              : `Unduh (${filteredData.length} data · ${activeCols.length} kolom)`}
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Modul selector */}
        <div className="lg:col-span-4 space-y-2">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-3">
            Pilih Modul
          </p>
          {MODULES.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setSelectedModule(m.id);
                setFilterKelas("all");
                setFilterJK("all");
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-left"
              style={{
                background:
                  selectedModule === m.id
                    ? `${m.accent}10`
                    : "rgba(255,255,255,0.02)",
                border: `1px solid ${selectedModule === m.id ? `${m.accent}30` : "rgba(255,255,255,0.05)"}`,
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${m.accent}14` }}
              >
                <FileSpreadsheet
                  className="w-4 h-4"
                  style={{ color: m.accent }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-[13px] font-bold ${selectedModule === m.id ? "text-white/90" : "text-white/50"}`}
                >
                  {m.label}
                </p>
                <p className="text-[10px] text-white/25">{m.desc}</p>
              </div>
              {selectedModule === m.id && (
                <span className="text-[10px] font-black text-white/30">
                  {filteredData.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="lg:col-span-8 space-y-4">
          {/* Filter baris (khusus siswa) */}
          {selectedModule === "siswa" && (
            <PageCard>
              <div className="flex items-center gap-3 flex-wrap">
                <Filter className="w-4 h-4 text-white/30" />
                <span className="text-[11px] font-bold text-white/40">
                  Filter Baris:
                </span>
                <div className="relative">
                  <select
                    value={filterKelas}
                    onChange={(e) => setFilterKelas(e.target.value)}
                    className="h-9 appearance-none rounded-xl px-3 pr-8 text-[12px] text-white/60 outline-none"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <option value="all">Semua Kelas</option>
                    {KUMPULAN_KELAS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-2.5 w-3 h-3 text-white/25 pointer-events-none" />
                </div>
                <div className="relative">
                  <select
                    value={filterJK}
                    onChange={(e) => setFilterJK(e.target.value)}
                    className="h-9 appearance-none rounded-xl px-3 pr-8 text-[12px] text-white/60 outline-none"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <option value="all">Semua Gender</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-2.5 w-3 h-3 text-white/25 pointer-events-none" />
                </div>
              </div>
            </PageCard>
          )}

          {/* Kolom selector (khusus siswa) */}
          {selectedModule === "siswa" && (
            <PageCard>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-white/30" />
                  <span className="text-[11px] font-bold text-white/40">
                    Preset Kolom:
                  </span>
                  {(["basic", "dapodik", "lengkap"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setSelectedCols(PRESETS[p]);
                        try {
                          localStorage.setItem(
                            "ekspor_siswa_cols",
                            JSON.stringify(PRESETS[p]),
                          );
                        } catch {}
                      }}
                      className="h-7 px-3 rounded-lg text-[10px] font-bold transition-all border capitalize"
                      style={{
                        background:
                          JSON.stringify(selectedCols) ===
                          JSON.stringify(PRESETS[p])
                            ? "rgba(139,92,246,0.2)"
                            : "rgba(255,255,255,0.04)",
                        borderColor:
                          JSON.stringify(selectedCols) ===
                          JSON.stringify(PRESETS[p])
                            ? "rgba(139,92,246,0.4)"
                            : "rgba(255,255,255,0.08)",
                        color:
                          JSON.stringify(selectedCols) ===
                          JSON.stringify(PRESETS[p])
                            ? "#a78bfa"
                            : "rgba(255,255,255,0.4)",
                      }}
                    >
                      {p === "basic"
                        ? `Basic (${PRESETS.basic.length})`
                        : p === "dapodik"
                          ? `Dapodik (${PRESETS.dapodik.length})`
                          : `Lengkap (${PRESETS.lengkap.length})`}
                    </button>
                  ))}
                </div>
                <button
                  onClick={openColModal}
                  className="h-8 px-3 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-all"
                >
                  <SlidersHorizontal className="w-3 h-3" /> Kustom (
                  {selectedCols.length} kolom)
                </button>
              </div>
            </PageCard>
          )}

          {/* Preview kolom */}
          <PageCard>
            <PageCardHeader
              title="Kolom yang diekspor"
              subtitle={`${activeCols.length} kolom`}
              icon={<FileSpreadsheet className="w-4 h-4" />}
            />
            <div className="pt-4 flex flex-wrap gap-2">
              {activeLabels.map((label: string, i: number) => (
                <span
                  key={i}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
                  style={{
                    background: `${module.accent}10`,
                    color: `${module.accent}cc`,
                    border: `1px solid ${module.accent}20`,
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </PageCard>

          {/* Preview data */}
          <PageCard noPad>
            <PageCardHeader
              title={`Preview — ${module.label}`}
              subtitle={`${filteredData.length} data siap ekspor`}
              icon={<Database className="w-4 h-4" />}
            />
            {filteredData.length === 0 ? (
              <EmptyState
                icon={<Database className="w-7 h-7" />}
                title="Tidak ada data" variant="search"
                subtitle="Coba ubah filter atau modul"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-widest text-white/25">
                        No
                      </th>
                      {activeLabels.slice(0, 4).map((l: string) => (
                        <th
                          key={l}
                          className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-widest text-white/25"
                        >
                          {l}
                        </th>
                      ))}
                      {activeLabels.length > 4 && (
                        <th className="px-4 py-3 text-[9px] text-white/15">
                          +{activeLabels.length - 4} lagi
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.slice(0, 5).map((item, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                        }}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 py-3 text-[11px] text-white/25 font-bold">
                          {i + 1}
                        </td>
                        {activeCols.slice(0, 4).map((f: string) => (
                          <td
                            key={f}
                            className="px-4 py-3 text-[12px] text-white/60 max-w-[120px] truncate"
                          >
                            {String(item[f] ?? "—")}
                          </td>
                        ))}
                        {activeCols.length > 4 && (
                          <td className="px-4 py-3 text-[11px] text-white/20">
                            ...
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredData.length > 5 && (
                  <p className="px-4 py-3 text-center text-[11px] text-white/20">
                    ... dan {filteredData.length - 5} data lainnya
                  </p>
                )}
              </div>
            )}
          </PageCard>
        </div>
      </div>

      {/* â”€â”€ Modal Pilih Kolom â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showColModal && (
        <>
          <div
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            onClick={() => setShowColModal(false)}
          />
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="pointer-events-auto w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl border border-white/10 shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #0f0c1a, #0c0820)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 flex-shrink-0">
                <div>
                  <h3 className="text-white font-semibold">
                    Pilih Kolom Ekspor
                  </h3>
                  <p className="text-white/40 text-xs mt-0.5">
                    {tempCols.length} kolom dipilih dari {ALL_SISWA_COLS.length}
                  </p>
                </div>
                <button
                  onClick={() => setShowColModal(false)}
                  className="text-white/40 hover:text-white/70 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Preset pills */}
              <div className="px-5 py-3 border-b border-white/5 flex gap-2 flex-shrink-0">
                <span className="text-xs text-white/30 self-center">
                  Preset:
                </span>
                {(["basic", "dapodik", "lengkap"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => applyPreset(p)}
                    className="h-7 px-3 rounded-lg text-[10px] font-bold border border-white/10 text-white/50 hover:text-white hover:border-white/25 transition-all capitalize"
                  >
                    {p} ({PRESETS[p].length})
                  </button>
                ))}
              </div>

              {/* Kolom per group */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {COL_GROUPS.map((group) => {
                  const groupCols = ALL_SISWA_COLS.filter(
                    (c) => c.group === group,
                  );
                  const allSelected = groupCols.every((c) =>
                    tempCols.includes(c.key),
                  );
                  return (
                    <div key={group}>
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => toggleGroup(group)}
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${allSelected ? "bg-violet-500 border-violet-500" : "border-white/20"}`}
                        >
                          {allSelected && (
                            <Check size={10} className="text-white" />
                          )}
                        </button>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                          {group}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {groupCols.map((col) => {
                          const isSelected = tempCols.includes(col.key);
                          return (
                            <button
                              key={col.key}
                              onClick={() => toggleCol(col.key)}
                              className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium border transition-all"
                              style={{
                                background: isSelected
                                  ? "rgba(139,92,246,0.15)"
                                  : "rgba(255,255,255,0.03)",
                                borderColor: isSelected
                                  ? "rgba(139,92,246,0.4)"
                                  : "rgba(255,255,255,0.07)",
                                color: isSelected
                                  ? "#a78bfa"
                                  : "rgba(255,255,255,0.4)",
                              }}
                            >
                              {isSelected && <Check size={10} />}
                              {col.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-white/8 flex justify-between items-center flex-shrink-0">
                <p className="text-xs text-white/30">
                  {tempCols.length} kolom dipilih
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowColModal(false)}
                    className="px-4 py-2 rounded-xl text-sm text-white/40 hover:text-white/60 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={saveColModal}
                    className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                    }}
                  >
                    Terapkan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}
