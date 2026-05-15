"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { uploadFileToGDrive, konversiDirectLink } from "@/lib/gas";
import { toast } from "sonner";
import { useAppStore } from "@/store/app.store";
import type { Izin } from "@/types";

export const IZIN_KEY = ["izin"] as const;

export function useIzin() {
  const supabase = createClient();
  const qc = useQueryClient();

  const {
    data: dataIzin = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: IZIN_KEY,
    queryFn: async (): Promise<Izin[]> => {
      const { data, error } = await supabase
        .from("buku_izin")
        .select("*")
        .order("tanggal", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Izin[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const setDataIzin = useAppStore((s) => s.setDataIzin);
  useEffect(() => {
    if (dataIzin.length > 0) setDataIzin(dataIzin);
  }, [dataIzin, setDataIzin]);

  useEffect(() => {
    const ch = supabase
      .channel(`izin_changes_${Math.random().toString(36).substring(2, 9)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "buku_izin" }, () => {
        qc.invalidateQueries({ queryKey: IZIN_KEY });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addIzin = useCallback(
    async (data: Omit<Izin, "id" | "created_at">, fileBukti?: File): Promise<boolean> => {
      try {
        let surat_url: string | undefined;
        if (fileBukti) {
          const rawUrl = await uploadFileToGDrive(fileBukti, "IZIN_" + data.nisn);
          surat_url = konversiDirectLink(rawUrl);
        }
        const { error } = await supabase.from("buku_izin").insert({
          ...data,
          surat_url,
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
        toast.success("Data izin berhasil dicatat!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const updateIzin = useCallback(
    async (id: string, data: Partial<Izin>, fileBukti?: File): Promise<boolean> => {
      try {
        const updateData: Partial<Izin> = { ...data };
        if (fileBukti) {
          const rawUrl = await uploadFileToGDrive(fileBukti, "IZIN_" + (data.nisn || ""));
          updateData.surat_url = konversiDirectLink(rawUrl);
        }
        const { error } = await supabase.from("buku_izin").update(updateData).eq("id", id);
        if (error) throw error;
        toast.success("Data izin diperbarui!");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  // Verifikasi izin (ubah status)
  const verifikasiIzin = useCallback(
    async (id: string, status: "Disetujui" | "Ditolak"): Promise<boolean> => {
      try {
        const { error } = await supabase.from("buku_izin").update({ status }).eq("id", id);
        if (error) throw error;
        toast.success(`Izin ${status.toLowerCase()}!`);
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  const deleteIzin = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase.from("buku_izin").delete().eq("id", id);
        if (error) throw error;
        toast.success("Data izin dihapus");
        return true;
      } catch (err: unknown) {
        toast.error("Gagal: " + (err as Error).message);
        return false;
      }
    },
    [supabase],
  );

  return { dataIzin, isLoading, refetch, addIzin, updateIzin, verifikasiIzin, deleteIzin };
}
