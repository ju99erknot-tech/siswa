import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nisn: string }> },
) {
  try {
    const { nisn } = await params;
    const supabase = await createClient();

    // Cari siswa berdasarkan NISN
    const { data: siswa, error } = await supabase
      .from("siswa")
      .select("foto_url")
      .eq("nisn", nisn)
      .single();

    if (error || !siswa) {
      return NextResponse.json(
        { error: "Siswa tidak ditemukan" },
        { status: 404 },
      );
    }

    if (!siswa.foto_url) {
      return NextResponse.json(
        { error: "Foto tidak tersedia" },
        { status: 404 },
      );
    }

    let resolvedUrl = siswa.foto_url;
    if (!resolvedUrl.startsWith("http")) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const cleanPath = resolvedUrl.startsWith("/")
        ? resolvedUrl.substring(1)
        : resolvedUrl;
      resolvedUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${cleanPath}`;
    }

    // Redirect ke foto URL
    return NextResponse.redirect(resolvedUrl);
  } catch (error) {
    console.error("Error loading foto siswa:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
