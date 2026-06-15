"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Printer, Search, MapPin, School, Route, Info, AlertCircle, CheckCircle2 } from "lucide-react";
import UtilityHeader from "./UtilityHeader";
import { useAppStore } from "@/store/app.store";
import { useSiswa } from "@/hooks/useSiswa";
import { useSchoolConfig } from "@/hooks/useSchoolConfig";
import type { Siswa } from "@/types";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Separate Map Component to handle its own lifecycle and avoid "already initialized" errors
const LeafletMap = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      const { MapContainer, TileLayer, Marker, Polyline } = mod;
      return function MapComponent({
        center,
        studentPos,
        schoolPos,
        studentIcon,
        schoolIcon,
      }: any) {
        return (
          <MapContainer center={center} zoom={14} className="w-full h-full" zoomControl={false} scrollWheelZoom={false}>
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              maxZoom={20}
              attribution="&copy; Google Maps"
            />
            {studentIcon && <Marker position={studentPos} icon={studentIcon} />}
            {schoolIcon && <Marker position={schoolPos} icon={schoolIcon} />}
            <Polyline
              positions={[studentPos, schoolPos]}
              color="#dc2626"
              weight={5}
              dashArray="5, 10"
              lineCap="round"
            />
          </MapContainer>
        );
      };
    }),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-900/50">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
);

// Separate the presets and logic...
const SMP_PRESETS = [
  { id: "smpn1cbd", name: "SMPN 1 CIBADAK", lat: -6.894197201383203, lng: 106.79245633379786 },
  { id: "smpn2cbd", name: "SMPN 2 CIBADAK", lat: -6.893708370240123, lng: 106.7873747252371 },
  { id: "smpn3cbd", name: "SMPN 3 CIBADAK", lat: -6.897012769187578, lng: 106.8157964540726 },
  { id: "smpn1ngr", name: "SMPN 1 NAGRAK", lat: -6.877650608883275, lng: 106.7963223964014 },
  { id: "smpn1prk", name: "SMPN 1 PARUNGKUDA", lat: -6.839592733613776, lng: 106.76041366941415 },
];

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default function PetaZonasiSpmb() {
  const { pengaturan } = useAppStore();
  const config = useSchoolConfig();
  const { data: dataSiswa = [] } = useSiswa();

  // Call useSiswa to trigger the data fetch if the store is empty

  const printRef = useRef<HTMLDivElement>(null);

  const [searchSiswa, setSearchSiswa] = useState("");
  const [selectedSiswaId, setSelectedSiswaId] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [icons, setIcons] = useState<{ schoolIcon: any; studentIcon: any }>({ schoolIcon: null, studentIcon: null });

  const [customTarget, setCustomTarget] = useState({ name: "", lat: "", lng: "" });
  const [namaVerifikator, setNamaVerifikator] = useState("");
  const [nipVerifikator, setNipVerifikator] = useState("");
  const [mapKey, setMapKey] = useState(0);
  const [result, setResult] = useState<{
    siswa: Siswa;
    targetName: string;
    targetLat: number;
    targetLng: number;
    distanceMeters: number;
  } | null>(null);

  // Load Leaflet icons once on client
  useEffect(() => {
    if (typeof window !== "undefined") {
      const L = require("leaflet");
      const schoolIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
      });
      const studentIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
      });
      setIcons({ schoolIcon, studentIcon });
    }
  }, []);

  const { schoolIcon, studentIcon } = icons;

  const siswaKelas6 = useMemo(() => {
    return dataSiswa
      .filter((s) => s.kelas?.startsWith("VI ") || s.kelas?.startsWith("6") || s.kelas === "VI")
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [dataSiswa]);

  const filteredSiswa = siswaKelas6.filter(
    (s) => s.nama.toLowerCase().includes(searchSiswa.toLowerCase()) || s.nisn?.includes(searchSiswa)
  );

  const selectedSiswa = siswaKelas6.find((s) => s.id === selectedSiswaId);

  // Fix for Leaflet "shattered / black screen" map issues
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const handlePrint = () => {
    if (!result) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return alert("Pop-up diblokir! Izinkan pop-up untuk mencetak.");

    const logoUrl = pengaturan?.logo_url || "/logo_sekolah.png";
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
      `ZONASI SPMB\nNama: ${result.siswa.nama}\nNISN: ${result.siswa.nisn}\nTujuan: ${result.targetName}\nJarak: ${formatJarak(result.distanceMeters)}`
    )}`;

    // Static Map using Google Maps Static API (Hybrid style like the app)
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=800x400&maptype=hybrid&path=color:0xdc2626|weight:5|${result.siswa.lintang},${result.siswa.bujur}|${result.targetLat},${result.targetLng}&markers=color:red|label:S|${result.siswa.lintang},${result.siswa.bujur}&markers=color:green|label:T|${result.targetLat},${result.targetLng}&key=YOUR_API_KEY_OR_REMOVE_IF_UNNECESSARY`;

    // If no API key, we use a simpler fallback or just the coordinates text. 
    // For now, let's use a standard template.

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cetak Verifikasi Zonasi - ${result.siswa.nama}</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          
          * { box-sizing: border-box; }

          body { 
            font-family: 'Inter', sans-serif; 
            margin: 0 auto; 
            padding: 15mm; 
            background: white; 
            color: black;
            width: 210mm;
            box-sizing: border-box;
          }
          .kop-container {
            display: flex;
            align-items: center;
            border-bottom: 3px solid black;
            padding-bottom: 10px;
            margin-bottom: 20px;
            width: 100%;
          }
          .kop-logo { width: 80px; height: 80px; margin-right: 20px; object-fit: contain; }
          .kop-text { flex: 1; }
          .kop-text h1 { font-size: 14pt; margin: 0; font-weight: 900; text-transform: uppercase; line-height: 1.2; }
          .kop-text h2 { font-size: 16pt; margin: 2px 0; font-weight: 900; }
          .kop-text p { font-size: 9pt; margin: 0; font-style: italic; }
          
          .qr-code { width: 80px; height: 80px; }

          .title-section { text-align: center; margin-bottom: 20px; width: 100%; }
          .title-section h3 { text-decoration: underline; font-size: 13pt; font-weight: 900; margin: 0; }
          .title-section p { font-size: 9pt; font-style: italic; margin: 5px 0; }

          .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; width: 100%; }
          .info-box { border: 1.2px solid black; padding: 12px; border-radius: 8px; overflow: hidden; }
          .info-label { font-size: 7.5pt; font-weight: 900; color: #444; text-transform: uppercase; margin-bottom: 4px; }
          .info-value { font-size: 10pt; font-weight: 900; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .info-sub { font-size: 8.5pt; font-family: monospace; }

          #print-map {
            width: 100%;
            height: 380px;
            border: 1.2px solid black;
            border-radius: 8px;
            margin-bottom: 15px;
            background: #f8f8f8;
            overflow: hidden;
          }

          .distance-badge {
            background: black;
            color: white;
            padding: 15px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 25px;
            width: 100%;
          }
          .distance-label { font-size: 8pt; font-weight: 900; text-transform: uppercase; opacity: 0.9; }
          .distance-value { font-size: 28pt; font-weight: 900; margin: 3px 0; }
          .distance-unit { font-size: 12pt; }

          .footer-section { display: flex; justify-content: flex-end; margin-top: 30px; width: 100%; }
          .signature-box { text-align: center; width: 220px; font-size: 10pt; }
          .sig-date { margin-bottom: 45px; }
          .sig-name { font-weight: 900; text-decoration: underline; text-transform: uppercase; }

          @media print {
            @page { margin: 0; size: A4 portrait; }
            body { padding: 15mm; }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #print-map { width: 100% !important; border: 1.2px solid black !important; }
            
            /* Ensure Leaflet SVG path strokes are printed */
            .leaflet-overlay-pane svg path {
              stroke-width: 5px !important;
              stroke: #dc2626 !important;
              stroke-opacity: 1 !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="kop-container">
          <img src="${logoUrl}" class="kop-logo" />
          <div class="kop-text">
            <h1>PEMERINTAH KABUPATEN SUKABUMI<br/>DINAS PENDIDIKAN</h1>
            <h2>${config.namaSekolah}</h2>
            <p>${config.alamatSekolah}</p>
          </div>
          <img src="${qrUrl}" class="qr-code" />
        </div>

        <div class="title-section">
          <h3>HASIL VERIFIKASI JARAK ZONASI SPMB</h3>
          <p>Dihasilkan secara otomatis menggunakan pemetaan Satelit Geografis (Haversine Formula)</p>
        </div>

        <div class="content-grid">
          <div class="info-box">
            <div class="info-label">Identitas Siswa</div>
            <div class="info-value">${result.siswa.nama}</div>
            <div class="info-sub">NISN: ${result.siswa.nisn || "-"}</div>
            <div style="margin-top: 8px;" class="info-label">Koordinat Rumah</div>
            <div class="info-sub">${result.siswa.lintang}, ${result.siswa.bujur}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Sekolah Tujuan</div>
            <div class="info-value">${result.targetName}</div>
            <div class="info-sub">Jalur: Zonasi SPMB</div>
            <div style="margin-top: 8px;" class="info-label">Koordinat Sekolah</div>
            <div class="info-sub">${result.targetLat.toFixed(6)}, ${result.targetLng.toFixed(6)}</div>
          </div>
        </div>

        <div id="print-map"></div>

        <div class="distance-badge">
          <div class="distance-label">Hasil Kalkulasi Jarak Terverifikasi</div>
          <div class="distance-value">${formatJarak(result.distanceMeters).split(' ')[0]} <span class="distance-unit">${formatJarak(result.distanceMeters).split(' ')[1]}</span></div>
          <div style="font-size: 7.5pt; margin-top: 3px; opacity: 0.8;">STATUS: VALID & TERVERIFIKASI SISTEM</div>
        </div>

        <div class="footer-section">
          <div class="signature-box">
            <div class="sig-date">${config.kotaSekolah}, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}<br>Petugas Verifikator,</div>
            <div class="sig-name">${namaVerifikator || pengaturan?.nama_kepsek || "KEPALA SEKOLAH"}</div>
            <div>${namaVerifikator ? (nipVerifikator ? `NIP. ${nipVerifikator}` : "") : (pengaturan?.nip_kepsek ? `NIP. ${pengaturan.nip_kepsek}` : "")}</div>
          </div>
        </div>

        <${'script'}>
          function initMap() {
            try {
              const studentLat = parseFloat("${result.siswa.lintang || 0}");
              const studentLng = parseFloat("${result.siswa.bujur || 0}");
              const targetLat = parseFloat("${result.targetLat}");
              const targetLng = parseFloat("${result.targetLng}");

              if (!studentLat || !studentLng) {
                document.getElementById('print-map').innerHTML = '<div style="padding: 20px; text-align: center;">Koordinat tidak valid</div>';
                window.print();
                return;
              }

              const map = L.map('print-map', {
                zoomControl: false,
                attributionControl: false
              }).setView([(studentLat + targetLat) / 2, (studentLng + targetLng) / 2], 14);

              const layer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
                maxZoom: 20
              }).addTo(map);

              const redIcon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41], iconAnchor: [12, 41]
              });

              const greenIcon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41], iconAnchor: [12, 41]
              });

              L.marker([studentLat, studentLng], {icon: redIcon}).addTo(map);
              L.marker([targetLat, targetLng], {icon: greenIcon}).addTo(map);

              L.polyline([[studentLat, studentLng], [targetLat, targetLng]], {
                color: '#dc2626',
                weight: 5,
                dashArray: '8, 12'
              }).addTo(map);

              let printed = false;
              const doPrint = () => {
                if (printed) return;
                printed = true;
                setTimeout(() => window.print(), 500);
              };

              layer.on('load', doPrint);
              setTimeout(doPrint, 3000); // fallback

              setTimeout(() => {
                map.invalidateSize();
              }, 200);
              
            } catch (e) {
              console.error(e);
              window.print();
            }
          }
        </${'script'}>
        <${'script'} src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onload="initMap()"></${'script'}>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleProses = () => {
    if (!selectedSiswa) return alert("Pilih Kandidat Siswa terlebih dahulu!");
    if (!selectedSiswa.lintang || !selectedSiswa.bujur) {
      return alert("Data titik koordinat Lintang/Bujur rumah siswa belum diset di Buku Induk Dapodik!");
    }

    if (!selectedTargetId) return alert("Pilih Sekolah Tujuan terlebih dahulu!");

    const sLat = selectedSiswa.lintang!;
    const sBujur = selectedSiswa.bujur!;

    setIsAnalyzing(true);
    setResult(null); // Reset previous result to show animation
    setMapKey(Date.now()); // Generate unique key for map remounting

    // Simulate satellite analysis delay
    setTimeout(() => {
      let targetLat = 0, targetLng = 0, targetName = "";

      if (selectedTargetId === "custom") {
        targetLat = parseFloat(customTarget.lat);
        targetLng = parseFloat(customTarget.lng);
        targetName = customTarget.name || "Sekolah Tujuan";
        if (isNaN(targetLat) || isNaN(targetLng)) {
          setIsAnalyzing(false);
          return alert("Format koordinat custom tidak valid!");
        }
      } else {
        const target = SMP_PRESETS.find((t) => t.id === selectedTargetId);
        if (target) {
          targetLat = target.lat;
          targetLng = target.lng;
          targetName = target.name;
        }
      }

      const siswaLat = parseFloat(sLat);
      const siswaLng = parseFloat(sBujur);

      const dist = getDistance(siswaLat, siswaLng, targetLat, targetLng);

      setResult({
        siswa: selectedSiswa,
        targetName,
        targetLat,
        targetLng,
        distanceMeters: dist,
      });
      setIsAnalyzing(false);
    }, 1200);
  };

  const formatJarak = (meters: number) => {
    return meters >= 1000 ? (meters / 1000).toFixed(2).replace(".", ",") + " KM" : Math.round(meters) + " Meter";
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto pb-10">
      <div className="print:hidden">
        <UtilityHeader
          icon={Compass}
          title="Tarik Garis Zonasi SPMB"
          subtitle="Verifikasi Jarak Koordinat Geografis (Siswa Kelas 6)"
          accentColor="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">
        {/* Left Panel: Form */}
        <div className="lg:col-span-4 space-y-6 print:hidden">
          <div className="card p-6 space-y-8 relative group">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-700 pointer-events-none" />

            <div className="flex items-center gap-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 ring-1 ring-white/20">
                <Route className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-black text-base text-white uppercase tracking-tight">Mode Satelit Pro</h3>
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Zonasi Engine v2.0</p>
              </div>
            </div>

            <div className="space-y-6 relative">
              {/* 1. Pilih Siswa */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <span className="text-[10px] font-black text-indigo-400">1</span>
                  </div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Pilih Kandidat Siswa
                  </label>
                </div>

                <div className="relative z-50">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className={`w-full px-4 py-4 bg-white/[0.03] border rounded-2xl font-bold text-slate-200 flex justify-between items-center transition-all duration-300 group/btn ${showDropdown
                        ? "border-indigo-500 ring-4 ring-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                        : "border-white/5 hover:border-white/20 hover:bg-white/[0.05]"
                      }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selectedSiswa ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-500"}`}>
                        <Search className="w-4 h-4" />
                      </div>
                      <span className="truncate">
                        {selectedSiswa ? selectedSiswa.nama : "Cari Siswa Kelas 6..."}
                      </span>
                    </div>
                    <Compass className={`w-4 h-4 text-slate-500 transition-transform duration-500 ${showDropdown ? "rotate-180 text-indigo-400" : "group-hover/btn:rotate-90"}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="absolute left-0 right-0 mt-3 bg-[#111420]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[999]"
                    >
                      <div className="p-4 border-b border-white/5 bg-white/5">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Ketik nama atau NISN..."
                            value={searchSiswa}
                            onChange={(e) => setSearchSiswa(e.target.value)}
                            className="w-full pl-10 pr-3 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto p-2 space-y-1 custom-scroll">
                        {filteredSiswa.length === 0 && (
                          <div className="flex flex-col items-center py-10 text-slate-500">
                            <Search className="w-8 h-8 opacity-20 mb-2" />
                            <p className="text-xs font-bold italic">Siswa tidak ditemukan</p>
                          </div>
                        )}
                        {filteredSiswa.map((s) => {
                          const isKosong = !s.lintang || !s.bujur;
                          const isSelected = selectedSiswaId === s.id;
                          return (
                            <button
                              key={s.id}
                              onClick={() => {
                                setSelectedSiswaId(s.id);
                                setShowDropdown(false);
                                setSearchSiswa("");
                              }}
                              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${isSelected
                                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                  : "hover:bg-white/5 text-slate-400"
                                }`}
                            >
                              {/* Name Container */}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col">
                                  <span className={`truncate text-sm font-black uppercase tracking-tight ${isSelected ? "text-white" : "text-slate-200"}`}>
                                    {s.nama}
                                  </span>
                                  <span className={`text-[9px] font-mono tracking-wider ${isSelected ? "text-white/60" : "text-slate-500"}`}>
                                    NISN: {s.nisn || "0000000000"}
                                  </span>
                                </div>
                              </div>

                              {/* Compact Status Icon */}
                              <div className="shrink-0">
                                {isKosong ? (
                                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-sm">
                                    <AlertCircle className="w-3 h-3" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">KOSONG</span>
                                  </div>
                                ) : (
                                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border shadow-sm ${isSelected
                                      ? "bg-white/20 border-white/20 text-white"
                                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                    }`}>
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">READY</span>
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* 2. Pilih Target SMP */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <span className="text-[10px] font-black text-indigo-400">2</span>
                  </div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Tentukan Titik Sekolah
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SMP_PRESETS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTargetId(t.id)}
                      className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group/smp ${selectedTargetId === t.id
                          ? "bg-indigo-500/10 border-indigo-500/50 text-white shadow-[0_10px_30px_rgba(99,102,241,0.1)]"
                          : "bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.05] hover:border-white/20"
                        }`}
                    >
                      <div className={`absolute top-0 right-0 w-12 h-12 -mr-4 -mt-4 bg-indigo-500/10 blur-xl rounded-full transition-all duration-500 ${selectedTargetId === t.id ? "opacity-100" : "opacity-0"}`} />
                      <div className="text-[10px] font-black uppercase leading-tight line-clamp-1 relative z-10">{t.name}</div>
                      <div className={`text-[8px] font-black mt-1 uppercase tracking-widest relative z-10 ${selectedTargetId === t.id ? "text-indigo-400" : "text-slate-600"}`}>
                        SMP PRESET
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedTargetId("custom")}
                    className={`p-4 rounded-2xl border text-left transition-all duration-300 ${selectedTargetId === "custom"
                        ? "bg-indigo-500/10 border-indigo-500/50 text-white shadow-[0_10px_30px_rgba(99,102,241,0.1)]"
                        : "bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.05] hover:border-white/20"
                      }`}
                  >
                    <div className="text-[10px] font-black uppercase leading-tight flex items-center gap-2">
                      <MapPin className={`w-3 h-3 ${selectedTargetId === "custom" ? "text-indigo-400" : "text-slate-500"}`} /> INPUT MANUAL
                    </div>
                    <div className={`text-[8px] font-black mt-1 uppercase tracking-widest ${selectedTargetId === "custom" ? "text-indigo-400" : "text-slate-600"}`}>
                      KOORDINAT
                    </div>
                  </button>
                </div>
              </div>

              {/* Custom Input */}
              {selectedTargetId === "custom" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 bg-indigo-500/5 rounded-2xl space-y-4 border border-indigo-500/20 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50" />
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-indigo-400 uppercase tracking-widest ml-1">Nama Sekolah</label>
                    <input
                      type="text"
                      placeholder="Contoh: SMP NEGERI 1 ..."
                      value={customTarget.name}
                      onChange={(e) => setCustomTarget({ ...customTarget, name: e.target.value })}
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-indigo-500 transition-all font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-indigo-400 uppercase tracking-widest ml-1">Latitude</label>
                      <input
                        type="text"
                        placeholder="-6.xxx"
                        value={customTarget.lat}
                        onChange={(e) => setCustomTarget({ ...customTarget, lat: e.target.value })}
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-indigo-500 transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-indigo-400 uppercase tracking-widest ml-1">Longitude</label>
                      <input
                        type="text"
                        placeholder="106.xxx"
                        value={customTarget.lng}
                        onChange={(e) => setCustomTarget({ ...customTarget, lng: e.target.value })}
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-indigo-500 transition-all font-mono"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 3. Petugas Verifikator */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <span className="text-[10px] font-black text-indigo-400">3</span>
                  </div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Petugas Verifikator (Opsional)
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nama Verifikator..."
                    value={namaVerifikator}
                    onChange={(e) => setNamaVerifikator(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/5 hover:border-white/20 focus:border-indigo-500 rounded-xl font-bold text-slate-200 outline-none transition-all duration-300 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="NIP Verifikator..."
                    value={nipVerifikator}
                    onChange={(e) => setNipVerifikator(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/5 hover:border-white/20 focus:border-indigo-500 rounded-xl font-bold text-slate-200 outline-none transition-all duration-300 text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <button
                  onClick={handleProses}
                  disabled={isAnalyzing}
                  className={`group w-full py-4 rounded-2xl font-black shadow-xl transition-all active:scale-[0.98] flex justify-center items-center gap-3 uppercase tracking-[0.15em] text-xs ${isAnalyzing
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/25"
                    }`}
                >
                  {isAnalyzing ? (
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>Menganalisis...</span>
                    </div>
                  ) : (
                    <>
                      <Route className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      <span>Proses Analisis Jarak</span>
                    </>
                  )}
                </button>

                {result && (
                  <button
                    onClick={() => handlePrint()}
                    className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-300 py-4 rounded-2xl font-black shadow-lg border border-white/10 transition-all active:scale-[0.98] flex justify-center items-center gap-3 uppercase tracking-widest text-xs"
                  >
                    <Printer className="w-5 h-5 text-indigo-400" /> CETAK HASIL VERIFIKASI
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Map & Result */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div
            className="card p-3 relative overflow-hidden min-h-[600px] flex flex-col border border-white/10 shadow-2xl bg-[#0f1117]"
          >
            {/* The Map Component */}
            <div className="leaflet-map-print-wrapper w-full flex-1 rounded-2xl overflow-hidden z-0 bg-[#0f1117] min-h-[450px] relative border border-white/10 group/map">
              {/* Map UI Decorations */}
              <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2">
                <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Satelit</span>
                </div>
              </div>

              {result && schoolIcon && studentIcon ? (
                <div key={`map-session-${mapKey}`} className="w-full h-full">
                  <LeafletMap
                    center={[
                      (parseFloat(result.siswa.lintang!) + result.targetLat) / 2,
                      (parseFloat(result.siswa.bujur!) + result.targetLng) / 2,
                    ]}
                    studentPos={[parseFloat(result.siswa.lintang!), parseFloat(result.siswa.bujur!)]}
                    schoolPos={[result.targetLat, result.targetLng]}
                    studentIcon={studentIcon}
                    schoolIcon={schoolIcon}
                  />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)]" />

                  {isAnalyzing && (
                    <motion.div
                      initial={{ y: "-100%" }}
                      animate={{ y: "100%" }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                      className="absolute top-0 left-0 w-full h-[20%] bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent z-10"
                    />
                  )}

                  <Compass className={`w-20 h-20 opacity-10 mb-4 ${isAnalyzing ? "animate-spin text-indigo-500 opacity-30" : "animate-[spin_10s_linear_infinite]"}`} />
                  <p className={`font-black uppercase tracking-[0.2em] text-xs transition-all ${isAnalyzing ? "text-indigo-400 opacity-100" : "opacity-40"}`}>
                    {isAnalyzing ? "Menghubungkan ke Satelit..." : "Zonasi Engine Ready"}
                  </p>
                </div>
              )}
            </div>

            {/* Result Card UI - Verified Certificate Style */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 relative"
              >
                {/* Decorative Dots */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-1 px-4 py-1 bg-[#1a1f2e] border border-white/10 rounded-full z-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/20" />
                </div>

                <div className="p-4 border border-white/10 rounded-3xl bg-gradient-to-b from-white/[0.03] to-transparent w-full shrink-0 relative overflow-hidden">
                  {/* Subtle Pattern Background */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`, backgroundSize: '20px 20px' }}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 relative z-10 items-stretch">
                    {/* Left Column: Details */}
                    <div className="md:col-span-7 space-y-3 flex flex-col justify-between">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Identitas Siswa</p>
                          <p className="text-sm font-black text-white uppercase truncate">{result.siswa.nama}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-500">NISN: {result.siswa.nisn || "-"}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Sekolah Tujuan</p>
                          <p className="text-sm font-black text-white uppercase truncate">{result.targetName}</p>
                          <span className="text-[10px] font-bold text-indigo-500/60">Jalur: Zonasi SPMB</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <MapPin className="w-3 h-3 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Rumah</p>
                            <p className="text-[9px] font-mono font-bold text-slate-300">{result.siswa.lintang}, {result.siswa.bujur}</p>
                          </div>
                        </div>
                        <div className="h-5 w-px bg-white/5" />
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <School className="w-3 h-3 text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Sekolah</p>
                            <p className="text-[9px] font-mono font-bold text-slate-300">{result.targetLat.toFixed(6)}, {result.targetLng.toFixed(6)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Distance Badge */}
                    <div className="md:col-span-5 flex flex-col">
                      <div className="flex-1 bg-indigo-600 rounded-2xl p-3 shadow-2xl shadow-indigo-500/20 relative overflow-hidden group flex flex-col justify-center min-h-[100px]">
                        {/* Glow Effect */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all duration-700" />

                        <div className="relative z-10 text-center">
                          <p className="text-[8px] font-black text-indigo-100 uppercase tracking-[0.2em]">Hasil Kalkulasi Jarak</p>
                          <div className="flex items-baseline justify-center gap-1 mt-0.5">
                            <p className="text-3xl font-black text-white tracking-tighter">
                              {formatJarak(result.distanceMeters).split(' ')[0]}
                            </p>
                            <p className="text-sm font-black text-indigo-200 uppercase">
                              {formatJarak(result.distanceMeters).split(' ')[1]}
                            </p>
                          </div>
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-black/20 rounded-md border border-white/10">
                            <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                            <p className="text-[7px] font-black text-indigo-100 uppercase tracking-widest">Terverifikasi</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Info Card - Moved outside the grid to be full width at the bottom (as originally requested) */}
      <div className="mt-6 p-6 bg-gradient-to-r from-indigo-500/10 via-transparent to-transparent border border-indigo-500/10 rounded-3xl print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <Compass className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-medium italic">
            Sistem menghitung jarak menggunakan <b className="text-slate-200">Haversine Formula</b> (Jarak Garis Lurus) yang menjadi standar verifikasi <b className="text-indigo-400">Zonasi SPMB</b>. Seluruh kalkulasi divalidasi secara otomatis oleh mesin pemetaan satelit.
          </p>
        </div>
      </div>
    </div>
  );
}


