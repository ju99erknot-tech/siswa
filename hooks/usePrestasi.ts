"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app.store";
import { toast } from "sonner";
import type { Prestasi } from "@/types";

export const PRESTASI_KEY = ["prestasi"] as const;

export function usePrestasi() {
  const supabase = createClient();
  const qc = useQueryClient();

  const {
    data: dataPrestasi = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: PRESTASI_KEY,
    queryFn: async (): Promise<Prestasi[]> => {
      const { data, error } = await supabase
        .from("prestasi")
        .select("*")
        .order("tanggal_lomba", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Prestasi[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const setDataPrestasi = useAppStore((s) => s.setDataPrestasi);
  useEffect(() => { if (dataPrestasi.length > 0) setDataPrestasi(dataPrestasi); }, [dataPrestasi, setDataPrestasi]);

  useEffect(() => {
    const ch = supabase
      .channel(`prestasi_changes_${Math.random().toString(36).substring(2, 9)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "prestasi" }, () => {
        qc.invalidateQueries({ queryKey: PRESTASI_KEY });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addPrestasi = useCallback(
    async (data: Omit<Prestasi, "id" | "created_at">): Promise<boolean> => {
      try {
        const { error } = await supabase.from("prestasi").insert({ ...data, created_at: new Date().toISOString() });
        if (error) throw error;
        toast.success("Prestasi berhasil ditambahkan!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const updatePrestasi = useCallback(
    async (id: string, data: Partial<Prestasi>): Promise<boolean> => {
      try {
        const { error } = await supabase.from("prestasi").update(data).eq("id", id);
        if (error) throw error;
        toast.success("Prestasi berhasil diperbarui!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const deletePrestasi = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase.from("prestasi").delete().eq("id", id);
        if (error) throw error;
        toast.success("Data prestasi dihapus");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  return { dataPrestasi, isLoading, refetch, addPrestasi, updatePrestasi, deletePrestasi };
}
