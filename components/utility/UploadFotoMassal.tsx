"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudUpload,
  UploadCloud,
  FileImage,
  CheckCircle2,
  DatabaseZap,
  Info,
} from "lucide-react";
import UtilityHeader from "./UtilityHeader";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { uploadFotoMasal } from "@/lib/gas";
import { useSiswa } from "@/hooks/useSiswa";

export default function UploadFotoMassal() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const { data: dataSiswa } = useSiswa();

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/"),
      );
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files)
        .filter((f) => f.type.startsWith("image/"))
        .filter((f) => f.size <= 5 * 1024 * 1024) // Max 5MB
        .filter((f) => f.name.length <= 255); // Max filename length

      const invalidFiles =
        Array.from(e.target.files).length - selectedFiles.length;

      if (invalidFiles > 0) {
        toast.warning(`${invalidFiles} file dilewati (tidak valid atau >5MB)`);
      }

      if (selectedFiles.length > 0) {
        setFiles((prev) => [...prev, ...selectedFiles]);
      } else {
        toast.error(
          "Tidak ada file valid yang dipilih. Gunakan JPG/PNG maks 5MB.",
        );
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const startUpload = async () => {
    if (files.length === 0) return;
    if (dataSiswa.length === 0) {
      toast.error("Data siswa belum dimuat. Refresh halaman terlebih dahulu!");
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setUploadedCount(0);
    setLogs([]);

    addLog(`Memulai upload ${files.length} foto...`);

    try {
      const result = await uploadFotoMasal(files, dataSiswa, (p) => {
        setProgress(Math.round((p.current / p.total) * 100));
        setUploadedCount(p.current);
        addLog(p.message);
      });

      addLog(
        `Selesai! Sukses: ${result.success}, Skip: ${result.skip}, Error: ${result.error}`,
      );

      if (result.success > 0) {
        toast.success(
          `${result.success} foto berhasil diupload ke Supabase Storage!`,
        );
      }
      if (result.skip > 0) {
        toast.warning(`${result.skip} foto dilewati (NISN tidak ditemukan)`);
      }
      if (result.error > 0) {
        toast.error(`${result.error} foto gagal diupload`);
      }

      setTimeout(() => {
        setFiles([]);
        setIsUploading(false);
        setLogs([]);
      }, 2000);
    } catch (error: unknown) {
      console.error("Upload gagal:", error);
      addLog(`ERROR: ${(error as Error).message}`);
      toast.error(
        "Gagal sinkronisasi ke Supabase Storage. Periksa koneksi dan kredensial.",
      );
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-4xl mx-auto pb-10">
      <UtilityHeader
        icon={CloudUpload}
        title="Upload Foto Massal"
        subtitle="Pusat Cetak & Utility • Sinkronisasi Supabase Storage"
        accentColor="cyan"
        actionLabel={
          files.length > 0 && !isUploading ? "Mulai Sinkronisasi" : undefined
        }
        actionIcon={UploadCloud}
        onAction={startUpload}
        actionDisabled={files.length === 0 || isUploading}
      />

      {/* Rules */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card p-6"
      >
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
            <DatabaseZap className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-300 text-sm mb-3 uppercase tracking-wider">
              Aturan Sinkronisasi Foto
            </h3>
            <ul className="text-[11px] text-slate-500 space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                Gunakan <span className="text-cyan-400 font-bold">
                  NISN
                </span>{" "}
                sebagai nama file untuk foto siswa (Contoh: 0123456789.jpg)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                Gunakan <span className="text-cyan-400 font-bold">
                  NIP
                </span>{" "}
                sebagai nama file untuk foto guru (Contoh: 19890101.png)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                Format file:{" "}
                <span className="font-bold text-slate-400">
                  JPG, JPEG, PNG
                </span>{" "}
                dengan ukuran maks 2MB
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full rounded-2xl border-[3px] border-dashed flex flex-col items-center justify-center transition-all p-14 relative overflow-hidden ${
            isDragging
              ? "bg-cyan-500/5 border-cyan-500"
              : "bg-white/[0.02] border-white/[0.08] hover:border-cyan-500/30"
          }`}
        >
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 transition-all duration-500 ${
              isDragging
                ? "bg-cyan-500 text-white rotate-12 scale-110"
                : "bg-white/[0.05] text-slate-500"
            }`}
          >
            <UploadCloud className="w-10 h-10" />
          </div>

          <h3 className="text-xl font-black text-slate-300 mb-2 uppercase tracking-tight">
            Drop Foto Massal Disini
          </h3>
          <p className="text-xs text-slate-600 mb-8 text-center max-w-sm leading-relaxed">
            Tarik ribuan foto sekaligus ke area ini untuk sinkronisasi otomatis
            ke cloud server sekolah.
          </p>

          <input
            type="file"
            multiple
            accept="image/*"
            id="file-upload"
            className="hidden"
            onChange={handleFileChange}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-white/[0.08] hover:bg-cyan-600 border border-white/[0.1] transition-all active:scale-95 uppercase tracking-widest"
          >
            Pilih File Komputer
          </label>
        </div>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
              <h3 className="font-bold text-slate-300 flex items-center gap-2 text-sm uppercase tracking-wider">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                  <FileImage className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                Antrean ({files.length} Item)
              </h3>

              {isUploading ? (
                <div className="flex items-center gap-4 bg-white/[0.03] px-4 py-2 rounded-xl border border-white/[0.06]">
                  <span className="text-[10px] font-bold text-cyan-400 animate-pulse uppercase tracking-widest">
                    {uploadedCount}/{files.length}
                  </span>
                  <div className="w-32 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setFiles([])}
                  className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest transition-colors"
                >
                  Bersihkan
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 md:grid-cols-5 gap-4 max-h-[400px] overflow-y-auto custom-scroll pr-2">
              {files.map((file, i) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={`${file.name}-${i}`}
                  className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-3 relative group overflow-hidden"
                >
                  <div className="aspect-[3/4] rounded-lg bg-white/[0.04] border border-white/[0.06] mb-2 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onLoad={(e) =>
                        URL.revokeObjectURL((e.target as HTMLImageElement).src)
                      }
                    />
                    {isUploading && i < uploadedCount && (
                      <div className="absolute inset-0 bg-cyan-500/40 backdrop-blur-sm flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-white drop-shadow-lg" />
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 truncate font-mono">
                    {file.name}
                  </p>
                  <p className="text-[8px] text-slate-600 mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>

                  {!isUploading && (
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white text-xs backdrop-blur-md"
                    >
                      ×
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Logs */}
      <AnimatePresence>
        {isUploading && logs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
              <h3 className="font-bold text-slate-300 text-sm uppercase tracking-wider">
                Progress Log
              </h3>
              <div className="text-[10px] font-bold text-cyan-400">
                {uploadedCount}/{files.length}
              </div>
            </div>
            <div className="h-48 overflow-y-auto custom-scroll pr-2">
              <div className="space-y-1">
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className={`text-[10px] font-mono ${
                      log.includes("✓")
                        ? "text-emerald-400"
                        : log.includes("✗") || log.includes("ERROR")
                          ? "text-red-400"
                          : log.includes("NISN")
                            ? "text-amber-400"
                            : "text-slate-500"
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
