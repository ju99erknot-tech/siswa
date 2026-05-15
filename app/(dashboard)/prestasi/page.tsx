"use client";

import { useState, useMemo } from "react";
import {
  Trophy,
  Plus,
  Loader2,
  Trash2,
  Star,
  Pencil,
  Download,
  X,
} from "lucide-react";
import { usePrestasi } from "@/hooks/usePrestasi";
import { formatTanggal } from "@/lib/utils";
import { TINGKAT_PRESTASI, PERINGKAT_PRESTASI } from "@/types";
import type { TingkatPrestasi, PeringkatPrestasi, Prestasi } from "@/types";
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
import { SiswaPicker } from "@/components/shared/SiswaPicker";
import type { Siswa } from "@/types";
import { SCHOOL } from "@/lib/school.config";
import { useAppStore } from "@/store/app.store";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const TINGKAT_COLOR: Record<string, { bg: string; color: string }> = {
  Sekolah: { bg: "rgba(148,163,184,0.12)", color: "#94a3b8" },
  Kecamatan: { bg: "rgba(52,211,153,0.12)", color: "#34d399" },
  "Kabupaten/Kota": { bg: "rgba(34,211,238,0.12)", color: "#22d3ee" },
  Provinsi: { bg: "rgba(167,139,250,0.12)", color: "#a78bfa" },
  Nasional: { bg: "rgba(251,191,36,0.12)", color: "#fbbf24" },
  Internasional: { bg: "rgba(244,63,94,0.15)", color: "#fb7185" },
};

const emptyForm = {
  nama: "",
  nisn: "",
  kelas: "",
  jenis_lomba: "",
  tingkat: "Sekolah" as TingkatPrestasi,
  peringkat: "Juara 1" as PeringkatPrestasi,
  tanggal_lomba: "",
  penyelenggara: "",
  keterangan: "",
};

export default function PrestasiPage() {
  const { dataSiswa } = useAppStore();
  const { dataPrestasi, isLoading, addPrestasi, deletePrestasi } =
    usePrestasi();
  const supabase = createClient();

  const [showForm, setShowForm] = useState(false);
  const [editingPrestasi, setEditingPrestasi] = useState<Prestasi | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Prestasi | null>(null);
  const [search, setSearch] = useState("");
  const [filterTingkat, setFilterTingkat] = useState("all");
  const [filterTahun, setFilterTahun] = useState("all");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [form, setForm] = useState(emptyForm);

  // â”€â”€ Tahun unik dari data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const tahunList = useMemo(() => {
    const years = dataPrestasi
      .map((p) =>
        p.tanggal_lomba ? new Date(p.tanggal_lomba).getFullYear() : null,
      )
      .filter((y): y is number => y !== null);
    return [...new Set(years)].sort((a, b) => b - a);
  }, [dataPrestasi]);

  const currentYear = new Date().getFullYear();

  const filtered = useMemo(
    () =>
      dataPrestasi.filter((p) => {
        const ms =
          !search ||
          p.nama.toLowerCase().includes(search.toLowerCase()) ||
          p.jenis_lomba?.toLowerCase().includes(search.toLowerCase());
        const mt = filterTingkat === "all" || p.tingkat === filterTingkat;
        const my =
          filterTahun === "all" ||
          (p.tanggal_lomba &&
            new Date(p.tanggal_lomba).getFullYear() === parseInt(filterTahun));
        return ms && mt && my;
      }),
    [dataPrestasi, search, filterTingkat, filterTahun],
  );

  // â”€â”€ Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const juaraSatu = filtered.filter((p) => p.peringkat === "Juara 1").length;
  const nasionalUp = filtered.filter((p) =>
    ["Nasional", "Internasional"].includes(p.tingkat),
  ).length;
  const tahunIni = dataPrestasi.filter(
    (p) =>
      p.tanggal_lomba &&
      new Date(p.tanggal_lomba).getFullYear() === currentYear,
  ).length;
  const siswaBerprestasi = new Set(
    dataPrestasi.map((p) => p.nisn).filter(Boolean),
  ).size;

  const pag = usePagination(filtered);

  // â”€â”€ Open add â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openAdd = () => {
    setEditingPrestasi(null);
    setSelectedSiswa(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  // â”€â”€ Open edit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openEdit = (p: Prestasi) => {
    setEditingPrestasi(p);
    setSelectedSiswa(dataSiswa.find((s) => s.nisn === p.nisn) || null);
    setForm({
      nama: p.nama || "",
      nisn: p.nisn || "",
      kelas: p.kelas || "",
      jenis_lomba: p.jenis_lomba || "",
      tingkat: (p.tingkat as TingkatPrestasi) || "Sekolah",
      peringkat: (p.peringkat as PeringkatPrestasi) || "Juara 1",
      tanggal_lomba: p.tanggal_lomba || "",
      penyelenggara: p.penyelenggara || "",
      keterangan: p.keterangan || "",
    });
    setShowForm(true);
  };

  // â”€â”€ Submit (add or edit) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiswa && !editingPrestasi) {
      toast.error("Pilih siswa terlebih dahulu");
      return;
    }
    if (!form.jenis_lomba) {
      toast.error("Jenis lomba wajib diisi");
      return;
    }
    setSaving(true);
    try {
      if (editingPrestasi) {
        const { error } = await supabase
          .from("prestasi")
          .update({
            ...form,
            nama: selectedSiswa?.nama || editingPrestasi.nama,
            nisn: selectedSiswa?.nisn || editingPrestasi.nisn,
            kelas: selectedSiswa?.kelas || editingPrestasi.kelas,
          })
          .eq("id", editingPrestasi.id);
        if (error) throw error;
        toast.success("Prestasi diperbarui!");
        setShowForm(false);
      } else if (selectedSiswa) {
        const ok = await addPrestasi({
          ...form,
          nama: selectedSiswa.nama,
          nisn: selectedSiswa.nisn || "",
          kelas: selectedSiswa.kelas || "",
        });
        if (ok) setShowForm(false);
      }
    } catch (err: unknown) {
      toast.error("Gagal: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // â”€â”€ Delete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deletePrestasi(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  // â”€â”€ Export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleExport = () => {
    if (!filtered.length) {
      toast.error("Tidak ada data");
      return;
    }
    const rows = filtered.map((p, i) => ({
      No: i + 1,
      "Nama Siswa": p.nama,
      Kelas: p.kelas || "-",
      NISN: p.nisn || "-",
      "Jenis Lomba": p.jenis_lomba || "-",
      Tingkat: p.tingkat,
      Peringkat: p.peringkat,
      Tanggal: p.tanggal_lomba ? formatTanggal(p.tanggal_lomba) : "-",
      Penyelenggara: p.penyelenggara || "-",
      Keterangan: p.keterangan || "-",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Prestasi");
    XLSX.writeFile(wb, `Prestasi_${SCHOOL.nama.replace(/\s/g, "_")}.xlsx`);
    toast.success(`${filtered.length} data prestasi berhasil diunduh`);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPrestasi(null);
    setSelectedSiswa(null);
    setForm(emptyForm);
  };

  return (
    <PageShell>
      <PageHeader
        icon={<Trophy className="w-6 h-6 text-amber-400" />}
        title="Buku Prestasi Siswa"
        subtitle={`Catatan pencapaian dan penghargaan siswa ${SCHOOL.nama}`}
        gradient="linear-gradient(135deg, #2d1a00 0%, #0c0820 50%, #050d1e 100%)"
        glowColor="rgba(245,158,11,0.30)"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="btn-sm flex items-center gap-2 border border-white/10 text-white/50 hover:text-white/80 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Ekspor
            </button>
            <button
              onClick={openAdd}
              className="btn-solid btn-sm flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah
            </button>
          </div>
        }
      />

      <StatCards
        items={[
          { label: "Total Prestasi", value: filtered.length, color: "#a78bfa" },
          { label: "Juara 1", value: juaraSatu, color: "#fbbf24" },
          { label: "Nasional+", value: nasionalUp, color: "#fb7185" },
          { label: "Tahun Ini", value: tahunIni, color: "#22d3ee" },
          {
            label: "Siswa Berprestasi",
            value: siswaBerprestasi,
            color: "#34d399",
          },
        ]}
      />

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Cari nama siswa atau jenis lomba..."
        right={
          <div className="flex items-center gap-2">
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="h-10 px-3 rounded-xl text-sm outline-none min-w-[120px]"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.75)",
                appearance: "none",
              }}
            >
              <option value="all">Semua Tahun</option>
              {tahunList.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              value={filterTingkat}
              onChange={(e) => setFilterTingkat(e.target.value)}
              className="h-10 px-4 rounded-xl text-sm outline-none min-w-[160px]"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.75)",
                appearance: "none",
              }}
            >
              <option value="all">Semua Tingkat</option>
              {TINGKAT_PRESTASI.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <PageCard noPad>
        <>
          <AuroraTable
            headers={[
              "No",
              "Nama Siswa",
              "Kelas",
              "Jenis Lomba",
              "Tingkat",
              "Peringkat",
              "Tanggal",
              "Aksi",
            ]}
            loading={isLoading}
            empty={
              filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={<Trophy className="w-7 h-7" />}
                      title="Belum ada data prestasi" variant="search"
                      subtitle="Tambahkan prestasi siswa pertama"
                    />
                  </td>
                </tr>
              ) : undefined
            }
          >
            {pag.paginated.map((p, i) => {
              const tc = TINGKAT_COLOR[p.tingkat] || {
                bg: "rgba(139,92,246,0.12)",
                color: "#a78bfa",
              };
              return (
                <ATRow key={p.id}>
                  <ATCell className="text-white/25 font-mono text-xs w-12">
                    {(pag.page - 1) * pag.perPage + i + 1}
                  </ATCell>
                  <ATCell className="font-semibold text-white/85">
                    {p.nama}
                  </ATCell>
                  <ATCell>
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                      style={{
                        background: "rgba(139,92,246,0.10)",
                        color: "#a78bfa",
                      }}
                    >
                      {p.kelas}
                    </span>
                  </ATCell>
                  <ATCell className="text-white/60 text-xs">
                    {p.jenis_lomba}
                  </ATCell>
                  <ATCell>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={tc}
                    >
                      {p.tingkat}
                    </span>
                  </ATCell>
                  <ATCell>
                    <div className="flex items-center gap-1.5">
                      {p.peringkat === "Juara 1" && (
                        <Star className="w-3 h-3 text-amber-400" />
                      )}
                      <span className="text-[12px] font-semibold text-white/75">
                        {p.peringkat}
                      </span>
                    </div>
                  </ATCell>
                  <ATCell className="text-white/35 text-xs">
                    {p.tanggal_lomba ? formatTanggal(p.tanggal_lomba) : "—"}
                  </ATCell>
                  <ATCell>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-violet-400/50 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-400/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </ATCell>
                </ATRow>
              );
            })}
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

      {/* Add / Edit Modal */}
      <AuroraModal
        open={showForm}
        onClose={closeForm}
        title={editingPrestasi ? "Edit Prestasi" : "Tambah Prestasi"}
        icon={<Trophy className="w-5 h-5" />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <SiswaPicker
            value={selectedSiswa?.id || ""}
            onChange={(s) => setSelectedSiswa(s)}
            label={editingPrestasi ? `Siswa: ${editingPrestasi.nama}` : "Siswa"}
            required={!editingPrestasi}
          />
          <AuroraInput
            label="Jenis Lomba *"
            required
            value={form.jenis_lomba}
            onChange={(e) => setForm({ ...form, jenis_lomba: e.target.value })}
            placeholder="Lomba Matematika, Olimpiade Sains, dll."
          />
          <div className="grid grid-cols-2 gap-4">
            <AuroraSelect
              label="Tingkat"
              value={form.tingkat}
              onChange={(e) =>
                setForm({ ...form, tingkat: e.target.value as TingkatPrestasi })
              }
            >
              {TINGKAT_PRESTASI.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </AuroraSelect>
            <AuroraSelect
              label="Peringkat"
              value={form.peringkat}
              onChange={(e) =>
                setForm({
                  ...form,
                  peringkat: e.target.value as PeringkatPrestasi,
                })
              }
            >
              {PERINGKAT_PRESTASI.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </AuroraSelect>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <AuroraInput
              label="Tanggal Lomba"
              type="date"
              value={form.tanggal_lomba}
              onChange={(e) =>
                setForm({ ...form, tanggal_lomba: e.target.value })
              }
            />
            <AuroraInput
              label="Penyelenggara"
              value={form.penyelenggara}
              onChange={(e) =>
                setForm({ ...form, penyelenggara: e.target.value })
              }
            />
          </div>
          <AuroraInput
            label="Keterangan"
            value={form.keterangan}
            onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
          />
          <button
            type="submit"
            disabled={
              saving ||
              (!selectedSiswa && !editingPrestasi) ||
              !form.jenis_lomba
            }
            className="btn-solid btn-block h-11 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trophy className="w-4 h-4" />
            )}
            {saving
              ? "Menyimpan..."
              : editingPrestasi
                ? "Simpan Perubahan"
                : "Simpan Prestasi"}
          </button>
        </form>
      </AuroraModal>

      {/* Delete Confirmation Modal */}
      <AuroraModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Prestasi"
        size="sm"
        icon={<Trash2 className="w-4 h-4" />}
      >
        <div className="space-y-4">
          <p className="text-sm text-white/60">
            Yakin ingin menghapus prestasi{" "}
            <span className="text-white/80 font-semibold">
              "{deleteTarget?.jenis_lomba}"
            </span>{" "}
            milik{" "}
            <span className="text-amber-400 font-semibold">
              {deleteTarget?.nama}
            </span>
            ?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 h-10 rounded-xl text-sm font-medium text-white/50 hover:text-white/70 transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 text-rose-400 transition-all"
              style={{
                background: "rgba(244,63,94,0.12)",
                border: "1px solid rgba(244,63,94,0.25)",
              }}
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {deleting ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </div>
      </AuroraModal>
    </PageShell>
  );
}
