-- ====================================================================
-- SUPABASE STORAGE BUCKET SETUP
-- Script ini untuk membuat wadah (bucket) 'avatars' untuk Foto Profil.
-- Silakan jalankan script ini di menu SQL Editor pada Supabase Anda.
-- ====================================================================

-- 1. Buat Storage Bucket bernama 'avatars' (Public agar bisa diakses aplikasi)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Izinkan siapapun (Public) untuk melihat foto avatar
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

-- 3. Izinkan pengguna yang sudah login untuk mengunggah (Upload) fotonya sendiri
CREATE POLICY "Users can upload their own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );

-- 4. Izinkan pengguna untuk memperbarui (Update) fotonya sendiri
CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  USING ( auth.uid() = owner );

-- 5. Izinkan pengguna untuk menghapus (Delete) fotonya sendiri
CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  USING ( auth.uid() = owner );
