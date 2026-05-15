import { Metadata } from "next";
import TandaTerimaDokumen from "@/components/utility/TandaTerimaDokumen";

export const metadata: Metadata = {
  title: "Tanda Terima Dokumen | Portal Kesiswaan",
  description: "Generator bukti serah terima berkas dokumen sekolah",
};

export default function TandaTerimaPage() {
  return <TandaTerimaDokumen />;
}
