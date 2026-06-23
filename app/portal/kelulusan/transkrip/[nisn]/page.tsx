"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Download, Share2, CheckCircle, Loader2, AlertCircle } from "lucide-react";
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
  sk_lulus_nomor?: string;
  sk_lulus_tentang?: string;
  format_skl?: string;
  ttd_url?: string;
  stempel_url?: string;
}

export default function TranskripPage() {
  const { nisn } = useParams<{ nisn: string }>();
  const [data, setData] = useState<SklData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [downloadingJpg, setDownloadingJpg] = useState(false);
  const [showTtd, setShowTtd] = useState(true);
  const [showStempel, setShowStempel] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("print") === "true") {
        setIsPrintMode(true);
      }
      if (params.get("ttd") === "false") {
        setShowTtd(false);
      }
      if (params.get("stempel") === "false") {
        setShowStempel(false);
      }
    }
  }, []);

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

  useEffect(() => {
    if (isPrintMode && data) {
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, [isPrintMode, data]);

  const handleDownloadJpg = async () => {
    const element = printAreaRef.current;
    if (!element) return;
    setDownloadingJpg(true);
    
    const imgElements = element.getElementsByTagName("img");
    const originalSrcs: { img: HTMLImageElement; src: string }[] = [];
    
    try {
      const conversionPromises = Array.from(imgElements).map(async (img) => {
        const currentSrc = img.getAttribute("src") || img.src;
        if (currentSrc && !currentSrc.startsWith("data:") && !currentSrc.startsWith("blob:")) {
          originalSrcs.push({ img, src: currentSrc });
          try {
            const isExternal = currentSrc.startsWith("http://") || currentSrc.startsWith("https://");
            const fetchUrl = isExternal ? `/api/proxy-image?url=${encodeURIComponent(currentSrc)}` : currentSrc;
            const res = await fetch(fetchUrl);
            if (res.ok) {
              const blob = await res.blob();
              const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
              img.src = base64;
            }
          } catch (fetchErr) {
            console.warn("Skipped base64 conversion", fetchErr);
          }
        }
      });
      
      await Promise.all(conversionPromises);

      element.style.width = "794px";
      element.style.minHeight = "auto";
      element.style.overflow = "visible";
      element.style.marginLeft = "0";
      element.style.marginRight = "0";

      await new Promise(resolve => setTimeout(resolve, 300));
      const { toJpeg } = await import("html-to-image");
      const rect = element.getBoundingClientRect();
      const dataUrl = await toJpeg(element, {
        quality: 0.98, backgroundColor: "#ffffff", pixelRatio: 2.5,
        width: Math.ceil(rect.width), height: Math.ceil(rect.height),
        style: { margin: "0", transform: "none", transformOrigin: "top left", position: "relative" }
      });

      const link = document.createElement("a");
      link.download = `Transkrip_Nilai_${data?.siswa.nama.replace(/\s+/g, "_")}_${data?.siswa.nisn}.jpg`;
      link.href = dataUrl;
      link.click();
      
      element.style.width = "";
      element.style.minHeight = "";
      element.style.overflow = "";
    } catch (err) {
      console.error("Gagal export JPG:", err);
      alert("Gagal mengunduh JPG. Silakan gunakan tombol Cetak lalu pilih Save as PDF.");
    } finally {
      originalSrcs.forEach(({ img, src }) => { img.src = src; });
      setDownloadingJpg(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050812] flex flex-col items-center justify-center p-6">
        <Loader2 size={40} className="text-indigo-500 animate-spin mb-4" />
        <p className="text-white/60 font-medium">Memuat Transkrip Nilai...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#050812] flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-6">
          <AlertCircle size={32} className="text-rose-500" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Transkrip Tidak Ditemukan</h1>
        <p className="text-white/60 text-center max-w-md">{error}</p>
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

  const getNilai = (key: string) => data.siswa.nilai_kelulusan?.[key] || "";
  const formatNilai = (val: string) => {
    if (!val || val.trim() === "") return "-";
    const num = parseFloat(val.replace(",", "."));
    return isNaN(num) ? "-" : num.toFixed(2).replace(".", ",");
  };

  const getRataRata = () => {
    const keys = ["pai", "ppkn", "indo", "mtk", "ipas", "pjok", "sbdp", "bing", "mulok1", "mulok2", "mulok3"];
    let sum = 0, count = 0;
    keys.forEach(k => {
      const v = getNilai(k);
      if (v && v.trim() !== "") {
        const num = parseFloat(v.replace(",", "."));
        if (!isNaN(num)) { sum += num; count++; }
      }
    });
    if (count === 0) return "-";
    const avg = sum / count;
    return avg.toFixed(2).replace(".", ",");
  };

  const nomorTranskrip = data.siswa.nilai_kelulusan?.nomor_transkrip || "...................................................";
  const nomorIjazah = data.siswa.nilai_kelulusan?.nomor_ijazah || "...................................................";

  return (
    <div className={`min-h-screen ${isPrintMode ? "bg-[#eee] py-8" : "bg-[#050812] py-8 px-4"}`}>
      
      {/* Top action bar (hidden when printing) */}
      <div className="no-print max-w-[210mm] mx-auto mb-8 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/90 p-4 rounded-2xl border border-white/10 backdrop-blur-md text-white">
        <div>
          <h2 className="font-bold text-white">Transkrip Nilai</h2>
          <p className="text-white/50 text-xs">{data.siswa.nama} • {data.siswa.nisn}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex gap-4 mr-2">
            <label className="flex items-center gap-2 cursor-pointer text-white text-xs font-bold select-none">
              <input 
                type="checkbox" 
                checked={showTtd} 
                onChange={(e) => setShowTtd(e.target.checked)} 
                className="cursor-pointer w-4 h-4 accent-[#D4A843]" 
              />
              Tampilkan TTD
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-white text-xs font-bold select-none">
              <input 
                type="checkbox" 
                checked={showStempel} 
                onChange={(e) => setShowStempel(e.target.checked)} 
                className="cursor-pointer w-4 h-4 accent-[#D4A843]" 
              />
              Tampilkan Stempel
            </label>
          </div>
          
          <button onClick={handleDownloadJpg} disabled={downloadingJpg}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all disabled:opacity-50">
            {downloadingJpg ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {downloadingJpg ? "Menyimpan..." : "Simpan JPG"}
          </button>
          
          <button onClick={() => window.print()}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-500 border border-indigo-400 hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20">
            🖨️ Cetak Transkrip
          </button>
        </div>
      </div>

      {/* Area Cetak */}
      <div 
        ref={printAreaRef}
        className="mx-auto bg-white text-black relative surat-page"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "10mm 15mm",
          boxShadow: isPrintMode ? "none" : "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          overflow: "hidden"
        }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          @page { size: A4 portrait; margin: 10mm 15mm; }
          @media print {
            html, html.dark, body, body.dark, .min-h-screen {
              background: white !important;
              background-color: white !important;
              color: #000 !important;
              color-scheme: light !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .surat-page {
              margin: 0 auto !important;
              box-shadow: none !important;
              padding: 5mm 10mm !important;
              min-height: auto !important;
            }
            .no-print { display: none !important; }
          }
          .surat-page {
            font-family: 'Times New Roman', serif;
            color: #000;
          }
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
        `}} />

        {/* KOP SURAT */}
        <div className="kop-surat">
          <img src={data.kop_surat_url || '/KOP_Baru.png'} alt="KOP" />
        </div>

        {/* JUDUL */}
        <div className="judul-box">
          <h1>TRANSKRIP NILAI</h1>
          <p>Nomor: {nomorTranskrip}</p>
        </div>

        {/* DATA SISWA */}
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
                <td>{data.siswa.nama}</td>
              </tr>
              <tr>
                <td className="py-0.5 whitespace-nowrap pr-4">Tempat, Tanggal Lahir</td>
                <td>:</td>
                <td>{data.siswa.tempat_lahir}, {getBulanIndo(data.siswa.tanggal_lahir)}</td>
              </tr>
              <tr>
                <td className="py-0.5 whitespace-nowrap pr-4">Nomor Induk Siswa Nasional</td>
                <td>:</td>
                <td>{data.siswa.nisn}</td>
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

        {/* TABEL NILAI */}
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
              <td className="border border-black py-0.5 px-3 text-center">{formatNilai(getNilai("pai"))}</td>
            </tr>
            <tr>
              <td className="border border-black py-0.5 px-3 text-center">2</td>
              <td className="border border-black py-0.5 px-4">Pendidikan Pancasila</td>
              <td className="border border-black py-0.5 px-3 text-center">{formatNilai(getNilai("ppkn"))}</td>
            </tr>
            <tr>
              <td className="border border-black py-0.5 px-3 text-center">3</td>
              <td className="border border-black py-0.5 px-4">Bahasa Indonesia</td>
              <td className="border border-black py-0.5 px-3 text-center">{formatNilai(getNilai("indo"))}</td>
            </tr>
            <tr>
              <td className="border border-black py-0.5 px-3 text-center">4</td>
              <td className="border border-black py-0.5 px-4">Matematika</td>
              <td className="border border-black py-0.5 px-3 text-center">{formatNilai(getNilai("mtk"))}</td>
            </tr>
            <tr>
              <td className="border border-black py-0.5 px-3 text-center">5</td>
              <td className="border border-black py-0.5 px-4">Ilmu Pengetahuan Alam dan Sosial</td>
              <td className="border border-black py-0.5 px-3 text-center">{formatNilai(getNilai("ipas"))}</td>
            </tr>
            <tr>
              <td className="border border-black py-0.5 px-3 text-center">6</td>
              <td className="border border-black py-0.5 px-4">Pendidikan Jasmani Olahraga dan Kesehatan</td>
              <td className="border border-black py-0.5 px-3 text-center">{formatNilai(getNilai("pjok"))}</td>
            </tr>
            <tr>
              <td className="border border-black py-0.5 px-3 text-center">7</td>
              <td className="border border-black py-0.5 px-4">Seni Budaya: Seni Rupa</td>
              <td className="border border-black py-0.5 px-3 text-center">{formatNilai(getNilai("sbdp"))}</td>
            </tr>
            <tr>
              <td className="border border-black py-0.5 px-3 text-center">8</td>
              <td className="border border-black py-0.5 px-4">Bahasa Inggris</td>
              <td className="border border-black py-0.5 px-3 text-center">{formatNilai(getNilai("bing"))}</td>
            </tr>
            <tr>
              <td className="border-r border-black py-0.5 px-3 text-center">9</td>
              <td className="border-r border-black py-0.5 px-4 font-bold">Muatan Lokal:</td>
              <td className="border-l border-black py-0.5 px-3"></td>
            </tr>
            <tr>
              <td className="border-r border-black py-0.5 px-3"></td>
              <td className="border-r border-black py-0.5 pl-8">{data.nama_mulok1}</td>
              <td className="border-l border-black py-0.5 px-3 text-center">{formatNilai(getNilai("mulok1"))}</td>
            </tr>
            {data.nama_mulok2 && (
              <tr>
                <td className="border-r border-black py-0.5 px-3"></td>
                <td className="border-r border-black py-0.5 pl-8">{data.nama_mulok2}</td>
                <td className="border-l border-black py-0.5 px-3 text-center">{formatNilai(getNilai("mulok2"))}</td>
              </tr>
            )}
            {data.nama_mulok3 && (
              <tr>
                <td className="border-r border-black py-0.5 px-3"></td>
                <td className="border-r border-black py-0.5 pl-8">{data.nama_mulok3}</td>
                <td className="border-l border-black py-0.5 px-3 text-center">{formatNilai(getNilai("mulok3"))}</td>
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
              <td className="border border-black py-1 px-3 text-center font-bold">{getRataRata()}</td>
            </tr>
          </tbody>
        </table>

        {/* FOOTER & TTD */}
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
    </div>
  );
}
