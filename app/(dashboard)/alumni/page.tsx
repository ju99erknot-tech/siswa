"use client";

import { useState } from "react";
import { GraduationCap, Plus, Telescope, Loader2, Trash2 } from "lucide-react";
import { useAlumni } from "@/hooks/useAlumni";
import { formatTanggal } from "@/lib/utils";
import {
  PageShell,
  PageHeader,
  StatCards,
  PageCard,
  AuroraTable,
  ATRow,
  ATCell,
  SearchBar,
  AuroraModal,
  AuroraInput,
  AuroraSelect,
  EmptyState,
  usePagination,
  AuroraPagination,
} from "@/components/shared/PageShell";
import { SCHOOL } from "@/lib/school.config";

import { AlumniTimeline } from "@/components/alumni/AlumniTimeline";
import { useSchoolConfig } from "@/hooks/useSchoolConfig";

export default function AlumniPage() {
  const config = useSchoolConfig();
  const { dataAlumni, isLoading, addAlumni, deleteAlumni } = useAlumni();
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<"timeline" | "table">("timeline");
  const [search, setSearch] = useState("");
  const [filterTahun, setFilterTahun] = useState("all");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nama: "",
    nisn: "",
    jk: "L" as "L" | "P",
    tahun_lulus: "",
    no_ijazah: "",
    skhun: "",
    sekolah_lanjutan: "",
    no_wa: "",
    keterangan: "",
  });

  const tahunList = Array.from(new Set(dataAlumni.map((a) => a.tahun_lulus)))
    .sort()
    .reverse();

  const filtered = dataAlumni.filter((a) => {
    const ms =
      !search ||
      a.nama.toLowerCase().includes(search.toLowerCase()) ||
      a.nisn.includes(search);
    const mt = filterTahun === "all" || a.tahun_lulus === filterTahun;
    return ms && mt;
  });

  const totalL = filtered.filter((a) => a.jk === "L").length;
  const totalP = filtered.filter((a) => a.jk === "P").length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama || !form.nisn) return;
    setSaving(true);
    const ok = await addAlumni(form);
    setSaving(false);
    if (ok) {
      setShowForm(false);
      setForm({
        nama: "",
        nisn: "",
        jk: "L",
        tahun_lulus: "",
        no_ijazah: "",
        skhun: "",
        sekolah_lanjutan: "",
        no_wa: "",
        keterangan: "",
      });
    }
  };

  const pag = usePagination(filtered);

  return (
    <PageShell>
      {/* Header */}
      <PageHeader
        icon={<GraduationCap className="w-6 h-6 text-violet-400" />}
        title="Alumni & Lulusan"
        subtitle={`Data lulusan ${SCHOOL.nama} per angkatan`}
        action={
          <div className="flex items-center gap-3">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mr-2">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "table" ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20" : "text-white/30 hover:text-white/60"}`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "timeline" ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20" : "text-white/30 hover:text-white/60"}`}
              >
                Timeline
              </button>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="btn-solid btn-sm flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Alumni
            </button>
          </div>
        }
      />

      {/* Stats */}
      <StatCards
        items={[
          { label: "Total Alumni", value: filtered.length, color: "#a78bfa" },
          { label: "Laki-laki", value: totalL, color: "#60a5fa" },
          { label: "Perempuan", value: totalP, color: "#f472b6" },
          { label: "Angkatan", value: tahunList.length, color: "#34d399" },
        ]}
      />

      {/* Filter */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Cari nama atau NISN alumni..."
        right={
          <select
            value={filterTahun}
            onChange={(e) => setFilterTahun(e.target.value)}
            className="h-10 px-4 rounded-xl text-sm outline-none appearance-none min-w-[160px]"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.75)",
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='rgba(255,255,255,0.35)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              paddingRight: "36px",
            }}
          >
            <option value="all">Semua Angkatan</option>
            {tahunList.map((t) => (
              <option key={t} value={t}>
                Lulus {t}
              </option>
            ))}
          </select>
        }
      />

      {/* Content Rendering */}
      {viewMode === "timeline" ? (
        <AlumniTimeline data={filtered} />
      ) : (
        <PageCard noPad>
          <>
            <AuroraTable
              headers={[
                "No",
                "Nama",
                "NISN",
                "JK",
                "Tahun Lulus",
                "Sekolah Lanjutan",
                "No. Ijazah",
                "Aksi",
              ]}
              loading={isLoading}
              empty={
                filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        icon={<GraduationCap className="w-7 h-7" />}
                        title="Belum ada data alumni" actionLabel="Tambah Alumni" onAction={() => setShowForm(true)}
                        subtitle="Klik Tambah Alumni untuk menambahkan data"
                      />
                    </td>
                  </tr>
                ) : undefined
              }
            >
              {pag.paginated.map((a, i) => (
                <ATRow key={a.id}>
                  <ATCell className="text-white/25 font-mono text-xs w-12">
                    {(pag.page - 1) * pag.perPage + i + 1}
                  </ATCell>
                  <ATCell className="font-semibold text-white/85">
                    {a.nama}
                  </ATCell>
                  <ATCell mono className="text-cyan-400 text-xs">
                    {a.nisn}
                  </ATCell>
                  <ATCell>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={
                        a.jk === "L"
                          ? {
                              background: "rgba(96,165,250,0.12)",
                              color: "#60a5fa",
                            }
                          : {
                              background: "rgba(244,114,182,0.12)",
                              color: "#f472b6",
                            }
                      }
                    >
                      {a.jk === "L" ? "L" : "P"}
                    </span>
                  </ATCell>
                  <ATCell className="font-bold text-violet-400">
                    {a.tahun_lulus}
                  </ATCell>
                  <ATCell className="text-white/45 text-xs max-w-[180px] truncate">
                    {a.sekolah_lanjutan || "—"}
                  </ATCell>
                  <ATCell mono className="text-white/30 text-xs">
                    {a.no_ijazah || "—"}
                  </ATCell>
                  <ATCell>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus data "${a.nama}"?`))
                          deleteAlumni(a.id, a.nisn);
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-400/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
      )}

      {/* Modal: Tambah Alumni */}
      <AuroraModal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Tambah Alumni"
        icon={<GraduationCap className="w-5 h-5" />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuroraInput
            label="Nama Lengkap *"
            required
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            placeholder="Nama lengkap siswa"
          />
          <div className="grid grid-cols-2 gap-4">
            <AuroraInput
              label="NISN *"
              required
              maxLength={10}
              value={form.nisn}
              onChange={(e) => setForm({ ...form, nisn: e.target.value })}
              placeholder="0012345678"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            />
            <AuroraSelect
              label="Jenis Kelamin"
              value={form.jk}
              onChange={(e) =>
                setForm({ ...form, jk: e.target.value as "L" | "P" })
              }
            >
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </AuroraSelect>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <AuroraInput
              label="Tahun Lulus"
              value={form.tahun_lulus}
              onChange={(e) =>
                setForm({ ...form, tahun_lulus: e.target.value })
              }
              placeholder="2026"
            />
            <AuroraInput
              label="No. Ijazah"
              value={form.no_ijazah}
              onChange={(e) => setForm({ ...form, no_ijazah: e.target.value })}
            />
          </div>
          <AuroraInput
            label="Sekolah Lanjutan (SMP)"
            value={form.sekolah_lanjutan}
            onChange={(e) =>
              setForm({ ...form, sekolah_lanjutan: e.target.value })
            }
            placeholder={`SMP Negeri 1 ${config.kotaSekolah}`}
          />
          <div className="grid grid-cols-2 gap-4">
            <AuroraInput
              label="No. WhatsApp"
              value={form.no_wa}
              onChange={(e) => setForm({ ...form, no_wa: e.target.value })}
              placeholder="08xxxxxxxxxx"
            />
            <AuroraInput
              label="SKHUN"
              value={form.skhun}
              onChange={(e) => setForm({ ...form, skhun: e.target.value })}
            />
          </div>
          <button
            type="submit"
            disabled={saving || !form.nama || !form.nisn}
            className="btn-solid btn-block h-11 flex items-center justify-center gap-2 mt-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GraduationCap className="w-4 h-4" />
            )}
            {saving ? "Menyimpan..." : "Simpan Data Alumni"}
          </button>
        </form>
      </AuroraModal>
    </PageShell>
  );
}
