"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useAppStore } from "@/store/app.store";
import type { MutasiMasuk, MutasiKeluar } from "@/types";

export const MUTASI_MASUK_KEY = ["mutasi_masuk"] as const;
export const MUTASI_KELUAR_KEY = ["mutasi_keluar"] as const;

export function useMutasi() {
  const supabase = createClient();
  const qc = useQueryClient();

  // ── Mutasi Masuk ──────────────────────────────────────────
  const {
    data: dataMasuk = [],
    isLoading: isLoadingMasuk,
    refetch: refetchMasuk,
  } = useQuery({
    queryKey: MUTASI_MASUK_KEY,
    queryFn: async (): Promise<MutasiMasuk[]> => {
      const { data, error } = await supabase
        .from("mutasi_masuk")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as MutasiMasuk[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // ── Mutasi Keluar ─────────────────────────────────────────
  const {
    data: dataKeluar = [],
    isLoading: isLoadingKeluar,
    refetch: refetchKeluar,
  } = useQuery({
    queryKey: MUTASI_KELUAR_KEY,
    queryFn: async (): Promise<MutasiKeluar[]> => {
      const { data, error } = await supabase
        .from("mutasi_keluar")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as MutasiKeluar[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const setDataMutasiMasuk = useAppStore((s) => s.setDataMutasiMasuk);
  const setDataMutasiKeluar = useAppStore((s) => s.setDataMutasiKeluar);

  useEffect(() => {
    if (dataMasuk.length > 0) setDataMutasiMasuk(dataMasuk);
  }, [dataMasuk, setDataMutasiMasuk]);

  useEffect(() => {
    if (dataKeluar.length > 0) setDataMutasiKeluar(dataKeluar);
  }, [dataKeluar, setDataMutasiKeluar]);

  // ── Realtime ──────────────────────────────────────────────
  useEffect(() => {
    const ch1 = supabase
      .channel(`mutasi_masuk_changes_${Math.random().toString(36).substring(2, 9)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "mutasi_masuk" }, () => {
        qc.invalidateQueries({ queryKey: MUTASI_MASUK_KEY });
      })
      .subscribe();
    const ch2 = supabase
      .channel(`mutasi_keluar_changes_${Math.random().toString(36).substring(2, 9)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "mutasi_keluar" }, () => {
        qc.invalidateQueries({ queryKey: MUTASI_KELUAR_KEY });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── CRUD Masuk ────────────────────────────────────────────
  const addMutasiMasuk = useCallback(
    async (data: Omit<MutasiMasuk, "id" | "created_at">): Promise<boolean> => {
      try {
        const { error } = await supabase.from("mutasi_masuk").insert({
          ...data,
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
        toast.success("Mutasi masuk berhasil dicatat");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const updateMutasiMasuk = useCallback(
    async (id: string, data: Partial<MutasiMasuk>): Promise<boolean> => {
      try {
        const { error } = await supabase.from("mutasi_masuk").update(data).eq("id", id);
        if (error) throw error;
        toast.success("Data mutasi masuk diperbarui!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const deleteMutasiMasuk = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase.from("mutasi_masuk").delete().eq("id", id);
        if (error) throw error;
        toast.success("Data mutasi masuk dihapus");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  // ── CRUD Keluar ───────────────────────────────────────────
  const addMutasiKeluar = useCallback(
    async (data: Omit<MutasiKeluar, "id" | "created_at">): Promise<boolean> => {
      try {
        const { error } = await supabase.from("mutasi_keluar").insert({
          ...data,
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
        toast.success("Mutasi keluar berhasil dicatat");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const updateMutasiKeluar = useCallback(
    async (id: string, data: Partial<MutasiKeluar>): Promise<boolean> => {
      try {
        const { error } = await supabase.from("mutasi_keluar").update(data).eq("id", id);
        if (error) throw error;
        toast.success("Data mutasi keluar diperbarui!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const deleteMutasiKeluar = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase.from("mutasi_keluar").delete().eq("id", id);
        if (error) throw error;
        toast.success("Data mutasi keluar dihapus");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  return {
    dataMasuk,
    dataKeluar,
    isLoadingMasuk,
    isLoadingKeluar,
    refetchMasuk,
    refetchKeluar,
    addMutasiMasuk,
    updateMutasiMasuk,
    deleteMutasiMasuk,
    addMutasiKeluar,
    updateMutasiKeluar,
    deleteMutasiKeluar,
  };
}
