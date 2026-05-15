"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Agenda } from "@/types";

export const AGENDA_KEY = ["agenda"] as const;

export function useAgenda() {
  const supabase = createClient();
  const qc = useQueryClient();

  const {
    data: dataAgenda = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: AGENDA_KEY,
    queryFn: async (): Promise<Agenda[]> => {
      const { data, error } = await supabase
        .from("buku_agenda")
        .select("*")
        .order("tanggal", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Agenda[];
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const ch = supabase
      .channel(`agenda_changes_${Math.random().toString(36).substring(2, 9)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "buku_agenda" }, () => {
        qc.invalidateQueries({ queryKey: AGENDA_KEY });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addAgenda = useCallback(
    async (data: Omit<Agenda, "id" | "created_at">): Promise<boolean> => {
      try {
        const { error } = await supabase.from("buku_agenda").insert({ ...data, created_at: new Date().toISOString() });
        if (error) throw error;
        toast.success("Agenda berhasil ditambahkan!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const updateAgenda = useCallback(
    async (id: string, data: Partial<Agenda>): Promise<boolean> => {
      try {
        const { error } = await supabase.from("buku_agenda").update(data).eq("id", id);
        if (error) throw error;
        toast.success("Agenda diperbarui!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const deleteAgenda = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase.from("buku_agenda").delete().eq("id", id);
        if (error) throw error;
        toast.success("Agenda dihapus");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  return { dataAgenda, isLoading, refetch, addAgenda, updateAgenda, deleteAgenda };
}
