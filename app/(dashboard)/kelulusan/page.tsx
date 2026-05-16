"use client";

import { useState, useEffect, useMemo } from "react";
import {
  GraduationCap, Save, Loader2, CheckCircle, XCircle, Search,
  ToggleLeft, ToggleRight, Calendar, MessageSquare, Users,
  ExternalLink, AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PageShell, PageHeader, PageCard, SearchBar } from "@/components/shared/PageShell";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Helper: konversi ISO string ke format datetime-local (YYYY-MM-DDTHH:mm)
function toDatetimeLocal(isoStr: string): string {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ""; }
}

interface SiswaKelulusan {
  id: string;
  nama: string;
  nisn: string;
  kelas?: string;
  jk: string;
  foto_url?: string | null;
  status_kelulusan?: string | null;
}

export default function KelulusanPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [siswaList, setSiswaList] = useState<SiswaKelulusan[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "LULUS" | "TIDAK LULUS" | "belum">("all");

  // Pengaturan
  const [portalAktif, setPortalAktif] = useState(false);
  const [tglPengumuman, setTglPengumuman] = useState("");
  const [pesanKelulusan, setPesanKelulusan] = useState("");
  const [pengaturanId, setPengaturanId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [{ data: siswaData }, { data: pengaturan }] = await Promise.all([
        supabase
          .from("siswa")
          .select("id, nama, nisn, kelas, jk, foto_url, status_kelulusan")
          .or("kelas.ilike.6%,kelas.ilike.VI%")
          .order("kelas")
          .order("nama"),
        supabase.from("pengaturan").select("id, portal_kelulusan_aktif, tanggal_pengumuman, pesan_kelulusan").single(),
      ]);
      setSiswaList(siswaData || []);
      if (pengaturan) {
        setPengaturanId(pengaturan.id);
        setPortalAktif(pengaturan.portal_kelulusan_aktif || false);
        setTglPengumuman(toDatetimeLocal(pengaturan.tanggal_pengumuman || ""));
        setPesanKelulusan(pengaturan.pesan_kelulusan || "");
      }
      setLoading(false);
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let list = siswaList;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.nama.toLowerCase().includes(q) || s.nisn.includes(q));
    }
    if (filterStatus === "LULUS") list = list.filter(s => s.status_kelulusan === "LULUS");
    else if (filterStatus === "TIDAK LULUS") list = list.filter(s => s.status_kelulusan === "TIDAK LULUS");
    else if (filterStatus === "belum") list = list.filter(s => !s.status_kelulusan);
    return list;
  }, [siswaList, search, filterStatus]);

  const stats = useMemo(() => ({
    total: siswaList.length,
    lulus: siswaList.filter(s => s.status_kelulusan === "LULUS").length,
    tidakLulus: siswaList.filter(s => s.status_kelulusan === "TIDAK LULUS").length,
    belum: siswaList.filter(s => !s.status_kelulusan).length,
  }), [siswaList]);

  // Update status individual
  const updateStatus = async (id: string, status: string | null) => {
    const { error } = await supabase.from("siswa").update({ status_kelulusan: status }).eq("id", id);
    if (error) { toast.error("Gagal update: " + error.message); return; }
    setSiswaList(prev => prev.map(s => s.id === id ? { ...s, status_kelulusan: status } : s));
    toast.success(status ? `Status diubah ke ${status}` : "Status direset");
  };

  // Bulk set semua LULUS
  const bulkSetLulus = async () => {
    setSaving(true);
    const ids = siswaList.filter(s => !s.status_kelulusan).map(s => s.id);
    if (ids.length === 0) { toast.info("Semua siswa sudah memiliki status"); setSaving(false); return; }
    const { error } = await supabase.from("siswa").update({ status_kelulusan: "LULUS" }).in("id", ids);
    if (error) { toast.error("Gagal bulk update"); setSaving(false); return; }
    setSiswaList(prev => prev.map(s => ids.includes(s.id) ? { ...s, status_kelulusan: "LULUS" } : s));
    toast.success(`${ids.length} siswa ditandai LULUS`);
    setSaving(false);
  };

  // Reset semua
  const bulkReset = async () => {
    if (!confirm("Yakin ingin mereset status kelulusan SEMUA siswa kelas 6?")) return;
    setSaving(true);
    const ids = siswaList.map(s => s.id);
    const { error } = await supabase.from("siswa").update({ status_kelulusan: null }).in("id", ids);
    if (error) { toast.error("Gagal reset"); setSaving(false); return; }
    setSiswaList(prev => prev.map(s => ({ ...s, status_kelulusan: null })));
    toast.success("Semua status direset");
    setSaving(false);
  };

  // Simpan pengaturan portal
  const saveSettings = async () => {
    if (!pengaturanId) return;
    setSavingSettings(true);
    const { error } = await supabase.from("pengaturan").update({
      portal_kelulusan_aktif: portalAktif,
      tanggal_pengumuman: tglPengumuman ? new Date(tglPengumuman).toISOString() : null,
      pesan_kelulusan: pesanKelulusan || null,
    }).eq("id", pengaturanId);
    if (error) toast.error("Gagal menyimpan: " + error.message);
    else toast.success("Pengaturan portal disimpan!");
    setSavingSettings(false);
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        icon={<GraduationCap className="w-6 h-6 text-amber-400" />}
        title="Pengumuman Kelulusan"
        subtitle={`Kelola status kelulusan ${stats.total} siswa kelas 6`}
        action={
          <a href="/portal/kelulusan" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all">
            <ExternalLink size={14} /> Buka Portal
          </a>
        }
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Kelas 6", value: stats.total, color: "#a78bfa", icon: Users },
          { label: "Lulus", value: stats.lulus, color: "#34d399", icon: CheckCircle },
          { label: "Tidak Lulus", value: stats.tidakLulus, color: "#fb7185", icon: XCircle },
          { label: "Belum Diatur", value: stats.belum, color: "#fbbf24", icon: AlertCircle },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl" style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pengaturan Portal ── */}
      <PageCard className="mb-6">
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white/90 flex items-center gap-2">
                <Calendar size={16} className="text-amber-400" /> Pengaturan Portal Kelulusan
              </h3>
              <p className="text-xs text-white/35 mt-1">Kontrol kapan portal bisa diakses oleh orang tua</p>
            </div>
            <button onClick={saveSettings} disabled={savingSettings}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #D4A843, #b8860b)", boxShadow: "0 4px 15px rgba(212,168,67,0.25)" }}>
              {savingSettings ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Simpan Pengaturan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Toggle */}
            <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Status Portal</p>
              <button onClick={() => setPortalAktif(!portalAktif)}
                className={cn("w-full flex items-center justify-between p-3 rounded-xl transition-all", portalAktif ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-rose-500/10 border border-rose-500/20")}>
                <span className={cn("text-sm font-bold", portalAktif ? "text-emerald-400" : "text-rose-400")}>
                  {portalAktif ? "Aktif (Terbuka)" : "Nonaktif (Tertutup)"}
                </span>
                {portalAktif ? <ToggleRight size={28} className="text-emerald-400" /> : <ToggleLeft size={28} className="text-white/20" />}
              </button>
            </div>

            {/* Tanggal & Waktu Pengumuman */}
            <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Tanggal & Waktu</p>
              <input type="datetime-local" value={tglPengumuman} onChange={e => setTglPengumuman(e.target.value)}
                className="w-full h-11 px-3 rounded-xl text-sm text-white outline-none [color-scheme:dark]"
                style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)" }} />
              <p className="text-[10px] text-white/25 mt-2">Countdown & waktu buka portal</p>
            </div>

            {/* Pesan */}
            <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
                <MessageSquare size={10} className="inline mr-1" /> Pesan Kelulusan
              </p>
              <textarea rows={3} value={pesanKelulusan} onChange={e => setPesanKelulusan(e.target.value)}
                placeholder="Selamat atas kelulusan Ananda! Semoga sukses..."
                className="w-full px-3 py-2 rounded-xl text-xs text-white/80 outline-none resize-none placeholder-white/15"
                style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>
          </div>
        </div>
      </PageCard>

      {/* ── Daftar Siswa Kelas 6 ── */}
      <PageCard>
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-sm font-black text-white/90 flex items-center gap-2">
                <Users size={16} className="text-violet-400" /> Daftar Siswa Kelas 6
              </h3>
              <p className="text-xs text-white/35 mt-1">Klik tombol status untuk mengubah kelulusan</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={bulkSetLulus} disabled={saving || stats.belum === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-40">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                Luluskan Semua
              </button>
              <button onClick={bulkReset} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all disabled:opacity-40">
                <XCircle size={12} /> Reset Semua
              </button>
            </div>
          </div>

          {/* Filter */}
          <div className="flex flex-col md:flex-row gap-3 mb-5">
            <div className="flex-1">
              <SearchBar value={search} onChange={setSearch} placeholder="Cari nama / NISN..." />
            </div>
            <div className="flex gap-2">
              {[
                { key: "all" as const, label: "Semua", count: stats.total },
                { key: "LULUS" as const, label: "Lulus", count: stats.lulus },
                { key: "TIDAK LULUS" as const, label: "Tidak", count: stats.tidakLulus },
                { key: "belum" as const, label: "Belum", count: stats.belum },
              ].map(f => (
                <button key={f.key} onClick={() => setFilterStatus(f.key)}
                  className={cn("px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                    filterStatus === f.key ? "text-white bg-violet-500/20 border border-violet-500/30" : "text-white/40 bg-white/5 border border-white/5 hover:text-white/60")}>
                  {f.label} <span className="text-[9px] opacity-60">({f.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-white/30 uppercase tracking-widest">Siswa</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-white/30 uppercase tracking-widest hidden md:table-cell">NISN</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-white/30 uppercase tracking-widest hidden md:table-cell">Kelas</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-white/30 uppercase tracking-widest">Status</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-white/30 uppercase tracking-widest">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-t border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 bg-white/5 shrink-0">
                          {s.foto_url ? <img src={s.foto_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white/20">{s.nama.charAt(0)}</div>}
                        </div>
                        <div>
                          <p className="font-bold text-white/80 text-sm">{s.nama}</p>
                          <p className="text-[10px] text-white/30 md:hidden">{s.nisn} • {s.kelas}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center px-4 py-3 text-white/50 font-mono text-xs hidden md:table-cell">{s.nisn}</td>
                    <td className="text-center px-4 py-3 text-white/50 text-xs hidden md:table-cell">{s.kelas}</td>
                    <td className="text-center px-4 py-3">
                      {s.status_kelulusan === "LULUS" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                          <CheckCircle size={10} /> LULUS
                        </span>
                      ) : s.status_kelulusan === "TIDAK LULUS" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20">
                          <XCircle size={10} /> TIDAK LULUS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white/30 bg-white/5 border border-white/5">
                          — Belum
                        </span>
                      )}
                    </td>
                    <td className="text-center px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => updateStatus(s.id, "LULUS")} title="Set LULUS"
                          className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all", s.status_kelulusan === "LULUS" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-white/20 border border-white/5 hover:text-emerald-400 hover:bg-emerald-500/10")}>
                          <CheckCircle size={14} />
                        </button>
                        <button onClick={() => updateStatus(s.id, "TIDAK LULUS")} title="Set TIDAK LULUS"
                          className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all", s.status_kelulusan === "TIDAK LULUS" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-white/5 text-white/20 border border-white/5 hover:text-rose-400 hover:bg-rose-500/10")}>
                          <XCircle size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-white/20 text-sm">Tidak ada data siswa ditemukan</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageCard>
    </PageShell>
  );
}
