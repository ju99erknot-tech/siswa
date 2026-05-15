import { Metadata } from "next";
import QRCodeGenerator from "@/components/utility/QRCodeGenerator";

export const metadata: Metadata = {
  title: "QR Code Generator | Portal Kesiswaan",
  description: "Buat QR Code massal",
};

export default function QRCodePage() {
  return <QRCodeGenerator />;
}
