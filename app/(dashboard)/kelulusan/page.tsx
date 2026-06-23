"use client";

import { useState, useEffect, useMemo } from "react";
import {
  GraduationCap, Save, Loader2, CheckCircle, XCircle, Search,
  ToggleLeft, ToggleRight, Calendar, MessageSquare, Users,
  ExternalLink, AlertCircle, Calculator, Edit3,
  ArrowUp, ArrowDown, ArrowUpDown, Printer,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PageShell, PageHeader, PageCard, SearchBar, AuroraPagination } from "@/components/shared/PageShell";
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
  nomor_skl?: string | null;
  nilai_kelulusan?: Record<string, string> | null;
}

// Daftar key mapel yang valid untuk perhitungan rata-rata
const MAPEL_KEYS = ["pai", "ppkn", "indo", "mtk", "ipas", "sbdp", "pjok", "bing", "mulok1", "mulok2", "mulok3"];

// Menghitung rata-rata nilai siswa secara dinamis di tabel (angka)
const getSiswaAverageNumber = (siswa: SiswaKelulusan) => {
  if (!siswa.nilai_kelulusan) return 0;
  const n = siswa.nilai_kelulusan;
  let sum = 0;
  let count = 0;
  MAPEL_KEYS.forEach(key => {
    const val = n[key];
    if (val && val.trim() !== "") {
      const num = parseFloat(val.replace(",", "."));
      if (!isNaN(num)) {
        sum += num;
        count++;
      }
    }
  });
  return count > 0 ? sum / count : 0;
};

const getSiswaAverage = (siswa: SiswaKelulusan) => {
  const avg = getSiswaAverageNumber(siswa);
  if (avg <= 0) return "—";
  return avg.toFixed(2).replace(".", ",");
};

export default function KelulusanPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [siswaList, setSiswaList] = useState<SiswaKelulusan[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "LULUS" | "TIDAK LULUS" | "belum">("all");
  const [sortField, setSortField] = useState<"nama" | "nisn" | "rata_rata" | "kelas" | "status">("nama");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus]);

  // Pengaturan
  const [portalAktif, setPortalAktif] = useState(false);
  const [tglPengumuman, setTglPengumuman] = useState("");
  const [pesanKelulusan, setPesanKelulusan] = useState("");
  const [pengaturanId, setPengaturanId] = useState<string | null>(null);
  const [tglKelulusan, setTglKelulusan] = useState("2026-06-02");
  const [namaMulok1, setNamaMulok1] = useState("Bahasa dan Sastra Sunda");
  const [namaMulok2, setNamaMulok2] = useState("");
  const [namaMulok3, setNamaMulok3] = useState("");
  const [skLulusNomor, setSkLulusNomor] = useState("800/032-SD/2026");
  const [skLulusTentang, setSkLulusTentang] = useState("Kriteria Kelulusan Peserta Didik Tahun Pelajaran 2025/2026");
  const [formatSkl, setFormatSkl] = useState("format_1");

  // Modal Input Nilai & Nomor SKL/Transkrip
  const [modalSiswa, setModalSiswa] = useState<SiswaKelulusan | null>(null);
  const [modalNomorSkl, setModalNomorSkl] = useState("");
  const [modalNilai, setModalNilai] = useState<Record<string, string>>({
    pai: "", ppkn: "", indo: "", mtk: "", ipa: "", ips: "", ipas: "",
    sbdp: "", pjok: "", bing: "", mulok1: "", mulok2: "", mulok3: "",
    nomor_transkrip: "", nomor_ijazah: ""
  });

  // Modal Cetak Satuan (TTD & Stempel toggle)
  const [printModalSiswa, setPrintModalSiswa] = useState<SiswaKelulusan | null>(null);
  const [printShowTtd, setPrintShowTtd] = useState(true);
  const [printShowStempel, setPrintShowStempel] = useState(true);

  const openPrintModal = (s: SiswaKelulusan) => {
    setPrintShowTtd(true);
    setPrintShowStempel(true);
    setPrintModalSiswa(s);
  };

  const handleCetakSatuan = () => {
    if (!printModalSiswa) return;
    const params = new URLSearchParams();
    params.set("print", "true");
    if (!printShowTtd) params.set("ttd", "false");
    if (!printShowStempel) params.set("stempel", "false");
    window.open(`/portal/kelulusan/skl/${printModalSiswa.nisn}?${params.toString()}`, "_blank");
    setPrintModalSiswa(null);
  };

  const handleCetakTranskrip = (nisn: string) => {
    window.open(`/portal/kelulusan/transkrip/${nisn}?print=true`, "_blank");
  };

  // Modal Bulk Generate Nomor SKL & Transkrip
  const [showBulkNumberModal, setShowBulkNumberModal] = useState(false);
  const [bulkNumberType, setBulkNumberType] = useState<"skl" | "transkrip">("skl");
  const [bulkTemplate, setBulkTemplate] = useState("400.3.11/{seq}/........./2026");
  const [bulkStartNum, setBulkStartNum] = useState(1);
  const [bulkPadding, setBulkPadding] = useState(3);
  const [bulkSort, setBulkSort] = useState<"nama" | "nisn">("nama");

  useEffect(() => {
    const load = async () => {
      try {
        const [siswaRes, pengaturanRes] = await Promise.all([
          supabase
            .from("siswa")
            .select("id, nama, nisn, kelas, jk, foto_url, status_kelulusan, nomor_skl, nilai_kelulusan")
            .or("kelas.ilike.6%,kelas.ilike.VI%")
            .order("kelas")
            .order("nama"),
          supabase.from("pengaturan").select("id, portal_kelulusan_aktif, tanggal_pengumuman, pesan_kelulusan, tanggal_kelulusan, nama_mulok1, nama_mulok2, nama_mulok3, sk_lulus_nomor, sk_lulus_tentang, format_skl").single(),
        ]);

        if (siswaRes.error) {
          toast.error("Gagal memuat data siswa: " + siswaRes.error.message);
        } else {
          setSiswaList(siswaRes.data || []);
        }

        if (pengaturanRes.error) {
          toast.error("Gagal memuat pengaturan portal: " + pengaturanRes.error.message);
          console.error("[Kelulusan Load Error]", pengaturanRes.error);
        } else if (pengaturanRes.data) {
          const pengaturan = pengaturanRes.data;
          setPengaturanId(pengaturan.id);
          setPortalAktif(pengaturan.portal_kelulusan_aktif || false);
          setTglPengumuman(toDatetimeLocal(pengaturan.tanggal_pengumuman || ""));
          setPesanKelulusan(pengaturan.pesan_kelulusan || "");
          setTglKelulusan(pengaturan.tanggal_kelulusan || "2026-06-02");
          setNamaMulok1(pengaturan.nama_mulok1 || "Bahasa dan Sastra Sunda");
          setNamaMulok2(pengaturan.nama_mulok2 || "");
          setNamaMulok3(pengaturan.nama_mulok3 || "");
          setSkLulusNomor(pengaturan.sk_lulus_nomor || "800/032-SD/2026");
          setSkLulusTentang(pengaturan.sk_lulus_tentang || "Kriteria Kelulusan Peserta Didik Tahun Pelajaran 2025/2026");
          setFormatSkl(pengaturan.format_skl || "format_1");
        }
      } catch (err: any) {
        toast.error("Terjadi kesalahan koneksi database.");
        console.error("[Kelulusan Load Connection Error]", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let list = [...siswaList];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.nama.toLowerCase().includes(q) || s.nisn.includes(q));
    }
    if (filterStatus === "LULUS") list = list.filter(s => s.status_kelulusan === "LULUS");
    else if (filterStatus === "TIDAK LULUS") list = list.filter(s => s.status_kelulusan === "TIDAK LULUS");
    else if (filterStatus === "belum") list = list.filter(s => !s.status_kelulusan);

    // Sorting
    list.sort((a, b) => {
      let comp = 0;
      if (sortField === "nama") {
        comp = a.nama.localeCompare(b.nama);
      } else if (sortField === "nisn") {
        comp = a.nisn.localeCompare(b.nisn);
      } else if (sortField === "kelas") {
        comp = (a.kelas || "").localeCompare(b.kelas || "");
      } else if (sortField === "status") {
        const statusA = a.status_kelulusan || "";
        const statusB = b.status_kelulusan || "";
        comp = statusA.localeCompare(statusB);
      } else if (sortField === "rata_rata") {
        comp = getSiswaAverageNumber(a) - getSiswaAverageNumber(b);
      }
      return sortOrder === "asc" ? comp : -comp;
    });

    return list;
  }, [siswaList, search, filterStatus, sortField, sortOrder]);

  const paginatedFiltered = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

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
    if (!pengaturanId) {
      toast.error("Gagal menyimpan: ID pengaturan tidak ditemukan. Silakan refresh halaman.");
      return;
    }
    setSavingSettings(true);

    const payload = {
      portal_kelulusan_aktif: portalAktif,
      tanggal_pengumuman: tglPengumuman ? new Date(tglPengumuman).toISOString() : null,
      pesan_kelulusan: pesanKelulusan || null,
      tanggal_kelulusan: tglKelulusan || "2026-06-02",
      nama_mulok1: namaMulok1 || null,
      nama_mulok2: namaMulok2 || null,
      nama_mulok3: namaMulok3 || null,
      sk_lulus_nomor: skLulusNomor || null,
      sk_lulus_tentang: skLulusTentang || null,
      format_skl: formatSkl || "format_1",
    };

    const { data: updated, error } = await supabase
      .from("pengaturan")
      .update(payload)
      .eq("id", pengaturanId)
      .select("id, tanggal_pengumuman");

    if (error) {
      if (error.message.includes("format_skl")) {
        toast.error("Gagal menyimpan: Kolom database belum siap. Silakan jalankan file migrasi 015_format_skl.sql di dashboard Supabase Anda terlebih dahulu.");
      } else {
        toast.error("Gagal menyimpan: " + error.message);
      }
      console.error("[Kelulusan Save Error]", error);
    } else if (!updated || updated.length === 0) {
      toast.error("Data tidak tersimpan — tidak ada baris yang terupdate. Coba refresh halaman dan ulangi.");
      console.error("[Kelulusan Save] 0 rows updated. pengaturanId =", pengaturanId);
    } else {
      // Reload dari database untuk sinkronkan state dengan data aktual
      const saved = updated[0];
      setTglPengumuman(toDatetimeLocal(saved.tanggal_pengumuman || ""));
      toast.success("Pengaturan portal disimpan!");
    }
    setSavingSettings(false);
  };



  // Membuka modal input nilai & nomor
  const openNilaiModal = (s: SiswaKelulusan) => {
    setModalSiswa(s);
    setModalNomorSkl(s.nomor_skl || "");
    const n = (s.nilai_kelulusan || {}) as Record<string, string>;
    setModalNilai({
      pai: n.pai || "", ppkn: n.ppkn || "", indo: n.indo || "", mtk: n.mtk || "",
      ipa: n.ipa || "", ips: n.ips || "", ipas: n.ipas || "",
      sbdp: n.sbdp || "", pjok: n.pjok || "", bing: n.bing || "",
      mulok1: n.mulok1 || "", mulok2: n.mulok2 || "", mulok3: n.mulok3 || "",
      nomor_transkrip: n.nomor_transkrip || "", nomor_ijazah: n.nomor_ijazah || ""
    });
  };

  // Rata-rata di modal real-time
  const averageNilai = useMemo(() => {
    let sum = 0;
    let count = 0;
    MAPEL_KEYS.forEach(key => {
      const val = modalNilai[key];
      if (val && val.trim() !== "") {
        const num = parseFloat(val.replace(",", "."));
        if (!isNaN(num)) {
          sum += num;
          count++;
        }
      }
    });
    const avg = count > 0 ? sum / count : 0;
    return avg.toFixed(2).replace(".", ",");
  }, [modalNilai]);

  // Menyimpan nilai dari modal
  const handleSaveNilai = async () => {
    if (!modalSiswa) return;
    setSaving(true);
    try {
      let filteredNilai: Record<string, string> = {};
      Object.entries(modalNilai).forEach(([k, v]) => {
        if (v && v.trim() !== "") filteredNilai[k] = v;
      });

      const { error } = await supabase.from("siswa")
        .update({
          nomor_skl: modalNomorSkl || null,
          nilai_kelulusan: Object.keys(filteredNilai).length > 0 ? filteredNilai : null
        })
        .eq("id", modalSiswa.id);

    if (error) {
      toast.error("Gagal menyimpan nilai: " + error.message);
    } else {
      setSiswaList(prev => prev.map(s => s.id === modalSiswa.id ? { ...s, nomor_skl: modalNomorSkl || null, nilai_kelulusan: filteredNilai } : s));
      toast.success(`Nilai & Nomor untuk ${modalSiswa.nama} berhasil disimpan!`);
      setModalSiswa(null);
    }
    } catch (err) { toast.error("Error saving data"); }
    setSaving(false);
  };

  // Bulk Generate Nomor SKL / Transkrip Berurutan
  const handleBulkGenerateNumbers = async () => {
    setSaving(true);
    try {
      const lulusSiswa = siswaList.filter(s => s.status_kelulusan === "LULUS");
      if (lulusSiswa.length === 0) {
        toast.info("Tidak ada siswa dengan status LULUS.");
        setSaving(false);
        return;
      }

      // Sort
      const sorted = [...lulusSiswa].sort((a, b) => {
        if (bulkSort === "nama") return a.nama.localeCompare(b.nama);
        return a.nisn.localeCompare(b.nisn);
      });

      const promises = sorted.map((s, index) => {
        const seqVal = bulkStartNum + index;
        const seqStr = String(seqVal).padStart(bulkPadding, "0");
        const formattedNum = bulkTemplate.replace("{seq}", seqStr);
        const oldNilai = (s.nilai_kelulusan || {}) as Record<string, string>;
        
        if (bulkNumberType === "skl") {
          return supabase.from("siswa").update({ nomor_skl: formattedNum }).eq("id", s.id);
        } else {
          return supabase.from("siswa").update({ 
            nilai_kelulusan: { ...oldNilai, nomor_transkrip: formattedNum } 
          }).eq("id", s.id);
        }
      });

      await Promise.all(promises);

      // Update local state
      setSiswaList(prev => prev.map(s => {
        const index = sorted.findIndex(u => u.id === s.id);
        if (index === -1) return s;
        const seqVal = bulkStartNum + index;
        const seqStr = String(seqVal).padStart(bulkPadding, "0");
        const formattedNum = bulkTemplate.replace("{seq}", seqStr);
        
        if (bulkNumberType === "skl") {
          return { ...s, nomor_skl: formattedNum };
        } else {
          return { ...s, nilai_kelulusan: { ...(s.nilai_kelulusan as any), nomor_transkrip: formattedNum } };
        }
      }));

      toast.success(`Berhasil membuat nomor ${bulkNumberType.toUpperCase()} untuk ${sorted.length} siswa!`);
      setShowBulkNumberModal(false);
    } catch (err: any) {
      toast.error("Gagal generate nomor: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/5">
            {/* Tanggal Kelulusan (SKL) */}
            <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Tanggal SKL (Tgl Cetak)</p>
              <input type="date" value={tglKelulusan} onChange={e => setTglKelulusan(e.target.value)}
                className="w-full h-11 px-3 rounded-xl text-sm text-white outline-none [color-scheme:dark]"
                style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)" }} />
              <p className="text-[10px] text-white/25 mt-2">Tertera di ttd kepala sekolah</p>
            </div>

            {/* Nama Mulok 1 */}
            <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Nama Muatan Lokal 1</p>
              <input type="text" value={namaMulok1} onChange={e => setNamaMulok1(e.target.value)}
                placeholder="Bahasa dan Sastra Sunda"
                className="w-full h-11 px-3 rounded-xl text-sm text-white/80 outline-none"
                style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)" }} />
              <p className="text-[10px] text-white/25 mt-2">Default: Bahasa Sunda</p>
            </div>

            {/* Nama Mulok 2 */}
            <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Nama Muatan Lokal 2</p>
              <input type="text" value={namaMulok2} onChange={e => setNamaMulok2(e.target.value)}
                placeholder="Kosongkan jika tidak ada"
                className="w-full h-11 px-3 rounded-xl text-sm text-white/80 outline-none"
                style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)" }} />
              <p className="text-[10px] text-white/25 mt-2">Opsional mapel tambahan</p>
            </div>

            {/* Nama Mulok 3 */}
            <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Nama Muatan Lokal 3</p>
              <input type="text" value={namaMulok3} onChange={e => setNamaMulok3(e.target.value)}
                placeholder="Kosongkan jika tidak ada"
                className="w-full h-11 px-3 rounded-xl text-sm text-white/80 outline-none"
                style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)" }} />
              <p className="text-[10px] text-white/25 mt-2">Opsional mapel tambahan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5">
            {/* Nomor SK Kelulusan */}
            <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Nomor SK Kelulusan</p>
              <input type="text" value={skLulusNomor} onChange={e => setSkLulusNomor(e.target.value)}
                placeholder="800/032-SD/2026"
                className="w-full h-11 px-3 rounded-xl text-sm text-white/80 outline-none"
                style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)" }} />
              <p className="text-[10px] text-white/25 mt-2">Nomor Surat Keputusan Kepala Sekolah</p>
            </div>

            {/* Tentang SK Kelulusan */}
            <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Tentang SK Kelulusan</p>
              <input type="text" value={skLulusTentang} onChange={e => setSkLulusTentang(e.target.value)}
                placeholder="Kriteria Kelulusan Peserta Didik Tahun Pelajaran 2025/2026"
                className="w-full h-11 px-3 rounded-xl text-sm text-white/80 outline-none"
                style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)" }} />
              <p className="text-[10px] text-white/25 mt-2">Isi perihal SK yang tercetak di SKL</p>
            </div>

            {/* Format SKL */}
            <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Format Cetak SKL</p>
              <select value={formatSkl} onChange={e => setFormatSkl(e.target.value)}
                className="w-full h-11 px-3 rounded-xl text-sm text-white/80 outline-none"
                style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }}>
                <option value="format_1" style={{ background: "#111" }}>Format 1 (Dengan Nilai)</option>
                <option value="format_2" style={{ background: "#111" }}>Format 2 (Hanya Rata-Rata)</option>
              </select>
              <p className="text-[10px] text-white/25 mt-2">Format dokumen SKL yang dicetak</p>
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
              <p className="text-xs text-white/35 mt-1">Klik tombol edit untuk menginput nilai & nomor SKL</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => window.open("/portal/kelulusan/skl/bulk", "_blank")} disabled={saving || stats.lulus === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 transition-all disabled:opacity-40">
                <Printer size={12} /> Cetak Semua SKL
              </button>
              <button onClick={() => window.open("/portal/kelulusan/transkrip/bulk", "_blank")} disabled={saving || stats.lulus === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all disabled:opacity-40">
                <Printer size={12} /> Cetak Semua Transkrip
              </button>
              <button onClick={() => { setBulkNumberType("skl"); setShowBulkNumberModal(true); }} disabled={saving || stats.lulus === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all disabled:opacity-40">
                <Calculator size={12} /> Gen No SKL
              </button>
              <button onClick={() => { setBulkNumberType("transkrip"); setShowBulkNumberModal(true); }} disabled={saving || stats.lulus === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-all disabled:opacity-40">
                <Calculator size={12} /> Gen No Transkrip
              </button>
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
                  <th onClick={() => handleSort("nama")} className="text-left px-4 py-3 text-[10px] font-bold text-white/30 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                    <div className="flex items-center gap-1.5 select-none">
                      Siswa
                      {sortField === "nama" ? (
                        sortOrder === "asc" ? <ArrowUp size={10} className="text-violet-400" /> : <ArrowDown size={10} className="text-violet-400" />
                      ) : <ArrowUpDown size={10} className="opacity-20" />}
                    </div>
                  </th>
                  <th onClick={() => handleSort("nisn")} className="text-center px-4 py-3 text-[10px] font-bold text-white/30 uppercase tracking-widest cursor-pointer hover:text-white transition-colors hidden md:table-cell">
                    <div className="flex items-center justify-center gap-1.5 select-none">
                      NISN
                      {sortField === "nisn" ? (
                        sortOrder === "asc" ? <ArrowUp size={10} className="text-violet-400" /> : <ArrowDown size={10} className="text-violet-400" />
                      ) : <ArrowUpDown size={10} className="opacity-20" />}
                    </div>
                  </th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-white/30 uppercase tracking-widest hidden md:table-cell select-none">No. SKL</th>
                  <th onClick={() => handleSort("rata_rata")} className="text-center px-4 py-3 text-[10px] font-bold text-white/30 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                    <div className="flex items-center justify-center gap-1.5 select-none">
                      Rata-Rata
                      {sortField === "rata_rata" ? (
                        sortOrder === "asc" ? <ArrowUp size={10} className="text-violet-400" /> : <ArrowDown size={10} className="text-violet-400" />
                      ) : <ArrowUpDown size={10} className="opacity-20" />}
                    </div>
                  </th>
                  <th onClick={() => handleSort("status")} className="text-center px-4 py-3 text-[10px] font-bold text-white/30 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                    <div className="flex items-center justify-center gap-1.5 select-none">
                      Status
                      {sortField === "status" ? (
                        sortOrder === "asc" ? <ArrowUp size={10} className="text-violet-400" /> : <ArrowDown size={10} className="text-violet-400" />
                      ) : <ArrowUpDown size={10} className="opacity-20" />}
                    </div>
                  </th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-white/30 uppercase tracking-widest select-none">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFiltered.map((s, i) => (
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
                    <td className="text-center px-4 py-3 text-white/60 font-mono text-xs hidden md:table-cell">
                      {s.nomor_skl || <span className="text-white/15">—</span>}
                    </td>
                    <td className="text-center px-4 py-3 font-bold text-xs text-amber-400/80">
                      {getSiswaAverage(s)}
                    </td>
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
                        <button onClick={() => openPrintModal(s)} title="Cetak SKL" disabled={s.status_kelulusan !== "LULUS"}
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-sky-400/70 border border-white/5 hover:text-sky-400 hover:bg-sky-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                          <Printer size={14} />
                        </button>
                        <button onClick={() => handleCetakTranskrip(s.nisn)} title="Cetak Transkrip" disabled={s.status_kelulusan !== "LULUS"}
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-indigo-400/70 border border-white/5 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                          <Printer size={14} />
                        </button>
                        <button onClick={() => openNilaiModal(s)} title="Input Nilai & Nomor SKL"
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-white/40 border border-white/5 hover:text-amber-400 hover:bg-amber-500/10 transition-all">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => updateStatus(s.id, "LULUS")} title="Set LULUS"
                          className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all", s.status_kelulusan === "LULUS" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-white/20 border border-white/5 hover:text-emerald-400 hover:bg-emerald-500/10")}>
                          <CheckCircle size={14} />
                        </button>
                        <button onClick={() => updateStatus(s.id, "TIDAK LULUS")} title="Set TIDAK LULUS"
                          className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all", s.status_kelulusan === "TIDAK LULUS" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-white/5 text-white/20 border border-white/5 hover:text-rose-400 hover:bg-rose-500/10")}>
                          <XCircle size={14} />
                        </button>
                        <button
                          onClick={() => openPrintModal(s)}
                          disabled={s.status_kelulusan !== "LULUS"}
                          title={s.status_kelulusan === "LULUS" ? "Cetak SKL" : "Siswa belum lulus"}
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                            s.status_kelulusan === "LULUS"
                              ? "bg-white/5 text-white/40 border border-white/5 hover:text-sky-400 hover:bg-sky-500/10 cursor-pointer"
                              : "bg-white/5 text-white/10 border border-white/5 cursor-not-allowed opacity-40"
                          )}
                        >
                          <Printer size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-white/20 text-sm">Tidak ada data siswa ditemukan</td></tr>
                )}
              </tbody>
            </table>

            <AuroraPagination
              currentPage={currentPage}
              totalItems={filtered.length}
              perPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onPerPageChange={setItemsPerPage}
              perPageOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      </PageCard>

      {/* ── MODAL INPUT NILAI & NOMOR SKL ── */}
      {modalSiswa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl rounded-2xl overflow-hidden border border-white/10"
            style={{ background: "linear-gradient(135deg, #0e1630 0%, #080d1e 100%)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Input Nilai & Nomor SKL</h3>
                <p className="text-xs text-white/40">{modalSiswa.nama} • NISN: {modalSiswa.nisn}</p>
              </div>
              <button onClick={() => setModalSiswa(null)} className="text-white/40 hover:text-white transition-colors">
                <XCircle size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
              {/* Nomor SKL, Transkrip, Ijazah */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Nomor Surat Keterangan Lulus (SKL)</label>
                  <input type="text" value={modalNomorSkl} onChange={e => setModalNomorSkl(e.target.value)}
                    placeholder="Contoh: 400.3.11/001/........./2026"
                    className="w-full h-11 px-4 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/20"
                    style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)" }} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Nomor Transkrip Nilai</label>
                    <input type="text" value={modalNilai.nomor_transkrip || ""} onChange={e => setModalNilai(prev => ({ ...prev, nomor_transkrip: e.target.value }))}
                      placeholder="Nomor Transkrip"
                      className="w-full h-11 px-4 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/20"
                      style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)" }} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Nomor Ijazah</label>
                    <input type="text" value={modalNilai.nomor_ijazah || ""} onChange={e => setModalNilai(prev => ({ ...prev, nomor_ijazah: e.target.value }))}
                      placeholder="DN-02/D-SD/0000001"
                      className="w-full h-11 px-4 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/20"
                      style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)" }} />
                  </div>
                </div>
              </div>

              {/* Nilai Mata Pelajaran */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2.5 pb-1 border-b border-white/5">Nilai Mata Pelajaran</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { key: "pai", label: "Pendidikan Agama & BP" },
                      { key: "ppkn", label: "Pendidikan Pancasila" },
                      { key: "indo", label: "Bahasa Indonesia" },
                      { key: "mtk", label: "Matematika" },
                      { key: "ipas", label: "IPAS" },
                      { key: "sbdp", label: "Seni Budaya & Prakarya (Seni Rupa)" },
                      { key: "pjok", label: "PJOK" },
                      { key: "bing", label: "Bahasa Inggris" },
                      { key: "mulok1", label: namaMulok1 || "Muatan Lokal 1" },
                      ...(namaMulok2 || modalNilai.mulok2 ? [{ key: "mulok2", label: namaMulok2 || "Muatan Lokal 2" }] : []),
                      ...(namaMulok3 || modalNilai.mulok3 ? [{ key: "mulok3", label: namaMulok3 || "Muatan Lokal 3" }] : []),
                    ].map(subj => (
                      <div key={subj.key} className="space-y-1">
                        <label className="text-[9px] text-white/50 pl-0.5 truncate block" title={subj.label}>{subj.label}</label>
                        <input type="text" value={modalNilai[subj.key] || ""}
                          onChange={e => setModalNilai({ ...modalNilai, [subj.key]: e.target.value })}
                          placeholder="00.00"
                          className="w-full h-10 px-3 rounded-lg text-sm text-white font-bold outline-none text-center focus:ring-2 focus:ring-amber-500/20"
                          style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)" }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rata-Rata Box */}
              <div className="p-4 rounded-xl flex items-center justify-between border border-emerald-500/20 bg-emerald-500/5">
                <div>
                  <h4 className="text-xs font-bold text-emerald-400">Rata-Rata Nilai (Otomatis)</h4>
                  <p className="text-[10px] text-white/30">Dihitung otomatis berdasarkan mapel yang diisi</p>
                </div>
                <div className="text-2xl font-black text-emerald-400">{averageNilai.replace(".", ",")}</div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/5 bg-black/20 flex justify-end gap-2.5">
              <button onClick={() => setModalSiswa(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                Batal
              </button>
              <button onClick={handleSaveNilai} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all"
                style={{ background: "linear-gradient(135deg, #D4A843, #b8860b)" }}>
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Simpan Nilai & Nomor
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── MODAL BULK GENERATE NOMOR SKL ── */}
      {showBulkNumberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl overflow-hidden border border-white/10"
            style={{ background: "linear-gradient(135deg, #0e1630 0%, #080d1e 100%)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
            
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Generate Nomor SKL Berurutan</h3>
                <p className="text-xs text-white/40">Buat nomor surat otomatis untuk siswa LULUS</p>
              </div>
              <button onClick={() => setShowBulkNumberModal(false)} className="text-white/40 hover:text-white transition-colors">
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Template Format */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Template Format Nomor</label>
                <input type="text" value={bulkTemplate} onChange={e => setBulkTemplate(e.target.value)}
                  placeholder="Contoh: 400.3.11/{seq}/........./2026"
                  className="w-full h-11 px-4 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/20"
                  style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)" }} />
                <p className="text-[9px] text-white/30 italic">Gunakan tag <b>{`{seq}`}</b> untuk penomoran berurutan</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Start Number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Nomor Awal</label>
                  <input type="number" min={1} value={bulkStartNum} onChange={e => setBulkStartNum(parseInt(e.target.value) || 1)}
                    className="w-full h-11 px-4 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/20 text-center"
                    style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)" }} />
                </div>
                {/* Padding */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Lebar Digit (Padding)</label>
                  <input type="number" min={0} max={6} value={bulkPadding} onChange={e => setBulkPadding(parseInt(e.target.value) || 0)}
                    className="w-full h-11 px-4 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/20 text-center"
                    style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)" }} />
                  <p className="text-[8px] text-white/20 text-center mt-1">3 = 001, 2 = 01, 0 = 1</p>
                </div>
              </div>

              {/* Order By */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Urutan Berdasarkan</label>
                <div className="flex gap-2">
                  <button onClick={() => setBulkSort("nama")}
                    className={cn("flex-1 h-10 rounded-xl text-xs font-bold transition-all border", bulkSort === "nama" ? "text-amber-400 bg-amber-500/10 border-amber-500/30" : "text-white/40 bg-white/5 border-white/5")}>
                    Nama Siswa (A-Z)
                  </button>
                  <button onClick={() => setBulkSort("nisn")}
                    className={cn("flex-1 h-10 rounded-xl text-xs font-bold transition-all border", bulkSort === "nisn" ? "text-amber-400 bg-amber-500/10 border-amber-500/30" : "text-white/40 bg-white/5 border-white/5")}>
                    NISN
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/5 bg-black/20 flex justify-end gap-2.5">
              <button onClick={() => setShowBulkNumberModal(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                Batal
              </button>
              <button onClick={handleBulkGenerateNumbers} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all"
                style={{ background: "linear-gradient(135deg, #D4A843, #b8860b)" }}>
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Calculator size={12} />}
                Generate Sekarang
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── MODAL CETAK SATUAN (TTD & Stempel Toggle) ── */}
      {printModalSiswa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl overflow-hidden border border-white/10"
            style={{ background: "linear-gradient(135deg, #0e1630 0%, #080d1e 100%)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Printer size={16} className="text-sky-400" /> Cetak SKL
                </h3>
                <p className="text-xs text-white/40 mt-0.5">{printModalSiswa.nama} • NISN: {printModalSiswa.nisn}</p>
              </div>
              <button onClick={() => setPrintModalSiswa(null)} className="text-white/40 hover:text-white transition-colors">
                <XCircle size={20} />
              </button>
            </div>

            {/* Body - Toggle TTD & Stempel */}
            <div className="p-6 space-y-4">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Pengaturan Cetak</p>
              <div className="space-y-3">
                {/* Toggle TTD */}
                <label className="flex items-center justify-between p-3.5 bg-white/[0.03] border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-sm">✍️</div>
                    <div>
                      <span className="text-sm font-bold text-white/90 group-hover:text-amber-400 transition-colors">Tanda Tangan</span>
                      <p className="text-[10px] text-white/35">Tampilkan TTD Kepala Sekolah</p>
                    </div>
                  </div>
                  <div className="relative flex items-center justify-center shrink-0">
                    <input type="checkbox" checked={printShowTtd} onChange={(e) => setPrintShowTtd(e.target.checked)} className="peer sr-only" />
                    <div className="w-10 h-5.5 bg-white/10 rounded-full peer-checked:bg-amber-500 transition-colors border border-white/5" />
                    <div className="absolute left-0.5 w-4.5 h-4.5 bg-white rounded-full transition-transform peer-checked:translate-x-[18px] shadow-sm" />
                  </div>
                </label>

                {/* Toggle Stempel */}
                <label className="flex items-center justify-between p-3.5 bg-white/[0.03] border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-sm">🔏</div>
                    <div>
                      <span className="text-sm font-bold text-white/90 group-hover:text-sky-400 transition-colors">Stempel Resmi</span>
                      <p className="text-[10px] text-white/35">Tampilkan stempel sekolah</p>
                    </div>
                  </div>
                  <div className="relative flex items-center justify-center shrink-0">
                    <input type="checkbox" checked={printShowStempel} onChange={(e) => setPrintShowStempel(e.target.checked)} className="peer sr-only" />
                    <div className="w-10 h-5.5 bg-white/10 rounded-full peer-checked:bg-sky-500 transition-colors border border-white/5" />
                    <div className="absolute left-0.5 w-4.5 h-4.5 bg-white rounded-full transition-transform peer-checked:translate-x-[18px] shadow-sm" />
                  </div>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/5 bg-black/20 flex justify-end gap-2.5">
              <button onClick={() => setPrintModalSiswa(null)} className="px-4 py-2.5 rounded-xl text-xs font-bold text-white/60 bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                Batal
              </button>
              <button onClick={handleCetakSatuan}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #D4A843, #b8860b)", boxShadow: "0 4px 15px -3px rgba(212,168,67,0.3)" }}>
                <Printer size={14} /> Cetak Sekarang
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </PageShell>
  );
}
