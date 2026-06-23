"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle, Printer } from "lucide-react";
import { SCHOOL } from "@/lib/school.config";

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
  format_skl?: string;
  ttd_url?: string;
  stempel_url?: string;
}

export default function BulkTranskripPage() {
  const [data, setData] = useState<BulkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTtd, setShowTtd] = useState(true);
  const [showStempel, setShowStempel] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("ttd") === "false") {
      setShowTtd(false);
    }
    if (params.get("stempel") === "false") {
      setShowStempel(false);
    }
  }, []);

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
      const params = new URLSearchParams(window.location.search);
      if (params.get("print") === "true") {
        const timer = setTimeout(() => {
          window.print();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050812]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
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

  // Formatting variables
  const getBulanIndo = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch { return dateStr; }
  };
  
  const getAlamatKota = (alamat: string) => {
    const parts = alamat.split(",");
    return parts[parts.length - 1]?.trim() || alamat;
  };

  const schoolKota = (() => {
    if (!data?.alamat_sekolah) return SCHOOL.kota;
    const parts = data.alamat_sekolah.split(",");
    const found = parts.find(p => p.toLowerCase().includes("kab.") || p.toLowerCase().includes("kota") || p.toLowerCase().includes("kec."));
    return found?.trim() || SCHOOL.kota;
  })();

  const getNilai = (s: SiswaData, key: string) => s.nilai_kelulusan?.[key] || "";
  const formatNilai = (val: string) => {
    if (!val || val.trim() === "") return "-";
    const num = parseFloat(val.replace(",", "."));
    return isNaN(num) ? "-" : num.toFixed(2).replace(".", ",");
  };

  const getRataRata = (s: SiswaData) => {
    const keys = ["pai", "ppkn", "indo", "mtk", "ipas", "pjok", "sbdp", "bing", "mulok1", "mulok2", "mulok3"];
    let sum = 0, count = 0;
    keys.forEach(k => {
      const v = getNilai(s, k);
      if (v && v.trim() !== "") {
        const num = parseFloat(v.replace(",", "."));
        if (!isNaN(num)) { sum += num; count++; }
      }
    });
    if (count === 0) return "-";
    const avg = sum / count;
    return avg.toFixed(2).replace(".", ",");
  };

  return (
    <div className="print-layout-container">
      <style dangerouslySetInnerHTML={{ __html: `
        @page { size: A4 portrait; margin: 10mm 15mm; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; margin: 0; padding: 20px; background: #eee; color: #000; }
        .print-layout-container { background: #eee; min-height: 100vh; padding: 20px; }
        .surat-page { 
          background: white; 
          width: 210mm; 
          min-height: 297mm; 
          margin: 0 auto 30px auto; 
          padding: 10mm 15mm; 
          box-sizing: border-box; 
          box-shadow: 0 5px 15px rgba(0,0,0,0.1); 
          color: #000; 
          page-break-after: always;
          position: relative;
          font-family: 'Times New Roman', serif;
        }
        .surat-page:last-child { page-break-after: auto; margin-bottom: 0; }
        .kop-surat {
          text-align: center;
          margin-bottom: 12px;
          margin-left: -5mm;
          margin-right: -5mm;
        }
        .kop-surat img {
          width: 100%;
          max-height: 120px;
          object-fit: contain;
        }
        .judul-box {
          text-align: center;
          margin: 10px 0;
        }
        .judul-box h1 {
          margin: 0;
          font-size: 14pt;
          text-decoration: underline;
          font-weight: bold;
          color: #000;
          letter-spacing: 1px;
        }
        .judul-box p {
          margin: 3px 0 0 0;
          font-size: 11pt;
          font-weight: bold;
          color: #000;
        }
        .ttd-box {
          width: 250px;
          text-align: center;
          font-size: 11pt;
          color: #000;
        }
        .ttd-name {
          font-weight: bold;
          text-decoration: underline;
          text-transform: uppercase;
          color: #000;
        }
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
          .surat-page { margin: 0 auto !important; box-shadow: none !important; padding: 5mm 10mm !important; min-height: auto !important; page-break-after: always; break-after: page; } 
          .no-print { display: none !important; }
        }
      `}} />

      <div className="no-print" style={{ display: "flex", gap: "16px", alignItems: "center", background: "rgba(15, 23, 42, 0.9)", padding: "16px 24px", borderRadius: "20px", marginBottom: "25px", border: "1px solid rgba(255, 255, 255, 0.08)", backdropFilter: "blur(12px)" }}>
        <button className="btn" onClick={() => window.print()} style={{ background: "linear-gradient(135deg, #D4A843, #b8860b)" }}>
          🖨️ Cetak Semua ({data.siswaList.length} Siswa)
        </button>
        
        <div style={{ display: "flex", gap: "20px", marginLeft: "20px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "rgba(255, 255, 255, 0.8)", fontSize: "12px", fontWeight: "bold", userSelect: "none" }}>
            <input 
              type="checkbox" 
              checked={showTtd} 
              onChange={(e) => setShowTtd(e.target.checked)} 
              style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#D4A843" }} 
            />
            Tampilkan Tanda Tangan
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "rgba(255, 255, 255, 0.8)", fontSize: "12px", fontWeight: "bold", userSelect: "none" }}>
            <input 
              type="checkbox" 
              checked={showStempel} 
              onChange={(e) => setShowStempel(e.target.checked)} 
              style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#D4A843" }} 
            />
            Tampilkan Stempel
          </label>
        </div>

        <button className="btn" style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", marginLeft: "auto" }} onClick={() => window.close()}>
          Tutup
        </button>
      </div>

      {data.siswaList.map((siswa, idx) => {
        const nomorTranskrip = siswa.nilai_kelulusan?.nomor_transkrip || "...................................................";
        const nomorIjazah = siswa.nilai_kelulusan?.nomor_ijazah || "...................................................";

        return (
          <div key={siswa.id} className="surat-page">
            <div className="kop-surat">
              <img src={data.kop_surat_url || '/KOP_Baru.png'} alt="KOP" />
            </div>

            <div className="judul-box">
              <h1>TRANSKRIP NILAI</h1>
              <p>Nomor: {nomorTranskrip}</p>
            </div>

            <div className="mb-3 ml-2">
              <table className="w-full text-base">
                <tbody>
                  <tr>
                    <td className="py-0.5 whitespace-nowrap pr-4 w-[38%]">Satuan Pendidikan</td>
                    <td className="w-[2%]">:</td>
                    <td className="w-[60%]">{data.nama_sekolah}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 whitespace-nowrap pr-4">Nomor Pokok Sekolah Nasional</td>
                    <td>:</td>
                    <td>{data.npsn}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 whitespace-nowrap pr-4">Nama Lengkap</td>
                    <td>:</td>
                    <td>{siswa.nama}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 whitespace-nowrap pr-4">Tempat, Tanggal Lahir</td>
                    <td>:</td>
                    <td>{siswa.tempat_lahir}, {getBulanIndo(siswa.tanggal_lahir)}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 whitespace-nowrap pr-4">Nomor Induk Siswa Nasional</td>
                    <td>:</td>
                    <td>{siswa.nisn}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 whitespace-nowrap pr-4">Nomor Ijazah</td>
                    <td>:</td>
                    <td>{nomorIjazah}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 whitespace-nowrap pr-4">Tanggal Kelulusan</td>
                    <td>:</td>
                    <td>{getBulanIndo(data.tanggal_kelulusan)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <table className="w-full border-collapse border border-black mb-4 text-base">
              <thead>
                <tr>
                  <th className="border border-black py-1.5 px-3 w-[8%]">No</th>
                  <th className="border border-black py-1.5 px-4 w-[77%]">Mata Pelajaran</th>
                  <th className="border border-black py-1.5 px-3 w-[15%]">Nilai</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black py-0.5 px-3 text-center">1</td>
                  <td className="border border-black py-0.5 px-4">Pendidikan Agama Islam dan Budi Pekerti</td>
                  <td className="border border-black py-0.5 px-3 text-center">{formatNilai(getNilai(siswa, "pai"))}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-3 text-center">2</td>
                  <td className="border border-black py-0.5 px-4">Pendidikan Pancasila</td>
                  <td className="border border-black py-0.5 px-3 text-center">{formatNilai(getNilai(siswa, "ppkn"))}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-3 text-center">3</td>
                  <td className="border border-black py-0.5 px-4">Bahasa Indonesia</td>
                  <td className="border border-black py-0.5 px-3 text-center">{formatNilai(getNilai(siswa, "indo"))}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-3 text-center">4</td>
                  <td className="border border-black py-0.5 px-4">Matematika</td>
                  <td className="border border-black py-0.5 px-3 text-center">{formatNilai(getNilai(siswa, "mtk"))}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-3 text-center">5</td>
                  <td className="border border-black py-0.5 px-4">Ilmu Pengetahuan Alam dan Sosial</td>
                  <td className="border border-black py-0.5 px-3 text-center">{formatNilai(getNilai(siswa, "ipas"))}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-3 text-center">6</td>
                  <td className="border border-black py-0.5 px-4">Pendidikan Jasmani Olahraga dan Kesehatan</td>
                  <td className="border border-black py-0.5 px-3 text-center">{formatNilai(getNilai(siswa, "pjok"))}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-3 text-center">7</td>
                  <td className="border border-black py-0.5 px-4">Seni Budaya: Seni Rupa</td>
                  <td className="border border-black py-0.5 px-3 text-center">{formatNilai(getNilai(siswa, "sbdp"))}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-3 text-center">8</td>
                  <td className="border border-black py-0.5 px-4">Bahasa Inggris</td>
                  <td className="border border-black py-0.5 px-3 text-center">{formatNilai(getNilai(siswa, "bing"))}</td>
                </tr>
                <tr>
                  <td className="border-r border-black py-0.5 px-3 text-center">9</td>
                  <td className="border-r border-black py-0.5 px-4 font-bold">Muatan Lokal:</td>
                  <td className="border-l border-black py-0.5 px-3"></td>
                </tr>
                <tr>
                  <td className="border-r border-black py-0.5 px-3"></td>
                  <td className="border-r border-black py-0.5 pl-8">{data.nama_mulok1}</td>
                  <td className="border-l border-black py-0.5 px-3 text-center">{formatNilai(getNilai(siswa, "mulok1"))}</td>
                </tr>
                {data.nama_mulok2 && (
                  <tr>
                    <td className="border-r border-black py-0.5 px-3"></td>
                    <td className="border-r border-black py-0.5 pl-8">{data.nama_mulok2}</td>
                    <td className="border-l border-black py-0.5 px-3 text-center">{formatNilai(getNilai(siswa, "mulok2"))}</td>
                  </tr>
                )}
                {data.nama_mulok3 && (
                  <tr>
                    <td className="border-r border-black py-0.5 px-3"></td>
                    <td className="border-r border-black py-0.5 pl-8">{data.nama_mulok3}</td>
                    <td className="border-l border-black py-0.5 px-3 text-center">{formatNilai(getNilai(siswa, "mulok3"))}</td>
                  </tr>
                )}
                <tr>
                  <td className="border-r border-black py-0.5 px-3"></td>
                  <td className="border-r border-black py-0.5 pl-8"></td>
                  <td className="border-l border-black py-0.5 px-3 text-center"></td>
                </tr>
                <tr>
                  <td className="border-r border-b border-black py-0.5 px-3"></td>
                  <td className="border-r border-b border-black py-0.5 pl-8"></td>
                  <td className="border-b border-l border-black py-0.5 px-3 text-center"></td>
                </tr>
                <tr>
                  <td colSpan={2} className="border border-black py-1 px-4 text-center font-bold">Rata - Rata</td>
                  <td className="border border-black py-1 px-3 text-center font-bold">{getRataRata(siswa)}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <div className="ttd-box" style={{ position: "relative" }}>
                <p className="mb-1">{schoolKota}, {getBulanIndo(data.tanggal_kelulusan)}</p>
                <p>Kepala,</p>
                
                <div style={{ height: "100px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "-5px", marginTop: "5px" }}>
                  {showTtd && data.ttd_url && (
                    <img src={data.ttd_url} style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", maxHeight: "100px", objectFit: "contain", zIndex: 1, mixBlendMode: "multiply" }} alt="TTD" />
                  )}
                  {showStempel && data.stempel_url && (
                    <img src={data.stempel_url} style={{ position: "absolute", left: "50%", transform: "translateX(-110px)", maxHeight: "120px", objectFit: "contain", zIndex: 2, opacity: 0.9, mixBlendMode: "multiply" }} alt="Stempel" />
                  )}
                </div>

                <p className="ttd-name" style={{ marginTop: (showTtd || showStempel) ? "5px" : "60px" }}>{data.nama_kepsek}</p>
                <p>NIP. {data.nip_kepsek || "___________________"}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
