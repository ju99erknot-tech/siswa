"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Save, User, Lock, Mail, Shield, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { toast } from "sonner";
import Image from "next/image";
import { getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  PageShell,
  PageHeader,
  PageCard,
  PageCardHeader,
  AuroraInput,
} from "@/components/shared/PageShell";

export default function ProfilPage() {
  const router = useRouter();
  const { user, setUser } = useAppStore();
  const [isHovering, setIsHovering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nama, setNama] = useState(user?.name || "");
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.name) setNama(user.name);
  }, [user?.name]);

  if (!user) return null;

  const initials = getInitials(user.name);
  const currentAvatar = avatarPreview || user.avatar;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 2MB!");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      let avatarUrl = user.avatar;
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const filePath = `${user.id}/${user.id}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;
        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath);
        avatarUrl = publicUrl;
      }
      const updateData: { data: any; password?: string } = {
        data: { full_name: nama, name: nama, avatar_url: avatarUrl },
      };
      if (password) updateData.password = password;
      const { error } = await supabase.auth.updateUser(updateData);
      if (error) throw error;
      setUser({ ...user, name: nama, avatar: avatarUrl || undefined });
      setPassword("");
      setAvatarFile(null);
      toast.success("Profil berhasil diperbarui!");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui profil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell className="max-w-4xl">
      <PageHeader
        icon={<User className="w-6 h-6 text-violet-400" />}
        title="Profil Saya"
        subtitle="Kelola informasi pribadi, foto profil, dan keamanan akun"
        gradient="linear-gradient(135deg, #0d0621 0%, #0c0820 50%, #050d1e 100%)"
        glowColor="rgba(139,92,246,0.2)"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Avatar card */}
        <div className="md:col-span-1">
          <PageCard className="flex flex-col items-center justify-center text-center py-8">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
            />
            <div
              className="relative w-28 h-28 rounded-full mb-5 cursor-pointer group"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onClick={() => fileInputRef.current?.click()}
            >
              <div
                className="w-full h-full rounded-full overflow-hidden flex items-center justify-center text-white text-2xl font-black transition-all"
                style={{
                  background: "linear-gradient(135deg, #8b5cf6, #22d3ee)",
                  boxShadow: "0 4px 20px rgba(139,92,246,0.35)",
                }}
              >
                {currentAvatar ? (
                  <Image
                    src={currentAvatar}
                    alt={user.name}
                    width={112}
                    height={112}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all backdrop-blur-sm">
                <Camera size={22} className="text-white mb-1" />
                <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                  Ganti Foto
                </span>
              </div>
            </div>
            <h2 className="text-base font-bold text-white/90">
              {nama || user.name}
            </h2>
            <p className="text-xs text-white/40 mt-1">{user.email}</p>
            <div
              className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
              style={{
                background: "rgba(52,211,153,0.10)",
                border: "1px solid rgba(52,211,153,0.20)",
                color: "#34d399",
              }}
            >
              <Shield size={11} />
              {user.role}
            </div>
            {avatarFile && (
              <p className="text-[10px] text-violet-400 mt-3 font-medium">
                📸 Foto baru dipilih
              </p>
            )}
          </PageCard>
        </div>

        {/* Form */}
        <div className="md:col-span-2 space-y-4">
          <form onSubmit={handleSave} className="space-y-4">
            <PageCard noPad>
              <PageCardHeader
                title="Informasi Pribadi"
                icon={<User className="w-4 h-4" />}
                subtitle="Nama tampilan akun Anda"
              />
              <div className="p-5 space-y-4">
                <AuroraInput
                  label="Nama Lengkap"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Nama lengkap Anda"
                />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">
                    Alamat Email{" "}
                    <span className="normal-case text-white/20 tracking-normal font-normal">
                      (tidak dapat diubah)
                    </span>
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full h-11 px-4 rounded-xl text-sm cursor-not-allowed"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      color: "rgba(255,255,255,0.30)",
                    }}
                  />
                </div>
              </div>
            </PageCard>

            <PageCard noPad>
              <PageCardHeader
                title="Keamanan & Sandi"
                icon={<Lock className="w-4 h-4 text-cyan-400" />}
                subtitle="Kosongkan jika tidak ingin mengubah sandi"
              />
              <div className="p-5">
                <AuroraInput
                  label="Kata Sandi Baru"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Biarkan kosong jika tidak ingin diubah"
                />
              </div>
            </PageCard>

            <button
              type="submit"
              disabled={
                loading || (!avatarFile && nama === user.name && !password)
              }
              className="btn-solid btn-block h-11 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
