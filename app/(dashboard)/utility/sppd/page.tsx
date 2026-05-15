import ESPPD from "@/components/utility/ESPPD";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aplikasi e-SPPD | Smart Kesiswaan",
  description: "Generator Surat Perjalanan Dinas Elektronik",
};

export default function ESPPDPage() {
  return <ESPPD />;
}
