"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app.store";
import type { AppUser, Pengaturan, Siswa, Prestasi, MutasiMasuk, MutasiKeluar, Alumni, Guru, MasterKelas } from "@/types";
import { useSiswa } from "@/hooks/useSiswa";
import { usePrestasi } from "@/hooks/usePrestasi";
import { useMutasi } from "@/hooks/useMutasi";
import { useAlumni } from "@/hooks/useAlumni";
import { useGuru } from "@/hooks/useGuru";
import { useMasterKelas } from "@/hooks/useMasterKelas";
import { useUKS } from "@/hooks/useUKS";
import { useIzin } from "@/hooks/useIzin";
import { usePIP } from "@/hooks/usePIP";
import { useEskul } from "@/hooks/useEskul";
import { useJurnal } from "@/hooks/useJurnal";
import { useKapsulWaktu } from "@/hooks/useKapsulWaktu";

export default function StoreInitializer({
  user,
  pengaturan,
}: {
  user: AppUser | null;
  pengaturan: Pengaturan | null;
}) {
  const setUser = useAppStore((state) => state.setUser);
  const setPengaturan = useAppStore((state) => state.setPengaturan);

  const setFetching = useAppStore((state) => state.setFetching);

  // Sync auth & pengaturan from server
  useEffect(() => {
    if (user) {
      setUser(user);
      
      // Log login activity for the session if not already logged in sessionStorage
      const sessionKey = `login_logged_${user.id}`;
      if (typeof window !== "undefined" && !sessionStorage.getItem(sessionKey)) {
        fetch("/api/auth/log-activity", { method: "POST" })
          .then((res) => {
            if (res.ok) {
              sessionStorage.setItem(sessionKey, "true");
            }
          })
          .catch((err) => console.error("Error logging activity on mount:", err));
      }
    }
    if (pengaturan) setPengaturan(pengaturan);
  }, [user, pengaturan, setUser, setPengaturan]);

  // Fetch all core data via TanStack Query hooks (handles caching, deduplication, and store syncing)
  const { isLoading: load1 } = useSiswa();
  const { isLoading: load2 } = usePrestasi();
  const { isLoadingMasuk: load3, isLoadingKeluar: load4 } = useMutasi();
  const { isLoading: load5 } = useAlumni();
  const { isLoading: load6 } = useGuru();
  const { isLoading: load7 } = useMasterKelas();
  const { isLoading: load8 } = useUKS();
  const { isLoading: load9 } = useIzin();
  const { isLoading: load10 } = usePIP();
  const { isLoading: load11 } = useEskul();
  const { isLoading: load12 } = useJurnal();
  const { isLoading: load13 } = useKapsulWaktu();

  useEffect(() => {
    // Determine overall fetching state
    const isAnyLoading = load1 || load2 || load3 || load4 || load5 || load6 || load7 || load8 || load9 || load10 || load11 || load12 || load13;
    setFetching(isAnyLoading);
  }, [load1, load2, load3, load4, load5, load6, load7, load8, load9, load10, load11, load12, load13, setFetching]);

  return null;
}
