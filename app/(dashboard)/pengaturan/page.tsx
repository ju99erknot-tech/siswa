"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Save,
  Loader2,
  School,
  UserCheck,
  Link2,
  MapPin,
  ShieldCheck,
  Plus,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Palette,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Pengaturan } from "@/types";
import { PageShell, PageHeader, AuroraInput } from "@/components/shared/PageShell";
import { SCHOOL } from "@/lib/school.config";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AccentColorPicker } from "@/components/shared/AccentColorPicker";

const SECTIONS = [
  { id: "sekolah", label: "Identitas Sekolah", icon: School, color: "#22d3ee" },
  { id: "kepsek", label: "Kepala Sekolah", icon: UserCheck, color: "#34d399" },
  { id: "aset", label: "Aset & Koneksi", icon: Link2, color: "#fbbf24" },
  { id: "lokasi", label: "Koordinat", icon: MapPin, color: "#f472b6" },
  { id: "admin", label: "Admin", icon: ShieldCheck, color: "#a78bfa" },
  { id: "tampilan", label: "Tampilan", icon: Palette, color: "#f472b6" },
];

/* ── Reusable: Section wrapper ─────────────────────────── */
function SectionBlock({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-black text-white/90 tracking-tight">{title}</h3>
        {desc && <p className="text-xs text-white/35 mt-1">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

/* ── Reusable: Asset upload card ───────────────────────── */
function AssetCard({
  label, url, uploading, onUpload, onUrlChange,
}: {
  label: string; url: string; uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUrlChange: (v: string) => void;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Preview area */}
      <div className="h-28 flex items-center justify-center relative group" style={{ background: "rgba(0,0,0,0.15)" }}>
        {url ? (
          <>
            <img src={url} alt={label} className="max-h-20 max-w-[80%] object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
              <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 text-xs text-white/70 hover:text-white hover:bg-white/15 transition-all">
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Ganti
                <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
              </label>
            </div>
          </>
        ) : (
          <label className="cursor-pointer flex flex-col items-center gap-2 text-white/20 hover:text-white/40 transition-all">
            {uploading ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={24} />}
            <span className="text-[10px] font-bold uppercase tracking-widest">Upload {label}</span>
            <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
          </label>
        )}
      </div>
      {/* Info + URL */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-white/60">{label}</span>
          {url && <CheckCircle2 size={12} className="text-emerald-400" />}
        </div>
        <input
          type="url" value={url} onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-1.5 rounded-lg text-[11px] outline-none text-white/60 placeholder-white/15 font-mono"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        />
      </div>
    </div>
  );
}

export default function PengaturanPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("sekolah");
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const [form, setForm] = useState<Pengaturan>({
    nama_sekolah: SCHOOL.nama, npsn: "", alamat_sekolah: "",
    nama_kepsek: "", nip_kepsek: "", logo_url: "", kop_surat_url: "",
    ttd_url: "", stempel_url: "", gas_web_app_url: "",
    tahun_ajaran: "2025/2026", lat_sekolah: "", lng_sekolah: "",
  });

  const updateForm = (patch: Partial<Pengaturan>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setHasChanges(true);
  };

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("pengaturan").select("*").limit(1).single();
      if (data) setForm(data as Pengaturan);
      setLoading(false);
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    setSaving(true);
    try {
      if (form.id) {
        const { error } = await supabase.from("pengaturan").update(form).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pengaturan").insert(form);
        if (error) throw error;
      }
      toast.success("Pengaturan berhasil disimpan!");
      setHasChanges(false);
    } catch (err: unknown) {
      toast.error("Gagal menyimpan: " + (err instanceof Error ? err.message : "Unknown"));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const envEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);
    setAdminEmails(envEmails);
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof Pengaturan) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("File harus berupa gambar"); return; }
    setUploading(field as string);
    try {
      const ext = file.name.split(".").pop();
      const path = `school-assets/${field}_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("school-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("school-assets").getPublicUrl(path);
      updateForm({ [field]: publicUrl });
      toast.success("Gambar berhasil diupload!");
    } catch (err: unknown) {
      toast.error("Gagal upload: " + (err as Error).message);
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const activeSection = SECTIONS.find((s) => s.id === activeTab)!;

  return (
    <PageShell>
      <PageHeader
        icon={<Settings className="w-6 h-6 text-violet-400" />}
        title="Pengaturan"
        subtitle="Konfigurasi identitas sekolah, aset, dan integrasi"
        action={
          <button
            onClick={handleSave} disabled={saving}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
              hasChanges
                ? "text-white shadow-lg shadow-violet-500/25"
                : "text-white/50"
            )}
            style={{
              background: hasChanges
                ? "linear-gradient(135deg, #7c3aed, #5b21b6)"
                : "rgba(255,255,255,0.06)",
              border: hasChanges
                ? "1px solid rgba(139,92,246,0.4)"
                : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        }
      />

      {/* ── Layout: Sidebar + Content ── */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar nav */}
        <div className="lg:w-56 flex-shrink-0">
          <nav className="flex lg:flex-col justify-center lg:justify-start gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 hide-scrollbar">
            {SECTIONS.map(({ id, label, icon: Icon, color }) => {
              const isActive = activeTab === id;
              return (
                  <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-4 py-3 rounded-xl text-left transition-all whitespace-nowrap flex-shrink-0",
                    isActive ? "text-white" : "text-white/40 hover:text-white/60 hover:bg-white/[0.02]",
                  )}
                  style={{
                    background: isActive ? `linear-gradient(135deg, ${color}12, ${color}06)` : undefined,
                    border: isActive ? `1px solid ${color}25` : "1px solid transparent",
                  }}
                  title={label}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isActive ? `${color}18` : "rgba(255,255,255,0.04)",
                      border: `1px solid ${isActive ? color + "30" : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    <Icon size={15} style={{ color: isActive ? color : "rgba(255,255,255,0.3)" }} />
                  </div>
                  <span className="text-[12px] font-bold hidden lg:inline">{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content panel */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl p-6"
              style={{ background: "rgba(13,18,33,0.80)", border: "1px solid rgba(255,255,255,0.04)" }}
            >
              {/* ── Identitas Sekolah ── */}
              {activeTab === "sekolah" && (
                <SectionBlock title="Identitas Sekolah" desc="Informasi dasar yang digunakan di seluruh dokumen dan laporan">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <AuroraInput label="Nama Sekolah" value={form.nama_sekolah} onChange={(e) => updateForm({ nama_sekolah: e.target.value })} />
                    </div>
                    <AuroraInput label="NPSN" value={form.npsn ?? ""} onChange={(e) => updateForm({ npsn: e.target.value })} style={{ fontFamily: "JetBrains Mono, monospace" }} />
                    <AuroraInput label="Tahun Ajaran" value={form.tahun_ajaran ?? ""} onChange={(e) => updateForm({ tahun_ajaran: e.target.value })} placeholder="2025/2026" />
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">Alamat Sekolah</label>
                      <textarea
                        rows={2} value={form.alamat_sekolah ?? ""}
                        onChange={(e) => updateForm({ alamat_sekolah: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all focus:border-violet-500/45 focus:bg-violet-500/[0.06] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.12)]"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.85)" }}
                      />
                    </div>
                  </div>
                </SectionBlock>
              )}

              {/* ── Kepala Sekolah ── */}
              {activeTab === "kepsek" && (
                <SectionBlock title="Kepala Sekolah" desc="Nama dan NIP kepala sekolah yang tampil di dokumen resmi">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AuroraInput label="Nama Kepala Sekolah" value={form.nama_kepsek} onChange={(e) => updateForm({ nama_kepsek: e.target.value })} placeholder="Drs. Nama Kepsek, M.Pd." />
                    <AuroraInput label="NIP Kepala Sekolah" value={form.nip_kepsek} onChange={(e) => updateForm({ nip_kepsek: e.target.value })} style={{ fontFamily: "JetBrains Mono, monospace" }} placeholder="196001011980121001" />
                  </div>
                </SectionBlock>
              )}

              {/* ── Aset & Koneksi ── */}
              {activeTab === "aset" && (
                <SectionBlock title="Aset & Koneksi" desc="Logo, kop surat, tanda tangan, dan integrasi Google Apps Script">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {([
                      { field: "logo_url" as const, label: "Logo Sekolah" },
                      { field: "kop_surat_url" as const, label: "Kop Surat" },
                      { field: "ttd_url" as const, label: "TTD Kepsek" },
                      { field: "stempel_url" as const, label: "Stempel" },
                    ]).map(({ field, label }) => (
                      <AssetCard
                        key={field} label={label}
                        url={(form[field] as string) ?? ""}
                        uploading={uploading === field}
                        onUpload={(e) => handleLogoUpload(e, field)}
                        onUrlChange={(v) => updateForm({ [field]: v })}
                      />
                    ))}
                  </div>

                  {/* GAS URL */}
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center gap-2">
                      <ExternalLink size={13} className="text-amber-400/60" />
                      <span className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">Google Apps Script</span>
                    </div>
                    <AuroraInput
                      label="" type="url" value={form.gas_web_app_url ?? ""}
                      onChange={(e) => updateForm({ gas_web_app_url: e.target.value })}
                      placeholder="https://script.google.com/macros/s/..."
                      style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "12px" }}
                    />
                    <p className="text-[10px] text-white/25">Digunakan untuk upload foto siswa ke Google Drive sekolah</p>
                  </div>
                </SectionBlock>
              )}

              {/* ── Koordinat ── */}
              {activeTab === "lokasi" && (
                <SectionBlock title="Koordinat Sekolah" desc="Titik lokasi untuk peta zonasi dan SPMB">
                  <div className="grid grid-cols-2 gap-4">
                    <AuroraInput label="Latitude" value={form.lat_sekolah ?? ""} onChange={(e) => updateForm({ lat_sekolah: e.target.value })} style={{ fontFamily: "JetBrains Mono, monospace" }} placeholder="-6.8847" />
                    <AuroraInput label="Longitude" value={form.lng_sekolah ?? ""} onChange={(e) => updateForm({ lng_sekolah: e.target.value })} style={{ fontFamily: "JetBrains Mono, monospace" }} placeholder="106.7810" />
                  </div>
                  {form.lat_sekolah && form.lng_sekolah && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-white/10" style={{ height: 180 }}>
                      <iframe
                        src={`https://www.google.com/maps?q=${form.lat_sekolah},${form.lng_sekolah}&z=15&output=embed`}
                        className="w-full h-full border-0 opacity-70 grayscale"
                        loading="lazy" title="Lokasi Sekolah"
                      />
                    </div>
                  )}
                </SectionBlock>
              )}

              {/* ── Admin ── */}
              {activeTab === "admin" && (
                <SectionBlock title="Akses & Administrator" desc="Kelola email yang memiliki akses admin ke aplikasi">
                  <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)" }}>
                    <AlertCircle size={15} className="text-violet-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-violet-300/70 leading-relaxed">
                      Email administrator diatur via environment variable <code className="text-violet-400 bg-violet-400/10 px-1.5 py-0.5 rounded text-[10px]">NEXT_PUBLIC_ADMIN_EMAILS</code>. Perubahan memerlukan restart aplikasi.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Administrator Aktif ({adminEmails.length})</p>
                    {adminEmails.length === 0 ? (
                      <p className="text-sm text-white/25 italic py-4 text-center">Belum ada email admin dikonfigurasi.</p>
                    ) : (
                      <div className="space-y-2">
                        {adminEmails.map((email) => (
                          <div key={email} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center text-xs font-bold text-violet-400 border border-violet-500/20">{email[0].toUpperCase()}</div>
                              <span className="text-sm text-white/70 font-mono">{email}</span>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/15">Aktif</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Tambah Email Admin</p>
                    <div className="flex gap-2">
                      <input
                        type="email" value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newAdminEmail.includes("@")) {
                            setAdminEmails((prev) => [...new Set([...prev, newAdminEmail.trim()])]);
                            setNewAdminEmail("");
                          }
                        }}
                        placeholder="email@sekolah.sch.id"
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/40"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      />
                      <button
                        onClick={() => {
                          if (newAdminEmail.includes("@")) {
                            setAdminEmails((prev) => [...new Set([...prev, newAdminEmail.trim()])]);
                            setNewAdminEmail("");
                          }
                        }}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-1.5 transition-all hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}
                      >
                        <Plus size={14} /> Tambah
                      </button>
                    </div>
                    <p className="text-[10px] text-white/25">⚠️ Perubahan ini hanya ditampilkan di UI. Update <code className="text-white/40">NEXT_PUBLIC_ADMIN_EMAILS</code> di .env untuk mengaktifkan.</p>
                  </div>
                </SectionBlock>
              )}

              {/* ── Tampilan ── */}
              {activeTab === "tampilan" && (
                <SectionBlock title="Tampilan" desc="Sesuaikan tampilan portal sesuai preferensi Anda">
                  <AccentColorPicker />
                  <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-[10px] text-white/30">💡 Warna aksen akan diterapkan ke tombol, ikon aktif, dan elemen interaktif di seluruh portal. Preferensi disimpan di browser Anda.</p>
                  </div>
                </SectionBlock>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </PageShell>
  );
}
