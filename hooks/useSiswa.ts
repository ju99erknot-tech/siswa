"use client";

// ============================================================
// useSiswa — Portal Kesiswaan SDN 02 CIBADAK
// TanStack Query (caching + realtime) + Zustand (filter state)
// ============================================================

import { useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app.store";
import { toast } from "sonner";
import type { Siswa, SiswaInsert, SiswaUpdate } from "@/types";

// ── Query Key ────────────────────────────────────────────────
export const SISWA_QUERY_KEY = ["siswa"] as const;

// ── Types ────────────────────────────────────────────────────
export interface ImportBulkResult {
  success: number;
  errors: Array<{ row: number; nisn?: string; message: string }>;
}

// Cascade delete tables (matching siswa.xml hapusData)
const CASCADE_TABLES = ["buku_izin", "buku_uks", "buku_eskul", "leger_rapor", "catatan_rapor", "buku_prestasi", "buku_pip"] as const;

// Valid fields for Supabase upsert to avoid "column does not exist" errors
const VALID_SISWA_FIELDS = [
  "nama", "nisn", "nis", "nik", "no_kk", "no_akta", "tempat_lahir", "tanggal_lahir",
  "jk", "agama", "kebutuhan_khusus", "jml_saudara", "anak_ke", "foto_url",
  "alamat", "rt", "rw", "kode_pos", "dusun", "kelurahan", "kecamatan",
  "lintang", "bujur", "jenis_tinggal", "alat_transportasi", "telepon", "no_wa", "email", "jarak_rumah", "jarak_sekolah",
  "nama_ayah", "nik_ayah", "tahun_lahir_ayah", "pendidikan_ayah", "pekerjaan_ayah", "penghasilan_ayah",
  "nama_ibu", "nik_ibu", "tahun_lahir_ibu", "pendidikan_ibu", "pekerjaan_ibu", "penghasilan_ibu",
  "nama_wali", "nik_wali", "tahun_lahir_wali", "pendidikan_wali", "pekerjaan_wali", "penghasilan_wali", "hub_keluarga_wali",
  "kelas", "asal_sekolah", "no_peserta_un", "no_ijazah", "skhun", "tahun_masuk", "status_siswa",
  "berat_badan", "tinggi_badan", "lingkar_kepala", "gol_darah", "penyakit_khusus", "layanan_khusus",
  "penerima_kps", "no_kps", "penerima_kip", "no_kip", "nama_kip", "layak_pip", "alasan_pip", "no_kks", "bank", "no_rekening", "nama_rekening"
];

// Helper function to delete photo from Supabase storage
const deletePhotoFromStorage = async (fotoUrl: string | null | undefined): Promise<void> => {
  if (!fotoUrl) return;
  
  // Only delete Supabase storage URLs, not Google Drive URLs
  if (!fotoUrl.includes('supabase.co/storage/v1/object/public/avatars')) {

    return;
  }
  
  try {
    // Extract file path from Supabase URL
    // Format: https://[project].supabase.co/storage/v1/object/public/avatars/[path]
    const urlParts = fotoUrl.split('/avatars/');
    if (urlParts.length < 2) {

      return;
    }
    
    const filePath = urlParts[1];

    
    const supabase = createClient();
    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);
      
    if (error) {
      console.error('[STORAGE] Failed to delete file:', error);
    } else {

    }
  } catch (error) {
    console.error('[STORAGE] Error deleting photo:', error);
  }
};

// ── Hook ─────────────────────────────────────────────────────
export function useSiswa() {
  const supabase = createClient();
  const qc = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const { filterSiswa } = useAppStore();

  // ── Fetch ─────────────────────────────────────────────────
  const {
    data: dataSiswa = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: SISWA_QUERY_KEY,
    queryFn: async (): Promise<Siswa[]> => {
      const { data, error } = await supabase
        .from("siswa")
        .select("*")
        .order("nama", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as Siswa[];
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });

  // ── Sync to global store so ALL pages can access dataSiswa ──
  const setDataSiswa = useAppStore((s) => s.setDataSiswa);
  useEffect(() => {
    if (dataSiswa.length > 0) {
      setDataSiswa(dataSiswa);
    }
  }, [dataSiswa, setDataSiswa]);

  // ── Realtime ──────────────────────────────────────────────
  useEffect(() => {
    const channelId = `siswa-changes-${Math.random().toString(36).substring(2, 9)}`;
    
    channelRef.current = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "siswa" },
        (payload) => {
          qc.setQueryData(
            SISWA_QUERY_KEY,
            (old: Siswa[] | undefined): Siswa[] => {
              if (!old) return [];
              if (payload.eventType === "INSERT") {
                return [...old, payload.new as Siswa].sort((a, b) =>
                  a.nama.localeCompare(b.nama, "id"),
                );
              }
              if (payload.eventType === "UPDATE") {
                return old.map((s) =>
                  s.id === (payload.new as Siswa).id
                    ? (payload.new as Siswa)
                    : s,
                );
              }
              if (payload.eventType === "DELETE") {
                return old.filter(
                  (s) => s.id !== (payload.old as { id: string }).id,
                );
              }
              return old;
            },
          );
        },
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Local filter (Zustand state) — Smart Search like siswa.xml ──
  const filteredData = dataSiswa.filter((s) => {
    const matchKelas =
      filterSiswa.kelas === "all" || s.kelas === filterSiswa.kelas;
    const matchJK = filterSiswa.jk === "all" || s.jk === filterSiswa.jk;
    const q = filterSiswa.search.toLowerCase();
    // Smart search: cari di seluruh field (seperti siswa.xml getFilteredData)
    const matchSearch =
      !q || JSON.stringify(s).toLowerCase().includes(q);
    return matchKelas && matchJK && matchSearch;
  });

  // ── CRUD ─────────────────────────────────────────────────

  const addSiswa = useCallback(
    async (data: SiswaInsert): Promise<boolean> => {
      try {
        const { error } = await supabase.from("siswa").insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
        toast.success("Siswa berhasil ditambahkan!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal menyimpan: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const updateSiswa = useCallback(
    async (id: string, data: SiswaUpdate): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("siswa")
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
        toast.success("Data siswa berhasil diperbarui!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal memperbarui: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  // Cascade delete: hapus siswa + semua data terkait (matching siswa.xml hapusData)
  const deleteSiswa = useCallback(
    async (id: string, nama: string): Promise<boolean> => {
      try {
        // Cari data siswa untuk cascade delete dan hapus foto
        const siswa = dataSiswa.find((s) => s.id === id);
        
        // Hapus foto dari storage jika ada
        if (siswa?.foto_url) {
          await deletePhotoFromStorage(siswa.foto_url);
        }
        
        if (siswa?.nisn) {
          for (const table of CASCADE_TABLES) {
            await supabase.from(table).delete().eq("nisn", siswa.nisn);
          }
          // Hapus juga berdasarkan siswa_id untuk rapor/catatan
          await supabase.from("leger_rapor").delete().eq("siswa_id", id);
          await supabase.from("catatan_rapor").delete().eq("siswa_id", id);
        }
        const { error } = await supabase.from("siswa").delete().eq("id", id);
        if (error) throw error;
        toast.success(`"${nama}" & rekam jejak terkait dihapus. Tekan Ctrl+Z untuk batalkan.`);
        return true;
      } catch (err: unknown) {
        toast.error("Gagal menghapus: " + (err as Error).message);
        return false;
      }
    },
    [supabase, dataSiswa],
  );

  const deleteBulk = useCallback(
    async (ids: string[]): Promise<boolean> => {
      try {
        // Kumpulkan data siswa untuk hapus foto dan NISN
        const siswaData = ids
          .map((id) => dataSiswa.find((s) => s.id === id))
          .filter(Boolean) as Siswa[];

        // Hapus foto dari storage untuk semua siswa yang dihapus
        for (const siswa of siswaData) {
          if (siswa.foto_url) {
            await deletePhotoFromStorage(siswa.foto_url);
          }
        }

        // Kumpulkan semua NISN untuk bulk cascade delete
        const nisns = siswaData
          .map((s) => s.nisn)
          .filter(Boolean) as string[];

        // Cascade delete ke tabel terkait menggunakan .in() (Sangat cepat O(T) bukan O(N*T))
        if (nisns.length > 0) {
          for (const table of CASCADE_TABLES) {
            await supabase.from(table).delete().in("nisn", nisns);
          }
        }
        
        // Hapus juga untuk tabel yg menggunakan siswa_id
        await supabase.from("leger_rapor").delete().in("siswa_id", ids);
        await supabase.from("catatan_rapor").delete().in("siswa_id", ids);

        const { error } = await supabase.from("siswa").delete().in("id", ids);
        if (error) throw error;
        toast.success(`${ids.length} siswa & data terkait berhasil dihapus`);
        return true;
      } catch (err: unknown) {
        toast.error("Gagal menghapus: " + (err as Error).message);
        return false;
      }
    },
    [supabase, dataSiswa],
  );

  const naikKelasBulk = useCallback(
    async (ids: string[], kelasTarget: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("siswa")
          .update({ kelas: kelasTarget, updated_at: new Date().toISOString() })
          .in("id", ids);
        if (error) throw error;
        toast.success(
          `🎓 ${ids.length} siswa dipindah ke kelas ${kelasTarget}`,
        );
        return true;
      } catch (err: unknown) {
        toast.error("Gagal naik kelas: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const importBulk = useCallback(
    async (rows: Partial<Siswa>[]): Promise<ImportBulkResult> => {
      const result: ImportBulkResult = { success: 0, errors: [] };
      const batchSize = 100;
      
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        try {
          const { error } = await supabase.from("siswa").upsert(
            batch.map((r, idx) => {
              const salt = Math.random().toString(36).substring(2, 6).toUpperCase();
              const deterministicNisn = `TMP-${(r.nama || "X").replace(/[^A-Za-z0-9]/g, "").substring(0, 4).toUpperCase()}-${(r.tanggal_lahir || "0000").replace(/[^0-9]/g, "").substring(0, 4)}-${salt}`;
              const tempNisn = r.nisn || deterministicNisn;
              
              // Filter only valid Siswa fields to avoid Supabase errors with extra fields like status_validasi
              const cleanData: any = {};
              VALID_SISWA_FIELDS.forEach(field => {
                if ((r as any)[field] !== undefined) {
                  cleanData[field] = (r as any)[field];
                }
              });
              
              return {
                ...cleanData,
                nisn: tempNisn,
                jk: r.jk || "L",
                nama: r.nama || "Tanpa Nama",
                updated_at: new Date().toISOString(),
              };
            }),
            { 
              onConflict: "nisn", 
              ignoreDuplicates: false 
            },
          );

          if (error) {
            for (let j = 0; j < batch.length; j++) {
              const singleRow = batch[j];
              const salt = Math.random().toString(36).substring(2, 6).toUpperCase();
              const deterministicNisn = `TMP-${(singleRow.nama || "X").replace(/[^A-Za-z0-9]/g, "").substring(0, 4).toUpperCase()}-${(singleRow.tanggal_lahir || "0000").replace(/[^0-9]/g, "").substring(0, 4)}-${salt}`;
              const tempNisn = singleRow.nisn || deterministicNisn;
              
              const cleanSingleData: any = {};
              VALID_SISWA_FIELDS.forEach(field => {
                if ((singleRow as any)[field] !== undefined) {
                  cleanSingleData[field] = (singleRow as any)[field];
                }
              });
              
              const { error: singleError } = await supabase.from("siswa").upsert(
                { 
                  ...cleanSingleData, 
                  nisn: tempNisn,
                  jk: singleRow.jk || "L",
                  nama: singleRow.nama || "Tanpa Nama",
                  updated_at: new Date().toISOString() 
                },
                { onConflict: "nisn" }
              );
              
              if (singleError) {
                result.errors.push({
                  row: i + j + 1,
                  nisn: singleRow.nisn,
                  message: singleError.message,
                });
              } else {
                result.success += 1;
              }
            }
          } else {
            result.success += batch.length;
          }
        } catch (err: unknown) {
          result.errors.push({
            row: i + 1,
            message: err instanceof Error ? err.message : "Unknown error during batch import",
          });
        }
      }
      
      if (result.success > 0) {
        await qc.invalidateQueries({ queryKey: SISWA_QUERY_KEY });
      }
      return result;
    },
    [supabase, qc],
  );

  const getSiswaById = useCallback(
    async (id: string): Promise<Siswa | null> => {
      const { data } = await supabase
        .from("siswa")
        .select("*")
        .eq("id", id)
        .single();
      return data as Siswa | null;
    },
    [supabase],
  );

  const getSiswaByNisn = useCallback(
    async (nisn: string): Promise<Siswa | null> => {
      const { data } = await supabase
        .from("siswa")
        .select("*")
        .eq("nisn", nisn)
        .single();
      return data as Siswa | null;
    },
    [supabase],
  );

  return {
    data: dataSiswa,
    filteredData,
    isLoading,
    error: error as Error | null,
    refetch,
    addSiswa,
    updateSiswa,
    deleteSiswa,
    deleteBulk,
    naikKelasBulk,
    importBulk,
    getSiswaById,
    getSiswaByNisn,
  };
}
