"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  Users,
  Loader2,
  Download,
  Send,
  Phone,
} from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { useSchoolConfig } from "@/hooks/useSchoolConfig";
import { getFotoPublic } from "@/lib/utils";
import {
  PageShell,
  PageHeader,
  PageCard,
  PageCardHeader,
  AuroraSelect,
  EmptyState,
} from "@/components/shared/PageShell";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import * as XLSX from "xlsx";

type StatusAbsen = "H" | "S" | "I" | "A" | null;

const STATUS_CFG = {
  H: {
    label: "Hadir",
    color: "#10b981",
    bg: "rgba(16,185,129,0.15)",
    border: "rgba(16,185,129,0.35)",
  },
  S: {
    label: "Sakit",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
    border: "rgba(245,158,11,0.35)",
  },
  I: {
    label: "Izin",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.15)",
    border: "rgba(96,165,250,0.35)",
  },
  A: {
    label: "Alpha",
    color: "#f43f5e",
    bg: "rgba(244,63,94,0.15)",
    border: "rgba(244,63,94,0.35)",
  },
} as const;

export default function AbsensiPage() {
  const config = useSchoolConfig();
  const { dataSiswa } = useAppStore();
  const KUMPULAN_KELAS = useMemo(
    () =>
      [
        ...new Set(dataSiswa.map((s) => s.kelas).filter(Boolean)),
      ].sort() as string[],
    [dataSiswa],
  );
  const [selectedKelas, setSelectedKelas] = useState<string>("");

  useEffect(() => {
    if (!selectedKelas && KUMPULAN_KELAS.length > 0) {
      setSelectedKelas(KUMPULAN_KELAS[0]);
    }
  }, [KUMPULAN_KELAS, selectedKelas]);
  const [tanggal] = useState(format(new Date(), "yyyy-MM-dd"));
  const [absen, setAbsen] = useState<Record<string, StatusAbsen>>({});
  const [keterangan, setKeterangan] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const siswaKelas = useMemo(
    () =>
      dataSiswa
        .filter((s) => s.kelas === selectedKelas)
        .sort((a, b) => a.nama.localeCompare(b.nama)),
    [dataSiswa, selectedKelas],
  );

  const stats = useMemo(() => {
    const entries = Object.values(absen);
    return {
      hadir: entries.filter((s) => s === "H").length,
      sakit: entries.filter((s) => s === "S").length,
      izin: entries.filter((s) => s === "I").length,
      alpha: entries.filter((s) => s === "A").length,
      belum: siswaKelas.length - entries.filter(Boolean).length,
    };
  }, [absen, siswaKelas]);

  const selectStyle = {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.7)",
    appearance: "none" as const,
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='rgba(255,255,255,0.35)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 12px center",
    paddingRight: "36px",
  };

  const setAllHadir = () => {
    const all: Record<string, StatusAbsen> = {};
    siswaKelas.forEach((s) => {
      all[s.id] = "H";
    });
    setAbsen(all);
    toast.success(`${siswaKelas.length} siswa ditandai Hadir`);
  };

  const handleSave = async () => {
    const filled = siswaKelas.filter((s) => absen[s.id]);
    if (!filled.length) {
      toast.error("Belum ada absensi yang diisi");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const rows = filled.map((s) => ({
        siswa_id: s.id,
        nama_siswa: s.nama,
        kelas: selectedKelas,
        tanggal,
        status: absen[s.id]!,
        keterangan: keterangan[s.id] || "",
        sekolah: config.namaSekolah,
      }));
      const { error } = await supabase
        .from("absensi")
        .upsert(rows, { onConflict: "siswa_id,tanggal" });
      if (error) throw error;
      toast.success(`Absensi ${selectedKelas} berhasil disimpan`);
    } catch {
      toast.error("Gagal menyimpan absensi");
    } finally {
      setSaving(false);
    }
  };

  const handleWABlast = () => {
    const alphaList = siswaKelas.filter((s) => absen[s.id] === "A");
    if (!alphaList.length) {
      toast.error("Tidak ada siswa Alpha");
      return;
    }
    const tgl = format(new Date(), "EEEE, d MMMM yyyy", { locale: idLocale });
    const sentCount = alphaList.filter((s) => s.no_wa).length;
    alphaList.forEach((s) => {
      if (!s.no_wa) return;
      const msg = encodeURIComponent(
        `Assalamu'alaikum Bapak/Ibu Orang Tua dari *${s.nama}*.\n\nPada hari *${tgl}*, putra/putri Bapak/Ibu tidak hadir di sekolah tanpa keterangan (Alpha).\n\nMohon konfirmasi ke guru wali kelas.\n\nTerima kasih.\n_${config.namaSekolah}_`,
      );
      window.open(
        `https://wa.me/${s.no_wa.replace(/\D/g, "")}?text=${msg}`,
        "_blank",
      );
    });
    toast.success(`WA Blast dikirim ke ${sentCount} orang tua`);
  };

  const handleExport = () => {
    const rows = siswaKelas.map((s, i) => ({
      No: i + 1,
      Nama: s.nama,
      NISN: s.nisn || "-",
      Kelas: selectedKelas,
      Tanggal: tanggal,
      Status:
        STATUS_CFG[absen[s.id] as keyof typeof STATUS_CFG]?.label || "Belum",
      Keterangan: keterangan[s.id] || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Absensi ${selectedKelas}`);
    XLSX.writeFile(
      wb,
      `Absensi_${selectedKelas.replace(/\s/g, "_")}_${tanggal}.xlsx`,
    );
    toast.success("Rekap absensi berhasil diunduh");
  };

  return (
    <PageShell>
      <PageHeader
        icon={<ClipboardList className="w-6 h-6 text-violet-400" />}
        title="Absensi Harian"
        subtitle={`${config.namaSekolah} · ${format(new Date(), "EEEE, d MMMM yyyy", { locale: idLocale })}`}
        gradient="linear-gradient(135deg, #1a0533 0%, #0c0820 50%, #050d1e 100%)"
        glowColor="rgba(139,92,246,0.35)"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Kelas select */}
            <select
              value={selectedKelas}
              onChange={(e) => {
                setSelectedKelas(e.target.value);
                setAbsen({});
                setKeterangan({});
              }}
              className="h-9 rounded-xl px-3 text-[12px] font-semibold outline-none"
              style={selectStyle}
            >
              {KUMPULAN_KELAS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <button
              onClick={setAllHadir}
              className="h-9 px-3 rounded-xl text-[11px] font-bold text-emerald-400 hover:bg-emerald-400/10 transition-all"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              âœ“ Hadir Semua
            </button>
            <button
              onClick={handleWABlast}
              className="h-9 px-3 rounded-xl text-[11px] font-bold text-green-400 hover:bg-green-400/10 transition-all"
              style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.2)",
              }}
            >
              <Phone className="w-3.5 h-3.5 inline mr-1" />
              WA Alpha
            </button>
            <button
              onClick={handleExport}
              className="h-9 px-3 rounded-xl text-[11px] font-bold text-blue-400 hover:bg-blue-400/10 transition-all"
              style={{
                background: "rgba(59,130,246,0.08)",
                border: "1px solid rgba(59,130,246,0.2)",
              }}
            >
              <Download className="w-3.5 h-3.5 inline mr-1" />
              Excel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-9 px-4 rounded-xl text-[12px] font-bold text-white flex items-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                boxShadow: "0 4px 14px rgba(139,92,246,0.35)",
              }}
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Simpan
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Hadir", value: stats.hadir, color: "#10b981" },
          { label: "Sakit", value: stats.sakit, color: "#f59e0b" },
          { label: "Izin", value: stats.izin, color: "#60a5fa" },
          { label: "Alpha", value: stats.alpha, color: "#f43f5e" },
          { label: "Belum", value: stats.belum, color: "#6b7280" },
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

      {/* Attendance list */}
      <PageCard noPad>
        <PageCardHeader
          title={`${selectedKelas} — ${siswaKelas.length} Siswa`}
          subtitle={`Tanggal: ${tanggal}`}
          icon={<Users className="w-4 h-4" />}
        />
        {siswaKelas.length === 0 ? (
          <EmptyState
            icon={<Users className="w-7 h-7" />}
            title="Tidak ada siswa di kelas ini" variant="search"
            subtitle="Pilih kelas lain"
          />
        ) : (
          <div>
            {siswaKelas.map((siswa, idx) => {
              const current = absen[siswa.id];
              const needKet = current === "S" || current === "I";
              return (
                <motion.div
                  key={siswa.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                  style={{
                    borderBottom:
                      idx < siswaKelas.length - 1
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "none",
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{
                        background: "rgba(139,92,246,0.12)",
                        color: "#a78bfa",
                        border: "1px solid rgba(139,92,246,0.2)",
                      }}
                    >
                      {getFotoPublic(siswa.foto_url) ? (
                        <img
                          src={getFotoPublic(siswa.foto_url)!}
                          alt={siswa.nama}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[13px] font-black">
                          {siswa.nama.charAt(0)}
                        </span>
                      )}
                    </div>
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-white/80 truncate">
                        {siswa.nama}
                      </p>
                      <p className="text-[10px] text-white/25 font-mono">
                        {siswa.nisn || "—"}
                      </p>
                    </div>
                    {/* Status buttons */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {(["H", "S", "I", "A"] as const).map((st) => {
                        const cfg = STATUS_CFG[st];
                        const active = current === st;
                        return (
                          <button
                            key={st}
                            onClick={() =>
                              setAbsen((prev) => ({
                                ...prev,
                                [siswa.id]: prev[siswa.id] === st ? null : st,
                              }))
                            }
                            className="w-9 h-9 rounded-xl text-[11px] font-black transition-all duration-200"
                            style={{
                              background: active
                                ? cfg.bg
                                : "rgba(255,255,255,0.03)",
                              border: `1px solid ${active ? cfg.border : "rgba(255,255,255,0.06)"}`,
                              color: active
                                ? cfg.color
                                : "rgba(255,255,255,0.25)",
                              transform: active ? "scale(1.08)" : "scale(1)",
                            }}
                          >
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Keterangan input */}
                  <AnimatePresence>
                    {needKet && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <input
                          type="text"
                          placeholder={
                            current === "S"
                              ? "Jenis sakit / diagnosa..."
                              : "Alasan izin..."
                          }
                          value={keterangan[siswa.id] || ""}
                          onChange={(e) =>
                            setKeterangan((prev) => ({
                              ...prev,
                              [siswa.id]: e.target.value,
                            }))
                          }
                          className="w-full mt-2 h-9 pl-3 pr-3 rounded-xl text-[12px] text-white/70 outline-none"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </PageCard>
    </PageShell>
  );
}
