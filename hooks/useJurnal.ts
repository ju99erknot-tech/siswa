"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useAppStore } from "@/store/app.store";
import type { Jurnal } from "@/types";

export const JURNAL_KEY = ["jurnal"] as const;

export function useJurnal() {
  const supabase = createClient();
  const qc = useQueryClient();

  const {
    data: dataJurnal = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: JURNAL_KEY,
    queryFn: async (): Promise<Jurnal[]> => {
      const { data, error } = await supabase
        .from("jurnal_guru")
        .select("*")
        .order("tanggal", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Jurnal[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const setDataJurnal = useAppStore((s) => s.setDataJurnal);
  useEffect(() => {
    if (dataJurnal.length > 0) setDataJurnal(dataJurnal);
  }, [dataJurnal, setDataJurnal]);

  useEffect(() => {
    const ch = supabase
      .channel(`jurnal_changes_${Math.random().toString(36).substring(2, 9)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "jurnal_guru" }, () => {
        qc.invalidateQueries({ queryKey: JURNAL_KEY });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addJurnal = useCallback(
    async (data: Omit<Jurnal, "id" | "created_at">): Promise<boolean> => {
      try {
        const { error } = await supabase.from("jurnal_guru").insert({ ...data, created_at: new Date().toISOString() });
        if (error) throw error;
        toast.success("Jurnal berhasil ditambahkan!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const updateJurnal = useCallback(
    async (id: string, data: Partial<Jurnal>): Promise<boolean> => {
      try {
        const { error } = await supabase.from("jurnal_guru").update(data).eq("id", id);
        if (error) throw error;
        toast.success("Jurnal diperbarui!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const deleteJurnal = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase.from("jurnal_guru").delete().eq("id", id);
        if (error) throw error;
        toast.success("Jurnal dihapus");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  return { dataJurnal, isLoading, refetch, addJurnal, updateJurnal, deleteJurnal };
}
