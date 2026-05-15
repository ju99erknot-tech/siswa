"use client";

import { useState } from "react";
import {
  MessageSquare,
  Send,
  Users,
  ShieldCheck,
  Zap,
  Settings,
  History,
  Smartphone,
  CheckCircle2,
} from "lucide-react";
import {
  PageShell,
  PageHeader,
  PageCard,
  StatCards,
  EmptyState,
} from "@/components/shared/PageShell";
import { useAppStore } from "@/store/app.store";

import { cn } from "@/lib/utils";

export default function WhatsAppBlastPage() {
  const { setWaBlastOpen, dataSiswa } = useAppStore();

  const stats = [
    {
      label: "Total Kontak",
      value: dataSiswa.filter((s) => s.no_wa).length,
      icon: <Users size={20} />,
      color: "#34d399",
    },
    {
      label: "Pesan Terkirim",
      value: "0",
      icon: <CheckCircle2 size={20} />,
      color: "#60a5fa",
    },
    {
      label: "Pending Queue",
      value: "0",
      icon: <Zap size={20} />,
      color: "#fbbf24",
    },
    {
      label: "System Status",
      value: "Online",
      icon: <ShieldCheck size={20} />,
      color: "#a78bfa",
    },
  ];

  return (
    <PageShell>
      <PageHeader
        icon={<MessageSquare className="w-6 h-6 text-green-400" />}
        title="Aurora WhatsApp Blast"
        subtitle="Sistem komunikasi massal otomatis untuk wali murid dan siswa"
        gradient="linear-gradient(135deg, #051a0d 0%, #050811 50%, #050811 100%)"
        glowColor="rgba(34,197,94,0.15)"
        action={
          <button
            onClick={() => setWaBlastOpen(true)}
            className="btn-solid btn-sm bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-2 shadow-lg shadow-violet-900/20 transition-all"
          >
            <Send size={14} /> Start New Blast
          </button>
        }
      />

      <StatCards items={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Concept & Guide */}
        <div className="lg:col-span-1 space-y-6">
          <PageCard className="bg-gradient-to-br from-green-500/[0.03] to-transparent border-white/[0.02] p-8">
            <h3 className="text-lg font-black text-white mb-4">
              Konsep WA Blast
            </h3>
            <div className="space-y-6">
              {[
                {
                  title: "Otomatisasi Absensi",
                  desc: "Kirim notifikasi otomatis jika siswa tidak hadir tanpa keterangan.",
                  icon: Zap,
                },
                {
                  title: "Pengumuman Massal",
                  desc: "Informasi ujian, rapat wali murid, atau libur sekolah dalam hitungan detik.",
                  icon: Users,
                },
                {
                  title: "Personalized Messaging",
                  desc: "Gunakan tag {nama_siswa} untuk membuat pesan terasa lebih personal.",
                  icon: MessageSquare,
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <item.icon size={18} className="text-green-400/50" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white/80">
                      {item.title}
                    </h4>
                    <p className="text-xs text-white/30 leading-relaxed mt-1">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-white/[0.02]">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.02] space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-violet-400" />
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                    Local WA Gateway
                  </span>
                </div>
                <p className="text-[11px] text-white/40 leading-relaxed font-medium">
                  Sistem ini terintegrasi dengan Local WhatsApp Gateway
                  (Baileys) gratis tanpa biaya per pesan. Pastikan HP sekolah
                  selalu aktif dan terkoneksi internet.
                </p>
              </div>
            </div>
          </PageCard>

          <PageCard className="border-white/[0.02] p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-widest opacity-40">
                Device Status
              </h3>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.02]">
              <Smartphone size={24} className="text-white/10" />
              <div className="flex-1">
                <p className="text-xs font-bold text-white/60">
                  WhatsApp Gateway
                </p>
                <p className="text-[10px] text-white/20 font-medium">
                  Status perangkat dikonfigurasi secara terpisah
                </p>
              </div>
              <Settings size={14} className="text-white/10" />
            </div>
          </PageCard>
        </div>

        {/* Recent History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <History className="text-white/20" size={18} />
              <h3 className="text-lg font-black text-white tracking-tight">
                Riwayat Pengiriman
              </h3>
            </div>
            <button className="text-[10px] font-black text-white/20 hover:text-white transition-all uppercase tracking-[0.2em]">
              View Detailed Log
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white/[0.005] border border-white/[0.02] rounded-[32px]">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/20">
                <History size={24} />
              </div>
              <h4 className="text-sm font-bold text-white/60">
                Belum ada riwayat blast
              </h4>
              <p className="text-[11px] text-white/30 mt-1 max-w-[250px]">
                Kirim pesan WhatsApp massal pertama Anda untuk melihat statistik
                pengiriman di sini.
              </p>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/[0.04] text-[10px] font-black text-white/30 hover:text-white hover:bg-white/10 transition-all">
              Muat Lebih Banyak Riwayat
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
