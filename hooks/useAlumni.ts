"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app.store";
import { toast } from "sonner";
import type { Alumni } from "@/types";

export const ALUMNI_KEY = ["alumni"] as const;

// Stable empty array to prevent new reference on every render when data is undefined
const EMPTY_ALUMNI: Alumni[] = [];

const CASCADE_TABLES = [
  "buku_izin",
  "buku_uks",
  "buku_eskul",
  "leger_rapor",
  "catatan_rapor",
  "buku_prestasi",
  "buku_pip",
] as const;

export function useAlumni() {
  const supabase = createClient();
  const qc = useQueryClient();

  const {
    data: rawAlumni,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ALUMNI_KEY,
    queryFn: async (): Promise<Alumni[]> => {
      const { data, error } = await supabase
        .from("alumni")
        .select("*")
        .order("nama", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as Alumni[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Use stable reference: rawAlumni ?? EMPTY_ALUMNI avoids new [] on every render
  const dataAlumni = rawAlumni ?? EMPTY_ALUMNI;

  const setDataAlumni = useAppStore((s) => s.setDataAlumni);
  useEffect(() => {
    setDataAlumni(dataAlumni);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataAlumni]);

  useEffect(() => {
    const ch = supabase
      .channel(`alumni_changes_${Math.random().toString(36).substring(2, 9)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alumni" },
        () => {
          qc.invalidateQueries({ queryKey: ALUMNI_KEY });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addAlumni = useCallback(
    async (data: Omit<Alumni, "id" | "created_at">): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("alumni")
          .insert({ ...data, created_at: new Date().toISOString() });
        if (error) throw error;
        toast.success("Alumni berhasil ditambahkan!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const updateAlumni = useCallback(
    async (id: string, data: Partial<Alumni>): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("alumni")
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
        toast.success("Data alumni diperbarui!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const deleteAlumni = useCallback(
    async (id: string, nisn?: string): Promise<boolean> => {
      try {
        // Cascade delete: hapus data terkait di tabel lain berdasarkan NISN
        if (nisn) {
          for (const table of CASCADE_TABLES) {
            await supabase.from(table).delete().eq("nisn", nisn);
          }
        }
        const { error } = await supabase.from("alumni").delete().eq("id", id);
        if (error) throw error;
        toast.success(
          "🗑️ Data alumni & rekam jejak terkait dihapus. Tekan Ctrl+Z untuk batalkan.",
        );
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  return {
    dataAlumni,
    isLoading,
    refetch,
    addAlumni,
    updateAlumni,
    deleteAlumni,
  };
}
