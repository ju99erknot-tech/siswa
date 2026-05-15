"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Rapor, CatatanRapor } from "@/types";

export const RAPOR_KEY = ["rapor"] as const;
export const CATATAN_RAPOR_KEY = ["catatan_rapor"] as const;

export function useRapor() {
  const supabase = createClient();
  const qc = useQueryClient();

  // ── Leger Rapor ──────────────────────────────────────────
  const {
    data: dataRapor = [],
    isLoading: isLoadingRapor,
    refetch: refetchRapor,
  } = useQuery({
    queryKey: RAPOR_KEY,
    queryFn: async (): Promise<Rapor[]> => {
      const { data, error } = await supabase
        .from("leger_rapor")
        .select("*")
        .order("nisn", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as Rapor[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // ── Catatan Rapor ────────────────────────────────────────
  const {
    data: dataCatatanRapor = [],
    isLoading: isLoadingCatatan,
    refetch: refetchCatatan,
  } = useQuery({
    queryKey: CATATAN_RAPOR_KEY,
    queryFn: async (): Promise<CatatanRapor[]> => {
      const { data, error } = await supabase
        .from("catatan_rapor")
        .select("*")
        .order("nisn", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as CatatanRapor[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // ── Realtime ─────────────────────────────────────────────
  useEffect(() => {
    const ch1 = supabase
      .channel(`rapor_changes_${Math.random().toString(36).substring(2, 9)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leger_rapor" },
        () => {
          qc.invalidateQueries({ queryKey: RAPOR_KEY });
        },
      )
      .subscribe();
    const ch2 = supabase
      .channel(
        `catatan_rapor_changes_${Math.random().toString(36).substring(2, 9)}`,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "catatan_rapor" },
        () => {
          qc.invalidateQueries({ queryKey: CATATAN_RAPOR_KEY });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── CRUD Leger Rapor ─────────────────────────────────────
  const addRapor = useCallback(
    async (data: Omit<Rapor, "id" | "created_at">): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("leger_rapor")
          .insert({ ...data, created_at: new Date().toISOString() });
        if (error) throw error;
        toast.success("Nilai rapor berhasil ditambahkan!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const updateRapor = useCallback(
    async (id: string, data: Partial<Rapor>): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("leger_rapor")
          .update(data)
          .eq("id", id);
        if (error) throw error;
        toast.success("Nilai rapor diperbarui!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const deleteRapor = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("leger_rapor")
          .delete()
          .eq("id", id);
        if (error) throw error;
        toast.success("Nilai rapor dihapus");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  // ── CRUD Catatan Rapor ───────────────────────────────────
  const addCatatanRapor = useCallback(
    async (data: Omit<CatatanRapor, "id" | "created_at">): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("catatan_rapor")
          .insert({ ...data, created_at: new Date().toISOString() });
        if (error) throw error;
        toast.success("Catatan rapor berhasil ditambahkan!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const updateCatatanRapor = useCallback(
    async (id: string, data: Partial<CatatanRapor>): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("catatan_rapor")
          .update(data)
          .eq("id", id);
        if (error) throw error;
        toast.success("Catatan rapor diperbarui!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  // ── Bulk import rapor (banyak nilai sekaligus) ───────────
  const importRaporBulk = useCallback(
    async (
      rows: Partial<Rapor>[],
    ): Promise<{ success: number; errors: number }> => {
      try {
        const { error } = await supabase
          .from("leger_rapor")
          .upsert(rows, { onConflict: "nisn,mapel,semester" });
        if (error) throw error;
        await qc.invalidateQueries({ queryKey: ["rapor"] });
        return { success: rows.length, errors: 0 };
      } catch (err: unknown) {
        toast.error("Gagal import: " + (err as Error).message);
        return { success: 0, errors: rows.length };
      }
    },
    [supabase, qc],
  );

  // ── Delete Catatan Rapor ─────────────────────────────────
  const deleteCatatanRapor = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("catatan_rapor")
          .delete()
          .eq("id", id);
        if (error) throw error;
        toast.success("Catatan rapor dihapus");
        await qc.invalidateQueries({ queryKey: CATATAN_RAPOR_KEY });
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase, qc],
  );

  return {
    dataRapor,
    dataCatatanRapor,
    isLoading: isLoadingRapor || isLoadingCatatan,
    refetchRapor,
    refetchCatatan,
    addRapor,
    updateRapor,
    deleteRapor,
    addCatatanRapor,
    updateCatatanRapor,
    deleteCatatanRapor,
    importRaporBulk,
  };
}
