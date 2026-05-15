"use client";

import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";
import { MapPin, User } from "lucide-react";
import { useAppStore } from "@/store/app.store";

// Fix for Leaflet marker icons in Next.js
interface MigrationData {
  id: string;
  nama: string;
  asal_tujuan: string;
  tipe: "masuk" | "keluar";
}

interface Props {
  data: MigrationData[];
}

// Helper to generate mock coordinates around the school for visualization
const generateMockCoords = (
  seed: string,
  centerCoords: [number, number],
): [number, number] => {
  const hash = seed
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const latOffset = (hash % 100) / 1000 - 0.05;
  const lngOffset = ((hash * 13) % 100) / 1000 - 0.05;
  return [centerCoords[0] + latOffset, centerCoords[1] + lngOffset];
};

export function MigrationMap({ data }: Props) {
  const [mounted, setMounted] = useState(false);
  const { pengaturan } = useAppStore();

  const schoolName = pengaturan?.nama_sekolah || "SDN 02 CIBADAK";

  // Use setting coords or fallback
  const schoolCoords: [number, number] = [
    parseFloat(pengaturan?.lat_sekolah || "-6.9147"),
    parseFloat(pengaturan?.lng_sekolah || "106.9266"),
  ];

  useEffect(() => {
    // Fix for Leaflet marker icons in Next.js (Client-side only)
    const L = require("leaflet");
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    setMounted(true);
  }, []);

  if (!mounted)
    return (
      <div className="h-[500px] w-full bg-white/5 animate-pulse rounded-3xl" />
    );

  return (
    <div className="h-[600px] w-full rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .leaflet-popup-content-wrapper {
          background: rgba(9, 14, 26, 0.85) !important;
          backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          color: white !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
        }
        .leaflet-popup-tip {
          background: rgba(9, 14, 26, 0.85) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
        }
        .leaflet-popup-close-button {
          color: rgba(255,255,255,0.5) !important;
        }
      `,
        }}
      />
      <MapContainer
        center={schoolCoords}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full grayscale invert opacity-80"
        style={{ background: "#050811" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* School Marker (The Core) */}
        <Marker position={schoolCoords}>
          <Popup>
            <div className="p-2">
              <h4 className="font-bold text-violet-400">
                {schoolName.toUpperCase()}
              </h4>
              <p className="text-[10px] text-white/50">
                Pusat Ekosistem Kesiswaan
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Migration Paths */}
        {data.map((m) => {
          const targetCoords = generateMockCoords(m.id, schoolCoords);
          const isMasuk = m.tipe === "masuk";
          const path = isMasuk
            ? [targetCoords, schoolCoords]
            : [schoolCoords, targetCoords];

          return (
            <React.Fragment key={m.id}>
              <Polyline
                positions={path as any}
                pathOptions={{
                  color: isMasuk ? "#10b981" : "#f43f5e",
                  weight: 2,
                  dashArray: "5, 10",
                  opacity: 0.6,
                }}
              />
              <Marker position={targetCoords}>
                <Popup>
                  <div className="p-3 min-w-[150px] space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${isMasuk ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}
                      >
                        <User size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-white/90">
                          {m.nama}
                        </p>
                        <p className="text-[10px] text-white/50">
                          {isMasuk ? "Mutasi Masuk" : "Mutasi Keluar"}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                      <MapPin size={12} className="text-white/40" />
                      <span className="text-[10px] font-bold text-white/60">
                        {m.asal_tujuan}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Legend Overlay */}
      <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2">
        <div className="bg-[#050811]/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">
            Map Legend
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-xs font-bold text-white/70">
                Mutasi Masuk
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
              <span className="text-xs font-bold text-white/70">
                Mutasi Keluar
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Floating Card */}
      <div className="absolute top-6 left-6 z-[1000]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#050811]/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl max-w-[200px]"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">Spatial Insight</h4>
              <p className="text-[10px] text-white/30">AI Visual Mapping</p>
            </div>
          </div>
          <p className="text-[11px] text-white/50 leading-relaxed">
            Memetakan sebaran geografis perpindahan siswa di wilayah{" "}
            <span className="text-white font-bold">
              {pengaturan?.alamat_sekolah || "sekolah"} & sekitarnya
            </span>
            .
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Sparkles(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
