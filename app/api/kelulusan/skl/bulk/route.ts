import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const getSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

export async function GET(req: Request) {
  try {
    // 1. Check authentication
    const supabaseServer = await createServerClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // 2. Fetch Pengaturan
    const { data: pengaturan } = await supabase
      .from("pengaturan")
      .select("*")
      .limit(1)
      .single();

    // 3. Fetch all LULUS students in Grade 6 / VI
    const { data: siswaList, error: siswaError } = await supabase
      .from("siswa")
      .select("id, nama, nisn, nis, jk, kelas, tempat_lahir, tanggal_lahir, nama_ayah, nama_ibu, foto_url, status_kelulusan, no_peserta_un, nomor_skl, nilai_kelulusan")
      .eq("status_kelulusan", "LULUS")
      .or("kelas.ilike.6%,kelas.ilike.VI%")
      .order("nama");

    if (siswaError) {
      return NextResponse.json({ error: siswaError.message }, { status: 500 });
    }

    return NextResponse.json({
      siswaList,
      nama_sekolah: pengaturan?.nama_sekolah || "",
      nama_kepsek: pengaturan?.nama_kepsek || "",
      nip_kepsek: pengaturan?.nip_kepsek || "",
      npsn: pengaturan?.npsn || "",
      alamat_sekolah: pengaturan?.alamat_sekolah || "",
      tahun_ajaran: pengaturan?.tahun_ajaran || "",
      logo_url: pengaturan?.logo_url || null,
      kop_surat_url: pengaturan?.kop_surat_url || null,
      tanggal_kelulusan: pengaturan?.tanggal_kelulusan || "2026-06-02",
      nama_mulok1: pengaturan?.nama_mulok1 || "Bahasa dan Sastra Sunda",
      nama_mulok2: pengaturan?.nama_mulok2 || null,
      nama_mulok3: pengaturan?.nama_mulok3 || null,
      sk_lulus_nomor: pengaturan?.sk_lulus_nomor || null,
      sk_lulus_tentang: pengaturan?.sk_lulus_tentang || null,
      format_skl: pengaturan?.format_skl || "format_1",
      ttd_url: pengaturan?.ttd_url || null,
      stempel_url: pengaturan?.stempel_url || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
