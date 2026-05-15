"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  X,
  Check,
  Clock,
  Loader2,
  Send,
  ChevronDown,
  Search,
  Trash2,
} from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { SCHOOL } from "@/lib/school.config";
import {
  PageShell,
  PageHeader,
  PageCard,
  PageCardHeader,
  AuroraModal,
  AuroraInput,
  EmptyState,
  SearchBar,
} from "@/components/shared/PageShell";
import { format } from "date-fns";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type JenisSurat = "izin" | "sakit" | "dispensasi" | "tugas" | "keterangan";
type StatusSurat = "pending" | "disetujui" | "ditolak";

interface SuratIzin {
  id: string;
  nama_siswa: string;
  kelas: string;
  jenis: JenisSurat;
  status: StatusSurat;
  tanggal_mulai: string;
  tanggal_selesai: string;
  keterangan: string;
  created_at: string;
}

const JENIS_STYLE: Record<
  JenisSurat,
  { label: string; color: string; bg: string }
> = {
  izin: { label: "Izin", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  sakit: { label: "Sakit", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  dispensasi: {
    label: "Dispensasi",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.12)",
  },
  tugas: { label: "Tugas Luar", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  keterangan: {
    label: "Keterangan",
    color: "#22d3ee",
    bg: "rgba(34,211,238,0.12)",
  },
};

const STATUS_STYLE: Record<
  StatusSurat,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: { label: "Menunggu", color: "#f59e0b", icon: Clock },
  disetujui: { label: "Disetujui", color: "#10b981", icon: Check },
  ditolak: { label: "Ditolak", color: "#f43f5e", icon: X },
};

export default function SuratIzinPage() {
  const { dataSiswa } = useAppStore();
  const supabase = createClient();
  const [suratList, setSuratList] = useState<SuratIzin[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterJenis, setFilterJenis] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    siswa_id: "",
    jenis: "izin" as JenisSurat,
    tanggal_mulai: format(new Date(), "yyyy-MM-dd"),
    tanggal_selesai: format(new Date(), "yyyy-MM-dd"),
    keterangan: "",
  });

  useEffect(() => {
    const fetchSurat = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("surat_izin")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setSuratList(data as SuratIzin[]);
      setLoading(false);
    };
    fetchSurat();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(
    () =>
      suratList.filter((s) => {
        const mq =
          !searchQuery ||
          s.nama_siswa.toLowerCase().includes(searchQuery.toLowerCase());
        const mj = filterJenis === "all" || s.jenis === filterJenis;
        const ms = filterStatus === "all" || s.status === filterStatus;
        return mq && mj && ms;
      }),
    [suratList, searchQuery, filterJenis, filterStatus],
  );

  const stats = {
    total: suratList.length,
    pending: suratList.filter((s) => s.status === "pending").length,
    disetujui: suratList.filter((s) => s.status === "disetujui").length,
    ditolak: suratList.filter((s) => s.status === "ditolak").length,
  };

  const handleSubmit = async () => {
    const siswa = dataSiswa.find((s) => s.id === form.siswa_id);
    if (!siswa) {
      toast.error("Pilih siswa terlebih dahulu");
      return;
    }
    if (!form.keterangan.trim()) {
      toast.error("Keterangan tidak boleh kosong");
      return;
    }
    setSaving(true);
    try {
      const newSurat: SuratIzin = {
        id: crypto.randomUUID(),
        nama_siswa: siswa.nama,
        kelas: siswa.kelas || "-",
        jenis: form.jenis,
        status: "pending",
        tanggal_mulai: form.tanggal_mulai,
        tanggal_selesai: form.tanggal_selesai,
        keterangan: form.keterangan,
        created_at: new Date().toISOString(),
      };
      const { data: inserted, error } = await supabase
        .from("surat_izin")
        .insert(newSurat)
        .select()
        .single();
      if (error) throw error;
      setSuratList((prev) => [inserted as SuratIzin, ...prev]);
      setShowForm(false);
      setForm({
        siswa_id: "",
        jenis: "izin",
        tanggal_mulai: format(new Date(), "yyyy-MM-dd"),
        tanggal_selesai: format(new Date(), "yyyy-MM-dd"),
        keterangan: "",
      });
      toast.success(
        `Surat ${JENIS_STYLE[form.jenis].label} untuk ${siswa.nama} berhasil dibuat`,
      );
    } catch {
      toast.error("Gagal menyimpan surat izin");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: StatusSurat) => {
    const { error } = await supabase
      .from("surat_izin")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Gagal mengubah status");
      return;
    }
    setSuratList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s)),
    );
    toast.success(`Status diubah ke ${STATUS_STYLE[status].label}`);
  };

  const deleteSurat = async (id: string) => {
    const { error } = await supabase.from("surat_izin").delete().eq("id", id);
    if (error) {
      toast.error("Gagal menghapus surat");
      return;
    }
    setSuratList((prev) => prev.filter((s) => s.id !== id));
    toast.success("Surat berhasil dihapus");
  };

  return (
    <PageShell>
      <PageHeader
        icon={<FileText className="w-6 h-6 text-blue-400" />}
        title="Surat Izin & Dispensasi"
        subtitle={`${SCHOOL.nama} — Kelola surat izin siswa`}
        gradient="linear-gradient(135deg, #001122 0%, #0c0820 50%, #050d1e 100%)"
        glowColor="rgba(59,130,246,0.28)"
        action={
          <button
            onClick={() => setShowForm(true)}
            className="h-9 px-5 rounded-xl text-[12px] font-bold flex items-center gap-2 text-white transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #3b82f6, #2563eb)",
              boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
            }}
          >
            <Plus className="w-3.5 h-3.5" /> Buat Surat Baru
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "#8b5cf6" },
          { label: "Menunggu", value: stats.pending, color: "#f59e0b" },
          { label: "Disetujui", value: stats.disetujui, color: "#10b981" },
          { label: "Ditolak", value: stats.ditolak, color: "#f43f5e" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-3 text-center"
            style={{
              background: `${s.color}08`,
              border: `1px solid ${s.color}18`,
            }}
          >
            <p className="text-xl font-black" style={{ color: s.color }}>
              {s.value}
            </p>
            <p
              className="text-[9px] font-bold uppercase tracking-widest mt-0.5"
              style={{ color: `${s.color}80` }}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Cari nama siswa..."
        right={
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={filterJenis}
                onChange={(e) => setFilterJenis(e.target.value)}
                className="h-10 appearance-none rounded-xl px-3 pr-8 text-[12px] text-white/60 outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <option value="all">Semua Jenis</option>
                {Object.entries(JENIS_STYLE).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-3 w-3.5 h-3.5 text-white/25 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-10 appearance-none rounded-xl px-3 pr-8 text-[12px] text-white/60 outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <option value="all">Semua Status</option>
                {Object.entries(STATUS_STYLE).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-3 w-3.5 h-3.5 text-white/25 pointer-events-none" />
            </div>
          </div>
        }
      />

      {/* List */}
      <PageCard noPad>
        <PageCardHeader
          title="Daftar Surat Izin"
          subtitle={`${filtered.length} surat`}
          icon={<FileText className="w-4 h-4" />}
        />
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-7 h-7" />}
            title="Belum ada surat izin" variant="search"
            subtitle='Klik "Buat Surat Baru" untuk memulai'
          />
        ) : (
          filtered.map((surat, idx) => {
            const jStyle = JENIS_STYLE[surat.jenis];
            const sStyle = STATUS_STYLE[surat.status];
            const SIcon = sStyle.icon;
            return (
              <div
                key={surat.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                style={{
                  borderBottom:
                    idx < filtered.length - 1
                      ? "1px solid rgba(255,255,255,0.04)"
                      : "none",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: jStyle.bg }}
                >
                  <FileText
                    className="w-4 h-4"
                    style={{ color: jStyle.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-[13px] font-bold text-white/80 truncate">
                      {surat.nama_siswa}
                    </h4>
                    <span
                      className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                      style={{ background: jStyle.bg, color: jStyle.color }}
                    >
                      {jStyle.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/35 truncate">
                    {surat.keterangan}
                  </p>
                  <p className="text-[10px] text-white/20 mt-0.5">
                    {surat.kelas} · {surat.tanggal_mulai} —{" "}
                    {surat.tanggal_selesai}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg"
                    style={{
                      background: `${sStyle.color}12`,
                      color: sStyle.color,
                    }}
                  >
                    <SIcon size={11} />
                    {sStyle.label}
                  </span>
                  {surat.status === "pending" && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateStatus(surat.id, "disetujui")}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-400 hover:bg-emerald-400/10 transition-all"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => updateStatus(surat.id, "ditolak")}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-400/10 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => deleteSurat(surat.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400/40 hover:bg-red-400/10 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </PageCard>

      {/* Modal */}
      <AuroraModal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Buat Surat Izin Baru"
        icon={<FileText size={16} />}
      >
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em] block mb-1.5">
              Siswa
            </label>
            <select
              value={form.siswa_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, siswa_id: e.target.value }))
              }
              className="w-full h-11 appearance-none rounded-xl px-4 text-sm text-white/70 outline-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <option value="">Pilih siswa...</option>
              {dataSiswa
                .sort((a, b) => a.nama.localeCompare(b.nama))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} — {s.kelas}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em] block mb-1.5">
              Jenis Surat
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(JENIS_STYLE).map(([key, style]) => (
                <button
                  key={key}
                  onClick={() =>
                    setForm((f) => ({ ...f, jenis: key as JenisSurat }))
                  }
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                  style={{
                    background:
                      form.jenis === key ? style.bg : "rgba(255,255,255,0.03)",
                    border: `1px solid ${form.jenis === key ? style.color + "40" : "rgba(255,255,255,0.06)"}`,
                    color:
                      form.jenis === key
                        ? style.color
                        : "rgba(255,255,255,0.35)",
                  }}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <AuroraInput
              label="Dari"
              type="date"
              value={form.tanggal_mulai}
              onChange={(e) =>
                setForm((f) => ({ ...f, tanggal_mulai: e.target.value }))
              }
            />
            <AuroraInput
              label="Sampai"
              type="date"
              value={form.tanggal_selesai}
              onChange={(e) =>
                setForm((f) => ({ ...f, tanggal_selesai: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em] block mb-1.5">
              Keterangan
            </label>
            <textarea
              value={form.keterangan}
              onChange={(e) =>
                setForm((f) => ({ ...f, keterangan: e.target.value }))
              }
              rows={3}
              placeholder="Alasan izin..."
              className="w-full rounded-xl p-3 text-[13px] text-white/70 outline-none resize-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #3b82f6, #2563eb)",
              boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
            }}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {saving ? "Menyimpan..." : "Buat Surat Izin"}
          </button>
        </div>
      </AuroraModal>
    </PageShell>
  );
}
