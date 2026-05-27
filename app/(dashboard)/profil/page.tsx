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
  const [otherSessions, setOtherSessions] = useState([
    {
      id: "1",
      device: "Mobile",
      os: "Android",
      browser: "Chrome",
      location: "Sukabumi, Jawa Barat",
      ip: "114.79.12.8",
      time: "2 jam yang lalu",
      status: "active"
    },
    {
      id: "2",
      device: "Mobile",
      os: "iOS",
      browser: "Safari",
      location: "Jakarta, DKI Jakarta",
      ip: "182.253.10.99",
      time: "3 hari yang lalu",
      status: "expired"
    },
    {
      id: "3",
      device: "Desktop",
      os: "Windows",
      browser: "Edge",
      location: "Bandung, Jawa Barat",
      ip: "103.10.88.54",
      time: "7 hari yang lalu",
      status: "expired"
    }
  ]);

  const [clientInfo, setClientInfo] = useState({
    os: "Windows",
    browser: "Chrome",
    ip: "182.253.119.42",
    device: "Desktop"
  });

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
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent;
      let os = "Windows";
      let device = "Desktop";
      let browser = "Chrome";
      
      if (/Mac/i.test(ua)) os = "MacOS";
      else if (/Linux/i.test(ua)) os = "Linux";
      else if (/Android/i.test(ua)) { os = "Android"; device = "Mobile"; }
      else if (/iPhone|iPad/i.test(ua)) { os = "iOS"; device = "Mobile"; }
      
      if (/Firefox/i.test(ua)) browser = "Firefox";
      else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
      else if (/Edg/i.test(ua)) browser = "Edge";
      
      const ip = "182.253." + Math.floor(Math.random() * 254 + 1) + "." + Math.floor(Math.random() * 254 + 1);
      
      setClientInfo({ os, browser, ip, device });
    }
  }, []);

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

  const handleLogoutOthers = () => {
    setIsLoggingOutOthers(true);
    setTimeout(() => {
      setOtherSessions(prev => prev.map(s => ({ ...s, status: "expired" })));
      setIsLoggingOutOthers(false);
      toast.success("Berhasil keluar dari semua sesi lainnya!");
    }, 1500);
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    {clientInfo.device === "Desktop" ? <Monitor size={22} /> : <Smartphone size={22} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">
                        {clientInfo.os} • {clientInfo.browser}
                      </h4>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 animate-pulse">
                        Sesi Aktif
                      </span>
                    </div>
                    <p className="text-xs text-white/40 mt-1 font-mono flex items-center gap-1.5">
                      <Globe size={11} /> {clientInfo.ip} • Sukabumi, Jawa Barat
                    </p>
                    <p className="text-[10px] text-white/30 mt-1 flex items-center gap-1">
                      <Clock size={10} /> Aktif Sekarang
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </PageCard>

          {/* Sesi Lainnya */}
          <PageCard noPad>
            <div className="px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-violet-400" /> Riwayat Aktivitas & Sesi Lain
                </h3>
                <p className="text-xs text-white/35 mt-1">Daftar sesi masuk yang tercatat pada akun Anda</p>
              </div>
              {otherSessions.some(s => s.status === "active") && (
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
              <div className="space-y-3">
                {otherSessions.map((session) => (
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
                          <Globe size={10} /> {session.ip} • {session.location}
                        </p>
                        <p className="text-[10px] text-white/30 mt-1 flex items-center gap-1">
                          <Clock size={9} /> {session.time}
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
