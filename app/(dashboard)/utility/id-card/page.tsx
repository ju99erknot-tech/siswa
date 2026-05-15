import { Metadata } from "next";
import IdCardPanitia from "@/components/utility/IdCardPanitia";

export const metadata: Metadata = {
  title: "ID Card Panitia | Portal Kesiswaan",
  description: "Generator ID Card panitia dengan sinkronisasi foto otomatis",
};

export default function IdCardPage() {
  return <IdCardPanitia />;
}
