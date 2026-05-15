import { Metadata } from "next";
import AlbumLulusan from "@/components/utility/AlbumLulusan";

export const metadata: Metadata = {
  title: "Album Lulusan | Portal Kesiswaan",
  description: "Generator halaman album foto lulusan sekolah",
};

export default function AlbumLulusanPage() {
  return <AlbumLulusan />;
}
