"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useAppStore } from "@/store/app.store";
import type { Guru } from "@/types";

export const GURU_KEY = ["guru"] as const;

export function useGuru() {
  const supabase = createClient();
  const qc = useQueryClient();
  const setDataGuru = useAppStore((s) => s.setDataGuru);

  const {
    data: dataGuru = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: GURU_KEY,
    queryFn: async (): Promise<Guru[]> => {
      const { data, error } = await supabase
        .from("guru")
        .select("*, vault:vault_guru(*)")
        .order("nama", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as Guru[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Sync to Zustand store
  useEffect(() => {
    if (dataGuru.length > 0) setDataGuru(dataGuru);
  }, [dataGuru, setDataGuru]);

  // Realtime subscription
  useEffect(() => {
    const ch = supabase
      .channel(`guru_vault_changes_${Math.random().toString(36).substring(2, 9)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "guru" }, () => {
        qc.invalidateQueries({ queryKey: GURU_KEY });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "vault_guru" }, () => {
        qc.invalidateQueries({ queryKey: GURU_KEY });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addGuru = useCallback(
    async (data: Omit<Guru, "id" | "created_at">): Promise<boolean> => {
      try {
        const res = await fetch("/api/guru", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal membuat akun");

        toast.success("Data guru & Akun berhasil ditambahkan!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [],
  );

  const updateGuru = useCallback(
    async (id: string, data: Partial<Guru>): Promise<boolean> => {
      try {
        const res = await fetch("/api/guru", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...data }),
        });
        
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal memperbarui data");

        toast.success("Data guru berhasil diperbarui!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [],
  );

  const deleteGuru = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase.from("guru").delete().eq("id", id);
        if (error) throw error;
        toast.success("Data guru dihapus");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  return { dataGuru, isLoading, refetch, addGuru, updateGuru, deleteGuru };
}
