import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const {
      siswa_id,
      lintang,
      bujur,
      jalur_pendaftaran,
      url_ktp_ayah,
      url_ktp_ibu,
      url_kk,
      url_akta,
      url_dokumen_pendukung,
      sekolah_tujuan_1,
      sekolah_tujuan_2,
      no_wa,
    } = await req.json();

    if (!siswa_id) {
      return NextResponse.json(
        { error: "ID Siswa tidak valid" },
        { status: 400 },
      );
    }

    // Cek status record yang sudah ada agar tidak menimpa status yang sudah diverifikasi
    const { data: existingRecord } = await supabaseAdmin
      .from("spmb_smp")
      .select("status")
      .eq("siswa_id", siswa_id)
      .single();

    // Pertahankan status jika sudah "Valid & Lengkap" atau "Ditolak";
    // reset ke "Menunggu Verifikasi" hanya jika status sebelumnya kosong atau menunggu.
    const statusesToPreserve: string[] = ["Valid & Lengkap", "Ditolak"];
    const resolvedStatus =
      existingRecord && statusesToPreserve.includes(existingRecord.status)
        ? existingRecord.status
        : "Menunggu Verifikasi";

    // 1. Upsert data ke tabel spmb_smp
    const { error: spmbError } = await supabaseAdmin.from("spmb_smp").upsert(
      {
        siswa_id,
        lintang,
        bujur,
        url_ktp_ayah,
        url_ktp_ibu,
        url_kk,
        url_akta,
        url_dokumen_pendukung,
        jalur_pendaftaran,
        sekolah_tujuan_1,
        sekolah_tujuan_2,
        status: resolvedStatus,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "siswa_id" },
    );

    if (spmbError) throw spmbError;

    // 2. Sinkronisasi (Update) tabel siswa jika ortu mengunggah KK/Akta baru
    const updatePayload: Record<string, string> = {};
    if (url_kk) updatePayload.url_kk = url_kk;
    if (url_akta) updatePayload.url_akta = url_akta;
    if (no_wa) updatePayload.no_wa = no_wa;

    if (Object.keys(updatePayload).length > 0) {
      const { error: siswaError } = await supabaseAdmin
        .from("siswa")
        .update(updatePayload)
        .eq("id", siswa_id);

      if (siswaError) {
        console.error("Gagal update tabel siswa:", siswaError);
        // Kita tidak throw error agar proses utama (SPMB) tetap sukses
      }
    }

    return NextResponse.json({ message: "Berhasil disimpan" }, { status: 200 });
  } catch (error: unknown) {
    console.error("Submit API Error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data. Pastikan koneksi stabil." },
      { status: 500 },
    );
  }
}
