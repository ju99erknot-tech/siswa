"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  GraduationCap, Shield, Download, Share2, CheckCircle,
  Loader2, AlertCircle, Star, Award,
} from "lucide-react";
import QRCode from "react-qr-code";
import { renderToString } from "react-dom/server";
import { SCHOOL } from "@/lib/school.config";

interface SklData {
  siswa: {
    nama: string; nisn: string; nis?: string; jk: string;
    kelas?: string; tempat_lahir?: string; tanggal_lahir?: string;
    nama_ayah?: string; nama_ibu?: string; foto_url?: string;
    no_peserta_un?: string;
    nomor_skl?: string | null;
    nilai_kelulusan?: Record<string, string> | null;
  };
  nama_sekolah: string; nama_kepsek: string; nip_kepsek: string;
  npsn: string; alamat_sekolah: string; tahun_ajaran: string;
  logo_url?: string;
  kop_surat_url?: string;
  tanggal_kelulusan?: string;
  nama_mulok1?: string;
  nama_mulok2?: string;
  nama_mulok3?: string;
}

export default function ESklPage() {
  const { nisn } = useParams<{ nisn: string }>();
  const [data, setData] = useState<SklData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const certRef = useRef<HTMLDivElement>(null);
  const [isPrintMode, setIsPrintMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("print") === "true") {
        setIsPrintMode(true);
      }
    }
  }, []);

  useEffect(() => {
    if (data && isPrintMode) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [data, isPrintMode]);

  const verifyUrl = typeof window !== "undefined"
    ? `${window.location.origin}/portal/kelulusan/skl/${nisn}`
    : "";

  useEffect(() => {
    if (!nisn) return;
    fetch(`/api/kelulusan/skl/${nisn}`)
      .then(r => r.json().then(d => ({ ok: r.ok, data: d })))
      .then(({ ok, data: d }) => {
        if (!ok) throw new Error(d.error);
        setData(d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [nisn]);

  const handleShare = async () => {
    const text = `🎓 E-SKL Digital\n\nNama: ${data?.siswa.nama}\nNISN: ${data?.siswa.nisn}\nStatus: LULUS ✅\n${data?.nama_sekolah} - TP ${data?.tahun_ajaran}\n\nVerifikasi: ${verifyUrl}`;
    if (navigator.share) {
      await navigator.share({ title: "E-SKL Digital", text, url: verifyUrl });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Link E-SKL berhasil disalin!");
    }
  };

  const handlePrintSKL = () => {
    if (!data) return;
    const { siswa } = data;
    const tglLahirFormatted = siswa.tanggal_lahir
      ? new Date(siswa.tanggal_lahir).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
      : "-";
    const qrSvg = renderToString(<QRCode value={verifyUrl} size={70} level="M" />);
    const parentName = siswa.nama_ayah || siswa.nama_ibu || "-";

    const getIndonesianDate = (dateStr: string | null | undefined) => {
      if (!dateStr) return "-";
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      } catch {
        return dateStr;
      }
    };

    const formattedTglKelulusan = getIndonesianDate(data.tanggal_kelulusan || "2026-06-02");

    const n = siswa.nilai_kelulusan || {};
    const formatNilaiVal = (key: string) => {
      const v = n[key];
      if (v === undefined || v === null || v.trim() === "") return "-";
      return parseFloat(v.replace(",", ".")).toFixed(2).replace(".", ",");
    };

    const mapels = [
      { no: "1.", nama: "Pendidikan Agama dan Budi Pekerti", key: "pai" },
      { no: "2.", nama: "Pendidikan Pancasila", key: "ppkn" },
      { no: "3.", nama: "Bahasa Indonesia", key: "indo" },
      { no: "4.", nama: "Matematika", key: "mtk" },
      { no: "5.", nama: "Ilmu Pengetahuan Alam dan Sosial", key: "ipas" },
      { no: "6.", nama: "Seni Budaya dan Prakarya : Seni Rupa", key: "sbdp" },
      { no: "7.", nama: "Pendidikan Jasmani, Olahraga dan Kesehatan", key: "pjok" },
      { no: "8.", nama: "Bahasa Inggris", key: "bing" },
      { no: "9.", nama: `Muatan Lokal : ${data.nama_mulok1 || "Bahasa dan Sastra Sunda"}`, key: "mulok1" },
    ];
    if (data.nama_mulok2) {
      mapels.push({ no: "10.", nama: `Muatan Lokal : ${data.nama_mulok2}`, key: "mulok2" });
    }
    if (data.nama_mulok3) {
      mapels.push({ no: "11.", nama: `Muatan Lokal : ${data.nama_mulok3}`, key: "mulok3" });
    }

    const mapelRows = mapels.map(m => `
      <tr>
        <td class="center">${m.no}</td>
        <td>${m.nama}</td>
        <td class="center bold">${formatNilaiVal(m.key)}</td>
      </tr>
    `).join("");

    const getAvg = () => {
      let sum = 0;
      let count = 0;
      mapels.forEach(m => {
        const v = n[m.key];
        if (v && v.trim() !== "") {
          const num = parseFloat(v.replace(",", "."));
          if (!isNaN(num)) {
            sum += num;
            count++;
          }
        }
      });
      return count > 0 ? (sum / count).toFixed(2).replace(".", ",") : "-";
    };

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>SKL - ${siswa.nama}</title>
      <style>
        @page { size: A4 portrait; margin: 10mm 15mm; }
        body { font-family: 'Times New Roman', serif; font-size: 11pt; margin: 0; padding: 20px; background: #eee; color: #000; }
        .surat-page { background: white; width: 210mm; min-height: 297mm; margin: 0 auto; padding: 10mm 15mm; box-sizing: border-box; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .kop-surat { text-align: center; margin-bottom: 15px; margin-left: -5mm; margin-right: -5mm; }
        .kop-surat img { width: 100%; max-height: 140px; object-fit: contain; }
        .judul-box { text-align: center; margin: 15px 0; }
        .judul-box h2 { margin: 0; font-size: 13pt; text-decoration: underline; font-weight: bold; }
        .judul-box h3 { margin: 3px 0 0 0; font-size: 11pt; font-weight: bold; }
        .judul-box p { margin: 3px 0 0 0; font-size: 11pt; font-family: 'Courier New', Courier, monospace; font-weight: bold; }
        .isi-surat { text-align: justify; line-height: 1.4; font-size: 11pt; }
        .identitas-table { margin-left: 20px; width: 100%; margin-bottom: 10px; }
        .identitas-table td { padding: 2px 0; vertical-align: top; }
        .lulus-box { text-align: center; font-size: 14pt; font-weight: bold; margin: 10px 0; border: 1.5px solid #000; padding: 5px; letter-spacing: 2px; }
        
        .nilai-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10.5pt; }
        .nilai-table th, .nilai-table td { border: 1px solid black; padding: 4px 8px; }
        .nilai-table th { text-align: center; background-color: #f2f2f2; }
        .nilai-table td.center { text-align: center; }
        .nilai-table td.bold { font-weight: bold; }
        
        .footer-box { margin-top: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
        .qr-box { text-align: center; padding: 5px; border: 1px solid #ddd; border-radius: 6px; display: inline-block; }
        .qr-box p { font-size: 7px; color: #888; margin: 3px 0 0 0; font-family: sans-serif; }
        .ttd-box { width: 230px; text-align: center; font-size: 11pt; }
        .ttd-name { font-weight: bold; text-decoration: underline; text-transform: uppercase; margin-top: 60px; }
        .no-print { position: fixed; top: 20px; right: 20px; z-index: 1000; display: flex; gap: 10px; }
        .btn { background: #D4A843; color: white; padding: 10px 20px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        @media print { body { background: white; padding: 0; } .surat-page { margin: 0; box-shadow: none; padding: 5mm 10mm; } .no-print { display: none !important; } }
      </style></head><body>
        <div class="no-print">
          <button class="btn" onclick="window.print()">🖨️ Cetak Sekarang</button>
          <button class="btn" style="background:#64748b" onclick="window.close()">Tutup</button>
        </div>
        <div class="surat-page">
          <div class="kop-surat"><img src="${data.kop_surat_url || 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgHJHdzvsrvzHVMFsAmI_Ra_4vlYn39plogGMmNIUO7MV71T8zT9YWUFQyO5UD6oeSQ7jew1exTAXcI24JwK3eBiokcmNppHqGjvq70RTfjeYdZAhIahHq0D8m2Jrixl_8bb6BaFGhm0xpov4cojZ_ydeyOtE1xM7wrxn7FSMy0EP5KTuyqWVscaIkCyN3T/s955/KOP%20Baru.png'}" alt="KOP" /></div>
          <div class="judul-box">
            <h2>SURAT KETERANGAN KELULUSAN</h2>
            <h3>Tahun Pelajaran ${data.tahun_ajaran}</h3>
            <p>Nomor: ${siswa.nomor_skl || "....../......./Sket-SD/VI/2026"}</p>
          </div>
          <div class="isi-surat">
            <p>Yang bertanda tangan di bawah ini, Kepala ${data.nama_sekolah}, Nomor Pokok Sekolah Nasional ${data.npsn || "..."} Kabupaten Sukabumi, menerangkan bahwa :</p>
            <table class="identitas-table">
              <tr><td width="35%">Nama</td><td width="2%">:</td><td style="font-weight:bold;text-transform:uppercase">${siswa.nama}</td></tr>
              <tr><td>Tempat, Tanggal Lahir</td><td>:</td><td>${siswa.tempat_lahir || "-"}, ${tglLahirFormatted}</td></tr>
              <tr><td>Nama Orang Tua/Wali</td><td>:</td><td>${parentName}</td></tr>
              <tr><td>Nomor Induk Siswa</td><td>:</td><td>${siswa.nis || "-"}</td></tr>
              <tr><td>Nomor Induk Siswa Nasional</td><td>:</td><td><b>${siswa.nisn}</b></td></tr>
            </table>
            
            <div style="text-align: center; font-weight: bold; font-style: italic; margin-top: 10px; font-size: 13pt;">L U L U S</div>
            
            <p>dari ${data.nama_sekolah} pada tanggal ${formattedTglKelulusan}, setelah memenuhi kriteria sesuai dengan peraturan perundang-undangan dengan nilai sebagai berikut:</p>
            
            <table class="nilai-table">
              <thead>
                <tr>
                  <th style="width: 8%;">No</th>
                  <th style="width: 62%;">Mata Pelajaran</th>
                  <th style="width: 30%;">Nilai</th>
                </tr>
              </thead>
              <tbody>
                ${mapelRows}
                <tr style="background-color: #f9f9f9;">
                  <td colspan="2" class="center bold">Rata - Rata</td>
                  <td class="center bold" style="font-size: 11.5pt;">${getAvg()}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="footer-box">
            <div class="qr-box">${qrSvg}<p>Scan untuk verifikasi</p></div>
            <div class="ttd-box">
              <p>Kab. Sukabumi, ${formattedTglKelulusan}</p>
              <p>Kepala Sekolah,</p>
              <div class="ttd-name">${data.nama_kepsek || "___________________"}</div>
              <div>NIP. ${data.nip_kepsek || "___________________"}</div>
            </div>
          </div>
        </div>
      </body></html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #050812, #0a1128)" }}>
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(135deg, #050812, #0a1128)" }}>
        <div className="max-w-sm w-full text-center p-10 rounded-[2rem]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h1 className="text-xl font-black text-white mb-2">Tidak Valid</h1>
          <p className="text-sm text-white/40">{error || "E-SKL tidak ditemukan"}</p>
        </div>
      </div>
    );
  }

  if (isPrintMode) {
    const { siswa } = data;
    const tglLahirFormatted = siswa.tanggal_lahir
      ? new Date(siswa.tanggal_lahir).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
      : "-";
    const parentName = siswa.nama_ayah || siswa.nama_ibu || "-";

    const getIndonesianDate = (dateStr: string | null | undefined) => {
      if (!dateStr) return "-";
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      } catch {
        return dateStr;
      }
    };

    const formattedTglKelulusan = getIndonesianDate(data.tanggal_kelulusan || "2026-06-02");

    const n = siswa.nilai_kelulusan || {};
    const formatNilaiVal = (key: string) => {
      const v = n[key];
      if (v === undefined || v === null || v.trim() === "") return "-";
      return parseFloat(v.replace(",", ".")).toFixed(2).replace(".", ",");
    };

    const mapels = [
      { no: "1.", nama: "Pendidikan Agama dan Budi Pekerti", key: "pai" },
      { no: "2.", nama: "Pendidikan Pancasila", key: "ppkn" },
      { no: "3.", nama: "Bahasa Indonesia", key: "indo" },
      { no: "4.", nama: "Matematika", key: "mtk" },
      { no: "5.", nama: "Ilmu Pengetahuan Alam dan Sosial (IPAS)", key: "ipas" },
      { no: "6.", nama: "Seni Budaya dan Prakarya : Seni Rupa", key: "sbdp" },
      { no: "7.", nama: "Pendidikan Jasmani, Olahraga dan Kesehatan", key: "pjok" },
      { no: "8.", nama: "Bahasa Inggris", key: "bing" },
      { no: "9.", nama: `Muatan Lokal : ${data.nama_mulok1 || "Bahasa dan Sastra Sunda"}`, key: "mulok1" },
    ];
    if (data.nama_mulok2) {
      mapels.push({ no: "10.", nama: `Muatan Lokal : ${data.nama_mulok2}`, key: "mulok2" });
    }
    if (data.nama_mulok3) {
      mapels.push({ no: "11.", nama: `Muatan Lokal : ${data.nama_mulok3}`, key: "mulok3" });
    }

    const getAvg = () => {
      let sum = 0;
      let count = 0;
      mapels.forEach(m => {
        const v = n[m.key];
        if (v && v.trim() !== "") {
          const num = parseFloat(v.replace(",", "."));
          if (!isNaN(num)) {
            sum += num;
            count++;
          }
        }
      });
      return count > 0 ? (sum / count).toFixed(2).replace(".", ",") : "-";
    };

    return (
      <div className="print-layout-container">
        <style dangerouslySetInnerHTML={{ __html: `
          @page { size: A4 portrait; margin: 10mm 15mm; }
          body { font-family: 'Times New Roman', serif; font-size: 11pt; margin: 0; padding: 20px; background: #eee; color: #000; }
          .print-layout-container { background: #eee; min-height: 100vh; padding: 20px; }
          .surat-page { background: white; width: 210mm; min-height: 297mm; margin: 0 auto; padding: 10mm 15mm; box-sizing: border-box; box-shadow: 0 5px 15px rgba(0,0,0,0.1); color: #000; }
          .kop-surat { text-align: center; margin-bottom: 15px; margin-left: -5mm; margin-right: -5mm; }
          .kop-surat img { width: 100%; max-height: 140px; object-fit: contain; }
          .judul-box { text-align: center; margin: 15px 0; }
          .judul-box h2 { margin: 0; font-size: 13pt; text-decoration: underline; font-weight: bold; color: #000; }
          .judul-box h3 { margin: 3px 0 0 0; font-size: 11pt; font-weight: bold; color: #000; }
          .judul-box p { margin: 3px 0 0 0; font-size: 11pt; font-family: 'Courier New', Courier, monospace; font-weight: bold; color: #000; }
          .isi-surat { text-align: justify; line-height: 1.4; font-size: 11pt; color: #000; }
          .identitas-table { margin-left: 20px; width: 100%; margin-bottom: 10px; color: #000; }
          .identitas-table td { padding: 2px 0; vertical-align: top; color: #000; }
          
          .nilai-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10.5pt; color: #000; }
          .nilai-table th, .nilai-table td { border: 1px solid black; padding: 4px 8px; color: #000; }
          .nilai-table th { text-align: center; background-color: #f2f2f2; }
          .nilai-table td.center { text-align: center; }
          .nilai-table td.bold { font-weight: bold; }
          
          .footer-box { margin-top: 25px; display: flex; justify-content: space-between; align-items: flex-end; color: #000; }
          .qr-box { text-align: center; padding: 5px; border: 1px solid #ddd; border-radius: 6px; display: inline-block; background: white; }
          .qr-box p { font-size: 7px; color: #888; margin: 3px 0 0 0; font-family: sans-serif; }
          .ttd-box { width: 230px; text-align: center; font-size: 11pt; color: #000; }
          .ttd-name { font-weight: bold; text-decoration: underline; text-transform: uppercase; margin-top: 60px; color: #000; }
          .no-print { position: fixed; top: 20px; right: 20px; z-index: 1000; display: flex; gap: 10px; }
          .btn { background: #D4A843; color: white; padding: 10px 20px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
          @media print { 
            html, html.dark, body, body.dark, .print-layout-container { 
              background: white !important; 
              background-color: white !important; 
              color: #000 !important;
              color-scheme: light !important;
              padding: 0 !important; 
              margin: 0 !important; 
            } 
            .surat-page { margin: 0 auto !important; box-shadow: none !important; padding: 5mm 10mm !important; } 
            .no-print { display: none !important; } 
          }
        ` }} />
        <div className="no-print">
          <button className="btn" onClick={() => window.print()}>🖨️ Cetak Sekarang</button>
          <button className="btn" style={{ background: "#64748b" }} onClick={() => window.close()}>Tutup</button>
        </div>
        <div className="surat-page">
          <div className="kop-surat">
            <img src={data.kop_surat_url || 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgHJHdzvsrvzHVMFsAmI_Ra_4vlYn39plogGMmNIUO7MV71T8zT9YWUFQyO5UD6oeSQ7jew1exTAXcI24JwK3eBiokcmNppHqGjvq70RTfjeYdZAhIahHq0D8m2Jrixl_8bb6BaFGhm0xpov4cojZ_ydeyOtE1xM7wrxn7FSMy0EP5KTuyqWVscaIkCyN3T/s955/KOP%20Baru.png'} alt="KOP" />
          </div>
          <div className="judul-box">
            <h2>SURAT KETERANGAN KELULUSAN</h2>
            <h3>Tahun Pelajaran {data.tahun_ajaran}</h3>
            <p>Nomor: {siswa.nomor_skl || "....../......./Sket-SD/VI/2026"}</p>
          </div>
          <div className="isi-surat">
            <p>Yang bertanda tangan di bawah ini, Kepala {data.nama_sekolah}, Nomor Pokok Sekolah Nasional {data.npsn || "..."} Kabupaten Sukabumi, menerangkan bahwa :</p>
            <table className="identitas-table">
              <tbody>
                <tr>
                  <td width="35%">Nama</td>
                  <td width="2%">:</td>
                  <td style={{ fontWeight: "bold", textTransform: "uppercase" }}>{siswa.nama}</td>
                </tr>
                <tr>
                  <td>Tempat, Tanggal Lahir</td>
                  <td>:</td>
                  <td>{siswa.tempat_lahir || "-"}, {tglLahirFormatted}</td>
                </tr>
                <tr>
                  <td>Nama Orang Tua/Wali</td>
                  <td>:</td>
                  <td>{parentName}</td>
                </tr>
                <tr>
                  <td>Nomor Induk Siswa</td>
                  <td>:</td>
                  <td>{siswa.nis || "-"}</td>
                </tr>
                <tr>
                  <td>Nomor Induk Siswa Nasional</td>
                  <td>:</td>
                  <td><b>{siswa.nisn}</b></td>
                </tr>
              </tbody>
            </table>
            
            <div style={{ textAlign: "center", fontWeight: "bold", fontStyle: "italic", marginTop: "10px", fontSize: "13pt" }}>L U L U S</div>
            
            <p>dari {data.nama_sekolah} pada tanggal {formattedTglKelulusan}, setelah memenuhi kriteria sesuai dengan peraturan perundang-undangan dengan nilai sebagai berikut:</p>
            
            <table className="nilai-table">
              <thead>
                <tr>
                  <th style={{ width: "8%" }}>No</th>
                  <th style={{ width: "62%" }}>Mata Pelajaran</th>
                  <th style={{ width: "30%" }}>Nilai</th>
                </tr>
              </thead>
              <tbody>
                {mapels.map((m, index) => (
                  <tr key={index}>
                    <td className="center">{m.no}</td>
                    <td>{m.nama}</td>
                    <td className="center bold">{formatNilaiVal(m.key)}</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: "#f2f2f2" }}>
                  <td colSpan={2} className="center bold">Rata - Rata</td>
                  <td className="center bold" style={{ fontSize: "11.5pt" }}>{getAvg()}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="footer-box">
            <div className="qr-box">
              <QRCode value={verifyUrl} size={70} level="M" />
              <p>Scan untuk verifikasi</p>
            </div>
            <div className="ttd-box">
              <p>Kab. Sukabumi, {formattedTglKelulusan}</p>
              <p>Kepala Sekolah,</p>
              <div className="ttd-name">{data.nama_kepsek || "___________________"}</div>
              <div>NIP. {data.nip_kepsek || "___________________"}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { siswa } = data;
  const tglLahir = siswa.tanggal_lahir
    ? new Date(siswa.tanggal_lahir).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "-";

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center p-4 pt-8 pb-6 overflow-x-hidden" style={{ background: "linear-gradient(135deg, #050812 0%, #0a1128 50%, #050812 100%)" }}>
      {/* Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(212,168,67,0.15) 0%, transparent 70%)" }} />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)" }} />

      {/* Verification Badge */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 px-4 py-2 rounded-full mb-6 z-10" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
        <Shield size={14} className="text-emerald-400" />
        <span className="text-xs font-bold text-emerald-400">Dokumen Terverifikasi Digital</span>
        <CheckCircle size={12} className="text-emerald-400" />
      </motion.div>

      {/* Certificate Card */}
      <motion.div ref={certRef} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
        className="w-full max-w-lg relative z-10 rounded-[2rem] overflow-hidden print:!bg-white print:!border-gray-300 print:shadow-none print:!bg-none"
        style={{ background: "linear-gradient(160deg, rgba(20,15,35,0.95) 0%, rgba(10,10,25,0.98) 100%)", border: "1px solid rgba(212,168,67,0.2)", boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(212,168,67,0.08)" }}>

        {/* Gold accent top border */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, transparent, #D4A843, #F5D98C, #D4A843, transparent)" }} />

        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 text-center">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/10 rounded-full blur-[60px] pointer-events-none" />

          {/* Logo + School */}
          <div className="flex items-center justify-center gap-3 mb-4">
            {data.logo_url ? (
              <img src={data.logo_url} alt="Logo" className="w-10 h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <GraduationCap size={20} className="text-amber-400" />
              </div>
            )}
            <div className="text-left">
              <p className="text-xs font-black text-amber-400 print:text-black uppercase tracking-wider">{data.nama_sekolah}</p>
              <p className="text-[9px] text-white/30 print:text-gray-500">NPSN: {data.npsn || "-"}</p>
            </div>
          </div>

          {/* Title */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-500/30" />
            <Award size={16} className="text-amber-400" />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-500/30" />
          </div>
          <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 print:from-black print:to-black uppercase tracking-wider">
            Surat Keterangan Lulus
          </h1>
          {siswa.nomor_skl && (
            <p className="text-xs font-mono font-bold text-amber-400/90 mt-1.5">No. {siswa.nomor_skl}</p>
          )}
          <p className="text-[10px] text-white/30 print:text-gray-500 mt-1 tracking-widest uppercase">E-SKL Digital • TP {data.tahun_ajaran}</p>
        </div>

        {/* Divider */}
        <div className="mx-8 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212,168,67,0.2), transparent)" }} />

        {/* Student Info */}
        <div className="px-8 py-6 space-y-4">
          {/* Photo + Name */}
          <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-500/30 shrink-0 bg-white/5">
              {siswa.foto_url ? (
                <img src={siswa.foto_url} alt={siswa.nama} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-black text-amber-400/40">{siswa.nama.charAt(0)}</div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-black text-white print:text-black truncate uppercase">{siswa.nama}</h2>
              <p className="text-xs text-white/40 print:text-gray-600">NISN: <span className="text-amber-400/80 print:text-black font-mono">{siswa.nisn}</span></p>
            </div>
          </div>

          {/* Detail Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Tempat, Tgl Lahir", value: `${siswa.tempat_lahir || "-"}, ${tglLahir}` },
              { label: "NIS", value: siswa.nis || "-" },
              { label: "Jenis Kelamin", value: siswa.jk === "P" ? "Perempuan" : "Laki-laki" },
              { label: "Orang Tua/Wali", value: siswa.nama_ayah || siswa.nama_ibu || "-" },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl print:!bg-white print:border-gray-300 print:!border" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <p className="text-[8px] font-bold text-white/25 print:text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-xs font-bold text-white/70 print:text-black leading-snug">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Grades Table */}
          <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "rgba(0,0,0,0.2)" }}>
            <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Daftar Nilai Asesmen</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                Rata-Rata: {(() => {
                  let sum = 0, count = 0;
                  const n = siswa.nilai_kelulusan || {};
                  Object.values(n).forEach(v => {
                    if (v && v.trim() !== "") {
                      const num = parseFloat(v.replace(",", "."));
                      if (!isNaN(num)) { sum += num; count++; }
                    }
                  });
                  return count > 0 ? (sum / count).toFixed(2).replace(".", ",") : "0,00";
                })()}
              </span>
            </div>
            <div className="max-h-[250px] overflow-y-auto divide-y divide-white/[0.03]">
              {[
                { label: "Pendidikan Agama dan Budi Pekerti", key: "pai" },
                { label: "Pendidikan Pancasila", key: "ppkn" },
                { label: "Bahasa Indonesia", key: "indo" },
                { label: "Matematika", key: "mtk" },
                { label: "Ilmu Pengetahuan Alam dan Sosial (IPAS)", key: "ipas" },
                { label: "Seni Budaya dan Prakarya : Seni Rupa", key: "sbdp" },
                { label: "Pendidikan Jasmani, Olahraga & Kesehatan", key: "pjok" },
                { label: "Bahasa Inggris", key: "bing" },
                { label: `Muatan Lokal : ${data.nama_mulok1 || "Bahasa Sunda"}`, key: "mulok1" },
                ...(data.nama_mulok2 ? [{ label: `Muatan Lokal : ${data.nama_mulok2}`, key: "mulok2" }] : []),
                ...(data.nama_mulok3 ? [{ label: `Muatan Lokal : ${data.nama_mulok3}`, key: "mulok3" }] : []),
              ].map(subj => {
                const val = siswa.nilai_kelulusan?.[subj.key];
                const formatted = val ? parseFloat(val).toFixed(2).replace(".", ",") : "—";
                return (
                  <div key={subj.key} className="flex justify-between items-center px-4 py-2 text-xs">
                    <span className="text-white/60">{subj.label}</span>
                    <span className="font-mono font-bold text-white/95">{formatted}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LULUS Status */}
          <div className="relative p-5 rounded-2xl text-center overflow-hidden print:!bg-white print:border-black print:!border-2" style={{ background: "linear-gradient(135deg, rgba(212,168,67,0.08), rgba(16,185,129,0.05))", border: "1px solid rgba(212,168,67,0.15)" }}>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none print:hidden" />
            <div className="flex items-center justify-center gap-2 mb-2 relative z-10">
              <Star size={14} className="text-amber-400 print:text-black print:fill-black fill-amber-400" />
              <span className="text-[10px] font-black text-amber-400 print:text-black uppercase tracking-[0.3em]">Dinyatakan</span>
              <Star size={14} className="text-amber-400 print:text-black print:fill-black fill-amber-400" />
            </div>
            <h2 className="text-3xl font-black text-transparent print:text-black bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 print:from-black print:to-black relative z-10 tracking-widest">
              L U L U S
            </h2>
            <p className="text-[10px] text-white/30 print:text-black mt-2 relative z-10">
              Berdasarkan hasil Asesmen Sumatif Akhir Jenjang dan Rapat Dewan Guru
            </p>
          </div>

          {/* Kepsek + QR */}
          <div className="flex items-end justify-between gap-4 pt-2">
            <div className="text-left">
              <p className="text-[9px] text-white/25 print:text-gray-500 uppercase tracking-widest mb-1">Kepala Sekolah</p>
              <p className="text-sm font-black text-white/80 print:text-black">{data.nama_kepsek}</p>
              <p className="text-[10px] text-white/30 print:text-gray-600 font-mono">NIP. {data.nip_kepsek}</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="p-2 rounded-xl bg-white print:p-0 print:border-none border border-white/10">
                <QRCode value={verifyUrl} size={72} level="M" />
              </div>
              <p className="text-[7px] text-white/20 print:text-gray-500 text-center max-w-[80px] leading-tight">Scan untuk verifikasi</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 print:!bg-white print:border-t-gray-300" style={{ background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <p className="text-[9px] text-white/20 print:text-gray-500 text-center leading-relaxed">
            Dokumen E-SKL ini diterbitkan secara digital oleh {data.nama_sekolah} dan dapat diverifikasi melalui QR Code di atas.
            SKL ini bersifat sementara sampai Ijazah asli diterbitkan.
          </p>
        </div>

        {/* Gold accent bottom */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, transparent, #D4A843, #F5D98C, #D4A843, transparent)" }} />
      </motion.div>

      {/* Action Buttons */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="w-full max-w-lg mt-6 space-y-3 z-10">
        <button onClick={handleShare} className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #D4A843, #b8860b)", boxShadow: "0 10px 25px -5px rgba(212,168,67,0.3)" }}>
          <Share2 size={18} /> Bagikan E-SKL
        </button>
        <button onClick={handlePrintSKL} className="w-full py-3.5 rounded-2xl text-sm font-bold text-white/50 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 transition-all border border-white/5">
          <Download size={16} /> Unduh / Cetak
        </button>
      </motion.div>

      {/* Footer */}
      <div className="mt-auto pt-8 text-center z-10">
        <p className="text-[10px] text-white/15">{data.nama_sekolah} • E-SKL Digital {data.tahun_ajaran}</p>
      </div>
    </div>
  );
}
