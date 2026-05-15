"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useAppStore } from "@/store/app.store";
import type { Eskul } from "@/types";

export const ESKUL_KEY = ["eskul"] as const;

export function useEskul() {
  const supabase = createClient();
  const qc = useQueryClient();

  const {
    data: dataEskul = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ESKUL_KEY,
    queryFn: async (): Promise<Eskul[]> => {
      const { data, error } = await supabase
        .from("buku_eskul")
        .select("*")
        .order("nama_eskul", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as Eskul[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const setDataEskul = useAppStore((s) => s.setDataEskul);
  useEffect(() => {
    if (dataEskul.length > 0) setDataEskul(dataEskul);
  }, [dataEskul, setDataEskul]);

  useEffect(() => {
    const ch = supabase
      .channel(`eskul_changes_${Math.random().toString(36).substring(2, 9)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "buku_eskul" }, () => {
        qc.invalidateQueries({ queryKey: ESKUL_KEY });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addEskul = useCallback(
    async (data: Omit<Eskul, "id" | "created_at">): Promise<boolean> => {
      try {
        const { error } = await supabase.from("buku_eskul").insert({ ...data, created_at: new Date().toISOString() });
        if (error) throw error;
        toast.success("Data eskul berhasil ditambahkan!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const updateEskul = useCallback(
    async (id: string, data: Partial<Eskul>): Promise<boolean> => {
      try {
        const { error } = await supabase.from("buku_eskul").update(data).eq("id", id);
        if (error) throw error;
        toast.success("Data eskul diperbarui!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const deleteEskul = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase.from("buku_eskul").delete().eq("id", id);
        if (error) throw error;
        toast.success("Data eskul dihapus");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  return { dataEskul, isLoading, refetch, addEskul, updateEskul, deleteEskul };
}
