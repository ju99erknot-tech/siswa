"use client";

import { useState, useMemo, useCallback } from "react";
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
import { useAppStore } from "@/store/app.store";
import { useKapsulWaktu } from "@/hooks/useKapsulWaktu";
import { createClient } from "@/lib/supabase/client";
import { uploadFileToGDrive, konversiDirectLink } from "@/lib/gas";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Clock,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Copy,
  Sparkles,
  GraduationCap,
  Heart,
  Rocket,
  Users,
  Camera,
  Award,
  Stethoscope,
  CalendarDays,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { KATEGORI_KAPSUL, type KapsulWaktu, type Siswa } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

// ── Kategori Badge Config ────────────────────────────────────
const KATEGORI_CONFIG: Record<string, { bg: string; text: string; icon: any }> = {
  Akademik:  { bg: "bg-cyan-500/10",    text: "text-cyan-400",    icon: GraduationCap },
  Prestasi:  { bg: "bg-amber-500/10",   text: "text-amber-400",   icon: Award },
  Kesehatan: { bg: "bg-emerald-500/10", text: "text-emerald-400", icon: Stethoscope },
  Eskul:     { bg: "bg-violet-500/10",  text: "text-violet-400",  icon: Rocket },
  Sosial:    { bg: "bg-pink-500/10",    text: "text-pink-400",    icon: Users },
  Momen:     { bg: "bg-sky-500/10",     text: "text-sky-400",     icon: Camera },
};

function KategoriBadge({ kategori }: { kategori: string }) {
  const cfg = KATEGORI_CONFIG[kategori] || KATEGORI_CONFIG["Momen"];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
      <Icon size={11} />
      {kategori}
    </span>
  );
}

export default function KapsulWaktuPage() {
  const { dataSiswa, user } = useAppStore();
  const { dataKapsulWaktu, isLoading, addKapsul, updateKapsul, deleteKapsul } = useKapsulWaktu();
  const supabase = createClient();

  // ── Local State ─────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<KapsulWaktu | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KapsulWaktu | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("all");

  // ── Form State ──────────────────────────────────────────────
  const [formSiswaId, setFormSiswaId] = useState("");
  const [formJudul, setFormJudul] = useState("");
  const [formDeskripsi, setFormDeskripsi] = useState("");
  const [formKategori, setFormKategori] = useState("Momen");
  const [formTanggal, setFormTanggal] = useState("");
  const [formKelas, setFormKelas] = useState("");
  const [formFotoUrl, setFormFotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // ── Stats ───────────────────────────────────────────────────
  const stats = useMemo(() => {
    const uniqueSiswa = new Set(dataKapsulWaktu.map(k => k.siswa_id)).size;
    const now = new Date();
    const bulanIni = dataKapsulWaktu.filter(k => {
      const d = new Date(k.tanggal_momen);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const kategoriCount: Record<string, number> = {};
    dataKapsulWaktu.forEach(k => { kategoriCount[k.kategori] = (kategoriCount[k.kategori] || 0) + 1; });
    const topKategori = Object.entries(kategoriCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
    return { total: dataKapsulWaktu.length, uniqueSiswa, bulanIni, topKategori };
  }, [dataKapsulWaktu]);

  // ── Filtered Data ───────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...dataKapsulWaktu];
    if (filterKategori !== "all") result = result.filter(k => k.kategori === filterKategori);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(k => {
        const siswa = dataSiswa.find(s => s.id === k.siswa_id);
        return (
          k.judul.toLowerCase().includes(q) ||
          k.nisn.includes(q) ||
          (siswa?.nama?.toLowerCase().includes(q))
        );
      });
    }
    return result;
  }, [dataKapsulWaktu, search, filterKategori, dataSiswa]);

  const pag = usePagination(filtered);

  // ── Handlers ────────────────────────────────────────────────
  const getSiswa = useCallback((siswaId: string): Siswa | undefined => {
    return dataSiswa.find(s => s.id === siswaId);
  }, [dataSiswa]);

  const resetForm = () => {
    setFormSiswaId("");
    setFormJudul("");
    setFormDeskripsi("");
    setFormKategori("Momen");
    setFormTanggal("");
    setFormKelas("");
    setFormFotoUrl("");
  };

  const openAdd = () => {
    resetForm();
    setEditTarget(null);
    setShowForm(true);
  };

  const openEdit = (item: KapsulWaktu) => {
    setEditTarget(item);
    setFormSiswaId(item.siswa_id);
    setFormJudul(item.judul);
    setFormDeskripsi(item.deskripsi || "");
    setFormKategori(item.kategori);
    setFormTanggal(item.tanggal_momen);
    setFormKelas(item.kelas_saat_itu || "");
    setFormFotoUrl(item.foto_url || "");
    setShowForm(true);
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!formSiswaId) { toast.error("Pilih siswa terlebih dahulu"); return; }
    setUploading(true);
    try {
      const student = getSiswa(formSiswaId);
      const studentName = student?.nama || "Siswa";
      const studentNisn = student?.nisn || "UNKNOWN";
      
      const fileUrl = await uploadFileToGDrive(
        file,
        `KAPSUL_${studentNisn}_${Date.now()}`,
        studentName
      );
      
      setFormFotoUrl(fileUrl);
      toast.success("Foto berhasil diunggah ke Google Drive");
    } catch (err: unknown) {
      toast.error("Upload gagal: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSiswaId || !formJudul || !formTanggal) {
      toast.error("Siswa, judul, dan tanggal wajib diisi");
      return;
    }
    const siswa = getSiswa(formSiswaId);
    setSaving(true);
    const payload = {
      siswa_id: formSiswaId,
      nisn: siswa?.nisn || "",
      judul: formJudul,
      deskripsi: formDeskripsi || undefined,
      foto_url: formFotoUrl || undefined,
      kategori: formKategori as any,
      kelas_saat_itu: formKelas || siswa?.kelas || undefined,
      tanggal_momen: formTanggal,
      ditambahkan_oleh: user?.name || "Admin",
    };

    let ok: boolean;
    if (editTarget) {
      ok = await updateKapsul(editTarget.id, payload);
    } else {
      ok = await addKapsul(payload);
    }
    setSaving(false);
    if (ok) {
      setShowForm(false);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    await deleteKapsul(deleteTarget.id);
    setSaving(false);
    setDeleteTarget(null);
  };

  const copyLink = (nisn: string) => {
    const url = `${window.location.origin}/portal/kapsul-waktu/${nisn}`;
    navigator.clipboard.writeText(url);
    toast.success("Link berhasil disalin!");
  };

  const getFotoPublic = (url?: string) => {
    if (!url) return null;
    if (url.includes("drive.google.com") || url.includes("googleusercontent.com")) {
      return konversiDirectLink(url);
    }
    if (url.startsWith("http")) return url;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${url}`;
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <PageShell>
      <PageHeader
        icon={<Clock className="w-6 h-6 text-violet-400" />}
        title="Kapsul Waktu"
        subtitle="Portofolio kenangan siswa dari kelas 1 hingga 6"
        action={
          <button onClick={openAdd} className="btn-solid flex items-center gap-2">
            <Plus size={16} /> Tambah Momen
          </button>
        }
      />

      <StatCards
        items={[
          { label: "Total Momen", value: stats.total, icon: <Camera size={20} />, color: "#22d3ee" },
          { label: "Siswa Terekam", value: stats.uniqueSiswa, icon: <Users size={20} />, color: "#a78bfa" },
          { label: "Momen Bulan Ini", value: stats.bulanIni, icon: <CalendarDays size={20} />, color: "#34d399" },
          { label: "Kategori Populer", value: stats.topKategori, icon: <Sparkles size={20} />, color: "#fbbf24" },
        ]}
      />

      <SearchBar
        value={search}
        onChange={setSearch}
        right={
          <AuroraSelect
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
          >
            <option value="all">Semua Kategori</option>
            {KATEGORI_KAPSUL.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </AuroraSelect>
        }
      />

      <PageCard noPad>
        <AuroraTable
          headers={["No", "Foto", "Judul", "Siswa", "Kelas", "Kategori", "Tanggal", "Aksi"]}
          loading={isLoading}
          empty={
            filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState
                    icon={<Clock className="w-7 h-7 text-white/20" />}
                    title="Belum Ada Momen"
                    subtitle="Klik tombol 'Tambah Momen' untuk mulai mendokumentasikan perjalanan siswa."
                  />
                </td>
              </tr>
            ) : undefined
          }
        >
          {pag.paginated.map((item, idx) => {
            const siswa = getSiswa(item.siswa_id);
            const foto = getFotoPublic(item.foto_url);
            return (
              <ATRow key={item.id}>
                <ATCell>{(pag.page - 1) * pag.perPage + idx + 1}</ATCell>
                <ATCell>
                  {foto ? (
                    <img src={foto} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <ImageIcon size={16} className="text-white/20" />
                    </div>
                  )}
                </ATCell>
                <ATCell>
                  <span className="font-semibold text-white">{item.judul}</span>
                  {item.deskripsi && (
                    <p className="text-[11px] text-white/40 mt-0.5 line-clamp-1">{item.deskripsi}</p>
                  )}
                </ATCell>
                <ATCell>{siswa?.nama || item.nisn}</ATCell>
                <ATCell>{item.kelas_saat_itu || "-"}</ATCell>
                <ATCell><KategoriBadge kategori={item.kategori} /></ATCell>
                <ATCell>
                  <span className="font-mono text-xs text-white/50">
                    {format(new Date(item.tanggal_momen), "dd MMM yyyy", { locale: idLocale })}
                  </span>
                </ATCell>
                <ATCell>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => window.open(`/portal/kapsul-waktu/${item.nisn}`, "_blank")}
                      className="p-1.5 rounded-lg hover:bg-cyan-500/10 text-white/30 hover:text-cyan-400 transition-all"
                      title="Preview Timeline"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => copyLink(item.nisn)}
                      className="p-1.5 rounded-lg hover:bg-violet-500/10 text-white/30 hover:text-violet-400 transition-all"
                      title="Salin Link"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg hover:bg-amber-500/10 text-white/30 hover:text-amber-400 transition-all"
                      title="Edit"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all"
                      title="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </ATCell>
              </ATRow>
            );
          })}
        </AuroraTable>
        <AuroraPagination
          currentPage={pag.page}
          totalItems={filtered.length}
          perPage={pag.perPage}
          onPageChange={pag.setPage}
          onPerPageChange={pag.setPerPage}
        />
      </PageCard>

      {/* ── Add/Edit Modal ─────────────────────────────────────── */}
      <AuroraModal
        open={showForm}
        onClose={() => { setShowForm(false); resetForm(); }}
        title={editTarget ? "Edit Momen" : "Tambah Momen Baru"}
        icon={editTarget ? <Edit3 className="w-5 h-5 text-violet-400" /> : <Sparkles className="w-5 h-5 text-violet-400" />}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editTarget && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5 block">Pilih Siswa *</label>
              <SiswaPicker
                value={formSiswaId}
                onChange={(siswa) => {
                  setFormSiswaId(siswa?.id || "");
                  if (siswa?.kelas) setFormKelas(siswa.kelas);
                }}
              />
            </div>
          )}

          <AuroraInput label="Judul Momen *" value={formJudul} onChange={(e) => setFormJudul(e.target.value)} placeholder="Contoh: Hari Pertama Sekolah" />

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5 block">Deskripsi</label>
            <textarea
              value={formDeskripsi}
              onChange={(e) => setFormDeskripsi(e.target.value)}
              placeholder="Ceritakan momen spesial ini..."
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:ring-2 focus:ring-violet-500/40"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <AuroraSelect
              label="Kategori"
              value={formKategori}
              onChange={(e) => setFormKategori(e.target.value)}
            >
              {KATEGORI_KAPSUL.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </AuroraSelect>
            <AuroraInput label="Tanggal Momen *" type="date" value={formTanggal} onChange={(e) => setFormTanggal(e.target.value)} />
          </div>

          <AuroraInput label="Kelas Saat Itu" value={formKelas} onChange={(e) => setFormKelas(e.target.value)} placeholder="Contoh: 1A, 3B, 6A" />

          {/* Upload Foto */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5 block">Foto Momen</label>
            {formFotoUrl && (
              <div className="relative mb-3 inline-block">
                <img
                  src={getFotoPublic(formFotoUrl)!}
                  alt="Preview"
                  className="w-32 h-32 rounded-xl object-cover border border-white/10"
                />
                <button
                  type="button"
                  onClick={() => setFormFotoUrl("")}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer text-sm text-white/50 hover:text-white/70 transition-all" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <ImageIcon size={16} />
              {uploading ? "Mengunggah..." : "Pilih Foto"}
              <input type="file" accept="image/*" onChange={handleUploadFoto} className="hidden" disabled={uploading} />
            </label>
          </div>

          <button type="submit" className="btn-solid btn-block" disabled={saving}>
            {saving ? "Menyimpan..." : editTarget ? "Perbarui Momen" : "Simpan Momen"}
          </button>
        </form>
      </AuroraModal>

      {/* ── Delete Confirmation ────────────────────────────────── */}
      <AuroraModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Momen"
        size="sm"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <Trash2 size={28} className="text-red-400" />
          </div>
          <p className="text-white/60 text-sm">
            Yakin ingin menghapus momen <span className="text-white font-semibold">&quot;{deleteTarget?.judul}&quot;</span>?
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Batal</button>
            <button onClick={handleDelete} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 font-semibold text-sm hover:bg-red-500/30 transition-all">
              {saving ? "Menghapus..." : "Ya, Hapus"}
            </button>
          </div>
        </div>
      </AuroraModal>
    </PageShell>
  );
}
