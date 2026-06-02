"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { SpmbSmp } from "@/types";

export const SPMB_KEY = ["spmb"] as const;

export function useSpmb() {
  const supabase = createClient();
  const qc = useQueryClient();

  const {
    data: dataSpmb = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: SPMB_KEY,
    queryFn: async (): Promise<SpmbSmp[]> => {
      // Kita ambil data spmb sekaligus melakukan join ke tabel siswa
      // Agar kita bisa melihat nama, nisn, dan file kk/akta dari buku induk
      const { data, error } = await supabase
        .from("spmb_smp")
        .select(
          `
          *,
          siswa:siswa_id (
            id, nama, nisn, jk, kelas,
            url_kk, url_akta,
            nama_ayah, nama_ibu,
            no_wa, telepon
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as SpmbSmp[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const updateStatusSpmb = useCallback(
    async (
      id: string,
      status: string,
      catatan_guru?: string,
    ): Promise<boolean> => {
      try {
        const updatePayload: any = {
          status,
          updated_at: new Date().toISOString(),
        };
        if (catatan_guru !== undefined)
          updatePayload.catatan_guru = catatan_guru;
        const { error } = await supabase
          .from("spmb_smp")
          .update(updatePayload)
          .eq("id", id);

        if (error) throw error;
        toast.success("Status SPMB berhasil diperbarui!");
        qc.invalidateQueries({ queryKey: SPMB_KEY });
        return true;
      } catch (err: unknown) {
        toast.error("Gagal update status: " + (err as Error).message);
        return false;
      }
    },
    [supabase, qc],
  );

  return { dataSpmb, isLoading, refetch, updateStatusSpmb };
}
