import { Metadata } from "next";
import PetaZonasiSpmb from "@/components/utility/PetaZonasiSpmb";

export const metadata: Metadata = {
  title: "Peta Zonasi SPMB | Portal Kesiswaan",
  description: "Analisis radius jarak rumah siswa ke SMP Negeri terdekat",
};

export default function PetaZonasiPage() {
  return <PetaZonasiSpmb />;
}
