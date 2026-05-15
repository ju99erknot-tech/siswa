"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Search,
  Filter,
  Download,
  Smartphone,
  Lock,
  ChevronRight,
  TrendingUp,
  History,
  QrCode,
  DollarSign,
  Plus,
  Loader2,
} from "lucide-react";
import {
  PageShell,
  PageHeader,
  PageCard,
  AuroraTable,
  ATRow,
  ATCell,
  EmptyState,
  AuroraModal,
  AuroraInput,
  AuroraSelect,
} from "@/components/shared/PageShell";
import { SiswaPicker } from "@/components/shared/SiswaPicker";
import type { Siswa } from "@/types";
import { toast } from "sonner";
import { usePIP } from "@/hooks/usePIP";
import { useSiswa } from "@/hooks/useSiswa";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function DigitalWalletPage() {
  const { dataPIP, isLoading: pipLoading, addPIP } = usePIP();
  const { data: siswaList, isLoading: siswaLoading } = useSiswa();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    siswa: null as Siswa | null,
    tahun: new Date().getFullYear().toString(),
    tahap: "1",
    status: "Belum Cair",
    nominal: "450000",
    keterangan: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.siswa) {
      toast.error("Pilih siswa terlebih dahulu");
      return;
    }
    setSaving(true);
    const ok = await addPIP({
      nama: form.siswa.nama,
      nisn: form.siswa.nisn || "",
      kelas: form.siswa.kelas || "",
      tahun: form.tahun,
      tahap: form.tahap,
      status: form.status,
      nominal: form.nominal,
      keterangan: form.keterangan,
    });
    setSaving(false);
    if (ok) {
      setShowForm(false);
      setForm({ ...form, siswa: null, keterangan: "" });
    }
  };

  const stats = useMemo(() => {
    const totalPenerima = dataPIP.length;
    const totalNominal = dataPIP.reduce(
      (sum, p) => sum + (parseInt(p.nominal || "0") || 0),
      0,
    );
    const sudahCair = dataPIP.filter((p) => p.status === "Sudah Cair").length;
    return { totalPenerima, totalNominal, sudahCair };
  }, [dataPIP]);

  const filteredHistory = useMemo(() => {
    return dataPIP
      .filter(
        (p) =>
          !search ||
          p.nama.toLowerCase().includes(search.toLowerCase()) ||
          p.nisn?.includes(search),
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [dataPIP, search]);

  return (
    <PageShell>
      <PageHeader
        icon={<Wallet className="w-6 h-6 text-cyan-400" />}
        title="Aurora Digital Wallet"
        subtitle="Manajemen dana bantuan dan riwayat transaksi keuangan siswa"
        gradient="linear-gradient(135deg, #0a1a1f 0%, #050811 50%, #050811 100%)"
        glowColor="rgba(34,211,238,0.15)"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.json_to_sheet(
                  filteredHistory.map((p) => ({
                    Nama: p.nama,
                    NISN: p.nisn,
                    Kelas: p.kelas,
                    Tahun: p.tahun,
                    Tahap: p.tahap || "-",
                    Status: p.status,
                    Nominal: p.nominal || "0",
                    Keterangan: p.keterangan || "",
                  })),
                );
                XLSX.utils.book_append_sheet(wb, ws, "Laporan Wallet");
                XLSX.writeFile(
                  wb,
                  `Laporan_Digital_Wallet_${new Date().toLocaleDateString("id-ID").replace(/\//g, "-")}.xlsx`,
                );
              }}
              className="btn-solid btn-sm bg-white/5 border-white/10 text-white/60 flex items-center gap-2 hover:bg-white/10 transition-all"
            >
              <Download size={14} /> Ekspor Laporan
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="btn-solid btn-sm bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2 shadow-lg shadow-cyan-900/20 transition-all"
            >
              <Plus size={14} /> Input Transaksi
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Virtual Cards & Stats */}
        <div className="lg:col-span-1 space-y-8">
          {/* Virtual Card Wrapper */}
          <div className="relative group perspective-1000">
            <motion.div
              initial={{ rotateY: -10, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative w-full h-[220px] rounded-[32px] p-8 overflow-hidden shadow-2xl transition-all duration-500 group-hover:scale-[1.02]"
              style={{
                background:
                  "linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #1e1b4b 100%)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              }}
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-400/20 rounded-full blur-[60px] opacity-50" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-600/20 rounded-full blur-[50px] opacity-50" />

              {/* Card Content */}
              <div className="relative h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                      <CreditCard className="text-white" size={20} />
                    </div>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                      Kartu Siswa Digital
                    </span>
                  </div>
                  <Smartphone className="text-white/20" size={18} />
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em]">
                    Total Saldo PIP Terdistribusi
                  </p>
                  <p className="text-3xl font-black text-white tabular-nums tracking-tighter">
                    Rp {stats.totalNominal.toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-white/40">
                  <span className="tracking-[0.2em]">Dana PIP</span>
                  <div className="flex items-center gap-3">
                    <QrCode size={16} className="opacity-50" />
                    <span>Terverifikasi</span>
                  </div>
                </div>
              </div>

              {/* Decorative Mesh */}
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                  backgroundSize: "24px 24px",
                }}
              />
            </motion.div>
          </div>

          {/* Mini Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card-obsidian rounded-3xl p-5 border-white/5 bg-white/[0.01]">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">
                Sudah Cair
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-emerald-400">
                  {stats.sudahCair}
                </span>
                <TrendingUp size={14} className="text-emerald-500/30" />
              </div>
            </div>
            <div className="card-obsidian rounded-3xl p-5 border-white/5 bg-white/[0.01]">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">
                Penerima
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-cyan-400">
                  {stats.totalPenerima}
                </span>
                <Smartphone size={14} className="text-cyan-500/30" />
              </div>
            </div>
          </div>

          {/* Quick Security Card */}
          <div className="card-obsidian rounded-3xl p-6 border-white/5 bg-gradient-to-br from-violet-500/[0.02] to-transparent space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                <Lock size={18} className="text-violet-400" />
              </div>
              <h4 className="text-sm font-bold text-white">Keamanan Wallet</h4>
            </div>
            <p className="text-xs text-white/30 leading-relaxed">
              Seluruh transaksi diproteksi dengan enkripsi SSL 256-bit dan
              sinkronisasi real-time ke database pusat kesiswaan.
            </p>
            <button className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold text-white/40 hover:text-white/60 transition-all">
              Update Security Patch
            </button>
          </div>
        </div>

        {/* Right Column: Transaction History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <History className="text-white/20" size={18} />
              <h3 className="text-lg font-black text-white tracking-tight">
                Riwayat Distribusi Dana
              </h3>
            </div>
            <div className="relative w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
                size={14}
              />
              <input
                type="text"
                placeholder="Cari siswa atau NISN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/60 outline-none focus:border-cyan-500/30 focus:bg-white/[0.04] transition-all"
              />
            </div>
          </div>

          <PageCard
            noPad
            className="overflow-hidden border-white/5 bg-white/[0.005]"
          >
            <AuroraTable
              headers={["SISWA", "WAKTU", "STATUS", "NOMINAL", "AKSI"]}
              loading={pipLoading}
              empty={
                filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        icon={<History className="w-8 h-8" />}
                        title="Belum ada riwayat transaksi" variant="search"
                      />
                    </td>
                  </tr>
                ) : undefined
              }
            >
              {filteredHistory.map((p, i) => (
                <ATRow key={p.id}>
                  <ATCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/[0.02] border border-white/05 flex items-center justify-center text-white/20 text-xs font-bold">
                        {p.nama.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white/80">
                          {p.nama}
                        </p>
                        <p className="text-[10px] font-medium text-white/20">
                          {p.nisn} • Kelas {p.kelas}
                        </p>
                      </div>
                    </div>
                  </ATCell>
                  <ATCell className="text-white/30 text-xs">
                    {formatDistanceToNow(new Date(p.created_at), {
                      addSuffix: true,
                      locale: idLocale,
                    })}
                  </ATCell>
                  <ATCell>
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                        p.status === "Sudah Cair"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20",
                      )}
                    >
                      {p.status}
                    </span>
                  </ATCell>
                  <ATCell>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center",
                          p.status === "Sudah Cair"
                            ? "bg-emerald-500/10"
                            : "bg-amber-500/10",
                        )}
                      >
                        {p.status === "Sudah Cair" ? (
                          <ArrowDownLeft
                            size={10}
                            className="text-emerald-400"
                          />
                        ) : (
                          <TrendingUp size={10} className="text-amber-400" />
                        )}
                      </div>
                      <span className="text-sm font-bold text-white/70 tabular-nums">
                        Rp {parseInt(p.nominal || "0").toLocaleString("id-ID")}
                      </span>
                    </div>
                  </ATCell>
                  <ATCell>
                    <button className="p-2 rounded-lg hover:bg-white/5 text-white/10 hover:text-white/40 transition-all">
                      <ChevronRight size={16} />
                    </button>
                  </ATCell>
                </ATRow>
              ))}
            </AuroraTable>
          </PageCard>
        </div>
      </div>

      <AuroraModal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Input Transaksi Dana PIP"
        icon={<Wallet className="w-5 h-5 text-cyan-400" />}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">
              Pilih Penerima Dana
            </label>
            <SiswaPicker
              value={form.siswa?.id || ""}
              onChange={(s) => setForm({ ...form, siswa: s })}
              placeholder="Cari nama atau NISN..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <AuroraSelect
              label="Status Pencairan"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="Belum Cair">Belum Cair</option>
              <option value="Sudah Cair">Sudah Cair</option>
            </AuroraSelect>
            <AuroraInput
              label="Nominal (Rp)"
              type="number"
              value={form.nominal}
              onChange={(e) => setForm({ ...form, nominal: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <AuroraInput
              label="Tahun"
              value={form.tahun}
              onChange={(e) => setForm({ ...form, tahun: e.target.value })}
            />
            <AuroraInput
              label="Tahap (Ke-)"
              type="number"
              value={form.tahap}
              onChange={(e) => setForm({ ...form, tahap: e.target.value })}
            />
          </div>

          <AuroraInput
            label="Keterangan (Opsional)"
            value={form.keterangan}
            onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
            placeholder="Cth: Pencairan Tahap 1 via Bank BRI"
          />

          <button
            type="submit"
            disabled={saving}
            className="btn-solid btn-block h-12 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 border-none shadow-lg shadow-cyan-900/20"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            Simpan Transaksi
          </button>
        </form>
      </AuroraModal>
    </PageShell>
  );
}
