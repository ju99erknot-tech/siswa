"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  MapPin,
  Map,
  Loader2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { useSpmb } from "@/hooks/useSpmb";
import { SCHOOL } from "@/lib/school.config";
import {
  PageShell,
  PageHeader,
  StatCards,
  PageCard,
  PageCardHeader,
  AuroraTable,
  ATRow,
  ATCell,
  EmptyState,
  usePagination,
  AuroraPagination,
} from "@/components/shared/PageShell";
import type { SpmbSmp } from "@/types";
import * as XLSX from "xlsx";

export default function SpmbDashboard() {
  const { dataSpmb, isLoading, updateStatusSpmb } = useSpmb();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterKelas, setFilterKelas] = useState("Semua");

  // Verifikasi Modal State
  const [verifikasiData, setVerifikasiData] = useState<SpmbSmp | null>(null);
  const [catatan, setCatatan] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const uniqueKelas = Array.from(
    new Set(dataSpmb.map((d) => d.siswa?.kelas).filter(Boolean)),
  ).sort();

  // Filter Data
  const filtered = dataSpmb.filter((item) => {
    const q = search.toLowerCase();
    const nama = item.siswa?.nama?.toLowerCase() || "";
    const nisn = item.siswa?.nisn || "";
    const kelas = item.siswa?.kelas || "";

    if (q && !(nama.includes(q) || nisn.includes(q))) return false;
    if (filterStatus !== "Semua" && item.status !== filterStatus) return false;
    if (filterKelas !== "Semua" && kelas !== filterKelas) return false;

    return true;
  });

  const pag = usePagination(filtered);

  // Stats
  const totalSiswa = dataSpmb.length;
  const menungguVerifikasi = dataSpmb.filter(
    (d) => d.status === "Menunggu Verifikasi",
  ).length;
  const valid = dataSpmb.filter((d) => d.status === "Valid & Lengkap").length;

  const openVerifikasi = (d: SpmbSmp) => {
    setVerifikasiData(d);
    setCatatan(d.catatan_guru || "");
  };

  const handleUpdateStatus = async (statusBaru: string) => {
    if (!verifikasiData) return;
    setSaving(true);
    const success = await updateStatusSpmb(
      verifikasiData.id,
      statusBaru,
      catatan,
    );
    setSaving(false);
    if (success) {
      setVerifikasiData(null);
    }
  };

  const statusColors: Record<string, string> = {
    "Belum Diisi": "text-white/40 bg-white/5 border-white/10",
    "Menunggu Verifikasi":
      "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    "Valid & Lengkap":
      "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    Didaftarkan: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    Selesai: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  };

  const handleExport = () => {
    // Format data for Excel
    const excelData = filtered.map((d, index) => ({
      No: index + 1,
      "Nama Lengkap": d.siswa?.nama || "-",
      NISN: d.siswa?.nisn || "-",
      "Asal Sekolah": SCHOOL.nama,
      "Kelas Saat Ini": d.siswa?.kelas || "-",
      "Jalur Pilihan": d.jalur_pendaftaran || "Zonasi",
      "Pilihan Sekolah 1": d.sekolah_tujuan_1 || "-",
      "Pilihan Sekolah 2": d.sekolah_tujuan_2 || "-",
      "Titik Lintang (Latitude)": d.lintang || "-",
      "Titik Bujur (Longitude)": d.bujur || "-",
      "Status Berkas": d.status,
      "Catatan Revisi": d.catatan_guru || "-",
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data SPMB");

    // Adjust column widths for better readability
    const colWidths = [
      { wch: 5 },
      { wch: 30 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 30 },
    ];
    worksheet["!cols"] = colWidths;

    // Trigger file download
    XLSX.writeFile(
      workbook,
      `Data_SPMB_${SCHOOL.nama.replace(/\s+/g, "").slice(0, 8)}_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  return (
    <PageShell>
      <PageHeader
        icon={<FileText className="w-6 h-6 text-emerald-400" />}
        title="Verifikasi SPMB SMP"
        subtitle={`${SCHOOL.nama} — Verifikasi berkas persiapan lulusan Kelas 6`}
        gradient="linear-gradient(135deg, #051a1a 0%, #0c0820 50%, #050d1e 100%)"
        glowColor="rgba(16,185,129,0.28)"
      />

      <StatCards
        items={[
          {
            label: "Total Data Masuk",
            value: totalSiswa,
            color: "#8b5cf6",
            icon: <FileText className="w-5 h-5 text-violet-400" />,
          },
          {
            label: "Menunggu Verifikasi",
            value: menungguVerifikasi,
            color: "#f59e0b",
            icon: <AlertCircle className="w-5 h-5 text-yellow-400" />,
          },
          {
            label: "Valid & Lengkap",
            value: valid,
            color: "#10b981",
            icon: <FileCheck className="w-5 h-5 text-emerald-400" />,
          },
        ]}
      />

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            type="text"
            placeholder="Cari nama atau NISN siswa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-xl text-sm text-white/80 placeholder-white/20 outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          />
        </div>
        <div className="flex flex-row items-center gap-2 w-full md:w-auto">
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="h-11 px-3 md:px-4 w-1/2 md:w-auto rounded-xl text-xs md:text-sm text-white/80 outline-none appearance-none cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <option value="Semua">Semua Kelas</option>
            {uniqueKelas.map((k) => (
              <option key={String(k)} value={String(k)}>
                Kelas {String(k)}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-11 px-3 md:px-4 w-1/2 md:w-auto rounded-xl text-xs md:text-sm text-white/80 outline-none appearance-none cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <option value="Semua">Semua Status</option>
            <option value="Belum Diisi">Belum Diisi</option>
            <option value="Menunggu Verifikasi">Menunggu Verif</option>
            <option value="Valid & Lengkap">Valid & Lengkap</option>
            <option value="Didaftarkan">Didaftarkan</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
        <button
          onClick={handleExport}
          className="h-11 px-4 w-full md:w-auto flex justify-center items-center gap-2 rounded-xl text-sm font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all border border-emerald-500/20 whitespace-nowrap"
        >
          <FileText size={16} /> Ekspor Excel
        </button>
      </div>

      <PageCard noPad>
        <PageCardHeader
          title="Daftar Siswa Kelas 6"
          subtitle={`Menampilkan ${filtered.length} data SPMB`}
          icon={<FileText className="w-4 h-4" />}
        />

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FileText size={40} />}
            title="Tidak Ada Data" variant="search"
            subtitle="Belum ada data pendaftaran yang sesuai dengan pencarian."
          />
        ) : (
          <>
            <AuroraTable
              headers={[
                "Nama Siswa",
                "NISN & Jalur",
                "Kordinat L/B",
                "Status Berkas",
                "Aksi",
              ]}
            >
              {pag.paginated.map((d) => (
                <ATRow key={d.id}>
                  <ATCell>
                    <span className="font-bold text-white/80">
                      {d.siswa?.nama || "-"}
                    </span>
                  </ATCell>
                  <ATCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-cyan-400/80 font-mono text-xs">
                        {d.siswa?.nisn || "-"}
                      </span>
                      <span className="inline-block px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-white/60 border border-white/5 w-max">
                        {d.jalur_pendaftaran || "Zonasi"}
                      </span>
                    </div>
                  </ATCell>
                  <ATCell>
                    {d.lintang && d.bujur ? (
                      <a
                        href={`https://www.google.com/maps?q=${d.lintang},${d.bujur}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <MapPin size={12} /> Cek Peta
                      </a>
                    ) : (
                      <span className="text-white/20 text-xs italic">
                        Belum diset
                      </span>
                    )}
                  </ATCell>
                  <ATCell>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${statusColors[d.status] || statusColors["Belum Diisi"]}`}
                    >
                      {d.status}
                    </span>
                  </ATCell>
                  <ATCell>
                    <button
                      onClick={() => openVerifikasi(d)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-white/70 transition-all border border-white/5"
                    >
                      <Eye size={14} /> Verifikasi
                    </button>
                  </ATCell>
                </ATRow>
              ))}
            </AuroraTable>
            <AuroraPagination
              currentPage={pag.page}
              totalItems={pag.totalItems}
              perPage={pag.perPage}
              onPageChange={pag.setPage}
              onPerPageChange={pag.setPerPage}
            />
          </>
        )}
      </PageCard>

      {/* Modal Verifikasi */}
      <AnimatePresence>
        {verifikasiData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{
              background: "rgba(8,9,13,0.9)",
              backdropFilter: "blur(16px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl"
              style={{
                background: "#0a0d14",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              }}
            >
              <div className="flex justify-between items-center p-4 border-b border-white/5">
                <div>
                  <h3 className="text-lg font-black text-white">
                    Verifikasi Berkas SPMB
                  </h3>
                  <p className="text-xs text-white/40">
                    {verifikasiData.siswa?.nama} - {verifikasiData.siswa?.nisn}
                  </p>
                </div>
                <button
                  onClick={() => setVerifikasiData(null)}
                  className="p-2 text-white/30 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scroll">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Kolom Kiri: Data & Catatan */}
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                      <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Map size={14} /> Koordinat Zonasi
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Lintang (Lat):</span>
                          <span className="text-white/90 font-mono">
                            {verifikasiData.lintang || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Bujur (Lng):</span>
                          <span className="text-white/90 font-mono">
                            {verifikasiData.bujur || "-"}
                          </span>
                        </div>

                        <div className="h-px bg-white/5 my-2"></div>

                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Jalur Pilihan:</span>
                          <span className="text-emerald-400 font-bold uppercase">
                            {verifikasiData.jalur_pendaftaran || "Zonasi"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Pilihan 1:</span>
                          <span className="text-violet-400 font-bold">
                            {verifikasiData.sekolah_tujuan_1 || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Pilihan 2:</span>
                          <span className="text-violet-400 font-bold">
                            {verifikasiData.sekolah_tujuan_2 || "-"}
                          </span>
                        </div>

                        {verifikasiData.lintang && verifikasiData.bujur && (
                          <a
                            href={`https://www.google.com/maps?q=${verifikasiData.lintang},${verifikasiData.bujur}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 block text-center py-2 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all border border-blue-500/20"
                          >
                            Buka di Google Maps
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                      <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <MessageSquare size={14} /> Catatan Revisi / Guru
                      </h4>
                      <textarea
                        value={catatan}
                        onChange={(e) => setCatatan(e.target.value)}
                        placeholder="Tambahkan catatan jika ada berkas yang buram atau salah koordinat..."
                        className="w-full h-24 p-3 rounded-lg text-sm text-white/80 outline-none resize-none"
                        style={{
                          background: "rgba(0,0,0,0.2)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Kolom Kanan: Dokumen Foto */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <FileCheck size={14} /> Pratinjau Dokumen
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Kartu Keluarga */}
                      <div
                        onClick={() =>
                          verifikasiData.url_kk &&
                          setPreviewImage(verifikasiData.url_kk)
                        }
                        className={`aspect-[4/3] rounded-xl border flex flex-col items-center justify-center p-2 text-center transition-all ${verifikasiData.url_kk ? "border-white/20 bg-white/5 hover:border-emerald-500/50 cursor-pointer" : "border-dashed border-white/10 bg-black/20"}`}
                      >
                        <FileText
                          className={`w-8 h-8 mb-2 ${verifikasiData.url_kk ? "text-emerald-400" : "text-white/10"}`}
                        />
                        <span className="text-xs font-bold text-white/80">
                          Kartu Keluarga
                        </span>
                        {verifikasiData.url_kk ? (
                          <span className="text-[10px] text-emerald-400/80 mt-1">
                            Klik untuk lihat
                          </span>
                        ) : (
                          <span className="text-[10px] text-red-400/80 mt-1">
                            Belum diupload
                          </span>
                        )}
                      </div>

                      {/* Akta Kelahiran */}
                      <div
                        onClick={() =>
                          verifikasiData.url_akta &&
                          setPreviewImage(verifikasiData.url_akta)
                        }
                        className={`aspect-[4/3] rounded-xl border flex flex-col items-center justify-center p-2 text-center transition-all ${verifikasiData.url_akta ? "border-white/20 bg-white/5 hover:border-emerald-500/50 cursor-pointer" : "border-dashed border-white/10 bg-black/20"}`}
                      >
                        <FileText
                          className={`w-8 h-8 mb-2 ${verifikasiData.url_akta ? "text-emerald-400" : "text-white/10"}`}
                        />
                        <span className="text-xs font-bold text-white/80">
                          Akta Kelahiran
                        </span>
                        {verifikasiData.url_akta ? (
                          <span className="text-[10px] text-emerald-400/80 mt-1">
                            Klik untuk lihat
                          </span>
                        ) : (
                          <span className="text-[10px] text-red-400/80 mt-1">
                            Belum diupload
                          </span>
                        )}
                      </div>

                      {/* KTP Ayah */}
                      <div
                        onClick={() =>
                          verifikasiData.url_ktp_ayah &&
                          setPreviewImage(verifikasiData.url_ktp_ayah)
                        }
                        className={`aspect-[4/3] rounded-xl border flex flex-col items-center justify-center p-2 text-center transition-all ${verifikasiData.url_ktp_ayah ? "border-white/20 bg-white/5 hover:border-emerald-500/50 cursor-pointer" : "border-dashed border-white/10 bg-black/20"}`}
                      >
                        <FileText
                          className={`w-8 h-8 mb-2 ${verifikasiData.url_ktp_ayah ? "text-emerald-400" : "text-white/10"}`}
                        />
                        <span className="text-xs font-bold text-white/80">
                          KTP Ayah
                        </span>
                        {verifikasiData.url_ktp_ayah ? (
                          <span className="text-[10px] text-emerald-400/80 mt-1">
                            Klik untuk lihat
                          </span>
                        ) : (
                          <span className="text-[10px] text-white/30 mt-1">
                            Belum diupload
                          </span>
                        )}
                      </div>

                      {/* KTP Ibu */}
                      <div
                        onClick={() =>
                          verifikasiData.url_ktp_ibu &&
                          setPreviewImage(verifikasiData.url_ktp_ibu)
                        }
                        className={`aspect-[4/3] rounded-xl border flex flex-col items-center justify-center p-2 text-center transition-all ${verifikasiData.url_ktp_ibu ? "border-white/20 bg-white/5 hover:border-emerald-500/50 cursor-pointer" : "border-dashed border-white/10 bg-black/20"}`}
                      >
                        <FileText
                          className={`w-8 h-8 mb-2 ${verifikasiData.url_ktp_ibu ? "text-emerald-400" : "text-white/10"}`}
                        />
                        <span className="text-xs font-bold text-white/80">
                          KTP Ibu
                        </span>
                        {verifikasiData.url_ktp_ibu ? (
                          <span className="text-[10px] text-emerald-400/80 mt-1">
                            Klik untuk lihat
                          </span>
                        ) : (
                          <span className="text-[10px] text-white/30 mt-1">
                            Belum diupload
                          </span>
                        )}
                      </div>

                      {/* Dokumen Pendukung (Prestasi/Afirmasi/Mutasi) */}
                      {verifikasiData.jalur_pendaftaran &&
                        verifikasiData.jalur_pendaftaran !== "Zonasi" && (
                          <div
                            onClick={() =>
                              verifikasiData.url_dokumen_pendukung &&
                              setPreviewImage(
                                verifikasiData.url_dokumen_pendukung,
                              )
                            }
                            className={`col-span-2 rounded-xl border flex flex-col items-center justify-center p-3 text-center transition-all ${verifikasiData.url_dokumen_pendukung ? "border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-400/50 cursor-pointer" : "border-dashed border-white/10 bg-black/20"}`}
                          >
                            <FileText
                              className={`w-8 h-8 mb-2 ${verifikasiData.url_dokumen_pendukung ? "text-yellow-400" : "text-white/10"}`}
                            />
                            <span className="text-xs font-bold text-white/80">
                              Dokumen {verifikasiData.jalur_pendaftaran}
                            </span>
                            {verifikasiData.url_dokumen_pendukung ? (
                              <span className="text-[10px] text-yellow-400/80 mt-1">
                                Sertifikat/KIP/Surat Pindah - Klik untuk lihat
                              </span>
                            ) : (
                              <span className="text-[10px] text-red-400/80 mt-1">
                                Wajib upload dokumen pendukung!
                              </span>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end gap-3">
                <button
                  onClick={() => handleUpdateStatus("Menunggu Verifikasi")}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white/50 border border-white/10 hover:bg-white/5 transition-all"
                >
                  Kembalikan ke Menunggu
                </button>
                <button
                  onClick={() => handleUpdateStatus("Belum Diisi")}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all"
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <XCircle size={14} />
                  )}
                  Tolak (Suruh Perbaiki)
                </button>
                <button
                  onClick={() => handleUpdateStatus("Valid & Lengkap")}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                  }}
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle size={14} />
                  )}
                  Setujui & Validasi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Preview Modal (Fullscreen) */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
            onClick={() => setPreviewImage(null)}
          >
            <button className="absolute top-6 right-6 z-[210] p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">
              <XCircle size={32} />
            </button>
            <div
              className="w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center relative rounded-xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const url = previewImage;
                let finalUrl = url;
                let isGoogleDrive = false;
                let isPdf = false;

                // Handle old Supabase relative paths vs full HTTP URLs
                if (!url.startsWith("http")) {
                  // Fallback for old code that uploaded to Supabase Storage (assuming bucket 'dokumen' or 'documents')
                  const bucket = url.includes("/") ? "" : "documents/";
                  finalUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}${url}`;
                }

                if (finalUrl.includes("drive.google.com")) {
                  isGoogleDrive = true;
                  const match = finalUrl.match(/id=([^&]+)/);
                  if (match?.[1]) {
                    finalUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
                  }
                } else if (finalUrl.toLowerCase().endsWith(".pdf")) {
                  isPdf = true;
                }

                if (isGoogleDrive || isPdf) {
                  return (
                    <iframe
                      src={finalUrl}
                      className="w-full h-full bg-white rounded-xl"
                      title="Preview Dokumen"
                      allow="autoplay"
                    />
                  );
                } else {
                  return (
                    <img
                      src={finalUrl}
                      alt="Preview Dokumen"
                      className="max-w-full max-h-full object-contain rounded-xl"
                    />
                  );
                }
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
