"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import QRCode from "react-qr-code";

interface SiswaData {
  id: string;
  nama: string;
  nisn: string;
  nis?: string;
  jk: string;
  kelas?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  nama_ayah?: string;
  nama_ibu?: string;
  foto_url?: string;
  status_kelulusan?: string;
  nomor_skl?: string | null;
  nilai_kelulusan?: Record<string, string> | null;
}

interface BulkData {
  siswaList: SiswaData[];
  nama_sekolah: string;
  nama_kepsek: string;
  nip_kepsek: string;
  npsn: string;
  alamat_sekolah: string;
  tahun_ajaran: string;
  logo_url?: string;
  kop_surat_url?: string;
  tanggal_kelulusan?: string;
  nama_mulok1?: string;
  nama_mulok2?: string;
  nama_mulok3?: string;
}

export default function BulkPrintPage() {
  const [data, setData] = useState<BulkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/kelulusan/skl/bulk")
      .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
      .then(({ ok, data: d }) => {
        if (!ok) throw new Error(d.error || "Gagal memuat data");
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (data && data.siswaList.length > 0) {
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050812]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Memuat data siswa LULUS...</p>
        </div>
      </div>
    );
  }

  if (error || !data || data.siswaList.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#050812]">
        <div className="max-w-sm w-full text-center p-10 rounded-[2rem]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h1 className="text-xl font-black text-white mb-2">Gagal Cetak Bulk</h1>
          <p className="text-sm text-white/40">{error || "Tidak ada siswa berstatus LULUS yang ditemukan."}</p>
        </div>
      </div>
    );
  }

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

  const mapelsTemplate = [
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
    mapelsTemplate.push({ no: "10.", nama: `Muatan Lokal : ${data.nama_mulok2}`, key: "mulok2" });
  }
  if (data.nama_mulok3) {
    mapelsTemplate.push({ no: "11.", nama: `Muatan Lokal : ${data.nama_mulok3}`, key: "mulok3" });
  }

  return (
    <div className="print-layout-container">
      <style dangerouslySetInnerHTML={{ __html: `
        @page { size: A4 portrait; margin: 10mm 15mm; }
        body { font-family: 'Times New Roman', serif; font-size: 11pt; margin: 0; padding: 20px; background: #eee; color: #000; }
        .print-layout-container { background: #eee; min-height: 100vh; padding: 20px; }
        .surat-page { background: white; width: 210mm; min-height: 297mm; margin: 0 auto 30px auto; padding: 10mm 15mm; box-sizing: border-box; box-shadow: 0 5px 15px rgba(0,0,0,0.1); color: #000; position: relative; }
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
          .surat-page { margin: 0 auto !important; box-shadow: none !important; padding: 5mm 10mm !important; page-break-after: always; break-after: page; } 
          .no-print { display: none !important; } 
        }
      ` }} />
      <div className="no-print">
        <button className="btn" onClick={() => window.print()}>🖨️ Cetak Semua ({data.siswaList.length} Siswa)</button>
        <button className="btn" style={{ background: "#64748b" }} onClick={() => window.close()}>Tutup</button>
      </div>

      {data.siswaList.map((siswa) => {
        const tglLahirFormatted = siswa.tanggal_lahir
          ? new Date(siswa.tanggal_lahir).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
          : "-";
        const parentName = siswa.nama_ayah || siswa.nama_ibu || "-";
        const n = siswa.nilai_kelulusan || {};
        
        const formatNilaiVal = (key: string) => {
          const v = n[key];
          if (v === undefined || v === null || v.trim() === "") return "-";
          return parseFloat(v.replace(",", ".")).toFixed(2).replace(".", ",");
        };

        const getAvg = () => {
          let sum = 0;
          let count = 0;
          mapelsTemplate.forEach((m) => {
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

        const verifyUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/portal/kelulusan/skl/${siswa.nisn}`;

        return (
          <div className="surat-page" key={siswa.id}>
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
                  {mapelsTemplate.map((m, index) => (
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
        );
      })}
    </div>
  );
}
