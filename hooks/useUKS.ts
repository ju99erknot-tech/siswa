"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app.store";
import { toast } from "sonner";
import type { UKS } from "@/types";

export const UKS_KEY = ["uks"] as const;

export function useUKS() {
  const supabase = createClient();
  const qc = useQueryClient();

  const {
    data: dataUKS = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: UKS_KEY,
    queryFn: async (): Promise<UKS[]> => {
      const { data, error } = await supabase
        .from("buku_uks")
        .select("*")
        .order("tanggal", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((u: any) => ({
        ...u,
        lingkar_kepala: u.lingkar_kepala || u.tekanan_darah || "",
      })) as UKS[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const setDataUKS = useAppStore((s) => s.setDataUKS);
  useEffect(() => {
    if (dataUKS.length > 0) setDataUKS(dataUKS);
  }, [dataUKS, setDataUKS]);

  useEffect(() => {
    const ch = supabase
      .channel(`uks_changes_${Math.random().toString(36).substring(2, 9)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "buku_uks" },
        () => {
          qc.invalidateQueries({ queryKey: UKS_KEY });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addUKS = useCallback(
    async (data: Omit<UKS, "id" | "created_at">): Promise<boolean> => {
      try {
        // Map to DB columns (tekanan_darah for backward compatibility if needed)
        const dbData = {
          ...data,
          tekanan_darah: (data as any).lingkar_kepala, // Simpan ke kolom lama jika kolom baru belum ada
        };
        const { error } = await supabase
          .from("buku_uks")
          .insert({ ...dbData, created_at: new Date().toISOString() });
        if (error) throw error;

        // SYNC BALIK KE BUKU INDUK
        if (data.nisn) {
          await supabase
            .from("siswa")
            .update({
              tinggi_badan: data.tinggi,
              berat_badan: data.berat,
              lingkar_kepala: data.lingkar_kepala,
              updated_at: new Date().toISOString(),
            })
            .eq("nisn", data.nisn);
          // Invalidate siswa cache
          qc.invalidateQueries({ queryKey: ["siswa"] });
        }

        toast.success(
          "✅ Data UKS berhasil ditambahkan & disinkronkan ke Buku Induk!",
        );
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase, qc],
  );

  const updateUKS = useCallback(
    async (id: string, data: Partial<UKS>): Promise<boolean> => {
      try {
        const dbData = { ...data } as any;
        if (data.lingkar_kepala) dbData.tekanan_darah = data.lingkar_kepala;

        const { error } = await supabase
          .from("buku_uks")
          .update(dbData)
          .eq("id", id);
        if (error) throw error;

        // SYNC BALIK KE BUKU INDUK JIKA ADA NISN
        const record = dataUKS.find((u) => u.id === id);
        if (record?.nisn) {
          await supabase
            .from("siswa")
            .update({
              tinggi_badan: data.tinggi || record.tinggi,
              berat_badan: data.berat || record.berat,
              lingkar_kepala: data.lingkar_kepala || record.lingkar_kepala,
              updated_at: new Date().toISOString(),
            })
            .eq("nisn", record.nisn);
          qc.invalidateQueries({ queryKey: ["siswa"] });
        }

        toast.success("Data UKS diperbarui & disinkronkan!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase, dataUKS, qc],
  );

  const deleteUKS = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase.from("buku_uks").delete().eq("id", id);
        if (error) throw error;
        toast.success("Data UKS dihapus");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  return { dataUKS, isLoading, refetch, addUKS, updateUKS, deleteUKS };
}
