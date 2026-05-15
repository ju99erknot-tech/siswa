"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";
import { useAppStore } from "@/store/app.store";

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ["Ctrl", "K"], description: "Command Palette", category: "Navigasi" },
  { keys: ["Ctrl", "N"], description: "Tambah Data Baru", category: "Aksi" },
  { keys: ["Ctrl", "E"], description: "Ekspor ke Excel", category: "Aksi" },
  { keys: ["Ctrl", "P"], description: "Cetak Halaman", category: "Aksi" },
  { keys: ["Ctrl", "F"], description: "Fokus Pencarian", category: "Navigasi" },
  { keys: ["Ctrl", "B"], description: "Toggle Sidebar", category: "Tampilan" },
  { keys: ["Z"], description: "Toggle Zen Mode", category: "Tampilan" },
  { keys: ["Esc"], description: "Tutup Modal / Kembali", category: "Navigasi" },
  { keys: ["?"], description: "Tampilkan Shortcuts ini", category: "Bantuan" },
];

const CATEGORIES = ["Navigasi", "Aksi", "Tampilan", "Bantuan"];

function KbdKey({ k }: { k: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-lg text-xs font-mono font-semibold border border-white/20 bg-white/8 text-white/80 shadow-inner">
      {k}
    </kbd>
  );
}

export function KeyboardShortcutsOverlay() {
  const [open, setOpen] = useState(false);
  const { toggleZenMode, toggleSidebar, toggleSearch } = useAppStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInput =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (e.target as HTMLElement).isContentEditable;

      // ? — show shortcuts (not in input)
      if (e.key === "?" && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }

      // Esc — close overlay
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }

      // Z — zen mode (not in input)
      if (e.key === "z" && !isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        toggleZenMode();
        return;
      }

      // Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "n":
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("keyboard:new"));
            break;
          case "e":
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("keyboard:export"));
            break;
          case "p":
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("keyboard:print"));
            break;
          case "f":
            if (!isInput) {
              e.preventDefault();
              // Focus first search input on page
              const searchInput = document.querySelector<HTMLInputElement>(
                'input[placeholder*="Cari"], input[placeholder*="cari"], input[type="search"]',
              );
              if (searchInput) {
                searchInput.focus();
                searchInput.select();
              } else {
                toggleSearch();
              }
            }
            break;
          case "b":
            e.preventDefault();
            toggleSidebar();
            break;
        }
      }
    },
    [toggleZenMode, toggleSidebar, toggleSearch],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-[301] flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl"
              style={{
                background:
                  "linear-gradient(135deg, #0f0c1a 0%, #0c0820 60%, #050d1e 100%)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <Keyboard size={18} className="text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-base">
                      Keyboard Shortcuts
                    </h2>
                    <p className="text-white/40 text-xs">
                      Tekan <KbdKey k="?" /> kapan saja untuk membuka ini
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Shortcuts grid */}
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {CATEGORIES.map((cat) => (
                  <div key={cat}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-3">
                      {cat}
                    </p>
                    <div className="space-y-2">
                      {SHORTCUTS.filter((s) => s.category === cat).map((s) => (
                        <div
                          key={s.description}
                          className="flex items-center justify-between gap-4 py-1.5 px-3 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <span className="text-sm text-white/70">
                            {s.description}
                          </span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {s.keys.map((k, i) => (
                              <span key={i} className="flex items-center gap-1">
                                <KbdKey k={k} />
                                {i < s.keys.length - 1 && (
                                  <span className="text-white/25 text-xs">
                                    +
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-white/8 flex items-center justify-center">
                <p className="text-white/30 text-xs">
                  Tekan <KbdKey k="Esc" /> untuk menutup
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
