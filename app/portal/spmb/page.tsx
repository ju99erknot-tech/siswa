"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Lock, CheckCircle, FileText, UploadCloud, MapPin, 
  Loader2, AlertCircle, Camera, Check, Map, ArrowRight, X, Printer, GraduationCap, Phone
} from "lucide-react";
import { toast } from "sonner";
import { uploadFileToGDrive } from "@/lib/gas";
import { SCHOOL } from "@/lib/school.config";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import QRCode from "react-qr-code";
import { createClient } from "@/lib/supabase/client";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then((m) => m.Polyline), { ssr: false });

const DAFTAR_SMP = [
  { name: "SMPN 1 CIBADAK", lat: -6.894388720473357, lng: 106.79248145534312 },
  { name: "SMPN 2 CIBADAK", lat: -6.893850307860898, lng: 106.78751480921014 },
  { name: "SMPN 3 CIBADAK", lat: -6.897135257945832, lng: 106.81605931054295 },
  { name: "SMPN 4 CIBADAK", lat: -6.900604224137327, lng: 106.72122131119106 },
  { name: "SMPN 1 NAGRAK", lat: -6.877714518674119, lng: 106.79690175351973 },
  { name: "SMPN 1 PARUNGKUDA", lat: -6.839645996028639, lng: 106.761003755368 }
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const FilePreviewThumbnail = ({ file, onRemove, title, isLocked }: { file: File, onRemove: () => void, title: string, isLocked: boolean }) => {
  const [url, setUrl] = useState<string>('');
  
  useEffect(() => {
    if (file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      setUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [file]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center min-h-[140px] rounded-xl overflow-hidden group">
      {file.type.startsWith('image/') ? (
        url ? <img src={url} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" alt="preview" /> : null
      ) : (
        <div className="absolute inset-0 w-full h-full bg-rose-500/10 flex flex-col items-center justify-center">
          <FileText className="text-rose-400 mb-1" size={32} />
          <span className="text-[10px] text-rose-400 font-bold px-4 truncate w-full text-center">{file.name}</span>
        </div>
      )}
      
      <div className="relative z-10 flex flex-col items-center pointer-events-none">
        <Check className="text-emerald-400 mb-1" size={24} />
        <span className="text-xs font-bold text-white bg-black/60 px-3 py-1 rounded-lg backdrop-blur-md border border-white/10">{title} Dipilih</span>
      </div>

      {!isLocked && (
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shadow-lg hover:scale-110 z-20"
        >
          <X size={16} strokeWidth={3} />
        </button>
      )}
    </div>
  );
};

export default function PortalSpmb() {
  const [pengaturan, setPengaturan] = useState<any>(null);

  useEffect(() => {
    const fetchPengaturan = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('pengaturan').select('*').single();
      if (data) setPengaturan(data);
    };
    fetchPengaturan();
  }, []);
  
  // Step State
  const [step, setStep] = useState<"search" | "form">("search");
  
  // Search Form
  const [searchNisn, setSearchNisn] = useState("");
  const [searchTglLahir, setSearchTglLahir] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Data State
  const [dataSiswa, setDataSiswa] = useState<any>(null);
  const [dataSpmb, setDataSpmb] = useState<any>(null);

  // Form State
  const [jalur, setJalur] = useState("");
  const [lintang, setLintang] = useState("");
  const [bujur, setBujur] = useState("");
  const [sekolah1, setSekolah1] = useState("");
  const [sekolah2, setSekolah2] = useState("");
  const [noWa, setNoWa] = useState("");
  const [fileKtpAyah, setFileKtpAyah] = useState<File | null>(null);
  const [fileKtpIbu, setFileKtpIbu] = useState<File | null>(null);
  const [fileKk, setFileKk] = useState<File | null>(null);
  const [fileAkta, setFileAkta] = useState<File | null>(null);
  const [filePendukung, setFilePendukung] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [mapMountId, setMapMountId] = useState(0);

  // Upload Modal State
  type DocType = "ktpAyah" | "ktpIbu" | "kk" | "akta" | "pendukung";
  const [activeDocType, setActiveDocType] = useState<DocType | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMapMountId(Date.now());
  }, []);

  // Auto-bypass login when coming from kelulusan portal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");
    const nisn = params.get("nisn");
    const tgl = params.get("tgl");
    if (from !== "kelulusan" || !nisn || !tgl) return;
    
    // Clean URL immediately
    window.history.replaceState({}, "", "/portal/spmb");
    
    setSearchNisn(nisn);
    setSearchTglLahir(tgl);
    setIsSearching(true);

    (async () => {
      try {
        const res = await fetch("/api/spmb/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nisn, tgl_lahir: tgl }),
        });

        const text = await res.text();
        let json: any;
        try { json = JSON.parse(text); } catch { 
          throw new Error("Server error, silakan coba login manual"); 
        }

        if (!res.ok) throw new Error(json.error || "Gagal verifikasi");

        setDataSiswa(json.siswa);
        setDataSpmb(json.spmb || null);
        if (json.spmb) {
          setLintang(json.spmb.lintang || "");
          setBujur(json.spmb.bujur || "");
          setSekolah1(json.spmb.sekolah_tujuan_1 || "");
          setSekolah2(json.spmb.sekolah_tujuan_2 || "");
          if (json.spmb.jalur_pendaftaran) setJalur(json.spmb.jalur_pendaftaran);
        }
        if (json.siswa.no_wa) setNoWa(json.siswa.no_wa);
        setStep("form");
        toast.success(`Selamat datang dari portal kelulusan, ${json.siswa.nama.split(" ")[0]}! 🎓`);
      } catch (e: any) {
        toast.error(e.message || "Gagal bypass, silakan login manual");
      } finally {
        setIsSearching(false);
      }
    })();
  }, []);

  const openUploadModal = (type: DocType) => {
    setActiveDocType(type);
    setPreviewFile(null);
    setPreviewUrl(null);
  };

  const closeUploadModal = () => {
    setActiveDocType(null);
    setPreviewFile(null);
    if (previewUrl && previewUrl !== 'pdf') URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      e.target.value = ''; // Reset
      return;
    }
    setPreviewFile(file);
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl('pdf');
    }
    e.target.value = ''; // Reset agar bisa pilih file yang sama
  };

  const confirmUpload = () => {
    if (!activeDocType || !previewFile) return;
    if (activeDocType === "ktpAyah") setFileKtpAyah(previewFile);
    if (activeDocType === "ktpIbu") setFileKtpIbu(previewFile);
    if (activeDocType === "kk") setFileKk(previewFile);
    if (activeDocType === "akta") setFileAkta(previewFile);
    if (activeDocType === "pendukung") setFilePendukung(previewFile);
    closeUploadModal();
  };

  const getIcons = () => {
    if (typeof window === "undefined") return { homeIcon: null, smpIcon: null };
    const L = require("leaflet");
    const homeIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    });
    const smpIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    });
    return { homeIcon, smpIcon };
  };
  const { homeIcon, smpIcon } = getIcons();

  const latNum = parseFloat(lintang);
  const lngNum = parseFloat(bujur);
  const isValidCoord = !isNaN(latNum) && !isNaN(lngNum) && latNum !== 0;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchNisn || !searchTglLahir) {
      toast.error("Silakan lengkapi NISN dan Tanggal Lahir");
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch("/api/spmb/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nisn: searchNisn, tgl_lahir: searchTglLahir })
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mencari data");

      setDataSiswa(json.siswa);
      setDataSpmb(json.spmb || null);
      
      // Populate existing data if any
      if (json.spmb) {
        setLintang(json.spmb.lintang || "");
        setBujur(json.spmb.bujur || "");
        setSekolah1(json.spmb.sekolah_tujuan_1 || "");
        setSekolah2(json.spmb.sekolah_tujuan_2 || "");
        if (json.spmb.jalur_pendaftaran) setJalur(json.spmb.jalur_pendaftaran);
      }
      if (json.siswa.no_wa) setNoWa(json.siswa.no_wa);
      
      setStep("form");
      toast.success(`Data ditemukan! Halo, ${json.siswa.nama.split(' ')[0]} 👋`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Browser Anda tidak mendukung fitur lokasi GPS.");
      return;
    }
    
    setIsLocating(true);
    const toastId = toast.loading("Mencari lokasi Anda, pastikan Anda sedang berada di rumah...");
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLintang(position.coords.latitude.toString());
        setBujur(position.coords.longitude.toString());
        toast.success("Titik koordinat berhasil didapatkan!", { id: toastId });
        setIsLocating(false);
      },
      (error) => {
        console.error(error);
        toast.error("Gagal mendapatkan lokasi. Pastikan GPS HP Anda aktif dan Anda mengizinkan akses lokasi di browser.", { id: toastId });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSubmit = async () => {
    if (!lintang || !bujur) {
      toast.error("Titik koordinat (Lintang & Bujur) wajib diisi");
      return;
    }

    // Validasi file yang wajib jika belum ada di database
    const hasKk = dataSiswa?.url_kk || fileKk;
    const hasAkta = dataSiswa?.url_akta || fileAkta;
    const hasKtpAyah = dataSpmb?.url_ktp_ayah || fileKtpAyah;
    const hasKtpIbu = dataSpmb?.url_ktp_ibu || fileKtpIbu;
    const hasPendukung = dataSpmb?.url_dokumen_pendukung || filePendukung;

    if (!hasKk || !hasAkta) {
      toast.error("Mohon lengkapi foto KK dan Akta");
      return;
    }

    if (!jalur) {
      toast.error("Silakan pilih Jalur SPMB terlebih dahulu!");
      return;
    }

    if (!hasPendukung) {
      toast.error(`Anda memilih Jalur ${jalur}. Wajib melampirkan syarat khusus (${jalur === 'Zonasi' ? 'Foto Depan Rumah' : 'Dokumen Pendukung'})!`);
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Memproses dokumen Anda, mohon tunggu...");

    try {
      // 1. Upload files to GDrive concurrently
      const uploadPromises = [];
      const nisn = dataSiswa.nisn;

      let url_ktp_ayah = dataSpmb?.url_ktp_ayah;
      let url_ktp_ibu = dataSpmb?.url_ktp_ibu;
      let url_kk = dataSiswa?.url_kk;
      let url_akta = dataSiswa?.url_akta;
      let url_dokumen_pendukung = dataSpmb?.url_dokumen_pendukung;

      const folderName = `[${dataSiswa.nisn}] - ${dataSiswa.nama}`;

      if (fileKtpAyah) {
        uploadPromises.push(
          uploadFileToGDrive(fileKtpAyah, `SPMB_KTPAYAH_${nisn}`, folderName).then(url => { url_ktp_ayah = url })
        );
      }
      if (fileKtpIbu) {
        uploadPromises.push(
          uploadFileToGDrive(fileKtpIbu, `SPMB_KTPIBU_${nisn}`, folderName).then(url => { url_ktp_ibu = url })
        );
      }
      if (fileKk) {
        uploadPromises.push(
          uploadFileToGDrive(fileKk, `SPMB_KK_${nisn}`, folderName).then(url => { url_kk = url })
        );
      }
      if (fileAkta) {
        uploadPromises.push(
          uploadFileToGDrive(fileAkta, `SPMB_AKTA_${nisn}`, folderName).then(url => { url_akta = url })
        );
      }
      if (filePendukung) {
        uploadPromises.push(
          uploadFileToGDrive(filePendukung, `SPMB_PENDUKUNG_${jalur}_${nisn}`, folderName).then(url => { url_dokumen_pendukung = url })
        );
      }

      await Promise.all(uploadPromises);

      // 2. Submit to API
      const res = await fetch("/api/spmb/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siswa_id: dataSiswa.id,
          jalur_pendaftaran: jalur,
          lintang,
          bujur,
          url_ktp_ayah,
          url_ktp_ibu,
          url_kk,
          url_akta,
          url_dokumen_pendukung,
          sekolah_tujuan_1: sekolah1,
          sekolah_tujuan_2: sekolah2,
          no_wa: noWa
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      // Update local state to reflect changes
      setDataSpmb({ 
        ...dataSpmb, 
        status: "Menunggu Verifikasi", 
        jalur_pendaftaran: jalur,
        lintang, bujur, url_ktp_ayah, url_ktp_ibu, url_dokumen_pendukung,
        sekolah_tujuan_1: sekolah1, sekolah_tujuan_2: sekolah2
      });
      setDataSiswa({ ...dataSiswa, url_kk, url_akta });
      
      setFileKtpAyah(null);
      setFileKtpIbu(null);
      setFileKk(null);
      setFileAkta(null);
      setFilePendukung(null);

      toast.success("Berhasil! Data Anda sedang diverifikasi oleh Guru.", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirim data", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLocked = dataSpmb?.status === "Menunggu Verifikasi" || dataSpmb?.status === "Valid & Lengkap" || dataSpmb?.status === "Didaftarkan" || dataSpmb?.status === "Selesai";

  return (
    <>
    {/* === SCREEN LAYOUT === */}
    <div className="min-h-screen w-full relative flex flex-col items-center p-4 py-6 selection:bg-cyan-500/30 overflow-x-hidden print:hidden"
      style={{
        background: 'linear-gradient(135deg, #050812 0%, #0a1128 50%, #050812 100%)',
      }}
    >
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)' }} />

      <AnimatePresence mode="wait">
        {step === "search" ? (
          <motion.div
            key="search"
            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-md my-auto relative z-10"
          >
            {/* Premium Card Container */}
            <div 
              className="relative p-8 sm:p-10 rounded-[2.5rem] overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                backdropFilter: 'blur(40px)'
              }}
            >
              {/* Inner ambient glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-[50px] pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-[50px] pointer-events-none" />

              <div className="relative z-10 text-center mb-10">
                <motion.div 
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                  <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-3xl shadow-xl shadow-cyan-500/20 border border-white/20">
                    <GraduationCap className="w-10 h-10 text-white drop-shadow-md" />
                  </div>
                </motion.div>
                
                <motion.h1 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40 mb-2 tracking-tight"
                >
                  SPMB SMP
                </motion.h1>
                <motion.p 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs font-bold text-cyan-400 uppercase tracking-[0.2em] mb-4"
                >
                  {pengaturan?.nama_sekolah || SCHOOL.nama}
                </motion.p>
                <motion.p 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm text-white/40 leading-relaxed"
                >
                  Masukkan NISN dan Tanggal Lahir untuk memverifikasi data dan melengkapi berkas pendaftaran.
                </motion.p>
              </div>

              <motion.form 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                onSubmit={handleSearch} 
                className="space-y-5 relative z-10"
              >
                {/* NISN Input */}
                <div className="space-y-2 group">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1 group-focus-within:text-cyan-400 transition-colors">NISN</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type="text"
                      required
                      value={searchNisn}
                      onChange={(e) => setSearchNisn(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 rounded-2xl text-sm font-medium text-white outline-none transition-all placeholder:text-white/20 focus:ring-2 focus:ring-cyan-500/30"
                      style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)' }}
                      placeholder="Contoh: 0123456789"
                    />
                  </div>
                </div>

                {/* TGL LAHIR Input */}
                <div className="space-y-2 group">
                  <div className="flex items-center justify-between pl-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest group-focus-within:text-cyan-400 transition-colors">Tanggal Lahir</label>
                    <span className="text-[9px] text-white/20 italic">Bulan / Tanggal / Tahun</span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type="date"
                      required
                      lang="id-ID"
                      value={searchTglLahir}
                      onChange={(e) => setSearchTglLahir(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 rounded-2xl text-sm font-medium text-white outline-none transition-all [color-scheme:dark] focus:ring-2 focus:ring-cyan-500/30"
                      style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full h-14 mt-8 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 relative overflow-hidden group hover:-translate-y-1 active:translate-y-0"
                  style={{ 
                    background: 'linear-gradient(135deg, #06b6d4, #2563eb)',
                    boxShadow: '0 10px 25px -5px rgba(6,182,212,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                  }}
                >
                  <div className="absolute inset-0 w-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[50%] transition-transform duration-1000 ease-in-out" />
                  {isSearching ? <Loader2 className="w-5 h-5 animate-spin relative z-10" /> : <><span className="relative z-10 drop-shadow-md">Masuk Portal SPMB</span> <ArrowRight size={18} className="relative z-10 drop-shadow-md group-hover:translate-x-1 transition-transform" /></>}
                </button>
              </motion.form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-6xl mt-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* LEFT COLUMN: PROFILE SIDEBAR (Sticky) */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-10">
              <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]" style={{ background: 'linear-gradient(145deg, #090e1a 0%, #050812 100%)' }}>
                
                {/* Photo Design */}
                <div className="w-full aspect-[4/3] sm:aspect-video lg:aspect-square bg-black/50 relative group">
                  {dataSiswa?.foto_url ? (
                    <img src={dataSiswa.foto_url} alt="Foto Siswa" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-cyan-900/30 flex items-center justify-center">
                      <span className="text-6xl font-black text-cyan-500/50">{dataSiswa?.nama?.charAt(0) || "S"}</span>
                    </div>
                  )}
                  
                  {/* Gradient Overlay for Text Visibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090e1a] via-[#090e1a]/40 to-transparent opacity-90" />
                  
                  <div className="absolute bottom-0 left-0 w-full p-6 pb-4">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-3 shadow-lg">
                       <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                       <span className="text-[10px] font-bold text-white uppercase tracking-widest">SPMB Aktif</span>
                     </div>
                     <h2 className="text-2xl font-black text-white mb-1 leading-tight drop-shadow-md">
                       {dataSiswa?.nama}
                     </h2>
                     <div className="flex items-center gap-2 text-sm text-cyan-300 font-bold drop-shadow-md">
                       <Lock size={14} /> NISN: {dataSiswa?.nisn}
                     </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <span className="text-xs text-white/50 font-bold uppercase tracking-widest flex items-center gap-2"><CheckCircle size={14} className="text-violet-400"/> Kelas</span>
                    <span className="text-sm font-bold text-white bg-white/5 px-3 py-1 rounded-lg">{dataSiswa?.kelas || "VI"}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <span className="text-xs text-white/50 font-bold uppercase tracking-widest flex items-center gap-2"><CheckCircle size={14} className="text-blue-400"/> Kelamin</span>
                    <span className="text-sm font-bold text-white bg-white/5 px-3 py-1 rounded-lg">{dataSiswa?.jk === 'P' ? 'Perempuan' : 'Laki-laki'}</span>
                  </div>

                  {/* ⏳ Status Tracker (Resi Kurir Style) */}
                  {(() => {
                    const statusSteps = [
                      { key: "submitted", label: "Berkas Disubmit", desc: "Berkas berhasil dikirim" },
                      { key: "verifying", label: "Sedang Diverifikasi", desc: "Dicek oleh panitia SPMB" },
                      { key: "valid", label: "Valid & Lengkap", desc: "Semua berkas sudah sesuai" },
                      { key: "registered", label: "Resmi Didaftarkan", desc: "Terdaftar di SMP Tujuan" },
                    ];

                    const currentStatus = dataSpmb?.status || "";
                    const isRejected = currentStatus === "Berkas Ditolak" || currentStatus === "Perlu Perbaikan";
                    
                    let activeIndex = -1;
                    if (!currentStatus || currentStatus === "Belum Mengisi") activeIndex = -1;
                    else if (currentStatus === "Menunggu Verifikasi") activeIndex = 0;
                    else if (currentStatus === "Sedang Diverifikasi") activeIndex = 1;
                    else if (currentStatus === "Valid & Lengkap") activeIndex = 2;
                    else if (currentStatus === "Didaftarkan" || currentStatus === "Selesai") activeIndex = 3;
                    else if (isRejected) activeIndex = 0; // show at step 1 but with error styling

                    return (
                      <div className="mt-6 w-full">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Status Pendaftaran</div>
                          {isRejected && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[9px] font-bold uppercase tracking-wider animate-pulse">Perlu Perbaikan</span>
                          )}
                        </div>

                        {/* Timeline Steps */}
                        <div className="space-y-0">
                          {statusSteps.map((step, i) => {
                            const isCompleted = i < activeIndex || (i === activeIndex && (currentStatus === "Didaftarkan" || currentStatus === "Selesai" || currentStatus === "Valid & Lengkap"));
                            const isActive = i === activeIndex && !isCompleted;
                            const isPending = i > activeIndex;
                            const isErrorStep = isRejected && i === 0;

                            return (
                              <div key={step.key} className="flex items-stretch gap-3">
                                {/* Dot + Line */}
                                <div className="flex flex-col items-center w-6 shrink-0">
                                  {/* Dot */}
                                  <div className={`relative w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                                    isErrorStep
                                      ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                                      : isCompleted
                                        ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                                        : isActive
                                          ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                                          : 'bg-white/10 border border-white/10'
                                  }`}>
                                    {isErrorStep ? (
                                      <X size={10} className="text-white" />
                                    ) : isCompleted ? (
                                      <Check size={10} className="text-white" />
                                    ) : isActive ? (
                                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                    ) : null}
                                    {isActive && !isErrorStep && (
                                      <div className="absolute inset-0 rounded-full bg-cyan-500/40 animate-ping" />
                                    )}
                                  </div>
                                  {/* Connector Line */}
                                  {i < statusSteps.length - 1 && (
                                    <div className={`w-0.5 flex-1 min-h-[20px] transition-all duration-500 ${
                                      isCompleted ? 'bg-emerald-500/50' : 'bg-white/5'
                                    }`} />
                                  )}
                                </div>
                                {/* Text */}
                                <div className={`pb-5 ${i === statusSteps.length - 1 ? 'pb-0' : ''}`}>
                                  <p className={`text-xs font-bold transition-colors ${
                                    isErrorStep ? 'text-red-400' : isCompleted ? 'text-emerald-400' : isActive ? 'text-cyan-400' : 'text-white/20'
                                  }`}>
                                    {isErrorStep ? (currentStatus) : step.label}
                                  </p>
                                  <p className={`text-[10px] leading-snug mt-0.5 ${
                                    isErrorStep ? 'text-red-400/60' : isCompleted || isActive ? 'text-white/40' : 'text-white/15'
                                  }`}>
                                    {isErrorStep ? "Ada berkas yang perlu diperbaiki" : step.desc}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Catatan Guru (if rejected/perbaikan) */}
                        {dataSpmb?.catatan_guru && (
                          <div className={`mt-4 p-4 rounded-xl text-xs leading-relaxed border ${
                            isRejected 
                              ? 'bg-red-500/5 border-red-500/20 text-red-300' 
                              : 'bg-white/5 border-white/10 text-white/60'
                          }`}>
                            <span className="font-bold block mb-1 text-[10px] uppercase tracking-wider opacity-70">💬 Catatan Panitia</span>
                            {dataSpmb.catatan_guru}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {isLocked && (
                    <button onClick={() => window.print()} className="w-full mt-4 py-3.5 rounded-xl text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-2">
                      <Printer size={18} /> Cetak Bukti Pendaftaran
                    </button>
                  )}

                  <button onClick={() => setStep("search")} className="w-full mt-2 py-3.5 rounded-xl text-xs font-bold text-white/60 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 transition-all border border-white/5 flex items-center justify-center gap-2">
                    <Lock size={14} /> Keluar / Ganti Akun
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: FORMS */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* SECTION 1: Jalur SPMB */}
              <div className="p-6 md:p-8 rounded-[2rem]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                <div className="mb-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-2">
                    <FileText className="text-cyan-400" size={18} /> Pilihan Jalur SPMB 2026
                  </h3>
                  <p className="text-xs text-white/50 leading-relaxed">Pilih salah satu jalur pendaftaran yang paling sesuai dengan kriteria Ananda. Harap dibaca dengan teliti karena setiap jalur memiliki syarat dokumen yang berbeda.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card: Zonasi */}
                  <label className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    jalur === 'Zonasi' 
                      ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
                      : 'bg-black/20 border-white/5 hover:border-white/20'
                  }`}>
                    <input type="radio" name="jalur" value="Zonasi" checked={jalur === 'Zonasi'} onChange={(e) => !isLocked && setJalur(e.target.value)} disabled={isLocked} className="hidden" />
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-xl ${jalur === 'Zonasi' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40'}`}>
                        <MapPin size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Jalur Domisili (Zonasi)</h4>
                        <span className="text-[10px] text-blue-400 font-bold">Kuota: minimal 40%</span>
                      </div>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed mb-3">
                      Seleksi murni berdasarkan <strong>jarak tarik lurus terdekat</strong> dari rumah ke sekolah. 
                    </p>
                    <div className="bg-blue-500/10 border border-blue-500/30 p-2.5 rounded-lg text-[10px] text-blue-300 font-medium leading-relaxed">
                      <strong className="text-blue-400">INFO PENTING:</strong> Batas jarak aman (*passing grade*) selalu berubah setiap tahun tergantung kepadatan pendaftar di sekitar sekolah. Pendaftar dengan jarak yang lebih dekat akan otomatis menggeser yang lebih jauh!
                    </div>
                  </label>

                  {/* Card: Prestasi */}
                  <label className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    jalur === 'Prestasi' 
                      ? 'bg-yellow-500/10 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]' 
                      : 'bg-black/20 border-white/5 hover:border-white/20'
                  }`}>
                    <input type="radio" name="jalur" value="Prestasi" checked={jalur === 'Prestasi'} onChange={(e) => !isLocked && setJalur(e.target.value)} disabled={isLocked} className="hidden" />
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-xl ${jalur === 'Prestasi' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/40'}`}>
                        <CheckCircle size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Jalur Prestasi</h4>
                        <span className="text-[10px] text-yellow-400 font-bold">Kuota: minimal 25%</span>
                      </div>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed mb-3">
                      Berdasarkan prestasi akademik (rata-rata rapor) dan non-akademik (sertifikat lomba). Tidak terikat oleh jarak rumah (zonasi).
                    </p>
                    <div className="bg-red-500/20 border border-red-500/30 p-2.5 rounded-lg text-[10px] text-red-300 font-medium leading-relaxed">
                      <strong className="text-red-400">PERHATIAN:</strong> Jalur ini <strong>BUKAN</strong> untuk siswa biasa. Pendaftar <strong>wajib</strong> membawa bukti fisik Sertifikat Lomba (Min. Tingkat Kabupaten) atau Nilai Rapor sangat tinggi saat verifikasi ke sekolah. Jika terbukti memalsukan, langsung digugurkan!
                    </div>
                  </label>

                  {/* Card: Afirmasi */}
                  <label className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    jalur === 'Afirmasi' 
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                      : 'bg-black/20 border-white/5 hover:border-white/20'
                  }`}>
                    <input type="radio" name="jalur" value="Afirmasi" checked={jalur === 'Afirmasi'} onChange={(e) => !isLocked && setJalur(e.target.value)} disabled={isLocked} className="hidden" />
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-xl ${jalur === 'Afirmasi' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40'}`}>
                        <FileText size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Jalur Afirmasi</h4>
                        <span className="text-[10px] text-emerald-400 font-bold">Kuota: minimal 20%</span>
                      </div>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Khusus bagi calon murid dari keluarga ekonomi tidak mampu (dibuktikan dengan kepemilikan <strong>KIP / KPS / KKS</strong>) atau penyandang disabilitas.
                    </p>
                  </label>

                  {/* Card: Mutasi */}
                  <label className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    jalur === 'Mutasi' 
                      ? 'bg-violet-500/10 border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.2)]' 
                      : 'bg-black/20 border-white/5 hover:border-white/20'
                  }`}>
                    <input type="radio" name="jalur" value="Mutasi" checked={jalur === 'Mutasi'} onChange={(e) => !isLocked && setJalur(e.target.value)} disabled={isLocked} className="hidden" />
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-xl ${jalur === 'Mutasi' ? 'bg-violet-500/20 text-violet-400' : 'bg-white/5 text-white/40'}`}>
                        <AlertCircle size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Jalur Mutasi</h4>
                        <span className="text-[10px] text-violet-400 font-bold">Kuota: maksimal 5%</span>
                      </div>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Diperuntukkan khusus bagi perpindahan tugas orang tua/wali (dibuktikan dengan Surat Pindah Tugas dari instansi) atau Anak Guru.
                    </p>
                  </label>
                </div>
              </div>

              {/* SECTION 1.5: Kontak */}
              <div className="p-6 md:p-8 rounded-[2rem] mb-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Phone className="text-emerald-400" size={18} /> Kontak yang Bisa Dihubungi
                </h3>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Nomor WhatsApp Aktif</label>
                  <input
                    type="tel"
                    disabled={isLocked}
                    required
                    value={noWa}
                    onChange={(e) => setNoWa(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full h-12 px-4 rounded-xl text-sm text-white outline-none disabled:opacity-50"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                </div>
              </div>

              {/* SECTION 2: Titik Koordinat */}
              <div className="p-6 md:p-8 rounded-[2rem]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="text-cyan-400" size={18} /> Koordinat Zonasi
                  </h3>
                </div>
                <p className="text-xs text-yellow-400/80 mb-6 leading-relaxed font-medium bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20 flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  Penting: Pastikan Anda menekan tombol "Ambil Titik Saat Ini" HANYA ketika Anda sedang berada di rumah/domisili yang sebenarnya. Izinkan (Allow) akses lokasi jika muncul peringatan dari browser.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Garis Lintang (Latitude)</label>
                    <input
                      type="text"
                      disabled={isLocked}
                      value={lintang}
                      onChange={(e) => setLintang(e.target.value)}
                      placeholder="Contoh: -6.903423"
                      className="w-full h-12 px-4 rounded-xl text-sm text-white outline-none disabled:opacity-50"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Garis Bujur (Longitude)</label>
                    <input
                      type="text"
                      disabled={isLocked}
                      value={bujur}
                      onChange={(e) => setBujur(e.target.value)}
                      placeholder="Contoh: 107.618790"
                      className="w-full h-12 px-4 rounded-xl text-sm text-white outline-none disabled:opacity-50"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  </div>
                </div>

                {!isLocked && (
                  <button
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/40 transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)] disabled:opacity-50"
                  >
                    {isLocating ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                    Ambil Titik Lokasi Rumah Saya (GPS)
                  </button>
                )}
              </div>

              {/* SECTION 2: Pilihan Sekolah & Jarak Zonasi */}
              <div className="p-6 rounded-3xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Map className="text-violet-400" size={18} /> Pilihan Sekolah Tujuan
                </h3>
                <p className="text-xs text-white/40 mb-6 leading-relaxed">
                  Pilih SMP Negeri tujuan Anda. Jarak tarik lurus (zonasi) dari koordinat rumah Anda ke sekolah akan dihitung otomatis.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pilihan 1 */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Pilihan 1</label>
                    <select
                      disabled={isLocked}
                      value={sekolah1}
                      onChange={(e) => setSekolah1(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl text-sm text-white outline-none appearance-none disabled:opacity-50"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <option value="">-- Pilih SMP Tujuan 1 --</option>
                      {DAFTAR_SMP.map(smp => <option key={smp.name} value={smp.name}>{smp.name}</option>)}
                    </select>
                    {sekolah1 && lintang && bujur && !isNaN(Number(lintang)) && !isNaN(Number(bujur)) && (
                      <div className="mt-2 flex items-center gap-2 text-xs font-bold text-violet-400 bg-violet-500/10 p-2 rounded-lg border border-violet-500/20">
                        <MapPin size={14} /> Jarak Zonasi: 
                        {(() => {
                          const target = DAFTAR_SMP.find(s => s.name === sekolah1);
                          if (!target) return "-";
                          const dist = calculateDistance(Number(lintang), Number(bujur), target.lat, target.lng);
                          return ` ${dist.toFixed(2)} KM`;
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Pilihan 2 */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Pilihan 2 (Opsional)</label>
                    <select
                      disabled={isLocked}
                      value={sekolah2}
                      onChange={(e) => setSekolah2(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl text-sm text-white outline-none appearance-none disabled:opacity-50"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <option value="">-- Pilih SMP Tujuan 2 --</option>
                      {DAFTAR_SMP.map(smp => <option key={smp.name} value={smp.name}>{smp.name}</option>)}
                    </select>
                    {sekolah2 && lintang && bujur && !isNaN(Number(lintang)) && !isNaN(Number(bujur)) && (
                      <div className="mt-2 flex items-center gap-2 text-xs font-bold text-violet-400 bg-violet-500/10 p-2 rounded-lg border border-violet-500/20">
                        <MapPin size={14} /> Jarak Zonasi: 
                        {(() => {
                          const target = DAFTAR_SMP.find(s => s.name === sekolah2);
                          if (!target) return "-";
                          const dist = calculateDistance(Number(lintang), Number(bujur), target.lat, target.lng);
                          return ` ${dist.toFixed(2)} KM`;
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Peta Interaktif */}
                  <div className="md:col-span-2 mt-4">
                    {isValidCoord && mapMountId > 0 ? (
                      <div key={mapMountId} className="h-[400px] w-full rounded-2xl overflow-hidden border border-white/10 relative z-0" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                        <MapContainer
                          center={[latNum, lngNum]}
                          zoom={14}
                          scrollWheelZoom={false}
                          className="h-full w-full"
                          style={{ background: '#0e1520' }}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          
                          {/* Marker Rumah */}
                          {homeIcon && (
                            <Marker position={[latNum, lngNum]} icon={homeIcon}>
                              <Popup>
                                <div className="font-bold">📍 Rumah {dataSiswa?.nama}</div>
                                <div className="text-xs text-gray-500">Titik Awal Zonasi</div>
                              </Popup>
                            </Marker>
                          )}
                          
                          {/* Marker SMP 1 */}
                          {sekolah1 && smpIcon && (() => {
                            const target = DAFTAR_SMP.find(s => s.name === sekolah1);
                            if (!target) return null;
                            const dist = calculateDistance(latNum, lngNum, target.lat, target.lng);
                            return (
                              <>
                                <Marker position={[target.lat, target.lng]} icon={smpIcon}>
                                  <Popup>
                                    <div className="font-bold text-emerald-600">🏫 {target.name}</div>
                                    <div className="text-xs text-gray-500">Pilihan Pertama</div>
                                    <div className="text-[10px] mt-1 font-bold">Jarak: {dist.toFixed(2)} KM</div>
                                  </Popup>
                                </Marker>
                                <Polyline
                                  positions={[[latNum, lngNum], [target.lat, target.lng]]}
                                  pathOptions={{ color: "#10b981", weight: 3, dashArray: "10, 10" }}
                                />
                              </>
                            );
                          })()}

                          {/* Marker SMP 2 */}
                          {sekolah2 && smpIcon && (() => {
                            const target = DAFTAR_SMP.find(s => s.name === sekolah2);
                            if (!target) return null;
                            const dist = calculateDistance(latNum, lngNum, target.lat, target.lng);
                            return (
                              <>
                                <Marker position={[target.lat, target.lng]} icon={smpIcon}>
                                  <Popup>
                                    <div className="font-bold text-blue-600">🏫 {target.name}</div>
                                    <div className="text-xs text-gray-500">Pilihan Kedua</div>
                                    <div className="text-[10px] mt-1 font-bold">Jarak: {dist.toFixed(2)} KM</div>
                                  </Popup>
                                </Marker>
                                <Polyline
                                  positions={[[latNum, lngNum], [target.lat, target.lng]]}
                                  pathOptions={{ color: "#3b82f6", weight: 2, dashArray: "5, 5" }}
                                />
                              </>
                            );
                          })()}
                        </MapContainer>
                      </div>
                    ) : (
                      <div className="h-[200px] w-full rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-white/30 bg-black/20">
                        <Map size={32} className="mb-2 opacity-50" />
                        <span className="text-xs font-medium">Ambil Titik Koordinat Terlebih Dahulu Untuk Menampilkan Peta</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 3: Dokumen */}
              <div className="p-6 rounded-3xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                  <UploadCloud className="text-emerald-400" size={18} /> Unggah Berkas
                </h3>
                <p className="text-xs text-white/40 mb-6 leading-relaxed">
                  Unggah foto dokumen asli dengan jelas (tidak terpotong dan tulisan terbaca). Maksimal ukuran file 5MB.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Item: KTP Ayah */}
                  <div className="p-4 rounded-2xl border border-dashed border-white/10 bg-black/20 flex flex-col items-center justify-center text-center transition-all hover:border-emerald-500/30 overflow-hidden relative min-h-[140px]">
                    {dataSpmb?.url_ktp_ayah && !fileKtpAyah ? (
                      <div className="flex flex-col items-center relative z-10">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2"><Check size={20} /></div>
                        <span className="text-xs font-bold text-emerald-400">KTP Ayah Tersimpan</span>
                        {!isLocked && <button onClick={() => openUploadModal("ktpAyah")} className="text-[10px] text-white/40 hover:text-white mt-2 underline">Ganti Foto Baru</button>}
                      </div>
                    ) : fileKtpAyah ? (
                      <FilePreviewThumbnail file={fileKtpAyah} title="KTP Ayah" onRemove={() => setFileKtpAyah(null)} isLocked={isLocked} />
                    ) : (
                      <div className="flex flex-col items-center relative z-10">
                        <Camera className="w-8 h-8 mb-2 text-white/20" />
                        <span className="text-xs font-bold text-white/80">Upload KTP Ayah</span>
                        {!isLocked && (
                          <button onClick={() => openUploadModal("ktpAyah")} className="mt-3 px-4 py-1.5 rounded-lg text-[10px] font-bold bg-white/5 text-white/70 hover:bg-white/10 border border-white/5 transition-all">
                            Pilih File
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Item: KTP Ibu */}
                  <div className="p-4 rounded-2xl border border-dashed border-white/10 bg-black/20 flex flex-col items-center justify-center text-center transition-all hover:border-emerald-500/30 overflow-hidden relative min-h-[140px]">
                    {dataSpmb?.url_ktp_ibu && !fileKtpIbu ? (
                      <div className="flex flex-col items-center relative z-10">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2"><Check size={20} /></div>
                        <span className="text-xs font-bold text-emerald-400">KTP Ibu Tersimpan</span>
                        {!isLocked && <button onClick={() => openUploadModal("ktpIbu")} className="text-[10px] text-white/40 hover:text-white mt-2 underline">Ganti Foto Baru</button>}
                      </div>
                    ) : fileKtpIbu ? (
                      <FilePreviewThumbnail file={fileKtpIbu} title="KTP Ibu" onRemove={() => setFileKtpIbu(null)} isLocked={isLocked} />
                    ) : (
                      <div className="flex flex-col items-center relative z-10">
                        <Camera className="w-8 h-8 mb-2 text-white/20" />
                        <span className="text-xs font-bold text-white/80">Upload KTP Ibu</span>
                        {!isLocked && (
                          <button onClick={() => openUploadModal("ktpIbu")} className="mt-3 px-4 py-1.5 rounded-lg text-[10px] font-bold bg-white/5 text-white/70 hover:bg-white/10 border border-white/5 transition-all">
                            Pilih File
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Item: KK */}
                  <div className="p-4 rounded-2xl border border-dashed border-white/10 bg-black/20 flex flex-col items-center justify-center text-center transition-all hover:border-emerald-500/30 overflow-hidden relative min-h-[140px]">
                    {dataSiswa?.url_kk && !fileKk ? (
                      <div className="flex flex-col items-center relative z-10">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2"><Check size={20} /></div>
                        <span className="text-xs font-bold text-cyan-400">KK Tersimpan di Buku Induk</span>
                        {!isLocked && <button onClick={() => openUploadModal("kk")} className="text-[10px] text-white/40 hover:text-white mt-2 underline">Ganti jika ada yang baru</button>}
                      </div>
                    ) : fileKk ? (
                      <FilePreviewThumbnail file={fileKk} title="Kartu Keluarga" onRemove={() => setFileKk(null)} isLocked={isLocked} />
                    ) : (
                      <div className="flex flex-col items-center relative z-10">
                        <Camera className="w-8 h-8 mb-2 text-white/20" />
                        <span className="text-xs font-bold text-white/80">Upload Kartu Keluarga</span>
                        {!isLocked && (
                          <button onClick={() => openUploadModal("kk")} className="mt-3 px-4 py-1.5 rounded-lg text-[10px] font-bold bg-white/5 text-white/70 hover:bg-white/10 border border-white/5 transition-all">
                            Pilih File
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Item: Akta */}
                  <div className="p-4 rounded-2xl border border-dashed border-white/10 bg-black/20 flex flex-col items-center justify-center text-center transition-all hover:border-emerald-500/30 overflow-hidden relative min-h-[140px]">
                    {dataSiswa?.url_akta && !fileAkta ? (
                      <div className="flex flex-col items-center relative z-10">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2"><Check size={20} /></div>
                        <span className="text-xs font-bold text-cyan-400">Akta Tersimpan di Buku Induk</span>
                        {!isLocked && <button onClick={() => openUploadModal("akta")} className="text-[10px] text-white/40 hover:text-white mt-2 underline">Ganti jika ada yang baru</button>}
                      </div>
                    ) : fileAkta ? (
                      <FilePreviewThumbnail file={fileAkta} title="Akta Kelahiran" onRemove={() => setFileAkta(null)} isLocked={isLocked} />
                    ) : (
                      <div className="flex flex-col items-center relative z-10">
                        <Camera className="w-8 h-8 mb-2 text-white/20" />
                        <span className="text-xs font-bold text-white/80">Upload Akta Kelahiran</span>
                        {!isLocked && (
                          <button onClick={() => openUploadModal("akta")} className="mt-3 px-4 py-1.5 rounded-lg text-[10px] font-bold bg-white/5 text-white/70 hover:bg-white/10 border border-white/5 transition-all">
                            Pilih File
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Item: Dokumen Pendukung (Dinamis) */}
                  <AnimatePresence>
                    {jalur && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, height: 'auto', scale: 1 }} 
                        exit={{ opacity: 0, height: 0, scale: 0.9 }}
                        className="p-4 rounded-2xl border-2 border-dashed border-rose-500/50 bg-rose-500/5 flex flex-col items-center justify-center text-center transition-all overflow-hidden relative min-h-[140px] md:col-span-2 mt-4"
                      >
                        {dataSpmb?.url_dokumen_pendukung && !filePendukung ? (
                          <div className="flex flex-col items-center relative z-10">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2"><Check size={20} /></div>
                            <span className="text-xs font-bold text-emerald-400">Dokumen Syarat {jalur} Tersimpan</span>
                            {!isLocked && <button onClick={() => openUploadModal("pendukung")} className="text-[10px] text-white/40 hover:text-white mt-2 underline">Ganti Dokumen Baru</button>}
                          </div>
                        ) : filePendukung ? (
                          <FilePreviewThumbnail file={filePendukung} title={`Syarat ${jalur}`} onRemove={() => setFilePendukung(null)} isLocked={isLocked} />
                        ) : (
                          <div className="flex flex-col items-center relative z-10">
                            <AlertCircle className="w-8 h-8 mb-2 text-rose-400/80 animate-pulse" />
                            <span className="text-xs font-bold text-white/90">
                              Upload Syarat Jalur {jalur}
                            </span>
                            <p className="text-[10px] text-rose-400 mt-1 px-4 max-w-sm">
                              {jalur === 'Zonasi' && "Wajib upload foto tampak depan rumah tempat tinggal saat ini (foto geotagging)."}
                              {jalur === 'Prestasi' && "Wajib upload foto/PDF Piagam Sertifikat Lomba."}
                              {jalur === 'Afirmasi' && "Wajib upload foto Kartu KIP / KPS / PKH asli yang masih berlaku."}
                              {jalur === 'Mutasi' && "Wajib upload foto Surat Keterangan Pindah Tugas Orang Tua."}
                            </p>
                            {!isLocked && (
                              <button onClick={() => openUploadModal("pendukung")} className="mt-4 px-6 py-2 rounded-xl text-[10px] font-bold bg-rose-500 text-white hover:bg-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all">
                                + Pilih File Syarat Mutlak
                              </button>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Submit Button */}
              {!isLocked && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !jalur || !lintang || !bujur}
                  className="w-full h-14 rounded-2xl text-sm font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Kirim Berkas Sekarang <ArrowRight size={18} /></>}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Hidden Global Inputs for Upload Modal */}
      <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleSelectFile} />
      <input type="file" ref={galleryInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleSelectFile} />

      {/* Upload Modal (Camera vs Gallery & Preview) */}
      <AnimatePresence>
        {activeDocType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={closeUploadModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0a1128] border border-white/10 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col z-10"
            >
              <div className="p-6">
                <h3 className="text-xl font-black text-white mb-2">
                  {previewFile ? "Pratinjau Dokumen" : "Metode Unggah"}
                </h3>
                <p className="text-xs text-white/50 mb-6 leading-relaxed">
                  {previewFile 
                    ? "Pastikan foto dokumen tidak buram, tidak terpotong, dan tulisan dapat dibaca dengan jelas oleh panitia."
                    : "Pilih cara Anda ingin melampirkan dokumen ini. Anda bisa memotret langsung atau memilih dari galeri."}
                </p>

                {!previewFile ? (
                  <div className="space-y-3">
                    <button onClick={() => cameraInputRef.current?.click()} className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-4 transition-all group">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera size={24} />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-white text-sm">Gunakan Kamera HP</div>
                        <div className="text-xs text-white/40 mt-0.5">Foto langsung menggunakan kamera</div>
                      </div>
                    </button>
                    <button onClick={() => galleryInputRef.current?.click()} className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-4 transition-all group">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <UploadCloud size={24} />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-white text-sm">Pilih dari Galeri / File</div>
                        <div className="text-xs text-white/40 mt-0.5">Pilih gambar/PDF yang sudah ada</div>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black/50 border border-white/10 flex items-center justify-center relative">
                      {previewUrl === 'pdf' ? (
                        <div className="text-center text-rose-400">
                          <FileText size={48} className="mx-auto mb-2 opacity-80" />
                          <span className="text-sm font-bold block">Dokumen PDF Terpilih</span>
                          <span className="block text-xs text-white/40 mt-1 px-4 truncate">{previewFile.name}</span>
                        </div>
                      ) : (
                        <img src={previewUrl!} alt="Preview" className="w-full h-full object-contain" />
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => { setPreviewFile(null); setPreviewUrl(null); }} className="h-12 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 text-white transition-all">
                        Ulangi Foto
                      </button>
                      <button onClick={confirmUpload} className="h-12 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2">
                        <Check size={18} /> Gunakan Ini
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>

    {/* === PRINT LAYOUT === */}
    {dataSpmb && isLocked && (
      <div className="hidden print:block w-[210mm] min-h-[297mm] bg-white text-black p-10 font-sans mx-auto relative">
        {/* Kop Surat */}
        {pengaturan?.kop_surat_url ? (
          <div className="mb-8">
            <img src={pengaturan.kop_surat_url} alt="Kop Surat" className="w-full h-auto" />
          </div>
        ) : (
          <div className="flex items-center gap-6 border-b-4 border-black pb-4 mb-8">
            <div className="w-24 h-24 flex items-center justify-center shrink-0">
              {pengaturan?.logo_url ? (
                <img src={pengaturan.logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-400 text-xs text-center border-2 border-dashed border-gray-400">LOGO</div>
              )}
            </div>
            <div className="flex-1 text-center">
              <h1 className="text-2xl font-black uppercase tracking-widest mb-1">Pemerintah Kabupaten/Kota</h1>
              <h2 className="text-3xl font-black uppercase tracking-wider mb-2">{pengaturan?.nama_sekolah || SCHOOL.nama}</h2>
              <p className="text-sm font-medium">{pengaturan?.alamat_sekolah || SCHOOL.alamat}</p>
            </div>
          </div>
        )}

        <div className="text-center mb-10">
          <h3 className="text-xl font-bold uppercase underline underline-offset-4">Tanda Bukti Verifikasi Berkas</h3>
          <p className="text-sm font-medium mt-2">Tahun Pelajaran {pengaturan?.tahun_ajaran || "2024/2025"}</p>
        </div>

        <div className="flex gap-8 mb-8">
          {/* Foto Siswa */}
          <div className="w-40 h-48 border-2 border-black flex items-center justify-center overflow-hidden shrink-0 bg-gray-100">
            {dataSiswa?.foto_url ? (
              <img src={dataSiswa.foto_url} alt="Foto Siswa" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400 text-sm">FOTO 3x4</span>
            )}
          </div>

          {/* Biodata */}
          <div className="flex-1">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-gray-200"><td className="py-2.5 font-bold w-40">Nama Lengkap</td><td className="py-2.5 font-bold uppercase">: {dataSiswa?.nama}</td></tr>
                <tr className="border-b border-gray-200"><td className="py-2.5 font-bold">NISN</td><td className="py-2.5 font-mono">: {dataSiswa?.nisn}</td></tr>
                <tr className="border-b border-gray-200"><td className="py-2.5 font-bold">Jenis Kelamin</td><td className="py-2.5">: {dataSiswa?.jk === 'P' ? 'Perempuan' : 'Laki-Laki'}</td></tr>
                <tr className="border-b border-gray-200"><td className="py-2.5 font-bold">Jalur Pilihan</td><td className="py-2.5 font-bold uppercase">: {dataSpmb?.jalur_pendaftaran || "Zonasi"}</td></tr>
                <tr className="border-b border-gray-200"><td className="py-2.5 font-bold">Sekolah Tujuan 1</td><td className="py-2.5 font-bold uppercase">: {dataSpmb?.sekolah_tujuan_1}</td></tr>
                {dataSpmb?.sekolah_tujuan_2 && (
                  <tr className="border-b border-gray-200"><td className="py-2.5 font-bold">Sekolah Tujuan 2</td><td className="py-2.5 font-bold uppercase">: {dataSpmb?.sekolah_tujuan_2}</td></tr>
                )}
                <tr className="border-b border-gray-200"><td className="py-2.5 font-bold">Koordinat Rumah</td><td className="py-2.5 font-mono text-xs">: {dataSpmb?.lintang}, {dataSpmb?.bujur}</td></tr>
                <tr className="border-b border-gray-200"><td className="py-2.5 font-bold">Waktu Pendaftaran</td><td className="py-2.5">: {new Date(dataSpmb?.updated_at || new Date()).toLocaleString('id-ID')}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-end mt-12 px-8">
          <div className="text-center">
            <p className="mb-20 text-sm">Panitia Verifikator</p>
            <p className="font-bold underline">___________________________</p>
            <p className="text-sm mt-1">NIP.</p>
          </div>
          
          <div className="w-24 h-24 border-2 border-black flex items-center justify-center flex-col p-1">
             <div className="w-full h-full flex items-center justify-center">
               <QRCode value={`SPMB-VALID-${dataSiswa?.nisn}`} size={80} level="M" />
             </div>
             <span className="text-[6px] font-mono mt-1 absolute bottom-1 bg-white px-1 font-bold">QR-VALID</span>
          </div>

          <div className="text-center">
            <p className="mb-20 text-sm">Orang Tua / Wali Calon Siswa</p>
            <p className="font-bold underline uppercase">{dataSiswa?.nama_ayah || dataSiswa?.nama_ibu || ".............................."}</p>
          </div>
        </div>
        <div className="mt-16 text-center text-xs text-gray-400 border-t border-gray-300 pt-4">
          <i>Dokumen ini dicetak secara otomatis dari Sistem Portal SPMB. Simpan bukti ini untuk proses daftar ulang.</i>
        </div>
      </div>
    )}
    </>
  );
}
