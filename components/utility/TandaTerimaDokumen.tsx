"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileCheck2, Printer, Info, CheckSquare, Search, Users, ClipboardList } from "lucide-react";
import UtilityHeader from "./UtilityHeader";
import { useAppStore } from "@/store/app.store";
import { useSiswa } from "@/hooks/useSiswa";
import { useSchoolConfig } from "@/hooks/useSchoolConfig";



export default function TandaTerimaDokumen() {
  const { data: dataSiswa = [] } = useSiswa();
  const school = useSchoolConfig();
  
  const KUMPULAN_KELAS = Array.from(new Set(dataSiswa.map(s => s.kelas))).filter((k): k is string => !!k).sort();

  const [mode, setMode] = useState<"personal" | "daftar-hadir">("daftar-hadir");
  
  // State untuk Daftar Hadir (sesuai getLogRaporHTML di siswa.xml)
  const [logJenis, setLogJenis] = useState("Rapor");
  const [logKelas, setLogKelas] = useState<Set<string>>(new Set());

  const toggleKelas = (kelas: string) => {
    setLogKelas(prev => {
      const next = new Set(prev);
      if (next.has(kelas)) {
        next.delete(kelas);
      } else {
        next.add(kelas);
      }
      return next;
    });
  };
  const [logTP, setLogTP] = useState(school.tahunAjaran);
  const [logJudul, setLogJudul] = useState("PENYERAHAN LAPORAN HASIL BELAJAR (RAPOR) SEMESTER GANJIL");
  const [logGuru, setLogGuru] = useState(school.namaKepsek);
  const [logNIP, setLogNIP] = useState(school.nipKepsek);

  // State untuk Personal (Eksisting)
  const [nomorSurat, setNomorSurat] = useState("001/TTD/SDN02/2026");
  const [diterimaDari, setDiterimaDari] = useState("");
  const [keperluan, setKeperluan] = useState("Pemberkasan PPDB 2026/2027");
  const [dokumenList, setDokumenList] = useState("Fotokopi Kartu Keluarga\nFotokopi Akta Kelahiran\nPas Foto 3x4 (2 Lembar)\nSurat Keterangan Lulus (SKL)");
  const [penerima, setPenerima] = useState("Panitia PPDB");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const DOKUMEN_POPULER = [
    "Fotokopi Kartu Keluarga",
    "Fotokopi Akta Kelahiran",
    "Pas Foto 3x4 (2 Lembar)",
    "Surat Keterangan Lulus (SKL)",
    "Ijazah Asli",
    "SKHUN Asli",
    "Raport Asli",
    "Formulir Pendaftaran",
  ];

  const handleAddDokumen = (dok: string) => {
    setDokumenList(prev => {
      const items = prev.split("\n").map(i => i.trim()).filter(i => i !== "");
      if (items.includes(dok)) return prev;
      return [...items, dok].join("\n");
    });
  };

  const KOP_BARU_URL = "/KOP_Baru.png";

  const handleUpdateLogJenis = (jenis: string) => {
    setLogJenis(jenis);
    if (jenis === "Ijazah") {
      setLogKelas(new Set(["VI A"]));
      setLogJudul("PENYERAHAN IJAZAH DAN DOKUMEN KELULUSAN SISWA");
    } else {
      setLogJudul("PENYERAHAN LAPORAN HASIL BELAJAR (RAPOR) SEMESTER GANJIL");
    }
  };

  const handlePrintDaftarHadir = () => {
    if (logKelas.size === 0) return alert("Silakan pilih kelas terlebih dahulu!");
    const siswa = dataSiswa
      .filter(s => logKelas.has(s.kelas || ""))
      .sort((a, b) => {
        const kelasA = a.kelas || "";
        const kelasB = b.kelas || "";
        if (kelasA !== kelasB) return kelasA.localeCompare(kelasB);
        return a.nama.localeCompare(b.nama);
      });
    if (siswa.length === 0) return alert("Siswa tidak ditemukan untuk kelas tersebut!");

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = siswa.map((s, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="text-transform:uppercase; font-weight:bold;">${s.nama}</td>
        <td style="text-align:center;">${s.nisn || "-"}</td>
        <td></td>
        <td class="sign-cell">${idx % 2 === 0 ? (idx + 1) + '. ...........' : ''}</td>
        <td class="sign-cell">${idx % 2 !== 0 ? (idx + 1) + '. ...........' : ''}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
      <head>
        <title>Daftar Kendali - ${logKelas}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm 10mm 15mm 15mm; }
          body { font-family: Arial, sans-serif; font-size: 11pt; padding: 0; margin: 0; color: #000; }
          .kop-gambar { width: 100%; text-align: center; margin-bottom: 20px; }
          .kop-gambar img { width: 100%; max-height: 120px; object-fit: contain; }
          h2 { text-align:center; margin: 0; font-size: 14pt; text-transform: uppercase; text-decoration: underline; }
          .info-sub { text-align:center; font-weight:bold; margin-bottom: 20px; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          th, td { border: 1px solid #000; padding: 6px 4px; font-size: 8.5pt; word-wrap: break-word; }
          th { background: #f2f2f2; text-transform: uppercase; font-weight: bold; }
          .sign-cell { width: 90px; height: 35px; vertical-align: top; font-size: 7.5pt; }
          .footer { margin-top: 30px; display: flex; justify-content: flex-end; page-break-inside: avoid; }
          .ttd { text-align: center; width: 280px; }
          @media print { .no-print { display: none; } * { -webkit-print-color-adjust: exact !important; } }
          .btn-print { position: fixed; top: 20px; right: 20px; padding: 12px 24px; background: #059669; color: #fff; border: none; border-radius: 50px; font-weight: bold; cursor: pointer; }
        </style>
      </head>
      <body>
        <button class="btn-print no-print" onclick="window.print()">🖨️ CETAK SEKARANG</button>
        <div class="kop-gambar"><img src="${KOP_BARU_URL}" /></div>
        <h2>${logJudul}</h2>
        <div class="info-sub">KELAS: ${logKelas} | TAHUN PELAJARAN: ${logTP}</div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th>Nama Peserta Didik</th>
              <th style="width: 90px;">NISN</th>
              <th style="width: 80px;">Tgl Ambil</th>
              <th colspan="2">Tanda Tangan Orang Tua / Wali</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div class="footer">
          <div class="ttd">
            ${school.kotaSekolah}, ........................ ${new Date().getFullYear()}<br>Wali Kelas ${logKelas},<br><br><br><br><br>
            <b><u>${logGuru}</u></b><br>NIP. ${logNIP}
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintPersonal = (namaOverride?: string) => {
    const namaSiswa = namaOverride || diterimaDari;
    if (!namaSiswa) return alert("Pilih siswa terlebih dahulu!");
    
    const parsedDokumen = dokumenList.split("\n").filter((p) => p.trim());
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
      <head>
        <title>Tanda Terima - ${namaSiswa}</title>
        <style>
          @page { size: A5 landscape; margin: 10mm; }
          body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background: #fff; color: #000; }
          .wrapper { padding: 10mm; border: 2px double #333; height: calc(148mm - 20mm); position: relative; box-sizing: border-box; }
          .header { display: flex; align-items: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
          .logo { width: 60px; height: 60px; margin-right: 15px; }
          .header-text { text-align: center; flex: 1; }
          .header-text h1 { font-size: 16pt; margin: 0; font-weight: 900; }
          .header-text p { font-size: 10pt; margin: 0; font-weight: bold; }
          .meta { display: flex; justify-content: space-between; font-size: 9pt; font-weight: bold; margin-bottom: 15px; }
          .content { font-size: 10pt; line-height: 1.6; }
          .row { display: flex; margin-bottom: 5px; }
          .label { width: 120px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #000; padding: 5px; font-size: 9pt; }
          th { background: #f0f0f0; }
          .footer { display: flex; justify-content: space-around; margin-top: 20px; text-align: center; font-size: 9pt; font-weight: bold; }
          .ttd-box { width: 150px; }
          .space { height: 50px; }
          @media print { .no-print { display: none; } }
          .btn-print { position: fixed; top: 10px; right: 10px; padding: 8px 16px; background: #059669; color: #fff; border: none; border-radius: 20px; font-weight: bold; cursor: pointer; }
        </style>
      </head>
      <body>
        <button class="btn-print no-print" onclick="window.print()">CETAK</button>
        <div class="wrapper">
          <div class="header">
            <img src="${LOGO_SEKOLAH_URL}" class="logo" />
            <div class="header-text">
              <h1>${school.namaSekolah}</h1>
              <p>TANDA TERIMA DOKUMEN DIGITAL</p>
            </div>
          </div>
          <div class="meta">
            <span>Nomor: ${nomorSurat}</span>
            <span>${school.kotaSekolah}, ${new Date(tanggal).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</span>
          </div>
          <div class="content">
            <div class="row"><span class="label">Diterima Dari</span><span>: ${namaSiswa.toUpperCase()}</span></div>
            <div class="row"><span class="label">Keperluan</span><span>: ${keperluan}</span></div>
            <table>
              <thead><tr><th width="30">NO</th><th>DOKUMEN</th><th width="60">STATUS</th></tr></thead>
              <tbody>
                ${parsedDokumen.length > 0 ? parsedDokumen.map((d, i) => `<tr><td align="center">${i+1}</td><td>${d.toUpperCase()}</td><td align="center">LENGKAP</td></tr>`).join('') : '<tr><td colspan="3" align="center">TIDAK ADA DOKUMEN</td></tr>'}
              </tbody>
            </table>
          </div>
          <div class="footer">
            <div class="ttd-box"><p>Penyetor,</p><div class="space"></div><p>( ________________ )</p></div>
            <div class="ttd-box"><p>Penerima,</p><div class="space"></div><p>( ${penerima.toUpperCase()} )</p></div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const LOGO_SEKOLAH_URL = school.logoUrl;

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-4xl mx-auto pb-10">
      <UtilityHeader
        icon={FileCheck2}
        title="Tanda Terima Dokumen"
        subtitle="Pusat Cetak & Utility • Bukti Serah Terima Berkas"
        accentColor="emerald"
        actionLabel={mode === "daftar-hadir" ? "Generate Daftar" : "Cetak Bukti"}
        actionIcon={Printer}
        onAction={mode === "daftar-hadir" ? handlePrintDaftarHadir : handlePrintPersonal}
        actionDisabled={mode === "personal" && !diterimaDari.trim()}
      />

      {/* Mode Selector */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => setMode("daftar-hadir")}
          className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${mode === "daftar-hadir" ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-white/5 border-white/10 text-slate-400"}`}
        >
          <ClipboardList className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-widest">Daftar Kendali (Massal)</span>
        </button>
        <button 
          onClick={() => setMode("personal")}
          className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${mode === "personal" ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-white/5 border-white/10 text-slate-400"}`}
        >
          <Users className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-widest">Tanda Terima (Personal)</span>
        </button>
      </div>

      {mode === "daftar-hadir" ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-8 space-y-8">
          {/* Jenis Dokumen Menu */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">1. Pilih Jenis Dokumen</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: "Rapor", label: "Buku Rapor", icon: ClipboardList },
                { id: "Ijazah", label: "Ijazah & SKHUN", icon: FileCheck2 },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleUpdateLogJenis(item.id)}
                  className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                    logJenis === item.id 
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]" 
                      : "bg-white/[0.02] border-white/[0.05] text-slate-400 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${logJenis === item.id ? "bg-emerald-500 text-white" : "bg-white/5 text-slate-500"}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm uppercase tracking-wider">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pilih Kelas Menu */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">2. Pilih Kelas (Sumber Data)</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {KUMPULAN_KELAS.filter(k => logJenis === "Ijazah" ? k.startsWith("VI") || k.startsWith("6") : true).map((k) => {
                const count = dataSiswa.filter(s => s.kelas === k).length;
                return (
                  <button
                    key={k}
                    onClick={() => toggleKelas(k)}
                    className={`relative flex flex-col items-center justify-center py-3 px-2 rounded-xl border text-center transition-all ${
                      logKelas.has(k)
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]" 
                        : "bg-white/[0.02] border-white/[0.05] text-slate-400 hover:bg-white/[0.04] hover:border-white/10"
                    }`}
                  >
                    <span className="font-black text-xs uppercase">{k}</span>
                    <span className={`text-[9px] mt-1 font-bold px-1.5 py-0.5 rounded-full ${logKelas.has(k) ? "bg-emerald-500/20 text-emerald-400" : "bg-black/40 text-slate-500"}`}>
                      {count} Siswa
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tahun Pelajaran */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">3. Tahun Pelajaran</label>
            <input type="text" value={logTP} onChange={(e) => setLogTP(e.target.value)} className="input-obsidian" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
            <div>
              <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Wali Kelas / Petugas</label>
              <input type="text" value={logGuru} onChange={(e) => setLogGuru(e.target.value)} className="input-obsidian mt-2" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">NIP</label>
              <input type="text" value={logNIP} onChange={(e) => setLogNIP(e.target.value)} className="input-obsidian mt-2" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Judul Daftar Hadir</label>
            <input type="text" value={logJudul} onChange={(e) => setLogJudul(e.target.value)} className="input-obsidian mt-2 uppercase" />
          </div>

          <button onClick={handlePrintDaftarHadir} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-3">
            <Printer className="w-5 h-5" /> GENERATE DAFTAR KENDALI
          </button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* 1. Detail Administrasi */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
            <h2 className="text-sm font-bold text-slate-300 mb-5 uppercase tracking-wider flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              1. Detail Administrasi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nomor Tanda Terima</label>
                <input type="text" value={nomorSurat} onChange={(e) => setNomorSurat(e.target.value)} className="input-obsidian" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tanggal Terima</label>
                <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="input-obsidian" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Untuk Keperluan</label>
                <input type="text" value={keperluan} onChange={(e) => setKeperluan(e.target.value)} className="input-obsidian" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nama Penerima (Petugas)</label>
                <input type="text" value={penerima} onChange={(e) => setPenerima(e.target.value)} className="input-obsidian" />
              </div>
            </div>
          </motion.div>

          {/* 2. Daftar Dokumen */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
            <h2 className="text-sm font-bold text-slate-300 mb-5 uppercase tracking-wider flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center">
                <FileCheck2 className="w-3.5 h-3.5 text-violet-400" />
              </div>
              2. Daftar Dokumen
            </h2>
            
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Pilih Dokumen Cepat:</label>
            <div className="flex flex-wrap gap-2 mb-5">
              {DOKUMEN_POPULER.map((dok) => (
                <button
                  key={dok}
                  onClick={() => handleAddDokumen(dok)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/50 rounded-lg text-[10px] font-bold text-slate-400 hover:text-emerald-400 transition-all"
                >
                  + {dok}
                </button>
              ))}
            </div>

            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Daftar Dokumen (Tiap Baris = 1 Item)</label>
            <textarea 
              value={dokumenList} 
              onChange={(e) => setDokumenList(e.target.value)} 
              rows={5} 
              className="input-obsidian font-mono text-xs resize-none" 
              placeholder="Atau ketik manual di sini..."
            />
          </motion.div>

          {/* 3. Pilih Siswa & Cetak */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-0 overflow-hidden">
            <div className="p-5 border-b border-white/5 bg-white/[0.02] space-y-4">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                3. Pilih Siswa & Cetak
              </h2>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama siswa untuk dicetak..." 
                  className="input-obsidian pl-11 py-3" 
                />
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scroll">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-[#0f111a] z-10 border-b border-white/10">
                  <tr>
                    <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-widest">Nama Siswa</th>
                    <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-widest text-center">Kelas</th>
                    <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {dataSiswa
                    .filter(s => searchQuery === "" || s.nama.toLowerCase().includes(searchQuery.toLowerCase()))
                    .slice(0, searchQuery === "" ? 5 : 20) // Batasi jika tidak cari agar ringan
                    .map((s) => (
                      <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-200 uppercase group-hover:text-emerald-400 transition-colors">{s.nama}</div>
                          <div className="text-[10px] text-slate-500 font-bold mt-0.5">NISN: {s.nisn || "-"}</div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="px-2 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-slate-400 border border-white/10">
                            {s.kelas}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button 
                            onClick={() => {
                              setDiterimaDari(s.nama);
                              // Karena setDiterimaDari async, kita buat objek sementara untuk print
                              const tempSiswa = { ...s };
                              setTimeout(() => handlePrintPersonal(tempSiswa.nama), 50);
                            }}
                            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-xl text-[10px] font-black transition-all border border-emerald-500/20 flex items-center gap-2 ml-auto"
                          >
                            <Printer className="w-3.5 h-3.5" /> CETAK PERSONAL
                          </button>
                        </td>
                      </tr>
                    ))}
                  {searchQuery !== "" && dataSiswa.filter(s => s.nama.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-10 text-center text-slate-500 font-bold italic">
                        Siswa tidak ditemukan.
                      </td>
                    </tr>
                  )}
                  {searchQuery === "" && (
                    <tr>
                      <td colSpan={3} className="px-5 py-4 text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest bg-white/[0.01]">
                        Ketik nama di atas untuk mencari siswa lainnya
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}



