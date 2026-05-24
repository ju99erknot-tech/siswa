import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

export async function POST(req: Request) {
  try {
    const { nisn, tgl_lahir } = await req.json();

    if (!nisn || !tgl_lahir) {
      return NextResponse.json(
        { error: "NISN dan Tanggal Lahir wajib diisi" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Cek apakah portal kelulusan aktif
    const { data: pengaturan, error: pengaturanError } = await supabaseAdmin
      .from("pengaturan")
      .select("*")
      .limit(1)
      .single();

    console.log("[Kelulusan API] pengaturan:", JSON.stringify({ portal_kelulusan_aktif: pengaturan?.portal_kelulusan_aktif, tanggal_pengumuman: pengaturan?.tanggal_pengumuman, error: pengaturanError?.message }));

    if (!pengaturan?.portal_kelulusan_aktif) {
      return NextResponse.json(
        {
          error: "Portal Pengumuman Kelulusan belum dibuka oleh pihak sekolah.",
          tanggal_pengumuman: pengaturan?.tanggal_pengumuman || null,
        },
        { status: 403 }
      );
    }

    // 2. Cari Siswa berdasarkan NISN dan Tanggal Lahir
    const { data: siswa, error: siswaError } = await supabaseAdmin
      .from("siswa")
      .select(
        "id, nama, nisn, nis, jk, kelas, tempat_lahir, tanggal_lahir, nama_ayah, nama_ibu, foto_url, status_kelulusan, nomor_skl, nilai_kelulusan"
      )
      .eq("nisn", nisn)
      .eq("tanggal_lahir", tgl_lahir)
      .single();

    if (siswaError || !siswa) {
      return NextResponse.json(
        { error: "Data Siswa tidak ditemukan. Periksa kembali NISN dan Tanggal Lahir Anda." },
        { status: 404 }
      );
    }

    // 3. Pastikan siswa ini duduk di kelas 6
    const kelasUpper = (siswa.kelas || "").toUpperCase();
    const isKelas6 = /^(6|vi)\b/i.test(kelasUpper.trim());
    if (!isKelas6) {
      return NextResponse.json(
        {
          error: `Portal ini khusus untuk siswa Kelas 6. Kelas Ananda saat ini: ${siswa.kelas || "-"}.`,
        },
        { status: 403 }
      );
    }

    // 4. Return data siswa dan status kelulusan
    return NextResponse.json(
      {
        siswa,
        status_kelulusan: siswa.status_kelulusan || null, // 'LULUS', 'TIDAK LULUS', atau null
        pesan_kelulusan: pengaturan?.pesan_kelulusan || null,
        nama_kepsek: pengaturan?.nama_kepsek || null,
        nip_kepsek: pengaturan?.nip_kepsek || null,
        nama_sekolah: pengaturan?.nama_sekolah || null,
        npsn: pengaturan?.npsn || null,
        tanggal_kelulusan: pengaturan?.tanggal_kelulusan || null,
        nama_mulok1: pengaturan?.nama_mulok1 || null,
        nama_mulok2: pengaturan?.nama_mulok2 || null,
        nama_mulok3: pengaturan?.nama_mulok3 || null,
        kop_surat_url: pengaturan?.kop_surat_url || null,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Kelulusan Search API Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
