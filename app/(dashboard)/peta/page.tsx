"use client";

import { useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Navigation,
  Loader2,
  Users,
  Compass,
  AlertCircle,
} from "lucide-react";
import { useSiswa } from "@/hooks/useSiswa";
import { useSchoolConfig } from "@/hooks/useSchoolConfig";
import { SCHOOL } from '@/lib/school.config';

// Lazy load Leaflet to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false },
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false },
);
const Polyline = dynamic(
  () => import("react-leaflet").then((m) => m.Polyline),
  { ssr: false },
);

// Koordinat sekolah — fallback jika pengaturan belum tersimpan
const DEFAULT_LAT = -6.8873607;
const DEFAULT_LNG = 106.7791757;

export default function PetaZonasiPage() {
  const { data: dataSiswa, isLoading } = useSiswa();
  const { lat: SCHOOL_LAT, lng: SCHOOL_LNG, namaSekolah } = useSchoolConfig();

  // Fix for Leaflet "shattered" map issues
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 500);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Custom icons logic
  const getIcons = () => {
    if (typeof window === "undefined") return { schoolIcon: null, studentIcon: null };
    const L = require("leaflet");
    const schoolIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    });
    const studentIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [20, 32], iconAnchor: [10, 32], popupAnchor: [1, -30], shadowSize: [32, 32]
    });
    return { schoolIcon, studentIcon };
  };

  const { schoolIcon, studentIcon } = getIcons();

  // Process data with jitter for unmapped students (Logic from siswa.xml)
  const mappedSiswa = useMemo(() => {
    return dataSiswa.map((s, index) => {
      let lat = parseFloat(s.lintang || "");
      let lng = parseFloat(s.bujur || "");
      const isRealCoord = !isNaN(lat) && !isNaN(lng) && lat !== 0;

      if (!isRealCoord) {
        // Jitter logic from siswa.xml
        const seed = parseInt(s.nisn || "") || index;
        const hashRandom = (val: number) => {
          const x = Math.sin(val) * 10000;
          return x - Math.floor(x);
        };
        const radius = 0.003 + hashRandom(seed) * 0.015;
        const angle = hashRandom(seed + 1) * Math.PI * 2;
        lat = SCHOOL_LAT + radius * Math.cos(angle);
        lng = SCHOOL_LNG + radius * Math.sin(angle);
      }

      return { ...s, lat, lng, isRealCoord };
    });
  }, [dataSiswa]);

  // Statistics by Area (Logic from siswa.xml)
  const areaStats = useMemo(() => {
    const counter: Record<string, number> = {};
    let total = 0;
    dataSiswa.forEach((s) => {
      const wilayah = (s.kelurahan || s.kecamatan || "Tidak Diketahui")
        .toUpperCase()
        .trim();
      if (wilayah && wilayah !== "-") {
        counter[wilayah] = (counter[wilayah] || 0) + 1;
        total++;
      }
    });

    return Object.entries(counter)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item) => ({
        ...item,
        percent: total > 0 ? Math.round((item.count / total) * 100) : 0,
      }));
  }, [dataSiswa]);

  const totalMappedReal = mappedSiswa.filter((s) => s.isRealCoord).length;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1e0a3c 0%, #0f1117 100%)",
          border: "1px solid rgba(16,185,129,0.2)",
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 80% 20%, rgba(16,185,129,0.4) 0%, transparent 50%)`,
          }}
        />
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
            <Compass className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
              Peta Zonasi Siswa
            </h1>
            <p className="text-sm text-slate-400">
              LOGIKA PETA DENGAN PIN STANDAR + ANALISIS WILAYAH
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "Total Siswa",
                value: dataSiswa.length,
                icon: Users,
                color: "#7c3aed",
              },
              {
                label: "Real Coords",
                value: totalMappedReal,
                icon: MapPin,
                color: "#10b981",
              },
              {
                label: "Jitter Mode",
                value: dataSiswa.length - totalMappedReal,
                icon: Navigation,
                color: "#f59e0b",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="card p-4 flex items-center gap-3"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: `${s.color}22`,
                    border: `1px solid ${s.color}44`,
                  }}
                >
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <div>
                  <div className="text-xl font-black text-white">{s.value}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Map Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card overflow-hidden"
          >
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />{" "}
                Peta Interaktif
              </h2>
              <span className="text-xs text-slate-500">
                Leaflet + Jitter Logic
              </span>
            </div>

            <div className="h-[500px] relative">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                </div>
              ) : (
                <MapContainer
                  center={[SCHOOL_LAT, SCHOOL_LNG]}
                  zoom={14}
                  className="h-full w-full z-0"
                  style={{ background: '#0e1520' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {/* School marker */}
                  {schoolIcon && (
                    <Marker
                      position={[SCHOOL_LAT, SCHOOL_LNG]}
                      icon={schoolIcon}
                    >
                      <Popup>
                        <div className="font-bold text-sm">
                          🏫 {SCHOOL.nama}
                        </div>
                        <div className="text-xs text-slate-500">
                          Lokasi Sekolah
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  {/* Student markers */}
                  {mappedSiswa.map((s) => (
                    <div key={s.id}>
                      {studentIcon && (
                        <Marker position={[s.lat, s.lng]} icon={studentIcon}>
                          <Popup>
                            <div className="text-center">
                              <div className="font-bold text-sm">{s.nama}</div>
                              <div className="text-[10px] text-slate-500">
                                Kelas {s.kelas ?? "-"}
                              </div>
                              <div className="text-[10px] text-orange-500 font-bold mt-1">
                                {s.kelurahan || s.alamat || "-"}
                              </div>
                              {!s.isRealCoord && (
                                <div className="text-[8px] text-amber-500 italic mt-1">
                                  *Koordinat Estimasi (Jitter)
                                </div>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                      )}
                      <Polyline
                        positions={[
                          [SCHOOL_LAT, SCHOOL_LNG],
                          [s.lat, s.lng],
                        ]}
                        pathOptions={{
                          color: "#f97316",
                          weight: 1,
                          opacity: 0.3,
                          dashArray: "5, 5",
                        }}
                      />
                    </div>
                  ))}
                </MapContainer>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right: Analysis */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card p-6"
          >
            <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
              <Compass className="w-4 h-4 text-emerald-400" /> Top 5 Wilayah
            </h2>

            <div className="space-y-5">
              {areaStats.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Data wilayah belum tersedia.
                </p>
              ) : (
                areaStats.map((area, i) => {
                  const colors = [
                    "bg-orange-500",
                    "bg-emerald-500",
                    "bg-blue-500",
                    "bg-purple-500",
                    "bg-rose-500",
                  ];
                  const color = colors[i % colors.length];

                  return (
                    <div key={area.name} className="group">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[11px] font-bold text-slate-300 truncate pr-2 uppercase">
                          {i + 1}. {area.name}
                        </span>
                        <span className="text-[10px] font-black bg-white/5 px-2 py-0.5 rounded text-white border border-white/5">
                          {area.count}{" "}
                          <span className="text-[8px] text-slate-500 font-normal">
                            Siswa
                          </span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${area.percent}%` }}
                          transition={{ duration: 1, delay: 0.2 * i }}
                          className={`h-full ${color} shadow-[0_0_10px_rgba(0,0,0,0.3)]`}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-emerald-100/70 leading-relaxed">
              <strong className="text-emerald-300 block mb-1">
                Informasi Zonasi
              </strong>
              Sistem menggunakan <strong>Jitter Logic</strong> untuk siswa yang
              belum memiliki koordinat presisi. Garis putus-putus orange
              menunjukkan tarikan radius zonasi dari sekolah ke domisili siswa.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
