"use client";

import { useAppStore } from "@/store/app.store";
import { WhatsAppBlast } from "./WhatsAppBlast";
import { SiswaDetail360 } from "../siswa/SiswaDetail360";
import { useRouter } from "next/navigation";

export function GlobalModals() {
  const router = useRouter();
  const { waBlastOpen, setWaBlastOpen, detailSiswa, setDetailSiswa } =
    useAppStore();

  return (
    <>
      <WhatsAppBlast open={waBlastOpen} onClose={() => setWaBlastOpen(false)} />

      <SiswaDetail360
        siswa={detailSiswa}
        onClose={() => setDetailSiswa(null)}
        onEdit={() => {
          if (detailSiswa) {
            router.push(`/siswa/tambah?edit=${detailSiswa.id}`);
            setDetailSiswa(null);
          }
        }}
      />
    </>
  );
}
