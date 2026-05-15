"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Survei } from "@/types";

export const SURVEI_KEY = ["survei"] as const;

export function useSurvei() {
  const supabase = createClient();
  const qc = useQueryClient();

  const {
    data: dataSurvei = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: SURVEI_KEY,
    queryFn: async (): Promise<Survei[]> => {
      const { data, error } = await supabase
        .from("survei_kepuasan")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Survei[];
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const ch = supabase
      .channel(`survei_changes_${Math.random().toString(36).substring(2, 9)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "survei_kepuasan" }, () => {
        qc.invalidateQueries({ queryKey: SURVEI_KEY });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addSurvei = useCallback(
    async (data: Omit<Survei, "id" | "created_at">): Promise<boolean> => {
      try {
        const { error } = await supabase.from("survei_kepuasan").insert({ ...data, created_at: new Date().toISOString() });
        if (error) throw error;
        toast.success("Survei berhasil dikirim!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const deleteSurvei = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase.from("survei_kepuasan").delete().eq("id", id);
        if (error) throw error;
        toast.success("Data survei dihapus");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  return { dataSurvei, isLoading, refetch, addSurvei, deleteSurvei };
}
