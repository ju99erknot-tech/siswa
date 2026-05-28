"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app.store";
import { toast } from "sonner";
import type { KapsulWaktu } from "@/types";

export const KAPSUL_WAKTU_KEY = ["kapsul_waktu"] as const;

export function useKapsulWaktu() {
  const supabase = createClient();
  const qc = useQueryClient();

  const {
    data: dataKapsulWaktu = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: KAPSUL_WAKTU_KEY,
    queryFn: async (): Promise<KapsulWaktu[]> => {
      const { data, error } = await supabase
        .from("kapsul_waktu")
        .select("*")
        .order("tanggal_momen", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as KapsulWaktu[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const setDataKapsulWaktu = useAppStore((s) => s.setDataKapsulWaktu);
  useEffect(() => { if (dataKapsulWaktu.length > 0) setDataKapsulWaktu(dataKapsulWaktu); }, [dataKapsulWaktu, setDataKapsulWaktu]);

  useEffect(() => {
    const ch = supabase
      .channel(`kapsul_waktu_changes_${Math.random().toString(36).substring(2, 9)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "kapsul_waktu" }, () => {
        qc.invalidateQueries({ queryKey: KAPSUL_WAKTU_KEY });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addKapsul = useCallback(
    async (data: Omit<KapsulWaktu, "id" | "created_at" | "updated_at">): Promise<boolean> => {
      try {
        const { error } = await supabase.from("kapsul_waktu").insert({ ...data, created_at: new Date().toISOString() });
        if (error) throw error;
        toast.success("Momen berhasil ditambahkan!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const updateKapsul = useCallback(
    async (id: string, data: Partial<KapsulWaktu>): Promise<boolean> => {
      try {
        const { error } = await supabase.from("kapsul_waktu").update(data).eq("id", id);
        if (error) throw error;
        toast.success("Momen berhasil diperbarui!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const deleteKapsul = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase.from("kapsul_waktu").delete().eq("id", id);
        if (error) throw error;
        toast.success("Momen dihapus");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  return { dataKapsulWaktu, isLoading, refetch, addKapsul, updateKapsul, deleteKapsul };
}
