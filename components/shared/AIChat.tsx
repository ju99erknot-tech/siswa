"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  Trash2,
} from "lucide-react";
import { uiSound } from "@/lib/audio";
import { SCHOOL } from "@/lib/school.config";
import { chatWithAI } from "@/lib/gemini";
import { useAppStore } from "@/store/app.store";
import { useMemo } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const CHAT_STORAGE_KEY = "ai_chat_history";

const INITIAL_MSG: Message = {
  id: "1",
  role: "assistant",
  content: `Halo! Saya asisten AI. Ada yang bisa saya bantu terkait data kesiswaan hari ini?`,
  timestamp: new Date(0), // stable timestamp — avoids SSR/client mismatch
};

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [input, setInput] = useState("");
  const { dataSiswa, dataGuru, dataPrestasi, dataKelas } = useAppStore();

  // Start with stable initial message — load from localStorage in useEffect
  // (avoids SSR/client hydration mismatch from accessing localStorage in useState)
  const [messages, setMessages] = useState<Message[]>([INITIAL_MSG]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Load chat history from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const restored = parsed.map((m: Message) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        if (restored.length > 0) setMessages(restored);
      }
    } catch {}
  }, []);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length <= 1 && messages[0]?.id === "1") return; // skip initial state
    try {
      localStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify(messages.slice(-50)),
      );
    } catch {}
  }, [messages]);

  // Dynamic suggestions based on actual data
  const suggestions = useMemo(() => {
    const chips = ["Berapa total siswa?", "Siapa yang ulang tahun hari ini?"];
    if (dataPrestasi.length > 0) chips.push("Tampilkan prestasi terbaru");
    if (dataSiswa.filter((s) => !s.nisn).length > 0)
      chips.push("Berapa siswa tanpa NISN?");
    if (dataGuru.length > 0) chips.push(`Ada berapa guru aktif?`);
    return chips.slice(0, 4);
  }, [dataSiswa, dataPrestasi, dataGuru]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: msg,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    uiSound.playPop();

    try {
      // Build richer context
      const today = new Date();
      const birthdays = dataSiswa.filter((s) => {
        const [, mm, dd] = (s.tanggal_lahir || "").split("-").map(Number);
        return mm === today.getMonth() + 1 && dd === today.getDate();
      });
      const prestasiTop = [...dataPrestasi]
        .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
        .slice(0, 3)
        .map((p) => `${p.nama} (${p.jenis_lomba})`)
        .join(", ");
      const kelasInfo =
        dataKelas.map((k) => k.nama_kelas).join(", ") ||
        [...new Set(dataSiswa.map((s) => s.kelas))].filter(Boolean).join(", ");

      const context = {
        totalSiswa: dataSiswa.length,
        totalIzinMenunggu: 0,
        dataSummary: [
          `Sekolah: ${SCHOOL.nama} (NPSN: ${SCHOOL.npsn})`,
          `Total siswa: ${dataSiswa.length} (L: ${dataSiswa.filter((s) => s.jk === "L").length}, P: ${dataSiswa.filter((s) => s.jk === "P").length})`,
          `Kelas: ${kelasInfo}`,
          `Guru aktif: ${dataGuru.filter((g) => g.status_aktif).length}`,
          `Total prestasi: ${dataPrestasi.length}`,
          birthdays.length > 0
            ? `Ulang tahun hari ini: ${birthdays.map((s) => s.nama).join(", ")}`
            : "Tidak ada ulang tahun hari ini",
          prestasiTop ? `Prestasi terbaru: ${prestasiTop}` : "",
          `Data anomali (tanpa NISN): ${dataSiswa.filter((s) => !s.nisn).length} siswa`,
        ]
          .filter(Boolean)
          .join(". "),
      };

      const response = await chatWithAI(msg, context);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      uiSound.playSuccess();
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Maaf, terjadi kesalahan. Pastikan API key Gemini sudah dikonfigurasi.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <>
      {/* Floating AI Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 sm:bottom-6 sm:right-6 w-14 h-14 rounded-2xl flex items-center justify-center z-[100] group shadow-2xl overflow-hidden print:hidden"
        style={{
          background: "linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)",
          boxShadow:
            "0 0 30px rgba(139,92,246,0.4), 0 10px 40px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 bg-white/20 blur-xl rounded-full"
        />
        <div className="relative z-10">
          <Bot
            size={28}
            className="text-white drop-shadow-lg group-hover:animate-bounce"
          />
        </div>
        <div className="absolute top-2.5 right-2.5 flex items-center justify-center">
          <span className="absolute w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-75" />
          <span className="relative w-2 h-2 bg-emerald-400 rounded-full border border-white/50" />
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed z-[100] flex flex-col overflow-hidden transition-all duration-300 print:hidden ${
              isMaximized
                ? "inset-4 sm:inset-6 rounded-3xl"
                : "bottom-4 left-4 right-4 h-[80vh] sm:bottom-24 sm:right-6 sm:left-auto sm:w-[400px] sm:h-[600px] rounded-2xl"
            }`}
            style={{
              backdropFilter: "blur(20px)",
              background: "rgba(13,18,33,0.95)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
            }}
          >
            {/* Header */}
            <div
              className="p-4 flex items-center justify-between flex-shrink-0"
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(139,92,246,0.05)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center border border-violet-500/20">
                  <Bot size={20} className="text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white/90">
                    Asisten Kesiswaan
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider">
                      Gemini AI
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all"
                >
                  {isMaximized ? (
                    <Minimize2 size={14} />
                  ) : (
                    <Maximize2 size={14} />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-[13px] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-violet-600 text-white rounded-br-sm"
                        : "text-white/80 rounded-bl-sm"
                    }`}
                    style={
                      msg.role === "assistant"
                        ? {
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }
                        : undefined
                    }
                  >
                    {msg.content}
                    <div
                      className={`text-[9px] mt-1.5 ${msg.role === "user" ? "text-right text-white/40" : "text-left text-white/20"}`}
                    >
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div
                    className="p-3.5 rounded-2xl rounded-bl-sm flex items-center gap-3"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                      <Bot size={12} className="text-violet-400 animate-pulse" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-white/30 mr-1">Mengetik</span>
                      {[0, 1, 2].map(i => (
                        <motion.span
                          key={i}
                          className="w-1.5 h-1.5 bg-violet-400 rounded-full"
                          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Suggestion chips (only show when few messages) */}
              {messages.length <= 2 && !isTyping && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s)}
                      className="px-3 py-1.5 rounded-full text-[11px] font-medium text-white/40 hover:text-white/70 transition-all"
                      style={{
                        background: "rgba(139,92,246,0.08)",
                        border: "1px solid rgba(139,92,246,0.15)",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer / Input */}
            <form
              onSubmit={handleSubmit}
              className="p-4 flex-shrink-0 flex items-center gap-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <button
                type="button"
                onClick={() => {
                  const freshMsg: Message = {
                    ...INITIAL_MSG,
                    timestamp: new Date(),
                  };
                  setMessages([freshMsg]);
                  try {
                    localStorage.removeItem(CHAT_STORAGE_KEY);
                  } catch {}
                }}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-all flex-shrink-0"
                title="Hapus riwayat"
              >
                <Trash2 size={15} />
              </button>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tanya asisten AI..."
                  className="w-full h-10 px-4 pr-10 rounded-xl text-sm outline-none text-white/80 placeholder-white/20"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.07)";
                  }}
                />
                <Sparkles
                  className="absolute right-3 top-2.5 text-violet-400/30"
                  size={16}
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-violet-500 transition-all flex-shrink-0 shadow-lg shadow-violet-500/20"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
