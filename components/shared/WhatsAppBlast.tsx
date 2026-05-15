"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { toast } from "sonner";
import { useSchoolConfig } from "@/hooks/useSchoolConfig";
import { getFotoPublic } from "@/lib/utils";

/* ── Template Pesan ─────────────────────────────── */
const getTemplates = (namaSekolah: string) => [
  {
    id: "absensi",
    label: "Info Absensi",
    icon: "📋",
    template: `Yth. Bapak/Ibu Wali dari {nama_siswa},\n\nKami informasikan bahwa anak Anda hari ini tidak hadir di sekolah. Mohon konfirmasi kehadiran.\n\nTerima kasih,\n${namaSekolah}`,
  },
  {
    id: "rapor",
    label: "Pengambilan Rapor",
    icon: "📄",
    template: `Yth. Bapak/Ibu Wali dari {nama_siswa},\n\nKami mengundang Bapak/Ibu untuk pengambilan rapor semester ini.\nHari/Tanggal: {tanggal}\nTempat: ${namaSekolah}\n\nTerima kasih,\n${namaSekolah}`,
  },
  {
    id: "naik_kelas",
    label: "Info Naik Kelas",
    icon: "🎓",
    template: `Yth. Bapak/Ibu Wali dari {nama_siswa},\n\nDengan bangga kami sampaikan bahwa anak Anda dinyatakan NAIK KELAS ke {kelas_baru}.\n\nSelamat!\n${namaSekolah}`,
  },
  {
    id: "lulus",
    label: "Kelulusan",
    icon: "🏆",
    template: `Yth. Bapak/Ibu Wali dari {nama_siswa},\n\nDengan bangga kami sampaikan bahwa anak Anda dinyatakan LULUS dari ${namaSekolah}.\nSelamat atas pencapaiannya!\n\n${namaSekolah}`,
  },
  {
    id: "kegiatan",
    label: "Info Kegiatan",
    icon: "📅",
    template: `Yth. Bapak/Ibu Wali dari {nama_siswa},\n\nKami informasikan akan ada kegiatan {nama_kegiatan} pada {tanggal}.\nMohon perhatian dan partisipasinya.\n\nTerima kasih,\n${namaSekolah}`,
  },
  {
    id: "custom",
    label: "Pesan Custom",
    icon: "✏️",
    template: "",
  },
];

interface WhatsAppBlastProps {
  open: boolean;
  onClose: () => void;
}

export function WhatsAppBlast({ open, onClose }: WhatsAppBlastProps) {
  const { dataSiswa } = useAppStore();
  const config = useSchoolConfig();
  const namaSekolah = config.namaSekolah;
  const TEMPLATES = useMemo(() => getTemplates(namaSekolah), [namaSekolah]);

  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [message, setMessage] = useState(selectedTemplate.template);
  const [filterKelas, setFilterKelas] = useState("all");
  const [namaKegiatan, setNamaKegiatan] = useState("");
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [deliveryStatuses, setDeliveryStatuses] = useState<
    Record<string, "pending" | "sent" | "failed">
  >({});
  const [stage, setStage] = useState<"compose" | "sending" | "done">("compose");

  const siswaWithWA = useMemo(() => {
    return dataSiswa.filter((s) => {
      const hasWA = s.no_wa && s.no_wa !== "-" && s.no_wa.trim() !== "";
      const matchKelas = filterKelas === "all" || s.kelas === filterKelas;
      return hasWA && matchKelas;
    });
  }, [dataSiswa, filterKelas]);

  const kelasOptions = useMemo(() => {
    const kelas = [
      ...new Set(dataSiswa.map((s) => s.kelas).filter(Boolean)),
    ].sort();
    return kelas;
  }, [dataSiswa]);

  const handleTemplateChange = (tpl: (typeof TEMPLATES)[0]) => {
    setSelectedTemplate(tpl);
    setMessage(tpl.template);
  };

  const generateWAUrl = (siswa: (typeof dataSiswa)[0]) => {
    const today = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const personalized = message
      .replace(/{nama_siswa}/g, siswa.nama)
      .replace(/{kelas_baru}/g, siswa.kelas || "-")
      .replace(/{nisn}/g, siswa.nisn || "-")
      .replace(/{tanggal}/g, today)
      .replace(/{nama_kegiatan}/g, namaKegiatan || "Kegiatan Sekolah");
    const encoded = encodeURIComponent(personalized);
    let phone = siswa.no_wa?.replace(/[^0-9]/g, "") || "";
    if (phone.startsWith("0")) phone = "62" + phone.slice(1);
    if (!phone.startsWith("62")) phone = "62" + phone;
    return `https://wa.me/${phone}?text=${encoded}`;
  };

  const handleBlast = async () => {
    if (!message.trim()) {
      toast.error("Pesan tidak boleh kosong");
      return;
    }
    if (siswaWithWA.length === 0) {
      toast.error("Tidak ada siswa dengan nomor WA");
      return;
    }

    setSending(true);
    setStage("sending");
    setSentCount(0);

    // Simulasikan status per siswa
    const newStatuses: Record<string, "pending" | "sent" | "failed"> = {};
    siswaWithWA.forEach((s) => (newStatuses[s.id] = "pending"));
    setDeliveryStatuses(newStatuses);

    // Open WA links in batches (5 at a time to avoid popup blocking)
    const batchSize = 5;
    let count = 0;
    for (let i = 0; i < siswaWithWA.length; i += batchSize) {
      const batch = siswaWithWA.slice(i, i + batchSize);
      batch.forEach((siswa) => {
        const url = generateWAUrl(siswa);
        window.open(url, "_blank");
        count++;
        setDeliveryStatuses((prev) => ({ ...prev, [siswa.id]: "sent" }));
      });
      setSentCount(count);
      if (i + batchSize < siswaWithWA.length) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    setSentCount(count);
    setSending(false);
    setStage("done");
    toast.success(`${count} pesan WA berhasil dikirim`);
  };

  const handleReset = () => {
    setStage("compose");
    setSentCount(0);
    setSending(false);
    setDeliveryStatuses({});
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center overflow-hidden p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[24px] flex flex-col shadow-2xl"
            style={{
              background: "#0d1221",
              border: "1px solid rgba(255,255,255,0.02)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-8 py-6 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "rgba(37,211,102,0.05)",
                    border: "1px solid rgba(37,211,102,0.1)",
                  }}
                >
                  <MessageCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="font-black text-white/90 text-[15px] uppercase tracking-wider">
                    WhatsApp Blast
                  </h2>
                  <p className="text-[11px] text-white/15 font-medium">
                    Kirim pesan massal ke wali murid
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scroll px-8 py-6 space-y-6">
              {stage === "compose" && (
                <>
                  {/* Template Selector */}
                  <div>
                    <label className="text-[10px] font-black text-white/15 uppercase tracking-[0.2em] block mb-3">
                      Pilih Template Pesan
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.id}
                          onClick={() => handleTemplateChange(tpl)}
                          className="flex flex-col items-start gap-2 p-3.5 rounded-[18px] transition-all group"
                          style={{
                            background:
                              selectedTemplate.id === tpl.id
                                ? "rgba(37,211,102,0.04)"
                                : "rgba(255,255,255,0.01)",
                            border: `1px solid ${selectedTemplate.id === tpl.id ? "rgba(37,211,102,0.1)" : "rgba(255,255,255,0.02)"}`,
                          }}
                        >
                          <span className="text-lg">{tpl.icon}</span>
                          <span
                            className={`text-[11px] font-bold ${selectedTemplate.id === tpl.id ? "text-green-400/70" : "text-white/15 group-hover:text-white/30"}`}
                          >
                            {tpl.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Filter Kelas */}
                    <div>
                      <label className="text-[10px] font-black text-white/15 uppercase tracking-[0.2em] block mb-3">
                        Target Kelas
                      </label>
                      <select
                        value={filterKelas}
                        onChange={(e) => setFilterKelas(e.target.value)}
                        className="w-full h-12 bg-white/[0.01] border border-white/[0.02] rounded-xl px-4 text-[13px] font-semibold text-white/50 focus:outline-none focus:border-green-500/20 focus:bg-white/02 transition-all appearance-none cursor-pointer"
                      >
                        <option value="all">
                          Semua Kelas ({dataSiswa.length})
                        </option>
                        {kelasOptions.map((k) => (
                          <option key={k} value={k}>
                            Kelas {k}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Stats Info */}
                    <div>
                      <label className="text-[10px] font-black text-white/15 uppercase tracking-[0.2em] block mb-3">
                        Informasi Penerima
                      </label>
                      <div className="h-12 flex items-center px-4 rounded-xl bg-green-500/[0.02] border border-green-500/[0.05]">
                        <Users size={14} className="text-green-500/20 mr-2.5" />
                        <span className="text-[13px] font-bold text-green-400/50">
                          {siswaWithWA.length}{" "}
                          <span className="font-medium text-green-400/10 ml-1">
                            Nomor Valid
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nama Kegiatan Input (only when template uses {nama_kegiatan}) */}
                  {message.includes("{nama_kegiatan}") && (
                    <div>
                      <label className="text-[10px] font-black text-white/15 uppercase tracking-[0.2em] block mb-3">
                        Nama Kegiatan
                      </label>
                      <input
                        type="text"
                        value={namaKegiatan}
                        onChange={(e) => setNamaKegiatan(e.target.value)}
                        placeholder="Contoh: Porseni 2025"
                        className="w-full h-12 bg-white/[0.01] border border-white/[0.02] rounded-xl px-4 text-[13px] font-semibold text-white/50 focus:outline-none focus:border-green-500/20 focus:bg-white/02 transition-all"
                      />
                    </div>
                  )}

                  {/* Message Editor */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-[10px] font-black text-white/15 uppercase tracking-[0.2em]">
                        Isi Pesan
                      </label>
                      <div className="flex gap-2">
                        {["{nama_siswa}", "{nisn}"].map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] font-mono text-white/05 bg-white/[0.01] px-1.5 py-0.5 rounded border border-white/[0.02]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full h-44 bg-white/[0.01] border border-white/[0.02] rounded-[20px] p-5 text-[13px] leading-relaxed text-white/60 focus:outline-none focus:border-green-500/20 focus:bg-white/02 transition-all resize-none custom-scroll placeholder:text-white/05"
                      placeholder="Tulis pesan yang akan dikirim..."
                    />
                  </div>
                </>
              )}

              {(stage === "sending" || stage === "done") && (
                <div className="py-4 space-y-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative w-24 h-24 mb-6">
                      <div className="absolute inset-0 rounded-full border-[3px] border-green-500/03" />
                      {stage === "sending" && (
                        <motion.div
                          className="absolute inset-0 rounded-full border-[3px] border-green-500/30 border-t-transparent"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {stage === "sending" ? (
                          <Send className="w-8 h-8 text-green-400/50 animate-pulse" />
                        ) : (
                          <CheckCircle2 className="w-10 h-10 text-green-400/70" />
                        )}
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-white/90 mb-2">
                      {stage === "sending"
                        ? "Proses Pengiriman"
                        : "Blast Selesai!"}
                    </h3>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-green-400/70">{sentCount}</span>
                      <span className="text-white/05">/</span>
                      <span className="text-white/20">
                        {siswaWithWA.length} Pesan Terproses
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/[0.005] border border-white/[0.02] rounded-[24px] overflow-hidden">
                    <div className="px-5 py-3.5 bg-white/[0.01] border-b border-white/[0.02] flex items-center justify-between">
                      <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.2em]">
                        Log Pengiriman
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500/30 animate-pulse" />
                        <span className="text-[9px] font-bold text-green-500/30 uppercase tracking-widest">
                          Live Updates
                        </span>
                      </div>
                    </div>
                    <div className="max-h-[280px] overflow-y-auto custom-scroll divide-y divide-white/[0.01]">
                      {siswaWithWA.map((s) => (
                        <div
                          key={s.id}
                          className="px-5 py-3.5 flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-white/[0.01] flex items-center justify-center overflow-hidden border border-white/05 text-white/05 text-[10px] font-bold">
                              {getFotoPublic(s.foto_url) ? (
                                <img
                                  src={getFotoPublic(s.foto_url)!}
                                  alt={s.nama}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                s.nama.charAt(0)
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[12px] font-bold text-white/50 truncate">
                                {s.nama}
                              </p>
                              <p className="text-[10px] text-white/10 font-mono mt-0.5">
                                {s.no_wa}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {deliveryStatuses[s.id] === "sent" ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/[0.03] border border-green-500/[0.06]">
                                <CheckCircle2
                                  size={10}
                                  className="text-green-400/50"
                                />
                                <span className="text-[9px] font-black text-green-400/50 uppercase tracking-widest">
                                  Sent
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.02] border border-white/[0.04]">
                                <Loader2
                                  size={10}
                                  className="text-white/05 animate-spin"
                                />
                                <span className="text-[9px] font-black text-white/05 uppercase tracking-widest">
                                  Queue
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="px-8 py-6 flex-shrink-0"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.02)",
                background: "rgba(255,255,255,0.01)",
              }}
            >
              {stage === "compose" ? (
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 h-11 rounded-xl text-[13px] font-bold text-white/20 hover:text-white/50 hover:bg-white/02 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleBlast}
                    disabled={siswaWithWA.length === 0}
                    className="px-8 h-11 rounded-xl bg-green-600/70 hover:bg-green-500/80 disabled:opacity-10 disabled:hover:bg-green-600 text-white text-[13px] font-bold shadow-lg shadow-green-900/10 transition-all flex items-center gap-2"
                  >
                    <Send size={14} /> Kirim Sekarang
                  </button>
                </div>
              ) : stage === "done" ? (
                <button
                  onClick={handleReset}
                  className="w-full h-12 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] text-white/40 text-[13px] font-bold transition-all"
                >
                  Selesai & Tutup
                </button>
              ) : null}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
