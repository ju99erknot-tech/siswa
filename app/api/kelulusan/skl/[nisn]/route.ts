import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const getSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

export async function GET(
  req: Request,
  { params }: { params: Promise<{ nisn: string }> }
) {
  try {
    const { nisn } = await params;
    if (!nisn) {
      return NextResponse.json({ error: "NISN wajib" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: pengaturan } = await supabase
      .from("pengaturan")
      .select("*")
      .limit(1)
      .single();

    // Check if user is authenticated as admin/staff
    let isUserAuthenticated = false;
    try {
      const supabaseServer = await createServerClient();
      const { data: { user } } = await supabaseServer.auth.getUser();
      if (user) {
        isUserAuthenticated = true;
      }
    } catch (err) {
      console.error("[SKL API Auth Check Error]", err);
    }

    if (!pengaturan?.portal_kelulusan_aktif && !isUserAuthenticated) {
      return NextResponse.json(
        { error: "Portal belum aktif" },
        { status: 403 }
      );
    }

    const { data: siswa } = await supabase
      .from("siswa")
      .select("id, nama, nisn, nis, jk, kelas, tempat_lahir, tanggal_lahir, nama_ayah, nama_ibu, foto_url, status_kelulusan, no_peserta_un, nomor_skl, nilai_kelulusan")
      .eq("nisn", nisn)
      .single();

    if (!siswa || siswa.status_kelulusan !== "LULUS") {
      return NextResponse.json(
        { error: "Data tidak ditemukan atau belum dinyatakan lulus" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      siswa,
      nama_sekolah: pengaturan.nama_sekolah,
      nama_kepsek: pengaturan.nama_kepsek,
      nip_kepsek: pengaturan.nip_kepsek,
      npsn: pengaturan.npsn,
      alamat_sekolah: pengaturan.alamat_sekolah,
      tahun_ajaran: pengaturan.tahun_ajaran,
      logo_url: pengaturan.logo_url,
      kop_surat_url: pengaturan.kop_surat_url,
      tanggal_kelulusan: pengaturan.tanggal_kelulusan,
      nama_mulok1: pengaturan.nama_mulok1,
      nama_mulok2: pengaturan.nama_mulok2,
      nama_mulok3: pengaturan.nama_mulok3,
      sk_lulus_nomor: pengaturan.sk_lulus_nomor,
      sk_lulus_tentang: pengaturan.sk_lulus_tentang,
      format_skl: pengaturan.format_skl || "format_1",
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
