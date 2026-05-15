"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Loader2,
  Trash2,
  Pencil,
  X,
  Search,
  Calendar,
  Users,
  FileText,
  Filter,
} from "lucide-react";
import { useJurnal } from "@/hooks/useJurnal";
import { useAppStore } from "@/store/app.store";
import {
  PageShell,
  PageHeader,
  StatCards,
  PageCard,
  PageCardHeader,
  AuroraTable,
  ATRow,
  ATCell,
  EmptyState,
  SearchBar,
  usePagination,
  AuroraPagination,
} from "@/components/shared/PageShell";
import { SCHOOL } from "@/lib/school.config";
import { KUMPULAN_MAPEL } from "@/types";
import { formatTanggal } from "@/lib/utils";
import type { Jurnal } from "@/types";

export default function JurnalPage() {
  const { dataJurnal, isLoading, addJurnal, updateJurnal, deleteJurnal } =
    useJurnal();
  const { user, dataSiswa, dataGuru } = useAppStore();
  const isAdmin = user?.role === "admin";

  const KUMPULAN_KELAS = Array.from(new Set(dataSiswa.map((s) => s.kelas)))
    .filter((k): k is string => !!k)
    .sort();
  const DAFTAR_GURU = useMemo(
    () =>
      dataGuru
        .filter((g) => g.status_aktif)
        .map((g) => g.nama)
        .sort(),
    [dataGuru],
  );

  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState("all");
  const [filterGuru, setFilterGuru] = useState("all");
  const [filterBulan, setFilterBulan] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<Jurnal | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Form state
  const [formTanggal, setFormTanggal] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [formKelas, setFormKelas] = useState("");
  const [formMapel, setFormMapel] = useState("");
  const [formGuru, setFormGuru] = useState("");
  const [formMateri, setFormMateri] = useState("");
  const [formKeterangan, setFormKeterangan] = useState("");
  const [saving, setSaving] = useState(false);

  // Stats
  const totalJurnal = dataJurnal.length;
  const totalMapel = new Set(dataJurnal.map((j) => j.mata_pelajaran)).size;
  const totalGuru = new Set(dataJurnal.map((j) => j.nama_guru)).size;
  const bulanIni = dataJurnal.filter((j) => {
    const d = new Date(j.tanggal);
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;

  // Filter
  const filtered = useMemo(() => {
    return dataJurnal.filter((j) => {
      const matchSearch =
        j.materi.toLowerCase().includes(search.toLowerCase()) ||
        j.nama_guru.toLowerCase().includes(search.toLowerCase()) ||
        j.mata_pelajaran.toLowerCase().includes(search.toLowerCase());
      const matchKelas = filterKelas === "all" || j.kelas === filterKelas;
      const matchGuru = filterGuru === "all" || j.nama_guru === filterGuru;
      const matchBulan =
        filterBulan === "all" || j.tanggal.substring(0, 7) === filterBulan;
      return matchSearch && matchKelas && matchGuru && matchBulan;
    });
  }, [dataJurnal, search, filterKelas, filterGuru, filterBulan]);

  // Get unique months for filter
  const bulanOptions = useMemo(() => {
    const months = new Set(dataJurnal.map((j) => j.tanggal.substring(0, 7)));
    return Array.from(months).sort().reverse();
  }, [dataJurnal]);

  const openAdd = () => {
    setEditData(null);
    setFormTanggal(new Date().toISOString().split("T")[0]);
    setFormKelas(KUMPULAN_KELAS[0] || "");
    setFormMapel(KUMPULAN_MAPEL[0] || "");
    setFormGuru(DAFTAR_GURU[0] || "");
    setFormMateri("");
    setFormKeterangan("");
    setShowModal(true);
  };

  const openEdit = (j: Jurnal) => {
    setEditData(j);
    setFormTanggal(j.tanggal);
    setFormKelas(j.kelas);
    setFormMapel(j.mata_pelajaran);
    setFormGuru(j.nama_guru);
    setFormMateri(j.materi);
    setFormKeterangan(j.keterangan || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formMateri.trim() || !formKelas || !formMapel || !formGuru) return;
    setSaving(true);
    const payload = {
      tanggal: formTanggal,
      kelas: formKelas,
      mata_pelajaran: formMapel,
      nama_guru: formGuru,
      materi: formMateri.trim(),
      keterangan: formKeterangan.trim() || undefined,
    };
    if (editData) {
      await updateJurnal(editData.id, payload);
    } else {
      await addJurnal(payload as Omit<Jurnal, "id" | "created_at">);
    }
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    await deleteJurnal(id);
    setConfirmDelete(null);
  };

  const selectStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.75)",
    appearance: "none" as const,
  };

  const pag = usePagination(filtered);

  return (
    <PageShell>
      <PageHeader
        icon={<BookOpen className="w-6 h-6 text-amber-400" />}
        title="Jurnal Mengajar Guru"
        subtitle={`${SCHOOL.nama} — Dokumentasi kegiatan belajar mengajar`}
        gradient="linear-gradient(135deg, #1a1500 0%, #0c0820 50%, #050d1e 100%)"
        glowColor="rgba(245,158,11,0.28)"
        action={
          isAdmin ? (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
              style={{
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                boxShadow: "0 0 20px rgba(245,158,11,0.3)",
              }}
            >
              <Plus size={16} /> Tambah Jurnal
            </button>
          ) : undefined
        }
      />

      <StatCards
        items={[
          {
            label: "Total Jurnal",
            value: totalJurnal,
            color: "#8b5cf6",
            icon: <BookOpen className="w-5 h-5 text-violet-400" />,
          },
          {
            label: "Bulan Ini",
            value: bulanIni,
            color: "#f59e0b",
            icon: <Calendar className="w-5 h-5 text-amber-400" />,
          },
          {
            label: "Mata Pelajaran",
            value: totalMapel,
            color: "#06b6d4",
            icon: <FileText className="w-5 h-5 text-cyan-400" />,
          },
          {
            label: "Guru Aktif",
            value: totalGuru,
            color: "#10b981",
            icon: <Users className="w-5 h-5 text-emerald-400" />,
          },
        ]}
      />

      {/* Search + Filters */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Cari materi, guru, atau mapel..."
        right={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="h-10 px-3 rounded-xl text-xs outline-none min-w-[110px]"
              style={selectStyle}
            >
              <option value="all">Semua Kelas</option>
              {KUMPULAN_KELAS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <select
              value={filterGuru}
              onChange={(e) => setFilterGuru(e.target.value)}
              className="h-10 px-3 rounded-xl text-xs outline-none min-w-[120px]"
              style={selectStyle}
            >
              <option value="all">Semua Guru</option>
              {DAFTAR_GURU.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <select
              value={filterBulan}
              onChange={(e) => setFilterBulan(e.target.value)}
              className="h-10 px-3 rounded-xl text-xs outline-none min-w-[110px]"
              style={selectStyle}
            >
              <option value="all">Semua Bulan</option>
              {bulanOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Table */}
      <PageCard noPad>
        <PageCardHeader
          title="Riwayat Jurnal Mengajar"
          subtitle={`Menampilkan ${filtered.length} dari ${dataJurnal.length} entri`}
          icon={<BookOpen className="w-4 h-4" />}
        />

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={40} />}
            title="Belum Ada Jurnal"
            subtitle="Tambahkan catatan kegiatan belajar mengajar"
          />
        ) : (
          <>
            <AuroraTable
              headers={[
                "No",
                "Tanggal",
                "Kelas",
                "Mapel",
                "Guru",
                "Materi",
                "Aksi",
              ]}
            >
              {pag.paginated.map((j, i) => (
                <ATRow key={j.id}>
                  <ATCell className="text-white/20 font-mono text-xs">
                    {(pag.page - 1) * pag.perPage + i + 1}
                  </ATCell>
                  <ATCell>
                    <span className="text-xs text-amber-400/70 font-mono">
                      {formatTanggal(j.tanggal)}
                    </span>
                  </ATCell>
                  <ATCell>
                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {j.kelas}
                    </span>
                  </ATCell>
                  <ATCell className="text-white/50 text-xs font-medium">
                    {j.mata_pelajaran}
                  </ATCell>
                  <ATCell className="text-emerald-400/70 text-xs font-semibold">
                    {j.nama_guru}
                  </ATCell>
                  <ATCell>
                    <div className="max-w-[250px]">
                      <p className="text-white/70 text-xs truncate font-medium">
                        {j.materi}
                      </p>
                      {j.keterangan && (
                        <p className="text-white/25 text-[10px] truncate mt-0.5">
                          {j.keterangan}
                        </p>
                      )}
                    </div>
                  </ATCell>
                  <ATCell>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(j)}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/20 hover:text-cyan-400 transition-all"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(j.id)}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/20 hover:text-red-400 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
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
        )}
      </PageCard>

      {/* â”€â”€ Modal Add/Edit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: "rgba(8,9,13,0.85)",
              backdropFilter: "blur(12px)",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl p-6 space-y-5"
              style={{
                background: "#0d1117",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-white">
                  {editData ? "Edit Jurnal" : "Tambah Jurnal Baru"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/30 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
                      Tanggal *
                    </label>
                    <input
                      type="date"
                      value={formTanggal}
                      onChange={(e) => setFormTanggal(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl text-sm text-white/80 outline-none"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
                      Kelas *
                    </label>
                    <select
                      value={formKelas}
                      onChange={(e) => setFormKelas(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl text-sm text-white/80 outline-none appearance-none"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <option value="">-- Pilih --</option>
                      {KUMPULAN_KELAS.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
                      Mata Pelajaran *
                    </label>
                    <select
                      value={formMapel}
                      onChange={(e) => setFormMapel(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl text-sm text-white/80 outline-none appearance-none"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <option value="">-- Pilih --</option>
                      {KUMPULAN_MAPEL.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
                      Guru Pengajar *
                    </label>
                    <select
                      value={formGuru}
                      onChange={(e) => setFormGuru(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl text-sm text-white/80 outline-none appearance-none"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <option value="">-- Pilih --</option>
                      {DAFTAR_GURU.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    {DAFTAR_GURU.length === 0 && (
                      <p className="text-[10px] text-amber-400/60 italic">
                        Tambahkan data guru terlebih dahulu di menu Data Guru.
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
                    Materi Pembelajaran *
                  </label>
                  <textarea
                    value={formMateri}
                    onChange={(e) => setFormMateri(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white/80 outline-none resize-none"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                    placeholder="Deskripsi materi yang diajarkan..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
                    Keterangan
                  </label>
                  <input
                    value={formKeterangan}
                    onChange={(e) => setFormKeterangan(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl text-sm text-white/80 outline-none"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                    placeholder="Catatan tambahan (opsional)..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white/50 transition-all"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={
                    saving ||
                    !formMateri.trim() ||
                    !formKelas ||
                    !formMapel ||
                    !formGuru
                  }
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    boxShadow: "0 0 16px rgba(245,158,11,0.25)",
                  }}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : editData ? (
                    "Simpan Perubahan"
                  ) : (
                    "Tambah Jurnal"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* â”€â”€ Confirm Delete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: "rgba(8,9,13,0.85)",
              backdropFilter: "blur(12px)",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmDelete(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-sm rounded-2xl p-6 space-y-4"
              style={{
                background: "#0d1117",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <h3 className="text-lg font-bold text-white">Hapus Jurnal?</h3>
              <p className="text-sm text-white/40">
                Data jurnal yang dihapus tidak bisa dikembalikan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white/50"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-all"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
