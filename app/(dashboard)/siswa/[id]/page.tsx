"use client";

import { useSiswa } from "@/hooks/useSiswa";
import { SiswaDetail360 } from "@/components/siswa/SiswaDetail360";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SiswaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data, isLoading } = useSiswa();

  const siswa = data.find((s) => s.id === id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (!siswa) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-white mb-2">Siswa Tidak Ditemukan</h2>
        <p className="text-slate-400 mb-6">Data siswa dengan ID tersebut tidak ada di database.</p>
        <button onClick={() => router.push("/siswa")} className="px-4 py-2 bg-violet-600 text-white rounded-xl">Kembali ke Data Siswa</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <Link href="/siswa" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Buku Induk
        </Link>
      </motion.div>
      <SiswaDetail360 siswa={siswa} onClose={() => router.push("/siswa")} />
    </div>
  );
}
