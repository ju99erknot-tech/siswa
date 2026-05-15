import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Buat client Supabase dengan Service Role Key (Bypass RLS)
// Hanya gunakan ini di Server-Side API, JANGAN pernah panggil di Client-Side
const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, nama, nip, jk, no_wa, foto_url, kategori, status_aktif } =
      body;

    if (!email || !nama) {
      return NextResponse.json(
        { error: "Email dan Nama wajib diisi" },
        { status: 400 },
      );
    }

    // 1. Daftarkan Email ke Supabase Auth dengan password acak yang memenuhi persyaratan keamanan
    const randomPassword = crypto.randomUUID().slice(0, 16) + "A1!";
    const supabaseAdmin = getSupabaseAdmin();
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: randomPassword,
        email_confirm: true, // Otomatis terkonfirmasi agar bisa langsung login
      });

    if (authError) {
      console.error("Auth Error:", authError);
      return NextResponse.json(
        { error: `Gagal membuat akun: ${authError.message}` },
        { status: 500 },
      );
    }

    // 2. Simpan profil Guru ke tabel public.guru
    const { data: guruData, error: dbError } = await supabaseAdmin
      .from("guru")
      .insert([
        {
          // id: authData.user.id, // Jika ingin ID tabel guru SAMA PERSIS dengan ID Auth
          email: email,
          nama: nama,
          nip: nip || null,
          jk: jk || "L",
          no_wa: no_wa || null,
          foto_url: foto_url || null,
          kategori: kategori || null,
          status_aktif: status_aktif !== undefined ? status_aktif : true,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error("DB Error:", dbError);
      // Jika insert ke tabel gagal, idealnya kita hapus lagi user di Auth (Rollback)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json(
        { error: `Gagal menyimpan data guru: ${dbError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Guru dan Akun berhasil dibuat!", data: guruData },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      email,
      nama,
      nip,
      jk,
      no_wa,
      foto_url,
      kategori,
      status_aktif,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID Guru tidak ditemukan" },
        { status: 400 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    // Update data di tabel public.guru
    const { error: dbError } = await supabaseAdmin
      .from("guru")
      .update({
        nama,
        nip,
        email,
        jk,
        no_wa,
        foto_url,
        kategori,
        status_aktif,
      })
      .eq("id", id);

    if (dbError) throw dbError;

    // Jika admin memasukkan email baru (sebelumnya kosong), buatkan akun Auth-nya
    if (email) {
      const randomPassword = crypto.randomUUID().slice(0, 16) + "A1!";
      const { error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: randomPassword,
        email_confirm: true,
      });
      // Kita abaikan error jika pesannya "User already registered" (karena mungkin sebelumnya sudah ada)
      if (authError && !authError.message.includes("already registered")) {
        console.error("Auth creation warning during update:", authError);
      }
      // KNOWN ISSUE: Jika email diubah dari nilai sebelumnya, kita tidak dapat memanggil
      // supabaseAdmin.auth.admin.updateUserById() karena kolom auth_id tidak disimpan
      // di tabel public.guru. Solusi: tambahkan kolom auth_id ke tabel guru dan isi
      // saat POST, lalu gunakan updateUserById(authId, { email: newEmail }) di sini.
    }

    return NextResponse.json({ message: "Update sukses" }, { status: 200 });
  } catch (error: unknown) {
    console.error("PUT Server Error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui data" },
      { status: 500 },
    );
  }
}
