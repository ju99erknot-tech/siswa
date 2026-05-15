"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useAppStore } from "@/store/app.store";
import type { MasterKelas } from "@/types";

export const MASTER_KELAS_KEY = ["master_kelas"] as const;

export function useMasterKelas() {
  const supabase = createClient();
  const qc = useQueryClient();
  const setDataKelas = useAppStore((s) => s.setDataKelas);

  const {
    data: dataKelas = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: MASTER_KELAS_KEY,
    queryFn: async (): Promise<MasterKelas[]> => {
      const { data, error } = await supabase
        .from("master_kelas")
        .select("*")
        .order("tingkat", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as MasterKelas[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Sync to Zustand store
  useEffect(() => {
    if (dataKelas.length > 0) setDataKelas(dataKelas);
  }, [dataKelas, setDataKelas]);

  // Realtime subscription
  useEffect(() => {
    const ch = supabase
      .channel(
        `master_kelas_changes_${Math.random().toString(36).substring(2, 9)}`,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "master_kelas" },
        () => {
          qc.invalidateQueries({ queryKey: MASTER_KELAS_KEY });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addKelas = useCallback(
    async (data: Omit<MasterKelas, "id">): Promise<boolean> => {
      try {
        // 1. Cek duplikasi nama kelas
        const { data: existing } = await supabase
          .from("master_kelas")
          .select("id")
          .ilike("nama_kelas", data.nama_kelas)
          .maybeSingle();

        if (existing) {
          toast.error(
            `Kelas "${data.nama_kelas}" sudah ada! Silakan gunakan tombol Edit untuk mengubah Wali Kelas.`,
          );
          return false;
        }

        const { error } = await supabase.from("master_kelas").insert(data);
        if (error) throw error;
        toast.success("Kelas berhasil ditambahkan!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const updateKelas = useCallback(
    async (
      id: string,
      data: Partial<MasterKelas>,
      old_nama_kelas?: string,
    ): Promise<boolean> => {
      try {
        // 1. Cek duplikasi jika mencoba ganti nama kelas
        if (
          data.nama_kelas &&
          old_nama_kelas &&
          data.nama_kelas !== old_nama_kelas
        ) {
          const { data: existing } = await supabase
            .from("master_kelas")
            .select("id")
            .ilike("nama_kelas", data.nama_kelas)
            .maybeSingle();

          if (existing && existing.id !== id) {
            toast.error(`Nama kelas "${data.nama_kelas}" sudah terpakai!`);
            return false;
          }
        }

        // 2. Update data master kelas
        const { error } = await supabase
          .from("master_kelas")
          .update(data)
          .eq("id", id);
        if (error) throw error;

        // 3. CASCADE UPDATE ke tabel Siswa! (Sangat Penting)
        // Jika nama kelas berubah (misal dari "I A" ke "1A"), otomatis pindahkan semua siswanya ke "1A"
        let hasCascadeError = false;
        if (
          data.nama_kelas &&
          old_nama_kelas &&
          data.nama_kelas !== old_nama_kelas
        ) {
          const { error: cascadeError } = await supabase
            .from("siswa")
            .update({ kelas: data.nama_kelas })
            .eq("kelas", old_nama_kelas);

          if (cascadeError) {
            console.error("Gagal sinkronisasi siswa:", cascadeError);
            toast.warning(
              "Kelas diupdate, tapi gagal sinkronisasi data siswa.",
            );
            hasCascadeError = true;
          } else {
            toast.success(
              `Berhasil sinkronisasi siswa dari ${old_nama_kelas} ke ${data.nama_kelas}`,
            );
          }
        }

        if (!hasCascadeError) toast.success("Data kelas diperbarui!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const deleteKelas = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("master_kelas")
          .delete()
          .eq("id", id);
        if (error) throw error;
        toast.success("Kelas dihapus");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  return { dataKelas, isLoading, refetch, addKelas, updateKelas, deleteKelas };
}
