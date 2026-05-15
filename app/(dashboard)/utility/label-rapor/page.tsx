import { Metadata } from "next";
import LabelSampulRapor from "@/components/utility/LabelSampulRapor";

export const metadata: Metadata = {
  title: "Label Sampul Rapor | Portal Kesiswaan",
  description: "Generator label sampul buku rapor Kurikulum Merdeka",
};

export default function LabelRaporPage() {
  return <LabelSampulRapor />;
}
