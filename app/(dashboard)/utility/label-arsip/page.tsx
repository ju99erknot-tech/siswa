import { Metadata } from "next";
import LabelMapArsip from "@/components/utility/LabelMapArsip";

export const metadata: Metadata = {
  title: "Label Map Arsip | Portal Kesiswaan",
  description: "Generator label map arsip dokumen sekolah",
};

export default function LabelArsipPage() {
  return <LabelMapArsip />;
}
