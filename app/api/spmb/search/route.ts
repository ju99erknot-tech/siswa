import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: Request) {
  try {
    const { nisn, tgl_lahir } = await req.json();

    if (!nisn || !tgl_lahir) {
      return NextResponse.json(
        { error: "NISN dan Tanggal Lahir wajib diisi" },
        { status: 400 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    // 1. Cari Siswa berdasarkan NISN dan Tanggal Lahir
    const { data: siswa, error: siswaError } = await supabaseAdmin
      .from("siswa")
      .select(
        "id, nama, nisn, jk, kelas, tanggal_lahir, url_kk, url_akta, foto_url",
      )
      .eq("nisn", nisn)
      .eq("tanggal_lahir", tgl_lahir)
      .single();

    if (siswaError || !siswa) {
      return NextResponse.json(
        { error: "Data Siswa tidak ditemukan atau Tanggal Lahir salah" },
        { status: 404 },
      );
    }

    // Pastikan siswa ini duduk di kelas 6
    // Regex: cocokkan angka "6" atau romawi "VI" di awal string (case-insensitive, word-boundary)
    const kelasUpper = (siswa.kelas || "").toUpperCase();
    const isKelas6 = /^(6|vi)\b/i.test(kelasUpper.trim());
    if (!isKelas6) {
      return NextResponse.json(
        {
          error: `Maaf, portal ini khusus untuk siswa Kelas 6 (Kelas Ananda saat ini: ${siswa.kelas || "-"}).`,
        },
        { status: 403 },
      );
    }

    // 2. Cari data SPMB jika sudah pernah mengisi
    const { data: spmb } = await supabaseAdmin
      .from("spmb_smp")
      .select("*")
      .eq("siswa_id", siswa.id)
      .single();

    return NextResponse.json({ siswa, spmb }, { status: 200 });
  } catch (error: unknown) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}
