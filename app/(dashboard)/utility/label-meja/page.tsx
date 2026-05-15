import { Metadata } from "next";
import LabelMeja from "@/components/utility/LabelMeja";

export const metadata: Metadata = {
  title: "Label Meja Ujian | Portal Kesiswaan",
  description: "Generator label meja ujian sesuai standar dapodik",
};

export default function LabelMejaPage() {
  return <LabelMeja />;
}
