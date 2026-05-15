"use client";

import { useState, useMemo } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { useSiswa } from "@/hooks/useSiswa";
import type { Siswa } from "@/types";
import {
  PageShell,
  PageHeader,
  StatCards,
  PageCard,
  AuroraTable,
  ATRow,
  ATCell,
  SearchBar,
  EmptyState,
  usePagination,
  AuroraPagination,
} from "@/components/shared/PageShell";

const REQUIRED_FIELDS: { key: keyof Siswa; label: string }[] = [
  { key: "nama", label: "Nama" },
  { key: "nisn", label: "NISN" },
  { key: "nik", label: "NIK" },
  { key: "no_kk", label: "No. KK" },
  { key: "tempat_lahir", label: "Tempat Lahir" },
  { key: "tanggal_lahir", label: "Tgl Lahir" },
  { key: "jk", label: "JK" },
  { key: "agama", label: "Agama" },
  { key: "alamat", label: "Alamat" },
  { key: "rt", label: "RT" },
  { key: "rw", label: "RW" },
  { key: "kelurahan", label: "Kelurahan" },
  { key: "kecamatan", label: "Kecamatan" },
  { key: "kode_pos", label: "Kode Pos" },
  { key: "jenis_tinggal", label: "Jenis Tinggal" },
  { key: "alat_transportasi", label: "Transportasi" },
  { key: "nama_ayah", label: "Nama Ayah" },
  { key: "nama_ibu", label: "Nama Ibu" },
  { key: "kelas", label: "Kelas" },
];

interface ValidasiResult {
  siswa: Siswa;
  missing: string[];
  score: number;
}

export default function DapodikPage() {
  const { data: dataSiswa, isLoading, refetch } = useSiswa();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "valid" | "incomplete"
  >("all");

  const validasi: ValidasiResult[] = useMemo(
    () =>
      dataSiswa.map((s) => {
        const missing = REQUIRED_FIELDS.filter((f) => {
          const v = s[f.key];
          return !v || (typeof v === "string" && v.trim() === "");
        }).map((f) => f.label);
        const score = Math.round(
          ((REQUIRED_FIELDS.length - missing.length) / REQUIRED_FIELDS.length) *
            100,
        );
        return { siswa: s, missing, score };
      }),
    [dataSiswa],
  );

  const filtered = validasi.filter((v) => {
    const ms =
      !search ||
      v.siswa.nama?.toLowerCase().includes(search.toLowerCase()) ||
      (v.siswa.nisn?.includes(search) ?? false);
    const mf =
      filterStatus === "all" ||
      (filterStatus === "valid" && v.score === 100) ||
      (filterStatus === "incomplete" && v.score < 100);
    return ms && mf;
  });

  const avgScore =
    validasi.length > 0
      ? Math.round(validasi.reduce((a, b) => a + b.score, 0) / validasi.length)
      : 0;
  const validCount = validasi.filter((v) => v.score === 100).length;
  const incompleteCount = validasi.filter((v) => v.score < 100).length;

  const FILTER_OPTS = [
    { key: "all" as const, label: "Semua" },
    { key: "valid" as const, label: "âœ… Lengkap" },
    { key: "incomplete" as const, label: "âš ï¸ Belum" },
  ];

  const pag = usePagination(filtered);

  return (
    <PageShell>
      <PageHeader
        icon={<ShieldCheck className="w-6 h-6 text-cyan-400" />}
        title="Dapodik Sync Validator"
        subtitle={`Audit kelengkapan ${REQUIRED_FIELDS.length} field wajib Dapodik pada seluruh data siswa`}
        gradient="linear-gradient(135deg, #001a1a 0%, #0c0820 50%, #050d1e 100%)"
        glowColor="rgba(6,182,212,0.28)"
        action={
          <button
            onClick={() => refetch()}
            className="btn-secondary btn-sm flex items-center gap-2"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        }
      />

      <StatCards
        items={[
          { label: "Total Siswa", value: validasi.length, color: "#a78bfa" },
          { label: "Data Lengkap", value: validCount, color: "#34d399" },
          { label: "Belum Lengkap", value: incompleteCount, color: "#fbbf24" },
          { label: "Skor Rata-rata", value: `${avgScore}%`, color: "#22d3ee" },
        ]}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Cari nama atau NISN..."
          />
        </div>
        <div className="flex gap-2">
          {FILTER_OPTS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilterStatus(opt.key)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={
                filterStatus === opt.key
                  ? {
                      background: "rgba(34,211,238,0.15)",
                      color: "#22d3ee",
                      border: "1px solid rgba(34,211,238,0.30)",
                    }
                  : {
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.40)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <PageCard noPad>
        <>
          <AuroraTable
            headers={[
              "No",
              "Nama Siswa",
              "NISN",
              "Kelas",
              "Skor Dapodik",
              "Field Kosong",
            ]}
            loading={isLoading}
            empty={
              filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<ShieldCheck className="w-7 h-7" />}
                      title="Tidak ada data yang cocok" variant="search"
                    />
                  </td>
                </tr>
              ) : undefined
            }
          >
            {pag.paginated.map((v, i) => (
              <ATRow key={v.siswa.id}>
                <ATCell className="text-white/25 font-mono text-xs">
                  {(pag.page - 1) * pag.perPage + i + 1}
                </ATCell>
                <ATCell className="font-semibold text-white/85">
                  {v.siswa.nama}
                </ATCell>
                <ATCell mono className="text-cyan-400 text-xs">
                  {v.siswa.nisn}
                </ATCell>
                <ATCell>
                  {v.siswa.kelas ? (
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                      style={{
                        background: "rgba(34,211,238,0.10)",
                        color: "#22d3ee",
                      }}
                    >
                      {v.siswa.kelas}
                    </span>
                  ) : (
                    <span className="text-white/25">—</span>
                  )}
                </ATCell>
                <ATCell>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-16 h-1.5 rounded-full overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${v.score}%`,
                          background:
                            v.score === 100
                              ? "#10b981"
                              : v.score >= 70
                                ? "#f59e0b"
                                : "#ef4444",
                        }}
                      />
                    </div>
                    <span
                      className={`text-xs font-bold ${v.score === 100 ? "text-emerald-400" : v.score >= 70 ? "text-amber-400" : "text-rose-400"}`}
                    >
                      {v.score}%
                    </span>
                  </div>
                </ATCell>
                <ATCell>
                  {v.missing.length === 0 ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Lengkap
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {v.missing.slice(0, 5).map((m) => (
                        <span
                          key={m}
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                          style={{
                            background: "rgba(244,63,94,0.10)",
                            color: "#fb7185",
                          }}
                        >
                          {m}
                        </span>
                      ))}
                      {v.missing.length > 5 && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white/30"
                          style={{ background: "rgba(255,255,255,0.05)" }}
                        >
                          +{v.missing.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </ATCell>
              </ATRow>
            ))}
          </AuroraTable>
          <AuroraPagination
            currentPage={pag.page}
            totalItems={pag.totalItems}
            perPage={pag.perPage}
            onPageChange={pag.setPage}
            onPerPageChange={pag.setPerPage}
          />
        </>
      </PageCard>
    </PageShell>
  );
}
