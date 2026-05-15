"use client";

/*
 * Required DB migration:
 * CREATE TABLE IF NOT EXISTS jadwal (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   kelas text NOT NULL,
 *   hari text NOT NULL,
 *   jam_ke int NOT NULL,
 *   mapel text NOT NULL,
 *   nama_guru text,
 *   jam_mulai text,
 *   jam_selesai text,
 *   created_at timestamptz DEFAULT now(),
 *   updated_at timestamptz DEFAULT now()
 * );
 * CREATE UNIQUE INDEX IF NOT EXISTS jadwal_unique ON jadwal(kelas, hari, jam_ke);
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Plus,
  Save,
  Printer,
  AlertTriangle,
  Trash2,
  Copy,
  Clock,
  BookOpen,
  User,
  Coffee
} from "lucide-react";
import { toast } from "sonner";
import {
  PageShell,
  PageHeader,
  PageCard,
  StatCards,
  AuroraModal,
  AuroraInput,
  AuroraSelect,
  EmptyState
} from "@/components/shared/PageShell";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app.store";
import { useSchoolConfig } from "@/hooks/useSchoolConfig";
import { cn } from "@/lib/utils";

// ── Config ────────────────────────────────────────────────────
const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

const JAM_MAP: Record<
  number,
  { label: string; mulai: string; selesai: string; isBreak?: boolean }
> = {
  1: { label: "Jam 1", mulai: "07:30", selesai: "08:10" },
  2: { label: "Jam 2", mulai: "08:10", selesai: "08:50" },
  3: { label: "Jam 3", mulai: "08:50", selesai: "09:30" },
  97: { label: "Istirahat", mulai: "09:30", selesai: "09:45", isBreak: true },
  4: { label: "Jam 4", mulai: "09:45", selesai: "10:25" },
  5: { label: "Jam 5", mulai: "10:25", selesai: "11:05" },
  6: { label: "Jam 6", mulai: "11:05", selesai: "11:45" },
  98: { label: "Istirahat", mulai: "11:45", selesai: "12:15", isBreak: true },
  7: { label: "Jam 7", mulai: "12:15", selesai: "12:55" },
  8: { label: "Jam 8", mulai: "12:55", selesai: "13:35" },
};

const JAM_ORDER = [1, 2, 3, 97, 4, 5, 6, 98, 7, 8];
const REAL_JAMS = [1, 2, 3, 4, 5, 6, 7, 8];

const MAPEL_LIST = [
  "Matematika",
  "Bahasa Indonesia",
  "IPA",
  "IPS",
  "PKn / PPKn",
  "PJOK",
  "Seni Budaya & Prakarya",
  "Pendidikan Agama Islam",
  "Bahasa Inggris",
  "Muatan Lokal",
  "Bimbingan Konseling",
];

const MAPEL_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  Matematika:               { bg: "rgba(59,130,246,0.12)", text: "#3b82f6", border: "rgba(59,130,246,0.25)" },
  "Bahasa Indonesia":       { bg: "rgba(34,197,94,0.12)", text: "#22c55e", border: "rgba(34,197,94,0.25)" },
  IPA:                      { bg: "rgba(6,182,212,0.12)", text: "#06b6d4", border: "rgba(6,182,212,0.25)" },
  IPS:                      { bg: "rgba(245,158,11,0.12)", text: "#f59e0b", border: "rgba(245,158,11,0.25)" },
  "PKn / PPKn":             { bg: "rgba(168,85,247,0.12)", text: "#a855f7", border: "rgba(168,85,247,0.25)" },
  PJOK:                     { bg: "rgba(239,68,68,0.12)", text: "#ef4444", border: "rgba(239,68,68,0.25)" },
  "Seni Budaya & Prakarya": { bg: "rgba(236,72,153,0.12)", text: "#ec4899", border: "rgba(236,72,153,0.25)" },
  "Pendidikan Agama Islam": { bg: "rgba(249,115,22,0.12)", text: "#f97316", border: "rgba(249,115,22,0.25)" },
  "Bahasa Inggris":         { bg: "rgba(16,185,129,0.12)", text: "#10b981", border: "rgba(16,185,129,0.25)" },
  "Muatan Lokal":           { bg: "rgba(99,102,241,0.12)", text: "#6366f1", border: "rgba(99,102,241,0.25)" },
  "Bimbingan Konseling":    { bg: "rgba(107,114,128,0.12)", text: "#9ca3af", border: "rgba(107,114,128,0.25)" },
};

const getMapelColor = (mapel: string) => MAPEL_COLOR[mapel] ?? { bg: "rgba(139,92,246,0.12)", text: "#a78bfa", border: "rgba(139,92,246,0.25)" };

interface JadwalItem {
  id: string;
  kelas: string;
  hari: string;
  jam_ke: number;
  mapel: string;
  nama_guru?: string | null;
  jam_mulai?: string | null;
  jam_selesai?: string | null;
}

const emptyForm = { mapel: "", namaGuru: "" };

export default function JadwalPage() {
  const { dataSiswa, dataGuru } = useAppStore();
  const config = useSchoolConfig();

  const [jadwalData, setJadwalData] = useState<JadwalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    hari: string;
    jam_ke: number;
  } | null>(null);
  const [editingItem, setEditingItem] = useState<JadwalItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // ── Kelas list ────────────────────────────────────────────
  const kelasList = useMemo(
    () =>
      [...new Set(dataSiswa.map((s) => s.kelas).filter(Boolean))].sort() as string[],
    [dataSiswa],
  );

  useEffect(() => {
    if (!selectedKelas && kelasList.length > 0) setSelectedKelas(kelasList[0]);
  }, [kelasList, selectedKelas]);

  const supabase = createClient();

  // ── Fetch jadwal ──────────────────────────────────────────
  const fetchJadwal = useCallback(async () => {
    if (!selectedKelas) return;
    setLoading(true);
    setDbError(false);
    try {
      const { data, error } = await supabase
        .from("jadwal")
        .select("*")
        .eq("kelas", selectedKelas)
        .order("jam_ke");
      if (error) {
        if (
          error.message.includes("relation") ||
          error.message.includes("does not exist")
        ) {
          setDbError(true);
        } else {
          toast.error("Gagal memuat jadwal");
        }
        setJadwalData([]);
      } else {
        setJadwalData(data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedKelas]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchJadwal();
  }, [fetchJadwal]);

  // ── Stats ─────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: jadwalData.length,
      mapelCount: new Set(jadwalData.map((j) => j.mapel)).size,
      guruCount: new Set(jadwalData.map((j) => j.nama_guru).filter(Boolean)).size,
    }),
    [jadwalData],
  );

  // ── Conflict detection ────────────────────────────────────
  const conflicts = useMemo(() => {
    const allData = jadwalData; // Only current class loaded; cross-class conflict needs all classes
    const grouped: Record<string, string[]> = {};
    allData.forEach((j) => {
      if (j.nama_guru) {
        const key = `${j.nama_guru}_${j.hari}_${j.jam_ke}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(j.kelas);
      }
    });
    return Object.entries(grouped)
      .filter(([, kelas]) => kelas.length > 1)
      .map(([key, kelas]) => {
        const [guru, hari, jam] = key.split("_");
        return `${guru} — ${hari} Jam ${jam} (${kelas.join(" & ")})`;
      });
  }, [jadwalData]);

  // ── Get slot ──────────────────────────────────────────────
  const getSlot = (hari: string, jam_ke: number) =>
    jadwalData.find((j) => j.hari === hari && j.jam_ke === jam_ke);

  // ── Open slot modal ───────────────────────────────────────
  const openSlot = (hari: string, jam_ke: number) => {
    const existing = getSlot(hari, jam_ke);
    if (existing) {
      setEditingItem(existing);
      setForm({ mapel: existing.mapel, namaGuru: existing.nama_guru ?? "" });
    } else {
      setEditingItem(null);
      setForm(emptyForm);
    }
    setSelectedSlot({ hari, jam_ke });
    setModalOpen(true);
  };

  // ── Save slot ─────────────────────────────────────────────
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.mapel.trim()) {
      toast.error("Mata pelajaran wajib diisi");
      return;
    }
    if (!selectedSlot) return;
    setSaving(true);
    const jamInfo = JAM_MAP[selectedSlot.jam_ke];
    try {
      const { error } = await supabase.from("jadwal").upsert(
        {
          kelas: selectedKelas,
          hari: selectedSlot.hari,
          jam_ke: selectedSlot.jam_ke,
          mapel: form.mapel.trim(),
          nama_guru: form.namaGuru || null,
          jam_mulai: jamInfo.mulai,
          jam_selesai: jamInfo.selesai,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "kelas,hari,jam_ke" },
      );
      if (error) throw error;
      toast.success("Jadwal disimpan!");
      setModalOpen(false);
      fetchJadwal();
    } catch (err: unknown) {
      toast.error("Gagal: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete slot ───────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("jadwal").delete().eq("id", id);
      if (error) throw error;
      toast.success("Slot jadwal dihapus");
      setModalOpen(false);
      fetchJadwal();
    } catch (err: unknown) {
      toast.error("Gagal: " + (err as Error).message);
    }
  };

  // ── Copy from another class ───────────────────────────────
  const handleCopyFrom = async (sourceKelas: string) => {
    try {
      const { data, error } = await supabase
        .from("jadwal")
        .select("*")
        .eq("kelas", sourceKelas);
      if (error || !data?.length) {
        toast.error("Tidak ada data jadwal dari kelas tersebut");
        return;
      }
      const newRows = data.map((d: JadwalItem) => ({
        kelas: selectedKelas,
        hari: d.hari,
        jam_ke: d.jam_ke,
        mapel: d.mapel,
        nama_guru: d.nama_guru,
        jam_mulai: d.jam_mulai,
        jam_selesai: d.jam_selesai,
      }));
      const { error: upsertErr } = await supabase
        .from("jadwal")
        .upsert(newRows, { onConflict: "kelas,hari,jam_ke" });
      if (upsertErr) throw upsertErr;
      toast.success(`Jadwal disalin dari kelas ${sourceKelas}`);
      fetchJadwal();
    } catch (err: unknown) {
      toast.error("Gagal salin: " + (err as Error).message);
    }
  };

  // ── Print ─────────────────────────────────────────────────
  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    const rows = REAL_JAMS.map((j) => {
      const cells = HARI.map((h) => {
        const slot = getSlot(h, j);
        return slot
          ? `<td><b>${slot.mapel}</b><br><small>${slot.nama_guru ?? ""}</small></td>`
          : "<td></td>";
      }).join("");
      return `<tr><td style="background:#f5f5f5;text-align:center;font-size:10px">${JAM_MAP[j].label}<br><span style="color:#777">${JAM_MAP[j].mulai}–${JAM_MAP[j].selesai}</span></td>${cells}</tr>`;
    }).join("");
    win.document.write(`
      <!DOCTYPE html><html><head><title>Jadwal Kelas ${selectedKelas}</title>
      <style>body{font-family:Arial;font-size:11px;margin:20px}
      table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px;text-align:center;vertical-align:middle}
      th{background:#e0e0e0}h3{text-align:center}@media print{@page{size:A4 landscape}}</style>
      </head><body>
      <h3>${config.namaSekolah}</h3>
      <p style="text-align:center">JADWAL PELAJARAN KELAS ${selectedKelas} — T.A. ${config.tahunAjaran}</p>
      <table><thead><tr><th>Waktu</th>${HARI.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows}</tbody></table>
      </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  if (dbError) {
    return (
      <PageShell>
        <PageHeader
          icon={<CalendarDays className="w-6 h-6 text-emerald-400" />}
          title="Jadwal Pelajaran"
          subtitle="Tabel jadwal mingguan per kelas"
          gradient="linear-gradient(135deg, #031a12 0%, #0c0820 50%, #050d1e 100%)"
          glowColor="rgba(52,211,153,0.15)"
        />
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <AlertTriangle size={40} className="text-amber-400" />
          <p className="text-white/60 font-semibold">
            Tabel <code className="text-amber-400">jadwal</code> belum ada di database.
          </p>
          <p className="text-white/40 text-sm">
            Jalankan migrasi SQL berikut di Supabase SQL Editor:
          </p>
          <pre className="text-left text-xs bg-white/5 border border-white/10 rounded-xl p-4 max-w-2xl w-full text-green-400 overflow-x-auto">
            {`CREATE TABLE IF NOT EXISTS jadwal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kelas text NOT NULL,
  hari text NOT NULL,
  jam_ke int NOT NULL,
  mapel text NOT NULL,
  nama_guru text,
  jam_mulai text,
  jam_selesai text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS jadwal_unique ON jadwal(kelas, hari, jam_ke);`}
          </pre>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        icon={<CalendarDays className="w-6 h-6 text-emerald-400" />}
        title="Jadwal Pelajaran"
        subtitle="Konfigurasi jadwal mingguan interaktif"
        gradient="linear-gradient(135deg, #031a12 0%, #0c0820 50%, #050d1e 100%)"
        glowColor="rgba(52,211,153,0.15)"
        action={
          <div className="flex items-center gap-2">
            {kelasList.length > 1 && (
              <div className="relative">
                <Copy className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
                <select
                  className="h-9 pl-9 pr-8 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white/70 outline-none cursor-pointer hover:bg-white/10 hover:border-white/20 hover:text-white transition-all appearance-none"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleCopyFrom(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled className="bg-[#090e1a] text-white/50">Salin dari...</option>
                  {kelasList.filter((k) => k !== selectedKelas).map((k) => (
                    <option key={k} value={k} className="bg-[#090e1a]">Kelas {k}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L5 5L9 1" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            )}
            <button
              onClick={handlePrint}
              className="h-9 flex items-center gap-2 px-4 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white/70 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak
            </button>
          </div>
        }
      />

      <StatCards
        items={[
          { label: "Total Slot", value: stats.total, color: "#34d399", icon: <CalendarDays className="w-5 h-5 text-emerald-400" /> },
          { label: "Mapel Aktif", value: stats.mapelCount, color: "#fbbf24", icon: <BookOpen className="w-5 h-5 text-amber-400" /> },
          { label: "Guru Terjadwal", value: stats.guruCount, color: "#60a5fa", icon: <User className="w-5 h-5 text-blue-400" /> },
          { label: "Konflik Jadwal", value: conflicts.length, color: conflicts.length > 0 ? "#f43f5e" : "#a78bfa", icon: <AlertTriangle className={cn("w-5 h-5", conflicts.length > 0 ? "text-rose-400" : "text-violet-400")} /> },
        ]}
      />

      {/* Class Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {kelasList.map((k) => {
          const isActive = selectedKelas === k;
          return (
            <button
              key={k}
              onClick={() => setSelectedKelas(k)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_4px_16px_rgba(52,211,153,0.1)]"
                  : "bg-white/[0.02] text-white/40 border border-white/5 hover:text-white/70 hover:bg-white/[0.04]"
              )}
            >
              {k}
            </button>
          );
        })}
      </div>

      {/* Conflict alerts */}
      <AnimatePresence>
        {conflicts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-2"
          >
            {conflicts.map((c) => (
              <div
                key={c}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <p className="text-xs font-semibold text-rose-200">Konflik: {c}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timetable Grid */}
      <PageCard noPad>
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full min-w-[768px] text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10" style={{ background: "rgba(0,0,0,0.2)" }}>
                  <th className="py-4 px-5 text-xs font-bold text-white/30 uppercase tracking-widest w-32 border-r border-white/5">
                    Waktu
                  </th>
                  {HARI.map((h) => (
                    <th key={h} className="py-4 px-4 text-center text-xs font-black text-white/80 uppercase tracking-widest border-r border-white/5 last:border-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {JAM_ORDER.map((j) => {
                  const jamInfo = JAM_MAP[j];
                  if (jamInfo.isBreak) {
                    return (
                      <tr key={j} className="border-b border-white/5" style={{ background: "rgba(255,255,255,0.015)" }}>
                        <td className="py-3 px-5 border-r border-white/5">
                          <div className="flex items-center gap-2 opacity-50">
                            <Coffee className="w-4 h-4 text-amber-400" />
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Break</span>
                          </div>
                        </td>
                        <td colSpan={5} className="py-3 px-4 text-center">
                          <span className="text-[11px] font-mono text-white/30 tracking-widest">{jamInfo.mulai} — {jamInfo.selesai}</span>
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={j} className="border-b border-white/5 group">
                      <td className="py-4 px-5 border-r border-white/5 align-top" style={{ background: "rgba(255,255,255,0.01)" }}>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-white/60">{jamInfo.label}</span>
                          <div className="flex items-center gap-1.5 opacity-40">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] font-mono">{jamInfo.mulai}-{jamInfo.selesai}</span>
                          </div>
                        </div>
                      </td>
                      {HARI.map((h) => {
                        const slot = getSlot(h, j);
                        const theme = slot ? getMapelColor(slot.mapel) : null;
                        
                        return (
                          <td key={h} className="p-2 border-r border-white/5 last:border-0 align-top relative">
                            {slot ? (
                              <div
                                onClick={() => openSlot(h, j)}
                                className="h-full rounded-xl p-3 flex flex-col gap-2 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg group/slot relative overflow-hidden"
                                style={{
                                  background: theme?.bg,
                                  border: `1px solid ${theme?.border}`,
                                }}
                              >
                                <div className="absolute top-0 right-0 p-1.5 opacity-0 group-hover/slot:opacity-100 transition-opacity">
                                  <div className="w-5 h-5 rounded bg-black/20 flex items-center justify-center text-white/60">
                                    <BookOpen className="w-3 h-3" />
                                  </div>
                                </div>
                                <h4 className="text-xs font-black leading-tight" style={{ color: theme?.text }}>
                                  {slot.mapel}
                                </h4>
                                {slot.nama_guru && (
                                  <div className="mt-auto flex items-center gap-1.5">
                                    <User className="w-3 h-3 opacity-50" style={{ color: theme?.text }} />
                                    <span className="text-[10px] font-semibold opacity-80 truncate" style={{ color: theme?.text }}>
                                      {slot.nama_guru}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div
                                onClick={() => openSlot(h, j)}
                                className="h-full min-h-[72px] rounded-xl flex items-center justify-center cursor-pointer transition-all border border-dashed border-white/10 text-white/10 hover:bg-white/[0.02] hover:text-white/40 hover:border-white/20"
                              >
                                <Plus className="w-4 h-4" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageCard>

      {/* Add/Edit Modal */}
      <AuroraModal
        open={modalOpen && !!selectedSlot}
        onClose={() => setModalOpen(false)}
        title={editingItem ? "Edit Slot Jadwal" : "Tambah Slot Jadwal"}
        icon={<CalendarDays className="w-5 h-5" />}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 mb-4">
            <Clock className="w-4 h-4 text-emerald-400" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-white/80">{selectedSlot?.hari} · {selectedSlot ? JAM_MAP[selectedSlot.jam_ke].label : ""}</p>
              <p className="text-[10px] text-white/40 font-mono mt-0.5">{selectedSlot ? `${JAM_MAP[selectedSlot.jam_ke].mulai} — ${JAM_MAP[selectedSlot.jam_ke].selesai}` : ""}</p>
            </div>
          </div>

          <AuroraInput
            label="Mata Pelajaran *"
            value={form.mapel}
            onChange={(e) => setForm((f) => ({ ...f, mapel: e.target.value }))}
            placeholder="Ketik atau pilih dari list..."
            list="mapel-list"
            required
            autoFocus
          />
          <datalist id="mapel-list">
            {MAPEL_LIST.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>

          <AuroraSelect
            label="Guru Pengajar (Opsional)"
            value={form.namaGuru}
            onChange={(e) => setForm((f) => ({ ...f, namaGuru: e.target.value }))}
          >
            <option value="">-- Tidak ditentukan --</option>
            {dataGuru
              .filter((g) => g.status_aktif)
              .map((g) => (
                <option key={g.id} value={g.nama}>
                  {g.nama}
                </option>
              ))}
          </AuroraSelect>

          <div className="flex gap-3 pt-2 mt-2 border-t border-white/10">
            {editingItem && (
              <button
                type="button"
                onClick={() => handleDelete(editingItem.id)}
                className="h-11 px-4 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Hapus
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex-1 btn-solid h-11 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(124,58,237,0.3)]"
              style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/50 border-t-white animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Simpan Slot
                </>
              )}
            </button>
          </div>
        </form>
      </AuroraModal>
    </PageShell>
  );
}
