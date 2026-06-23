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

  const getNilai = (s: SiswaData, key: string) => s.nilai_kelulusan?.[key] || "";
  const formatNilai = (val: string) => {
    if (!val || val.trim() === "") return "";
    const num = parseFloat(val.replace(",", "."));
    return isNaN(num) ? "" : Math.round(num).toString();
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
    if (count === 0) return "";
    return Math.round(sum / count).toString();
  };

  return (
    <div className="print-layout-container font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @page { size: A4 portrait; margin: 0; }
        body { margin: 0; padding: 0; background: #eee; }
        .print-layout-container { background: #eee; min-height: 100vh; padding: 20px; }
        .surat-page { 
          background: white; 
          width: 210mm; 
          min-height: 297mm; 
          margin: 0 auto 30px auto; 
          padding: 15mm 20mm; 
          box-sizing: border-box; 
          box-shadow: 0 5px 15px rgba(0,0,0,0.1); 
          color: #000; 
          page-break-after: always;
          position: relative;
        }
        .surat-page:last-child { page-break-after: auto; margin-bottom: 0; }
        @media print {
          body, .print-layout-container { background: white; padding: 0; }
          .surat-page { box-shadow: none; margin: 0; }
          .no-print { display: none !important; }
        }
      `}} />

      <div className="no-print fixed top-6 right-6 z-50">
        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-indigo-500 hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20">
          <Printer size={18} />
          Cetak {data.siswaList.length} Transkrip
        </button>
      </div>

      {data.siswaList.map((siswa, idx) => {
        const nomorTranskrip = siswa.nilai_kelulusan?.nomor_transkrip || "...................................................";
        const nomorIjazah = siswa.nilai_kelulusan?.nomor_ijazah || "...................................................";

        return (
          <div key={siswa.id} className="surat-page">
            {/* KOP SURAT */}
            {data.kop_surat_url ? (
              <img src={data.kop_surat_url} alt="KOP Surat" className="w-full object-contain mb-1 border-b-[3px] border-black pb-1" />
            ) : (
              <div className="text-center font-bold text-2xl mb-1 border-b-[3px] border-black pb-4 pt-4 uppercase">
                {data.nama_sekolah}
              </div>
            )}
            <div className="border-b-[1px] border-black mb-6 mt-[2px]"></div>

            {/* JUDUL */}
            <div className="text-center mb-6">
              <h1 className="font-bold text-lg underline tracking-wide">TRANSKIP NILAI</h1>
              <p className="text-base mt-1">Nomor: {nomorTranskrip}</p>
            </div>

            {/* DATA SISWA */}
            <div className="mb-6 ml-2">
              <table className="w-full text-base">
                <tbody>
                  <tr>
                    <td className="w-[30%] py-0.5">Satuan Pendidikan</td>
                    <td className="w-[2%]">:</td>
                    <td className="w-[68%]">{data.nama_sekolah}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5">Nomor Pokok Sekolah Nasional</td>
                    <td>:</td>
                    <td>{data.npsn}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5">Nama Lengkap</td>
                    <td>:</td>
                    <td>{siswa.nama}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5">Tempat, Tanggal Lahir</td>
                    <td>:</td>
                    <td>{siswa.tempat_lahir}, {getBulanIndo(siswa.tanggal_lahir)}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5">Nomor Induk Siswa Nasional</td>
                    <td>:</td>
                    <td>{siswa.nisn}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5">Nomor Ijazah</td>
                    <td>:</td>
                    <td>{nomorIjazah}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5">Tanggal Kelulusan</td>
                    <td>:</td>
                    <td>{getBulanIndo(data.tanggal_kelulusan)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* TABEL NILAI */}
            <table className="w-full border-collapse border border-black mb-10 text-base">
              <thead>
                <tr>
                  <th className="border border-black py-2 px-3 w-[8%]">No</th>
                  <th className="border border-black py-2 px-4 w-[77%]">Mata Pelajaran</th>
                  <th className="border border-black py-2 px-3 w-[15%]">Nilai</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black py-1 px-3 text-center">1</td>
                  <td className="border border-black py-1 px-4">Pendidikan Agama Islam dan Budi Pekerti</td>
                  <td className="border border-black py-1 px-3 text-center">{formatNilai(getNilai(siswa, "pai"))}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-3 text-center">2</td>
                  <td className="border border-black py-1 px-4">Pendidikan Pancasila</td>
                  <td className="border border-black py-1 px-3 text-center">{formatNilai(getNilai(siswa, "ppkn"))}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-3 text-center">3</td>
                  <td className="border border-black py-1 px-4">Bahasa Indonesia</td>
                  <td className="border border-black py-1 px-3 text-center">{formatNilai(getNilai(siswa, "indo"))}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-3 text-center">4</td>
                  <td className="border border-black py-1 px-4">Matematika</td>
                  <td className="border border-black py-1 px-3 text-center">{formatNilai(getNilai(siswa, "mtk"))}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-3 text-center">5</td>
                  <td className="border border-black py-1 px-4">Ilmu Pengetahuan Alam dan Sosial</td>
                  <td className="border border-black py-1 px-3 text-center">{formatNilai(getNilai(siswa, "ipas"))}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-3 text-center">6</td>
                  <td className="border border-black py-1 px-4">Pendidikan Jasmani Olahraga dan Kesehatan</td>
                  <td className="border border-black py-1 px-3 text-center">{formatNilai(getNilai(siswa, "pjok"))}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-3 text-center">7</td>
                  <td className="border border-black py-1 px-4">Seni Budaya: Seni Rupa</td>
                  <td className="border border-black py-1 px-3 text-center">{formatNilai(getNilai(siswa, "sbdp"))}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-3 text-center">8</td>
                  <td className="border border-black py-1 px-4">Bahasa Inggris</td>
                  <td className="border border-black py-1 px-3 text-center">{formatNilai(getNilai(siswa, "bing"))}</td>
                </tr>
                <tr>
                  <td className="border-r border-black py-1 px-3 text-center">9</td>
                  <td className="border-r border-black py-1 px-4 font-bold">Muatan Lokal:</td>
                  <td className="border-l border-black py-1 px-3"></td>
                </tr>
                <tr>
                  <td className="border-r border-black py-1 px-3"></td>
                  <td className="border-r border-black py-1 pl-8">{data.nama_mulok1}</td>
                  <td className="border-l border-black py-1 px-3 text-center">{formatNilai(getNilai(siswa, "mulok1"))}</td>
                </tr>
                {data.nama_mulok2 && (
                  <tr>
                    <td className="border-r border-black py-1 px-3"></td>
                    <td className="border-r border-black py-1 pl-8">{data.nama_mulok2}</td>
                    <td className="border-l border-black py-1 px-3 text-center">{formatNilai(getNilai(siswa, "mulok2"))}</td>
                  </tr>
                )}
                {data.nama_mulok3 && (
                  <tr>
                    <td className="border-r border-black py-1 px-3"></td>
                    <td className="border-r border-black py-1 pl-8">{data.nama_mulok3}</td>
                    <td className="border-l border-black py-1 px-3 text-center">{formatNilai(getNilai(siswa, "mulok3"))}</td>
                  </tr>
                )}
                <tr>
                  <td className="border-r border-black py-1 px-3"></td>
                  <td className="border-r border-black py-1 pl-8"></td>
                  <td className="border-l border-black py-1 px-3 text-center"></td>
                </tr>
                <tr>
                  <td className="border-r border-b border-black py-1 px-3"></td>
                  <td className="border-r border-b border-black py-1 pl-8"></td>
                  <td className="border-b border-l border-black py-1 px-3 text-center"></td>
                </tr>
                <tr>
                  <td colSpan={2} className="border border-black py-2 px-4 text-center font-bold">Rata - Rata</td>
                  <td className="border border-black py-2 px-3 text-center font-bold">{getRataRata(siswa)}</td>
                </tr>
              </tbody>
            </table>

            {/* FOOTER & TTD */}
            <div className="flex justify-end text-base mr-8">
              <div className="text-left w-[250px]">
                <p className="mb-1">{getAlamatKota(data.alamat_sekolah)}, {getBulanIndo(data.tanggal_kelulusan)}</p>
                <p>Kepala,</p>
                
                <div className="h-24 relative my-2">
                  {data.ttd_url && (
                    <img src={data.ttd_url} alt="TTD" className="absolute top-1/2 left-0 -translate-y-1/2 h-full object-contain z-10" />
                  )}
                  {data.stempel_url && (
                    <img src={data.stempel_url} alt="Stempel" className="absolute top-1/2 left-0 -translate-y-1/2 h-[120%] -translate-x-6 object-contain z-0 mix-blend-multiply opacity-80" />
                  )}
                </div>

                <p className="font-bold underline">{data.nama_kepsek}</p>
                <p>NIP. {data.nip_kepsek || ".........................................."}</p>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}
