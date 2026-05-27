"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { 
  Camera, Save, User, Lock, Mail, Shield, Loader2,
  Monitor, Smartphone, Laptop, Clock, CheckCircle, AlertCircle,
  LogOut, Globe, ShieldAlert, KeyRound
} from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { toast } from "sonner";
import Image from "next/image";
import { getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PageShell,
  PageHeader,
  PageCard,
  PageCardHeader,
  AuroraInput,
} from "@/components/shared/PageShell";
import { cn } from "@/lib/utils";

function ProfilContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  
  const { user, setUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<"profil" | "aktivitas">("profil");
  
  const [isHovering, setIsHovering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nama, setNama] = useState(user?.name || "");
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for Login Activity
  const [isLoggingOutOthers, setIsLoggingOutOthers] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const res = await fetch("/api/auth/log-activity");
      if (!res.ok) throw new Error("Gagal mengambil data sesi");
      const data = await res.json();
      if (data.success) {
        setSessions(data.logs || []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal memuat riwayat aktivitas");
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (tabParam === "aktivitas") {
      setActiveTab("aktivitas");
    } else {
      setActiveTab("profil");
    }
  }, [tabParam]);

  useEffect(() => {
    if (user?.name) setNama(user.name);
  }, [user?.name]);

  useEffect(() => {
    if (activeTab === "aktivitas") {
      fetchSessions();
    }
  }, [activeTab]);

  const formatRelativeTime = (dateStr: string) => {
    try {
      const now = new Date();
      const date = new Date(dateStr);
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (60 * 1000));
      const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
      const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

      if (diffMins < 1) return "Baru saja";
      if (diffMins < 60) return `${diffMins} menit yang lalu`;
      if (diffHours < 24) return `${diffHours} jam yang lalu`;
      if (diffDays === 1) return "Kemarin";
      if (diffDays < 7) return `${diffDays} hari yang lalu`;
      
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "Baru saja";
    }
  };

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

  const handleLogoutOthers = async () => {
    setIsLoggingOutOthers(true);
    try {
      const res = await fetch("/api/auth/log-activity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout_others" })
      });
      if (!res.ok) throw new Error("Gagal mengakhiri sesi lain");
      toast.success("Berhasil keluar dari semua sesi lainnya!");
      fetchSessions();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengakhiri sesi");
    } finally {
      setIsLoggingOutOthers(false);
    }
  };

  return (
    <PageShell className="max-w-4xl">
      <PageHeader
        icon={<User className="w-6 h-6 text-violet-400" />}
        title="Profil Saya"
        subtitle="Kelola informasi pribadi, foto profil, keamanan akun, dan sesi login"
        gradient="linear-gradient(135deg, #0d0621 0%, #0c0820 50%, #050d1e 100%)"
        glowColor="rgba(139,92,246,0.2)"
      />

      {/* Tabs Navigation */}
      <div className="flex gap-2 mb-6 border-b border-white/5 pb-3">
        <button
          onClick={() => {
            setActiveTab("profil");
            router.push("/profil");
          }}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
            activeTab === "profil"
              ? "text-violet-400 bg-violet-500/10 border-violet-500/30"
              : "text-white/40 bg-white/5 border-white/5 hover:text-white/60"
          )}
        >
          Profil & Keamanan
        </button>
        <button
          onClick={() => {
            setActiveTab("aktivitas");
            router.push("/profil?tab=aktivitas");
          }}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
            activeTab === "aktivitas"
              ? "text-violet-400 bg-violet-500/10 border-violet-500/30"
              : "text-white/40 bg-white/5 border-white/5 hover:text-white/60"
          )}
        >
          Aktivitas Login
        </button>
      </div>

      {activeTab === "profil" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-in fade-in duration-300">
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
                  icon={<User className="w-4 h-4 text-violet-400" />}
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
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Active Session Info */}
          <PageCard noPad>
            <PageCardHeader
              title="Sesi Aktif Saat Ini"
              icon={<Monitor className="w-4 h-4 text-emerald-400" />}
              subtitle="Perangkat yang Anda gunakan saat ini untuk mengakses sistem"
            />
            <div className="p-5">
              {isLoadingSessions ? (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/10 animate-pulse">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5" />
                  <div className="space-y-2">
                    <div className="h-4 w-36 bg-white/10 rounded" />
                    <div className="h-3 w-48 bg-white/5 rounded" />
                  </div>
                </div>
              ) : sessions[0] ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      {sessions[0].device === "Desktop" ? <Monitor size={22} /> : <Smartphone size={22} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">
                          {sessions[0].os} • {sessions[0].browser}
                        </h4>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 animate-pulse">
                          Sesi Aktif Saat Ini
                        </span>
                      </div>
                      <p className="text-xs text-white/40 mt-1 font-mono flex items-center gap-1.5">
                        <Globe size={11} /> {sessions[0].ip_address} • {sessions[0].location}
                      </p>
                      <p className="text-[10px] text-white/30 mt-1 flex items-center gap-1">
                        <Clock size={10} /> Aktif Sekarang
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-white/40 italic">Tidak ada sesi aktif terdeteksi.</p>
              )}
            </div>
          </PageCard>

          {/* Sesi Lainnya */}
          <PageCard noPad>
            <div className="px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-violet-400" /> Riwayat Sesi & Aktivitas Lain
                </h3>
                <p className="text-xs text-white/35 mt-1">Daftar sesi masuk yang tercatat pada akun Anda</p>
              </div>
              {!isLoadingSessions && sessions.slice(1).some(s => s.status === "active") && (
                <button
                  onClick={handleLogoutOthers}
                  disabled={isLoggingOutOthers}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all disabled:opacity-50 self-start sm:self-center"
                >
                  {isLoggingOutOthers ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                  Keluar dari Sesi Lain
                </button>
              )}
            </div>

            <div className="p-5">
              {isLoadingSessions ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/5" />
                        <div className="space-y-2">
                          <div className="h-3 w-32 bg-white/10 rounded" />
                          <div className="h-2.5 w-48 bg-white/5 rounded" />
                        </div>
                      </div>
                      <div className="h-5 w-12 bg-white/10 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : sessions.slice(1).length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-white/30">Tidak ada riwayat sesi login lainnya.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.slice(1).map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "flex items-start justify-between gap-4 p-4 rounded-xl transition-colors border",
                        session.status === "active"
                          ? "bg-white/[0.02] border-white/5"
                          : "bg-black/20 border-white/[0.02] opacity-60"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center border",
                          session.status === "active"
                            ? "bg-violet-500/10 border-violet-500/20 text-violet-400"
                            : "bg-white/5 border-white/5 text-white/30"
                        )}>
                          {session.device === "Desktop" ? <Monitor size={18} /> : <Smartphone size={18} />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white/80">
                            {session.os} • {session.browser}
                          </p>
                          <p className="text-[10px] text-white/35 mt-1 font-mono flex items-center gap-1">
                            <Globe size={10} /> {session.ip_address} • {session.location}
                          </p>
                          <p className="text-[10px] text-white/30 mt-1 flex items-center gap-1">
                            <Clock size={9} /> {formatRelativeTime(session.created_at)}
                          </p>
                        </div>
                      </div>
                      <div>
                        {session.status === "active" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold text-white/20 bg-white/5 border border-white/5">
                            Sesi Berakhir
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PageCard>

          {/* Rekomendasi Keamanan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-amber-500/15 bg-amber-500/[0.02] flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Tips Keamanan Akun</h4>
                <p className="text-[11px] text-white/50 leading-relaxed mt-1.5">
                  Selalu periksa daftar sesi login secara berkala. Jika Anda melihat aktivitas login dari perangkat atau kota yang tidak Anda kenali, segera ubah kata sandi Anda di tab Profil.
                </p>
              </div>
            </div>
            <div className="p-5 rounded-2xl border border-cyan-500/15 bg-cyan-500/[0.02] flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <KeyRound size={20} />
              </div>
              <div>
                <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider">Perlindungan Kredensial</h4>
                <p className="text-[11px] text-white/50 leading-relaxed mt-1.5">
                  Hindari menggunakan kata sandi yang mudah ditebak (seperti tanggal lahir atau nama depan). Gunakan kombinasi huruf besar-kecil, angka, dan karakter khusus.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

export default function ProfilPage() {
  return (
    <Suspense fallback={
      <PageShell className="max-w-4xl">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        </div>
      </PageShell>
    }>
      <ProfilContent />
    </Suspense>
  );
}
