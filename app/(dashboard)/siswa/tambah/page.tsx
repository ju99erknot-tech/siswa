'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Loader2, GraduationCap } from 'lucide-react';
import type { Siswa } from '@/types';
import { useSiswa } from '@/hooks/useSiswa';
import SiswaForm from '@/components/siswa/SiswaForm';

export default function TambahSiswaPage() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { getSiswaById } = useSiswa();

  const [editData, setEditData] = useState<Siswa | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);

  // If ?edit=id is present, load the existing siswa data
  useEffect(() => {
    if (!editId) return;
    setIsLoadingEdit(true);
    getSiswaById(editId)
      .then((data) => setEditData(data))
      .catch(() => { /* will render add form if not found */ })
      .finally(() => setIsLoadingEdit(false));
  }, [editId, getSiswaById]);

  const isEditMode = Boolean(editId && editData);
  const pageTitle = isEditMode ? `Edit: ${editData?.nama ?? ''}` : 'Tambah Siswa Baru';

  return (
    <div className="min-h-screen p-6" style={{ background: '#050811' }}>
      <div className="max-w-5xl mx-auto">

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-5 mb-10"
        >
          <div
            className="w-14 h-14 rounded-[22px] flex items-center justify-center relative group"
            style={{
              background: 'rgba(124,58,237,0.05)',
              border: '1px solid rgba(124,58,237,0.15)',
            }}
          >
            <div className="absolute inset-0 bg-violet-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <GraduationCap className="w-7 h-7 text-violet-400 relative z-10" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white/90 uppercase tracking-wider">{pageTitle}</h1>
            <p className="text-[11px] font-medium text-white/20 uppercase tracking-[0.1em] mt-1">
              {isEditMode
                ? 'Sinkronisasi data buku induk digital'
                : 'Pendaftaran siswa baru ke dalam sistem basis data'}
            </p>
          </div>
        </motion.div>

        {/* Content */}
        {isLoadingEdit ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex items-center gap-3 text-white/40">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Memuat data siswa...</span>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SiswaForm
              mode={isEditMode ? 'edit' : 'tambah'}
              initialData={editData ?? undefined}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
