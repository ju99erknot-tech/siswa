"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import QRCode from "react-qr-code";
import { SCHOOL } from "@/lib/school.config";

function terbilangAngka(n: number): string {
  const angka = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  if (n < 12) return angka[n];
  if (n < 20) return terbilangAngka(n - 10) + " belas";
  if (n < 100) return terbilangAngka(Math.floor(n / 10)) + " puluh " + terbilangAngka(n % 10);
  if (n < 200) return "seratus " + terbilangAngka(n - 100);
  return "";
}

function terbilangDesimal(desimalStr: string): string {
  const angka: Record<string, string> = {
    "0": "nol", "1": "satu", "2": "dua", "3": "tiga", "4": "empat",
    "5": "lima", "6": "enam", "7": "tujuh", "8": "delapan", "9": "sembilan"
  };
  return desimalStr.split("").map(char => angka[char] || "").filter(Boolean).join(" ");
}

function terbilangRataRata(rataRataStr: string): string {
  const normalized = rataRataStr.replace(".", ",");
  const parts = normalized.split(",");
  const integerPart = parseInt(parts[0], 10);
  if (isNaN(integerPart)) return "-";
  const integerWords = terbilangAngka(integerPart) || "nol";
  
  if (parts.length > 1 && parts[1]) {
    const decimalWords = terbilangDesimal(parts[1]);
    return `${integerWords} koma ${decimalWords}`.trim().replace(/\s+/g, " ");
  }
  return integerWords.trim().replace(/\s+/g, " ");
}

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
  sk_lulus_nomor?: string;
  sk_lulus_tentang?: string;
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
        @page { size: A4 portrait; margin: 15mm 20mm; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; margin: 0; padding: 20px; background: #eee; color: #000; }
        .print-layout-container { background: #eee; min-height: 100vh; padding: 20px; }
        .surat-page { background: white; width: 210mm; min-height: 297mm; margin: 0 auto 30px auto; padding: 15mm 20mm; box-sizing: border-box; box-shadow: 0 5px 15px rgba(0,0,0,0.1); color: #000; position: relative; }
        .kop-surat { text-align: center; margin-bottom: 20px; margin-left: -5mm; margin-right: -5mm; }
        .kop-surat img { width: 100%; max-height: 140px; object-fit: contain; }
        .judul-box { text-align: center; margin: 25px 0; }
        .judul-box h2 { margin: 0; font-size: 14pt; text-decoration: underline; font-weight: bold; color: #000; letter-spacing: 1px; }
        .judul-box p { margin: 5px 0 0 0; font-size: 12pt; font-family: 'Times New Roman', serif; font-weight: bold; color: #000; }
        .isi-surat { text-align: justify; line-height: 1.6; font-size: 12pt; color: #000; }
        .identitas-table { margin-left: 30px; width: 90%; margin-top: 15px; margin-bottom: 15px; color: #000; }
        .identitas-table td { padding: 4px 0; vertical-align: top; color: #000; }
        
        .footer-box { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; color: #000; }
        .qr-box { text-align: center; padding: 5px; border: 1px solid #ddd; border-radius: 6px; display: inline-block; background: white; }
        .qr-box p { font-size: 7px; color: #888; margin: 3px 0 0 0; font-family: sans-serif; }
        .ttd-box { width: 250px; text-align: center; font-size: 12pt; color: #000; }
        .ttd-name { font-weight: bold; text-decoration: underline; text-transform: uppercase; margin-top: 75px; color: #000; }
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
        const n = siswa.nilai_kelulusan || {};
        
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

        const avgVal = getAvg();
        const avgTerbilang = terbilangRataRata(avgVal);

        const schoolKota = (() => {
          if (!data.alamat_sekolah) return SCHOOL.kota;
          const parts = data.alamat_sekolah.split(",");
          const found = parts.find(p => p.toLowerCase().includes("kab.") || p.toLowerCase().includes("kota") || p.toLowerCase().includes("kec."));
          return found?.trim() || SCHOOL.kota;
        })();

        const verifyUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/portal/kelulusan/skl/${siswa.nisn}`;

        return (
          <div className="surat-page" key={siswa.id}>
            <div className="kop-surat">
              <img src={data.kop_surat_url || 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgHJHdzvsrvzHVMFsAmI_Ra_4vlYn39plogGMmNIUO7MV71T8zT9YWUFQyO5UD6oeSQ7jew1exTAXcI24JwK3eBiokcmNppHqGjvq70RTfjeYdZAhIahHq0D8m2Jrixl_8bb6BaFGhm0xpov4cojZ_ydeyOtE1xM7wrxn7FSMy0EP5KTuyqWVscaIkCyN3T/s955/KOP%20Baru.png'} alt="KOP" />
            </div>
            <div className="judul-box">
              <h2>SURAT KETERANGAN LULUS</h2>
              <p>Nomor : {siswa.nomor_skl || "400.3.11/...../........./2026"}</p>
            </div>
            <div className="isi-surat">
              <p>Yang bertanda tangan di bawah ini Kepala {data.nama_sekolah} Kabupaten Sukabumi Provinsi Jawa Barat, menerangkan bahwa :</p>
              <p>berdasarkan Surat Keputusan Kepala {data.nama_sekolah} nomor {data.sk_lulus_nomor || SCHOOL.skLulusNomor} tentang {data.sk_lulus_tentang || SCHOOL.skLulusTentang}, menerangkan nama peserta didik di bawah ini:</p>
              <table className="identitas-table">
                <tbody>
                  <tr>
                    <td width="35%">Nama</td>
                    <td width="2%">:</td>
                    <td style={{ fontWeight: "bold", textTransform: "uppercase" }}>{siswa.nama}</td>
                  </tr>
                  <tr>
                    <td>Tempat Tanggal Lahir</td>
                    <td>:</td>
                    <td>{siswa.tempat_lahir || "-"}, {tglLahirFormatted}</td>
                  </tr>
                  <tr>
                    <td>NISN</td>
                    <td>:</td>
                    <td><b>{siswa.nisn}</b></td>
                  </tr>
                </tbody>
              </table>
              
              <p>Dinyatakan <b>LULUS</b> dari {data.nama_sekolah} tahun ajaran {data.tahun_ajaran} setelah memenuhi kriteria sesuai peraturan perundangan, dengan nilai rata-rata <b>{avgVal}</b> (<i>{avgTerbilang}</i>).</p>
              
              <p style={{ marginTop: "20px" }}>Demikian Surat Keterangan ini dibuat sebagai salah satu syarat dalam penerimaan murid baru.</p>
            </div>
            
            <div className="footer-box">
              <div className="qr-box">
                <QRCode value={verifyUrl} size={70} level="M" />
                <p>Scan untuk verifikasi</p>
              </div>
              <div className="ttd-box">
                <p>{schoolKota}, {formattedTglKelulusan}</p>
                <p style={{ marginBottom: "75px" }}>Kepala,</p>
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
