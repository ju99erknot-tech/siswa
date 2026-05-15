import { Metadata } from "next";
import UploadFotoMassal from "@/components/utility/UploadFotoMassal";

export const metadata: Metadata = {
  title: "Upload Foto Massal | Portal Kesiswaan",
  description: "Unggah foto profil siswa/guru secara massal",
};

export default function UploadFotoPage() {
  return <UploadFotoMassal />;
}
