"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app.store";
import { toast } from "sonner";
import type { PIP } from "@/types";

export const PIP_KEY = ["pip"] as const;

export function usePIP() {
  const supabase = createClient();
  const qc = useQueryClient();

  const {
    data: dataPIP = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: PIP_KEY,
    queryFn: async (): Promise<PIP[]> => {
      const { data, error } = await supabase
        .from("buku_pip")
        .select("*")
        .order("tahun", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as PIP[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const setDataPIP = useAppStore((s) => s.setDataPIP);
  useEffect(() => { if (dataPIP.length > 0) setDataPIP(dataPIP); }, [dataPIP, setDataPIP]);

  useEffect(() => {
    const ch = supabase
      .channel(`pip_changes_${Math.random().toString(36).substring(2, 9)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "buku_pip" }, () => {
        qc.invalidateQueries({ queryKey: PIP_KEY });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addPIP = useCallback(
    async (data: Omit<PIP, "id" | "created_at">): Promise<boolean> => {
      try {
        const { error } = await supabase.from("buku_pip").insert({ ...data, created_at: new Date().toISOString() });
        if (error) throw error;
        toast.success("Data PIP berhasil ditambahkan!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const updatePIP = useCallback(
    async (id: string, data: Partial<PIP>): Promise<boolean> => {
      try {
        const { error } = await supabase.from("buku_pip").update(data).eq("id", id);
        if (error) throw error;
        toast.success("Data PIP diperbarui!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const deletePIP = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase.from("buku_pip").delete().eq("id", id);
        if (error) throw error;
        toast.success("Data PIP dihapus");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  return { dataPIP, isLoading, refetch, addPIP, updatePIP, deletePIP };
}
