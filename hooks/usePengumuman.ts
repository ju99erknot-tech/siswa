"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Pengumuman } from "@/types";

export const PENGUMUMAN_KEY = ["pengumuman"] as const;

export function usePengumuman() {
  const supabase = createClient();
  const qc = useQueryClient();

  const {
    data: dataPengumuman = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: PENGUMUMAN_KEY,
    queryFn: async (): Promise<Pengumuman[]> => {
      const { data, error } = await supabase
        .from("buku_pengumuman")
        .select("*")
        .order("tanggal", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Pengumuman[];
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const ch = supabase
      .channel(`pengumuman_changes_${Math.random().toString(36).substring(2, 9)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "buku_pengumuman" }, () => {
        qc.invalidateQueries({ queryKey: PENGUMUMAN_KEY });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addPengumuman = useCallback(
    async (data: Omit<Pengumuman, "id" | "created_at">): Promise<boolean> => {
      try {
        const { error } = await supabase.from("buku_pengumuman").insert({ ...data, created_at: new Date().toISOString() });
        if (error) throw error;
        toast.success("Pengumuman berhasil ditambahkan!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const updatePengumuman = useCallback(
    async (id: string, data: Partial<Pengumuman>): Promise<boolean> => {
      try {
        const { error } = await supabase.from("buku_pengumuman").update(data).eq("id", id);
        if (error) throw error;
        toast.success("Pengumuman diperbarui!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const deletePengumuman = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase.from("buku_pengumuman").delete().eq("id", id);
        if (error) throw error;
        toast.success("Pengumuman dihapus");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  return { dataPengumuman, isLoading, refetch, addPengumuman, updatePengumuman, deletePengumuman };
}
