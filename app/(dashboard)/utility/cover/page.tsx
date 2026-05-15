import { Metadata } from "next";
import CoverGenerator from "@/components/utility/CoverGenerator";

export const metadata: Metadata = {
  title: "Cover Generator | Portal Kesiswaan",
  description: "Desain otomatis cover dokumen resmi sekolah",
};

export default function CoverPage() {
  return <CoverGenerator />;
}
