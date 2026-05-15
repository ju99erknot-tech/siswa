"use client";

import Link from "next/link";
import { 
  Tag, Contact, CreditCard, FileStack, ClipboardCheck, 
  ScrollText, PenTool, QrCode, ImageIcon as LucideImage, MapPin, FileImage, LayoutGrid 
} from "lucide-react";
import { motion } from "framer-motion";
import { uiSound } from "@/lib/audio";

const tools = [
  { label: "Label Meja", href: "/utility/label-meja", icon: Tag, desc: "Cetak label meja untuk ujian atau kegiatan" },
  { label: "ID Card", href: "/utility/id-card", icon: Contact, desc: "Generator ID card untuk guru dan panitia" },
  { label: "Kartu Pelajar", href: "/utility/kartu-pelajar", icon: CreditCard, desc: "Cetak kartu pelajar siswa" },
  { label: "Cover Gen", href: "/utility/cover", icon: FileStack, desc: "Buat cover dokumen dan perangkat pembelajaran" },
  { label: "Label Map", href: "/utility/label-arsip", icon: ClipboardCheck, desc: "Pembuat label untuk map arsip / administrasi" },
  { label: "Sampul Rapor", href: "/utility/label-rapor", icon: ScrollText, desc: "Desain sampul identitas untuk rapor siswa" },
  { label: "Tanda Terima", href: "/utility/tanda-terima", icon: PenTool, desc: "Cetak form tanda terima dokumen/barang" },
  { label: "Blanko Tabel", href: "/utility/tabel-custom", icon: LayoutGrid, desc: "Generator tabel kosong kustom (daftar hadir, nilai, dll)" },
  { label: "QR Generator", href: "/utility/qr-code", icon: QrCode, desc: "Buat QR code kustom untuk berbagai keperluan" },
  { label: "Album Lulus", href: "/utility/album", icon: LucideImage, desc: "Kompilasi dan cetak album kelulusan siswa" },
  { label: "e-SPPD", href: "/utility/sppd", icon: CreditCard, desc: "Generator Surat Perintah Perjalanan Dinas" },
  { label: "Peta SPMB", href: "/utility/peta-spmb", icon: MapPin, desc: "Peta zonasi dan pendaftar murid baru" },
  { label: "Upload Foto", href: "/utility/upload-foto", icon: FileImage, desc: "Batch upload pas foto siswa untuk sistem" },
];

export default function UtilityPage() {
  return (
    <div className="p-4 md:p-6 space-y-6 pb-24 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Alat Bantu</h1>
        <p className="text-white/60 text-sm max-w-2xl">
          Kumpulan utilitas dan generator untuk mempermudah berbagai pekerjaan administrasi sekolah Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tools.map((tool, idx) => (
          <Link href={tool.href} key={idx} onClick={() => uiSound.playClick()}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col h-full hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 mb-4 bg-violet-500/10 text-violet-400 rounded-xl flex items-center justify-center group-hover:bg-violet-500 group-hover:text-white transition-colors group-hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                <tool.icon size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold mb-2 tracking-tight group-hover:text-violet-200 transition-colors">{tool.label}</h3>
                <p className="text-white/40 text-[13px] leading-relaxed">
                  {tool.desc}
                </p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
