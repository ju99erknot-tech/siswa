"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { uploadFileToGDrive, konversiDirectLink } from "@/lib/gas";
import { toast } from "sonner";
import type { Akreditasi } from "@/types";

export const AKREDITASI_KEY = ["akreditasi"] as const;

export function useAkreditasi() {
  const supabase = createClient();
  const qc = useQueryClient();

  const {
    data: dataAkreditasi = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: AKREDITASI_KEY,
    queryFn: async (): Promise<Akreditasi[]> => {
      const { data, error } = await supabase
        .from("vault_akreditasi")
        .select("*")
        .order("tahun", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Akreditasi[];
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const ch = supabase
      .channel(`akreditasi_changes_${Math.random().toString(36).substring(2, 9)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "vault_akreditasi" }, () => {
        qc.invalidateQueries({ queryKey: AKREDITASI_KEY });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addAkreditasi = useCallback(
    async (data: Omit<Akreditasi, "id" | "created_at">, fileDokumen?: File): Promise<boolean> => {
      try {
        let file_url: string | undefined;
        if (fileDokumen) {
          const rawUrl = await uploadFileToGDrive(fileDokumen, "AKREDITASI_" + data.nama_dokumen.replace(/\s+/g, "_"));
          file_url = konversiDirectLink(rawUrl);
        }
        const { error } = await supabase.from("vault_akreditasi").insert({
          ...data,
          file_url,
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
        toast.success("Dokumen akreditasi berhasil ditambahkan!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const updateAkreditasi = useCallback(
    async (id: string, data: Partial<Akreditasi>, fileDokumen?: File): Promise<boolean> => {
      try {
        const updateData: Partial<Akreditasi> = { ...data };
        if (fileDokumen) {
          const rawUrl = await uploadFileToGDrive(fileDokumen, "AKREDITASI_" + (data.nama_dokumen || "").replace(/\s+/g, "_"));
          updateData.file_url = konversiDirectLink(rawUrl);
        }
        const { error } = await supabase.from("vault_akreditasi").update(updateData).eq("id", id);
        if (error) throw error;
        toast.success("Dokumen akreditasi diperbarui!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const deleteAkreditasi = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase.from("vault_akreditasi").delete().eq("id", id);
        if (error) throw error;
        toast.success("Dokumen akreditasi dihapus");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  return { dataAkreditasi, isLoading, refetch, addAkreditasi, updateAkreditasi, deleteAkreditasi };
}
